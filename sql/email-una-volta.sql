-- 22 ottobre 2026 — eseguito dal connettore (migrazione email_una_volta_22ott2026).
-- Il 21 ottobre la stessa email automatica e' partita TRE volte alle stesse
-- imprese in un minuto: Netlify aveva lanciato la funzione tre volte.
-- Da qui: prima di mandare, la funzione scrive una chiave; se la chiave c'e'
-- gia', l'email e' gia' partita e non si rimanda.
create table if not exists public.email_una_volta (
  chiave text primary key,
  inviata_il timestamptz not null default now()
);
alter table public.email_una_volta enable row level security;
revoke all on public.email_una_volta from anon, authenticated;
