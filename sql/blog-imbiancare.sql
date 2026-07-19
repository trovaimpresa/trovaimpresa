-- ============================================================
-- Blog: articolo "Quanto costa imbiancare casa" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa imbiancare casa nel 2026',
  'quanto-costa-imbiancare-casa',
  'Prezzi reali al mq, per stanza e per casa, cosa fa salire il conto e un calcolatore gratuito per stimare il costo dell''imbiancatura.',
  'costi',
  '<p>Guida completa con prezzi e calcolatore. <a href="/quanto-costa-imbiancare-casa.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-imbiancare-casa.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-imbiancare-casa'
);
