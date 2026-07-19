-- ============================================================
-- Blog: articolo "Quanto costa rifare l'impianto elettrico" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa rifare l''impianto elettrico nel 2026',
  'quanto-costa-rifare-impianto-elettrico',
  'Prezzi reali al mq e a punto luce, livelli CEI 64-8, cosa deve comprendere il preventivo e un calcolatore gratuito per stimare il costo dell''impianto elettrico.',
  'costi',
  '<p>Guida completa con prezzi per livello e calcolatore. <a href="/quanto-costa-rifare-impianto-elettrico.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-rifare-impianto-elettrico.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-rifare-impianto-elettrico'
);
