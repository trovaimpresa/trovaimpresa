-- ============================================================
-- TrovaImpresa — IL CONTRATTO DI NOLEGGIO E I PDF ATTACCATI
-- 23 agosto 2026
--
-- DUE COSE, UNA QUERY SOLA.
--
-- 1) IL CONTRATTO E LA DICHIARAZIONE DEGLI OPERATORI
--    D.Lgs 81/2008 art. 72 comma 2: chi noleggia una macchina SENZA
--    operatore deve attestare il buono stato del mezzo al momento della
--    consegna, e deve farsi dare — e CONSERVARE per tutta la durata del
--    noleggio — una dichiarazione del datore di lavoro del cliente con i
--    nominativi di chi la usera', formati e (per le macchine dell'art. 73
--    c.5) abilitati. E' l'unico documento davvero obbligatorio di tutto il
--    noleggio a freddo. Oggi nel database non c'e' nessun posto dove
--    scriverlo: si aggiunge qui.
--
-- 2) «CARICA PDF» SU TUTTE LE SCHEDE
--    Chiesto da Alessio: stampa PDF e carica PDF su tutti i documenti di
--    tutto il gestionale noleggio. La tabella nol_media (le foto e i video
--    del 23 agosto) sa gia' tenere un file; le mancava solo il modo di
--    dire A CHE COSA e' attaccato. Con due colonne serve tutte le schede:
--    mezzo, cliente, noleggio, prodotto, fornitore, movimento.
--    Sul MEZZO in particolare e' quello che serve per legge: dichiarazione
--    CE, libretto, verbali di verifica periodica, registro manutenzioni.
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE. Solo colonne nuove, tutte con un
--    valore di partenza. Si puo' rilanciare quante volte si vuole.
--
-- Si esegue nell'SQL Editor di Supabase. In fondo risponde con una riga.
-- ============================================================


-- ------------------------------------------------------------
-- 1. IL NOLEGGIO — il contratto e chi usera' la macchina
-- ------------------------------------------------------------
alter table public.nol_noleggi
  -- il numero del contratto e la data: servono sulla carta e per ritrovarlo
  add column if not exists contratto_num       text,
  add column if not exists contratto_data      date,
  -- ⛔ art. 72 c.2: chi usera' la macchina.
  -- Una lista: [{"nome":"Mario Rossi","cf":"RSSMRA80A01H501U",
  --              "abil":"escavatore","scad":"2029-05-14"}]
  add column if not exists operatori           jsonb   not null default '[]'::jsonb,
  -- il cliente ha firmato la dichiarazione? e quando?
  add column if not exists dichiarazione_il    timestamptz,
  -- 'freddo' = senza operatore (scatta l'art. 72 c.2)
  -- 'caldo'  = con un nostro operatore (l'art. 72 c.2 non si applica)
  add column if not exists tipo_nolo           text    not null default 'freddo',
  -- com'era il mezzo alla consegna, scritto a mano da chi lo ha dato
  add column if not exists stato_consegna      text,
  -- com'e' tornato
  add column if not exists stato_rientro       text,
  -- il contratto e' stato stampato/firmato
  add column if not exists contratto_firmato_il timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_noleggi_tipo_nolo_ck') then
    alter table public.nol_noleggi
      add constraint nol_noleggi_tipo_nolo_ck check (tipo_nolo in ('freddo','caldo'));
  end if;
end $$;


-- ------------------------------------------------------------
-- 2. I FILE — a che cosa sono attaccati
-- ------------------------------------------------------------
alter table public.nol_media
  -- 'mezzo' · 'cliente' · 'noleggio' · 'prodotto' · 'fornitore' · 'movimento'
  add column if not exists attaccato_a  text,
  add column if not exists attaccato_id uuid;

-- il genere adesso e' anche 'documento' (un PDF), non solo foto e video
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'nol_media_genere_ck') then
    alter table public.nol_media drop constraint nol_media_genere_ck;
  end if;
  alter table public.nol_media
    add constraint nol_media_genere_ck check (genere in ('foto','video','documento'));
end $$;

-- ⚠️ «momento» aveva senso solo per le foto del mezzo (uscita/rientro).
-- Un libretto attaccato a un mezzo non ha un momento: si lascia il valore
-- di partenza 'uscita' e non lo si guarda. Nessun dato vecchio cambia.

create index if not exists nol_media_attaccato_idx
  on public.nol_media(attaccato_a, attaccato_id);


-- ------------------------------------------------------------
-- 3. UNA RIGA DI RISPOSTA: devono uscire tutti 1
-- ------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='operatori')                                as operatori,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name='tipo_nolo')                                as tipo_nolo,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_media'
      and column_name='attaccato_a')                              as attaccato_a,
  (select count(*) from pg_constraint
    where conname='nol_media_genere_ck')                          as genere_documento;
