-- ============================================================
-- DATI AZIENDA — indirizzo diviso e dati fiscali (gest_azienda)
--
-- Servono alla fattura elettronica (Fase 3) e alla Mappa, che da
-- qui ricava il punto di partenza per le distanze dei cantieri.
-- Tutti facoltativi. Lanciarlo due volte non fa niente.
-- ============================================================

-- dove sei (il campo "indirizzo" che c'era gia' resta: e' la via e il numero)
alter table gest_azienda add column if not exists cap   text;
alter table gest_azienda add column if not exists citta text;
alter table gest_azienda add column if not exists prov  text;

-- dati fiscali
alter table gest_azienda add column if not exists cod_fiscale    text;
alter table gest_azienda add column if not exists regime_fiscale text;
alter table gest_azienda add column if not exists sdi_codice     text;
alter table gest_azienda add column if not exists sdi_pec        text;

comment on column gest_azienda.regime_fiscale is 'Codice FatturaPA: RF01 ordinario, RF19 forfettario...';
comment on column gest_azienda.sdi_codice     is 'Codice destinatario SDI, 7 caratteri (0000000 se si usa la PEC)';
