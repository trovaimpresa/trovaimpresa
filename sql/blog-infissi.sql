-- ============================================================
-- Blog: articolo "Quanto costa cambiare gli infissi" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa cambiare gli infissi nel 2026',
  'quanto-costa-cambiare-gli-infissi',
  'Prezzi reali al mq per materiale (PVC, alluminio, legno), costo per casa, detrazioni 2026 e un calcolatore gratuito per stimare la spesa degli infissi.',
  'costi',
  '<p>Guida completa con prezzi per materiale e calcolatore. <a href="/quanto-costa-cambiare-gli-infissi.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-cambiare-gli-infissi.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-cambiare-gli-infissi'
);
