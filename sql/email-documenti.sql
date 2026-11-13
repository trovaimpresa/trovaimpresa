-- =====================================================================
-- L'EMAIL VERA COL PDF DEL PREVENTIVO — 13 novembre 2026 (lista «MANCA», n. 8)
--
-- Il registro delle email mandate da «Invia al cliente» → «Email con PDF».
-- Serve a due cose:
--   1. contare i TETTI: 5 al giorno per impresa, 20 al giorno per tutto il
--      sito (Resend gratis = 100 email al giorno per TUTTO il sito);
--   2. dire nella finestra «Ultima email mandata a … il …».
--
-- ⛔ LE RIGHE LE SCRIVE SOLO IL SERVER (netlify/functions/invia-preventivo-email.js,
--    col service role, DOPO che Resend ha preso l'email). Il browser legge le sue
--    e basta: nessuna regola di INSERT/UPDATE/DELETE per «authenticated».
-- Il PDF NON si tiene: il server lo cancella dal deposito subito dopo l'invio.
-- =====================================================================

create table if not exists public.gest_email_documenti (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- set null: il registro resta anche se il preventivo viene buttato per sempre
  preventivo_id uuid references public.gest_preventivi(id) on delete set null,
  a             text not null,
  resend_id     text,
  creato_il     timestamptz not null default now()
);
create index if not exists gest_email_documenti_giorno on public.gest_email_documenti (creato_il desc);
create index if not exists gest_email_documenti_user on public.gest_email_documenti (user_id, creato_il desc);
create index if not exists gest_email_documenti_prev on public.gest_email_documenti (preventivo_id, creato_il desc);

alter table public.gest_email_documenti enable row level security;
drop policy if exists gest_email_documenti_leggi on public.gest_email_documenti;
create policy gest_email_documenti_leggi on public.gest_email_documenti
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.gest_email_documenti from anon, authenticated;
grant select on public.gest_email_documenti to authenticated;
