-- ============================================================
-- Blog: articolo "CILA, SCIA o permesso di costruire" nella lista dinamica.
-- La pagina vera e' statica (/permessi-ristrutturazione-cila-scia.html):
-- qui si crea solo la riga che la fa comparire in blog.html, con url_esterno.
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'CILA, SCIA o permesso di costruire: quale serve per i tuoi lavori',
  'permessi-ristrutturazione-cila-scia',
  'Quale pratica edilizia serve per i tuoi lavori? Tabella intervento per intervento: edilizia libera, CILA, SCIA e permesso di costruire, con sanzioni e novita Salva Casa.',
  'guide',
  '<p>Tabella intervento per intervento, sanzioni e novita del Salva Casa. <a href="/permessi-ristrutturazione-cila-scia.html">Apri la guida &rarr;</a></p>',
  '/permessi-ristrutturazione-cila-scia.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'permessi-ristrutturazione-cila-scia'
);

-- Verifica: deve comparire una riga con pubblicato = true
select titolo, slug, categoria, url_esterno, pubblicato
from public.blog_articoli
where slug = 'permessi-ristrutturazione-cila-scia';
