-- ============================================================
-- Blog: card per le 5 nuove pagine (agosto 2026).
-- Eseguire UNA volta nel SQL editor di Supabase (sicuro da rilanciare).
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa trasformare la vasca in doccia nel 2026',
  'quanto-costa-trasformare-vasca-in-doccia',
  'Da 1.000 a 3.500 € chiavi in mano: prezzi voce per voce, il problema delle piastrelle che non si trovano più e un calcolatore gratuito.',
  'costi',
  '<p>Guida completa. <a href="/quanto-costa-trasformare-vasca-in-doccia.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-trasformare-vasca-in-doccia.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-trasformare-vasca-in-doccia'
);

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa un muratore al giorno nel 2026',
  'quanto-costa-un-muratore-al-giorno',
  'Le tariffe vere della manodopera edile, spiegate da un muratore con 25 anni di cantiere: dove vanno i soldi e perché 120 € al giorno non possono essere in regola.',
  'costi',
  '<p>Guida completa. <a href="/quanto-costa-un-muratore-al-giorno.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-un-muratore-al-giorno.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-un-muratore-al-giorno'
);

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa sostituire la caldaia nel 2026',
  'quanto-costa-sostituire-la-caldaia',
  'Caldaia a condensazione, ibrido o pompa di calore: prezzi installati, la nuova regola sui bonus e un calcolatore gratuito.',
  'costi',
  '<p>Guida completa. <a href="/quanto-costa-sostituire-la-caldaia.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-sostituire-la-caldaia.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-sostituire-la-caldaia'
);

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa una parete in cartongesso nel 2026',
  'quanto-costa-parete-cartongesso',
  'Pareti divisorie, controsoffitti e velette: prezzi al mq, gli errori da evitare e un calcolatore gratuito.',
  'costi',
  '<p>Guida completa. <a href="/quanto-costa-parete-cartongesso.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-parete-cartongesso.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-parete-cartongesso'
);

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Trova cantieri: come trovare lavori in subappalto',
  'trova-cantieri',
  'I canali che funzionano per riempire il calendario della tua squadra e la bacheca subappalto gratuita di TrovaImpresa.',
  'guide',
  '<p>Guida completa. <a href="/trova-cantieri.html">Apri la guida &rarr;</a></p>',
  '/trova-cantieri.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'trova-cantieri'
);

