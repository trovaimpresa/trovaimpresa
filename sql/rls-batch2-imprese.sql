-- ============================================================
-- TrovaImpresa — SICUREZZA RLS — BATCH 2 — SOLO TABELLA "imprese"
-- Obiettivo: "tutti possono leggere, solo il proprietario puo' scrivere".
--
-- NB: la colonna "password" e' stata ELIMINATA dalla tabella, quindi non
--     serve piu' alcun mascheramento di colonna. Restano solo le regole RLS.
--
-- Eseguire nell'SQL Editor di Supabase.
-- ============================================================


-- ------------------------------------------------------------
-- 1) Attiva RLS sulla tabella
-- ------------------------------------------------------------
alter table public.imprese enable row level security;


-- ------------------------------------------------------------
-- 2) LETTURA: tutti (anon + loggati) possono leggere tutte le righe.
-- ------------------------------------------------------------
drop policy if exists "imprese_select_public" on public.imprese;
create policy "imprese_select_public" on public.imprese
  for select
  to anon, authenticated
  using (true);


-- ------------------------------------------------------------
-- 3) SCRITTURA: solo il proprietario (auth.uid() = user_id).
--    - INSERT: la registrazione funziona perche' fai signInWithPassword
--      PRIMA dell'insert, quindi auth.uid() = user_id appena creato.
--    - UPDATE / DELETE: solo sulla propria riga.
-- ------------------------------------------------------------
drop policy if exists "imprese_insert_owner" on public.imprese;
create policy "imprese_insert_owner" on public.imprese
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "imprese_update_owner" on public.imprese;
create policy "imprese_update_owner" on public.imprese
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "imprese_delete_owner" on public.imprese;
create policy "imprese_delete_owner" on public.imprese
  for delete
  to authenticated
  using (user_id = auth.uid());


-- ============================================================
-- NOTE / TEST DOPO L'ESECUZIONE
--
-- 1) Da NON loggato apri cerca-imprese.html, risultati, mappa, profilo:
--    le imprese devono comparire come prima.
-- 2) Registra una nuova impresa di prova: l'insert deve andare a buon fine.
-- 3) Da loggato, modifica il TUO profilo: ok. Prova a modificare un'altra
--    impresa: deve fallire.
-- 4) Controlla admin.html: deve continuare a vedere le imprese.
--
-- SE la registrazione desse errore di permesso sull'insert, significa che
-- la sessione non e' attiva al momento dell'insert: avvisami e spostiamo
-- l'inserimento in una Netlify function con service_role.
-- ============================================================
