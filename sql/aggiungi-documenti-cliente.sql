-- ============================================================
-- Documenti attaccati al cliente (agosto 2026)
--
-- Riusa la tabella che gia' porta i PDF delle fatture (gest_foto)
-- e il bucket gestionale-foto. Aggiunge solo due colonne:
--   cliente_id  -> a quale cliente e' attaccato il documento
--   nome_file   -> il nome originale, per mostrarlo nell'elenco
--
-- Da eseguire UNA volta nel SQL editor di Supabase.
-- Sicuro da rilanciare: se le colonne ci sono gia', non fa niente.
-- ============================================================

ALTER TABLE public.gest_foto
  ADD COLUMN IF NOT EXISTS cliente_id uuid,
  ADD COLUMN IF NOT EXISTS nome_file  text;

-- Ricerca veloce dei documenti di un cliente
CREATE INDEX IF NOT EXISTS gest_foto_cliente_idx
  ON public.gest_foto (cliente_id)
  WHERE cliente_id IS NOT NULL;


-- ============================================================
-- CONTROLLO: devono comparire due righe, cliente_id e nome_file
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'gest_foto'
  AND column_name IN ('cliente_id', 'nome_file')
ORDER BY column_name;
