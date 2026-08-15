-- ============================================================
-- Blog: guida nuova «Come fare un preventivo edile» (filone imprese).
-- Da lanciare UNA volta nel SQL editor di Supabase, tutto insieme.
-- Sicuro da rilanciare: se la riga c'e' gia', non la duplica e te lo dice.
-- Stesso stampo di sql/blog-nuove-guide-agosto-2026.sql.
--
-- ⚠️ L'esito NON e' scritto con raise notice (Supabase non li mostra):
--    arriva come RIGA DI RISULTATO, l'ultima cosa che vedi sullo schermo.
-- ============================================================

-- Prendo nota di com'era PRIMA, altrimenti al secondo lancio
-- direi «scritto» senza aver scritto niente.
DROP TABLE IF EXISTS _esito_preventivo;
CREATE TEMP TABLE _esito_preventivo AS
SELECT COUNT(*) AS prima
FROM public.blog_articoli
WHERE slug = 'come-fare-un-preventivo-edile';

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, mestiere, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Come fare un preventivo edile: le 18 voci di un lavoro vero',
  'come-fare-un-preventivo-edile',
  'Come si fa un preventivo edile che il cliente non discute dopo: le 18 voci di una ristrutturazione vera, le voci che si dimenticano e le tre righe che evitano le contestazioni.',
  'guide',
  'imprese',
  '<p>Guida completa. <a href="/come-fare-un-preventivo-edile.html">Apri la guida &rarr;</a></p>',
  '/come-fare-un-preventivo-edile.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'come-fare-un-preventivo-edile'
);

-- ============================================================
-- Come e' andata: una riga sola, in italiano.
-- ============================================================
SELECT
  CASE
    WHEN COUNT(*) = 0
      THEN 'NIENTE SCRITTO — l''articolo non risulta nella tabella. Rilancia il file tutto intero, dalla prima riga all''ultima.'
    WHEN COUNT(*) > 1
      THEN 'ATTENZIONE — ci sono ' || COUNT(*) || ' righe con lo stesso indirizzo: sul blog l''articolo comparirebbe doppio.'
    WHEN BOOL_OR(pubblicato) IS NOT TRUE
      THEN 'SCRITTO MA NON PUBBLICATO — la riga c''e'', ma "pubblicato" non e'' true: sul blog non si vede.'
    WHEN MAX(mestiere) IS DISTINCT FROM 'imprese'
      THEN 'SCRITTO MA NEL GRUPPO SBAGLIATO — mestiere = ' || COALESCE(MAX(mestiere), '(vuoto)') || ' invece di «imprese».'
    WHEN (SELECT prima FROM _esito_preventivo) > 0
      THEN 'C''ERA GIA'' — nessun doppione. L''articolo e'' gia'' pubblicato nel gruppo «Per le imprese».'
    ELSE 'SCRITTO: «' || MAX(titolo) || '» — pubblicato, gruppo «Per le imprese». Apri /blog.html e guardalo.'
  END AS risultato
FROM public.blog_articoli
WHERE slug = 'come-fare-un-preventivo-edile';
