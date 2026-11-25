-- 25 nov 2026 — TAPPA 3 n. 5: «I tuoi strumenti» nell'app del collaboratore
-- Il collaboratore NON legge gest_mezzi (dentro ci sono costi e note): passa
-- solo da questa funzione, che gli dà nome e prossima scadenza (taratura,
-- revisione…) degli strumenti/attrezzature che hanno lui in «Chi ce l'ha»
-- (gest_mezzi.operatore_id). Niente permessi speciali: sono roba sua.
create or replace function public.gest_strumenti_miei(_impresa uuid)
returns jsonb language plpgsql stable security definer
set search_path to 'public','pg_catalog' as $$
declare io uuid;
begin
  select m.operatore_id into io from gest_membri m
   where m.impresa_id = _impresa and m.membro_id = auth.uid() and m.stato = 'attivo'
     and m.operatore_id is not null
   limit 1;
  if io is null then return jsonb_build_object('ok',false); end if;
  return jsonb_build_object('ok',true,'strumenti',coalesce((
    select jsonb_agg(jsonb_build_object(
      'nome', z.nome,
      'categoria', coalesce(z.categoria,'mezzo'),
      'scadenza', (select jsonb_build_object('titolo', coalesce(nullif(s.titolo,''), s.tipo_pratica), 'data', s.data_scadenza)
                     from gest_scadenze s
                    where s.user_id = _impresa and s.mezzo_id = z.id and s.eliminato_il is null
                      and coalesce(s.stato,'') <> 'fatta' and s.data_scadenza is not null
                    order by s.data_scadenza limit 1)
    ) order by z.nome)
    from gest_mezzi z
   where z.user_id = _impresa and z.operatore_id = io and z.eliminato_il is null), '[]'::jsonb));
end $$;
revoke all on function public.gest_strumenti_miei(uuid) from public, anon;
grant execute on function public.gest_strumenti_miei(uuid) to authenticated;
