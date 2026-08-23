-- ============================================================
-- TrovaImpresa — LE CAUZIONI
-- 23 agosto 2026
--
-- PERCHE'
-- Oggi la cauzione e' un numero solo, scritto sul noleggio: «500».
-- Non dice in che forma l'hai presa, quando, se ce l'hai ancora in mano,
-- quando l'hai restituita e quanto hai trattenuto per i danni.
--
-- ⛔ E' soldi di altri che stanno sul tuo conto. Se un cliente ti chiede
--    «quando mi ridai i miei 500 euro?» oggi il gestionale non sa
--    rispondere. E tu non sai quanto ne hai in mano in tutto.
--
-- ⚠️ LO SVINCOLO E' LA COSA CHE IL VERBALE SERVE A VINCERE. Il verbale di
--    riconsegna dice quali voci sono in DANNO; qui si scrive quanto vale
--    quel danno e quanto torna indietro al cliente. Sono le due meta'
--    della stessa discussione.
--
-- COSA AGGIUNGE — otto colonne su nol_noleggi, tutte nuove:
--   cauzione_forma        contanti · assegno · bonifico · carta · fideiussione
--   cauzione_rif          n. dell'assegno, CRO del bonifico, ultime 4 cifre
--   cauzione_ricevuta_il  quando l'hai presa
--   cauzione_stato        nessuna · in_deposito · svincolata
--   cauzione_svincolata_il  quando l'hai chiusa
--   cauzione_restituita   quanto e' tornato al cliente
--   cauzione_trattenuta   quanto hai tenuto per i danni
--   cauzione_motivo       perche' hai trattenuto
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE DI QUELLO CHE C'E'. La colonna
--    «cauzione» resta dov'e' con dentro lo stesso numero.
--
-- ⚠️ IL RIEMPIMENTO DI PARTENZA. Ogni noleggio che ha una cauzione
--    maggiore di zero parte come «in_deposito», anche se il mezzo e' gia'
--    rientrato: il gestionale non puo' sapere se quella cauzione l'hai
--    gia' resa. Quelli gia' rientrati compaiono nell'elenco come DA
--    SVINCOLARE, che e' esattamente la lista delle cose da sistemare.
--    Si chiudono uno per uno dalla loro scheda, in due clic.
--
-- ⛔ SI PUO' RILANCIARE: tocca solo le righe rimaste a «nessuna».
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

alter table public.nol_noleggi
  add column if not exists cauzione_forma       text,
  add column if not exists cauzione_rif         text,
  add column if not exists cauzione_ricevuta_il date,
  add column if not exists cauzione_stato       text not null default 'nessuna',
  add column if not exists cauzione_svincolata_il date,
  add column if not exists cauzione_restituita  numeric,
  add column if not exists cauzione_trattenuta  numeric,
  add column if not exists cauzione_motivo      text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_noleggi_cauzione_stato_ck') then
    alter table public.nol_noleggi
      add constraint nol_noleggi_cauzione_stato_ck
      check (cauzione_stato in ('nessuna','in_deposito','svincolata'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nol_noleggi_cauzione_forma_ck') then
    alter table public.nol_noleggi
      add constraint nol_noleggi_cauzione_forma_ck
      check (cauzione_forma is null or
             cauzione_forma in ('contanti','assegno','bonifico','carta','fideiussione'));
  end if;
end $$;

-- le cauzioni che c'erano gia': se c'e' un numero, quei soldi sono in mano tua
update public.nol_noleggi
   set cauzione_stato = 'in_deposito'
 where cauzione_stato = 'nessuna'
   and coalesce(cauzione,0) > 0;

-- serve all'elenco: «quali ho in mano», «quali devo ancora rendere»
create index if not exists nol_noleggi_cauzione_idx
  on public.nol_noleggi(user_id, cauzione_stato);


-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA
-- «colonne_aggiunte» deve dire 8.
-- «da_svincolare» sono i mezzi gia' rientrati con la cauzione ancora
-- aperta: e' la lista di lavoro che trovi nella sezione Cauzioni.
-- ------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='nol_noleggi'
      and column_name in ('cauzione_forma','cauzione_rif','cauzione_ricevuta_il',
                          'cauzione_stato','cauzione_svincolata_il','cauzione_restituita',
                          'cauzione_trattenuta','cauzione_motivo'))          as colonne_aggiunte,
  (select count(*) from public.nol_noleggi
    where cauzione_stato = 'in_deposito')                                    as cauzioni_in_deposito,
  (select coalesce(sum(cauzione),0) from public.nol_noleggi
    where cauzione_stato = 'in_deposito')                                    as soldi_in_mano,
  (select count(*) from public.nol_noleggi
    where cauzione_stato = 'in_deposito'
      and data_rientro_effettivo is not null)                                as da_svincolare;
