-- =====================================================================
-- TrovaImpresa — IL LUCCHETTO DELLA CHAT
-- Da salvare come  sql/supporto-messaggi-lucchetto.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 (12) — prima di aprire la chat dentro il gestionale.
--
-- COSA C'ERA DI APERTO
-- La tabella supporto_messaggi non sta in nessun file di sql/: e' stata
-- creata a mano, e si porta dietro un GRANT ALL. Da li' due buchi.
--
-- 1) UN'IMPRESA POTEVA RISCRIVERE LE RISPOSTE DEL FONDATORE.
--    La regola dice "puoi modificare le righe che sono tue", e anche le
--    risposte dell'admin sono righe sue: stanno nella sua chat.
--    Serviva solo a segnare i messaggi come letti, ma permetteva di
--    cambiare il TESTO. Nessun altro lo vedrebbe — e' la sua chat — ma
--    vuol dire che quella schermata non prova niente.
--    ⚠️ Le regole per riga (RLS) non sanno dire "solo questa colonna":
--    guardano la riga intera. Il permesso per COLONNA invece si', ed e'
--    esattamente lo strumento giusto. Da qui in poi un'impresa puo'
--    scrivere soltanto dentro «letto».
--
-- 2) C'ERA IL PERMESSO «TRUNCATE», CIOE' «SVUOTA TUTTO IN UN COLPO».
--    E' il piu' pericoloso di tutti perche' il lucchetto per riga NON lo
--    ferma: le regole guardano riga per riga, e truncate le righe non le
--    guarda proprio. Le porta via tutte, di tutti.
--    Dal browser oggi non e' raggiungibile, quindi non stava facendo
--    danni. Ma un permesso che non serve non deve esserci: costa una riga
--    toglierlo e nessuno si accorgera' di niente.
--    Vanno via anche TRIGGER e REFERENCES, arrivati con lo stesso GRANT ALL.
--
-- COSA NON SI TOCCA
-- Le quattro regole (leggere, scrivere, modificare, eliminare) restano
-- esattamente come sono. La chat dei quattro pannelli pubblici continua a
-- funzionare identica: segna i messaggi come letti scrivendo SOLO «letto»,
-- che e' quello che resta permesso.
-- =====================================================================

-- 1. si azzera quello che c'e' e si rida' solo il necessario
revoke all on public.supporto_messaggi from authenticated;

grant select, insert, delete on public.supporto_messaggi to authenticated;

-- 2. la modifica, ma di una colonna sola
grant update (letto) on public.supporto_messaggi to authenticated;


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- =====================================================================
WITH tab AS (
  SELECT string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS p
    FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='supporto_messaggi'
     AND grantee='authenticated'
), col AS (
  SELECT string_agg(DISTINCT column_name, ', ' ORDER BY column_name) AS c
    FROM information_schema.column_privileges
   WHERE table_schema='public' AND table_name='supporto_messaggi'
     AND grantee='authenticated' AND privilege_type='UPDATE'
)
SELECT
  CASE
    WHEN (SELECT p FROM tab) ILIKE '%TRUNCATE%'
      THEN 'NIENTE FATTO — il permesso «svuota tutto» c''e'' ancora. Rilancia il file tutto intero.'
    WHEN (SELECT p FROM tab) ILIKE '%UPDATE%'
      THEN 'A META'' — la modifica e'' ancora su tutta la tabella invece che sulla sola colonna «letto».'
    WHEN (SELECT c FROM col) IS DISTINCT FROM 'letto'
      THEN 'A META'' — la colonna modificabile non e'' soltanto «letto». Guarda la colonna qui a fianco.'
    WHEN (SELECT p FROM tab) IS NULL
      THEN 'ATTENZIONE — chi e'' collegato adesso non puo'' fare piu'' NIENTE: la chat si spegnerebbe. Scrivimelo subito.'
    ELSE 'FATTO — un''impresa adesso puo'' solo leggere le sue, scriverne di sue, segnarle lette ed eliminare la sua chat. Le tue risposte non le puo'' piu'' toccare, e il permesso «svuota tutto» non c''e'' piu''.'
  END AS risultato,
  (SELECT p FROM tab) AS cosa_puo_fare_ora,
  (SELECT c FROM col) AS colonne_che_puo_modificare,
  COALESCE((SELECT string_agg(DISTINCT privilege_type, ', ')
              FROM information_schema.role_table_grants
             WHERE table_schema='public' AND table_name='supporto_messaggi'
               AND grantee='anon'), 'niente (giusto cosi)') AS cosa_puo_fare_chi_non_e_collegato,
  (SELECT COUNT(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='supporto_messaggi') AS regole_ancora_al_loro_posto;
