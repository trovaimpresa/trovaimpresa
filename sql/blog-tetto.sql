-- ============================================================
-- Blog: articolo "Quanto costa rifare il tetto" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa rifare il tetto nel 2026',
  'quanto-costa-rifare-il-tetto',
  'Prezzi reali al mq per tipo di intervento (manto, tetto isolato, nuova struttura), nota su amianto, detrazioni e un calcolatore gratuito.',
  'costi',
  '<p>Guida completa con prezzi al mq e calcolatore. <a href="/quanto-costa-rifare-il-tetto.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-rifare-il-tetto.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-rifare-il-tetto'
);
