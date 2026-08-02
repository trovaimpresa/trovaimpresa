-- ============================================================
-- PATENTE A CREDITI  (gest_azienda)
-- Tre campi nuovi nella scheda azienda. Non tocca niente di
-- esistente: se lanci questo file due volte non succede nulla.
--
-- Regole (D.Lgs 81/2008, art. 27):
--   30 crediti alla partenza
--   sotto 15 crediti l'impresa NON puo' operare in cantiere
--   il gestionale avvisa gia' sotto 20, per dare tempo di recuperare
-- ============================================================

alter table gest_azienda add column if not exists pat_numero  text;
alter table gest_azienda add column if not exists pat_data    date;
alter table gest_azienda add column if not exists pat_crediti integer;

comment on column gest_azienda.pat_numero  is 'Numero della patente a crediti';
comment on column gest_azienda.pat_data    is 'Data di rilascio della patente';
comment on column gest_azienda.pat_crediti is 'Crediti attuali (30 alla partenza, minimo 15 per operare)';
