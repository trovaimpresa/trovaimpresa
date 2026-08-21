-- ============================================================
-- leggi-costo-orario.sql — 21 agosto 2026
-- Il costo ORARIO della manodopera, preso dal prezzario vero.
--
-- PERCHE': su Google, cinque ricerche diverse chiedono la tariffa ORARIA
-- del muratore («costo orario muratore», «quanto costa un muratore
-- all'ora», «costo muratore ora»…): 91 impressioni in due mesi, ZERO clic,
-- posizione 12-29. La pagina del sito parla solo del costo AL GIORNO.
-- Prima di scrivere una cifra, la si prende dal prezzario della Regione
-- Lazio 2023 che è già dentro il gestionale — non si inventa.
--
-- ⛔ UNA QUERY SOLA. Da incollare nell'SQL Editor di Supabase.
-- ⛔ SOLO LETTURA: non modifica niente.
--
-- ⚠️ Se il filtro sulle parole («operaio», «muratore», «manodopera») non
--    pesca niente, la query NON torna vuota: mostra tutte le voci a ORA
--    che ci sono, così si capisce come sono scritte e si aggiusta il tiro.
--    Una query che risponde «niente» non dice se non c'è il dato o se ho
--    sbagliato a cercarlo.
-- ============================================================

with orarie as (
  select codice, descrizione, unita, prezzo_unitario, fonte
  from public.gest_prezzi_propri
  where eliminato_il is null
    and lower(btrim(coalesce(unita,''))) in ('ora','ore','h','h.','ora/uomo')
),
manodopera as (
  select * from orarie
  where descrizione ilike '%operai%'
     or descrizione ilike '%muratore%'
     or descrizione ilike '%manodoper%'
     or descrizione ilike '%capo squadra%'
)
select
  codice,
  left(descrizione, 60)         as descrizione,
  unita,
  round(prezzo_unitario, 2)     as euro_all_ora,
  coalesce(fonte, '—')          as da_dove
from (
  select * from manodopera
  union all
  select * from orarie where not exists (select 1 from manodopera)
) x
order by prezzo_unitario desc
limit 15;
