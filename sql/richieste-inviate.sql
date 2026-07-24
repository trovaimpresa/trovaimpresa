-- ============================================================
-- TrovaImpresa — Inoltro automatico richieste cliente
-- Tabella-ponte per tracciare a chi è già stata inoltrata una richiesta
-- (serve per il cap giornaliero e per evitare doppioni).
-- Eseguire nell'SQL Editor di Supabase.
-- ============================================================

create table if not exists public.richieste_inviate (
  id          uuid primary key default gen_random_uuid(),
  richiesta_id text,            -- id della richiesta in richieste_clienti (come testo, type-agnostic)
  impresa_id  bigint,           -- id dell'impresa destinataria
  created_at  timestamptz not null default now(),
  unique (richiesta_id, impresa_id)
);

create index if not exists idx_richieste_inviate_impresa_data
  on public.richieste_inviate (impresa_id, created_at desc);

-- La tabella è usata SOLO dalla Netlify function con service_role (che bypassa
-- le RLS). Attiviamo RLS senza policy: così nessun utente anon/authenticated
-- può leggerla o scriverla (contiene dati di smistamento).
alter table public.richieste_inviate enable row level security;
