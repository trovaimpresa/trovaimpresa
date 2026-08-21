-- =====================================================================
-- L'ANALISI DEI PREZZI — CHE TORNI CON LA CALCOLATRICE (22 agosto 2026)
-- =====================================================================
-- Trovato guardando il PRIMO foglio vero stampato da Alessio, facendo la
-- somma a mano:
--
--     Costi diretti                 EUR 25,79
--     Spese generali     15,00 %    EUR  3,87
--     Utile              10,00 %    EUR  2,97
--                                   ---------
--     sommati a mano                EUR 32,63
--     ma nel riquadro c'era scritto EUR 32,62
--
-- Un centesimo. Su un documento di gara e' un centesimo di troppo: chi lo
-- legge somma le tre righe e non gli torna il totale, e un documento che
-- non dimostra il proprio totale si contesta.
--
-- E non era il solo: anche i totali dei tre gruppi (Materiali 8,93 +
-- Manodopera 14,63 + Noli 2,24 = 25,80) non facevano i costi diretti
-- (25,79), sempre per lo stesso motivo.
--
-- ---------------------------------------------------------------------
-- PERCHE' SUCCEDEVA
-- ---------------------------------------------------------------------
-- Il conto girava a QUATTRO decimali e si chiudeva a due solo alla fine:
--   1,05 x 8,50  = 8,925      -> stampato 8,93
--   0,45 x 32,50 = 14,625     -> stampato 14,63
--   costi        = 25,79
--   spese        = 3,8685     -> stampato 3,87
--   utile        = 2,9659     -> stampato 2,97
--   prezzo       = 32,6244    -> stampato 32,62
-- I numeri stampati non erano quelli sommati: si sommava la versione
-- lunga e si stampava quella corta.
--
-- ---------------------------------------------------------------------
-- LA REGOLA, ED E' UNA SOLA
-- ---------------------------------------------------------------------
-- ⛔ SI SOMMA QUELLO CHE SI STAMPA. Ogni numero viene chiuso a DUE
--    decimali PRIMA di entrare nella somma dopo:
--      importo di riga = round(quantita * prezzo, 2)
--      totale gruppo   = somma degli importi di riga (gia' a 2)
--      costi diretti   = somma dei quattro gruppi
--      spese generali  = round(costi * %, 2)
--      utile           = round((costi + spese) * %, 2)
--      prezzo          = costi + spese + utile        <- nessun altro round
--    Cosi' il foglio torna riga per riga, e chiunque puo' rifare ogni
--    percentuale con la calcolatrice partendo dai numeri stampati.
--
-- E' la stessa scelta gia' fatta due volte: la quantita' chiusa a tre
-- decimali (19 agosto) e il prezzo chiuso a due (21 agosto).
--
-- ---------------------------------------------------------------------
-- ⛔ L'IMPORTO DI RIGA ADESSO LO DA' IL DATABASE, NON PIU' JAVASCRIPT
-- ---------------------------------------------------------------------
-- Fino a ieri la schermata e il PDF si calcolavano da soli
-- `quantita * prezzo` per ogni riga: due copie della stessa formula, e per
-- giunta in virgola mobile, dove 1,005 vale 1,00499999999999989 e si
-- arrotonda a 1,00 mentre il database dice 1,01. Adesso c'e' la vista
-- `gest_analisi_righe_calc`, che espone l'importo gia' chiuso a due
-- decimali: schermo e carta lo LEGGONO. Un conto in un posto solo.
--
-- ---------------------------------------------------------------------
-- ⚠️ COSA CAMBIA NEI TUOI DATI
-- ---------------------------------------------------------------------
-- I prezzi gia' costruiti con l'analisi si possono spostare di UNO o DUE
-- CENTESIMI (nell'esempio qui sopra: da 32,62 a 32,63). Le lavorazioni
-- che l'analisi non ce l'hanno non cambiano di niente.
--
-- ⚠️ «create or replace» E LE COLONNE: gest_analisi_totali tiene gli
-- stessi nomi, lo stesso ordine e gli stessi tipi di prima, se no
-- gest_computo_voci_calc (e le tre viste attaccate a lei) verrebbero
-- buttate giu'.
--
-- Nessun dato viene toccato. Si puo' eseguire piu' volte.
-- PREREQUISITO: sql/gest-analisi-prezzi.sql gia' eseguito.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. LA RETE: non si parte se manca il pezzo di prima
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.tables
     where table_schema='public' and table_name='gest_analisi_righe') then
    raise exception 'Prima esegui sql/gest-analisi-prezzi.sql: senza la tabella delle righe qui non c''e'' niente da arrotondare.';
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 1. LE RIGHE, COL LORO IMPORTO GIA' CHIUSO A DUE DECIMALI
-- ---------------------------------------------------------------------
-- ⛔ La colonna nuova va IN FONDO, come sempre.
-- Le scritture (aggiungi, correggi, elimina) restano sulla TABELLA: qui
-- si legge soltanto.

create or replace view public.gest_analisi_righe_calc
with (security_invoker = true)
as
select
  r.id,
  r.user_id,
  r.voce_id,
  r.ordine,
  r.tipo,
  r.descrizione,
  r.unita,
  r.quantita,
  r.prezzo_unitario,
  r.note,
  r.created_at,
  -- ⬇ NUOVA, in fondo: l'importo della riga, quello che si stampa
  round(r.quantita * r.prezzo_unitario, 2)::numeric(16,2) as importo
from public.gest_analisi_righe r;

grant select on public.gest_analisi_righe_calc to authenticated;


-- ---------------------------------------------------------------------
-- 2. IL CONTO — si somma quello che si stampa
-- ---------------------------------------------------------------------
create or replace view public.gest_analisi_totali
with (security_invoker = true)
as
with somme as (
  -- ⛔ round PRIMA della somma: e' il punto di tutto questo file
  select r.voce_id,
         count(*)                                                                            as righe,
         coalesce(sum(round(r.quantita*r.prezzo_unitario,2)) filter (where r.tipo='materiale'), 0)  as materiali,
         coalesce(sum(round(r.quantita*r.prezzo_unitario,2)) filter (where r.tipo='manodopera'), 0) as manodopera,
         coalesce(sum(round(r.quantita*r.prezzo_unitario,2)) filter (where r.tipo='nolo'), 0)       as noli,
         coalesce(sum(round(r.quantita*r.prezzo_unitario,2)) filter (where r.tipo='altro'), 0)      as altro
    from public.gest_analisi_righe r
   group by r.voce_id
),
base as (
  select v.id as voce_id, v.user_id, s.righe,
         s.materiali, s.manodopera, s.noli, s.altro,
         -- somma di quattro numeri gia' a due decimali: resta a due
         (s.materiali + s.manodopera + s.noli + s.altro) as costi,
         coalesce(v.an_spese_perc, 15) as sp,
         coalesce(v.an_utile_perc, 10) as up
    from public.gest_computo_voci v
    join somme s on s.voce_id = v.id
),
con_spese as (
  select b.*, round(b.costi * b.sp / 100, 2) as spese from base b
),
con_utile as (
  -- ⚠️ l'utile e' il 10% di (costi + spese generali), non dei soli costi:
  -- su una gara pubblica e' la differenza fra un documento accettato e uno
  -- contestato. Chiuso a due decimali come tutto il resto.
  select c.*, round((c.costi + c.spese) * c.up / 100, 2) as utile from con_spese c
)
select
  voce_id,
  user_id,
  righe,
  materiali::numeric(16,4)  as materiali,
  manodopera::numeric(16,4) as manodopera,
  noli::numeric(16,4)       as noli,
  altro::numeric(16,4)      as altro,
  costi::numeric(16,4)      as costi,
  sp::numeric(6,3)          as spese_perc,
  up::numeric(6,3)          as utile_perc,
  spese::numeric(16,4)      as spese,
  utile::numeric(16,4)      as utile,
  -- ⛔ NESSUN round qui: sono tre numeri gia' a due decimali. Se ce ne
  --    fosse uno, vorrebbe dire che i conti di sopra non tornano.
  (costi + spese + utile)::numeric(14,4) as prezzo
from con_utile;

grant select on public.gest_analisi_totali to authenticated;


-- ---------------------------------------------------------------------
-- UNA RIGA DI RISULTATO che dice com'e' andata
-- ---------------------------------------------------------------------
-- Verde solo se la vista nuova c'e' E se, su TUTTE le analisi che hai,
-- costi + spese + utile fa esattamente il prezzo, al centesimo.
select case
  when not exists (select 1 from information_schema.tables
                    where table_schema='public' and table_name='gest_analisi_righe_calc')
    then 'NON FATTO — la vista delle righe non c''e''.'
  when exists (select 1 from public.gest_analisi_totali
                where costi + spese + utile <> prezzo)
    then 'NON FATTO — c''e'' ancora un''analisi in cui i conti non tornano.'
  -- ⚠️ 22 agosto 2026 — IL SINGOLARE. La prima versione rispondeva
  --    «1 analisi controllate», e Alessio se l'e' visto arrivare in faccia
  --    dopo che avevo passato la mattina a sistemare «le 1 righe rimaste
  --    uguali». Vale anche per una riga di esito che si legge una volta sola.
  else 'FATTO — adesso il foglio torna con la calcolatrice: '
       || case when (select count(*) from public.gest_analisi_totali) = 1
               then '1 analisi controllata, quadrata al centesimo.'
               else (select count(*) from public.gest_analisi_totali)::text
                    || ' analisi controllate, tutte quadrate al centesimo.'
          end
end as esito;
