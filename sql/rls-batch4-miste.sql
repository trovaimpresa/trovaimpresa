-- ============================================================
-- TrovaImpresa — SICUREZZA RLS — BATCH 4 — TABELLE MISTE
-- candidature, lista_attesa_pubblicita, lavori_foto
--
-- Promemoria: le functions Netlify usano service_role e IGNORANO l'RLS.
-- Eseguire nell'SQL Editor di Supabase.
-- ============================================================


-- ------------------------------------------------------------
-- 1) candidature — DOPPIO proprietario
--    candidato_id -> candidati_lavoro (chi si candida)
--    impresa_id   -> imprese          (chi riceve la candidatura)
--    LETTURA: la vede il candidato (le sue) e l'impresa (quelle ricevute).
--    INSERT : solo il candidato, sulle proprie.
--    UPDATE : solo l'impresa (risponde, cambia stato, note_impresa).
--    DELETE : solo il candidato (ritira la candidatura).
-- ------------------------------------------------------------
alter table public.candidature enable row level security;

drop policy if exists "candidature_select_owner" on public.candidature;
create policy "candidature_select_owner" on public.candidature
  for select to authenticated
  using (
    candidato_id in (select id from public.candidati_lavoro where user_id = auth.uid())
    or impresa_id in (select id from public.imprese where user_id = auth.uid())
  );

drop policy if exists "candidature_insert_candidato" on public.candidature;
create policy "candidature_insert_candidato" on public.candidature
  for insert to authenticated
  with check (candidato_id in (select id from public.candidati_lavoro where user_id = auth.uid()));

drop policy if exists "candidature_update_impresa" on public.candidature;
create policy "candidature_update_impresa" on public.candidature
  for update to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()))
  with check (impresa_id in (select id from public.imprese where user_id = auth.uid()));

drop policy if exists "candidature_delete_candidato" on public.candidature;
create policy "candidature_delete_candidato" on public.candidature
  for delete to authenticated
  using (candidato_id in (select id from public.candidati_lavoro where user_id = auth.uid()));


-- ------------------------------------------------------------
-- 2) lista_attesa_pubblicita — proprietario via impresa_id
--    Inserita solo da pagine loggate (pubblicita.html + pannelli).
--    Nessuna lettura pubblica; la legge la funzione server (service_role).
--    Niente policy pubblica: ognuno vede/crea solo le proprie richieste.
-- ------------------------------------------------------------
alter table public.lista_attesa_pubblicita enable row level security;

drop policy if exists "lista_attesa_select_owner" on public.lista_attesa_pubblicita;
create policy "lista_attesa_select_owner" on public.lista_attesa_pubblicita
  for select to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()));

drop policy if exists "lista_attesa_insert_owner" on public.lista_attesa_pubblicita;
create policy "lista_attesa_insert_owner" on public.lista_attesa_pubblicita
  for insert to authenticated
  with check (impresa_id in (select id from public.imprese where user_id = auth.uid()));


-- ------------------------------------------------------------
-- 3) lavori_foto — proprietario via owner_id (= auth.uid())
--    LETTURA: le foto PUBBLICHE (pubblico = true) le vede chiunque;
--             le PRIVATE solo il proprietario.
--    SCRITTURA (insert/update/delete): solo il proprietario.
-- ------------------------------------------------------------
alter table public.lavori_foto enable row level security;

drop policy if exists "lavori_foto_select_pubbliche_o_proprie" on public.lavori_foto;
create policy "lavori_foto_select_pubbliche_o_proprie" on public.lavori_foto
  for select to anon, authenticated
  using (pubblico = true or owner_id = auth.uid());

drop policy if exists "lavori_foto_write_owner" on public.lavori_foto;
create policy "lavori_foto_write_owner" on public.lavori_foto
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());


-- ============================================================
-- TEST DOPO L'ESECUZIONE
--
-- candidature:
--   1) Da candidato loggato: candidati a un'offerta -> insert ok.
--   2) Da candidato: vedi le TUE candidature; non quelle altrui.
--
-- lista_attesa_pubblicita:
--   3) Da impresa loggata su pubblicita.html: iscrizione alla lista
--      d'attesa -> insert ok. Verifica che la funzione notifica-spazio
--      (service_role) continui a leggere/notificare.
--
-- lavori_foto:
--   4) Da NON loggato apri profilo-impresa: si vedono SOLO le foto con
--      pubblico = true.
--   5) Da proprietario loggato: vedi anche le tue foto private; aggiungi,
--      rendi pubblica/privata, elimina -> ok. Le foto di un altro: invisibili.
--
-- ASSUNZIONI (verificare se qualcosa non torna):
--   - candidati_lavoro ha la colonna user_id collegata a Supabase Auth.
--   - le iscrizioni alla lista d'attesa avvengono sempre da utente loggato
--     (se esistesse un form anonimo, l'insert andrebbe in errore: avvisami).
-- ============================================================
