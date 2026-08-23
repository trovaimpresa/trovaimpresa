-- ============================================================
-- TrovaImpresa — IL LUCCHETTO DEL PIANO ANCHE SUL NOLEGGIO
-- 23 agosto 2026
--
-- COSA HA DETTO LA FOTOGRAFIA (sql/noleggio-fotografia-lucchetti.sql,
-- eseguita il 23 agosto):
--   · 0 tabelle senza lucchetto — RLS acceso su tutte e sette;
--   · 4 regole ciascuna;
--   · ⛔ 0 regole che nominano il PIANO.
--
-- Cioe': ognuno vede solo la sua roba (bene), ma il piano non lo guarda
-- nessuno. Un account scaduto o gratuito che parla direttamente con
-- l'API di Supabase, senza passare dalla pagina, continua a scrivere nel
-- noleggio e nel magazzino. Sulle tabelle gest_* questo buco e' stato
-- chiuso il 22 agosto (sql/lucchetto-piano-gestionale.sql); qui no.
--
-- COSA FA QUESTO FILE
-- Attacca alle sette tabelle del noleggio e del magazzino LO STESSO
-- guardiano gia' scritto per le gest_*: `gest_blocco_piano()`.
-- ⛔ Non ne scrive uno nuovo. Se un domani cambia la regola del piano,
--    si cambia in un punto solo e cambia dappertutto.
--
-- COSA SUCCEDE A CHI SCADE — identico al gestionale:
--   LEGGE ed ESPORTA tutto quello che ha, non perde una riga.
--   NON puo' creare, modificare o cancellare finche' non rinnova.
--   Appena rinnova torna tutto com'era, nello stesso istante.
-- Passano sempre: le funzioni del server, l'SQL Editor, il fondatore.
--
-- ⛔ NON TOCCA LE REGOLE (RLS) CHE CI SONO GIA'. Aggiunge solo il
--    guardiano. Si puo' rilanciare quante volte si vuole.
--
-- ⚠️ SI ESEGUE DOPO sql/lucchetto-piano-gestionale.sql: la funzione
--    gest_blocco_piano() nasce li'. Se non c'e', qui sotto ci si ferma
--    con un messaggio invece di lasciare mezzo lavoro fatto.
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

do $blocco$
declare
  r         record;
  v_colonna text;
  v_tab     text[] := array['nol_mezzi','nol_clienti','nol_noleggi','nol_media',
                            'neg_prodotti','neg_fornitori','neg_movimenti'];
begin
  if not exists (select 1 from pg_proc p
                   join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'gest_blocco_piano') then
    raise exception
      'Manca la funzione gest_blocco_piano(): esegui prima sql/lucchetto-piano-gestionale.sql.';
  end if;

  for r in
    select c.oid, c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and c.relname = any(v_tab)
     order by c.relname
  loop
    -- prima si toglie sempre: cosi' il file si puo' rilanciare
    execute format('drop trigger if exists trg_gest_piano on public.%I', r.relname);

    select a.attname into v_colonna
      from pg_attribute a
     where a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped
       and a.attname = 'user_id'
     limit 1;

    -- una tabella senza proprietario non e' di nessuno: si salta invece di
    -- attaccarle un guardiano che non saprebbe chi guardare
    if v_colonna is null then
      continue;
    end if;

    execute format(
      'create trigger trg_gest_piano before insert or update or delete on public.%I
         for each row execute function public.gest_blocco_piano(%L)',
      r.relname, v_colonna);
  end loop;
end
$blocco$;


-- ------------------------------------------------------------
-- LA RIGA DI RISULTATO
-- Non si fida di quello che c'e' scritto qui sopra: va a contare i
-- guardiani davvero attaccati. E già che c'e' guarda anche un'altra cosa
-- che la fotografia non aveva guardato: le 4 regole di ogni tabella
-- sono davvero legate a «questa riga e' tua» (auth.uid()), o ce n'e'
-- qualcuna aperta a chiunque?
-- ------------------------------------------------------------
with mie as (
  select unnest(array['nol_mezzi','nol_clienti','nol_noleggi','nol_media',
                      'neg_prodotti','neg_fornitori','neg_movimenti']) as t
),
guardiani as (
  select m.t
    from mie m
    join pg_class c on c.relname = m.t and c.relnamespace = 'public'::regnamespace
    join pg_trigger g on g.tgrelid = c.oid
                     and g.tgname = 'trg_gest_piano' and not g.tgisinternal
),
regole_larghe as (
  select p.tablename || '.' || p.policyname as chi
    from pg_policies p
    join mie m on m.t = p.tablename
   where p.schemaname = 'public'
     and coalesce(p.qual,'') || coalesce(p.with_check,'') not ilike '%auth.uid()%'
)
select
  (select count(*) from guardiani)                                    as lucchetto_messo_su,
  (select count(*) from mie)                                          as tabelle_in_tutto,
  (select count(*) from regole_larghe)                                as regole_che_NON_guardano_chi_sei,
  coalesce((select string_agg(chi, ', ' order by chi) from regole_larghe),
           'nessuna: tutte e ventotto guardano auth.uid()')           as quali;
