-- 11 ottobre 2026 — Preventivi da controllare (pagina dell'operaio): il capo manda un preventivo
-- (foto o PDF), l'operaio lo carica, lo controlla e lo segna «controllato». Una riga per preventivo.
-- Chi ha il permesso «lavori» sull'impresa lo vede e lo modifica; il titolare sempre.
-- Additivo: non cambia nessuna tabella esistente. I file stanno nel deposito gestionale-foto, cartella <impresa>/preventivi/.
create table if not exists public.gest_op_preventivi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titolo text not null,
  importo numeric,
  nota text,
  files jsonb not null default '[]'::jsonb,
  stato text not null default 'da_controllare' check (stato in ('da_controllare','controllato')),
  esito_nota text,
  creato_da text,
  controllato_da text,
  controllato_il timestamptz,
  created_at timestamptz not null default now(),
  eliminato_il timestamptz
);
create index if not exists gest_op_prev_idx on public.gest_op_preventivi(user_id, created_at desc);
alter table public.gest_op_preventivi enable row level security;
drop policy if exists op_prev_lavori on public.gest_op_preventivi;
create policy op_prev_lavori on public.gest_op_preventivi for all
  using (public.gest_puo_sezione(user_id, 'lavori'))
  with check (public.gest_puo_sezione(user_id, 'lavori'));
