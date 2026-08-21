-- ============================================================
-- SOLA LETTURA. Non modifica niente, non cancella niente.
-- Serve a farmi lavorare sullo schema VERO invece che a memoria.
-- Incolla tutto nel SQL Editor e premi Run. Poi mandami la schermata.
-- ============================================================

select 'A) regola di sicurezza' as tipo,
       tablename                as tabella,
       policyname               as nome,
       cmd::text                as comando,
       left(coalesce(qual,'-') || '   [WITH CHECK] ' || coalesce(with_check,'-'), 300) as dettaglio
from pg_policies
where schemaname = 'public'
  and tablename in ('preventivi','imprese','gest_clienti','gest_preventivi',
                    'gest_preventivo_righe','gest_membri')

union all

select 'B) RLS accesa?',
       c.relname,
       case when c.relrowsecurity then 'ACCESA' else '*** SPENTA ***' end,
       '', ''
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('preventivi','imprese','gest_clienti','gest_preventivi',
                    'gest_preventivo_righe','gest_membri')

union all

select 'C) colonna',
       table_name,
       column_name,
       data_type,
       'null: ' || is_nullable || '   default: ' || coalesce(column_default,'-')
from information_schema.columns
where table_schema = 'public'
  and table_name in ('preventivi','gest_clienti','gest_preventivi')

union all

select 'D) chi puo leggere cosa',
       table_name,
       grantee,
       privilege_type,
       column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('preventivi','gest_clienti')
  and grantee in ('anon','authenticated')
  and privilege_type = 'SELECT'

order by 1, 2, 3;
