-- 19 ott 2026 — «Ho visto» e avviso richieste da leggere (già eseguito sul database)
alter table public.preventivi add column if not exists visto_il timestamptz;

create or replace view public.preventivi_safe as
 SELECT id, impresa_id, nome, tipo_lavoro, descrizione, created_at, cognome, risposta, prezzo_min, prezzo_max, risposta_at, stato, citta, via, piano, mq, categoria_lavoro, voci_lavoro, validita_giorni, iva_inclusa, note_aggiuntive, data_preferita, urgenza, budget, foto, allegati, visto_il
   FROM preventivi;

create or replace function public.segna_preventivo_visto(p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.preventivi p set visto_il = now()
   where p.id = p_id and p.visto_il is null
     and p.impresa_id in (select i.id from public.imprese i where i.user_id = auth.uid());
  return found;
end; $$;

revoke all on function public.segna_preventivo_visto(bigint) from public, anon;
grant execute on function public.segna_preventivo_visto(bigint) to authenticated;
