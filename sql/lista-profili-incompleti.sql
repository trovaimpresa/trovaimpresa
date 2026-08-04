-- ============================================================
-- FASE 0 — Chi sono le imprese con il profilo incompleto
-- Da eseguire nel SQL editor di Supabase. Solo LETTURA: non modifica niente.
-- ============================================================

-- 1) IL QUADRO D'INSIEME: quante sono complete e quante no
SELECT
  count(*)                                                     AS totali,
  count(*) FILTER (WHERE indirizzo IS NOT NULL
                     AND descrizione IS NOT NULL)              AS profilo_completo,
  count(*) FILTER (WHERE indirizzo IS NULL
                      OR descrizione IS NULL)                  AS da_recuperare,
  count(*) FILTER (WHERE lat IS NULL OR lng IS NULL)           AS senza_coordinate
FROM public.imprese
WHERE coalesce(is_test, false) = false;


-- 2) LA LISTA DA CONTATTARE: nome, email, città e cosa manca
--    Copiala e usala per l'invio con Resend.
SELECT
  nome_attivita,
  nome              AS referente,
  email,
  telefono,
  citta,
  provincia,
  mestiere,
  created_at::date  AS iscritta_il,
  -- cosa manca, in chiaro
  concat_ws(', ',
    CASE WHEN indirizzo   IS NULL THEN 'indirizzo'   END,
    CASE WHEN descrizione IS NULL THEN 'descrizione' END,
    CASE WHEN lat IS NULL OR lng IS NULL THEN 'coordinate' END,
    CASE WHEN logo        IS NULL THEN 'logo'        END
  ) AS manca
FROM public.imprese
WHERE coalesce(is_test, false) = false
  AND (indirizzo IS NULL OR descrizione IS NULL)
  AND email IS NOT NULL
ORDER BY created_at DESC;


-- 3) SOLO LE EMAIL, incolonnate — comodo da copiare e incollare
SELECT string_agg(DISTINCT email, ', ')
FROM public.imprese
WHERE coalesce(is_test, false) = false
  AND (indirizzo IS NULL OR descrizione IS NULL)
  AND email IS NOT NULL;


-- 4) DOVE SONO: quante imprese per città, complete e non.
--    Serve a capire quali pagine città si riempiono se il recupero funziona.
SELECT
  citta,
  count(*)                                                        AS iscritte,
  count(*) FILTER (WHERE indirizzo IS NOT NULL
                     AND descrizione IS NOT NULL)                 AS complete
FROM public.imprese
WHERE coalesce(is_test, false) = false
GROUP BY citta
ORDER BY count(*) DESC;


-- ============================================================
-- NOTA: se una query dà errore su una colonna (es. "logo" o "lat"),
-- vuol dire che quella colonna si chiama diversamente nella tabella.
-- Togli quella riga e rilancia: il resto funziona lo stesso.
-- ============================================================
