-- ============================================================
-- FIX blog: aggiunge l'hub e sistema la riga del bagno.
-- Sicuro da rilanciare. Eseguire nel SQL editor di Supabase.
-- ============================================================

-- 1) HUB "Costi di ristrutturazione"
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

-- 2) BAGNO: se la riga non c'è la inserisce...
INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa rifare il bagno nel 2026',
  'quanto-costa-rifare-il-bagno',
  'Prezzi reali voce per voce, calcolatore gratuito e come riconoscere un preventivo gonfiato. Scritto da chi i bagni li ha rifatti per 25 anni.',
  'costi',
  '<p>Guida completa con prezzi reali e calcolatore. <a href="/quanto-costa-rifare-il-bagno.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-rifare-il-bagno.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-rifare-il-bagno'
);

-- ...e se la riga esiste già (vecchio articolo), le corregge il link e la pubblica.
UPDATE public.blog_articoli
SET url_esterno = '/quanto-costa-rifare-il-bagno.html',
    pubblicato = true
WHERE slug = 'quanto-costa-rifare-il-bagno'
  AND coalesce(url_esterno, '') <> '/quanto-costa-rifare-il-bagno.html';
