-- ============================================================
-- Blog: guida "Quanto costa un idraulico" (agosto 2026)
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
--
-- Non fa doppione con 'quanto-costa-rifare-impianto-idraulico':
--   quella parla di RIFARE L'IMPIANTO (opera da migliaia di euro),
--   questa di CHIAMARE L'IDRAULICO (intervento da 70-150 euro).
-- Gruppo del blog: 'bagno' (Bagno e idraulica), lo stesso dell'altra.
-- ============================================================

INSERT INTO public.blog_articoli
  (titolo, slug, meta_description, categoria, mestiere, contenuto, url_esterno, pubblicato, created_at)
SELECT
  'Quanto costa un idraulico nel 2026',
  'quanto-costa-un-idraulico',
  'Quanto costa un idraulico nel 2026: 70-95 euro un intervento programmato, 100-140 in urgenza. Perche mezz''ora di lavoro costa 100 euro e come pagare il 40% in meno.',
  'costi',
  'bagno',
  '<p>I due prezzi dell''idraulico, urgenza e programmato, con calcolatore. <a href="/quanto-costa-un-idraulico.html">Apri la guida &rarr;</a></p>',
  '/quanto-costa-un-idraulico.html',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_articoli WHERE slug = 'quanto-costa-un-idraulico'
);

-- Verifica: deve tornare UNA riga, con mestiere = 'bagno' e pubblicato = true
SELECT slug, titolo, mestiere, pubblicato, created_at
FROM public.blog_articoli
WHERE slug = 'quanto-costa-un-idraulico';
