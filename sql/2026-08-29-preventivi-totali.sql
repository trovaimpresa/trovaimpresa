-- =====================================================================
-- I TOTALI DEI PREVENTIVI — 29 agosto 2026
-- GIA' ESEGUITO su Supabase il 29 agosto 2026. Sta qui per memoria.
--
-- A COSA SERVE
-- Il totale di un preventivo esisteva SOLO nel browser, dentro
-- calcolaParcella() di gestionale-app.html. Il server non lo sapeva: ne'
-- la chat, ne' l'email del lunedi'. Qui la formula si sposta nel database,
-- come gia' e' per le fatture (gest_fatture_totali).
--
-- ⛔ NON RICOPIARE QUESTA FORMULA DA NESSUN'ALTRA PARTE. Due copie della
--    stessa formula dei soldi si scollano: e' successo il 16 agosto fra
--    preventivo e fattura, su una parcella su quattro.
--
-- ⛔ LA COSA IMPORTANTE, MISURATA E NON SUPPOSTA:
--    il browser e il database NON possono dare sempre lo stesso numero.
--    Il browser usa la virgola mobile: 2280,805 x 100 li' fa
--    228080,49999999997, e l'arrotondamento va in giu'. Il database fa i
--    conti esatti e arrotonda a 2280,81.
--    Su 200.000 parcelle provate: 252 numeri diversi (uno ogni 794), mai
--    piu' di DUE centesimi, e i casi da due centesimi sono 4.
--    Sui preventivi veri di oggi: nessuna differenza.
--    Non e' il database che sbaglia: e' il browser. Sistemare il browser e'
--    un lavoro a parte, perche' tocca preventivo E fattura insieme.
--    Il banco che lo misura: prove-claude/banco-preventivi-29ago.zip
-- =====================================================================

drop view if exists public.gest_preventivi_totali;
drop function if exists public.gest_parcella(numeric, numeric, numeric, boolean, numeric, numeric, boolean);

-- LA PARCELLA, in un posto solo.
-- `pro` = studio tecnico (imprese.tipo = 'professionista'). Gli altri hanno
-- la formula corta: solo IVA, niente cassa, niente spese, niente ritenuta.
-- Sono i due rami che stanno in gestionale-app.html.
create function public.gest_parcella(
  compenso     numeric,
  cassa_perc   numeric,
  iva_perc     numeric,   -- null = aliquota non indicata
  con_ritenuta boolean,
  rit_perc     numeric,
  spese        numeric,
  pro          boolean
)
returns table (
  compenso_out numeric, cassa numeric, spese_out numeric,
  base_iva numeric, imponibile numeric, iva numeric,
  ritenuta numeric, totale numeric
)
language sql immutable parallel safe
set search_path = pg_catalog
as $$
  with p as (
    select round(coalesce(compenso, 0), 2) as c,
           coalesce(cassa_perc, 0)         as cp,
           iva_perc                        as ip,
           coalesce(con_ritenuta, false)   as cr,
           -- ⚠️ in JavaScript `ritenuta_perc || 20` vale 20 anche a ZERO
           case when coalesce(rit_perc, 0) = 0 then 20::numeric else rit_perc end as rp,
           coalesce(spese, 0)              as sp,
           coalesce(pro, false)            as pro
  ),
  a as (select p.*, round(p.c * p.cp / 100, 2) as cassa from p),
  b as (select a.*, round(a.c + a.cassa, 2) as base_iva from a),
  c as (
    select b.*,
           round(b.base_iva + b.sp, 2)                    as imponibile,
           round(b.base_iva * coalesce(b.ip, 0) / 100, 2) as iva_pro,
           -- ⛔ la ritenuta NON si arrotonda prima di entrare nel totale
           case when b.cr then b.c * b.rp / 100 else 0::numeric end as rit_grezza
    from b
  ),
  d as (
    select c.*,
           case when c.ip is null then 0::numeric else round(c.c * c.ip / 100, 2) end as iva_no_pro
    from c
  )
  select
    d.c,
    case when d.pro then d.cassa else 0::numeric end,
    case when d.pro then round(d.sp, 2) else 0::numeric end,
    case when d.pro then d.base_iva else d.c end,
    case when d.pro then d.imponibile else d.c end,
    case when d.pro then d.iva_pro else d.iva_no_pro end,
    case when d.pro then round(d.rit_grezza, 2) else 0::numeric end,
    case when d.pro then round(d.imponibile + d.iva_pro - d.rit_grezza, 2)
         when d.ip is null then d.c
         else round(d.c + d.iva_no_pro, 2) end
  from d;
$$;

-- ⛔ security_invoker come gest_fatture_totali: la RLS resta accesa e
--    ognuno vede solo i suoi preventivi.
-- ⚠️ Le righe di CAPITOLO (sezione = true) si saltano: e' la stessa regola
--    di prevTotaleLive(). Oggi l'unica che esiste vale zero.
create view public.gest_preventivi_totali
with (security_invoker = true) as
select
  p.id           as preventivo_id,
  p.user_id,
  p.mestiere_id,
  q.compenso_out as compenso,
  q.cassa,
  q.spese_out    as spese,
  q.imponibile,
  q.iva,
  q.ritenuta,
  q.totale,
  r.n_righe
from public.gest_preventivi p
left join public.imprese i on i.user_id = p.user_id
left join lateral (
  select
    -- ⚠️ e' impRiga(): una quantita' a zero o mancante vale 1
    coalesce(sum(round(
      (case when coalesce(x.qta, 0) = 0 then 1 else x.qta end) * coalesce(x.prezzo, 0), 2)), 0) as somma,
    count(*) as n_righe
  from public.gest_preventivo_righe x
  where x.preventivo_id = p.id
    and coalesce(x.sezione, false) = false
) r on true
left join lateral public.gest_parcella(
  r.somma,
  coalesce(p.cassa_perc, 0),
  p.iva_perc,
  coalesce(p.ritenuta, false),
  p.ritenuta_perc,
  coalesce(p.spese_forfait, 0),
  coalesce(i.tipo, '') = 'professionista'
) q on true;

revoke all on function public.gest_parcella(numeric, numeric, numeric, boolean, numeric, numeric, boolean) from anon;

-- ⛔ E la chat impara i preventivi: chat_soldi() adesso risponde anche con
--    'preventivi_in_attesa' e 'preventivi_accettati', letti DA QUESTA VISTA.
--    La definizione aggiornata di chat_soldi e' su Supabase.
