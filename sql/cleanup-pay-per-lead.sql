-- ============================================================
-- CLEANUP PAY-PER-LEAD — da eseguire nel SQL Editor di Supabase
-- Rimuove colonne, tabella e policy ormai inutilizzate dopo la
-- rimozione del pay-per-lead. I contatti (email/telefono) restano
-- protetti a livello DB e continuano a passare dalla function
-- contatto-preventivo.js.
--
-- Ordine obbligatorio: prima si eliminano gli oggetti che dipendono
-- dalle colonne (vista + policy), poi la tabella, poi le colonne,
-- infine si ricrea la vista preventivi_safe.
-- ============================================================

-- 1. Rimuovi la vista (dipende dalle colonne che stiamo per eliminare)
DROP VIEW IF EXISTS public.preventivi_safe;

-- 2. Rimuovi la policy dei lead condivisi (dipende da "condivisibile")
DROP POLICY IF EXISTS "lead condivisi visibili dopo 48h" ON public.preventivi;

-- 3. Rimuovi la tabella degli sblocchi (non più usata)
DROP TABLE IF EXISTS public.lead_sblocchi;

-- 4. Rimuovi le colonne del vecchio pay-per-lead
ALTER TABLE public.preventivi
  DROP COLUMN IF EXISTS sbloccato,
  DROP COLUMN IF EXISTS sbloccato_at,
  DROP COLUMN IF EXISTS stripe_session_id,
  DROP COLUMN IF EXISTS condivisibile;

-- 5. Ri-allinea i permessi di lettura: tutte le colonne TRANNE email/telefono
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name  = 'preventivi'
    AND column_name NOT IN ('email', 'telefono');

  EXECUTE 'REVOKE SELECT ON public.preventivi FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.preventivi TO anon, authenticated', cols);
END $$;

-- 6. Ricrea la vista "sicura" per i pannelli (tutte le colonne tranne i contatti)
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

  EXECUTE format(
    'CREATE VIEW public.preventivi_safe WITH (security_invoker = true) AS SELECT %s FROM public.preventivi',
    cols
  );
  EXECUTE 'GRANT SELECT ON public.preventivi_safe TO anon, authenticated';
END $$;

-- 7. Controllo finale: la vista NON deve contenere email/telefono
--    e non devono più comparire le colonne del pay-per-lead.
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'preventivi_safe'
ORDER BY ordinal_position;
