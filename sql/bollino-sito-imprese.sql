-- 3 novembre 2026 — finestra «Ci trovi su TrovaImpresa» nei pannelli (js/bollino-sito.js)
-- GIA' APPLICATA in produzione (migrazione bollino_sito_imprese). Additiva, si puo' rilanciare.
alter table public.imprese
  add column if not exists bollino_messo_il   timestamptz,  -- ha cliccato «Fatto, l'ho messo»: non riappare piu'
  add column if not exists bollino_rimanda_al timestamptz;  -- «Piu' tardi»: torna dopo questa data (+7 giorni)
-- Scrive il proprietario con la regola che c'e' gia' (imprese_update_owner): nessuna policy nuova.
