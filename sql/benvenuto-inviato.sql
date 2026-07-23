-- Colonna che segna se la mail di benvenuto è già stata inviata (invio automatico al 1° login).
-- Da eseguire una volta sola su Supabase (SQL Editor).

-- 1) Imprese (le 4 categorie business)
ALTER TABLE public.imprese
  ADD COLUMN IF NOT EXISTS benvenuto_inviato boolean NOT NULL DEFAULT false;

-- 2) Candidati
ALTER TABLE public.candidati_lavoro
  ADD COLUMN IF NOT EXISTS benvenuto_inviato boolean NOT NULL DEFAULT false;

-- 3) IMPORTANTE: gli iscritti GIÀ esistenti li segniamo come "già avvisati",
--    così al loro prossimo login NON ricevono la mail di benvenuto.
--    Solo i nuovi iscritti (creati da qui in avanti) la riceveranno al 1° accesso.
UPDATE public.imprese          SET benvenuto_inviato = true;
UPDATE public.candidati_lavoro SET benvenuto_inviato = true;
