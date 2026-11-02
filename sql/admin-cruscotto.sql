-- ============================================================
-- 2 novembre 2026 — IL CRUSCOTTO DELL'ADMIN: COSA FANNO I CLIENTI, E I SOLDI
--
-- Alex: «cosa mi manca, posso avere piu' informazioni nel pannello admin?»
-- I dati c'erano gia' quasi tutti (visite_clienti, contatti, visite_sito,
-- accessi_pannello, pagamenti) ma stavano dentro le sezioni: sulla
-- Dashboard non si vedevano. Questa funzione li mette insieme in UNA
-- domanda sola, letta da netlify/functions/admin-cruscotto.js.
--
-- Solo service_role: niente anon, niente authenticated (ci sono dentro
-- incassi e comportamenti degli iscritti).
-- ============================================================
create or replace function public.admin_cruscotto(p_giorni int default 30)
returns json
language sql
stable
security definer
set search_path = public
as $$
with
  dal as (select now() - make_interval(days => greatest(coalesce(p_giorni, 30), 1)) as t),
  ric as (
    select v.* from visite_clienti v, dal
    where v.tipo = 'ricerca' and v.creato_il >= dal.t
  ),
  con as (
    select c.* from contatti c, dal where c.created_at >= dal.t
  ),
  -- da dove arrivano: una persona = una sessione, contata col suo primo arrivo
  arrivi as (
    select distinct on (s.sessione) s.sessione,
      case
        when s.provenienza is null or s.provenienza = '' then 'diretti'
        when s.provenienza ilike '%trovaimpresa%' then null           -- il sito stesso: non e' una provenienza
        when s.provenienza ilike '%googlequicksearchbox%'
          or s.provenienza ~* '(^|\.)google\.[a-z.]+$' then 'Google'
        when s.provenienza ~* '(facebook|instagram|meta\.ai|threads)' then 'Facebook'
        when s.provenienza ~* '(chatgpt|perplexity|gemini|copilot|claude)' then 'AI'
        when s.provenienza ~* 'bing' then 'Bing'
        else 'altri'
      end as fonte
    from visite_sito s, dal
    where s.creato_il >= dal.t and s.sessione is not null
    order by s.sessione, s.creato_il
  ),
  fonti as (
    select fonte, count(*) as n from arrivi where fonte is not null group by fonte
  ),
  vere as (
    select i.* from imprese i where coalesce(i.is_test, false) = false
  )
select json_build_object(
  'giorni',            greatest(coalesce(p_giorni, 30), 1),
  'ricerche',          (select count(*) from ric),
  'vuote',             (select count(*) from ric where risultati = 0),
  'vuota_top',         (select json_build_object('cosa', cosa, 'dove', dove, 'n', n) from (
                          select cosa, dove, count(*) as n, max(creato_il) as ult
                          from ric where risultati = 0 and coalesce(cosa, '') <> '' and coalesce(dove, '') <> ''
                          group by cosa, dove order by n desc, ult desc limit 1) t),
  'contatti',          (select count(*) from con),
  'contatti_telefono', (select count(*) from con where tipo = 'telefono'),
  'contatti_imprese',  (select count(distinct impresa_id) from con),
  'fonti',             (select coalesce(json_object_agg(fonte, n), '{}'::json) from fonti),
  'spente',            (select count(*) from vere i
                          where exists (select 1 from accessi_pannello a where a.user_id = i.user_id)
                            and not exists (select 1 from accessi_pannello a, dal
                                            where a.user_id = i.user_id and a.aperto_il >= dal.t)),
  'incasso_mese',      (select coalesce(sum(importo_eur), 0) from pagamenti
                          where quando >= date_trunc('month', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome'),
  'incasso_totale',    (select coalesce(sum(importo_eur), 0) from pagamenti),
  -- 2 nov 2026: Premium e Free non esistono piu' (deciso il 31 ott). Si pagano
  -- solo i pacchetti: crediti AI, messaggi della chat, invii SDI.
  -- un rimborso (riga negativa) toglie il pacchetto che annulla
  'pacchetti_mese',    (select coalesce(sum(sign(importo_eur)), 0)::int from pagamenti
                          where prodotto in ('crediti-ai', 'messaggi-chat', 'invii-sdi')
                            and quando >= date_trunc('month', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome'),
  'pacchetti_totale',  (select coalesce(sum(sign(importo_eur)), 0)::int from pagamenti
                          where prodotto in ('crediti-ai', 'messaggi-chat', 'invii-sdi'))
);
$$;

revoke all on function public.admin_cruscotto(int) from public, anon, authenticated;
grant execute on function public.admin_cruscotto(int) to service_role;
