-- ============================================================
-- Fix: «Come trovare operai edili» non compare nel gruppo «Per le imprese»
-- del blog, perche' e' rimasto senza il campo "mestiere".
-- Stesso problema gia' capitato a bonus-edilizi-2026
-- (vedi sql/blog-nuove-guide-agosto-2026.sql, prima riga).
--
-- Da lanciare UNA volta nel SQL editor di Supabase, tutto insieme.
-- Sicuro da rilanciare.
--
-- ⚠️ L'esito arriva come RIGA DI RISULTATO, non con raise notice.
-- ============================================================

-- Com'era prima, altrimenti non posso dirti se ho cambiato qualcosa.
DROP TABLE IF EXISTS _esito_operai;
CREATE TEMP TABLE _esito_operai AS
SELECT COUNT(*) AS quante, MAX(COALESCE(mestiere, '(vuoto)')) AS mestiere_prima
FROM public.blog_articoli
WHERE slug = 'come-trovare-operai-edili';

UPDATE public.blog_articoli
   SET mestiere = 'imprese'
 WHERE slug = 'come-trovare-operai-edili'
   AND mestiere IS DISTINCT FROM 'imprese';

-- ============================================================
-- Come e' andata, piu' l'elenco di cosa c'e' adesso nel gruppo.
-- ============================================================
SELECT
  CASE
    WHEN (SELECT quante FROM _esito_operai) = 0
      THEN 'NIENTE FATTO — nessun articolo con indirizzo «come-trovare-operai-edili». Controlla il nome.'
    WHEN (SELECT mestiere_prima FROM _esito_operai) = 'imprese'
      THEN 'ERA GIA'' A POSTO — il gruppo era gia'' «imprese», non ho cambiato niente. Allora il problema e'' un altro: dimmelo.'
    ELSE 'SISTEMATO — «Come trovare operai edili» era nel gruppo «'
         || (SELECT mestiere_prima FROM _esito_operai)
         || '», adesso e'' in «imprese».'
  END AS risultato,
  (SELECT COUNT(*) FROM public.blog_articoli
    WHERE mestiere = 'imprese' AND pubblicato IS TRUE) AS guide_nel_gruppo_imprese,
  (SELECT string_agg(titolo, ' · ' ORDER BY titolo) FROM public.blog_articoli
    WHERE mestiere = 'imprese' AND pubblicato IS TRUE) AS quali_sono;
