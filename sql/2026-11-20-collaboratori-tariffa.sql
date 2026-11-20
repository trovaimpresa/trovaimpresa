-- ============================================================
-- LA TARIFFA DI OGNI PERSONA — 20 novembre 2026 (si' di Alex, foto prima)
-- ============================================================
-- In parole semplici.
--
-- «Porta le ore nella parcella» metteva su OGNI riga la stessa tariffa, quella
-- dei Dati azienda (gest_azienda.tariffa_oraria). Ma in uno studio l'ora del
-- titolare e quella del praticante non costano uguale al cliente.
-- Adesso ogni persona puo' avere la SUA tariffa: se c'e', la riga delle sue
-- ore prende quella; se e' vuota, vale quella dello studio, come prima.
--
-- ⛔ Non e' il costo orario. `costo_orario` = quanto TI COSTA un'ora sua
--    (serve al margine). `tariffa_oraria` = quanto la FAI PAGARE al cliente.
--
-- Chi la vede: il titolare (regola operatori_owner). Il collaboratore vede
-- solo la propria riga (operatori_read), come gia' per il costo orario.
--
-- Si puo' rilanciare: non cancella e non sovrascrive niente.
-- Migrazione applicata: collaboratori_tariffa_20nov2026
-- ============================================================
alter table public.gest_operatori
  add column if not exists tariffa_oraria numeric(10,2);

alter table public.gest_operatori drop constraint if exists gest_operatori_tariffa_chk;
alter table public.gest_operatori add constraint gest_operatori_tariffa_chk
  check (tariffa_oraria is null or tariffa_oraria >= 0);

select 'ok: gest_operatori.tariffa_oraria c''e''' as esito;
