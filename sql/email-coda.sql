-- ============================================================
-- 8 novembre 2026 — LE EMAIL PROGRAMMATE (50 al giorno)
--
-- Resend gratis manda →100← email al giorno, conferme d'iscrizione
-- comprese. Una campagna a tutti riempiva il tetto e spegneva le
-- conferme per il resto della giornata.
-- Adesso dall'admin si PROGRAMMA: le email finiscono in coda e ogni
-- mattina netlify/functions/invia-coda-email.js ne manda al massimo
-- →50←. Le altre →50← restano libere per conferme e benvenuti.
--
-- email_campagne = una email scritta da Alessio (oggetto, testo,
--                  gruppo, da che giorno parte)
-- email_coda     = una riga per destinatario, gia' personalizzata
--
-- Solo service_role ci scrive e legge: RLS accesa e nessuna regola.
-- ============================================================
create table if not exists public.email_campagne (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  oggetto     text not null,
  testo       text not null,
  gruppo      text,
  parte_dal   date not null default current_date,
  totale      integer not null default 0,
  stato       text not null default 'attiva'
              check (stato in ('attiva','finita','fermata'))
);

create table if not exists public.email_coda (
  id           bigserial primary key,
  campagna_id  bigint not null references public.email_campagne(id) on delete cascade,
  impresa_id   bigint,
  email        text not null,
  oggetto      text not null,
  html         text not null,
  stato        text not null default 'attesa'
               check (stato in ('attesa','inviata','errore','saltata')),
  inviata_il   timestamptz,
  errore       text,
  unique (campagna_id, email)
);

create index if not exists email_coda_attesa_idx
  on public.email_coda (campagna_id, id) where stato = 'attesa';

alter table public.email_campagne enable row level security;
alter table public.email_coda     enable row level security;
