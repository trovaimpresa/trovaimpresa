-- 19 novembre 2026 — LA SCADENZA DELLA CARTA AZIENDALE (si' di Alex, foto prima)
-- Sulla carta c'e' scritto mese e anno (es. 03/27): si salva l'ULTIMO giorno
-- di quel mese, perche' la carta vale fino alla fine del mese.
-- Vuota = scadenza non scritta (le carte vecchie restano cosi').
-- La leggono: la sezione Carte, lo Scadenzario (sola lettura) e l'email del
-- mattino (tappe 30, 7, 1 giorni come i mezzi).
-- Solo aggiunta: non tocca nessuna riga che c'e' gia'.

alter table public.gest_carte add column if not exists scadenza date;
