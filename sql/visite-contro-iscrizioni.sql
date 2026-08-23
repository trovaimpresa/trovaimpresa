-- =====================================================================
-- TrovaImpresa — LA GENTE ARRIVA ANCORA? — 23 agosto 2026
--
-- Si incolla in una scheda VUOTA dell'SQL Editor di Supabase e si preme Run.
-- ⚠️ Legge soltanto: non scrive e non cancella niente.
--
-- Mette una accanto all'altra due cose che finora abbiamo guardato separate:
--   quante persone ARRIVANO sul sito  (tabella visite_sito, quella che conta
--                                      tutti anche senza cookie)
--   quante si ISCRIVONO davvero       (auth.users)
--
-- COME SI LEGGE
--   · visitatori a zero            -> non e' il sito: non arriva nessuno (Meta)
--   · visitatori normali, iscritti a zero -> arrivano ma non riescono: e' il sito
--   · «hanno_aperto_iscrizione» alto e «si_sono_iscritti» zero
--                                  -> compilano il modulo e si inceppa in fondo
-- =====================================================================

with visite as (
  select
    date(v.creato_il)                                                  as giorno,
    count(distinct v.sessione) filter (where v.fase = 'arrivo')        as visitatori,
    count(distinct v.sessione) filter (where v.fase = 'arrivo'
                                         and v.da_meta)                as arrivati_da_meta,
    count(distinct v.sessione) filter (where v.fase = 'arrivo'
                                         and v.pagina like '/registrazione%')
                                                                       as hanno_aperto_iscrizione
  from public.visite_sito v
  where v.creato_il > now() - interval '14 days'
  group by 1
),
nati as (
  select date(u.created_at) as giorno, count(*) as si_sono_iscritti
  from auth.users u
  where u.created_at > now() - interval '14 days'
  group by 1
)
select
  coalesce(v.giorno, n.giorno)          as giorno,
  coalesce(v.visitatori, 0)             as visitatori,
  coalesce(v.arrivati_da_meta, 0)       as da_meta,
  coalesce(v.hanno_aperto_iscrizione, 0) as hanno_aperto_iscrizione,
  coalesce(n.si_sono_iscritti, 0)       as si_sono_iscritti
from visite v
full outer join nati n on n.giorno = v.giorno
order by 1 desc;
