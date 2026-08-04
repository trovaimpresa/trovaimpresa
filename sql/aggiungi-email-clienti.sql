-- ============================================================
-- Email del cliente nel gestionale (agosto 2026)
-- Da eseguire UNA volta nel SQL editor di Supabase.
-- Sicuro da rilanciare: se la colonna c'e' gia', non fa niente.
-- ============================================================

ALTER TABLE public.gest_clienti
  ADD COLUMN IF NOT EXISTS email text;

-- controllo: deve comparire la riga "email"
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gest_clienti'
  AND column_name = 'email';
