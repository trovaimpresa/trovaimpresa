-- =====================================================================
-- TrovaImpresa — VIA IL PERMESSO «SVUOTA TUTTO» DA TUTTE LE TABELLE
-- Da salvare come  sql/permessi-svuota-tutto.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 (12)
--
-- ⚠️ NON E' UN ERRORE DI ALESSIO: E' COME NASCE OGNI PROGETTO SUPABASE.
-- Supabase, quando crea il progetto, da' TUTTI i permessi sulle tabelle
-- pubbliche ai due ruoli del browser (anon e authenticated), e dentro
-- «tutti» c'e' anche TRUNCATE, cioe' «svuota la tabella in un colpo».
-- Lo fa apposta: la sicurezza vera la mettono le regole per riga (RLS),
-- che il progetto accende tabella per tabella. Tutti i progetti Supabase
-- del mondo partono cosi'.
--
-- PERCHE' TOGLIERLO LO STESSO
-- Le regole per riga fermano select, insert, update e delete. TRUNCATE no:
-- non guarda le righe, le porta via tutte. L'unica cosa che oggi lo ferma
-- e' che il ponte fra il browser e il database non ha un comando per
-- chiamarlo. E' una difesa che dipende da un pezzo che non abbiamo scritto
-- noi. Toglierlo costa una riga e il muro torna a reggersi da solo.
--
-- ⚠️ NON PUO' ROMPERE NIENTE.
-- Nessuna pagina del sito chiama TRUNCATE: non esiste nemmeno il modo di
-- farlo dal browser. Leggere, scrivere, modificare ed eliminare restano
-- esattamente come sono su tutte le tabelle. Via anche TRIGGER e
-- REFERENCES, che al browser non servono e non li usa nessuno.
--
-- Il pannello admin non e' toccato: lavora con service_role, che ha una
-- porta sua e non passa da questi permessi.
-- =====================================================================

-- 1. le tabelle che ci sono adesso
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;

-- 2. e quelle che nasceranno domani, cosi' non torna dalla finestra
alter default privileges in schema public
  revoke truncate, trigger, references on tables from anon, authenticated;


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- =====================================================================
WITH resta AS (
  SELECT count(DISTINCT table_name) AS n
    FROM information_schema.role_table_grants
   WHERE table_schema='public' AND grantee IN ('anon','authenticated')
     AND privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES')
), leggono AS (
  SELECT count(DISTINCT table_name) AS n
    FROM information_schema.role_table_grants
   WHERE table_schema='public' AND grantee='authenticated'
     AND privilege_type='SELECT'
), scrivono AS (
  SELECT count(DISTINCT table_name) AS n
    FROM information_schema.role_table_grants
   WHERE table_schema='public' AND grantee='authenticated'
     AND privilege_type='INSERT'
)
SELECT
  CASE
    WHEN (SELECT n FROM resta) > 0
      THEN 'NIENTE FATTO — il permesso «svuota tutto» sta ancora su ' || (SELECT n FROM resta) || ' tabelle. Rilancia il file tutto intero.'
    WHEN (SELECT n FROM leggono) = 0
      THEN 'ATTENZIONE — ho tolto troppo: nessuna tabella si legge piu''. Scrivimelo subito.'
    ELSE 'FATTO — il permesso «svuota tutto» non c''e'' piu'' su nessuna tabella, e nemmeno sulle prossime. Leggere e scrivere sono rimasti come prima.'
  END AS risultato,
  (SELECT n FROM resta)    AS tabelle_ancora_con_svuota_tutto,
  (SELECT n FROM leggono)  AS tabelle_che_si_leggono_ancora,
  (SELECT n FROM scrivono) AS tabelle_su_cui_si_scrive_ancora;
