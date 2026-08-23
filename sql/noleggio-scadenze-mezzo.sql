-- ============================================================
-- TrovaImpresa — LE SCADENZE DEL MEZZO
-- 23 agosto 2026
--
-- PERCHE'
-- PLE, gru, ponti sviluppabili, carrelli telescopici e ascensori da
-- cantiere vanno verificati ogni 1, 2 o 3 anni (art. 71 c.11 e allegato
-- VII del D.Lgs 81/08). La prima verifica la fa l'INAIL, le successive
-- l'ASL o un soggetto abilitato, e resta un VERBALE che deve stare
-- attaccato alla macchina.
--
-- ⛔ NOLEGGIARE UN MEZZO CON LA VERIFICA SCADUTA E' il rischio piu' grosso
--    che corre un noleggiatore, e oggi il gestionale non lo sa nemmeno.
--
-- ⚠️ LA PERIODICITA' NON SI SCRIVE NEL CODICE. Le due fonti ufficiali che
--    ho letto (BibLus e ARPA Veneto) si contraddicono su PLE e carrelli
--    telescopici, e comunque dipende da tipo, eta' e severita' d'uso.
--    Percio' e' una casella da compilare mezzo per mezzo, con un valore
--    di partenza di 12 mesi che si cambia.
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE. Solo colonne nuove con un valore di
--    partenza. Si puo' rilanciare quante volte si vuole.
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

alter table public.nol_mezzi
  -- la verifica periodica di legge
  add column if not exists verifica_ultima      date,
  -- ogni quanti mesi. 0 = questo mezzo non e' soggetto a verifica
  add column if not exists verifica_mesi        integer not null default 12,
  add column if not exists verifica_ente        text,

  -- le altre scadenze che fermano un mezzo
  add column if not exists assicurazione_scad   date,
  add column if not exists revisione_scad       date,
  add column if not exists collaudo_scad        date,

  -- il tagliando a ore: ogni quante ore, e a che ora e' stato fatto
  add column if not exists tagliando_ogni_ore   numeric not null default 0,
  add column if not exists tagliando_ultimo_ore numeric,
  add column if not exists contaore_attuale     numeric,

  -- ⛔ il mezzo fermo: non deve poter uscire finche' non torna a posto
  add column if not exists fuori_servizio       boolean not null default false,
  add column if not exists fuori_servizio_perche text,

  add column if not exists manutenzione_note    text;


-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA: devono uscire tutti 1
-- ------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_mezzi'
      and column_name='verifica_ultima')       as verifica,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_mezzi'
      and column_name='verifica_mesi')         as ogni_quanto,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_mezzi'
      and column_name='assicurazione_scad')    as assicurazione,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_mezzi'
      and column_name='fuori_servizio')        as fuori_servizio;
