-- ============================================================
-- Gestionale Negozio: i campi che mancavano al prodotto (6 agosto 2026)
--
-- Oggi un prodotto ha: nome, codice, categoria, prezzo, quantita, soglia minima.
-- In una rivendita edile mancano tre cose che si usano tutti i giorni:
--
--   1. UNITA DI MISURA. Il cemento si vende a sacco, le piastrelle a mq,
--      il tondino a kg, il battiscopa a ml. Senza unita, "quantita 40" non
--      vuol dire niente: 40 pezzi? 40 metri? 40 sacchi?
--
--   2. PREZZO DI ACQUISTO. Con il solo prezzo di vendita non si vede il margine,
--      che e' la cosa che un negoziante guarda per prima.
--
--   3. IVA. Il materiale edile non ha sempre la stessa aliquota.
--
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
-- ============================================================

ALTER TABLE public.neg_prodotti
  ADD COLUMN IF NOT EXISTS unita           text DEFAULT 'pz',   -- pz, mq, ml, kg, q, t, sacco, bancale, conf, lt, mc
  ADD COLUMN IF NOT EXISTS prezzo_acquisto numeric(12,2),       -- quanto lo paghi al fornitore
  ADD COLUMN IF NOT EXISTS iva_perc        numeric(5,2) DEFAULT 22,
  ADD COLUMN IF NOT EXISTS fornitore_id    uuid;                -- da quale fornitore arriva

COMMENT ON COLUMN public.neg_prodotti.unita           IS 'Unita di misura: pz, mq, ml, kg, q, t, sacco, bancale, conf, lt, mc.';
COMMENT ON COLUMN public.neg_prodotti.prezzo_acquisto IS 'Costo dal fornitore. Serve a calcolare il margine: prezzo - prezzo_acquisto.';
COMMENT ON COLUMN public.neg_prodotti.fornitore_id    IS 'Fornitore abituale del prodotto (neg_fornitori.id). Facoltativo.';

-- Controllo finale
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='neg_prodotti'
ORDER BY ordinal_position;

-- ============================================================
-- AGGIUNTA del 6 agosto 2026 (dopo aver visto lo schema reale)
-- quantita e soglia_minima erano "integer": con 12,5 mq il database
-- rifiutava la scrittura. In una rivendita i mezzi bancali e i mq con
-- la virgola sono la norma, quindi vanno a decimali.
-- Da intero a numerico non si perde nulla: i valori esistenti restano uguali.
-- ============================================================
ALTER TABLE public.neg_prodotti
  ALTER COLUMN quantita      TYPE numeric(12,3),
  ALTER COLUMN soglia_minima TYPE numeric(12,3);

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='neg_prodotti'
  AND column_name IN ('quantita','soglia_minima');

-- Stesso problema sui movimenti di magazzino: scaricare 12,5 mq non era possibile.
ALTER TABLE public.neg_movimenti
  ALTER COLUMN quantita TYPE numeric(12,3);
