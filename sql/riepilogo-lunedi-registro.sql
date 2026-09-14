-- sql/riepilogo-lunedi-registro.sql
--
-- 14 settembre 2026 — IL REGISTRO DEL RIEPILOGO DEL LUNEDI'
--
-- PERCHE' ESISTE
-- Il 14 set 2026 l'email «La tua settimana» e' partita DUE VOLTE allo stesso
-- indirizzo, alle 05:30:45 e alle 05:31:37. Una scheduled function di Netlify
-- che non finisce in tempo viene rilanciata: il secondo giro rifaceva tutto da
-- capo e rimandava l'email. Con una persona sola e' una seccatura; con mille
-- iscritti sono mille email doppie e il tetto giornaliero di Resend bruciato
-- per il resto della giornata — comprese le conferme iscrizione.
--
-- ERA L'UNICA DELLE QUATTRO SENZA DIFESA
-- promemoria-scadenze.js ha la colonna "avvisi", promemoria-dalsito.js ha la
-- tabella gest_dalsito_avvisi, invia-promemoria.js ha la colonna "inviato".
-- riepilogo-lunedi.js non aveva niente.
--
-- COME FUNZIONA
-- Prima di mandare si prende il posto, dopo aver mandato lo si tiene. La
-- chiave primaria (user_id, settimana) fa il lavoro da sola: il secondo
-- inserimento sbatte contro l'unicita' (codice 23505) e la function capisce
-- che quella email e' gia' partita. Se l'invio fallisce la riga viene tolta,
-- cosi' il tentativo dopo puo' mandare davvero.
--
-- ⛔ RLS accesa e NESSUNA POLICY: ci scrive e ci legge solo il service role
--    dentro la function. Se l'iscritto potesse cancellare la sua riga si
--    rimanderebbe l'email da solo all'infinito.
--
-- GIA' ESEGUITO SU SUPABASE il 14 set 2026 (migrazione
-- riepilogo_lunedi_registro_invii). Questo file sta nel repo perche' il
-- database si deve poter rifare da zero leggendo sql/.

create table if not exists public.gest_riepilogo_inviati (
  user_id    uuid not null,
  settimana  date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, settimana)
);

alter table public.gest_riepilogo_inviati enable row level security;

comment on table public.gest_riepilogo_inviati is
  'Registro anti-doppione del riepilogo del lunedi (riepilogo-lunedi.js). Una riga per persona per lunedi. Scrive solo il service role.';

-- CONTROLLO: deve dire rls_accesa = true e policy = 0
-- select relrowsecurity as rls_accesa,
--        (select count(*) from pg_policies where tablename='gest_riepilogo_inviati') as policy
-- from pg_class where relname='gest_riepilogo_inviati';
