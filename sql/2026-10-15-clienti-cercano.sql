-- 15 ott 2026: pagina admin «Clienti che cercano».
-- Quante PERSONE (non clic) sono entrate nel sito, hanno cercato un'impresa,
-- hanno preso un contatto, hanno lasciato una richiesta o un preventivo.
-- p_giorni: 1 = oggi (giorno di Roma), N = ultimi N giorni, 0 = da sempre.
-- Solo service role (la chiama netlify/functions/admin-clienti-cercano.js).
-- GIA' APPLICATA sul database il 15 ott 2026 (migrazione admin_clienti_cercano).
create or replace function public.admin_clienti_cercano(p_giorni integer default 30)
returns json
language sql
security definer
set search_path to 'public'
as $$
  with f as (
    select case
      when coalesce(p_giorni,0) <= 0 then '-infinity'::timestamptz
      when p_giorni = 1 then (date_trunc('day', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome')
      else now() - (p_giorni || ' days')::interval
    end as da
  )
  select json_build_object(
    'entrati',  (select count(distinct sessione) from visite_sito, f where creato_il >= f.da),
    'cercato',  (select count(distinct sessione) from visite_clienti, f where tipo = 'ricerca' and creato_il >= f.da),
    'contatto', (select count(distinct visitatore) from contatti, f where created_at >= f.da),
    'richiesta',
        (select count(*) from richieste_clienti, f where creato_il >= f.da)
      + (select count(*) from preventivi, f where created_at >= f.da)
      + (select count(*) from messaggi, f where created_at >= greatest(f.da::timestamp, timestamp '2026-10-15 00:00')),
    'entrati_da',  (select min(creato_il) from visite_sito),
    'cercato_da',  (select min(creato_il) from visite_clienti where tipo = 'ricerca')
  );
$$;

revoke all on function public.admin_clienti_cercano(integer) from public, anon, authenticated;
grant execute on function public.admin_clienti_cercano(integer) to service_role;
