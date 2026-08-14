-- =====================================================================
-- TrovaImpresa — I DUE BUCHI NELLO SCHEMA
-- Da salvare come  sql/gest-buchi-schema.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 14 agosto 2026 (notte)
--
-- ---------------------------------------------------------------------
-- PERCHÉ ESISTE QUESTO FILE
-- ---------------------------------------------------------------------
-- Sul database di Alessio queste due cose ci sono già: il gestionale le
-- usa tutti i giorni e funziona. Il problema non è oggi — è che **nei file
-- di `sql/` non ci sono**, e quei file sono la fonte di verità dello
-- schema.
--
-- Vuol dire che chi rifacesse il database da zero coi file del repo si
-- ritroverebbe un gestionale che si apre e poi dà errore appena tocchi la
-- sezione sbagliata. È il tipo di buco che non si vede finché non serve, e
-- quando serve è di solito il momento peggiore (un ripristino, un secondo
-- ambiente, un trasloco).
--
-- Non cambia niente a chi il database ce l'ha già: è tutto
-- "if not exists".
--
--   1. gest_mezzi.tipo      — il codice la scrive e la legge
--                             (mezzo / attrezzatura), ma né
--                             gestionale-mezzi.sql né
--                             gestionale-mezzi-allinea.sql la creano.
--                             Senza, «+ Nuovo strumento» dà errore 42703.
--
--   2. gest_richieste       — la tabella di «Chiedi una funzione».
--                             Non compare in NESSUN file di sql/.
--                             Colonne prese da come il gestionale la usa
--                             davvero: insert {user_id, email, testo},
--                             select {id, testo, stato, risposta,
--                             created_at}.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LA COLONNA «tipo» DEI MEZZI
-- ---------------------------------------------------------------------
-- 'mezzo'        = furgoni, betoniere, ponteggi (sezione Mezzi)
-- 'attrezzatura' = stazione totale, distanziometro (sezione Attrezzature,
--                  che per gli studi tecnici si chiama «Strumenti»)
--
-- Il default è 'mezzo': le righe già scritte prima che la colonna
-- esistesse sono mezzi, perché la sezione Attrezzature è arrivata dopo.

alter table public.gest_mezzi
  add column if not exists tipo text not null default 'mezzo';

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'gest_mezzi_tipo_ok'
                    and conrelid = 'public.gest_mezzi'::regclass) then
    alter table public.gest_mezzi
      add constraint gest_mezzi_tipo_ok check (tipo in ('mezzo','attrezzatura'));
  end if;
end$$;

create index if not exists gest_mezzi_tipo_idx
  on public.gest_mezzi (user_id, mestiere_id, tipo);


-- ---------------------------------------------------------------------
-- 2. LA TABELLA DELLE RICHIESTE
-- ---------------------------------------------------------------------
-- «Chiedi una funzione»: l'utente scrive cosa gli serve, Alessio risponde.
-- L'email si salva sulla riga (e non si va a prenderla da auth.users ogni
-- volta) perché serve a rispondere anche se un domani l'account cambia
-- indirizzo o viene chiuso.

create table if not exists public.gest_richieste (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  email      text,
  testo      text not null default '',
  stato      text not null default 'nuova',   -- nuova | vista | fatta | no
  risposta   text,
  created_at timestamptz not null default now()
);

-- se una versione precedente esisteva senza qualcuna di queste colonne
alter table public.gest_richieste add column if not exists email      text;
alter table public.gest_richieste add column if not exists stato      text not null default 'nuova';
alter table public.gest_richieste add column if not exists risposta   text;
alter table public.gest_richieste add column if not exists created_at timestamptz not null default now();

create index if not exists gest_richieste_user_idx
  on public.gest_richieste (user_id, created_at desc);

-- --- il lucchetto: ognuno vede e scrive solo le proprie richieste ---
-- La RISPOSTA la scrive Alessio dall'amministrazione, che passa da un'altra
-- strada (service key) e non è soggetta a queste regole. Qui l'utente può
-- solo creare e leggere: se potesse modificare, si riscriverebbe da solo la
-- risposta o lo stato.
grant select, insert on public.gest_richieste to authenticated;

alter table public.gest_richieste enable row level security;

drop policy if exists "gest_richieste_own_read"   on public.gest_richieste;
create policy "gest_richieste_own_read" on public.gest_richieste
  for select using (auth.uid() = user_id);

drop policy if exists "gest_richieste_own_insert" on public.gest_richieste;
create policy "gest_richieste_own_insert" on public.gest_richieste
  for insert with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- VERIFICA — deve dare due righe, tutte e due con «c'è»
-- ---------------------------------------------------------------------
select 'gest_mezzi.tipo' as cosa,
       case when exists (select 1 from information_schema.columns
                          where table_schema='public' and table_name='gest_mezzi'
                            and column_name='tipo') then 'c''è' else 'MANCA' end as esito
union all
select 'tabella gest_richieste',
       case when exists (select 1 from information_schema.tables
                          where table_schema='public' and table_name='gest_richieste')
            then 'c''è' else 'MANCA' end;
