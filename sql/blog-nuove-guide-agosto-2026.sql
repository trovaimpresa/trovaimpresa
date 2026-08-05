-- ============================================================
-- Blog: 4 guide nuove (agosto 2026) + fix del mestiere mancante.
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
-- Prerequisito: aver già eseguito sql/blog-mestieri.sql (colonna "mestiere").
-- ============================================================

-- Fix: questo articolo era rimasto senza mestiere
UPDATE public.blog_articoli SET mestiere = 'bonus'
  WHERE slug = 'bonus-edilizi-2026';

-- 1. Quanto costa rifare la cucina
INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, mestiere, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa rifare la cucina nel 2026',
  'quanto-costa-rifare-la-cucina',
  'Da 500 a 1.250 €/mq: impianti, scarichi, cappa e rivestimenti voce per voce, con il mobile contato a parte e un calcolatore gratuito.',
  'costi',
  'ristrutturazione',
  '<p>Guida completa. <a href="/quanto-costa-rifare-la-cucina.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-rifare-la-cucina.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-rifare-la-cucina'
);

-- 2. Quanto costa abbattere un muro
INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, mestiere, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa abbattere un muro nel 2026 (e aprire una porta)',
  'quanto-costa-abbattere-un-muro',
  'Tramezzo o muro portante: come capire la differenza, quanto costa la demolizione, l''architrave, lo smaltimento e le pratiche. Con calcolatore.',
  'costi',
  'ristrutturazione',
  '<p>Guida completa. <a href="/quanto-costa-abbattere-un-muro.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-abbattere-un-muro.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-abbattere-un-muro'
);

-- 3. Come leggere un preventivo edile
INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, mestiere, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Come leggere un preventivo edile senza farsi fregare',
  'come-leggere-un-preventivo-edile',
  'Le 8 voci che un preventivo serio deve avere, l''IVA al 10% o al 22%, le voci che spariscono e i campanelli d''allarme. Con checklist da spuntare.',
  'guide',
  'strumenti',
  '<p>Guida completa. <a href="/come-leggere-un-preventivo-edile.html">Apri la guida &rarr;</a></p>',
  '/come-leggere-un-preventivo-edile.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'come-leggere-un-preventivo-edile'
);

-- 4. Come trovare clienti se hai un'impresa edile
INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, mestiere, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Come trovare clienti se hai un''impresa edile',
  'come-trovare-clienti-impresa-edile',
  'I canali che portano lavoro davvero: passaparola, scheda Google, foto dei cantieri, rivendite e progettisti. Quanto costano e in quanto tempo rendono.',
  'guide',
  'imprese',
  '<p>Guida completa. <a href="/come-trovare-clienti-impresa-edile.html">Apri la guida &rarr;</a></p>',
  '/come-trovare-clienti-impresa-edile.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'come-trovare-clienti-impresa-edile'
);

-- Controllo finale
SELECT slug, titolo, mestiere FROM public.blog_articoli
ORDER BY mestiere NULLS FIRST, titolo;
