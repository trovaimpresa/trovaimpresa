-- ============================================================
-- conteggio-visite.sql
-- Conta chi arriva davvero sul sito, senza cookie e senza pixel.
--
-- PERCHE': il pixel di Meta parte solo dopo "Accetta tutti" sul
-- banner dei cookie, quindi Meta vede solo una parte delle persone
-- (326 su 854 clic pagati). Questa tabella le conta tutte.
--
-- Due righe per ogni apertura di pagina:
--   fase = 'arrivo' -> il browser ha eseguito lo script
--   fase = 'visto'  -> la pagina si e' disegnata e la persona era
--                      ancora li' dopo 2 secondi
-- arrivo - visto = quanti se ne vanno prima di vedere il sito.
--
-- Da incollare nell'SQL Editor di Supabase. E' una migrazione sola.
-- ============================================================

create table if not exists public.visite_sito (
  id           bigint generated always as identity primary key,
  creato_il    timestamptz not null default now(),
  fase         text        not null default 'arrivo',
  pagina       text,
  da_meta      boolean     not null default false,
  fbclid       text,
  utm_source   text,
  utm_campaign text,
  provenienza  text,
  telefono     boolean,
  larghezza    int,
  ms_attesa    int,
  sessione     text,
  agente       text,
  constraint visite_sito_fase_ok
    check (fase in ('arrivo', 'visto')),
  -- nessuno deve poter riempire il database con testi lunghi
  constraint visite_sito_misure_ok check (
    coalesce(length(pagina), 0)       <= 200 and
    coalesce(length(fbclid), 0)       <= 300 and
    coalesce(length(utm_source), 0)   <= 100 and
    coalesce(length(utm_campaign), 0) <= 100 and
    coalesce(length(provenienza), 0)  <= 120 and
    coalesce(length(sessione), 0)     <= 60  and
    coalesce(length(agente), 0)       <= 200
  ),
  constraint visite_sito_larghezza_ok
    check (larghezza is null or (larghezza > 0 and larghezza < 20000)),
  constraint visite_sito_attesa_ok
    check (ms_attesa is null or (ms_attesa >= 0 and ms_attesa < 3600000))
);

create index if not exists visite_sito_creato_idx
  on public.visite_sito (creato_il desc);

create index if not exists visite_sito_meta_idx
  on public.visite_sito (da_meta, fase, creato_il desc);

create index if not exists visite_sito_sessione_idx
  on public.visite_sito (sessione);

-- ------------------------------------------------------------
-- I permessi: chi non ha l'account puo' SOLO scrivere.
-- Nessuno, senza account, puo' rileggere niente.
-- ------------------------------------------------------------
alter table public.visite_sito enable row level security;

drop policy if exists visite_sito_scrivi on public.visite_sito;
create policy visite_sito_scrivi
  on public.visite_sito
  for insert
  to anon, authenticated
  with check (true);

-- niente policy di lettura: select, update e delete restano chiusi
-- per anon e authenticated (le vede solo il ruolo postgres/service_role).

revoke all on public.visite_sito from anon, authenticated;

-- il permesso e' colonna per colonna: creato_il e id NON sono scrivibili,
-- cosi' nessuno puo' inventarsi la data di una visita.
grant insert (fase, pagina, da_meta, fbclid, utm_source, utm_campaign,
              provenienza, telefono, larghezza, ms_attesa, sessione, agente)
  on public.visite_sito to anon, authenticated;

-- ------------------------------------------------------------
-- La riga di risultato: dice se e' andata bene.
-- ------------------------------------------------------------
select
  'tabella visite_sito pronta'                                     as esito,
  (select count(*) from public.visite_sito)                        as righe_adesso,
  (select count(*) from pg_policies
     where schemaname = 'public' and tablename = 'visite_sito')    as regole_attive,
  (select count(*) from information_schema.column_privileges
     where table_schema = 'public' and table_name = 'visite_sito'
       and grantee = 'anon' and privilege_type = 'INSERT')         as colonne_scrivibili_anon,
  (select count(*) from information_schema.table_privileges
     where table_schema = 'public' and table_name = 'visite_sito'
       and grantee = 'anon' and privilege_type = 'SELECT')         as puo_leggere_anon_deve_essere_0;

-- ============================================================
-- COME SI LEGGONO I NUMERI (da incollare fra qualche giorno,
-- una query alla volta, sempre nell'SQL Editor)
--
-- select
--   count(*) filter (where fase='arrivo' and da_meta)          as arrivati_dalla_pubblicita,
--   count(*) filter (where fase='visto'  and da_meta)          as hanno_visto_la_pagina,
--   count(*) filter (where fase='arrivo' and da_meta and telefono) as dal_telefono,
--   round(percentile_cont(0.5) within group (
--         order by ms_attesa) filter (where fase='visto' and da_meta)) as meta_ci_mette_ms
-- from public.visite_sito
-- where creato_il > now() - interval '7 days';
--
-- "arrivati_dalla_pubblicita" e' il numero da confrontare con i clic
-- che Meta dice di aver pagato. La differenza fra arrivati e
-- "hanno_visto_la_pagina" e' quanti se ne vanno prima di vedere il sito.
-- ============================================================
