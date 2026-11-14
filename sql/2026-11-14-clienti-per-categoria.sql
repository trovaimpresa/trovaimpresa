-- 14 novembre 2026 - «Clienti per categoria» nel pannello admin.
-- Per artigiani, imprese e professionisti: visite alle schede, ricerche,
-- ricerche a vuoto, contatti, preventivi/incarichi, chat, andamento per
-- settimana, cosa guardano, cosa cercano e cosa cercano senza trovarlo.
-- Legge solo il service role (admin-clienti-categoria.js).
create or replace function public.admin_clienti_categoria(p_giorni int default 30)
returns jsonb
language sql
security definer
set search_path = public
as $$
with par as (
  select now() - make_interval(days => (case when coalesce(p_giorni,0) <= 0 then 3650 else p_giorni end)) as dal,
         now() - make_interval(days => 2*(case when coalesce(p_giorni,0) <= 0 then 3650 else p_giorni end)) as prima
),
cat(tipo) as (values ('artigiano'),('impresa'),('professionista')),
imp as (select id::text id, tipo, coalesce(nullif(trim(mestiere),''),'Altro') mestiere from imprese where tipo in ('artigiano','impresa','professionista')),
ric as (
  select v.*, case when v.pagina ilike '%artigian%' then 'artigiano'
                   when v.pagina ilike '%professionist%' then 'professionista'
                   when v.pagina ilike '%impres%' then 'impresa' end as cat
  from visite_clienti v where v.tipo = 'ricerca'
),
sch as (
  select v.creato_il, i.tipo cat, i.mestiere from visite_clienti v join imp i on i.id = v.impresa_id::text where v.tipo = 'scheda'
)
select jsonb_build_object(
  'giorni', p_giorni,
  'conta_da', (select min(creato_il) from visite_clienti),
  'categorie', (select jsonb_object_agg(c.tipo, jsonb_build_object(
     'iscritti', (select count(*) from imp where imp.tipo = c.tipo),
     'visite', (select count(*) from sch, par where sch.cat = c.tipo and sch.creato_il >= par.dal),
     'visite_prima', (select count(*) from sch, par where sch.cat = c.tipo and sch.creato_il >= par.prima and sch.creato_il < par.dal),
     'ricerche', (select count(*) from ric, par where ric.cat = c.tipo and ric.creato_il >= par.dal),
     'vuote', (select count(*) from ric, par where ric.cat = c.tipo and ric.creato_il >= par.dal and coalesce(ric.risultati,0) = 0),
     'contatti', (select count(*) from contatti k join imp i on i.id = k.impresa_id::text, par where i.tipo = c.tipo and k.created_at >= par.dal),
     'contatti_tipo', (select coalesce(jsonb_object_agg(t, n), '{}'::jsonb) from (select k.tipo t, count(*) n from contatti k join imp i on i.id = k.impresa_id::text, par where i.tipo = c.tipo and k.created_at >= par.dal group by k.tipo) x),
     'preventivi', (select count(*) from preventivi p join imp i on i.id = p.impresa_id::text, par where i.tipo = c.tipo and p.created_at >= par.dal)
                 + (select count(*) from incarichi_richieste r join imp i on i.id = r.professionista_id::text, par where i.tipo = c.tipo and r.created_at >= par.dal),
     'chat', (select count(distinct m.conversation_id) from chat_messaggi m join imp i on i.id = m.impresa_id::text, par where i.tipo = c.tipo and m.created_at >= par.dal),
     'settimane', (select coalesce(jsonb_agg(jsonb_build_object('s', s, 'n', n) order by s), '[]'::jsonb) from (
         select gs::date s, (select count(*) from sch where sch.cat = c.tipo and sch.creato_il >= gs and sch.creato_il < gs + interval '7 days') n
         from generate_series(date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week') gs) w),
     'guardati', (select coalesce(jsonb_agg(jsonb_build_object('k', mestiere, 'n', n) order by n desc), '[]'::jsonb) from (
         select mestiere, count(*) n from sch, par where sch.cat = c.tipo and sch.creato_il >= par.dal group by mestiere order by 2 desc limit 6) g),
     'cercati', (select coalesce(jsonb_agg(jsonb_build_object('k', cosa, 'n', n) order by n desc), '[]'::jsonb) from (
         select trim(cosa) cosa, count(*) n from ric, par where ric.cat = c.tipo and ric.creato_il >= par.dal and coalesce(trim(cosa),'') <> '' group by 1 order by 2 desc limit 6) g),
     'non_trovati', (select coalesce(jsonb_agg(jsonb_build_object('k', cosa, 'dove', dove, 'n', n) order by n desc), '[]'::jsonb) from (
         select coalesce(nullif(trim(cosa),''),'Qualsiasi mestiere') cosa, coalesce(nullif(trim(dove),''),'—') dove, count(*) n
         from ric, par where ric.cat = c.tipo and ric.creato_il >= par.dal and coalesce(ric.risultati,0) = 0
         group by 1,2 order by 3 desc limit 8) g)
  )) from cat c)
);
$$;
revoke all on function public.admin_clienti_categoria(int) from public, anon, authenticated;
grant execute on function public.admin_clienti_categoria(int) to service_role;
