-- ============================================================
-- leggi-visite.sql — 21 agosto 2026
-- Quanta gente arriva DAVVERO dalla pubblicita'.
--
-- PERCHE' ESISTE: il pixel di Meta sta dentro cookie-banner.js e parte
-- SOLO dopo il clic su «Accetta tutti». Chi sceglie «Solo tecnici», o non
-- tocca il banner, per Meta non e' mai arrivato. Questo contatore invece
-- conta tutti: niente cookie, niente IP.
--
-- ⛔ UNA QUERY SOLA, UNA RIGA DI RISULTATO. Da incollare nell'SQL Editor
--    di Supabase (dove sei collegato come postgres).
--
-- COME SI LEGGONO LE COLONNE
--   da_quando           il giorno della prima visita registrata
--   giorni              quanti giorni di dati ci sono
--   pubbl_persone       persone arrivate dalla pubblicita' (fbclid), in tutto
--   pubbl_al_giorno     le stesse, divise per i giorni
--   pubbl_visto_su_100  di quelle, quante sono rimaste a vedere la pagina
--   sito_al_giorno      persone al giorno su TUTTO il sito
--   pagina_pronta_ms    quanto ci mette la pagina a disegnarsi
--
-- ⚠️ Si contano le PERSONE (la sessione), non le pagine aperte: chi apre
--    tre pagine conta una volta sola. Chi arriva senza sessione scritta
--    conta come una persona a se'.
-- ⚠️ ms_attesa comprende i 2 secondi di attesa: qui sono gia' tolti.
--
-- IL CONFRONTO DA FARE: «pubbl_al_giorno» contro i clic al giorno che dice
-- Meta. La campagna ha pagato 854 clic in 30 giorni, cioe' ~28 al giorno, e
-- Meta ne ha visti «arrivare» 326, cioe' ~11 al giorno. Se questo contatore
-- ne vede molti piu' di 11, quel 62% non era gente persa: era gente che non
-- accetta i cookie.
-- ============================================================

with v as (
  select coalesce(sessione, 'x' || id) as chi, fase, da_meta, ms_attesa, creato_il
  from public.visite_sito
)
select
  min(creato_il)::date                                              as da_quando,
  (max(creato_il)::date - min(creato_il)::date + 1)                 as giorni,

  count(distinct chi) filter (where da_meta and fase = 'arrivo')    as pubbl_persone,
  round(count(distinct chi) filter (where da_meta and fase = 'arrivo')
        / greatest(max(creato_il)::date - min(creato_il)::date + 1, 1)::numeric, 1)
                                                                    as pubbl_al_giorno,
  round(100.0 * count(distinct chi) filter (where da_meta and fase = 'visto')
        / nullif(count(distinct chi) filter (where da_meta and fase = 'arrivo'), 0))
                                                                    as pubbl_visto_su_100,

  round(count(distinct chi) filter (where fase = 'arrivo')
        / greatest(max(creato_il)::date - min(creato_il)::date + 1, 1)::numeric, 1)
                                                                    as sito_al_giorno,

  round(percentile_cont(0.5) within group (order by ms_attesa)
        filter (where fase = 'visto')) - 2000                       as pagina_pronta_ms
from v;
