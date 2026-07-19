-- ============================================================
-- Blog: articolo "Quanto costa rifare la facciata" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa rifare la facciata nel 2026',
  'quanto-costa-rifare-la-facciata',
  'Prezzi reali al mq per tinteggiatura, intonaco e rifacimento completo, il ruolo del ponteggio, detrazioni e un calcolatore gratuito per stimare la spesa.',
  'costi',
  '<p>Guida completa con prezzi al mq e calcolatore. <a href="/quanto-costa-rifare-la-facciata.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-rifare-la-facciata.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-rifare-la-facciata'
);
