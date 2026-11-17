-- ============================================================
-- 17 novembre 2026 — GLI ACCONTI GIA' RICEVUTI ANCHE NEL DATABASE
--
-- Dal 13 nov un acconto su una fattura si segna con una «Ricevuta di
-- pagamento» legata alla fattura (gest_ricevute_pagamento.fattura_id).
-- Il gestionale (sezione Fatture, Riepilogo) dal 17 nov toglie quegli
-- acconti dal «da incassare». Ma la Chat con AI e l'email del mattino
-- leggono la vista gest_fatture_totali, che contava la fattura intera.
--
-- Qui:
--  1) la vista prende DUE colonne in piu', in fondo:
--       gia_ricevuto = le ricevute legate alla fattura (mai piu' del suo netto)
--       resto        = quanto manca ancora (col segno, come «totale»)
--     ⛔ «totale» NON cambia: e' quanto vale la fattura. Chi lo leggeva
--        continua a leggere lo stesso numero.
--  2) chat_soldi() dice anche «gia_ricevuto» e «resta_da_incassare»
--     nelle fatture da incassare.
--
-- Additivo: si puo' rilanciare. Provato il 17 nov: 10 fatture nel
-- database, totali identici a prima, nessuna ricevuta legata.
-- ============================================================

create or replace view public.gest_fatture_totali
with (security_invoker = true) as
 SELECT f.id AS fattura_id,
    f.user_id,
    f.mestiere_id,
    c.imponibile * c.segno::numeric AS imponibile,
    c.iva * c.segno::numeric AS iva,
    c.totale * c.segno::numeric AS totale,
    c.n_righe,
    c.totale_documento * c.segno::numeric AS totale_documento,
    c.compenso * c.segno::numeric AS compenso,
    c.cassa * c.segno::numeric AS cassa,
    c.spese * c.segno::numeric AS spese,
    c.spese_iva * c.segno::numeric AS spese_iva,
    c.sconto * c.segno::numeric AS sconto,
    c.ritenuta * c.segno::numeric AS ritenuta,
    c.segno,
    (case when c.segno > 0 then least(coalesce(r.tot, 0), greatest(c.totale, 0)) else 0 end)::numeric AS gia_ricevuto,
    ((c.totale - (case when c.segno > 0 then least(coalesce(r.tot, 0), greatest(c.totale, 0)) else 0 end)) * c.segno::numeric)::numeric AS resto
   FROM public.gest_fatture f
     CROSS JOIN LATERAL public.gest_fattura_conti(f.id) c(compenso, cassa, spese, spese_iva, sconto, imponibile, iva, ritenuta, totale_documento, totale, n_righe, segno)
     LEFT JOIN LATERAL (
        select sum(rp.importo) as tot
          from public.gest_ricevute_pagamento rp
         where rp.fattura_id = f.id and rp.eliminato_il is null
     ) r on true
  WHERE f.eliminato_il IS NULL;

-- chat_soldi: si aggiungono due voci dentro «fatture_da_incassare».
-- Non si riscrive la funzione a mano (e' lunga, e una copia si scolla):
-- si prende quella che c'e' e si aggiungono le due righe. Se il punto
-- non si trova, si ferma con un errore invece di lasciarla a meta'.
do $$
declare d text;
begin
  select pg_get_functiondef('public.chat_soldi(uuid)'::regprocedure) into d;
  if position('resta_da_incassare' in d) = 0 then
    d := regexp_replace(d,
      $r$('totale',\s+round\(coalesce\(sum\(t\.totale\),0\)::numeric, 2\))(\)\s+from public\.gest_fatture f\s+join public\.gest_fatture_totali t on t\.fattura_id = f\.id\s+where f\.user_id = v_chi and f\.mestiere_id = p_mestiere\s+and f\.eliminato_il is null\s+and coalesce\(f\.stato,''\) <> 'bozza')$r$,
      E'\\1,\n        ''gia_ricevuto'', round(coalesce(sum(t.gia_ricevuto),0)::numeric, 2),\n        ''resta_da_incassare'', round(coalesce(sum(t.resto),0)::numeric, 2)\\2');
    if position('resta_da_incassare' in d) = 0 then
      raise exception 'chat_soldi: non trovo il punto delle fatture da incassare, non cambio niente';
    end if;
    execute d;
  end if;
end $$;
