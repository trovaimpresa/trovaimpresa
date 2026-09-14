-- sql/promemoria-mattina-registro.sql
--
-- 14 settembre 2026 — IL REGISTRO DEL PROMEMORIA DEL MATTINO
--
-- A CHE SERVE
-- E' il PALETTO 1 contro lo spam: al massimo UNA email al giorno a persona.
-- La chiave primaria (user_id, giorno) fa il lavoro da sola — il secondo
-- inserimento sbatte contro l'unicita' (codice 23505) e promemoria-mattina.js
-- capisce che a quella persona l'email di oggi e' gia' partita.
--
-- SERVE ANCHE CONTRO IL RILANCIO DI NETLIFY
-- La mattina del 14 settembre 2026 il vecchio riepilogo-lunedi.js ha mandato
-- la stessa email DUE VOLTE, alle 05:30:45 e alle 05:31:37: una scheduled
-- function che non finisce in tempo viene rilanciata e rifa' tutto da capo.
-- Con una persona e' una seccatura, con mille iscritti sono mille email doppie
-- e il tetto giornaliero di Resend bruciato — comprese le conferme iscrizione.
--
-- ⛔ RLS accesa e NESSUNA POLICY: ci scrive e ci legge solo il service role
--    dentro la function. Se l'iscritto potesse cancellare la sua riga si
--    rimanderebbe l'email da solo all'infinito.
--
-- ⚠️ Sostituisce gest_riepilogo_inviati, fatta poche ore prima: stessa idea,
--    ma teneva il LUNEDI' invece del GIORNO, e adesso la function gira tutte
--    le mattine. Quella tabella resta li' vuota e non da' fastidio a nessuno.
--
-- GIA' ESEGUITO SU SUPABASE il 14 set 2026 (migrazione
-- promemoria_mattina_registro). Questo file sta nel repo perche' il database
-- si deve poter rifare da zero leggendo sql/.

create table if not exists public.gest_promemoria_inviati (
  user_id    uuid not null,
  giorno     date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, giorno)
);

alter table public.gest_promemoria_inviati enable row level security;

comment on table public.gest_promemoria_inviati is
  'Registro del promemoria del mattino (promemoria-mattina.js): una riga per persona per giorno. Scrive solo il service role.';

-- CONTROLLO: deve dire rls_accesa = true e policy = 0
-- select relrowsecurity as rls_accesa,
--        (select count(*) from pg_policies where tablename='gest_promemoria_inviati') as policy
-- from pg_class where relname='gest_promemoria_inviati';
