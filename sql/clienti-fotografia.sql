-- ============================================================
-- TrovaImpresa — LA FOTOGRAFIA DEI DUE ELENCHI CLIENTI
-- 23 agosto 2026
--
-- ⛔ NON CAMBIA NIENTE. Legge e basta. Si puo' lanciare cento volte.
--
-- PERCHE'
-- Alessio ha detto di unirli. Prima di spostare dei clienti veri bisogna
-- sapere com'e' fatto il terreno: quante righe ci sono di qua e di la',
-- quanti nomi sono gli STESSI (quelli sono i doppioni da fondere, non da
-- copiare), se gest_clienti pretende il reparto, e se nol_noleggi ha un
-- vincolo che lega cliente_id a nol_clienti — perche' quello va sciolto
-- prima, se no la migrazione si ferma a meta'.
--
-- Il confronto dei nomi e' «senza maiuscole e senza spazi ai bordi»:
-- «Rossi Costruzioni» e «rossi costruzioni » sono la stessa impresa.
--
-- Risponde con UNA RIGA. Copiala e mandamela.
-- ============================================================

with n as (
  select id, user_id, lower(btrim(coalesce(nome,''))) as chiave
    from public.nol_clienti
   where coalesce(nome,'') <> ''
     and eliminato_il is null
),
g as (
  select id, user_id, lower(btrim(coalesce(nome,''))) as chiave
    from public.gest_clienti
   where coalesce(nome,'') <> ''
),
comuni as (
  select distinct n.user_id, n.chiave
    from n join g on g.user_id = n.user_id and g.chiave = n.chiave
)
select
  (select count(*) from public.nol_clienti  where eliminato_il is null) as clienti_noleggio,
  (select count(*) from public.gest_clienti)                            as clienti_gestionale,
  (select count(*) from comuni)                                         as nomi_uguali_da_fondere,
  (select count(*) from public.nol_noleggi where cliente_id is not null) as noleggi_con_cliente_collegato,
  -- il reparto: se e' obbligatorio, ogni cliente spostato deve averne uno
  (select is_nullable from information_schema.columns
    where table_schema='public' and table_name='gest_clienti'
      and column_name='mestiere_id')                                    as reparto_puo_essere_vuoto,
  -- le colonne che gest_clienti NON ha e che servirebbero (p.iva, note...)
  (select coalesce(string_agg(c, ', ' order by c), 'nessuna') from (
     select unnest(array['piva','note','email','telefono','indirizzo']) as c
     except
     select column_name from information_schema.columns
      where table_schema='public' and table_name='gest_clienti') x)     as colonne_che_mancano_a_gest_clienti,
  -- il vincolo da sciogliere prima di spostare
  coalesce((select string_agg(conname, ', ') from pg_constraint
             where conrelid = 'public.nol_noleggi'::regclass
               and contype = 'f'
               and confrelid = 'public.nol_clienti'::regclass),
           'nessuno')                                                   as vincolo_da_sciogliere;
