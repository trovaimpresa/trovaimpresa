-- ============================================================
-- I CAPITOLI DENTRO IL PREVENTIVO — 19 agosto 2026
-- ============================================================
-- Un computo si legge per capitoli: «1 Demolizioni», «2 Opere murarie»,
-- e dentro ognuno le sue lavorazioni. Il preventivo che ne nasceva era
-- un elenco piatto: gli 87 righi di un computo vero arrivavano al
-- cliente tutti attaccati, senza un titolo che dicesse dove finisce una
-- parte e dove comincia l'altra.
--
-- Questa colonna serve a distinguere una RIGA DI CAPITOLO (un titolo)
-- da una riga di lavorazione (una cosa che si paga).
--
-- REGOLA CHE NON SI TOCCA: una riga con sezione = true ha SEMPRE
-- qta 0 e prezzo 0. In sette punti del gestionale il totale si fa con
-- (+qta||1)*(+prezzo||0): con qta 0 e prezzo 0 quel conto fa zero, e
-- anche il punto che non sa niente dei capitoli non sbaglia un
-- centesimo. Se una riga di capitolo nascesse con un prezzo dentro,
-- quel prezzo finirebbe nel totale che firma il cliente.
--
-- NIENTE RLS DA RIFARE: le regole di sicurezza di gest_preventivo_righe
-- valgono sulla riga, non sulla singola colonna. Restano quelle.
--
-- Si può eseguire più volte: se la colonna c'è già, non succede niente.
-- ============================================================

alter table public.gest_preventivo_righe
  add column if not exists sezione boolean not null default false;

-- una riga di risultato che dice com'è andata
select case
  when exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'gest_preventivo_righe'
       and column_name  = 'sezione'
  )
  then 'FATTO — la colonna «sezione» c''è: i capitoli del computo arrivano nel preventivo.'
  else 'NON FATTO — la colonna «sezione» non risulta creata. Riprova o dimmelo.'
end as esito;
