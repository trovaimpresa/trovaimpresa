-- =====================================================================
-- TrovaImpresa — L'INTERRUTTORE DEL RIEPILOGO DEL LUNEDI'
-- Da salvare come  sql/gest-azienda-riepilogo-lunedi.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 11 agosto 2026
--
-- A CHE SERVE
-- netlify/functions/riepilogo-lunedi.js manda il lunedi' mattina una email
-- con le scadenze della settimana, le fatture non pagate e i lavori in
-- ritardo. Questa colonna e' la casella "Mandami il riepilogo del lunedi'"
-- che si vede nei Dati azienda.
--
-- PERCHE' SERVE DAVVERO
-- Chi non vuole un'email e non ha modo di spegnerla non scrive: la segnala
-- come spam. E una segnalazione di spam non rovina solo quella email, rovina
-- la reputazione dell'indirizzo info@trovaimpresa.com, cioe' fa finire nella
-- posta indesiderata anche le email di benvenuto e quelle dei preventivi.
-- L'interruttore costa una colonna e protegge tutto il resto.
--
-- Acceso di partenza per tutti: chi ce l'ha gia' non deve fare niente.
-- =====================================================================

alter table if exists public.gest_azienda
  add column if not exists riepilogo_lunedi boolean not null default true;

comment on column public.gest_azienda.riepilogo_lunedi is
  'Casella "Mandami il riepilogo del lunedi" nei Dati azienda. false = niente email settimanale.';


-- ---------------------------------------------------------------------
-- VERIFICA (facoltativa)
-- Devi vedere una riga: riepilogo_lunedi, boolean, NO, true
-- ---------------------------------------------------------------------
-- select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name   = 'gest_azienda'
--    and column_name  = 'riepilogo_lunedi';
