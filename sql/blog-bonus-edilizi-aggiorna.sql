-- ============================================================
-- Blog: l'articolo "bonus-edilizi-2026" ora ha una pagina statica dedicata.
-- Prima viveva solo nel database (articolo.html?slug=...), ora punta al file
-- /bonus-edilizi-2026.html, più completo e con fonti verificate ad agosto 2026.
-- Lo slug NON cambia: niente da reindirizzare.
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
-- ============================================================

UPDATE public.blog_articoli
SET
  titolo            = 'Bonus edilizi 2026: quali restano e quanto puoi detrarre',
  meta_description  = 'Ristrutturazione, ecobonus, mobili, sismabonus e conto termico: percentuali, tetti di spesa e come non perdere la detrazione. Tutti i bonus 2026 in una tabella.',
  categoria         = 'bonus',
  mestiere          = 'bonus',
  url_esterno       = '/bonus-edilizi-2026.html',
  contenuto         = '<p>Guida completa. <a href="/bonus-edilizi-2026.html">Apri la guida &rarr;</a></p>',
  pubblicato        = true
WHERE slug = 'bonus-edilizi-2026';

-- Controllo: deve tornare 1 riga con url_esterno valorizzato
SELECT slug, titolo, mestiere, url_esterno, pubblicato
FROM public.blog_articoli
WHERE slug = 'bonus-edilizi-2026';
