-- ============================================================
-- FIX SCADENZE PER COLLABORATORI — TrovaImpresa
-- Problema: gest_scadenze ha solo policy "own" (solo titolare),
-- ma l'app operatore mostra la sezione Scadenze ai collaboratori
-- → per loro risultava sempre vuota.
-- Questa policy permette ai membri ATTIVI dell'impresa di LEGGERE
-- (solo lettura: creare/modificare resta del titolare).
-- Incolla in Supabase > SQL Editor > Run
-- ============================================================

drop policy if exists scadenze_team_read on gest_scadenze;
create policy scadenze_team_read on gest_scadenze
  for select to authenticated
  using (exists (
    select 1 from gest_membri m
    where m.membro_id = auth.uid()
      and m.impresa_id = gest_scadenze.user_id
      and m.stato = 'attivo'));

-- Verifica (deve comparire scadenze_team_read [SELECT]):
select policyname, cmd from pg_policies where tablename = 'gest_scadenze';
