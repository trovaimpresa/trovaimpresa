-- 12 ottobre 2026 — il numero WhatsApp del capo, scritto una volta nel gestionale.
-- Lo leggono le persone della squadra (per il tasto «Avvisa il capo su WhatsApp»); lo scrive solo il titolare.
create table if not exists public.gest_contatto_capo (
  user_id uuid primary key default auth.uid(),
  telefono text,
  aggiornato_il timestamptz not null default now()
);
alter table public.gest_contatto_capo enable row level security;
drop policy if exists capo_tel_titolare on public.gest_contatto_capo;
create policy capo_tel_titolare on public.gest_contatto_capo for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists capo_tel_squadra on public.gest_contatto_capo;
create policy capo_tel_squadra on public.gest_contatto_capo for select
  using (exists (select 1 from public.gest_membri m
                  where m.membro_id = auth.uid() and m.impresa_id = gest_contatto_capo.user_id and m.stato = 'attivo'));
