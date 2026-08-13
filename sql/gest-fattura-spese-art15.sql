-- ============================================================
-- 13 agosto 2026 — LE DUE SPESE IN FATTURA
--
-- Fino a ieri in fattura c'era una casella sola, "Spese", e finiva
-- nell'imponibile con l'IVA della fattura.
--
-- Il commercialista: le spese anticipate in nome e per conto del cliente
-- (bolli, diritti, visure, con la ricevuta intestata a lui e senza nessun
-- ricarico) sono ESCLUSE dalla base imponibile — art. 15, comma 1, n. 3 del
-- DPR 633/72 — e nel file elettronico vanno in una riga a IVA 0 con natura N1.
-- Su 150 euro di spese sono 33 euro di IVA in meno.
--
-- Le trasferte, il carburante e i materiali NON sono art. 15: quelli sono un
-- rimborso di spese vive, prendono l'IVA normale ed entrano nella base della
-- ritenuta. Percio' adesso le caselle sono due.
--
--   spese         -> anticipate art. 15   (fuori IVA, fuori cassa, fuori ritenuta)
--   spese_iva     -> rimborso spese vive  (IVA normale, dentro la ritenuta)
--   spese_regime  -> il segno di quale conto usa questa fattura
--
-- ⚠️ PERCHE' SERVE spese_regime
-- Una fattura elettronica accettata dallo SDI non si corregge a posteriori. Se
-- il gestionale ricalcolasse le fatture gia' emesse col conto nuovo, non
-- tornerebbe piu' ne' con il file mandato all'Agenzia delle Entrate ne' con i
-- soldi che il cliente ha bonificato.
-- Quindi ogni fattura si porta dietro il regime con cui e' NATA: il gestionale
-- lo scrive una volta sola, alla creazione, e non lo tocca mai piu' — nemmeno
-- se un giorno riapri e risalvi una fattura vecchia.
--   spese_regime = 'art15'  -> conto nuovo
--   spese_regime = NULL     -> fattura di prima, conto di prima, identico
--
-- Nota: questo segno non governa solo le spese. Governa anche la BASE DELLA
-- RITENUTA d'acconto: il commercialista ha confermato che va calcolata
-- sull'imponibile al netto dello sconto (su 10.000 con 2.000 di sconto sono
-- 1.600 e non 2.000). Anche quello vale solo dalle fatture nuove: sulle
-- vecchie il cliente ha gia' versato all'Erario la cifra scritta sul
-- documento, e ricalcolarla farebbe dire al gestionale un numero diverso da
-- quello che l'Agenzia ha ricevuto.
--
-- Le righe che ci sono gia' restano tutte a NULL: e' quello che vogliamo.
-- Da lanciare una volta sola su Supabase (SQL Editor). Si puo' rilanciare
-- senza fare danni.
-- ============================================================

alter table if exists public.gest_fatture
  add column if not exists spese_iva    numeric(12,2),
  add column if not exists spese_regime text;

comment on column public.gest_fatture.spese is
  'Spese anticipate in nome e per conto del cliente (art. 15 DPR 633/72) quando spese_regime = ''art15''. Sulle fatture piu'' vecchie (spese_regime NULL) e'' la vecchia casella unica, che entrava nell''imponibile con l''IVA della fattura.';

comment on column public.gest_fatture.spese_iva is
  'Rimborso delle spese vive inerenti l''incarico: trasferte, carburante, materiali. Prende l''IVA prevalente della fattura ed entra nella base della ritenuta. Non entra nella base della cassa (in attesa di conferma dal commercialista).';

comment on column public.gest_fatture.spese_regime is
  'Con che regola sono state calcolate le spese di QUESTA fattura. Scritto alla creazione e mai piu'' modificato: una fattura gia'' mandata allo SDI non si ricalcola. ''art15'' = spese anticipate fuori campo IVA con natura N1. NULL = fattura emessa prima del 13 agosto 2026, conto di prima.';

-- Controllo: quante fatture hanno le spese, e con che regime.
-- Subito dopo aver lanciato questo file devono essere tutte "prima del 13 agosto".
select coalesce(spese_regime,'prima del 13 agosto') as regime,
       count(*)                                     as fatture,
       coalesce(sum(spese),0)                       as totale_spese
  from public.gest_fatture
 where coalesce(spese,0) <> 0
 group by 1
 order by 1;
