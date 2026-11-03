-- =====================================================================
-- 3 novembre 2026 — LA DOMANDA DELLA SERA
-- Ogni sera, all'ora scelta, il telefono del capo suona: «Com'e' andata
-- oggi?». Tocca, si apre Giornate, risponde a voce. Se la giornata di
-- oggi e' gia' segnata, non suona.
--
-- Sono NOTIFICHE DEL TELEFONO (web push), non email: gratis e senza il
-- tetto di 100 email al giorno di Resend.
--
-- app_chiavi_push: le due chiavi delle notifiche. Le crea da sola
--   netlify/functions/lib/push-chiavi.js la prima volta, e la privata
--   non esce mai dal server. ⛔ Nessuna regola: dal browser non si
--   legge niente (solo service_role).
-- gest_avvisi_sera: un telefono (o computer) per riga. ultimo_giorno
--   evita di suonare due volte la stessa sera.
-- =====================================================================
create table if not exists public.app_chiavi_push (
  id int primary key default 1 check (id = 1),
  pubblica text not null,
  privata text not null,
  creata_il timestamptz not null default now()
);
alter table public.app_chiavi_push enable row level security;
revoke all on public.app_chiavi_push from anon, authenticated;

create table if not exists public.gest_avvisi_sera (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) < 1000),
  p256dh text not null check (char_length(p256dh) < 200),
  auth text not null check (char_length(auth) < 100),
  ora text not null default '18:30' check (ora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  attivo boolean not null default true,
  ultimo_giorno date,
  creato_il timestamptz not null default now()
);
create index if not exists gest_avvisi_sera_user on public.gest_avvisi_sera(user_id);
alter table public.gest_avvisi_sera enable row level security;
drop policy if exists gest_avvisi_sera_own on public.gest_avvisi_sera;
create policy gest_avvisi_sera_own on public.gest_avvisi_sera
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.gest_avvisi_sera to authenticated;
