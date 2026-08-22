-- =====================================================================
-- ⛔ LA GUARDIA — messa il 22 agosto 2026. NON TOGLIERLA.
-- =====================================================================
-- Questo file, piu' in basso, fa `drop view` su `gest_computo_voci_calc`
-- e la ricrea com'era il giorno in cui e' stato scritto.
--
-- Il problema e' che da allora quella vista e' CRESCIUTA:
--   · il 20 agosto le e' stata aggiunta `origine_id`, che serve alla
--     schermata «Cosa e' cambiato» del computo di variante
--     (sql/gest-variante-origine-vista.sql);
--   · il 21 agosto le e' stato aggiunto il PREZZO COSTRUITO CON L'ANALISI
--     e la colonna `prezzo_da_analisi` (sql/gest-analisi-prezzi.sql).
--
-- ⛔ Rilanciare questo file DOPO quelli riporta la vista indietro: i prezzi
-- delle lavorazioni tornano di colpo a quelli scritti a mano, e la variante
-- perde la colonna che le serve. Nessun messaggio, nessun errore: i numeri
-- cambiano e basta. E il gestionale, in quattordici punti, invita a
-- eseguire questo file.
--
-- Quindi da oggi il file si ferma da solo, PRIMA di toccare qualsiasi cosa,
-- se si accorge che la vista e' gia' quella nuova.
--
-- ⚠️ Se ti fermi qui e ti serve davvero rifare le tabelle, esegui invece,
-- in quest'ordine, i file che vengono dopo:
--     sql/gest-variante-origine-vista.sql
--     sql/gest-analisi-prezzi.sql
-- Sono loro che tengono la vista aggiornata.
-- =====================================================================
do $$
declare
  _nuove text;
begin
  select string_agg(column_name, ', ' order by column_name)
    into _nuove
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'gest_computo_voci_calc'
     and column_name in ('origine_id', 'prezzo_da_analisi');

  if _nuove is not null then
    raise exception
      'FERMO QUI, e per il tuo bene. La vista gest_computo_voci_calc e'' gia'' quella nuova (ha: %). Rilanciando questo file i prezzi costruiti con l''analisi tornerebbero a quelli scritti a mano, in silenzio, e la variante perderebbe origine_id. Se ti serve rifare le viste, esegui sql/gest-variante-origine-vista.sql e poi sql/gest-analisi-prezzi.sql.',
      _nuove;
  end if;
end $$;
-- =====================================================================

-- =====================================================================
-- TrovaImpresa — COMPUTO: la quantità stampata e la quantità contata
--                devono essere LA STESSA
-- Da salvare come  sql/gest-computo-quantita-3-decimali.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 14 agosto 2026 (sera)
--
-- ---------------------------------------------------------------------
-- IL DIFETTO, IN UNA RIGA
-- ---------------------------------------------------------------------
-- Una soglia in marmo, 0,55 × 0,815 m, a 1.850 €/m².
--
-- Sul computo consegnato si legge:
--
--     Soglia in marmo    m2    0,448    1.850,00    829,26
--
-- Chi lo riceve prende la calcolatrice, fa 0,448 × 1.850 e trova
-- **828,80**. Quarantasei centesimi di differenza su una riga sola, e non
-- c'è modo di capire da dove vengono.
--
-- Il motivo: la quantità vera è 0,44825 (cinque decimali, numeric(16,5)).
-- Il documento ne stampa tre — perché in cantiere si misura al millimetro,
-- non al centesimo di millimetro — ma l'importo veniva calcolato sui
-- cinque. Cioè il computo stampava un numero e ne usava un altro.
--
-- È esattamente la cosa che un computo metrico non può fare. Nel codice
-- del PDF c'è scritto, parola per parola: «Chi lo riceve deve poter rifare
-- il conto con la calcolatrice, se no non se lo fida.»
--
-- Riprodotto su un PostgreSQL 16 vero, con misure da cantiere:
--
--   Soglia in marmo   0,44825 -> stampa 0,448 · scritto 829,26 · a mano 828,80
--   Massetto          1,08859 -> stampa 1,089 · scritto 183,37 · a mano 183,44
--   Cordolo          21,37500 -> stampa 21,375 · scritto 2.014,59 · a mano 2.014,59
--
--   Totale del computo: 3.027,22  ·  rifatto riga per riga: 3.026,83
--
-- ---------------------------------------------------------------------
-- LA CORREZIONE
-- ---------------------------------------------------------------------
-- La quantità si arrotonda a TRE decimali, e l'importo si calcola su
-- QUELLA. È il modo in cui i computi si sono sempre fatti su carta: si
-- chiude la quantità, poi si moltiplica.
--
-- Sta qui, nella vista, e non nel gestionale, per lo stesso motivo di
-- sempre: il conto lo fa il database, in un posto solo. Se lo facesse
-- anche il gestionale sarebbero due formule per la stessa cosa, e prima o
-- poi darebbero due numeri.
--
-- Le misure NON si toccano: gest_computo_misure.quantita resta a cinque
-- decimali. È giusto che le singole misure siano precise; è la quantità
-- della lavorazione — quella che finisce sul documento — che si chiude a
-- tre.
--
-- ⚠️ COSA CAMBIA NEI COMPUTI CHE HAI GIÀ
-- I totali possono spostarsi di qualche centesimo, ed è il verso giusto:
-- da adesso il documento torna con la calcolatrice. Nessun dato viene
-- modificato — cambia solo il modo di leggerlo (sono viste, non tabelle).
--
-- ⚠️ Sistema anche un'altra cosa, di riflesso: il preventivo creato dal
-- computo porta le quantità a tre decimali. Prima computo e preventivo
-- dello stesso lavoro chiudevano su due totali diversi.
-- =====================================================================

drop view if exists public.gest_computo_totali;
drop view if exists public.gest_computo_voci_calc;

create view public.gest_computo_voci_calc
with (security_invoker = true)
as
select
  v.id, v.user_id, v.computo_id, v.capitolo_id, v.ordine,
  v.codice, v.descrizione, v.unita, v.prezzo_unitario,
  v.quantita_manuale, v.incidenza_manodopera, v.oneri_sicurezza, v.note,
  -- la quantità CHIUSA a tre decimali: è quella che si stampa ed è quella
  -- che si moltiplica. Una sola quantità, non due.
  round(
    (case when v.quantita_manuale then v.quantita
          else coalesce(m.somma, 0) end), 3
  )::numeric(16,5) as quantita,
  (round(
     (case when v.quantita_manuale then v.quantita
           else coalesce(m.somma, 0) end), 3
   ) * v.prezzo_unitario)::numeric(16,2) as importo,
  coalesce(m.righe, 0) as misure
from public.gest_computo_voci v
left join (
  select voce_id, sum(quantita) as somma, count(*) as righe
    from public.gest_computo_misure
   group by voce_id
) m on m.voce_id = v.id;

-- invariata: si appoggia alla vista qui sopra, quindi segue da sola
create view public.gest_computo_totali
with (security_invoker = true)
as
select
  c.id      as computo_id,
  c.user_id,
  count(v.id)                                             as voci,
  coalesce(sum(v.importo), 0)::numeric(16,2)              as importo,
  coalesce(sum(v.importo * coalesce(v.incidenza_manodopera,0) / 100), 0)::numeric(16,2)
                                                          as importo_manodopera,
  coalesce(sum(coalesce(v.oneri_sicurezza,0)), 0)::numeric(16,2) as oneri_sicurezza
from public.gest_computi c
left join public.gest_computo_voci_calc v on v.computo_id = c.id
where c.eliminato_il is null
group by c.id, c.user_id;

grant select on public.gest_computo_voci_calc to authenticated;
grant select on public.gest_computo_totali    to authenticated;

-- ---------------------------------------------------------------------
-- VERIFICA — la riga della soglia deve tornare con la calcolatrice
-- ---------------------------------------------------------------------
-- select descrizione, quantita, prezzo_unitario, importo,
--        round(quantita,3) * prezzo_unitario as rifatto_a_mano
--   from public.gest_computo_voci_calc;
-- «importo» e «rifatto_a_mano» devono essere uguali su OGNI riga.


-- ---------------------------------------------------------------------
-- LA RIGA DI RISULTATO — si legge a colpo d'occhio
-- ---------------------------------------------------------------------
select
  'FATTO — le viste del computo sono state ricreate da questo file' as esito,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='gest_computo_voci_calc')  as colonne_della_vista,
  '⚠️ adesso esegui sql/gest-variante-origine-vista.sql e poi sql/gest-analisi-prezzi.sql, se non l''hai gia'' fatto'
                                                                          as e_poi;
