-- 19 ott 2026 — «Ho visto» per le richieste di incarico ai professionisti (già eseguito sul database)
alter table public.incarichi_richieste add column if not exists visto_il timestamptz;
update public.incarichi_richieste set visto_il = created_at where visto_il is null and created_at < now();

create or replace function public.segna_incarico_visto(p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.incarichi_richieste r set visto_il = now()
   where r.id = p_id and r.visto_il is null
     and r.professionista_id in (select i.id from public.imprese i where i.user_id = auth.uid());
  return found;
end; $$;

revoke all on function public.segna_incarico_visto(bigint) from public, anon;
grant execute on function public.segna_incarico_visto(bigint) to authenticated;
