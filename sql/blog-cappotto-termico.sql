-- ============================================================
-- Blog: articolo "Quanto costa il cappotto termico" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa il cappotto termico al mq nel 2026',
  'quanto-costa-cappotto-termico',
  'Prezzi reali al metro quadro per materiale, cosa deve comprendere il preventivo e un calcolatore gratuito per stimare il costo del cappotto termico.',
  'costi',
  '<p>Guida completa con prezzi per materiale e calcolatore. <a href="/quanto-costa-cappotto-termico.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-cappotto-termico.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-cappotto-termico'
);
