-- ============================================================
-- L'UNITA' DI MISURA NELLE VOCI DEL PREVENTIVO — 13 novembre 2026
-- (lista «MANCA» del quarto giro del controllore, voce 3)
-- ============================================================
-- Una voce diceva «85,5 x 32,40» e basta: 85,5 che cosa? Questa colonna
-- tiene la parola accanto alla quantita' (m, m², m³, kg, cad, ora...).
-- E' la stessa tendina del computo.
--
-- NON entra in nessun conto: il totale della riga resta qta x prezzo.
-- Le righe di prima restano con l'unita' vuota: non cambia niente.
-- NIENTE RLS DA RIFARE: le regole valgono sulla riga, non sulla colonna.
-- Si puo' eseguire piu' volte.
-- ============================================================

alter table public.gest_preventivo_righe
  add column if not exists unita text;

select case
  when exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='gest_preventivo_righe' and column_name='unita')
  then 'OK: la colonna unita c''e'''
  else 'ERRORE: la colonna unita non c''e'''
end as esito;
