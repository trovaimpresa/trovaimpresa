-- ============================================================
-- Reparto Commercialista (agosto 2026)
--
-- Il commercialista e' uno solo per impresa, quindi i suoi dati stanno
-- nella riga gest_azienda che gia' esiste, in colonne comm_*.
-- Niente tabella nuova, niente permessi nuovi da scrivere.
--
-- Da eseguire UNA volta nel SQL editor di Supabase.
-- Sicuro da rilanciare: se le colonne ci sono gia', non fa niente.
-- ============================================================

ALTER TABLE public.gest_azienda
  ADD COLUMN IF NOT EXISTS comm_studio text,
  ADD COLUMN IF NOT EXISTS comm_nome   text,
  ADD COLUMN IF NOT EXISTS comm_tel    text,
  ADD COLUMN IF NOT EXISTS comm_email  text,
  ADD COLUMN IF NOT EXISTS comm_pec    text,
  ADD COLUMN IF NOT EXISTS comm_note   text;


-- ============================================================
-- CONTROLLO: devono comparire sei righe
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'gest_azienda'
  AND column_name LIKE 'comm\_%'
ORDER BY column_name;
