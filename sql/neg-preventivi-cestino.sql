-- ============================================================
-- IL CESTINO ANCHE SUI PREVENTIVI DEL NEGOZIO
-- TrovaImpresa — 26 agosto 2026
--
-- ⛔ NON ESEGUITO. Va lanciato da te nell'SQL Editor di Supabase,
--    UNA VOLTA SOLA. Prima di lanciarlo leggi la nota in fondo.
--
-- A cosa serve. Il 23 agosto (sql/noleggio-cestino.sql) il cestino e'
-- arrivato su neg_prodotti, neg_fornitori e neg_movimenti. I preventivi
-- del negozio erano rimasti fuori: «Elimina» su un preventivo lo
-- cancella DAVVERO e non si recupera.
--
-- E un preventivo ha un NUMERO. Un numero saltato in mezzo alla
-- numerazione e' una domanda del commercialista — e' lo stesso motivo
-- per cui il 23 agosto era stata aggiunta nol_fatture.
--
-- ⚠️ Trovato dal banco: prove-claude/banco-negozio-funziona-26ago.zip,
--    prova «e finisce nel cestino come tutto il resto del gestionale».
-- ============================================================

alter table public.neg_preventivi add column if not exists eliminato_il timestamptz;

-- una riga sola di risultato: deve dire 1
select count(*) as colonne_aggiunte
from information_schema.columns
where table_schema = 'public'
  and column_name  = 'eliminato_il'
  and table_name   = 'neg_preventivi';

-- ============================================================
-- ⚠️ PERCHE' NON C'E' neg_preventivo_righe
--
-- Le righe non vanno nel cestino, ed e' la stessa regola gia' scritta
-- in js/cestino.js per i SAL: «le loro RIGHE non ci vanno: sono pezzi
-- del SAL e se ne vanno con lui, come le righe di una fattura».
--
-- Le righe di un preventivo sono pezzi del preventivo. Quando la
-- testata finisce nel cestino, le sue righe non si vedono piu' da
-- nessuna parte (si leggono sempre per preventivo_id) e restano intatte
-- nel database: se un giorno il preventivo si ripesca, le ritrova.
--
-- ⛔ E ce n'e' una seconda, piu' pratica: quando si RISALVA un
-- preventivo modificato, il gestionale cancella le vecchie righe e
-- rimette le nuove. Se le righe fossero nel cestino, ogni modifica
-- lascerebbe dietro una copia di tutte le righe vecchie, per sempre.
-- ============================================================

-- ============================================================
-- ⚠️ NOTA IMPORTANTE — l'ordine conta
--
-- js/cestino.js e' lo STESSO file del gestionale imprese, del noleggio
-- e del negozio. Dentro c'e' l'elenco TABELLE: se ci si aggiunge
-- neg_preventivi PRIMA che questa query sia passata, il cestino si
-- accorge che la colonna manca solo su quella e BLOCCA la
-- cancellazione — cioe' i preventivi del negozio non si eliminano piu'
-- finche' la query non e' stata lanciata.
--
-- Percio' l'ordine e':
--   1. tu lanci questa query e mi dici il numero che esce (deve essere 1)
--   2. io aggiungo neg_preventivi a TABELLE in js/cestino.js
--   3. il banco rifa il giro e quella prova diventa verde
-- ============================================================
