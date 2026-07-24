-- ============================================================
-- TrovaImpresa — PROFESSIONISTI: prestazioni, incarichi, badge fiducia
-- Luglio 2026
--
-- Contiene TUTTO il DB necessario per:
--   TASK 1 -> colonne prestazioni / comuni_competenza su "imprese"
--             + trigger che le salva alla registrazione professionista
--   TASK 3 -> tabella "incarichi_richieste" + RLS + bucket Storage + policy
--   TASK 4 -> colonne badge fiducia (numero_albo, ordine_provinciale,
--             rc_compagnia, rc_scadenza, albo_verificato)
--
-- Eseguibile tutto insieme nell'SQL Editor di Supabase (idempotente).
-- ============================================================


-- ============================================================
-- TASK 1 — Catalogo prestazioni (colonne su "imprese")
-- ============================================================
alter table public.imprese add column if not exists prestazioni text[] default '{}';
alter table public.imprese add column if not exists comuni_competenza text[] default '{}';

-- Indici per ricerca veloce (array contains) usati dalla landing /professionisti
create index if not exists idx_imprese_prestazioni on public.imprese using gin (prestazioni);
create index if not exists idx_imprese_comuni_competenza on public.imprese using gin (comuni_competenza);


-- ============================================================
-- TASK 4 — Badge fiducia (colonne su "imprese")
--   numero_albo esiste gia' nella maggior parte dei DB: "if not exists"
--   lo rende sicuro comunque.
-- ============================================================
alter table public.imprese add column if not exists numero_albo text;
alter table public.imprese add column if not exists ordine_provinciale text;
alter table public.imprese add column if not exists rc_compagnia text;
alter table public.imprese add column if not exists rc_scadenza date;
alter table public.imprese add column if not exists albo_verificato boolean default false;

-- "solo admin": il professionista puo' aggiornare la propria riga (RLS owner),
-- ma NON deve poter auto-verificarsi. Questo trigger blocca ogni modifica di
-- albo_verificato fatta da un utente normale: il valore torna a quello vecchio.
-- L'admin lo cambia dall'SQL Editor o via Netlify function con service_role
-- (che bypassa i trigger security invoker? no: usa il ramo service_role sotto).
create or replace function public.blocca_autoverifica_albo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.albo_verificato is distinct from old.albo_verificato
     and coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role','') <> 'service_role'
  then
    new.albo_verificato := old.albo_verificato;  -- ignora la modifica non autorizzata
  end if;
  return new;
end;
$$;

drop trigger if exists trg_blocca_autoverifica_albo on public.imprese;
create trigger trg_blocca_autoverifica_albo
  before update on public.imprese
  for each row execute function public.blocca_autoverifica_albo();


-- ============================================================
-- TASK 1 (persistenza registrazione) — Trigger dedicato professionista
--   Il profilo in "imprese" viene creato dal trigger esistente
--   crea_profilo_impresa() (8 chiavi base). Questo trigger AGGIUNTIVO
--   scrive prestazioni e comuni_competenza leggendoli dai metadata,
--   SENZA toccare la funzione esistente (stesso schema del candidato).
--
--   Ordine di esecuzione: "on_auth_user_created" (crea la riga) viene
--   PRIMA di "on_auth_user_created_prestazioni" (alfabetico), quindi la
--   riga esiste gia' quando questo UPDATE gira.
-- ============================================================
create or replace function public.applica_prestazioni_professionista()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  md jsonb := new.raw_user_meta_data;
begin
  -- Agisce solo per i professionisti
  if coalesce(md->>'tipo','') <> 'professionista' then
    return new;
  end if;

  update public.imprese
     set prestazioni = case
           when md ? 'prestazioni'
           then array(select jsonb_array_elements_text(md->'prestazioni'))
           else prestazioni end,
         comuni_competenza = case
           when md ? 'comuni_competenza'
           then array(select jsonb_array_elements_text(md->'comuni_competenza'))
           else comuni_competenza end
   where user_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_prestazioni on auth.users;
create trigger on_auth_user_created_prestazioni
  after insert on auth.users
  for each row execute function public.applica_prestazioni_professionista();


-- ============================================================
-- TASK 3 — Tabella richieste di incarico
-- ============================================================
create table if not exists public.incarichi_richieste (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  professionista_id  bigint references public.imprese(id) on delete set null,
  richiedente_user_id uuid,                 -- valorizzato solo se il cliente e' loggato
  nome               text not null,
  email              text,
  telefono           text,
  prestazione        text,
  comune             text,
  urgenza            text,                  -- es. 'bassa' | 'media' | 'alta'
  note               text,
  documenti          text[] default '{}',   -- path dei file nel bucket documenti-incarichi
  stato              text not null default 'nuova'  -- 'nuova' | 'presa_in_carico' | 'chiusa'
);

create index if not exists idx_incarichi_professionista on public.incarichi_richieste(professionista_id);
create index if not exists idx_incarichi_created_at on public.incarichi_richieste(created_at desc);

alter table public.incarichi_richieste enable row level security;

-- INSERT: chiunque (anche cliente NON loggato, come per i preventivi) puo' inviare
drop policy if exists "incarichi_insert_any" on public.incarichi_richieste;
create policy "incarichi_insert_any" on public.incarichi_richieste
  for insert
  to anon, authenticated
  with check (true);

-- SELECT: solo il professionista destinatario (proprietario della riga imprese)
drop policy if exists "incarichi_select_owner" on public.incarichi_richieste;
create policy "incarichi_select_owner" on public.incarichi_richieste
  for select
  to authenticated
  using (
    exists (
      select 1 from public.imprese im
      where im.id = incarichi_richieste.professionista_id
        and im.user_id = auth.uid()
    )
  );

-- UPDATE: il professionista destinatario puo' aggiornare lo stato della richiesta
drop policy if exists "incarichi_update_owner" on public.incarichi_richieste;
create policy "incarichi_update_owner" on public.incarichi_richieste
  for update
  to authenticated
  using (
    exists (
      select 1 from public.imprese im
      where im.id = incarichi_richieste.professionista_id
        and im.user_id = auth.uid()
    )
  )
  with check (true);


-- ============================================================
-- TASK 3 — Bucket Storage "documenti-incarichi" (PRIVATO) + policy
--   Convenzione path:  <professionista_id>/<timestamp>_<nomefile>
--   Cosi' le policy possono legare il file al professionista destinatario.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documenti-incarichi', 'documenti-incarichi', false)
on conflict (id) do nothing;

-- UPLOAD: chiunque (anche cliente non loggato) puo' caricare in questo bucket
drop policy if exists "docinc_insert_any" on storage.objects;
create policy "docinc_insert_any" on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'documenti-incarichi');

-- LETTURA: solo il professionista destinatario (prima cartella = suo id impresa)
drop policy if exists "docinc_select_owner" on storage.objects;
create policy "docinc_select_owner" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documenti-incarichi'
    and exists (
      select 1 from public.imprese im
      where im.user_id = auth.uid()
        and im.id::text = (storage.foldername(name))[1]
    )
  );

-- (facoltativo) l'admin service_role bypassa comunque le RLS.

-- ============================================================
-- TEST DOPO L'ESECUZIONE
-- 1) Registra un professionista di prova selezionando alcune prestazioni:
--    dopo la conferma email, la riga in "imprese" deve avere prestazioni[]
--    e comuni_competenza[] valorizzati.
-- 2) Dalla landing /professionisti cerca per prestazione + comune: deve trovarlo.
-- 3) Invia una richiesta di incarico con un documento allegato: la riga
--    compare in incarichi_richieste e il file nel bucket documenti-incarichi.
-- 4) Loggato come QUEL professionista devi vedere la richiesta e il documento;
--    loggato come un altro professionista NON devi vederli.
-- ============================================================
