-- =====================================================================
-- TrovaImpresa — ORE LAVORATE e CREDITI FORMATIVI
-- Da salvare come  sql/gest-ore-e-crediti.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 9 agosto 2026 — gli ultimi due strumenti della lista per i tecnici.
--
-- 1) gest_ore     -> quante ore sono davvero finite dentro una pratica.
--                    A fine lavoro il gestionale sa dire: "ci hai messo 40 ore,
--                    la parcella era 2.000 euro, hai lavorato a 50 euro l'ora".
--                    E' il conto che nessuno fa mai e che dice se una pratica
--                    conviene o ti sta mangiando vivo.
--                    Serve anche alle imprese: la manodopera di un cantiere.
--
-- 2) gest_crediti -> i CFP (crediti formativi professionali). Ingegneri,
--                    architetti, geometri e periti DEVONO farne ogni anno per
--                    restare iscritti all'albo, e quasi tutti perdono il conto.
--                    Solo per gli studi: le imprese non vedono la sezione.
--
-- Il gestionale funziona anche PRIMA di lanciare questo file: se le tabelle
-- non ci sono, le due sezioni lo dicono con una frase chiara invece di
-- restare a girare o di rompersi.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ORE LAVORATE su una pratica / un lavoro
-- ---------------------------------------------------------------------
-- Una riga per ogni volta che ci si mette mano: non un totale unico da
-- ricordarsi di aggiornare, che nessuno aggiorna mai.
-- lavoro_id in cascade: se la pratica sparisce, le sue ore non hanno piu'
-- senso da sole.
-- operatore_id set null: se il collaboratore viene tolto dalla squadra le
-- ore restano (sono state fatte davvero), perdono solo il nome.

create table if not exists public.gest_ore (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id)             on delete cascade,
  mestiere_id  uuid          references public.gest_mestieri(id)   on delete cascade,
  lavoro_id    uuid not null references public.gest_lavori(id)     on delete cascade,
  operatore_id uuid          references public.gest_operatori(id)  on delete set null,

  data         date not null default current_date,
  ore          numeric(6,2) not null default 0,
  nota         text,
  created_at   timestamptz not null default now()
);

create index if not exists gest_ore_user_idx   on public.gest_ore (user_id, mestiere_id);
create index if not exists gest_ore_lavoro_idx on public.gest_ore (lavoro_id);


-- ---------------------------------------------------------------------
-- 2. CREDITI FORMATIVI (CFP)
-- ---------------------------------------------------------------------
-- Non c'e' mestiere_id: l'obbligo formativo e' della PERSONA iscritta
-- all'albo, non del reparto. I corsi si vedono uguali da tutti i reparti.

create table if not exists public.gest_crediti (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  titolo      text not null,           -- "Aggiornamento sicurezza 40 ore"
  ente        text,                    -- "Ordine Ingegneri di Rieti", "CNAPPC"
  data        date not null default current_date,
  crediti     numeric(6,2) not null default 0,
  tipo        text,                    -- "Deontologia", "Sicurezza", "Aggiornamento"
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists gest_crediti_user_idx on public.gest_crediti (user_id, data);


-- ---------------------------------------------------------------------
-- 3. Obiettivo annuo di crediti (sta nei Dati azienda dello studio)
-- ---------------------------------------------------------------------
-- Di norma 30 CFP l'anno per ingegneri e architetti, 20 per i geometri:
-- ognuno mette il suo, il gestionale non decide al posto suo.

alter table public.gest_azienda
  add column if not exists cfp_obiettivo integer default 30;


-- ---------------------------------------------------------------------
-- 4. RLS — ognuno vede solo la propria roba
-- ---------------------------------------------------------------------
alter table public.gest_ore     enable row level security;
alter table public.gest_crediti enable row level security;

drop policy if exists "gest_ore_own" on public.gest_ore;
create policy "gest_ore_own" on public.gest_ore
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- I crediti formativi sono un fatto personale: nessun collaboratore li vede.
drop policy if exists "gest_crediti_own" on public.gest_crediti;
create policy "gest_crediti_own" on public.gest_crediti
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- VERIFICA (facoltativa)
-- ---------------------------------------------------------------------
-- select count(*) from public.gest_ore;      -- deve dare 0
-- select count(*) from public.gest_crediti;  -- deve dare 0
