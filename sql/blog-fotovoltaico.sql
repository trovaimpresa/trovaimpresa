-- ============================================================
-- Blog: articolo "Quanto costa il fotovoltaico" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa un impianto fotovoltaico nel 2026',
  'quanto-costa-impianto-fotovoltaico',
  'Prezzi reali al kW con e senza accumulo, detrazioni, come non farsi fregare e un calcolatore gratuito per stimare il costo del fotovoltaico.',
  'costi',
  '<p>Guida completa con prezzi al kW e calcolatore. <a href="/quanto-costa-impianto-fotovoltaico.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-impianto-fotovoltaico.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-impianto-fotovoltaico'
);
