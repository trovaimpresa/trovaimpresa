-- ============================================================
-- Tipo di cliente: privato / azienda / condominio  (agosto 2026)
-- Da eseguire UNA volta nel SQL editor di Supabase.
-- Sicuro da rilanciare: se la colonna c'e' gia', non fa niente.
-- ============================================================

ALTER TABLE public.gest_clienti
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'privato';

-- I clienti gia' inseriti restano senza tipo: li segno come "privato",
-- che e' il caso piu' comune. Poi li correggi a mano dove serve.
UPDATE public.gest_clienti
   SET tipo = 'privato'
 WHERE tipo IS NULL;

-- controllo: quanti clienti per tipo
SELECT COALESCE(tipo, '(vuoto)') AS tipo, count(*) AS quanti
FROM public.gest_clienti
GROUP BY tipo
ORDER BY count(*) DESC;
