-- ============================================================
-- TrovaImpresa — Scheda persona completa (gest_operatori)
-- Aggiunge mansione, costo orario, documenti di sicurezza e anagrafica.
-- Da eseguire una volta sola su Supabase (SQL Editor).
-- Non tocca i dati esistenti: aggiunge solo colonne nuove, vuote.
-- ============================================================

alter table public.gest_operatori
  -- lavoro
  add column if not exists mansione     text,
  add column if not exists costo_orario numeric(10,2),

  -- documenti e sicurezza (le scadenze generano gli avvisi nella scheda)
  add column if not exists visita_medica_scadenza date,
  add column if not exists formazione_scadenza    date,
  add column if not exists attestati              text,
  add column if not exists documento_numero       text,
  add column if not exists documento_scadenza     date,
  add column if not exists permesso_scadenza      date,

  -- anagrafica e contratto
  add column if not exists data_nascita       date,
  add column if not exists codice_fiscale     text,
  add column if not exists email              text,
  add column if not exists data_assunzione    date,
  add column if not exists tipo_contratto     text,
  add column if not exists emergenza_nome     text,
  add column if not exists emergenza_telefono text;

-- Ricerca veloce per mansione
create index if not exists gest_operatori_mansione_idx on public.gest_operatori(mansione);

-- Controllo: elenca le colonne della tabella dopo la modifica
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'gest_operatori'
order by ordinal_position;
