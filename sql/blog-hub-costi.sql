-- ============================================================
-- Blog: pagina indice (hub) "Costi di ristrutturazione" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Costi di ristrutturazione 2026: tutte le guide',
  'costi-ristrutturazione',
  'Prezzi reali al mq e calcolatori gratuiti per bagno, ristrutturazione casa, cappotto termico e bonus fiscali 2026. Tutte le guide in un posto.',
  'guide',
  '<p>Indice di tutte le guide sui costi con calcolatori. <a href="/costi-ristrutturazione.html">Apri l''indice &rarr;</a></p>',
  '/costi-ristrutturazione.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'costi-ristrutturazione'
);
