-- ============================================================
-- leggi-iscrizioni.sql — 21 agosto 2026
-- Quante imprese si iscrivono DAVVERO, contate nel database.
--
-- PERCHE' ESISTE: il numero che Meta scrive nel pannello e' sotto-contato,
-- perche' il pixel parte solo dopo il clic su «Accetta tutti». Il database
-- invece le ha tutte, una per una.
-- Il 21 agosto abbiamo misurato: su 50 clic pagati in tre giorni, il sito
-- ha visto arrivare 50 persone, e Meta ne dichiarava «arrivate» 12.
--
-- ⛔ UNA QUERY SOLA, UNA RIGA DI RISULTATO. Da incollare nell'SQL Editor
--    di Supabase (dove sei collegato come postgres).
-- ⛔ SOLO LETTURA: non modifica niente.
--
-- COME SI LEGGONO LE COLONNE
--   oggi                 iscrizioni di oggi
--   ultimi_7_giorni      iscrizioni della settimana
--   al_giorno_7          le stesse, divise per 7  <-- IL NUMERO CHE CONTA
--   ultimi_30_giorni     iscrizioni del mese
--   al_giorno_30         le stesse, divise per 30
--   di_cui_col_profilo   quante di quelle del mese hanno il profilo impresa
--   da_sempre            tutte le iscrizioni, dall'inizio
--
-- ⚠️ Si conta `auth.users`, cioe' CHI HA CREATO L'ACCOUNT. E' il numero
--    vero: `imprese` puo' avere una riga in meno se il trigger inciampa —
--    e' successo, e ha buttato via undici giorni di iscrizioni in silenzio
--    (corretto il 19 agosto). Per questo c'e' «di_cui_col_profilo»: se e'
--    molto piu' basso di «ultimi_30_giorni», il trigger sta ricominciando
--    a perdere gente.
--
-- IL CONFRONTO DA FARE, il 26 agosto:
--   «al_giorno_7» adesso, contro «al_giorno_30». Se la settimana e' meglio
--   del mese, la campagna sta migliorando da sola e non va toccata.
--   E il conto dei soldi: 8 € al giorno / al_giorno_7 = quanto ti costa
--   un'impresa iscritta. Sotto i 25 € conviene, perche' se una su dieci
--   paga il Premium nuovo ti rende 249-348 €.
-- ============================================================

select
  count(*) filter (where u.created_at >= current_date)                                     as oggi,
  count(*) filter (where u.created_at >= now() - interval '7 days')                        as ultimi_7_giorni,
  round(count(*) filter (where u.created_at >= now() - interval '7 days') / 7.0, 1)        as al_giorno_7,
  count(*) filter (where u.created_at >= now() - interval '30 days')                       as ultimi_30_giorni,
  round(count(*) filter (where u.created_at >= now() - interval '30 days') / 30.0, 1)      as al_giorno_30,
  count(*) filter (where u.created_at >= now() - interval '30 days' and i.id is not null)  as di_cui_col_profilo,
  count(*)                                                                                 as da_sempre
from auth.users u
left join public.imprese i on i.user_id = u.id;
