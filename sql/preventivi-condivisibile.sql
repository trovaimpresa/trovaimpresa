-- ============================================================
-- Preventivi: colonna "condivisibile" mancante (6 agosto 2026)
--
-- IL PROBLEMA: il form pubblico di richiesta preventivo provava a scrivere
-- la colonna "condivisibile", che nel database non esiste piu'.
-- PostgREST rispondeva 400 e la richiesta del cliente andava PERSA.
-- Errore in console: "Could not find the 'condivisibile' column of 'preventivi'".
--
-- Serve a: se l'impresa non risponde entro 48 ore, il cliente autorizza
-- l'invio della richiesta ad altre imprese della zona.
--
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
-- ============================================================

ALTER TABLE public.preventivi
  ADD COLUMN IF NOT EXISTS condivisibile boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.preventivi.condivisibile IS
  'Il cliente autorizza l''invio della richiesta ad altre imprese se la prima non risponde entro 48 ore.';

-- ATTENZIONE (dal CLAUDE.md): dopo aver aggiunto una colonna a "preventivi"
-- vanno rifatti i permessi e la vista che i pannelli leggono, altrimenti
-- vanno in errore 403 "permission denied for table preventivi".
GRANT SELECT (
  id, impresa_id, nome, citta, categoria_lavoro, descrizione,
  data_preferita, urgenza, budget, foto, condivisibile, created_at
) ON public.preventivi TO anon, authenticated;

-- Controllo finale: la colonna c'e'?
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'preventivi'
ORDER BY ordinal_position;
