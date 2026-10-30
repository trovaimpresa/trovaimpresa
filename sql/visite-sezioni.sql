-- 30 ottobre 2026 — QUANTE PERSONE APRONO LE PAGINE DI UNA SEZIONE
-- Serve alle carte in cima a Subappalti, Offerte di lavoro e Candidati
-- nel pannello admin. Conta le SESSIONI diverse (persone), non le pagine.
-- La chiama solo admin-visite.js con la chiave di servizio.
create or replace function public.admin_visite_sezioni()
returns json language sql stable security definer set search_path = public as $$
  with v as (
    select sessione, creato_il,
      case
        when pagina ~ '^/subappalto' then 'subappalti'
        when pagina ~ '^/(offerte-lavoro|lavoro-edilizia|trova-cantieri|quanto-guadagna)' then 'lavoro'
        when pagina ~ '^/(registrazione-candidato|login-candidato|pannello-candidato)' then 'candidati'
      end as sez
    from visite_sito
    where creato_il > now() - interval '30 days'
  )
  select coalesce(json_object_agg(sez, json_build_object(
           'p7',  p7,
           'p30', p30)), '{}'::json)
  from (
    select sez,
      count(distinct sessione) filter (where creato_il > now() - interval '7 days') as p7,
      count(distinct sessione) as p30
    from v where sez is not null group by sez
  ) x;
$$;
revoke all on function public.admin_visite_sezioni() from public, anon, authenticated;
grant execute on function public.admin_visite_sezioni() to service_role;
