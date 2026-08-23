-- =====================================================================
-- TrovaImpresa — PERCHE' NON ARRIVANO PIU' ISCRIZIONI — 23 agosto 2026
--
-- Si incolla tutta nell'SQL Editor di Supabase e si preme Run.
-- ⚠️ Legge soltanto: non scrive, non cancella, non cambia niente.
--
-- Risponde a tre domande, in tre tabelle una sotto l'altra:
--   1) quanti account nascono ogni giorno, e di che tipo
--   2) l'ultimo iscritto quando e' arrivato
--   3) i trigger della registrazione stanno dando errore?
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. GLI ULTIMI 21 GIORNI, UNO PER RIGA
--    «confermate» = ha cliccato il link nella mail. Se nascono account ma
--    nessuno conferma, il problema e' la mail, non il sito.
-- ---------------------------------------------------------------------
select
  date(u.created_at)                                                    as giorno,
  count(*)                                                              as account_nati,
  count(*) filter (where u.email_confirmed_at is not null)              as email_confermate,
  count(*) filter (where u.raw_user_meta_data->>'tipo' = 'impresa')        as imprese,
  count(*) filter (where u.raw_user_meta_data->>'tipo' = 'artigiano')      as artigiani,
  count(*) filter (where u.raw_user_meta_data->>'tipo' = 'professionista') as professionisti,
  count(*) filter (where u.raw_user_meta_data->>'tipo' = 'negozio')        as negozi,
  count(*) filter (where coalesce(u.raw_user_meta_data->>'tipo','') = '')  as senza_tipo
from auth.users u
where u.created_at > now() - interval '21 days'
group by 1
order by 1 desc;


-- ---------------------------------------------------------------------
-- 2. L'ULTIMO ARRIVATO, E QUANTO TEMPO E' PASSATO
-- ---------------------------------------------------------------------
select
  max(u.created_at)                                       as ultimo_account,
  now() - max(u.created_at)                               as quanto_tempo_fa,
  count(*) filter (where u.created_at > now() - interval  '7 days') as ultimi_7_giorni,
  count(*) filter (where u.created_at > now() - interval '30 days') as ultimi_30_giorni,
  count(*)                                                as totale_di_sempre
from auth.users u;


-- ---------------------------------------------------------------------
-- 3. I TRIGGER SI STANNO ROMPENDO?
--    Questa tabella l'abbiamo messa il 19 agosto apposta: se qui dentro
--    compare qualcosa, un pezzo della registrazione sta fallendo.
-- ---------------------------------------------------------------------
select e.quando, e.dove, e.errore, e.dettaglio
from public.errori_trigger e
order by e.quando desc
limit 20;


-- ---------------------------------------------------------------------
-- 4. GLI ACCOUNT NATI SENZA PROFILO
--    Se un account esiste in auth.users ma la riga in «imprese» non c'e',
--    il trigger principale sta fallendo: l'iscritto non compare da nessuna
--    parte e non riesce nemmeno a entrare.
-- ---------------------------------------------------------------------
select
  count(*) as account_senza_scheda,
  min(u.created_at) as il_primo,
  max(u.created_at) as l_ultimo
from auth.users u
left join public.imprese i on i.user_id = u.id
where u.created_at > now() - interval '30 days'
  and i.id is null
  and lower(coalesce(u.raw_user_meta_data->>'tipo','')) in ('impresa','artigiano','professionista','negozio');
