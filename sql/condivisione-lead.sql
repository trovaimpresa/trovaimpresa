-- ============================================================
-- CONDIVISIONE LEAD — da eseguire nel SQL Editor di Supabase
-- Il cliente può autorizzare l'invio della richiesta ad altre
-- imprese della zona se l'impresa scelta non risponde in 48h.
-- Ogni richiesta è sbloccabile da MASSIMO 5 imprese.
-- Eseguire DOPO sql/pay-per-lead.sql.
-- ============================================================

-- 1. Consenso del cliente alla condivisione
ALTER TABLE public.preventivi
  ADD COLUMN IF NOT EXISTS condivisibile boolean NOT NULL DEFAULT false;

-- 2. Tabella degli sblocchi (un lead può essere sbloccato da più imprese)
CREATE TABLE IF NOT EXISTS public.lead_sblocchi (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  preventivo_id bigint NOT NULL REFERENCES public.preventivi(id) ON DELETE CASCADE,
  impresa_id bigint NOT NULL REFERENCES public.imprese(id) ON DELETE CASCADE,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (preventivo_id, impresa_id)
);

ALTER TABLE public.lead_sblocchi ENABLE ROW LEVEL SECURITY;

-- Ogni impresa vede solo i PROPRI sblocchi (per mostrare "già sbloccato" nel pannello)
DROP POLICY IF EXISTS "impresa vede propri sblocchi" ON public.lead_sblocchi;
CREATE POLICY "impresa vede propri sblocchi" ON public.lead_sblocchi
  FOR SELECT TO authenticated
  USING (impresa_id IN (SELECT id FROM public.imprese WHERE user_id = auth.uid()));

GRANT SELECT ON public.lead_sblocchi TO authenticated;
-- Insert/update solo dal service key (funzioni Netlify): nessun grant a anon/authenticated.

-- 3. Visibilità: dopo 48h i lead condivisibili diventano leggibili
-- da tutte le imprese loggate (le policy si sommano a quelle esistenti)
DROP POLICY IF EXISTS "lead condivisi visibili dopo 48h" ON public.preventivi;
CREATE POLICY "lead condivisi visibili dopo 48h" ON public.preventivi
  FOR SELECT TO authenticated
  USING (condivisibile = true AND created_at < now() - interval '48 hours');

-- 4. Ricrea la vista sicura per includere la nuova colonna condivisibile
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name  = 'preventivi'
    AND column_name NOT IN ('email', 'telefono');

  EXECUTE 'DROP VIEW IF EXISTS public.preventivi_safe';
  EXECUTE format(
    'CREATE VIEW public.preventivi_safe WITH (security_invoker = true) AS SELECT %s FROM public.preventivi',
    cols
  );
  EXECUTE 'GRANT SELECT ON public.preventivi_safe TO anon, authenticated';
END $$;

-- 5. Controllo: la vista deve contenere condivisibile ma NON email/telefono
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'preventivi_safe'
ORDER BY ordinal_position;
