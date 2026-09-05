-- =====================================================================
-- COLLEGARE LA VISITA ALL'ISCRIZIONE  --  5 settembre 2026
-- =====================================================================
-- Prima si sapeva quante VISITE arrivavano da ogni canale, ma non quante
-- ISCRIZIONI: la card «Da dove arrivano» contava solo chi passava, e la
-- domanda vera — «Facebook mi porta iscritti o solo curiosi?» — non aveva
-- risposta. Senza quel numero non si puo' dire se la pubblicita' conviene.
--
-- ⚠️ Vale dal 5 settembre in poi: chi si e' iscritto PRIMA non ha nessuna
-- traccia di dove fosse arrivato, e non si puo' ricostruire.
--
-- Gia' passato sul database il 5 set 2026. Si puo' rilanciare.
-- =====================================================================

-- 1) LA REGOLA DEL CANALE, IN UN POSTO SOLO.
--    Era scritta dentro la vista `arrivi_per_canale`. Copiandola nella vista
--    delle iscrizioni sarebbero diventate due copie che col tempo si
--    scollano — il difetto piu' caro di questo progetto (vedi la sezione del
--    4 settembre in CLAUDE.md). Adesso e' una funzione, e la usano tutte e due.
create or replace function public.canale_da_provenienza(p text)
returns text language sql immutable set search_path = public as $$
  select case
    when p is null or p = ''            then 'Diretto o sconosciuto'
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
$$;

-- 2) la vista delle VISITE usa la funzione (stessi numeri di prima: 8 canali)
create or replace view public.arrivi_per_canale
with (security_invoker = true) as
 with base as (
   select public.canale_da_provenienza(v.provenienza) as canale,
          v.sessione, v.creato_il, v.da_meta
     from public.visite_sito v
 )
 select canale,
   count(distinct sessione) filter (where creato_il >= now() - interval '30 days') as persone_30gg,
   count(*)                 filter (where creato_il >= now() - interval '30 days') as visite_30gg,
   count(distinct sessione) filter (where creato_il >= now() - interval '60 days' and creato_il < now() - interval '30 days') as persone_30gg_prima,
   count(distinct sessione) filter (where creato_il >= now() - interval '7 days')  as persone_7gg,
   count(distinct sessione) filter (where da_meta) as persone_dagli_annunci,
   count(distinct sessione) as persone_sempre,
   count(*) as visite_sempre
 from base group by canale;

-- 3) LA RIGA CHE MANCAVA: al momento dell'iscrizione si segna la sessione.
--    Solo scrittura, come `visite_sito`: la pagina di registrazione non e'
--    ancora loggata quando la scrive, e dal browser non si rilegge nessuno.
create table if not exists public.iscrizioni_provenienza (
  user_id   uuid        primary key,
  sessione  text,
  tipo      text,
  creato_il timestamptz not null default now()
);
alter table public.iscrizioni_provenienza enable row level security;
drop policy if exists "iscrizioni_provenienza_scrivi" on public.iscrizioni_provenienza;
create policy "iscrizioni_provenienza_scrivi"
on public.iscrizioni_provenienza for insert to anon, authenticated with check (true);
grant insert on public.iscrizioni_provenienza to anon, authenticated;

-- 4) le ISCRIZIONI per canale. La provenienza si prende dalla PRIMA visita
--    di quella sessione: e' il punto in cui la persona e' entrata nel sito.
create or replace view public.iscrizioni_per_canale
with (security_invoker = true) as
 with prima_visita as (
   select distinct on (v.sessione) v.sessione, v.provenienza, v.da_meta
     from public.visite_sito v
    where v.sessione is not null
    order by v.sessione, v.creato_il asc
 )
 select public.canale_da_provenienza(pv.provenienza) as canale,
        count(*)                                                          as iscrizioni_sempre,
        count(*) filter (where i.creato_il >= now() - interval '30 days')  as iscrizioni_30gg,
        count(*) filter (where i.creato_il >= now() - interval '7 days')   as iscrizioni_7gg,
        count(*) filter (where pv.da_meta)                                 as iscrizioni_dagli_annunci
   from public.iscrizioni_provenienza i
   left join prima_visita pv on pv.sessione = i.sessione
  group by public.canale_da_provenienza(pv.provenienza);
