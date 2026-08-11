-- =====================================================================
-- TrovaImpresa — LE SPUNTE DEI PERMESSI ADESSO CONTANO DAVVERO
-- Da salvare come  sql/gest-permessi-collaboratori.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 11 agosto 2026
--
-- IL PROBLEMA
-- Nella scheda di un collaboratore ci sono le spunte: lavori, clienti,
-- fatture, pagamenti, foto, note, calendario. Nella app del dipendente quelle
-- spunte fanno una cosa sola: NASCONDONO I PULSANTI DEL MENU.
-- I dati restano leggibili, perche' le regole del database non guardano le
-- spunte. La funzione gest_puo_accedere dice soltanto:
--     sei il titolare, oppure sei un collaboratore attivo -> leggi.
--
-- Provato su un PostgreSQL vero, con queste stesse regole copiate da Supabase:
-- un collaboratore con spuntato SOLO "Lavori" leggeva
--   - l'elenco completo dei clienti: nome, indirizzo, telefono, email, P.IVA
--   - tutte le fatture con gli importi, riga per riga
-- Sono dati dei clienti dell'impresa: e' un problema di privacy, non solo di
-- ordine.
--
-- COSA CAMBIA
-- Una funzione nuova, gest_puo_sezione(impresa, sezione), che guarda davvero
-- la spunta. Le regole di lettura dei collaboratori passano da
-- "sei attivo" a "sei attivo E hai quella spunta".
--
-- COSA NON CAMBIA
-- - Il TITOLARE non e' toccato: continua a vedere e fare tutto.
-- - Chi non e' collaboratore continua a non vedere niente.
-- - Le spunte gia' salvate restano quelle: non si riazzera niente.
-- - Se la casella non e' mai stata toccata vale il valore di partenza
--   ('{"foto":true,"note":false,"lavori":true,"clienti":false,
--     "fatture":false,"pagamenti":false,"calendario":true}').
--
-- ⚠️ EFFETTO IMMEDIATO SUI COLLABORATORI GIA' ATTIVI
-- Dal momento del Run, un collaboratore che non ha la spunta "clienti" smette
-- di vedere i clienti, e cosi' per le altre sezioni. Se qualcuno usa una
-- sezione che non ha spuntata, dopo questo file gli sparisce: la spunta gliela
-- rimetti dalla scheda in Squadra. E' il comportamento giusto, ma e' meglio
-- saperlo prima che dopo.
--
-- SI TORNA INDIETRO
-- In fondo al file c'e' il blocco per rimettere tutto com'era prima.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. La funzione che guarda la spunta
-- ---------------------------------------------------------------------
create or replace function public.gest_puo_sezione(_impresa uuid, _sezione text)
returns boolean
language sql stable security definer
set search_path = public, pg_catalog
as $$
  select _impresa = auth.uid()      -- il titolare passa sempre
      or exists (
           select 1 from gest_membri m
            where m.impresa_id = _impresa
              and m.membro_id  = auth.uid()
              and m.stato      = 'attivo'
              /* niente conversione a si/no: se in quella casella finisse un
                 testo storto (per esempio "forse"), la conversione andrebbe in
                 ERRORE e la lettura si romperebbe invece di rispondere "no".
                 Trovato provandolo. Qui si confronta e basta: tutto quello che
                 non e' un si secco vale no. */
              and coalesce(m.permessi -> _sezione, 'false'::jsonb)
                    in ('true'::jsonb, '"true"'::jsonb)
         );
$$;

comment on function public.gest_puo_sezione(uuid, text) is
  'Vero se sei il titolare, oppure un collaboratore attivo con quella spunta accesa nella scheda Squadra.';

grant execute on function public.gest_puo_sezione(uuid, text) to authenticated;


-- ---------------------------------------------------------------------
-- 2. CLIENTI — spunta "clienti"
-- ---------------------------------------------------------------------
drop policy if exists "clienti_read" on public.gest_clienti;
create policy "clienti_read" on public.gest_clienti
  for select using (gest_puo_sezione(user_id, 'clienti'));


-- ---------------------------------------------------------------------
-- 3. FATTURE — spunta "fatture". Anche le righe e il collegamento ai
--    lavori: senza, gli importi si leggerebbero lo stesso dalla porta
--    di servizio.
-- ---------------------------------------------------------------------
drop policy if exists "gest_fatture_team_read" on public.gest_fatture;
create policy "gest_fatture_team_read" on public.gest_fatture
  for select using (gest_puo_sezione(user_id, 'fatture'));

drop policy if exists "gest_fattura_righe_team_read" on public.gest_fattura_righe;
create policy "gest_fattura_righe_team_read" on public.gest_fattura_righe
  for select using (gest_puo_sezione(user_id, 'fatture'));

drop policy if exists "gest_fattura_lavori_team_read" on public.gest_fattura_lavori;
create policy "gest_fattura_lavori_team_read" on public.gest_fattura_lavori
  for select using (gest_puo_sezione(user_id, 'fatture'));


-- ---------------------------------------------------------------------
-- 4. LAVORI — spunta "lavori"
-- ---------------------------------------------------------------------
drop policy if exists "lavori_read" on public.gest_lavori;
create policy "lavori_read" on public.gest_lavori
  for select using (gest_puo_sezione(user_id, 'lavori'));

drop policy if exists "lavori_update" on public.gest_lavori;
create policy "lavori_update" on public.gest_lavori
  for update using (gest_puo_sezione(user_id, 'lavori'))
          with check (gest_puo_sezione(user_id, 'lavori'));

drop policy if exists "gest_lavoro_mezzi_team_read" on public.gest_lavoro_mezzi;
create policy "gest_lavoro_mezzi_team_read" on public.gest_lavoro_mezzi
  for select using (gest_puo_sezione(user_id, 'lavori'));


-- ---------------------------------------------------------------------
-- 5. CALENDARIO E SCADENZE — spunta "calendario"
-- ---------------------------------------------------------------------
drop policy if exists "scadenze_team_read" on public.gest_scadenze;
create policy "scadenze_team_read" on public.gest_scadenze
  for select using (gest_puo_sezione(user_id, 'calendario'));


-- ---------------------------------------------------------------------
-- 6. NOTE DEL CALENDARIO — spunta "note"
--    Su gest_note ci sono due regole di lettura sovrapposte, arrivate in
--    momenti diversi: si sistemano tutte e due, se no la piu' larga vince.
-- ---------------------------------------------------------------------
drop policy if exists "note_read" on public.gest_note;
create policy "note_read" on public.gest_note
  for select using (gest_puo_sezione(user_id, 'note'));

drop policy if exists "gest_note_team_read" on public.gest_note;
create policy "gest_note_team_read" on public.gest_note
  for select using (gest_puo_sezione(user_id, 'note'));


-- ---------------------------------------------------------------------
-- 7. FOTO E VIDEO — spunta "foto"
-- ---------------------------------------------------------------------
drop policy if exists "foto_read" on public.gest_foto;
create policy "foto_read" on public.gest_foto
  for select using (gest_puo_sezione(user_id, 'foto'));

drop policy if exists "foto_insert" on public.gest_foto;
create policy "foto_insert" on public.gest_foto
  for insert with check (gest_puo_sezione(user_id, 'foto'));

drop policy if exists "video_read" on public.gest_video;
create policy "video_read" on public.gest_video
  for select using (gest_puo_sezione(user_id, 'foto'));

drop policy if exists "video_insert" on public.gest_video;
create policy "video_insert" on public.gest_video
  for insert with check (gest_puo_sezione(user_id, 'foto'));


-- ---------------------------------------------------------------------
-- 8. CARTE PREPAGATE — qui NON si usa una spunta, si usa la carta.
--    Prima un collaboratore leggeva i movimenti di TUTTE le carte, comprese
--    quelle degli altri dipendenti. Adesso vede solo la propria, che e' quella
--    che gli serve per sapere quanto ha ancora da spendere. E' lo stesso
--    criterio che la regola di scrittura usava gia'.
-- ---------------------------------------------------------------------
drop policy if exists "gest_carte_team_read" on public.gest_carte;
create policy "gest_carte_team_read" on public.gest_carte
  for select using (exists (
    select 1 from gest_membri m
     where m.membro_id = auth.uid()
       and m.impresa_id = gest_carte.user_id
       and m.stato = 'attivo'
       and gest_carte.dipendente_id = m.operatore_id));

drop policy if exists "gest_carte_movimenti_team_read" on public.gest_carte_movimenti;
create policy "gest_carte_movimenti_team_read" on public.gest_carte_movimenti
  for select using (exists (
    select 1 from gest_membri m
      join gest_carte c on c.id = gest_carte_movimenti.carta_id
     where m.membro_id = auth.uid()
       and m.impresa_id = gest_carte_movimenti.user_id
       and m.stato = 'attivo'
       and c.dipendente_id = m.operatore_id));


-- ---------------------------------------------------------------------
-- 9. MEZZI E RIFORNIMENTI — spunta "lavori"
--    Chi va in cantiere deve poter vedere i mezzi e registrare i pieni.
-- ---------------------------------------------------------------------
drop policy if exists "gest_mezzi_team_read" on public.gest_mezzi;
create policy "gest_mezzi_team_read" on public.gest_mezzi
  for select using (gest_puo_sezione(user_id, 'lavori'));

drop policy if exists "gest_rifornimenti_team_read" on public.gest_rifornimenti;
create policy "gest_rifornimenti_team_read" on public.gest_rifornimenti
  for select using (gest_puo_sezione(user_id, 'lavori'));


-- ---------------------------------------------------------------------
-- NON SI TOCCANO, di proposito:
--   gest_mestieri  -> senza i nomi dei reparti la app del dipendente non si
--                     apre proprio. Sono solo nomi e colori.
--   gest_operatori -> serve per far vedere i nomi della squadra. ATTENZIONE:
--                     dentro ci sono telefono, codice fiscale e COSTO ORARIO
--                     di tutti. Non c'e' una spunta per questo, e andrebbe
--                     guardato in una tornata dedicata.
-- ---------------------------------------------------------------------


-- =====================================================================
-- COME SI TORNA INDIETRO
-- Se dopo questo file un collaboratore non riesce piu' a lavorare e serve
-- rimettere le cose com'erano subito, incolla SOLO il blocco qui sotto,
-- togliendo i due trattini davanti a ogni riga.
-- =====================================================================
-- drop policy if exists "clienti_read" on public.gest_clienti;
-- create policy "clienti_read" on public.gest_clienti for select using (gest_puo_accedere(user_id));
-- drop policy if exists "gest_fatture_team_read" on public.gest_fatture;
-- create policy "gest_fatture_team_read" on public.gest_fatture for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_fatture.user_id and m.stato='attivo'));
-- drop policy if exists "gest_fattura_righe_team_read" on public.gest_fattura_righe;
-- create policy "gest_fattura_righe_team_read" on public.gest_fattura_righe for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_fattura_righe.user_id and m.stato='attivo'));
-- drop policy if exists "gest_fattura_lavori_team_read" on public.gest_fattura_lavori;
-- create policy "gest_fattura_lavori_team_read" on public.gest_fattura_lavori for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_fattura_lavori.user_id and m.stato='attivo'));
-- drop policy if exists "lavori_read" on public.gest_lavori;
-- create policy "lavori_read" on public.gest_lavori for select using (gest_puo_accedere(user_id));
-- drop policy if exists "lavori_update" on public.gest_lavori;
-- create policy "lavori_update" on public.gest_lavori for update using (gest_puo_accedere(user_id)) with check (gest_puo_accedere(user_id));
-- drop policy if exists "gest_lavoro_mezzi_team_read" on public.gest_lavoro_mezzi;
-- create policy "gest_lavoro_mezzi_team_read" on public.gest_lavoro_mezzi for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_lavoro_mezzi.user_id and m.stato='attivo'));
-- drop policy if exists "scadenze_team_read" on public.gest_scadenze;
-- create policy "scadenze_team_read" on public.gest_scadenze for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_scadenze.user_id and m.stato='attivo'));
-- drop policy if exists "note_read" on public.gest_note;
-- create policy "note_read" on public.gest_note for select using (gest_puo_accedere(user_id));
-- drop policy if exists "gest_note_team_read" on public.gest_note;
-- create policy "gest_note_team_read" on public.gest_note for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_note.user_id and m.stato='attivo'));
-- drop policy if exists "foto_read" on public.gest_foto;
-- create policy "foto_read" on public.gest_foto for select using (gest_puo_accedere(user_id));
-- drop policy if exists "foto_insert" on public.gest_foto;
-- create policy "foto_insert" on public.gest_foto for insert with check (gest_puo_accedere(user_id));
-- drop policy if exists "video_read" on public.gest_video;
-- create policy "video_read" on public.gest_video for select using (gest_puo_accedere(user_id));
-- drop policy if exists "video_insert" on public.gest_video;
-- create policy "video_insert" on public.gest_video for insert with check (gest_puo_accedere(user_id));
-- drop policy if exists "gest_carte_team_read" on public.gest_carte;
-- create policy "gest_carte_team_read" on public.gest_carte for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_carte.user_id and m.stato='attivo'));
-- drop policy if exists "gest_carte_movimenti_team_read" on public.gest_carte_movimenti;
-- create policy "gest_carte_movimenti_team_read" on public.gest_carte_movimenti for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_carte_movimenti.user_id and m.stato='attivo'));
-- drop policy if exists "gest_mezzi_team_read" on public.gest_mezzi;
-- create policy "gest_mezzi_team_read" on public.gest_mezzi for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_mezzi.user_id and m.stato='attivo'));
-- drop policy if exists "gest_rifornimenti_team_read" on public.gest_rifornimenti;
-- create policy "gest_rifornimenti_team_read" on public.gest_rifornimenti for select using (exists (
--   select 1 from gest_membri m where m.membro_id=auth.uid() and m.impresa_id=gest_rifornimenti.user_id and m.stato='attivo'));
