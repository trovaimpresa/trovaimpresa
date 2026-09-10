-- 10 settembre 2026 — LA PUBBLICITA' DIVENTA UN ABBONAMENTO
-- ---------------------------------------------------------------------------
-- Prima il cliente comprava un pezzo di tempo: 1, 3, 6 o 12 mesi. Alla fine
-- l'annuncio si spegneva e per continuare doveva ripagare a mano. Chi se lo
-- dimenticava spariva — e' successo davvero con l'annuncio di Roma, scaduto
-- il 23 agosto 2026 e mai rinnovato.
-- Adesso Stripe riaddebita da solo finche' il cliente non disdice.
-- GIA' APPLICATO in produzione il 10 set 2026.

alter table annunci_pubblicitari
  add column if not exists stripe_subscription_id text,
  add column if not exists rinnovo_auto boolean not null default false,
  add column if not exists disdetto_il timestamptz;

create unique index if not exists annunci_pubblicitari_subscription_uniq
  on annunci_pubblicitari (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- CHI HA L'ABBONAMENTO TIENE IL POSTO.
-- La sua data di fine si sposta avanti a ogni rinnovo: se un altro potesse
-- prenotare un periodo futuro, al rinnovo scoppierebbe un conflitto e uno
-- dei due resterebbe senza spazio dopo aver pagato.
create or replace function public.prenota_spazio_pubblicitario(
  p_spazio_id text, p_citta text, p_impresa_id bigint, p_logo_url text,
  p_link_url text, p_prezzo numeric, p_data_inizio date, p_data_fine date, p_mesi smallint)
returns jsonb
language plpgsql security definer set search_path to 'public', 'auth'
as $function$
declare
  v_id  uuid;
  v_occ public.annunci_pubblicitari%rowtype;
begin
  if not exists (select 1 from public.imprese i where i.id = p_impresa_id and i.user_id = auth.uid()) then
    return jsonb_build_object('ok', false, 'motivo', 'non_autorizzato');
  end if;

  perform pg_advisory_xact_lock(hashtext(lower(p_spazio_id) || '|' || lower(p_citta)));

  select * into v_occ
    from public.annunci_pubblicitari a
   where a.spazio_id = p_spazio_id
     and lower(a.citta) = lower(p_citta)
     and (
           (a.stato = 'pagato' and a.rinnovo_auto = true)
        or (a.stato = 'pagato'
            and daterange(a.data_inizio, a.data_fine, '[]') && daterange(p_data_inizio, p_data_fine, '[]'))
        or (a.stato = 'pending' and a.blocco_fino is not null and a.blocco_fino > now()
            and daterange(a.data_inizio, a.data_fine, '[]') && daterange(p_data_inizio, p_data_fine, '[]'))
     )
   order by case when a.stato = 'pagato' then 0 else 1 end
   limit 1;

  if found then
    return jsonb_build_object(
      'ok', false,
      'motivo', case when v_occ.stato = 'pagato' then 'venduto' else 'in_acquisto' end,
      'libero_dal', case when v_occ.stato = 'pagato' and v_occ.rinnovo_auto = false
                         then to_char(v_occ.data_fine + 1, 'DD/MM/YYYY') else null end,
      'abbonato', (v_occ.stato = 'pagato' and v_occ.rinnovo_auto = true),
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
$function$;

-- IL RINNOVO: la data la detta Stripe, cosi' sito e Stripe non raccontano
-- due storie diverse.
create or replace function public.rinnova_annuncio_abbonamento(
  p_subscription text, p_fine_periodo date)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare v_id uuid;
begin
  update public.annunci_pubblicitari
     set data_fine = p_fine_periodo
   where stripe_subscription_id = p_subscription and stato = 'pagato'
  returning id into v_id;
  if v_id is null then return jsonb_build_object('ok', false, 'motivo', 'non_trovato'); end if;
  return jsonb_build_object('ok', true, 'id', v_id);
exception when exclusion_violation then
  return jsonb_build_object('ok', false, 'motivo', 'conflitto');
end;
$function$;

-- LA DISDETTA: l'annuncio non si spegne subito, resta fino alla fine del
-- periodo gia' pagato. Regola del 7 settembre: chi ha pagato deve apparire.
create or replace function public.disdici_annuncio_abbonamento(p_subscription text)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare v_id uuid;
begin
  update public.annunci_pubblicitari
     set rinnovo_auto = false, disdetto_il = coalesce(disdetto_il, now())
   where stripe_subscription_id = p_subscription
  returning id into v_id;
  if v_id is null then return jsonb_build_object('ok', false, 'motivo', 'non_trovato'); end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$function$;

-- L'ACCENSIONE, quando il primo pagamento e' andato a buon fine.
create or replace function public.attiva_abbonamento_annuncio(
  p_annuncio uuid, p_subscription text, p_fine_periodo date)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare v_id uuid;
begin
  update public.annunci_pubblicitari
     set stripe_subscription_id = p_subscription, rinnovo_auto = true,
         disdetto_il = null, data_fine = greatest(data_fine, p_fine_periodo)
   where id = p_annuncio and stato = 'pagato'
  returning id into v_id;
  if v_id is null then return jsonb_build_object('ok', false, 'motivo', 'non_trovato'); end if;
  return jsonb_build_object('ok', true, 'id', v_id);
exception when exclusion_violation then
  return jsonb_build_object('ok', false, 'motivo', 'conflitto');
end;
$function$;

revoke all on function public.rinnova_annuncio_abbonamento(text, date) from public, anon, authenticated;
revoke all on function public.disdici_annuncio_abbonamento(text) from public, anon, authenticated;
revoke all on function public.attiva_abbonamento_annuncio(uuid, text, date) from public, anon, authenticated;
