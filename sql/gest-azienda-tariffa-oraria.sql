-- ============================================================
-- LA TARIFFA ORARIA — 22 agosto 2026
-- ============================================================
-- A cosa serve, in parole semplici.
--
-- Nel registro delle ore di una pratica c'e' scritto quanto ci hai messo:
-- giorno per giorno, chi, quante ore. Da oggi quelle ore si portano dentro
-- una parcella con un pulsante, e diventano righe pronte.
--
-- Perche' diventino righe COL PREZZO serve un numero che il gestionale non
-- ha mai avuto: quanto chiedi tu al cliente per un'ora.
--
-- ⛔ ATTENZIONE, non e' il costo orario del collaboratore.
--    `gest_operatori.costo_orario` e' quanto ti COSTA lui: serve al Report
--    per dirti se un lavoro ci ha guadagnato. Questo invece e' quanto CHIEDI
--    tu. Sono due numeri diversi, e confonderli vuol dire fatturare al
--    cliente il proprio costo.
--
-- ⚠️ Il gestionale funziona anche PRIMA di lanciarla: se la colonna non c'e',
--    la casella «Quanto chiedi all'ora» non compare e le righe delle ore
--    arrivano col prezzo VUOTO, da riempire a mano. Nessuna schermata bianca.
--
-- Si puo' rilanciare quante volte si vuole: non cancella e non sovrascrive
-- niente (`if not exists`).
--
-- COME SI ESEGUE
--   Supabase -> SQL Editor -> incolla tutto -> Run.
--   Alla fine risponde con UNA RIGA che dice com'e' andata.
-- ============================================================

alter table public.gest_azienda
  add column if not exists tariffa_oraria numeric(10,2);

comment on column public.gest_azienda.tariffa_oraria is
  'Quanto lo studio/l''impresa CHIEDE al cliente per un''ora. Non e'' il costo del collaboratore (gest_operatori.costo_orario).';

-- ------------------------------------------------------------
-- La riga di risultato: si legge a colpo d'occhio.
-- ------------------------------------------------------------
select
  case
    when exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name   = 'gest_azienda'
        and column_name  = 'tariffa_oraria'
    )
    then 'FATTO — la casella «Quanto chiedi all''ora» adesso c''e'' nei Dati azienda'
    else 'NON FATTO — la colonna tariffa_oraria non risulta: riprova o chiedi'
  end                                                    as esito,
  (select count(*) from public.gest_azienda)             as aziende_registrate,
  (select count(*) from public.gest_azienda
     where tariffa_oraria is not null)                   as gia_con_la_tariffa;
