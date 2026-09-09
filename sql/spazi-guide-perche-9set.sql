-- 9 settembre 2026 — I QUATTRO POSTI CHE C'ERANO MA NON SI POTEVANO COMPRARE
-- ---------------------------------------------------------------------------
-- Nella pagina citta' c'erano 14 riquadri ma solo 10 erano in vendita: gli
-- altri 4 (accanto alle guide «quanto costa» e a «Perche' scegliere
-- TrovaImpresa») erano disegnati come semplici locandine, senza un nome.
-- Senza nome il database li rifiutava e il pagamento non partiva.
-- Questa migrazione aggiunge i loro nomi ai valori ammessi.
-- GIA' APPLICATA in produzione il 9 set 2026.

alter table annunci_pubblicitari drop constraint annunci_pubblicitari_spazio_id_check;
alter table annunci_pubblicitari add constraint annunci_pubblicitari_spazio_id_check
  check (spazio_id = any (array[
    'hero-sx','hero-dx',
    'imprese-sx','imprese-dx',
    'pannello-sx','pannello-dx',
    'piano-sx','piano-dx',
    'inserzioni-sx','inserzioni-dx',
    'guide-sx','guide-dx',
    'perche-sx','perche-dx',
    'subappalto-sx-1','subappalto-sx-2','subappalto-dx-1','subappalto-dx-2',
    'profilo-sx-1','profilo-sx-2','profilo-dx-1','profilo-dx-2'
  ]));
