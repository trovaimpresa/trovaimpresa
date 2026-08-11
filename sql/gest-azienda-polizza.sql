-- =====================================================================
-- TrovaImpresa — LA POLIZZA PROFESSIONALE NEI DATI AZIENDA
-- Da salvare come  sql/gest-azienda-polizza.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 11 agosto 2026
--
-- IL PROBLEMA
-- La lettera d'incarico di uno studio tecnico usciva senza gli estremi
-- della polizza. Non e' una dimenticanza estetica: l'art. 9 comma 4 del
-- D.L. 1/2012 obbliga il professionista a rendere noti al cliente, per
-- iscritto e al momento dell'incarico, gli estremi della polizza per i
-- danni provocati nell'esercizio dell'attivita' e il relativo massimale.
-- Una lettera senza quei dati e' incompleta, e in caso di contestazione
-- e' il professionista a restare scoperto.
--
-- COSA AGGIUNGE
--   pol_compagnia -> chi ha emesso la polizza
--   pol_numero    -> il numero, come sul certificato
--   pol_massimale -> fino a quanto copre, in euro
--   pol_scadenza  -> quando va rinnovata (il gestionale avvisa se e' passata)
--
-- Si scrivono una volta sola nei Dati azienda e restano. Sono tutti
-- facoltativi per il database: e' il gestionale che pretende i quattro
-- valori prima di far scaricare la lettera d'incarico.
-- =====================================================================

alter table if exists public.gest_azienda
  add column if not exists pol_compagnia text,
  add column if not exists pol_numero    text,
  add column if not exists pol_massimale numeric(12,2),
  add column if not exists pol_scadenza  date;

comment on column public.gest_azienda.pol_compagnia is
  'Compagnia che ha emesso la polizza di responsabilita'' civile professionale.';
comment on column public.gest_azienda.pol_numero is
  'Numero di polizza, come riportato sul certificato.';
comment on column public.gest_azienda.pol_massimale is
  'Massimale della polizza in euro. Art. 9 comma 4 DL 1/2012: va comunicato al cliente insieme agli estremi.';
comment on column public.gest_azienda.pol_scadenza is
  'Data di scadenza della polizza. Il gestionale avvisa prima di stampare una lettera d''incarico se e'' gia'' passata.';


-- ---------------------------------------------------------------------
-- VERIFICA (facoltativa)
-- Devi vedere quattro righe: pol_compagnia, pol_massimale, pol_numero,
-- pol_scadenza.
-- ---------------------------------------------------------------------
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name   = 'gest_azienda'
--    and column_name like 'pol\_%'
--  order by column_name;
