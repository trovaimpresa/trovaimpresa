-- TrovaImpresa — RLS BATCH 5 — feedback_clienti + segnalazioni

-- feedback_clienti = recensioni pubbliche
alter table public.feedback_clienti enable row level security;
drop policy if exists "public_read" on public.feedback_clienti;
create policy "public_read" on public.feedback_clienti
  for select to anon, authenticated using (true);
drop policy if exists "public_insert" on public.feedback_clienti;
create policy "public_insert" on public.feedback_clienti
  for insert to anon, authenticated with check (true);

-- segnalazioni = private (admin via service_role)
alter table public.segnalazioni enable row level security;
drop policy if exists "owner_all" on public.segnalazioni;
create policy "owner_all" on public.segnalazioni
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
