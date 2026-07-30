-- ============================================================
-- TrovaImpresa — GESTIONALE MEZZI: ALLINEAMENTO DELLO SCHEMA
--
-- Da eseguire se su Supabase e' stata lanciata una versione di
-- sql/gestionale-mezzi.sql diversa da quella nel repo (colonne o
-- vista con nomi differenti).
--
-- Porta il database ESATTAMENTE a quello che legge gestionale-app.html:
--   gest_mezzi         -> id, user_id, mestiere_id, nome, categoria, targa, stato, note
--   gest_lavoro_mezzi  -> id, user_id, lavoro_id, mezzo_id
--   gest_scadenze      -> + mezzo_id
--   gest_mezzi_scadenze (vista) -> mezzo_id, user_id, mestiere_id, nome,
--        categoria, targa, stato, aperte, scadute, prossima_data,
--        prossimo_titolo, prossimo_tipo
--
-- GARANZIE:
--   * NESSUN drop di tabella, nessuna riga cancellata.
--   * Solo "add column if not exists": le colonne che ci sono non
--     vengono toccate.
--   * E' idempotente: si puo' rieseguire quante volte si vuole.
--   * Gira in un'unica transazione: se qualcosa fallisce non resta
--     applicato niente a metà.
--
-- ATTENZIONE 1 — la vista viene ricreata con DROP + CREATE, non con
--   CREATE OR REPLACE: Postgres non permette di RINOMINARE le colonne
--   di una vista con "create or replace" (errore "cannot change name
--   of view column"). Droppare una VISTA non perde dati: e' solo una
--   query salvata.
--
-- ATTENZIONE 2 — i valori di gest_mezzi.categoria e gest_mezzi.stato
--   vengono NORMALIZZATI ai valori che usa il frontend (vedi sotto).
--   Se la versione lanciata usava altre parole (es. stato 'attivo'),
--   quelle righe vengono riscritte, altrimenti il CHECK non si può
--   aggiungere e l'app non riuscirebbe a salvare.
-- ============================================================


-- ============================================================
-- 1. TABELLA gest_mezzi — colonne
-- ============================================================

create table if not exists public.gest_mezzi (
  id uuid primary key default gen_random_uuid()
);

-- Le colonne mancanti si aggiungono una per una. Se ci sono già,
-- "if not exists" le lascia esattamente come sono.
alter table public.gest_mezzi add column if not exists id          uuid not null default gen_random_uuid();
alter table public.gest_mezzi add column if not exists user_id     uuid references auth.users(id) on delete cascade;
alter table public.gest_mezzi add column if not exists mestiere_id uuid references public.gest_mestieri(id) on delete cascade;
alter table public.gest_mezzi add column if not exists nome        text;
alter table public.gest_mezzi add column if not exists categoria   text default 'mezzo';
alter table public.gest_mezzi add column if not exists targa       text;
alter table public.gest_mezzi add column if not exists stato       text default 'disponibile';
alter table public.gest_mezzi add column if not exists note        text;
alter table public.gest_mezzi add column if not exists created_at  timestamptz not null default now();

-- chiave primaria su id, solo se la tabella non ne ha già una
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gest_mezzi'::regclass and contype = 'p'
  ) then
    alter table public.gest_mezzi add primary key (id);
  end if;
end $$;


-- ============================================================
-- 2. TABELLA gest_mezzi — normalizzazione valori + vincoli
-- ============================================================

-- Il frontend scrive SOLO 'mezzo' | 'attrezzatura'.
update public.gest_mezzi set categoria = 'attrezzatura'
  where lower(coalesce(categoria,'')) in ('attrezzo','attrezzi','utensile','utensili','attrezzatura');
update public.gest_mezzi set categoria = 'mezzo'
  where categoria is null or categoria not in ('mezzo','attrezzatura');

-- Il frontend scrive SOLO 'disponibile' | 'in_uso' | 'manutenzione' | 'fuori_uso'.
update public.gest_mezzi set stato = 'in_uso'
  where lower(coalesce(stato,'')) in ('in uso','occupato','impegnato','in_cantiere');
update public.gest_mezzi set stato = 'manutenzione'
  where lower(coalesce(stato,'')) in ('in manutenzione','in_manutenzione','riparazione','officina');
update public.gest_mezzi set stato = 'fuori_uso'
  where lower(coalesce(stato,'')) in ('fuori uso','fuori_servizio','guasto','dismesso','rottamato','venduto');
update public.gest_mezzi set stato = 'disponibile'
  where stato is null or stato not in ('disponibile','in_uso','manutenzione','fuori_uso');

-- nome e' obbligatorio nel form: le righe eventualmente senza nome
-- vanno riempite, altrimenti il NOT NULL non si può mettere.
update public.gest_mezzi set nome = 'Mezzo senza nome' where nome is null or btrim(nome) = '';

-- I CHECK vengono rifatti da zero: se la versione lanciata ne aveva
-- di diversi (altri valori ammessi) l'app non riuscirebbe a salvare.
alter table public.gest_mezzi drop constraint if exists gest_mezzi_categoria_chk;
alter table public.gest_mezzi add  constraint gest_mezzi_categoria_chk
  check (categoria in ('mezzo','attrezzatura'));

alter table public.gest_mezzi drop constraint if exists gest_mezzi_stato_chk;
alter table public.gest_mezzi add  constraint gest_mezzi_stato_chk
  check (stato in ('disponibile','in_uso','manutenzione','fuori_uso'));

-- NOT NULL solo dove i dati lo permettono: se una colonna contiene
-- ancora NULL si salta con un avviso invece di far fallire tutto.
do $$
begin
  if exists (select 1 from public.gest_mezzi where user_id is null) then
    raise notice 'gest_mezzi.user_id contiene NULL: NOT NULL non applicato';
  else
    alter table public.gest_mezzi alter column user_id set not null;
  end if;

  if exists (select 1 from public.gest_mezzi where nome is null) then
    raise notice 'gest_mezzi.nome contiene NULL: NOT NULL non applicato';
  else
    alter table public.gest_mezzi alter column nome set not null;
  end if;

  if exists (select 1 from public.gest_mezzi where categoria is null) then
    raise notice 'gest_mezzi.categoria contiene NULL: NOT NULL non applicato';
  else
    alter table public.gest_mezzi alter column categoria set not null;
  end if;

  if exists (select 1 from public.gest_mezzi where stato is null) then
    raise notice 'gest_mezzi.stato contiene NULL: NOT NULL non applicato';
  else
    alter table public.gest_mezzi alter column stato set not null;
  end if;
end $$;

create index if not exists gest_mezzi_user_idx     on public.gest_mezzi(user_id);
create index if not exists gest_mezzi_mestiere_idx on public.gest_mezzi(mestiere_id);

-- RLS: il pannello scrive con la chiave anon + sessione utente, quindi
-- la policy owner_all e' l'unica cosa che permette insert/update/delete.
alter table public.gest_mezzi enable row level security;
drop policy if exists "owner_all" on public.gest_mezzi;
create policy "owner_all" on public.gest_mezzi
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ============================================================
-- 3. TABELLA gest_lavoro_mezzi
-- ============================================================

create table if not exists public.gest_lavoro_mezzi (
  id uuid primary key default gen_random_uuid()
);

alter table public.gest_lavoro_mezzi add column if not exists id         uuid not null default gen_random_uuid();
alter table public.gest_lavoro_mezzi add column if not exists user_id    uuid references auth.users(id) on delete cascade;
alter table public.gest_lavoro_mezzi add column if not exists lavoro_id  uuid references public.gest_lavori(id) on delete cascade;
alter table public.gest_lavoro_mezzi add column if not exists mezzo_id   uuid references public.gest_mezzi(id) on delete cascade;
alter table public.gest_lavoro_mezzi add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gest_lavoro_mezzi'::regclass and contype = 'p'
  ) then
    alter table public.gest_lavoro_mezzi add primary key (id);
  end if;
end $$;

do $$
begin
  if exists (select 1 from public.gest_lavoro_mezzi where user_id is null) then
    raise notice 'gest_lavoro_mezzi.user_id contiene NULL: NOT NULL non applicato';
  else
    alter table public.gest_lavoro_mezzi alter column user_id set not null;
  end if;

  if exists (select 1 from public.gest_lavoro_mezzi where lavoro_id is null) then
    raise notice 'gest_lavoro_mezzi.lavoro_id contiene NULL: NOT NULL non applicato';
  else
    alter table public.gest_lavoro_mezzi alter column lavoro_id set not null;
  end if;

  if exists (select 1 from public.gest_lavoro_mezzi where mezzo_id is null) then
    raise notice 'gest_lavoro_mezzi.mezzo_id contiene NULL: NOT NULL non applicato';
  else
    alter table public.gest_lavoro_mezzi alter column mezzo_id set not null;
  end if;
end $$;

-- Lo stesso mezzo non si aggiunge due volte allo stesso lavoro.
-- Se ci sono già dei doppioni l'indice unico non si può creare:
-- in quel caso si avvisa invece di far fallire lo script.
do $$
begin
  create unique index if not exists gest_lavoro_mezzi_uniq
    on public.gest_lavoro_mezzi(lavoro_id, mezzo_id);
exception when unique_violation or duplicate_table then
  raise notice 'gest_lavoro_mezzi: ci sono righe duplicate (lavoro_id, mezzo_id), indice unico non creato';
end $$;

create index if not exists gest_lavoro_mezzi_mezzo_idx on public.gest_lavoro_mezzi(mezzo_id);

alter table public.gest_lavoro_mezzi enable row level security;
drop policy if exists "owner_all" on public.gest_lavoro_mezzi;
create policy "owner_all" on public.gest_lavoro_mezzi
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ============================================================
-- 4. gest_scadenze.mezzo_id
-- ============================================================
-- Revisione, bollo, tagliando, assicurazione vivono nello scadenzario
-- che già c'e': serve solo il riferimento al mezzo (facoltativo).

alter table public.gest_scadenze
  add column if not exists mezzo_id uuid references public.gest_mezzi(id) on delete set null;

create index if not exists gest_scadenze_mezzo_idx on public.gest_scadenze(mezzo_id);


-- ============================================================
-- 5. VISTA gest_mezzi_scadenze — nomi colonne allineati al codice
-- ============================================================
-- gestionale-app.html fa:
--   .select("mezzo_id,aperte,scadute,prossima_data,prossimo_titolo,prossimo_tipo")
--   .eq("user_id", sbUid)
-- PostgREST risponde 400 se manca UNA SOLA di queste colonne, quindi i
-- nomi devono essere esattamente questi.
--
-- security_invoker = true e' obbligatorio: senza, la vista girerebbe con
-- i permessi di chi l'ha creata e mostrerebbe i mezzi di TUTTI gli utenti.

drop view if exists public.gest_mezzi_scadenze;

create view public.gest_mezzi_scadenze
with (security_invoker = true) as
select
  m.id          as mezzo_id,
  m.user_id     as user_id,
  m.mestiere_id as mestiere_id,
  m.nome        as nome,
  m.categoria   as categoria,
  m.targa       as targa,
  m.stato       as stato,
  -- scadenze non ancora chiuse
  count(s.id) filter (
    where s.stato is distinct from 'fatta'
  )::int as aperte,
  -- di cui già oltre la data
  count(s.id) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza < current_date
  )::int as scadute,
  -- la prossima in arrivo (da oggi compreso)
  min(s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ) as prossima_data,
  (array_agg(s.titolo order by s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ))[1] as prossimo_titolo,
  (array_agg(s.tipo_pratica order by s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ))[1] as prossimo_tipo
from public.gest_mezzi m
left join public.gest_scadenze s
  on s.mezzo_id = m.id and s.user_id = m.user_id
group by m.id, m.user_id, m.mestiere_id, m.nome, m.categoria, m.targa, m.stato;

grant select on public.gest_mezzi_scadenze to authenticated;


-- ============================================================
-- 6. VERIFICA — deve stampare le colonne attese
-- ============================================================
-- gest_lavoro_mezzi : id, user_id, lavoro_id, mezzo_id, created_at
-- gest_mezzi        : id, user_id, mestiere_id, nome, categoria, targa,
--                     stato, note, created_at
-- gest_mezzi_scadenze: mezzo_id, user_id, mestiere_id, nome, categoria,
--                     targa, stato, aperte, scadute, prossima_data,
--                     prossimo_titolo, prossimo_tipo

select table_name, string_agg(column_name, ', ' order by ordinal_position) as colonne
from information_schema.columns
where table_schema = 'public'
  and table_name in ('gest_mezzi','gest_lavoro_mezzi','gest_mezzi_scadenze')
group by table_name
order by table_name;


-- Secondo controllo: cerca colonne IN PIU' che bloccherebbero l'insert.
-- Se la versione lanciata su Supabase ha aggiunto una sua colonna
-- "not null" SENZA default, il frontend non la compila e l'insert
-- fallirebbe comunque. Questa query le elenca: se stampa qualcosa,
-- serve un default (o togliere il not null) su quelle colonne.
--
-- Deve restituire ZERO righe.

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and is_nullable = 'NO'
  and column_default is null
  and (
    (table_name = 'gest_mezzi'
      and column_name not in ('id','user_id','mestiere_id','nome','categoria','targa','stato','note','created_at'))
    or
    (table_name = 'gest_lavoro_mezzi'
      and column_name not in ('id','user_id','lavoro_id','mezzo_id','created_at'))
  )
order by table_name, ordinal_position;
