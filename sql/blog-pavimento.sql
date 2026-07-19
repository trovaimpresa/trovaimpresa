-- ============================================================
-- Blog: articolo "Quanto costa posare il pavimento" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa posare il pavimento nel 2026',
  'quanto-costa-posare-il-pavimento',
  'Prezzi reali al mq per gres, parquet e laminato, costo della sola posa, sottofondo e un calcolatore gratuito per stimare la spesa del pavimento.',
  'costi',
  '<p>Guida completa con prezzi per tipo e calcolatore. <a href="/quanto-costa-posare-il-pavimento.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-posare-il-pavimento.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-posare-il-pavimento'
);
