-- ============================================================
-- gest-sal-fattura.sql — IL SAL SI RICORDA LA SUA FATTURA
--
-- 19 agosto 2026
--
-- PERCHE': dal SAL adesso nasce la fattura dell'acconto. Senza questa
-- colonna niente impedisce di fare DUE fatture per lo stesso stato di
-- avanzamento: due volte gli stessi soldi chiesti al committente, e nessuno
-- che se ne accorga finche' non arriva lui a dirtelo.
--
-- E' la stessa cosa che gest_computi fa gia' con preventivo_id.
--
-- "on delete set null": se la fattura finisce nel cestino, il SAL resta e
-- perde solo il collegamento. Il SAL e' un documento suo, non un pezzo
-- della fattura.
--
-- Da incollare nell'SQL Editor di Supabase. E' una migrazione sola,
-- sicura da rilanciare.
-- ============================================================

alter table public.gest_sal
  add column if not exists fattura_id uuid
    references public.gest_fatture(id) on delete set null;

create index if not exists gest_sal_fattura_idx
  on public.gest_sal (fattura_id) where fattura_id is not null;


-- ------------------------------------------------------------
-- La riga di risultato: dice se e' andata bene.
-- ------------------------------------------------------------
select
  'il SAL adesso si ricorda la fattura'                        as esito,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='gest_sal'
       and column_name='fattura_id')                           as colonna_creata_deve_essere_1,
  (select count(*) from pg_indexes
     where schemaname='public' and indexname='gest_sal_fattura_idx') as indice_creato_deve_essere_1,
  (select count(*) from public.gest_sal)                       as sal_esistenti,
  (select count(*) from public.gest_sal where fattura_id is not null) as sal_gia_fatturati;
