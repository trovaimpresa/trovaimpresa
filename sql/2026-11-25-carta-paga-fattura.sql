-- =====================================================================
-- TrovaImpresa — LA CARTA CHE PAGA LA FATTURA DEL FORNITORE
-- 25 novembre 2026 (sì di Alex). Sicuro da rilanciare.
--
-- Una fattura di un fornitore pagata con la carta aziendale diventa anche
-- un movimento della carta (il saldo della carta scende). Il movimento
-- porta il numero della fattura in fattura_forn_id: Report, Riepilogo e
-- Tasse e fisco NON lo contano fra le spese, perché la fattura c'è già.
-- Se la fattura viene eliminata per sempre il collegamento si svuota e il
-- movimento torna una spesa normale della carta.
-- =====================================================================
alter table public.gest_carte_movimenti
  add column if not exists fattura_forn_id uuid
  references public.gest_fatture_fornitori(id) on delete set null;

create index if not exists gest_carte_movimenti_fattura_forn_idx
  on public.gest_carte_movimenti(fattura_forn_id) where fattura_forn_id is not null;
