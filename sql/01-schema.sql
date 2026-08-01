-- =====================================================================
-- TrovaImpresa — Sistema crediti AI
-- File 1/2: SCHEMA + RLS
-- Incolla tutto in Supabase > SQL Editor > Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Piani disponibili
-- ---------------------------------------------------------------------
create type public.ai_plan as enum ('base', 'ai', 'ai_pro');

-- ---------------------------------------------------------------------
-- 2. Account AI (una riga per utente)
-- ---------------------------------------------------------------------
create table public.ai_accounts (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  plan                    public.ai_plan not null default 'base',

  -- quota mensile: NON si accumula, si azzera ogni mese
  monthly_quota           integer not null default 0,
  credits_used            integer not null default 0,

  -- crediti acquistati con ricariche: QUESTI si accumulano
  credits_extra           integer not null default 0,

  -- inizio del periodo di fatturazione corrente (primo del mese)
  period_start            timestamptz not null default date_trunc('month', now()),

  -- scadenza abbonamento annuale
  subscription_expires_at timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint credits_used_non_negativo  check (credits_used  >= 0),
  constraint credits_extra_non_negativo check (credits_extra >= 0),
  constraint quota_non_negativa         check (monthly_quota >= 0)
);

comment on table public.ai_accounts is
  'Stato crediti AI per utente. Scrivibile SOLO da service_role / funzioni SECURITY DEFINER.';

-- ---------------------------------------------------------------------
-- 3. Log consumi (audit + calcolo costi reali)
-- ---------------------------------------------------------------------
create table public.ai_usage_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  feature        text not null,              -- 'preventivo' | 'risposta_cliente' | ...
  credits_cost   integer not null,
  status         text not null default 'pending',  -- pending | ok | failed | refunded
  input_tokens   integer,
  output_tokens  integer,
  cost_eur       numeric(10,5),              -- costo reale, per monitorare il margine
  error_message  text,
  created_at     timestamptz not null default now()
);

create index ai_usage_log_user_idx    on public.ai_usage_log (user_id, created_at desc);
create index ai_usage_log_created_idx on public.ai_usage_log (created_at desc);

-- ---------------------------------------------------------------------
-- 4. Ricariche acquistate (storico pagamenti pacchetti crediti)
-- ---------------------------------------------------------------------
create table public.ai_credit_purchases (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  credits            integer not null,
  amount_eur         numeric(10,2) not null,
  payment_provider   text,                   -- 'stripe' | 'paypal' | ...
  payment_reference  text unique,            -- id transazione: evita doppie ricariche
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
--    L'utente puo SOLO LEGGERE i propri crediti. Mai modificarli.
-- ---------------------------------------------------------------------
alter table public.ai_accounts         enable row level security;
alter table public.ai_usage_log        enable row level security;
alter table public.ai_credit_purchases enable row level security;

-- Lettura del proprio account
create policy "leggi il proprio account ai"
  on public.ai_accounts for select
  to authenticated
  using (user_id = auth.uid());

-- Lettura del proprio storico consumi
create policy "leggi i propri consumi"
  on public.ai_usage_log for select
  to authenticated
  using (user_id = auth.uid());

-- Lettura delle proprie ricariche
create policy "leggi le proprie ricariche"
  on public.ai_credit_purchases for select
  to authenticated
  using (user_id = auth.uid());

-- NESSUNA policy di INSERT/UPDATE/DELETE per 'authenticated'.
-- Le scritture passano solo da funzioni SECURITY DEFINER o da service_role.
-- Questo e' cio' che rende impossibile il bypass dal browser.

-- ---------------------------------------------------------------------
-- 6. Creazione automatica dell'account AI a ogni nuovo utente
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user_ai_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_accounts (user_id, plan, monthly_quota)
  values (new.id, 'base', 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_ai_account
  after insert on auth.users
  for each row execute function public.handle_new_user_ai_account();

-- ---------------------------------------------------------------------
-- 7. Backfill: crea l'account AI per gli utenti gia esistenti
-- ---------------------------------------------------------------------
insert into public.ai_accounts (user_id, plan, monthly_quota)
select id, 'base', 0 from auth.users
on conflict (user_id) do nothing;
