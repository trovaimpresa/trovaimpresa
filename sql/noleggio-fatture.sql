-- ============================================================
-- TrovaImpresa — LE FATTURE DEL NOLEGGIO
-- 23 agosto 2026
--
-- PERCHE'
-- Oggi il noleggio sa quanto costa un noleggio e se e' stato pagato, ma
-- la fattura non esiste. E la sezione «Fatture» che c'e' adesso guarda i
-- LAVORI del gestionale imprese: un'altra cosa.
--
-- ⛔ E' il pezzo che i DDT e i verbali di ieri hanno sbloccato. Con il
--    documento di trasporto per ogni uscita, la legge permette la
--    FATTURA DIFFERITA RIEPILOGATIVA (art. 21 c.4 lett. a DPR 633/72):
--    una fattura sola al mese per cliente, emessa entro il 15 del mese
--    dopo, invece di una per ogni uscita. Con venti noleggi al mese sono
--    diciannove fatture in meno da fare.
--
-- ⚠️ I RATEI. Un noleggio che parte il 25 di marzo e rientra il 6 di
--    aprile non sta tutto in un mese. La fattura di marzo prende solo i
--    giorni di marzo, quella di aprile il resto: e' la pagina a fare il
--    conto, ma le righe si salvano qui dentro, cosi' fra un anno si sa
--    esattamente cosa era stato fatturato e come.
--
-- COSA AGGIUNGE
--   1. la tabella nol_fatture (con il cestino, come tutto il resto);
--   2. nol_noleggi.fattura_id — a quale fattura e' finito quel noleggio,
--      cosi' non lo si fattura due volte;
--   3. gest_azienda.num_fattura — il contatore, accanto a quello dei DDT.
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE DI QUELLO CHE C'E'.
-- ⛔ SI PUO' RILANCIARE quante volte si vuole.
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

create table if not exists public.nol_fatture (
  id           uuid primary key default gen_random_uuid(),
  -- ⛔ col vincolo verso gli utenti: se un account sparisce, le sue
  --    fatture spariscono con lui invece di restare orfane in giro
  user_id      uuid not null references auth.users(id) on delete cascade,
  cliente_id   uuid,
  -- il nome scritto: se domani il cliente cambia ragione sociale, la
  -- fattura vecchia deve restare com'era
  cliente      text,
  numero       text,
  data         date,
  -- il periodo riepilogato: «marzo 2026» sono questi due giorni
  periodo_dal  date,
  periodo_al   date,
  -- le righe, come sono state calcolate quel giorno:
  -- [{"noleggio_id":"...","voce":"Noleggio Escavatore 3t","dettaglio":"dal 01/03 al 12/03 — 12 giorni",
  --   "giorni":12,"importo":1200}, ...]
  righe        jsonb not null default '[]'::jsonb,
  imponibile   numeric not null default 0,
  iva_perc     numeric not null default 22,
  iva          numeric not null default 0,
  totale       numeric not null default 0,
  -- bozza = ancora modificabile · emessa = ha un numero · pagata = incassata
  stato        text not null default 'bozza',
  pagata_il    date,
  note         text,
  created_at   timestamptz default now(),
  eliminato_il timestamptz
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_fatture_cliente_fk') then
    alter table public.nol_fatture
      add constraint nol_fatture_cliente_fk
      foreign key (cliente_id) references public.gest_clienti(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nol_fatture_stato_ck') then
    alter table public.nol_fatture
      add constraint nol_fatture_stato_ck check (stato in ('bozza','emessa','pagata'));
  end if;
end $$;

create index if not exists nol_fatture_user_idx    on public.nol_fatture(user_id, data desc);
create index if not exists nol_fatture_cestino_idx on public.nol_fatture(user_id, eliminato_il)
  where eliminato_il is not null;

-- 2. a quale fattura e' finito un noleggio.
-- ⚠️ «on delete set null»: se si butta la fattura, i noleggi tornano
--    liberi di essere fatturati, non spariscono con lei.
alter table public.nol_noleggi
  add column if not exists fattura_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_noleggi_fattura_fk') then
    alter table public.nol_noleggi
      add constraint nol_noleggi_fattura_fk
      foreign key (fattura_id) references public.nol_fatture(id) on delete set null;
  end if;
end $$;

create index if not exists nol_noleggi_fattura_idx on public.nol_noleggi(user_id, fattura_id);

-- 3. il contatore delle fatture, accanto a quello dei DDT
alter table public.gest_azienda
  add column if not exists num_fattura integer not null default 1;


-- ------------------------------------------------------------
-- IL LUCCHETTO: ognuno vede e tocca solo la sua roba
-- ------------------------------------------------------------
alter table public.nol_fatture enable row level security;

drop policy if exists "nol_fatture_select" on public.nol_fatture;
drop policy if exists "nol_fatture_insert" on public.nol_fatture;
drop policy if exists "nol_fatture_update" on public.nol_fatture;
drop policy if exists "nol_fatture_delete" on public.nol_fatture;

create policy "nol_fatture_select" on public.nol_fatture
  for select to authenticated using (user_id = auth.uid());
create policy "nol_fatture_insert" on public.nol_fatture
  for insert to authenticated with check (user_id = auth.uid());
create policy "nol_fatture_update" on public.nol_fatture
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "nol_fatture_delete" on public.nol_fatture
  for delete to authenticated using (user_id = auth.uid());

-- ------------------------------------------------------------
-- IL LUCCHETTO DEL PIANO, lo stesso delle altre sette tabelle.
-- ⛔ Non se ne scrive uno nuovo: si attacca quello che c'e' gia'.
--    Se la funzione non c'e', qui ci si ferma invece di lasciare mezzo
--    lavoro fatto (esegui prima sql/lucchetto-piano-gestionale.sql).
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_proc p
                   join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'gest_blocco_piano') then
    raise exception
      'Manca la funzione gest_blocco_piano(): esegui prima sql/lucchetto-piano-gestionale.sql.';
  end if;
  drop trigger if exists trg_gest_piano on public.nol_fatture;
  create trigger trg_gest_piano before insert or update or delete on public.nol_fatture
    for each row execute function public.gest_blocco_piano('user_id');
end $$;


-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA
-- tabella=1 · regole=4 · lucchetto_piano=1 · collegamento=1 · contatore=1
-- ------------------------------------------------------------
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='nol_fatture')          as tabella,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='nol_fatture')             as regole,
  (select count(*) from pg_trigger g
     join pg_class c on c.oid = g.tgrelid
    where c.relname='nol_fatture' and g.tgname='trg_gest_piano'
      and not g.tgisinternal)                                          as lucchetto_piano,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='fattura_id')                                    as collegamento,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='gest_azienda'
      and column_name='num_fattura')                                   as contatore;
