/* ============================================================================
   L'OPERAIO TOCCA SOLO I LAVORI SUOI, E DI QUELLI SOLO LO STATO — 5 set 2026
   ============================================================================
   ⛔ COME E' SALTATO FUORI. Il →5← settembre e' stato creato il primo operaio
   VERO (un secondo account, non il titolare travestito) e gli sono state fatte
   →13← domande al database vero. Tre risposte erano sbagliate:
     · poteva segnare FATTO un lavoro che non era suo
     · poteva cambiare il PREZZO di un lavoro del capo (→99.999 €←)
     · poteva riscriverne la descrizione
   La colpa era di `lavori_update`: chiedeva solo il permesso «lavori», non che
   il lavoro fosse assegnato a lui, e non limitava le colonne.
   ⚠️ La pagina dell'operaio non lo permetteva gia' prima — ma la pagina non e'
   un lucchetto: chi chiama il database da fuori la salta.

   Deciso da Alessio il 5 settembre: «solo i lavori suoi, e solo lo stato».

   ⚠️ DUE ECCEZIONI VOLUTE, se no si rompe quello che funziona:
     · ruolo `preposto` e `segretaria` continuano a vedere e toccare tutto il
       cantiere (il capo squadra scrive le ore di tutti: e' il suo mestiere);
     · chi ha il permesso «Fatture» continua a LEGGERE i lavori, perche' la
       schermata Fatture li elenca tutti (gestionale-operatore.html, riga ~822).

   Si puo' rilanciare senza fare danni.
   ============================================================================ */

/* --- chi sono io dentro l'impresa dove lavoro ----------------------------- */
create or replace function public.gest_mio_ruolo(_impresa uuid)
returns text language sql stable security definer set search_path to 'public','pg_catalog' as $$
  select m.ruolo from public.gest_membri m
   where m.impresa_id = _impresa and m.membro_id = auth.uid() and m.stato = 'attivo'
   limit 1
$$;

create or replace function public.gest_mio_operatore(_impresa uuid)
returns uuid language sql stable security definer set search_path to 'public','pg_catalog' as $$
  select m.operatore_id from public.gest_membri m
   where m.impresa_id = _impresa and m.membro_id = auth.uid() and m.stato = 'attivo'
   limit 1
$$;

/* --- LAVORI: vede e tocca solo i suoi ------------------------------------- */
drop policy if exists lavori_read on public.gest_lavori;
create policy lavori_read on public.gest_lavori
for select using (
  gest_puo_sezione(user_id,'fatture')
  or ( gest_puo_sezione(user_id,'lavori')
       and ( coalesce(gest_mio_ruolo(user_id),'') in ('preposto','segretaria')
             or operatore_id = gest_mio_operatore(user_id) ) )
);

drop policy if exists lavori_update on public.gest_lavori;
create policy lavori_update on public.gest_lavori
for update using (
  gest_puo_sezione(user_id,'lavori')
  and ( coalesce(gest_mio_ruolo(user_id),'') in ('preposto','segretaria')
        or operatore_id = gest_mio_operatore(user_id) )
) with check (
  gest_puo_sezione(user_id,'lavori')
  and ( coalesce(gest_mio_ruolo(user_id),'') in ('preposto','segretaria')
        or operatore_id = gest_mio_operatore(user_id) )
);

/* --- e di quel lavoro puo' cambiare SOLO tre cose ------------------------- */
/* ⛔ SCRITTO AL CONTRARIO, ED E' IL PUNTO. Non si elencano le colonne da
   proteggere: si riparte dalla riga VECCHIA e ci si rimettono dentro solo le
   tre consentite. Cosi' una colonna aggiunta domani ai lavori e' protetta da
   sola, senza che nessuno debba ricordarselo. Elencare le colonne da bloccare
   e' la strada che si dimentica sempre di una. */
create or replace function public.gest_lavori_limiti_operaio()
returns trigger language plpgsql security definer
set search_path to 'public','auth','pg_catalog' as $$
declare
  v_ruolo text; v_role text; j jsonb; k text;
  consentite text[] := array['stato','data_fatto','lavoro_svolto'];
begin
  v_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    'postgres');
  /* il server e l'SQL Editor passano sempre, come fa gia' gest_blocco_piano */
  if v_role in ('service_role','postgres','supabase_admin') then return new; end if;
  /* il titolare a casa sua fa quello che vuole */
  if auth.uid() is null or auth.uid() = old.user_id then return new; end if;
  v_ruolo := public.gest_mio_ruolo(old.user_id);
  if v_ruolo is null or v_ruolo in ('preposto','segretaria') then return new; end if;
  j := to_jsonb(old);
  foreach k in array consentite loop
    j := jsonb_set(j, array[k], coalesce(to_jsonb(new) -> k, 'null'::jsonb));
  end loop;
  new := jsonb_populate_record(new, j);
  return new;
end $$;

drop trigger if exists gest_lavori_limiti_operaio on public.gest_lavori;
create trigger gest_lavori_limiti_operaio
before update on public.gest_lavori
for each row execute function public.gest_lavori_limiti_operaio();

/* --- MEZZI: un operaio non ha niente da farci ----------------------------- */
/* La sua pagina non li legge nemmeno (controllato: `gest_mezzi` non compare in
   gestionale-operatore.html). Restano a preposto e segretaria. */
drop policy if exists gest_mezzi_team_read on public.gest_mezzi;
create policy gest_mezzi_team_read on public.gest_mezzi
for select using (
  gest_puo_sezione(user_id,'lavori')
  and coalesce(gest_mio_ruolo(user_id),'') in ('preposto','segretaria')
);

/* --- REPARTI: l'operaio vede solo quello dove lavora ---------------------- */
drop policy if exists mestieri_read on public.gest_mestieri;
create policy mestieri_read on public.gest_mestieri
for select using (
  gest_puo_accedere(user_id)
  and ( coalesce(gest_mio_ruolo(user_id),'') <> 'operaio'
        or exists ( select 1 from public.gest_operatori o
                     where o.id = gest_mio_operatore(gest_mestieri.user_id)
                       and (o.mestiere_id is null or o.mestiere_id = gest_mestieri.id) ) )
);

/* --- controllo a occhio -------------------------------------------------- */
select policyname, cmd from pg_policies
 where schemaname='public' and tablename in ('gest_lavori','gest_mezzi','gest_mestieri')
 order by tablename, cmd, policyname;
