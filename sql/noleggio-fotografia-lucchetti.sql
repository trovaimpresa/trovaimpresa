-- ============================================================
-- TrovaImpresa — LA FOTOGRAFIA DEI LUCCHETTI DEL NOLEGGIO
-- 23 agosto 2026
--
-- ⛔ NON CAMBIA NIENTE. Legge e basta. Si puo' lanciare cento volte.
--
-- PERCHE'
-- Il cancello della PAGINA adesso c'e' (js/gate-gestionale.js, lo stesso
-- del gestionale imprese). Ma il cancello della pagina non protegge i
-- dati: protegge la schermata. Il lucchetto vero sono le regole di
-- Supabase, e sulle tabelle del noleggio non sappiamo che regole ci
-- siano — nel referto del 22 agosto era scritto proprio cosi':
-- «le tabelle nol_* non hanno nessun file in sql/: non so che regole
-- abbiano sul database».
--
-- Prima di mettere sopra a quelle tabelle contratti, codici fiscali di
-- operatori e foto dei mezzi, bisogna sapere com'e' fatta la serratura.
-- Questa query fa la fotografia. Poi si decide.
--
-- COSA GUARDA, per ognuna delle sette tabelle del noleggio e del
-- magazzino:
--   · il lucchetto (RLS) e' acceso?
--   · quante regole ci sono sopra?
--   · qualcuna nomina il PIANO (come il lucchetto messo il 22 agosto
--     sulle tabelle gest_*)?
--
-- Risponde con UNA RIGA. Copiala e mandamela.
-- ============================================================

with mie as (
  select unnest(array['nol_mezzi','nol_clienti','nol_noleggi','nol_media',
                      'neg_prodotti','neg_fornitori','neg_movimenti']) as t
),
stato as (
  select
    m.t,
    coalesce(c.relrowsecurity, false)                                  as lucchetto,
    (select count(*) from pg_policies p
       where p.schemaname = 'public' and p.tablename = m.t)            as regole,
    (select count(*) from pg_policies p
       where p.schemaname = 'public' and p.tablename = m.t
         and coalesce(p.qual,'') || coalesce(p.with_check,'') ilike '%piano%') as regole_piano,
    (c.oid is null)                                                    as manca
  from mie m
  left join pg_class c
         on c.relname = m.t
        and c.relnamespace = 'public'::regnamespace
)
select
  count(*) filter (where manca)                              as tabelle_che_non_esistono,
  count(*) filter (where not manca and not lucchetto)        as senza_lucchetto,
  count(*) filter (where not manca and lucchetto and regole = 0) as lucchetto_ma_zero_regole,
  count(*) filter (where not manca and regole_piano > 0)     as regole_che_nominano_il_piano,
  string_agg(
    t || ': ' ||
    case when manca then 'NON ESISTE'
         when not lucchetto then '⛔ APERTA A TUTTI'
         when regole = 0 then '⛔ chiusa ma senza regole'
         else regole || ' regole' || case when regole_piano > 0 then ' (con il piano)' else '' end
    end, '   ·   ' order by t)                               as dettaglio
from stato;
