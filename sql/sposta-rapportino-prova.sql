-- ============================================================
-- SPOSTA il rapportino di prova nel reparto «giardiniere»
-- (e con lui le sue ore), cosi' lo trovi dove sei gia'.
-- Tocca SOLO le righe firmate RAPPORTINO DI PROVA.
-- ============================================================
WITH dest AS (
  SELECT l.user_id, l.mestiere_id, l.id AS lavoro_id, l.descrizione
    FROM public.gest_lavori l
    JOIN public.gest_mestieri m ON m.id = l.mestiere_id
   WHERE lower(m.nome) LIKE 'giardinier%'
     AND l.eliminato_il IS NULL
     AND m.eliminato_il IS NULL
   ORDER BY l.data_prevista DESC NULLS LAST
   LIMIT 1
),
rap AS (
  UPDATE public.gest_rapportini r
     SET user_id = d.user_id, mestiere_id = d.mestiere_id, lavoro_id = d.lavoro_id
    FROM dest d
   WHERE r.materiali LIKE '%RAPPORTINO DI PROVA%'
     AND r.eliminato_il IS NULL
  RETURNING r.id
),
ore AS (
  UPDATE public.gest_ore o
     SET user_id = d.user_id, mestiere_id = d.mestiere_id, lavoro_id = d.lavoro_id
    FROM dest d
   WHERE o.rapportino_id IN (SELECT id FROM rap)
  RETURNING o.id
)
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM dest) = 0
      THEN 'NIENTE FATTO — nel reparto giardiniere non trovo nessun lavoro. Scrivimelo.'
    WHEN (SELECT COUNT(*) FROM rap) = 0
      THEN 'NIENTE FATTO — non trovo nessun rapportino di prova vivo. Forse lo hai gia buttato via.'
    ELSE 'FATTO — adesso il rapportino di prova sta nel reparto giardiniere. Apri il lavoro qui a fianco.'
  END AS risultato,
  (SELECT descrizione FROM dest) AS apri_questo_lavoro,
  (SELECT COUNT(*) FROM rap)     AS rapportini_spostati,
  (SELECT COUNT(*) FROM ore)     AS righe_di_ore_spostate;
