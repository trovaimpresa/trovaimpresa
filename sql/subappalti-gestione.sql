-- =====================================================================
-- SUBAPPALTI: GESTIONE DELL'ANNUNCIO (24 ottobre 2026)
--
-- Prima: chi pubblicava riceveva il link di gestione SOLO sullo schermo
-- (chiusa la pagina, perso per sempre), poteva solo eliminare, e gli
-- annunci non scadevano mai.
-- Adesso:
--   · attivo        -> l'annuncio si puo' chiudere e riaprire
--   · scade_il      -> dura 30 giorni, poi si rinnova con un tocco
--   · avviso_scadenza_il -> quando e' partita l'email «ancora valido?»
--   · email_link_inviata -> l'email col link parte una volta sola
--
-- Le scritture passano tutte da netlify/functions/subappalto-gestione.js
-- (chiave di servizio, controllo del token). Dal browser si possono solo
-- LEGGERE attivo e scade_il: nessun INSERT/UPDATE su queste colonne.
-- =====================================================================

alter table public.subappalti
  add column if not exists attivo boolean not null default true,
  add column if not exists scade_il timestamptz default (now() + interval '30 days'),
  add column if not exists avviso_scadenza_il timestamptz,
  add column if not exists email_link_inviata boolean not null default false;

-- gli annunci gia' online ripartono da oggi: 30 giorni per tutti
update public.subappalti set scade_il = now() + interval '30 days' where scade_il is null or scade_il < now() + interval '30 days';

-- la tabella usa i permessi colonna per colonna: le colonne nuove vanno dichiarate
grant select (attivo, scade_il) on public.subappalti to anon, authenticated;

create index if not exists subappalti_attivo_scade_idx on public.subappalti (attivo, scade_il);
