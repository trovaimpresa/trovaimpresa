-- ============================================================
-- TrovaImpresa — LA FIRMA COL DITO
-- 23 agosto 2026
--
-- PERCHE'
-- Sul verbale di consegna e su quello di riconsegna oggi c'e' scritto un
-- NOME. Un nome scritto non e' una firma: chi contesta i danni dice «io
-- non ho firmato niente», e ha ragione.
--
-- ⛔ Il verbale vale perche' e' fatto IN CONTRADDITTORIO e sottoscritto
--    dalle due parti. Senza la sottoscrizione resta un foglio che ti sei
--    scritto da solo.
--
-- COSA AGGIUNGE
-- Quattro caselle dove finisce il DISEGNO della firma (un'immagine PNG
-- scritta come testo, sui 10 KB l'una) e due date:
--   firma_uscita_img    la firma del cliente alla consegna
--   firma_rientro_img   la firma del cliente al rientro
--   firma_contr_img     la firma del cliente sul contratto
--   firma_contr2_img    ⛔ la SECONDA firma, quella delle clausole
--                          vessatorie (artt. 1341-1342 c.c.): senza,
--                          le clausole 6 e 8 non sono opponibili
--   firma_contr_nome    chi ha firmato il contratto
--   firma_contr_il      quando
--
-- ⚠️ PERCHE' NEL DATABASE E NON NEL DEPOSITO DEI FILE. Una firma pesa
--    quanto un decimo di una fotografia, e deve stare attaccata alla riga
--    del noleggio: se sta in un file a parte, il giorno che quel file si
--    perde il verbale resta senza firma e non se ne accorge nessuno.
--
-- ⚠️ LE DATE DEI VERBALI CI SONO GIA' (verbale_uscita_il e
--    verbale_rientro_il, da sql/noleggio-verbale-ddt.sql): qui non si
--    rifanno.
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE. Solo colonne nuove, tutte vuote.
--    Si puo' rilanciare quante volte si vuole.
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

alter table public.nol_noleggi
  add column if not exists firma_uscita_img  text,
  add column if not exists firma_rientro_img text,
  add column if not exists firma_contr_img   text,
  add column if not exists firma_contr2_img  text,
  add column if not exists firma_contr_nome  text,
  add column if not exists firma_contr_il    timestamptz;


-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA: devono uscire tutti 1
-- ------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='firma_uscita_img')   as consegna,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='firma_rientro_img')  as rientro,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='firma_contr_img')    as contratto,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='firma_contr2_img')   as clausole_vessatorie;
