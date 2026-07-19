-- ============================================================
-- Blog: articolo + strumento "bagno" nella lista dinamica
-- Aggiunge il supporto a pagine statiche ricche (con calcolatore)
-- tramite la colonna url_esterno, senza duplicare i contenuti.
-- Eseguire una volta nel SQL editor di Supabase.
-- ============================================================

-- 1) Nuova colonna: se valorizzata, la card del blog punta a questa URL
--    invece che a articolo.html?slug=...
ALTER TABLE public.blog_articoli
  ADD COLUMN IF NOT EXISTS url_esterno text;

-- 2) Permesso di lettura sulla nuova colonna (innocuo se i grant sono già a livello tabella)
GRANT SELECT (url_esterno) ON public.blog_articoli TO anon, authenticated;

-- 3) Articolo "Quanto costa rifare il bagno" -> pagina statica con calcolatore
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

-- 4) Strumento "Controlla se il preventivo è gonfiato" -> pagina statica
INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Il tuo preventivo del bagno è gonfiato?',
  'controlla-preventivo-bagno',
  'Inserisci le voci del preventivo e scopri in un minuto quali prezzi sono nella norma e quali troppo alti. Gratis, senza registrazione.',
  'guide',
  '<p>Strumento gratuito di verifica preventivo. <a href="/controlla-preventivo-bagno.html">Apri lo strumento &rarr;</a></p>',
  '/controlla-preventivo-bagno.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'controlla-preventivo-bagno'
);
