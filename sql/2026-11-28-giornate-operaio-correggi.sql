-- 28 nov 2026 — l'operaio corregge (o butta) la giornata che ha mandato,
-- finche' il capo non l'ha approvata. Se il capo l'ha scartata, la corregge
-- e la rimanda (torna «da_vedere»). Una approvata non si tocca piu'.
drop policy if exists gest_giornate_proposte_mie_update on gest_giornate_proposte;
create policy gest_giornate_proposte_mie_update on gest_giornate_proposte
  for update to authenticated
  using (membro_id = auth.uid() and stato in ('da_vedere','scartata'))
  with check (membro_id = auth.uid() and stato = 'da_vedere'
              and operatore_id = gest_mio_operatore(user_id)
              and gest_puo_sezione(user_id, 'lavori'::text));

drop policy if exists gest_giornate_proposte_mie_delete on gest_giornate_proposte;
create policy gest_giornate_proposte_mie_delete on gest_giornate_proposte
  for delete to authenticated
  using (membro_id = auth.uid() and stato in ('da_vedere','scartata'));
