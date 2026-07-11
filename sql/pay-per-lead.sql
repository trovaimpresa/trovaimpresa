-- ============================================================
-- PAY-PER-LEAD — da eseguire nel SQL Editor di Supabase
-- Aggiunge lo stato di sblocco ai preventivi e protegge i
-- contatti del cliente (email/telefono) a livello di database.
--
-- ⚠️ IMPORTANTE: eseguire questo SQL INSIEME al deploy dei
-- pannelli aggiornati (le vecchie query select('*') smettono
-- di funzionare dopo questo script — è voluto).
-- ============================================================

-- 1. Colonne per lo sblocco
ALTER TABLE public.preventivi
  ADD COLUMN IF NOT EXISTS sbloccato boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sbloccato_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- 2. PROTEZIONE CONTATTI (il cuore del sistema)
-- Revoca la lettura dell'intera tabella ai client del sito e
-- ri-concede la lettura di TUTTE le colonne TRANNE email e telefono.
-- I contatti si ottengono SOLO tramite la funzione Netlify
-- contatto-preventivo, che verifica il pagamento.
-- (L'INSERT del preventivo dal sito continua a funzionare:
--  la revoca riguarda solo la lettura.)
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

-- 3. Vista "sicura" per i pannelli: tutte le colonne TRANNE i contatti.
-- I pannelli leggono da questa vista (select * senza problemi).
-- security_invoker = true → le policy RLS restano quelle dell'utente.
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
    'CREATE OR REPLACE VIEW public.preventivi_safe WITH (security_invoker = true) AS SELECT %s FROM public.preventivi',
    cols
  );
  EXECUTE 'GRANT SELECT ON public.preventivi_safe TO anon, authenticated';
END $$;

-- 4. Controllo finale: elenca le colonne leggibili dai client.
--    email e telefono NON devono comparire nell'elenco.
SELECT grantee, column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'preventivi'
  AND privilege_type = 'SELECT'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, column_name;
