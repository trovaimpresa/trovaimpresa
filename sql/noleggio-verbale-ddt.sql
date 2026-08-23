-- ============================================================
-- TrovaImpresa — IL VERBALE DI CONSEGNA E RIENTRO, E IL DDT
-- 23 agosto 2026
--
-- PERCHE'
-- 1) IL VERBALE. Assodimi lo dice chiaro: alla consegna e al rientro si
--    compila la STESSA lista di controllo, si allegano le foto e si firma
--    in contraddittorio. E' la carta che fa vincere le discussioni sui
--    danni «eccedenti la normale usura». Le foto ci sono gia' (23 agosto):
--    manca la lista, e manca la firma.
-- 2) IL DDT. Ogni uscita e ogni rientro vogliono un documento di
--    trasporto con scritto che i beni viaggiano «a titolo di noleggio»:
--    serve a non far scattare la presunzione di cessione (art. 53 DPR
--    633/72). E in regalo, DDT + verbali sono la «idonea documentazione»
--    che permette la fattura differita riepilogativa entro il 15 del mese
--    dopo: una fattura sola al mese per cliente invece di una per uscita.
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE. Solo colonne nuove, tutte con un
--    valore di partenza. Si puo' rilanciare quante volte si vuole.
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

alter table public.nol_noleggi
  -- dove va a lavorare il mezzo: sul contratto ci vuole, e finora mancava
  add column if not exists luogo               text,

  -- la lista di controllo, la STESSA nei due momenti. Una lista di righe:
  -- [{"voce":"Carrozzeria","stato":"ok","nota":""}, ...]
  -- stato: 'ok' · 'usura' (normale) · 'danno'
  add column if not exists check_uscita        jsonb not null default '[]'::jsonb,
  add column if not exists check_rientro       jsonb not null default '[]'::jsonb,

  -- quando il verbale e' stato chiuso e firmato
  add column if not exists verbale_uscita_il   timestamptz,
  add column if not exists verbale_rientro_il  timestamptz,
  -- chi ha firmato per il cliente (nome scritto sul verbale)
  add column if not exists firma_uscita        text,
  add column if not exists firma_rientro       text,

  -- il documento di trasporto, uno all'andata e uno al ritorno
  add column if not exists ddt_uscita_num      text,
  add column if not exists ddt_uscita_data     date,
  add column if not exists ddt_rientro_num     text,
  add column if not exists ddt_rientro_data    date;

-- il contatore dei DDT, accanto a quello delle fatture che c'e' gia'
alter table public.gest_azienda
  add column if not exists num_ddt integer not null default 1;


-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA: devono uscire tutti 1
-- ------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='check_uscita')                       as lista_controllo,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='ddt_uscita_num')                     as ddt,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='luogo')                              as luogo,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='gest_azienda'
      and column_name='num_ddt')                            as contatore_ddt;
