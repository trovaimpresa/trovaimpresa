-- ============================================================
-- TrovaImpresa — SICUREZZA RLS — BATCH 3 — TABELLE PUBBLICHE
-- Tabelle che il sito mostra a tutti ma che solo il proprietario modifica.
--
-- Regola generale: "tutti leggono, solo il proprietario scrive".
-- Eccezione: subappalti = post anonimo (vedi nota nel blocco 4).
--
-- Promemoria: le functions Netlify usano service_role e IGNORANO l'RLS,
-- quindi webhook Stripe e invii email continuano a funzionare.
--
-- Eseguire nell'SQL Editor di Supabase.
-- ============================================================


-- ------------------------------------------------------------
-- 1) video_lavori — proprietario via impresa_id (-> imprese.user_id)
--    Scritto dal pannello (impresa loggata). Letto in galleria/profilo.
-- ------------------------------------------------------------
alter table public.video_lavori enable row level security;

drop policy if exists "video_select_public" on public.video_lavori;
create policy "video_select_public" on public.video_lavori
  for select to anon, authenticated
  using (true);

drop policy if exists "video_write_owner" on public.video_lavori;
create policy "video_write_owner" on public.video_lavori
  for all to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()))
  with check (impresa_id in (select id from public.imprese where user_id = auth.uid()));


-- ------------------------------------------------------------
-- 2) annunci_pubblicitari — proprietario via impresa_id
--    Creato dal pannello pubblicita.html (impresa loggata, stato 'pending').
--    Lo stato viene poi aggiornato dal webhook Stripe (service_role).
--    Letto dalle pagine pubbliche per mostrare i banner.
-- ------------------------------------------------------------
alter table public.annunci_pubblicitari enable row level security;

drop policy if exists "annunci_select_public" on public.annunci_pubblicitari;
create policy "annunci_select_public" on public.annunci_pubblicitari
  for select to anon, authenticated
  using (true);

drop policy if exists "annunci_write_owner" on public.annunci_pubblicitari;
create policy "annunci_write_owner" on public.annunci_pubblicitari
  for all to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()))
  with check (impresa_id in (select id from public.imprese where user_id = auth.uid()));


-- ------------------------------------------------------------
-- 3) vetrina_negozio — proprietario via negozio_id (= auth.uid())
--    Scritto/letto dal pannello negozio. Letto anche dalla vetrina pubblica.
-- ------------------------------------------------------------
alter table public.vetrina_negozio enable row level security;

drop policy if exists "vetrina_select_public" on public.vetrina_negozio;
create policy "vetrina_select_public" on public.vetrina_negozio
  for select to anon, authenticated
  using (true);

drop policy if exists "vetrina_write_owner" on public.vetrina_negozio;
create policy "vetrina_write_owner" on public.vetrina_negozio
  for all to authenticated
  using (negozio_id = auth.uid())
  with check (negozio_id = auth.uid());


-- ------------------------------------------------------------
-- 4) subappalti — POST ANONIMO (caso speciale)
--    Il form subappalto-offre/cerca pubblica SENZA login e non imposta
--    user_id: non esiste un "proprietario". Quindi:
--      - lettura: tutti
--      - inserimento: tutti (anche non loggati)
--      - modifica/cancellazione: NESSUNA policy -> bloccate per i client,
--        restano possibili solo da admin tramite service_role.
-- ------------------------------------------------------------
alter table public.subappalti enable row level security;

drop policy if exists "subappalti_select_public" on public.subappalti;
create policy "subappalti_select_public" on public.subappalti
  for select to anon, authenticated
  using (true);

drop policy if exists "subappalti_insert_public" on public.subappalti;
create policy "subappalti_insert_public" on public.subappalti
  for insert to anon, authenticated
  with check (true);


-- ============================================================
-- TEST DOPO L'ESECUZIONE
--
-- 1) Da NON loggato: galleria video, vetrina negozio, banner pubblicitari
--    e lista subappalti devono comparire come prima.
-- 2) Pubblica un subappalto da non loggato: deve funzionare.
-- 3) Da impresa loggata: aggiungi/elimina un video -> ok.
-- 4) Da negozio loggato: aggiungi un prodotto in vetrina -> ok;
--    prova a toccare la vetrina di un altro negozio -> deve fallire.
-- 5) Acquista uno spazio pubblicitario di prova: l'insert 'pending' deve
--    funzionare e il webhook Stripe deve aggiornare lo stato.
--
-- NOTA su subappalti: chiunque puo' ancora inserire post (com'e' oggi).
-- Se in futuro vuoi moderare o evitare spam, conviene far passare la
-- pubblicazione da una Netlify function. Dimmelo e la prepariamo.
-- ============================================================
