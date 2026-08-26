-- ============================================================
-- I LISTINI DEL NEGOZIO: prezzo banco e prezzo impresa
-- TrovaImpresa — 26 agosto 2026
--
-- ⛔ NON ESEGUITO. Va lanciato da te nell'SQL Editor di Supabase,
--    UNA VOLTA SOLA. Sicuro da rilanciare.
--
-- A cosa serve. Un ferramenta ha due prezzi per lo stesso prodotto: il
-- prezzo del banco (il privato che entra) e il prezzo dell'impresa (chi
-- compra tutte le settimane). Oggi il gestionale ne conosce uno solo.
-- Su 25 gestionali letti, 12 scrivono di avere i listini: e' la cosa che
-- un ferramenta guarda per prima.
--
-- Le quattro colonne, e a cosa servono:
--
--  1. neg_prodotti.prezzo_impresa
--     Il secondo prezzo. Se resta vuoto, per quel prodotto si usa il
--     prezzo del banco anche alle imprese: niente e' obbligatorio.
--
--  2. gest_clienti.listino          ('banco' | 'impresa')
--     Il listino di partenza del cliente. Lo segna il NEGOZIANTE quando
--     registra il cliente: «a Rossi Costruzioni faccio prezzi impresa».
--
--  3. gest_clienti.sconto_perc
--     Lo sconto fisso di quel cliente, che finisce da solo nello sconto
--     sul totale del preventivo.
--
--  4. neg_preventivi.listino        ('banco' | 'impresa')
--     Con quale listino e' stato scritto QUEL preventivo. Serve perche'
--     l'interruttore nel preventivo puo' cambiare la scelta al volo, e
--     riaprendolo domani i prezzi devono restare quelli.
--
-- ⚠️ gest_clienti e' la STESSA tabella del gestionale imprese e del
--    noleggio. Le due colonne nuove le legge e le scrive solo il
--    negozio: per gli altri e' come se non ci fossero.
-- ============================================================

alter table public.neg_prodotti   add column if not exists prezzo_impresa numeric(12,2);
alter table public.gest_clienti   add column if not exists listino        text default 'banco';
alter table public.gest_clienti   add column if not exists sconto_perc    numeric(5,2) default 0;
alter table public.neg_preventivi add column if not exists listino        text default 'banco';

comment on column public.neg_prodotti.prezzo_impresa is
  'Prezzo riservato alle imprese. Vuoto = si usa prezzo (il prezzo del banco).';
comment on column public.gest_clienti.listino is
  'Listino di partenza del cliente nel gestionale negozio: banco | impresa.';
comment on column public.gest_clienti.sconto_perc is
  'Sconto fisso del cliente, in percentuale. Finisce nello sconto sul totale del preventivo.';
comment on column public.neg_preventivi.listino is
  'Con quale listino e stato scritto questo preventivo: banco | impresa.';

-- una riga sola di risultato: deve dire 4
select count(*) as colonne_pronte
from information_schema.columns
where table_schema = 'public'
  and (   (table_name = 'neg_prodotti'   and column_name = 'prezzo_impresa')
       or (table_name = 'gest_clienti'   and column_name in ('listino','sconto_perc'))
       or (table_name = 'neg_preventivi' and column_name = 'listino'));

-- ============================================================
-- ⚠️ SI PUO' LANCIARE ANCHE PRIMA che il codice nuovo sia online: le
-- colonne in piu' non danno fastidio a nessuno. E il codice nuovo, se
-- per qualsiasi motivo le colonne non ci fossero, salva lo stesso il
-- prodotto senza il secondo prezzo e te lo dice — stessa rete gia' usata
-- per unita, prezzo_acquisto e iva_perc (sql/neg-prodotti-campi.sql).
-- ============================================================
