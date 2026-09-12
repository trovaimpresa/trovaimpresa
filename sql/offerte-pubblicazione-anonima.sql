-- TrovaLavoro passo 1 — pubblicare un'offerta di lavoro SENZA iscriversi.
-- Applicata al database il 12 settembre 2026 (migrazione
-- offerte_lavoro_pubblicazione_anonima_12set2026). Questo file e' la copia
-- leggibile: serve per capire cosa c'e' dentro senza aprire Supabase.
--
-- IL PERCHE'. I subappalti avevano 6 annunci e crescevano da soli, le offerte
-- di lavoro erano a 0. La differenza era una riga di permesso:
-- subappalti_insert_public accetta anon, offerte_insert_owner pretende
-- authenticated + una riga in imprese.
--
-- COSA SI E' FATTO DIVERSO DAI SUBAPPALTI, e perche':
-- 1. Il codice segreto (token) NON sta in una colonna di offerte_lavoro.
--    Su subappalti il token e' protetto perche' il permesso di lettura e' dato
--    colonna per colonna e quella colonna e' esclusa. Su offerte_lavoro invece
--    il permesso di lettura e' su TUTTA la tabella, e le pagine fanno select('*'):
--    una colonna nuova sarebbe stata leggibile da chiunque. Quindi il token sta
--    in una tabella separata che anon e authenticated non possono nemmeno aprire.
-- 2. L'inserimento passa da una funzione, non da un INSERT del browser. Cosi'
--    si valida tutto lato server e nessuno puo' firmare un annuncio a nome di
--    un'impresa iscritta.
--
-- Collaudo fatto il 12 set: 14 prove sulle funzioni + 6 prove col ruolo anon,
-- tutte verdi, righe di prova cancellate.

create table if not exists public.offerte_token (
  offerta_id uuid primary key references public.offerte_lavoro(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  email_avvisata boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.offerte_token enable row level security;
-- nessuna policy: solo il service_role e le funzioni security definer ci arrivano
revoke all on public.offerte_token from anon, authenticated;
create index if not exists offerte_token_token_idx on public.offerte_token(token);

-- Le tre funzioni (testo completo nella migrazione su Supabase):
--   pubblica_offerta_anonima(p jsonb) -> jsonb {id, token}
--     valida nome/titolo/email/citta, taglia i campi troppo lunghi,
--     freno anti-abuso: massimo 5 annunci dalla stessa email in 24 ore,
--     impresa_id resta NULL, crea la riga in offerte_token
--   verifica_token_offerta(p_id uuid, p_token uuid) -> boolean
--   chiudi_offerta_anonima(p_id uuid, p_token uuid) -> boolean
--     NON cancella: mette attiva = false, cosi' l'annuncio sparisce dalla
--     bacheca ma lo storico resta
--
-- grant execute on function ... to anon, authenticated;
