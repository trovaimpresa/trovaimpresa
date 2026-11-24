-- 24 nov 2026 — Studio tecnico, Richieste dal sito.
-- Una richiesta di INCARICO trasformata in parcella si ricorda quale preventivo
-- e' nato da lei: nel gestionale c'e' «Apri il preventivo» e «Riapri» la rimette
-- «Preventivo fatto». (Per le richieste di preventivo delle imprese lo stesso
-- legame sta in gest_dalsito.preventivo_creato_id.)
-- Migrazione: incarichi_preventivo_creato_24nov2026 (GIA' ESEGUITA).
alter table public.incarichi_richieste add column if not exists preventivo_creato_id uuid;
