-- =====================================================================
-- LA FIRMA CON CODICE SMS (Openapi, EU-SES) — 8 novembre 2026
--
-- Dal preventivo, «Invia al cliente» → «Firma con codice SMS».
-- Il cliente riceve un codice sul telefono e firma un PDF vero
-- (firma elettronica con OTP, regolamento eIDAS). Openapi tiene il
-- registro delle prove per 10 anni; il PDF firmato lo teniamo NOI
-- (Openapi lo cancella dopo 90 giorni).
--
-- ⛔ LE RIGHE LE SCRIVE SOLO IL SERVER (netlify/functions/firma-sms.js e
--    firma-sms-notifica.js, col service role). Il browser le legge e basta:
--    nessuna regola di INSERT/UPDATE/DELETE per «authenticated».
-- ⛔ IL PDF LO FA IL SERVER, dalla fotografia di gest_preventivi_link.dati
--    (la stessa che vede il cliente sul link). «dati_hash» e' la sua
--    impronta: se il preventivo cambia dopo, la firma resta sul PDF di
--    prima e non si attacca al link nuovo.
-- ⛔ Costa 5 crediti AI (deciso da Alex l'8 nov 2026): a Openapi costa
--    circa 0,49 €. Se Openapi non prende la richiesta, i crediti tornano.
-- =====================================================================

create table if not exists public.gest_firme_sms (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- set null e non cascade: un PDF firmato e' un documento, resta anche
  -- se un giorno il preventivo viene buttato per sempre
  preventivo_id uuid references public.gest_preventivi(id) on delete set null,
  ambiente      text not null default 'prova' check (ambiente in ('prova','vera')),
  openapi_id    text unique,
  stato         text not null default 'nuova',
  firmatario    jsonb not null default '{}'::jsonb check (jsonb_typeof(firmatario) = 'object'),
  url_firma     text,
  dati_hash     text,
  titolo        text,
  creato_il     timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  firmato_il    timestamptz,
  pdf_path      text,
  pdf_sha256    text,
  errore        text,
  ai_log_id     uuid
);
create index if not exists gest_firme_sms_prev on public.gest_firme_sms (preventivo_id, creato_il desc);
create index if not exists gest_firme_sms_user on public.gest_firme_sms (user_id, creato_il desc);

alter table public.gest_firme_sms enable row level security;
drop policy if exists gest_firme_sms_leggi on public.gest_firme_sms;
create policy gest_firme_sms_leggi on public.gest_firme_sms
  for select using (auth.uid() = user_id or public.gest_puo_accedere(user_id));
revoke insert, update, delete on public.gest_firme_sms from anon, authenticated;
grant select on public.gest_firme_sms to authenticated;

-- il deposito dei PDF firmati: privato, cartella = id dell'impresa
insert into storage.buckets (id, name, public)
values ('firme-sms', 'firme-sms', false)
on conflict (id) do nothing;

drop policy if exists firme_sms_leggi_proprie on storage.objects;
create policy firme_sms_leggi_proprie on storage.objects
  for select to authenticated
  using (bucket_id = 'firme-sms' and (storage.foldername(name))[1] = auth.uid()::text);
