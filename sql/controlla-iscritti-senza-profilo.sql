-- ============================================================
-- CHI SI È ISCRITTO MA NON HA IL PROFILO
--
-- Sintomo: l'email "Nuova iscrizione" ti arriva, ma la persona non
-- compare in `imprese` e al login viene respinta ("non riesco ad accedere",
-- "non riesco ad aggiornare").
--
-- Causa probabile: il trigger che crea il profilo non accetta quel `tipo`.
-- Solo LETTURA: non modifica niente.
-- ============================================================

-- 1) L'ELENCO DEGLI ORFANI: registrati in auth ma senza riga di profilo
SELECT
  u.email,
  u.created_at::date                          AS iscritto_il,
  (u.email_confirmed_at IS NOT NULL)          AS mail_confermata,
  u.raw_user_meta_data ->> 'tipo'             AS tipo_scelto,
  u.raw_user_meta_data ->> 'nome_attivita'    AS nome_attivita,
  u.raw_user_meta_data ->> 'citta'            AS citta
FROM auth.users u
LEFT JOIN public.imprese          i ON i.user_id = u.id
LEFT JOIN public.candidati_lavoro c ON c.user_id = u.id
WHERE i.id IS NULL
  AND c.id IS NULL
ORDER BY u.created_at DESC;


-- 2) QUANTI SONO, DIVISI PER TIPO
--    Se gli orfani sono tutti dello stesso tipo, il colpevole è il filtro del trigger.
SELECT
  COALESCE(u.raw_user_meta_data ->> 'tipo', '(nessun tipo)') AS tipo_scelto,
  count(*)                                                   AS senza_profilo
FROM auth.users u
LEFT JOIN public.imprese          i ON i.user_id = u.id
LEFT JOIN public.candidati_lavoro c ON c.user_id = u.id
WHERE i.id IS NULL AND c.id IS NULL
GROUP BY 1
ORDER BY 2 DESC;


-- 3) COS'È SCRITTO DENTRO IL TRIGGER
--    Cerca la riga con l'elenco dei tipi accettati: deve contenere
--    'impresa', 'artigiano', 'professionista', 'negozio'.
SELECT pg_get_functiondef(p.oid) AS codice_del_trigger
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'crea_profilo_impresa'
  AND n.nspname = 'public';
