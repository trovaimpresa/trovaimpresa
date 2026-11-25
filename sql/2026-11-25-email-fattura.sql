-- =====================================================================
-- LA FATTURA PER EMAIL COL PDF — 25 novembre 2026
-- Il registro delle email (gest_email_documenti, sql/email-documenti.sql)
-- conta anche le fatture: stessi tetti dei preventivi (5 al giorno per
-- impresa, 20 per il sito). Le righe le scrive solo il server
-- (netlify/functions/invia-fattura-email.js).
-- set null: il registro resta anche se la fattura viene buttata per sempre.
-- =====================================================================
alter table public.gest_email_documenti
  add column if not exists fattura_id uuid references public.gest_fatture(id) on delete set null;
create index if not exists gest_email_documenti_fatt on public.gest_email_documenti (fattura_id, creato_il desc);
