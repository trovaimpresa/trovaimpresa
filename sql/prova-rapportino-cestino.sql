-- ============================================================
-- UN RAPPORTINO DI PROVA, per collaudare il Cestino
-- ============================================================
WITH scelto AS (
  SELECT l.user_id, l.mestiere_id, l.id AS lavoro_id, l.descrizione
    FROM public.gest_lavori l
    JOIN (SELECT user_id, COUNT(*) AS n
            FROM public.gest_lavori
           WHERE eliminato_il IS NULL
           GROUP BY user_id
           ORDER BY n DESC
           LIMIT 1) top ON top.user_id = l.user_id
   WHERE l.eliminato_il IS NULL
   ORDER BY l.data_prevista DESC NULLS LAST
   LIMIT 1
),
chi AS (
  SELECT o.id FROM public.gest_operatori o JOIN scelto s ON s.user_id = o.user_id
   WHERE o.eliminato_il IS NULL
   ORDER BY o.nome LIMIT 1
),
nuovo AS (
  INSERT INTO public.gest_rapportini (user_id, mestiere_id, lavoro_id, creato_da, data, materiali, note)
  SELECT s.user_id, s.mestiere_id, s.lavoro_id, (SELECT id FROM chi), CURRENT_DATE,
         '3 sacchi di premiscelato — RAPPORTINO DI PROVA',
         'Scritto per collaudare il Cestino. Buttalo pure via.'
    FROM scelto s
   WHERE NOT EXISTS (SELECT 1 FROM public.gest_rapportini
                      WHERE materiali LIKE '%RAPPORTINO DI PROVA%' AND eliminato_il IS NULL)
  RETURNING id, user_id, mestiere_id, lavoro_id
),
ore AS (
  INSERT INTO public.gest_ore (user_id, mestiere_id, lavoro_id, operatore_id, data, ore, rapportino_id, nota)
  SELECT n.user_id, n.mestiere_id, n.lavoro_id, (SELECT id FROM chi), CURRENT_DATE, v.h, n.id, 'ore di prova'
    FROM nuovo n, (VALUES (8::numeric), (4.5::numeric)) AS v(h)
  RETURNING id
)
SELECT
  CASE WHEN (SELECT COUNT(*) FROM nuovo) = 0
       THEN 'NIENTE FATTO — o non hai nessun lavoro, oppure il rapportino di prova esiste gia. Cerca la scritta RAPPORTINO DI PROVA nel gestionale.'
       ELSE 'FATTO — ho messo un rapportino di prova da 12,5 ore. Aprilo nel gestionale e buttalo via col pulsante rosso.'
  END AS risultato,
  (SELECT descrizione FROM scelto) AS lavoro_dove_lo_trovi,
  (SELECT COUNT(*) FROM ore)       AS righe_di_ore_aggiunte,
  (SELECT COUNT(*) FROM public.gest_rapportini WHERE eliminato_il IS NULL) AS rapportini_vivi_prima_di_questa_query;
