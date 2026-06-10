-- ============================================================
-- TrovaImpresa — Trigger valutazione_media
-- Crea la colonna imprese.valutazione_media (se manca) e la tiene
-- aggiornata a ogni recensione, con la stessa formula del profilo.
-- ============================================================

alter table public.imprese
  add column if not exists valutazione_media numeric default 0;

create or replace function public.aggiorna_valutazione_media()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_impresa bigint;
  v_media numeric;
begin
  v_impresa := coalesce(NEW.impresa_id, OLD.impresa_id);

  select avg(s) into v_media
  from public.feedback_clienti f
  cross join lateral unnest(
    array[f.stelle_qualita, f.stelle_puntualita, f.stelle_prezzo, f.stelle_professionalita]
  ) as s
  where f.impresa_id = v_impresa and s is not null;

  update public.imprese
     set valutazione_media = coalesce(v_media, 0)
   where id = v_impresa;

  return null;
end;
$$;

drop trigger if exists trg_valutazione_media on public.feedback_clienti;
create trigger trg_valutazione_media
  after insert or update or delete on public.feedback_clienti
  for each row execute function public.aggiorna_valutazione_media();

update public.imprese i
   set valutazione_media = coalesce(sub.media, 0)
  from (
    select f.impresa_id, avg(s) as media
    from public.feedback_clienti f
    cross join lateral unnest(
      array[f.stelle_qualita, f.stelle_puntualita, f.stelle_prezzo, f.stelle_professionalita]
    ) as s
    where s is not null
    group by f.impresa_id
  ) sub
 where i.id = sub.impresa_id;
