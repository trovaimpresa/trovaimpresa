-- =====================================================================
-- TrovaImpresa — IL LUCCHETTO DELLA CHAT, IL PEZZO CHE MANCAVA
-- Da salvare come  sql/supporto-messaggi-lucchetto-anon.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 (12) — subito dopo supporto-messaggi-lucchetto.sql.
--
-- COSA MI ERA SFUGGITO
-- Il primo file ha ripulito i permessi di «authenticated», cioe' di chi e'
-- collegato. Ma lo stesso GRANT ALL era stato dato anche ad «anon», cioe' a
-- CHI NON E' COLLEGATO — e la chiave anon sta scritta dentro ogni pagina del
-- sito, la puo' leggere chiunque.
--
-- ⚠️ Perche' non e' un allarme rosso lo stesso: le regole per riga valgono
-- anche per anon, e per lui auth.uid() e' vuoto. Quindi leggere non legge
-- niente, scrivere non scrive niente, modificare e cancellare non trovano
-- nessuna riga. E TRUNCATE, l'unico che le regole non fermerebbero, dal
-- browser non e' raggiungibile: il ponte fra il sito e il database non ha
-- un comando per farlo.
--
-- ⚠️ Perche' va tolto comunque: cosi' com'e', l'unica cosa che tiene in piedi
-- il muro e' che quel comando "non e' raggiungibile". E' una difesa che
-- dipende da come e' fatto un pezzo che non e' nostro. Togliere il permesso
-- e' una riga, e il muro torna a reggersi da solo.
--
-- Chi non e' collegato non ha NESSUN motivo di toccare questa tabella: la
-- chat, in tutti e quattro i pannelli pubblici, parte solo dopo il login.
-- =====================================================================

revoke all on public.supporto_messaggi from anon;


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- Dice anche se lo stesso permesso di troppo sta su ALTRE tabelle.
-- =====================================================================
WITH an AS (
  SELECT string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS p
    FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='supporto_messaggi' AND grantee='anon'
), au AS (
  SELECT string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS p
    FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='supporto_messaggi' AND grantee='authenticated'
), altre AS (
  SELECT count(DISTINCT table_name) AS n
    FROM information_schema.role_table_grants
   WHERE table_schema='public'
     AND grantee IN ('anon','authenticated')
     AND privilege_type='TRUNCATE'
     AND table_name <> 'supporto_messaggi'
)
SELECT
  CASE
    WHEN (SELECT p FROM an) IS NOT NULL
      THEN 'NIENTE FATTO — chi non e'' collegato puo'' ancora toccare la chat. Rilancia il file tutto intero.'
    WHEN (SELECT p FROM au) IS NULL
      THEN 'ATTENZIONE — ho tolto troppo: adesso nemmeno chi e'' collegato puo'' usare la chat. Scrivimelo subito.'
    WHEN (SELECT n FROM altre) > 0
      THEN 'FATTO sulla chat — ma lo stesso permesso «svuota tutto» sta anche su altre tabelle: guarda il numero qui a fianco e mandamelo.'
    ELSE 'FATTO — chi non e'' collegato non puo'' piu'' toccare la chat, e il permesso «svuota tutto» non c''e'' su nessun''altra tabella.'
  END AS risultato,
  COALESCE((SELECT p FROM an), 'niente (giusto cosi)')  AS chi_non_e_collegato,
  COALESCE((SELECT p FROM au), 'NIENTE — e sbagliato!') AS chi_e_collegato,
  (SELECT n FROM altre)                                 AS altre_tabelle_con_svuota_tutto,
  (SELECT COUNT(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='supporto_messaggi') AS regole_ancora_al_loro_posto;
