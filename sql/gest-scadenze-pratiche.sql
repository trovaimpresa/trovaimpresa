-- ============================================================
-- SCADENZE COLLEGATE ALLA PRATICA + PROMEMORIA EMAIL
-- 9 agosto 2026 — primo strumento pensato per i professionisti
-- (ingegneri, architetti, geometri, periti)
-- ============================================================
--
-- Da eseguire UNA VOLTA SOLA in Supabase: SQL Editor -> incolla tutto -> Run.
-- Si puo' rilanciare senza rischi: ogni pezzo ha "if not exists".
--
-- Il gestionale funziona anche PRIMA di lanciarlo: il codice controlla se le
-- colonne ci sono e, se mancano, il campo "Pratica" semplicemente non compare
-- e le email non partono. Nessuna schermata bianca.
--
-- Cosa aggiunge:
--   1) gest_scadenze.lavoro_id   -> la scadenza sa a quale pratica appartiene
--   2) gest_scadenze.avvisi      -> quali email sono gia' partite (30/7/1 giorni)
--   3) un indice per far restare veloce lo scadenzario


-- ============================================================
-- 1. Collegamento alla pratica (facoltativo)
-- ============================================================
-- Le pratiche sono righe di gest_lavori: per un'impresa e' "il lavoro", per uno
-- studio e' "la pratica" (stessa tabella, cambia solo la parola sullo schermo).
-- on delete set null: se la pratica viene cancellata la scadenza resta, ma
-- senza riferimento. Meglio una scadenza orfana che una scadenza sparita.

alter table public.gest_scadenze
  add column if not exists lavoro_id uuid references public.gest_lavori(id) on delete set null;

create index if not exists gest_scadenze_lavoro_idx
  on public.gest_scadenze(lavoro_id);


-- ============================================================
-- 2. Promemoria email gia' inviati
-- ============================================================
-- Una sola colonna di testo invece di tre colonne separate: ci finiscono
-- dentro le tappe gia' spedite, per esempio "30,7". Cosi' la funzione Netlify
-- non manda due volte la stessa email se gira due volte nello stesso giorno.
-- Vuota (o null) = non e' ancora partito niente.

alter table public.gest_scadenze
  add column if not exists avvisi text default '';

-- Chi non vuole ricevere l'email per una certa scadenza mette questo a false.
-- Default true: il promemoria e' il motivo per cui lo scadenzario esiste.
alter table public.gest_scadenze
  add column if not exists avvisa boolean default true;


-- ============================================================
-- 3. Indice per la funzione che manda le email
-- ============================================================
-- Ogni mattina la funzione cerca: scadenze aperte, con avvisa = true, la cui
-- data cade fra 30, 7 o 1 giorno. Senza indice sulla data, con molte righe,
-- diventerebbe lenta.

create index if not exists gest_scadenze_data_stato_idx
  on public.gest_scadenze(data_scadenza, stato);


-- ============================================================
-- CONTROLLO FINALE (facoltativo)
-- ============================================================
-- Lanciando anche questa riga vedi le colonne nuove: devono comparire
-- lavoro_id, avvisi e avvisa.
--
-- select column_name, data_type
--   from information_schema.columns
--  where table_name = 'gest_scadenze'
--  order by ordinal_position;
