-- ═══ TASSE E FISCO (27 settembre 2026) ═══════════════════════════════════
-- Gia' eseguito sul database (migrazioni fisco_farsi_pagare_solleciti e
-- fisco_profilo_fiscale). Si puo' rilanciare: le tabelle usano "if not exists".
-- Controllato da js/fondatore.js (PROVE) e da tools/controllo-push.js.

-- 1. I solleciti mandati (tappa «Farsi pagare», js/gest-fisco.js)
create table if not exists public.gest_solleciti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fattura_id uuid not null references public.gest_fatture(id) on delete cascade,
  passo smallint not null check (passo between 1 and 4),
  canale text not null check (canale in ('whatsapp','email','pec','raccomandata','telefono','giudice','altro')),
  inviato_il timestamptz not null default now(),
  testo text check (testo is null or length(testo) <= 20000),
  eliminato_il timestamptz
);
create index if not exists gest_solleciti_user_fatt on public.gest_solleciti(user_id, fattura_id);
alter table public.gest_solleciti enable row level security;
drop policy if exists gest_solleciti_own on public.gest_solleciti;
create policy gest_solleciti_own on public.gest_solleciti for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists giro_demo_lettura on public.gest_solleciti;
create policy giro_demo_lettura on public.gest_solleciti for select to anon, authenticated
  using (user_id = any (array['de770000-0000-4000-8000-000000000001'::uuid,'de770000-0000-4000-8000-000000000002'::uuid,'de770000-0000-4000-8000-000000000003'::uuid]));
drop trigger if exists trg_gest_piano on public.gest_solleciti;
create trigger trg_gest_piano before insert or update or delete on public.gest_solleciti for each row execute function gest_blocco_piano('user_id');
drop trigger if exists trg_gest_stesso_padrone on public.gest_solleciti;
create trigger trg_gest_stesso_padrone before insert or update on public.gest_solleciti for each row execute function gest_stesso_padrone();
revoke all on public.gest_solleciti from anon;
grant select on public.gest_solleciti to anon;
grant select, insert, update, delete on public.gest_solleciti to authenticated;

-- 2. Il profilo fiscale (tappa «Le tue tasse», js/gest-fisco-tasse.js)
create table if not exists public.gest_fisco_profilo (
  user_id uuid primary key references auth.users(id) on delete cascade,
  forma text not null check (forma in ('ditta','professionista','societa_persone','srl')),
  regime text not null check (regime in ('forfettario','ordinario')),
  cassa text not null check (cassa in ('artigiani','commercianti','separata','cipag','inarcassa','altra','nessuna')),
  anno_inizio integer check (anno_inizio is null or anno_inizio between 1950 and 2100),
  aliquota_5 boolean not null default false,
  coeff numeric check (coeff is null or (coeff > 0 and coeff <= 100)),
  riduzione35 boolean not null default false,
  iva text check (iva is null or iva in ('mensile','trimestrale')),
  spese_anno numeric check (spese_anno is null or spese_anno >= 0),
  perc_commercialista numeric check (perc_commercialista is null or (perc_commercialista >= 0 and perc_commercialista <= 100)),
  aggiornato_il timestamptz not null default now()
);
alter table public.gest_fisco_profilo enable row level security;
drop policy if exists gest_fisco_profilo_own on public.gest_fisco_profilo;
create policy gest_fisco_profilo_own on public.gest_fisco_profilo for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists giro_demo_lettura on public.gest_fisco_profilo;
create policy giro_demo_lettura on public.gest_fisco_profilo for select to anon, authenticated
  using (user_id = any (array['de770000-0000-4000-8000-000000000001'::uuid,'de770000-0000-4000-8000-000000000002'::uuid,'de770000-0000-4000-8000-000000000003'::uuid]));
drop trigger if exists trg_gest_piano on public.gest_fisco_profilo;
create trigger trg_gest_piano before insert or update or delete on public.gest_fisco_profilo for each row execute function gest_blocco_piano('user_id');
revoke all on public.gest_fisco_profilo from anon;
grant select on public.gest_fisco_profilo to anon;
grant select, insert, update, delete on public.gest_fisco_profilo to authenticated;

-- 3. «Il prezzo giusto» (tappa «Sopravvivere», js/gest-fisco-vivere.js) — migrazione fisco_prezzo_giusto
alter table public.gest_fisco_profilo
  add column if not exists pg_netto_mese numeric check (pg_netto_mese is null or pg_netto_mese >= 0),
  add column if not exists pg_spese_mese numeric check (pg_spese_mese is null or pg_spese_mese >= 0),
  add column if not exists pg_mesi numeric check (pg_mesi is null or (pg_mesi > 0 and pg_mesi <= 12)),
  add column if not exists pg_giorni numeric check (pg_giorni is null or (pg_giorni > 0 and pg_giorni <= 31)),
  add column if not exists pg_ore numeric check (pg_ore is null or (pg_ore > 0 and pg_ore <= 24)),
  add column if not exists pg_non_fatt numeric check (pg_non_fatt is null or (pg_non_fatt >= 0 and pg_non_fatt < 100));
