-- ============================================================
-- RICHIESTE DAL SITO — lo stato lato gestionale (15 agosto 2026)
--
-- Le richieste NON si copiano: restano in public.preventivi, dove sono
-- gia' protette dalla policy "preventivi_impresa_select"
--   EXISTS (imprese WHERE id = impresa_id AND user_id = auth.uid())
-- cioe' ogni impresa vede solo le proprie.
--
-- Qui dentro ci sta SOLO lo stato che l'impresa mette dal gestionale.
-- Nessuna colonna aggiunta a preventivi: cosi' preventivi_safe e i GRANT
-- del sito pubblico restano intatti (era la trappola del 6 agosto).
--
-- "nuova" NON si scrive: e' l'assenza di riga. Cosi' il gestionale non
-- deve scrivere niente finche' l'impresa non fa qualcosa.
--
-- Sicuro da rilanciare.
-- ============================================================

create table if not exists public.gest_dalsito (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null,
  preventivo_id        bigint not null,
  stato                text not null default 'vista',
  letta_il             timestamptz default now(),
  preventivo_creato_id uuid,
  created_at           timestamptz default now()
);

-- una riga sola per impresa+richiesta
create unique index if not exists gest_dalsito_uniq
  on public.gest_dalsito (user_id, preventivo_id);

-- gli stati ammessi (nuova = nessuna riga)
alter table public.gest_dalsito drop constraint if exists gest_dalsito_stato_ok;
alter table public.gest_dalsito add constraint gest_dalsito_stato_ok
  check (stato in ('vista','preventivo','chiusa'));

-- ============================================================
-- Sicurezza: stessa identica regola di gest_preventivi_own
-- ============================================================
alter table public.gest_dalsito enable row level security;

drop policy if exists "gest_dalsito_own" on public.gest_dalsito;
create policy "gest_dalsito_own" on public.gest_dalsito
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- Il registro delle email delle 24 ore (anti-doppione)
-- Ci scrive solo la funzione del server, con la chiave di servizio.
-- RLS accesa e NESSUNA policy = nessun utente la legge o la scrive.
-- ============================================================
create table if not exists public.gest_dalsito_avvisi (
  preventivo_id bigint primary key,
  inviata_il    timestamptz default now()
);
alter table public.gest_dalsito_avvisi enable row level security;
revoke all on public.gest_dalsito_avvisi from anon, authenticated;

-- ============================================================
-- VERIFICA — deve dire: RLS ACCESA, 1 policy, 0 righe viste da anon
-- ============================================================
select 'RLS' as cosa,
       case when c.relrowsecurity then 'ACCESA' else '*** SPENTA ***' end as esito
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'gest_dalsito'

union all

select 'policy', policyname || ' (' || cmd || ')'
from pg_policies
where schemaname = 'public' and tablename = 'gest_dalsito';
