-- ============================================================
-- Blog: articolo "Quanto costa rifare l'impianto idraulico" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa rifare l''impianto idraulico nel 2026',
  'quanto-costa-rifare-impianto-idraulico',
  'Prezzi reali a punto acqua e per ambiente, cosa deve comprendere il preventivo e un calcolatore gratuito per stimare il costo dell''impianto idraulico.',
  'costi',
  '<p>Guida completa con prezzi e calcolatore. <a href="/quanto-costa-rifare-impianto-idraulico.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-rifare-impianto-idraulico.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-rifare-impianto-idraulico'
);
