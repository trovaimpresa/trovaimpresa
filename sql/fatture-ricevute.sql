-- ============================================================
-- FATTURE RICEVUTE DALLO SDI (via Openapi) — 16 ottobre 2026
--
-- Tre tabelle:
--   gest_sdi_ricezione          chi ha acceso la ricezione (una riga per utente)
--   gest_fatture_ricevute       le fatture dei fornitori: fornitore, numero, data, importo
--   gest_fatture_ricevute_file  il file XML vero (SENZA lettura dal browser)
--
-- Chi scrive: SOLO le funzioni Netlify (sdi.js e sdi-ricevuta.js) con la
-- chiave di servizio. Dal browser si puo' solo LEGGERE le proprie righe.
-- Il file XML sta in una tabella a parte, senza nessuna regola di lettura:
-- il browser non lo vede mai, lo scarica solo la funzione, dopo aver
-- controllato che la fattura sia sbloccata (ha consumato 1 invio).
-- ============================================================

create table if not exists public.gest_sdi_ricezione (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  fiscal_id   text not null,
  ambiente    text not null check (ambiente in ('test','prod')),
  attivata_il timestamptz not null default now()
);
create unique index if not exists gest_sdi_ricezione_piva_amb on public.gest_sdi_ricezione (fiscal_id, ambiente);

create table if not exists public.gest_fatture_ricevute (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  sdi_uuid        text not null,
  ambiente        text not null check (ambiente in ('test','prod')),
  fornitore_nome  text,
  fornitore_piva  text,
  numero          text,
  data            date,
  importo         numeric(12,2),
  tipo_documento  text,
  sbloccata       boolean not null default false,
  vista           boolean not null default false,
  ricevuta_il     timestamptz not null default now(),
  unique (user_id, sdi_uuid)
);
create index if not exists gest_fatture_ricevute_utente on public.gest_fatture_ricevute (user_id, ricevuta_il desc);

create table if not exists public.gest_fatture_ricevute_file (
  ricevuta_id uuid primary key references public.gest_fatture_ricevute(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  xml         text not null
);

alter table public.gest_sdi_ricezione         enable row level security;
alter table public.gest_fatture_ricevute      enable row level security;
alter table public.gest_fatture_ricevute_file enable row level security;

drop policy if exists "ricezione_leggi_la_mia" on public.gest_sdi_ricezione;
create policy "ricezione_leggi_la_mia" on public.gest_sdi_ricezione for select using (user_id = auth.uid());

drop policy if exists "ricevute_leggi_le_mie" on public.gest_fatture_ricevute;
create policy "ricevute_leggi_le_mie" on public.gest_fatture_ricevute for select using (user_id = auth.uid());

-- gest_fatture_ricevute_file: nessuna regola = il browser non legge e non scrive niente.
revoke all on public.gest_fatture_ricevute_file from anon, authenticated;
revoke insert, update, delete on public.gest_fatture_ricevute from anon, authenticated;
revoke insert, update, delete on public.gest_sdi_ricezione from anon, authenticated;
