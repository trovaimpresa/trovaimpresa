-- ============================================================
-- TrovaImpresa — SICUREZZA RLS — BATCH 1 (SICURO)
-- Tabelle PRIVATE del gestionale impresa: ognuno vede SOLO i propri dati.
--
-- Perche' e' sicuro da eseguire subito:
--  - Queste tabelle NON sono lette da pagine pubbliche.
--  - NON sono lette da admin.html.
--  - Le funzioni Netlify usano la chiave service_role, che IGNORA l'RLS
--    (quindi email, pagamenti e webhook continuano a funzionare).
--  - Il pannello impresa lavora col token dell'utente loggato,
--    quindi auth.uid() e' valorizzato e le regole funzionano.
--
-- Eseguire nell'SQL Editor di Supabase.
-- ============================================================


-- ---------- GRUPPO A: proprietario via user_id (= auth.uid()) ----------

alter table public.agenda_appuntamenti enable row level security;
drop policy if exists "owner_all" on public.agenda_appuntamenti;
create policy "owner_all" on public.agenda_appuntamenti
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.scadenze_fiscali enable row level security;
drop policy if exists "owner_all" on public.scadenze_fiscali;
create policy "owner_all" on public.scadenze_fiscali
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.promemoria enable row level security;
drop policy if exists "owner_all" on public.promemoria;
create policy "owner_all" on public.promemoria
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.cantieri enable row level security;
drop policy if exists "owner_all" on public.cantieri;
create policy "owner_all" on public.cantieri
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.certificazioni enable row level security;
drop policy if exists "owner_all" on public.certificazioni;
create policy "owner_all" on public.certificazioni
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ---------- GRUPPO B: proprietario via impresa_id (-> imprese.user_id) ----------

alter table public.note_personali enable row level security;
drop policy if exists "owner_all" on public.note_personali;
create policy "owner_all" on public.note_personali
  for all to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()))
  with check (impresa_id in (select id from public.imprese where user_id = auth.uid()));

alter table public.preventivi_creati enable row level security;
drop policy if exists "owner_all" on public.preventivi_creati;
create policy "owner_all" on public.preventivi_creati
  for all to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()))
  with check (impresa_id in (select id from public.imprese where user_id = auth.uid()));

alter table public.ai_richieste enable row level security;
drop policy if exists "owner_all" on public.ai_richieste;
create policy "owner_all" on public.ai_richieste
  for all to authenticated
  using (impresa_id in (select id from public.imprese where user_id = auth.uid()))
  with check (impresa_id in (select id from public.imprese where user_id = auth.uid()));


-- ---------- GRUPPO C: proprietario via cantiere_id (-> cantieri.user_id) ----------

alter table public.cantiere_foto enable row level security;
drop policy if exists "owner_all" on public.cantiere_foto;
create policy "owner_all" on public.cantiere_foto
  for all to authenticated
  using (cantiere_id in (select id from public.cantieri where user_id = auth.uid()))
  with check (cantiere_id in (select id from public.cantieri where user_id = auth.uid()));

alter table public.cantiere_fatture enable row level security;
drop policy if exists "owner_all" on public.cantiere_fatture;
create policy "owner_all" on public.cantiere_fatture
  for all to authenticated
  using (cantiere_id in (select id from public.cantieri where user_id = auth.uid()))
  with check (cantiere_id in (select id from public.cantieri where user_id = auth.uid()));

alter table public.cantiere_preventivi enable row level security;
drop policy if exists "owner_all" on public.cantiere_preventivi;
create policy "owner_all" on public.cantiere_preventivi
  for all to authenticated
  using (cantiere_id in (select id from public.cantieri where user_id = auth.uid()))
  with check (cantiere_id in (select id from public.cantieri where user_id = auth.uid()));

alter table public.cantiere_log enable row level security;
drop policy if exists "owner_all" on public.cantiere_log;
create policy "owner_all" on public.cantiere_log
  for all to authenticated
  using (cantiere_id in (select id from public.cantieri where user_id = auth.uid()))
  with check (cantiere_id in (select id from public.cantieri where user_id = auth.uid()));

alter table public.cantiere_scadenze enable row level security;
drop policy if exists "owner_all" on public.cantiere_scadenze;
create policy "owner_all" on public.cantiere_scadenze
  for all to authenticated
  using (cantiere_id in (select id from public.cantieri where user_id = auth.uid()))
  with check (cantiere_id in (select id from public.cantieri where user_id = auth.uid()));

-- ============================================================
-- FINE BATCH 1 — 13 tabelle messe in sicurezza.
-- Dopo l'esecuzione: entra nel pannello impresa e verifica che
-- agenda, scadenze, cantieri, fatture e preventivi si vedano ancora.
-- ============================================================
