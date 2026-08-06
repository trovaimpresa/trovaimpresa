-- ============================================================
-- Gestionale Negozio: I PREVENTIVI (6 agosto 2026)
--
-- Mancavano del tutto: una rivendita fa offerte alle imprese tutti i giorni,
-- e finora nel gestionale non c'era modo di scriverne una.
--
-- Due tabelle, come per i preventivi delle imprese:
--   neg_preventivi        -> la testata (cliente, data, validita, note, totali)
--   neg_preventivo_righe  -> le voci (prodotto, quantita, prezzo, sconto)
--
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
-- ============================================================

create table if not exists public.neg_preventivi (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  numero          integer,
  titolo          text,
  cliente_id      uuid,                  -- gest_clienti.id (facoltativo)
  cliente_nome    text,                  -- se il cliente non e' in anagrafica
  data            date default current_date,
  validita_giorni integer default 30,    -- i prezzi dei materiali cambiano
  note            text,
  stato           text default 'bozza',  -- bozza | inviato | accettato | rifiutato
  iva_perc        numeric(5,2) default 22,
  sconto_perc     numeric(5,2) default 0,-- sconto generale sul totale
  created_at      timestamptz not null default now()
);

create table if not exists public.neg_preventivo_righe (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  preventivo_id  uuid not null references public.neg_preventivi(id) on delete cascade,
  prodotto_id    uuid,                   -- neg_prodotti.id se preso dal magazzino
  descrizione    text not null,
  unita          text default 'pz',
  qta            numeric(12,3) default 1,
  prezzo         numeric(12,2) default 0,
  sconto_perc    numeric(5,2)  default 0,
  ordine         integer default 0,
  created_at     timestamptz not null default now()
);

create index if not exists neg_preventivi_user_idx on public.neg_preventivi(user_id, created_at desc);
create index if not exists neg_prev_righe_prev_idx on public.neg_preventivo_righe(preventivo_id, ordine);

-- ---------------------------------------------------------------------
-- RLS: ognuno vede e scrive solo la propria roba.
-- Stesso schema delle altre tabelle gest_/neg_.
-- ---------------------------------------------------------------------
alter table public.neg_preventivi        enable row level security;
alter table public.neg_preventivo_righe  enable row level security;

drop policy if exists "neg_preventivi propri" on public.neg_preventivi;
create policy "neg_preventivi propri" on public.neg_preventivi
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "neg_prev_righe proprie" on public.neg_preventivo_righe;
create policy "neg_prev_righe proprie" on public.neg_preventivo_righe
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Controllo finale
select table_name, count(*) as colonne
from information_schema.columns
where table_schema='public' and table_name in ('neg_preventivi','neg_preventivo_righe')
group by table_name;
