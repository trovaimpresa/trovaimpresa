-- ============================================================
-- Blog: articolo "Bonus ristrutturazione 2026" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Bonus ristrutturazione 2026: come funziona e chi ne ha diritto',
  'bonus-ristrutturazione-2026',
  'Detrazione del 50% sulla prima casa e 36% sulla seconda, fino a 96.000 € in 10 rate. Come funziona, cosa rientra e un calcolatore di quanto ti torna.',
  'bonus',
  '<p>Guida completa con percentuali, requisiti e calcolatore. <a href="/bonus-ristrutturazione-2026.html">Apri la guida &rarr;</a></p>',
  '/bonus-ristrutturazione-2026.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'bonus-ristrutturazione-2026'
);
