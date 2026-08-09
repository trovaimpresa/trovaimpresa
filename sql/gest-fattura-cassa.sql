-- =====================================================================
-- TrovaImpresa — LA CASSA PREVIDENZIALE IN FATTURA
-- Da salvare come  sql/gest-fattura-cassa.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 9 agosto 2026 — il buco piu' grosso trovato nel checkup del gestionale
-- professionisti.
--
-- IL PROBLEMA
-- Il PREVENTIVO di uno studio tecnico aveva gia' la parcella completa:
-- compenso + cassa previdenziale + IVA - ritenuta d'acconto.
-- La FATTURA no: della cassa non c'era traccia da nessuna parte, ne' nel
-- modulo, ne' nei conti, ne' nel PDF, ne' nel file XML per lo SDI.
-- Un geometra con il 5% della Cassa Geometri non aveva nessun modo di
-- riportarlo in fattura: emetteva un documento con un imponibile piu' basso
-- del dovuto, e il file elettronico usciva incompleto.
--
-- COSA AGGIUNGE
--   cassa_perc  -> la percentuale (4% Inarcassa, 5% Geometri e Periti...)
--   cassa_tipo  -> il codice che lo SDI vuole per sapere QUALE cassa e'
--   spese       -> bolli, diritti, visure: entrano nell'IVA ma NON nella base
--                  della cassa e nemmeno in quella della ritenuta
--
-- Sono gli stessi tre concetti che il preventivo ha gia': cosi' la fattura
-- nata da un preventivo riproduce la parcella al centesimo.
-- =====================================================================

alter table if exists public.gest_fatture
  add column if not exists cassa_perc numeric(5,2),
  add column if not exists cassa_tipo text,
  add column if not exists spese      numeric(12,2);

comment on column public.gest_fatture.cassa_perc is
  'Contributo integrativo della cassa, in percentuale sul compenso. 4 = Inarcassa (ingegneri e architetti), 5 = Cassa Geometri e Periti industriali.';
comment on column public.gest_fatture.cassa_tipo is
  'Codice TipoCassa della fattura elettronica: TC03 Geometri, TC04 Inarcassa, TC17 EPPI periti industriali, TC22 INPS gestione separata.';
comment on column public.gest_fatture.spese is
  'Spese documentate (bolli, diritti, visure). Entrano nell''imponibile IVA ma restano fuori dalla base della cassa e della ritenuta.';


-- ---------------------------------------------------------------------
-- VERIFICA (facoltativa)
-- ---------------------------------------------------------------------
-- select column_name, data_type
--   from information_schema.columns
--  where table_name = 'gest_fatture'
--    and column_name in ('cassa_perc','cassa_tipo','spese')
--  order by column_name;
