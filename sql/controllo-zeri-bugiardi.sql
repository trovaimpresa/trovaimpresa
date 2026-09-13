-- sql/controllo-zeri-bugiardi.sql
-- 13 settembre 2026 — IL CONTROLLO DEGLI ZERI BUGIARDI
--
-- ============================================================
-- PERCHE' ESISTE
-- In un giorno solo sono usciti TRE guasti, e tutti e tre erano MUTI:
--   1. il contatore dei pannelli non scriveva da una settimana
--   2. un UPDATE rispondeva «0 righe» invece di dare errore
--   3. la casella «Schede aperte dai clienti» diceva 0 mentre la
--      sezione Ricerche ne mostrava 59
--
-- La causa e' sempre la stessa forma: una tabella ha RLS acceso, ha il
-- PERMESSO TECNICO di lettura (GRANT SELECT a anon/authenticated), ma
-- NON ha nessuna REGOLA di lettura (policy SELECT).
--
-- In quel caso il browser NON riceve un errore: riceve ZERO RIGHE.
-- E uno zero sembra un dato. E' la bugia piu' difficile da vedere.
--
-- Stessa cosa per UPDATE e DELETE: per cambiare una riga bisogna prima
-- VEDERLA. Senza regola di lettura, l'UPDATE tocca 0 righe e non dice
-- niente. E' esattamente com'e' morto il contatore dei pannelli.
--
-- ============================================================
-- COME SI LEGGE IL RISULTATO
-- Una tabella in questo elenco NON e' per forza un guasto: se nessuna
-- pagina la legge dal browser, non fa danno. Diventa un guasto nel
-- momento in cui qualcuno ci scrive sopra un `.from('tabella')`.
-- Quindi: elenco + controllo nei file = guasti veri.
--
-- DA RIFARE: dopo ogni tabella nuova, e ogni volta che si tocca RLS.
-- ============================================================


-- ============================================================
-- PROVA 1 — chi puo' rispondere ZERO invece di dare errore
-- (RLS acceso + GRANT SELECT + NESSUNA policy SELECT)
-- ============================================================
with t as (
  select c.oid, c.relname nome, c.relrowsecurity rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
), p as (
  select tablename,
    count(*) filter (where cmd in ('SELECT','ALL')) sel,
    count(*) filter (where cmd in ('INSERT','ALL')) ins,
    count(*) filter (where cmd in ('UPDATE','ALL')) upd
  from pg_policies where schemaname = 'public' group by tablename
), g as (
  select table_name,
    bool_or(grantee in ('anon','authenticated') and privilege_type = 'SELECT') puo_select
  from information_schema.role_table_grants
  where table_schema = 'public' group by table_name
)
select t.nome, coalesce(p.ins,0) policy_insert, coalesce(p.upd,0) policy_update
from t
left join p on p.tablename = t.nome
left join g on g.table_name = t.nome
where t.rls and coalesce(p.sel,0) = 0 and coalesce(g.puo_select,false)
order by t.nome;


-- ============================================================
-- PROVA 2 — chi puo' FALLIRE UNA MODIFICA IN SILENZIO
-- (regola di scrittura SI, regola di lettura NO → tocca 0 righe)
-- E' il guasto esatto di accessi_pannello, 6-13 settembre 2026.
-- ============================================================
with p as (
  select tablename,
    count(*) filter (where cmd in ('SELECT','ALL')) sel,
    count(*) filter (where cmd in ('UPDATE','ALL')) upd,
    count(*) filter (where cmd in ('DELETE','ALL')) del
  from pg_policies where schemaname = 'public' group by tablename
)
select c.relname tabella, coalesce(p.upd,0) policy_update, coalesce(p.del,0) policy_delete
from pg_class c join pg_namespace n on n.oid = c.relnamespace
left join p on p.tablename = c.relname
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and coalesce(p.sel,0) = 0
  and (coalesce(p.upd,0) > 0 or coalesce(p.del,0) > 0)
order by 1;


-- ============================================================
-- RISULTATO DEL 13 SETTEMBRE 2026
--
-- PROVA 1 — 12 tabelle possono rispondere zero:
--   visite_clienti (71 righe) · richieste_clienti (14) · messaggi (13)
--   iscrizioni_provenienza (13) · template_voci_lavoro (9)
--   admin_email_inviate (8) · come_ci_hanno_trovato (4)
--   lead_imprese (0) · negozi (0) · errori_trigger (0)
--   zz_doppioni_richieste_20260906 · zz_recensioni_dismessa
--
-- PROVA 2 — NESSUNA. (accessi_pannello era l'unica, sistemata la
--   mattina del 13 set: vedi sql/accessi-pannello-select.sql)
--
-- CONTROLLO NEI FILE — cercato `.from('tabella')` e `rest/v1/tabella?`
--   in 34 file fra pagine e script: ZERO letture dal browser su quelle
--   12 tabelle. L'unica che c'era (visite_clienti in admin.html) e'
--   stata tolta il 13 set: adesso quel numero passa da admin-ricerche.
--
-- ⚠️ Il controllo nei file ha guardato i file raggiungibili quel
--    giorno, non tutti: se un domani qualcuno scrive un `.from()` su
--    una di quelle 12, il guasto rinasce identico e senza rumore.
-- ============================================================
