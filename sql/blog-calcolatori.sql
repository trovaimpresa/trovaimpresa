-- ============================================================
-- Blog: pagina "Calcolatori costi ristrutturazione" nella lista dinamica.
-- La colonna url_esterno esiste già (creata in blog-strumenti-bagno.sql).
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Calcolatori costi ristrutturazione 2026',
  'calcolatori',
  'Calcola gratis quanto costa rifare il bagno, ristrutturare casa, il cappotto, gli impianti, il condizionatore e il bonus. Tutti i calcolatori in una pagina.',
  'guide',
  '<p>Tutti i calcolatori dei costi in un posto solo. <a href="/calcolatori.html">Apri i calcolatori &rarr;</a></p>',
  '/calcolatori.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'calcolatori'
);
