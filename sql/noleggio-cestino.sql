-- ============================================================
-- IL CESTINO ANCHE SUL NOLEGGIO E SUL MAGAZZINO
-- TrovaImpresa — preparato il 22 agosto 2026, notte
--
-- ⛔ NON ESEGUITO. Va lanciato da te nell'SQL Editor di Supabase,
--    UNA VOLTA SOLA. Prima di lanciarlo leggi la nota in fondo.
--
-- A cosa serve: oggi quello che si cancella nel noleggio sparisce e
-- basta. `js/cestino.js` e' gia' caricato nella pagina e sa gia' fare
-- il lavoro, ma guarda solo le tabelle `gest_*`: gli manca la colonna
-- `eliminato_il` sulle tre del noleggio e sulle tre del magazzino.
-- Con questa query la colonna c'e', e da quel momento si puo'
-- accendere il cestino anche qui.
-- ============================================================

alter table public.nol_mezzi      add column if not exists eliminato_il timestamptz;
alter table public.nol_clienti    add column if not exists eliminato_il timestamptz;
alter table public.nol_noleggi    add column if not exists eliminato_il timestamptz;
alter table public.neg_prodotti   add column if not exists eliminato_il timestamptz;
alter table public.neg_fornitori  add column if not exists eliminato_il timestamptz;
alter table public.neg_movimenti  add column if not exists eliminato_il timestamptz;

-- una riga sola di risultato: deve dire 6
select count(*) as colonne_aggiunte
from information_schema.columns
where table_schema = 'public'
  and column_name  = 'eliminato_il'
  and table_name in ('nol_mezzi','nol_clienti','nol_noleggi',
                     'neg_prodotti','neg_fornitori','neg_movimenti');

-- ============================================================
-- ⚠️ NOTA IMPORTANTE — l'ordine conta
--
-- `js/cestino.js` e' lo STESSO file del gestionale imprese e del
-- gestionale negozio. Dentro c'e' l'elenco `TABELLE`: se ci aggiungo
-- le sei tabelle qui sopra PRIMA che tu abbia lanciato questa query,
-- il cestino si accorge che la colonna manca solo su alcune e
-- BLOCCA la cancellazione su quelle — cioe' su Mezzi, Clienti,
-- Noleggi, Prodotti, Fornitori e Movimenti non si cancella piu'
-- niente finche' la query non e' passata.
--
-- Percio' l'ordine e':
--   1. tu lanci questa query e mi dici il numero che esce (deve essere 6)
--   2. io aggiungo le sei tabelle a `TABELLE` in js/cestino.js
--   3. io aggiungo la sezione «Cestino» al noleggio, per rivedere e
--      rimettere a posto quello che e' stato buttato
--
-- Se invece preferisci lasciare stare, non lanciarla: il gestionale
-- continua a funzionare esattamente come adesso.
-- ============================================================
