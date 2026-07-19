-- ============================================================
-- Blog: articolo "Quanto costa installare un condizionatore" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa installare un condizionatore nel 2026',
  'quanto-costa-installare-un-condizionatore',
  'Prezzi reali per monosplit, dual e trial, i BTU giusti per stanza, detrazioni e un calcolatore gratuito per stimare apparecchio e installazione.',
  'costi',
  '<p>Guida completa con prezzi e calcolatore. <a href="/quanto-costa-installare-un-condizionatore.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-installare-un-condizionatore.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-installare-un-condizionatore'
);
