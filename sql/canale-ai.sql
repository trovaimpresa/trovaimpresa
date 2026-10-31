-- 31 ott 2026 — «ChatGPT e altre AI» diventa un canale suo in «Da dove arrivano».
-- Prima chi arrivava da ChatGPT (utm_source=chatgpt.com, senza provenienza)
-- finiva in «Diretto o sconosciuto», e Meta AI finiva in «Altro».
-- Si riconosce l'AI sia dalla provenienza sia da utm_source.

create or replace function public.canale_da_provenienza(p text)
 returns text language sql immutable set search_path to 'public'
as $function$
  select case
    when p is null or p = ''            then 'Diretto o sconosciuto'
    when p ilike 'google_ads%'          then 'Google Ads (a pagamento)'
    when p ~* '(chatgpt|openai|meta\.ai|perplexity|copilot|gemini\.google|claude\.ai)'
                                        then 'ChatGPT e altre AI'
    when p ilike '%trovaimpresa.com%'   then 'Giro dentro il sito'
    when p ilike '%facebook%'           then 'Facebook'
    when p ilike '%instagram%'          then 'Instagram'
    when p ilike '%threads%'            then 'Threads'
    when p ilike '%linkedin%'           then 'LinkedIn'
    when p ilike '%google%'             then 'Google'
    when p ilike '%bing%' or p ilike '%duckduckgo%' or p ilike '%ecosia%' or p ilike '%yahoo%'
                                        then 'Altri motori di ricerca'
    else 'Altro'
  end
$function$;

create or replace view public.arrivi_per_canale
with (security_invoker = true) as
 with base as (
   select canale_da_provenienza(
            case when v.utm_source ilike 'google_ads%' then 'google_ads'
                 when v.utm_source ~* '(chatgpt|openai|perplexity|copilot|gemini|claude)' then v.utm_source
                 else v.provenienza end) as canale,
          v.sessione, v.creato_il, v.da_meta
     from visite_sito v)
 select canale,
    count(distinct sessione) filter (where creato_il >= now() - '30 days'::interval) as persone_30gg,
    count(*) filter (where creato_il >= now() - '30 days'::interval) as visite_30gg,
    count(distinct sessione) filter (where creato_il >= now() - '60 days'::interval and creato_il < now() - '30 days'::interval) as persone_30gg_prima,
    count(distinct sessione) filter (where creato_il >= now() - '7 days'::interval) as persone_7gg,
    count(distinct sessione) filter (where da_meta) as persone_dagli_annunci,
    count(distinct sessione) as persone_sempre,
    count(*) as visite_sempre
   from base group by canale;

create or replace view public.iscrizioni_per_canale
with (security_invoker = true) as
 with prima_visita as (
   select distinct on (v.sessione) v.sessione,
          case when v.utm_source ilike 'google_ads%' then 'google_ads'
               when v.utm_source ~* '(chatgpt|openai|perplexity|copilot|gemini|claude)' then v.utm_source
               else v.provenienza end as provenienza,
          v.da_meta
     from visite_sito v where v.sessione is not null
    order by v.sessione, v.creato_il)
 select canale_da_provenienza(pv.provenienza) as canale,
    count(*) as iscrizioni_sempre,
    count(*) filter (where i.creato_il >= now() - '30 days'::interval) as iscrizioni_30gg,
    count(*) filter (where i.creato_il >= now() - '7 days'::interval) as iscrizioni_7gg,
    count(*) filter (where pv.da_meta) as iscrizioni_dagli_annunci
   from iscrizioni_provenienza i left join prima_visita pv on pv.sessione = i.sessione
  group by canale_da_provenienza(pv.provenienza);
