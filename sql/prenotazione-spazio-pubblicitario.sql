-- ============================================================================
-- 9 SETTEMBRE 2026 — DUE IMPRESE NON POSSONO PIU' COMPRARE LO STESSO SPAZIO
--
-- Il problema: due imprese sceglievano lo stesso spazio nello stesso momento,
-- il browser scriveva DUE righe 'pending' (il vincolo di sovrapposizione
-- guarda solo le righe 'pagato'), tutte e due arrivavano a Stripe, tutte e
-- due pagavano. La prima diventava 'pagato'; sulla seconda il database
-- rifiutava l'update e il webhook rispondeva 500 — soldi presi, nessuna
-- pubblicita', e nessuno lo sapeva.
--
-- La cura e' a due strati:
--   1) prenota_spazio_pubblicitario  = la serratura. Una impresa per volta su
--      ogni spazio+citta'. Lo spazio resta impegnato 30 minuti, poi si libera
--      da solo. Chi arriva secondo NON arriva nemmeno a Stripe.
--   2) conferma_annuncio_pagato      = la rete. Al pagamento decide il
--      database: o 'pagato', o 'rimborsato' (e il webhook restituisce i soldi).
--
-- ⚠️ Il permesso di INSERT diretto dal browser su annunci_pubblicitari e'
--    stato tolto: l'unica porta per creare un annuncio e' la funzione qui sotto.
-- ============================================================================

-- 1) nuovo stato 'rimborsato'
alter table public.annunci_pubblicitari drop constraint if exists annunci_pubblicitari_stato_check;
alter table public.annunci_pubblicitari add constraint annunci_pubblicitari_stato_check
  check (stato = any (array['pending','pagato','scaduto','annullato','rimborsato']));

-- 2) fino a quando la prenotazione tiene occupato lo spazio
alter table public.annunci_pubblicitari add column if not exists blocco_fino timestamptz;
comment on column public.annunci_pubblicitari.blocco_fino is
  'Prenotazione: lo spazio resta impegnato fino a questo momento (30 minuti). Passato, torna libero da solo.';
create index if not exists idx_annunci_blocco_fino on public.annunci_pubblicitari (blocco_fino)
  where stato = 'pending';

-- 3) LA PORTA UNICA per creare un annuncio
create or replace function public.prenota_spazio_pubblicitario(
  p_spazio_id   text,
  p_citta       text,
  p_impresa_id  bigint,
  p_logo_url    text,
  p_link_url    text,
  p_prezzo      numeric,
  p_data_inizio date,
  p_data_fine   date,
  p_mesi        smallint
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id  uuid;
  v_occ public.annunci_pubblicitari%rowtype;
begin
  if not exists (select 1 from public.imprese i where i.id = p_impresa_id and i.user_id = auth.uid()) then
    return jsonb_build_object('ok', false, 'motivo', 'non_autorizzato');
  end if;

  -- serratura: chi arriva secondo aspetta qui e poi trova lo spazio occupato
  perform pg_advisory_xact_lock(hashtext(lower(p_spazio_id) || '|' || lower(p_citta)));

  select * into v_occ
    from public.annunci_pubblicitari a
   where a.spazio_id = p_spazio_id
     and lower(a.citta) = lower(p_citta)
     and daterange(a.data_inizio, a.data_fine, '[]') && daterange(p_data_inizio, p_data_fine, '[]')
     and ( a.stato = 'pagato'
        or (a.stato = 'pending' and a.blocco_fino is not null and a.blocco_fino > now()) )
   order by case when a.stato = 'pagato' then 0 else 1 end
   limit 1;

  if found then
    return jsonb_build_object(
      'ok', false,
      'motivo', case when v_occ.stato = 'pagato' then 'venduto' else 'in_acquisto' end,
      'libero_dal', case when v_occ.stato = 'pagato' then to_char(v_occ.data_fine + 1, 'DD/MM/YYYY') else null end,
      'minuti', case when v_occ.stato = 'pending'
                     then greatest(1, ceil(extract(epoch from (v_occ.blocco_fino - now())) / 60))::int
                     else null end
    );
  end if;

  insert into public.annunci_pubblicitari
    (spazio_id, citta, impresa_id, logo_url, link_url, prezzo, data_inizio, data_fine, mesi, stato, blocco_fino)
  values
    (p_spazio_id, p_citta, p_impresa_id, p_logo_url, p_link_url, p_prezzo, p_data_inizio, p_data_fine, p_mesi,
     'pending', now() + interval '30 minutes')
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.prenota_spazio_pubblicitario(text,text,bigint,text,text,numeric,date,date,smallint) from public, anon;
grant execute on function public.prenota_spazio_pubblicitario(text,text,bigint,text,text,numeric,date,date,smallint) to authenticated;

-- 4) LA CONFERMA DEL PAGAMENTO (la chiama solo il webhook, con la chiave di servizio)
create or replace function public.conferma_annuncio_pagato(p_annuncio uuid, p_session text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a       public.annunci_pubblicitari%rowtype;
  v_altro public.annunci_pubblicitari%rowtype;
begin
  select * into a from public.annunci_pubblicitari where id = p_annuncio for update;
  if not found then return jsonb_build_object('esito','non_trovato'); end if;
  if a.stato = 'pagato' then return jsonb_build_object('esito','gia_pagato'); end if;
  if a.stato = 'rimborsato' then return jsonb_build_object('esito','occupato','gia_segnato',true,
      'impresa_id',a.impresa_id,'spazio_id',a.spazio_id,'citta',a.citta); end if;

  perform pg_advisory_xact_lock(hashtext(lower(a.spazio_id) || '|' || lower(a.citta)));

  select * into v_altro
    from public.annunci_pubblicitari b
   where b.id <> a.id
     and b.stato = 'pagato'
     and b.spazio_id = a.spazio_id
     and lower(b.citta) = lower(a.citta)
     and daterange(b.data_inizio, b.data_fine, '[]') && daterange(a.data_inizio, a.data_fine, '[]')
   limit 1;

  if found then
    update public.annunci_pubblicitari
       set stato = 'rimborsato',
           stripe_session_id = coalesce(p_session, stripe_session_id)
     where id = a.id;
    return jsonb_build_object('esito','occupato','impresa_id',a.impresa_id,
                              'spazio_id',a.spazio_id,'citta',a.citta,'prezzo',a.prezzo);
  end if;

  update public.annunci_pubblicitari
     set stato = 'pagato',
         stripe_session_id = coalesce(p_session, stripe_session_id),
         blocco_fino = null
   where id = a.id;
  return jsonb_build_object('esito','pagato','impresa_id',a.impresa_id,
                            'spazio_id',a.spazio_id,'citta',a.citta);
end;
$$;

revoke all on function public.conferma_annuncio_pagato(uuid,text) from public, anon, authenticated;

-- 5) LA PORTA VECCHIA E' CHIUSA — applicato il 9 set 2026, dopo il deploy del
--    pubblicita.html nuovo. Dal browser non si puo' piu' creare un annuncio a
--    mano: l'unica strada e' prenota_spazio_pubblicitario(). L'impresa continua
--    a vedere, modificare (locandina e link) e cancellare i suoi annunci.
drop policy if exists annunci_write_owner on public.annunci_pubblicitari;

create policy annunci_vedi_owner on public.annunci_pubblicitari
  for select to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()));

create policy annunci_modifica_owner on public.annunci_pubblicitari
  for update to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()))
  with check (impresa_id in (select id from public.imprese where user_id = auth.uid()));

create policy annunci_cancella_owner on public.annunci_pubblicitari
  for delete to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()));
