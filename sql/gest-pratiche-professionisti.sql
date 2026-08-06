-- ============================================================
-- Gestionale Studio: i campi della PRATICA (6 agosto 2026)
--
-- Per un'impresa un lavoro e': cosa, dove, quando, quanto.
-- Per un architetto o un geometra una pratica ha anche: che tipo di pratica e',
-- in quale Comune e' depositata, con che numero di protocollo, a che punto sta,
-- e i dati catastali dell'immobile.
--
-- Le colonne si aggiungono a gest_lavori: le pratiche SONO i lavori, viste da
-- uno studio. Cosi' non serve una tabella nuova e tutto il resto continua a
-- funzionare (calendario, fatture, scadenzario, report).
--
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
-- Le colonne sono tutte facoltative: chi non e' professionista non le vede
-- nemmeno e i suoi lavori restano identici a prima.
-- ============================================================

ALTER TABLE public.gest_lavori
  ADD COLUMN IF NOT EXISTS pratica_tipo        text,   -- CILA, SCIA, Permesso di Costruire, ...
  ADD COLUMN IF NOT EXISTS pratica_protocollo  text,   -- numero di protocollo del Comune
  ADD COLUMN IF NOT EXISTS pratica_comune      text,   -- Comune dove e' depositata
  ADD COLUMN IF NOT EXISTS pratica_data_dep    date,   -- data di deposito
  ADD COLUMN IF NOT EXISTS pratica_stato       text,   -- da_preparare | depositata | istruttoria | integrazioni | approvata | archiviata
  ADD COLUMN IF NOT EXISTS catasto_foglio      text,
  ADD COLUMN IF NOT EXISTS catasto_particella  text,
  ADD COLUMN IF NOT EXISTS catasto_sub         text;

COMMENT ON COLUMN public.gest_lavori.pratica_tipo       IS 'Tipo di pratica edilizia (CILA, SCIA, Permesso di Costruire...). Solo studi professionali.';
COMMENT ON COLUMN public.gest_lavori.pratica_protocollo IS 'Numero di protocollo assegnato dal Comune al deposito.';
COMMENT ON COLUMN public.gest_lavori.pratica_stato      IS 'A che punto e'' la pratica: da_preparare, depositata, istruttoria, integrazioni, approvata, archiviata.';

-- Ricerca veloce per protocollo (capita di cercare "quella pratica del 2024")
CREATE INDEX IF NOT EXISTS gest_lavori_protocollo_idx
  ON public.gest_lavori (user_id, pratica_protocollo)
  WHERE pratica_protocollo IS NOT NULL;

-- Controllo finale: le colonne ci sono?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='gest_lavori'
  AND (column_name LIKE 'pratica_%' OR column_name LIKE 'catasto_%')
ORDER BY column_name;
