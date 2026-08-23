-- =====================================================================
-- TrovaImpresa — DOVE ATTERRA CHI ARRIVA DA META — 23 agosto 2026
--
-- Scheda VUOTA dell'SQL Editor, incolla, Run. Legge soltanto.
--
-- PERCHE'
-- La gente arriva (19-23 visitatori al giorno da Meta), ma quasi nessuno
-- apre la pagina di iscrizione. Delle due l'una: o l'inserzione li porta
-- su una pagina da cui non si iscrivono, o da li' non trovano la strada.
-- Queste tre tabelle dicono quale delle due.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LE PAGINE DOVE ATTERRANO, ULTIMI 5 GIORNI
--    «arrivo» = ha aperto la pagina · «visto» = c'era ancora dopo 2 secondi.
--    Se «visti» e' molto piu' basso di «arrivi», se ne vanno prima di vedere.
-- ---------------------------------------------------------------------
select
  v.pagina,
  count(distinct v.sessione) filter (where v.fase = 'arrivo')               as arrivi,
  count(distinct v.sessione) filter (where v.fase = 'visto')                as visti,
  count(distinct v.sessione) filter (where v.fase = 'arrivo' and v.da_meta) as da_meta,
  count(distinct v.sessione) filter (where v.fase = 'arrivo' and v.telefono) as da_telefono
from public.visite_sito v
where v.creato_il > now() - interval '5 days'
group by 1
order by 2 desc
limit 30;


-- ---------------------------------------------------------------------
-- 2. LA PRIMA PAGINA DI CHI ARRIVA DA META
--    Una riga per visita: la pagina su cui e' atterrato per primo.
--    E' esattamente la pagina di destinazione dell'inserzione.
-- ---------------------------------------------------------------------
with prima_pagina as (
  select distinct on (v.sessione)
         v.sessione, v.pagina, v.creato_il, v.utm_campaign
  from public.visite_sito v
  where v.fase = 'arrivo'
    and v.da_meta
    and v.creato_il > now() - interval '7 days'
    and v.sessione is not null
  order by v.sessione, v.creato_il
)
select
  date(p.creato_il)          as giorno,
  p.pagina                   as pagina_di_atterraggio,
  coalesce(p.utm_campaign, '(nessuna utm)') as campagna,
  count(*)                   as quanti
from prima_pagina p
group by 1, 2, 3
order by 1 desc, 4 desc;


-- ---------------------------------------------------------------------
-- 3. QUANTI, DOPO ESSERE ATTERRATI, ARRIVANO ALL'ISCRIZIONE
--    Stessa sessione: e' arrivato da Meta E poi ha aperto una pagina
--    «registrazione-…». E' il buco del percorso, misurato.
-- ---------------------------------------------------------------------
with sessioni_meta as (
  select distinct v.sessione, date(v.creato_il) as giorno
  from public.visite_sito v
  where v.da_meta and v.fase = 'arrivo'
    and v.creato_il > now() - interval '7 days'
    and v.sessione is not null
),
arrivate_a_iscrizione as (
  select distinct v.sessione
  from public.visite_sito v
  where v.pagina like '/registrazione%'
    and v.creato_il > now() - interval '7 days'
)
select
  m.giorno,
  count(*)                                            as arrivati_da_meta,
  count(*) filter (where a.sessione is not null)      as poi_hanno_aperto_iscrizione,
  round(100.0 * count(*) filter (where a.sessione is not null) / nullif(count(*), 0), 1)
                                                      as percentuale
from sessioni_meta m
left join arrivate_a_iscrizione a on a.sessione = m.sessione
group by 1
order by 1 desc;
