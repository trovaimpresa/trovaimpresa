-- =====================================================================
-- ⛔ LA GUARDIA — messa il 22 agosto 2026. NON TOGLIERLA.
-- =====================================================================
-- Questo file, piu' in basso, fa `drop view` su `gest_computo_voci_calc`
-- e la ricrea com'era il giorno in cui e' stato scritto.
--
-- Il problema e' che da allora quella vista e' CRESCIUTA:
--   · il 20 agosto le e' stata aggiunta `origine_id`, che serve alla
--     schermata «Cosa e' cambiato» del computo di variante
--     (sql/gest-variante-origine-vista.sql);
--   · il 21 agosto le e' stato aggiunto il PREZZO COSTRUITO CON L'ANALISI
--     e la colonna `prezzo_da_analisi` (sql/gest-analisi-prezzi.sql).
--
-- ⛔ Rilanciare questo file DOPO quelli riporta la vista indietro: i prezzi
-- delle lavorazioni tornano di colpo a quelli scritti a mano, e la variante
-- perde la colonna che le serve. Nessun messaggio, nessun errore: i numeri
-- cambiano e basta. E il gestionale, in quattordici punti, invita a
-- eseguire questo file.
--
-- Quindi da oggi il file si ferma da solo, PRIMA di toccare qualsiasi cosa,
-- se si accorge che la vista e' gia' quella nuova.
--
-- ⚠️ Se ti fermi qui e ti serve davvero rifare le tabelle, esegui invece,
-- in quest'ordine, i file che vengono dopo:
--     sql/gest-variante-origine-vista.sql
--     sql/gest-analisi-prezzi.sql
-- Sono loro che tengono la vista aggiornata.
-- =====================================================================
do $$
declare
  _nuove text;
begin
  select string_agg(column_name, ', ' order by column_name)
    into _nuove
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'gest_computo_voci_calc'
     and column_name in ('origine_id', 'prezzo_da_analisi');

  if _nuove is not null then
    raise exception
      'FERMO QUI, e per il tuo bene. La vista gest_computo_voci_calc e'' gia'' quella nuova (ha: %). Rilanciando questo file i prezzi costruiti con l''analisi tornerebbero a quelli scritti a mano, in silenzio, e la variante perderebbe origine_id. Se ti serve rifare le viste, esegui sql/gest-variante-origine-vista.sql e poi sql/gest-analisi-prezzi.sql.',
      _nuove;
  end if;
end $$;
-- =====================================================================

-- =====================================================================
-- TrovaImpresa — COMPUTO METRICO  (pezzo 1 di 3: le tabelle)
-- Da salvare come  sql/gest-computo-metrico.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 10 agosto 2026
--
-- ⚠️ NON LANCIARLO subito: prima guarda il disegno qui sotto e dimmi se ti
--    torna. Una volta che ci sono dentro i dati veri, cambiare le tabelle
--    costa dieci volte tanto.
--
-- ---------------------------------------------------------------------
-- COM'E' FATTO UN COMPUTO, E PERCHE' SERVONO QUATTRO TABELLE
-- ---------------------------------------------------------------------
-- Un preventivo e' un elenco: descrizione, quantita', prezzo.
-- Un computo e' un elenco che ha dentro un altro elenco:
--
--   COMPUTO  "Ristrutturazione appartamento via Roma 12"
--   |
--   +-- CAPITOLO  "1 - Demolizioni e rimozioni"
--   |   |
--   |   +-- VOCE  A.01.002  "Demolizione di tramezzi in laterizio"   m2   18,50 €/m2
--   |   |   |
--   |   |   +-- MISURA  "tramezzo cucina"    2 parti x 3,20 x 2,70        = 17,280
--   |   |   +-- MISURA  "tramezzo bagno"     1 parte x 1,80 x 2,70        =  4,860
--   |   |   +-- MISURA  "porta da detrarre"  1 parte x 0,80 x 2,10  (-)   = -1,680
--   |   |                                              quantita' totale  =  20,460
--   |   |                                              importo = 20,460 x 18,50
--   |   +-- VOCE ...
--   +-- CAPITOLO ...
--
-- La quantita' non la scrive nessuno: viene fuori dalla somma delle misure.
-- E le misure possono essere "a detrarre" (i vuoti delle porte e delle
-- finestre): senza quelle un computo non e' un computo.
--
-- ---------------------------------------------------------------------
-- LE TRE SCELTE CHE VALE LA PENA CAPIRE
-- ---------------------------------------------------------------------
--
-- 1. LA QUANTITA' DI OGNI MISURA LA CALCOLA IL DATABASE, non il gestionale.
--    E' una "colonna generata": non si puo' scrivere, non si puo' sbagliare,
--    non si puo' dimenticare di aggiornarla. Se un domani il computo si
--    apre da un altro programma, il numero e' sempre quello giusto.
--    Attenzione al perche' dei coalesce(...,1): un campo VUOTO vale 1 (non lo
--    usi, tipo l'altezza quando misuri in metri quadri), mentre uno ZERO
--    scritto a mano vale zero davvero. Sono due cose diverse.
--
-- 2. LE VOCI NON SONO COLLEGATE AL TUO ELENCO PREZZI: se lo copiano.
--    Codice, descrizione, unita' e prezzo entrano nella voce come una foto
--    del momento. Cosi' se fra sei mesi alzi un prezzo nel tuo elenco, i
--    computi già consegnati al cliente NON cambiano da soli.
--    (E' la stessa lezione dei documenti col cliente nel cestino.)
--
-- 3. IL CESTINO SOLO SUL COMPUTO, MAI SUI PEZZI DENTRO.
--    Capitoli, voci e misure NON hanno la colonna eliminato_il, e non devono
--    averla. Sono pezzi del computo e se ne vanno con lui, come le righe di
--    una fattura. Se gliela mettessimo, la funzione "Elimina per sempre" le
--    vedrebbe come cose vive e non si potrebbe piu' svuotare un computo dal
--    cestino — e' esattamente la trappola in cui e' finito gest_note.
--
-- ---------------------------------------------------------------------
-- COSA C'E' GIA' PRONTO PER I LAVORI PUBBLICI (ma sta vuoto)
-- ---------------------------------------------------------------------
-- incidenza_manodopera e oneri_sicurezza ci sono da subito, vuote. Servono
-- alle gare pubbliche. Metterle adesso non costa niente; aggiungerle dopo
-- vorrebbe dire una migrazione sui dati veri degli utenti.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. IL COMPUTO
-- ---------------------------------------------------------------------
-- lavoro_id "set null": il computo e' un documento e resta anche se la
-- pratica viene spostata nel cestino. Perde solo il collegamento.
-- cliente_id "set null": stesso motivo.
-- mestiere_id "cascade": il computo appartiene al reparto, come tutto il resto.

create table if not exists public.gest_computi (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id)            on delete cascade,
  mestiere_id   uuid          references public.gest_mestieri(id)  on delete cascade,
  lavoro_id     uuid          references public.gest_lavori(id)    on delete set null,
  cliente_id    uuid          references public.gest_clienti(id)   on delete set null,
  -- Il preventivo nato da questo computo. Vuoto finche' non lo si crea.
  -- E' il passaggio che fa risparmiare piu' tempo di tutti: il computo e' fatto
  -- di voci con quantita' e prezzo, cioe' esattamente un preventivo — riscriverlo
  -- a mano e' lavoro buttato. La colonna la metto adesso anche se il pulsante
  -- arriva dopo: aggiungerla piu' tardi vorrebbe dire toccare i dati veri.
  preventivo_id uuid          references public.gest_preventivi(id) on delete set null,

  numero        text,                       -- "01/2026", lo scrivi tu
  titolo        text not null default '',    -- "Ristrutturazione appartamento"
  oggetto       text,                        -- l'opera, per esteso, va sul PDF
  luogo         text,                        -- "via Roma 12, Rieti"
  data          date not null default current_date,

  -- 'privato' = ristrutturazioni e pratiche per il cliente
  -- 'pubblico' = gare e Comuni: accende manodopera, sicurezza, quadro economico
  tipo          text not null default 'privato',
  stato         text not null default 'bozza',    -- bozza | definitivo

  -- quale prezzario hai usato: per ora testo libero, finisce sul PDF perche'
  -- un computo deve dire da dove vengono i prezzi
  prezzario     text,
  prezzario_anno integer,

  -- ribasso d'asta o sconto, in percentuale. Vuoto = nessuno.
  ribasso_perc  numeric(6,3),

  note          text,
  eliminato_il  timestamptz,                 -- il cestino: solo qui
  created_at    timestamptz not null default now(),

  constraint gest_computi_tipo_ok  check (tipo  in ('privato','pubblico')),
  constraint gest_computi_stato_ok check (stato in ('bozza','definitivo'))
);

create index if not exists gest_computi_user_idx
  on public.gest_computi (user_id, mestiere_id);
create index if not exists gest_computi_vivi_idx
  on public.gest_computi (user_id) where eliminato_il is null;
create index if not exists gest_computi_cestino_idx
  on public.gest_computi (user_id, eliminato_il) where eliminato_il is not null;
create index if not exists gest_computi_lavoro_idx
  on public.gest_computi (lavoro_id);


-- ---------------------------------------------------------------------
-- 2. I CAPITOLI  (Demolizioni, Strutture, Impianti, ...)
-- ---------------------------------------------------------------------
-- Servono per i subtotali: "quanto costano le demolizioni" e' la prima
-- domanda che fa un cliente quando il totale non gli piace.

create table if not exists public.gest_computo_capitoli (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)              on delete cascade,
  computo_id  uuid not null references public.gest_computi(id)     on delete cascade,

  ordine      integer not null default 0,
  numero      text,                      -- "1", "2.1": lo decidi tu
  titolo      text not null default '',
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists gest_computo_capitoli_idx
  on public.gest_computo_capitoli (computo_id, ordine);


-- ---------------------------------------------------------------------
-- 3. LE VOCI
-- ---------------------------------------------------------------------
-- capitolo_id "set null": cancellando un capitolo le voci NON si perdono,
-- finiscono in fondo senza capitolo. Cancellare un titolo non deve portarsi
-- via mezzo computo.

create table if not exists public.gest_computo_voci (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id)                     on delete cascade,
  computo_id    uuid not null references public.gest_computi(id)            on delete cascade,
  capitolo_id   uuid          references public.gest_computo_capitoli(id)   on delete set null,

  ordine        integer not null default 0,
  codice        text,                       -- "A.01.002" del prezzario, o vuoto
  descrizione   text not null default '',
  unita         text,                       -- m, m2, m3, kg, cad, corpo, ora
  prezzo_unitario numeric(14,4) not null default 0,   -- 4 decimali: i prezzari li usano

  -- ⚠️ LEGGI QUESTA, e' la scelta piu' importante della tabella.
  -- La quantita' vera NON sta qui: la calcola il database sommando le misure
  -- (vedi la vista gest_computo_voci_calc, punto 6). Il gestionale la LEGGE, non
  -- la scrive mai. Cosi' non puo' andare fuori sincrono, e non ci sono due
  -- formule uguali in due posti diversi — che e' il difetto che ci ha fatto
  -- perdere una mattinata sulle fatture.
  --
  -- Queste due colonne servono solo alle voci "A CORPO", dove non c'e' niente
  -- da misurare: metti quantita_manuale = true e scrivi la quantita' a mano.
  -- Con quantita_manuale = false la colonna quantita viene IGNORATA.
  quantita_manuale boolean not null default false,
  quantita        numeric(16,5) not null default 0,

  -- Per le gare pubbliche. Vuote per i lavori privati.
  incidenza_manodopera numeric(6,3),        -- % del prezzo che e' manodopera
  oneri_sicurezza      numeric(14,2),       -- importo non soggetto a ribasso

  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists gest_computo_voci_idx
  on public.gest_computo_voci (computo_id, ordine);
create index if not exists gest_computo_voci_cap_idx
  on public.gest_computo_voci (capitolo_id);


-- ---------------------------------------------------------------------
-- 4. LE MISURE  (il cuore del computo)
-- ---------------------------------------------------------------------
-- Tre decimali su lunghezza/larghezza/altezza: al millimetro, come in cantiere.
--
-- "detrai" = questa riga si SOTTRAE. Sono i vuoti: le porte, le finestre, i
-- fori. Senza questa colonna un computo di intonaco o di tramezzi e' sbagliato
-- per definizione.
--
-- La colonna "quantita" e' GENERATA dal database: nessuno la scrive.

create table if not exists public.gest_computo_misure (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)                on delete cascade,
  voce_id     uuid not null references public.gest_computo_voci(id)  on delete cascade,

  ordine      integer not null default 0,
  descrizione text,                          -- "tramezzo cucina", "porta"

  parti       numeric(12,3),                 -- parti uguali. Vuoto = 1
  lunghezza   numeric(12,3),                 -- vuoto = non la uso
  larghezza   numeric(12,3),
  altezza     numeric(12,3),                 -- altezza, spessore o peso
  detrai      boolean not null default false,

  -- vuoto vale 1 (non lo uso), zero scritto vale zero davvero
  quantita    numeric(16,5) generated always as (
                (case when detrai then -1 else 1 end)
                * coalesce(parti,     1)
                * coalesce(lunghezza, 1)
                * coalesce(larghezza, 1)
                * coalesce(altezza,   1)
              ) stored,

  created_at  timestamptz not null default now()
);

create index if not exists gest_computo_misure_idx
  on public.gest_computo_misure (voce_id, ordine);


-- ---------------------------------------------------------------------
-- 5. IL TUO ELENCO PREZZI  (quello che ti fa risparmiare tempo davvero)
-- ---------------------------------------------------------------------
-- Le voci che usi sempre, scritte una volta sola. Al secondo computo la
-- ricerca ti trova "tramezzo" e la voce entra bella e fatta.
--
-- Non c'e' mestiere_id: l'elenco prezzi e' della PERSONA, come i crediti
-- formativi. Le voci si vedono uguali da tutti i reparti.
--
-- "usata_volte" serve a mettere in cima quelle che usi di piu': dopo un mese
-- la ricerca ti propone il tuo modo di lavorare, non l'ordine alfabetico.

create table if not exists public.gest_prezzi_propri (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  codice        text,
  descrizione   text not null default '',
  unita         text,
  prezzo_unitario numeric(14,4) not null default 0,
  categoria     text,                        -- per raggrupparle: "Demolizioni"
  incidenza_manodopera numeric(6,3),

  -- da dove viene questo prezzo: "mio", "Tariffa Lazio 2023", "listino impresa"
  fonte         text,

  usata_volte   integer not null default 0,
  eliminato_il  timestamptz,                 -- va nel cestino: e' roba tua
  created_at    timestamptz not null default now()
);

create index if not exists gest_prezzi_propri_user_idx
  on public.gest_prezzi_propri (user_id) where eliminato_il is null;
create index if not exists gest_prezzi_propri_cestino_idx
  on public.gest_prezzi_propri (user_id, eliminato_il) where eliminato_il is not null;
-- ricerca per parola nella descrizione, senza distinzione di maiuscole
create index if not exists gest_prezzi_propri_desc_idx
  on public.gest_prezzi_propri (user_id, lower(descrizione));


-- ---------------------------------------------------------------------
-- 6. I CONTI — UNA FORMULA SOLA, E STA QUI
-- ---------------------------------------------------------------------
-- Prima versione di questo file: la quantita' della voce era una colonna che
-- il gestionale doveva ricalcolare e riscrivere. Provandolo il totale e' uscito
-- 0,00 invece di 378,51 — perche' nessuno l'aveva riscritta.
-- Sarebbe successo anche in produzione, alla prima voce salvata da una
-- schermata che si dimentica di aggiornarla. E' lo stesso difetto delle
-- fatture: la stessa formula scritta in tre posti che davano tre numeri.
--
-- Adesso il conto lo fa SOLO il database, e il gestionale lo legge:
--
--   gest_computo_voci_calc  -> ogni voce con la sua quantita' vera e l'importo
--   gest_computo_totali     -> il totale del computo, costruito sulla prima
--
-- Il gestionale scrive nelle TABELLE e legge dalle VISTE. Non deve mai
-- calcolare una quantita' da solo.

-- Ogni voce con la sua quantita' vera:
--   voce normale  -> la somma delle sue misure (le detrazioni sono negative)
--   voce a corpo  -> la quantita' scritta a mano
drop view if exists public.gest_computo_totali;
drop view if exists public.gest_computo_voci_calc;
create view public.gest_computo_voci_calc
with (security_invoker = true)
as
select
  v.id, v.user_id, v.computo_id, v.capitolo_id, v.ordine,
  v.codice, v.descrizione, v.unita, v.prezzo_unitario,
  v.quantita_manuale, v.incidenza_manodopera, v.oneri_sicurezza, v.note,
  (case when v.quantita_manuale then v.quantita
        else coalesce(m.somma, 0) end)::numeric(16,5) as quantita,
  ((case when v.quantita_manuale then v.quantita
         else coalesce(m.somma, 0) end) * v.prezzo_unitario)::numeric(16,2) as importo,
  coalesce(m.righe, 0) as misure
from public.gest_computo_voci v
left join (
  select voce_id, sum(quantita) as somma, count(*) as righe
    from public.gest_computo_misure
   group by voce_id
) m on m.voce_id = v.id;

-- Il totale del computo. importo_manodopera e oneri_sicurezza restano a zero
-- per i lavori privati: le colonne sono vuote e non danno fastidio.
create view public.gest_computo_totali
with (security_invoker = true)
as
select
  c.id      as computo_id,
  c.user_id,
  count(v.id)                                             as voci,
  coalesce(sum(v.importo), 0)::numeric(16,2)              as importo,
  coalesce(sum(v.importo * coalesce(v.incidenza_manodopera,0) / 100), 0)::numeric(16,2)
                                                          as importo_manodopera,
  coalesce(sum(coalesce(v.oneri_sicurezza,0)), 0)::numeric(16,2) as oneri_sicurezza
from public.gest_computi c
left join public.gest_computo_voci_calc v on v.computo_id = c.id
where c.eliminato_il is null
group by c.id, c.user_id;

grant select on public.gest_computo_voci_calc to authenticated;
grant select on public.gest_computo_totali    to authenticated;


-- ---------------------------------------------------------------------
-- 7. RLS — ognuno vede solo la propria roba
-- ---------------------------------------------------------------------
-- Per ora "solo il proprietario", come gest_ore e gest_crediti. La lettura
-- per i collaboratori attivi si aggiunge dopo, con lo stesso schema che usano
-- gia' le altre tabelle (gest_membri con stato='attivo'): prima si vede se il
-- computo serve anche a loro, poi si apre. Aprire e' facile, richiudere no.
--
-- Sulle tabelle figlie il controllo NON e' su user_id da solo: si verifica che
-- il padre sia tuo. Cosi' nessuno puo' attaccare una misura a una voce di un
-- altro account scrivendoci il proprio user_id.

-- I permessi: su Supabase le tabelle nuove li prendono da sole, ma scriverli
-- non costa niente e togliera' ogni dubbio se un domani cambia l'impostazione.
grant select, insert, update, delete on public.gest_computi          to authenticated;
grant select, insert, update, delete on public.gest_computo_capitoli to authenticated;
grant select, insert, update, delete on public.gest_computo_voci     to authenticated;
grant select, insert, update, delete on public.gest_computo_misure   to authenticated;
grant select, insert, update, delete on public.gest_prezzi_propri    to authenticated;

alter table public.gest_computi            enable row level security;
alter table public.gest_computo_capitoli   enable row level security;
alter table public.gest_computo_voci       enable row level security;
alter table public.gest_computo_misure     enable row level security;
alter table public.gest_prezzi_propri      enable row level security;

drop policy if exists "gest_computi_own" on public.gest_computi;
create policy "gest_computi_own" on public.gest_computi
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gest_prezzi_propri_own" on public.gest_prezzi_propri;
create policy "gest_prezzi_propri_own" on public.gest_prezzi_propri
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gest_computo_capitoli_own" on public.gest_computo_capitoli;
create policy "gest_computo_capitoli_own" on public.gest_computo_capitoli
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computi c
                 where c.id = computo_id and c.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computi c
                 where c.id = computo_id and c.user_id = auth.uid())
  );

drop policy if exists "gest_computo_voci_own" on public.gest_computo_voci;
create policy "gest_computo_voci_own" on public.gest_computo_voci
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computi c
                 where c.id = computo_id and c.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computi c
                 where c.id = computo_id and c.user_id = auth.uid())
  );

drop policy if exists "gest_computo_misure_own" on public.gest_computo_misure;
create policy "gest_computo_misure_own" on public.gest_computo_misure
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computo_voci v
                 where v.id = voce_id and v.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computo_voci v
                 where v.id = voce_id and v.user_id = auth.uid())
  );


-- ---------------------------------------------------------------------
-- 8. IL CESTINO
-- ---------------------------------------------------------------------
-- Le due tabelle che ci vanno sono gest_computi e gest_prezzi_propri.
-- I pezzi dentro (capitoli, voci, misure) NO: vedi la nota 3 in cima.
--
-- ⚠️ Serve anche una modifica nel codice, non basta l'SQL: vanno aggiunte
--    all'elenco TABELLE in js/cestino.js e a CEST_COSE in gestionale-app.html.
--    Lo faccio io nel prossimo passo, insieme alla schermata.


-- ---------------------------------------------------------------------
-- 9. ALLINEAMENTO — se una versione piu' vecchia di questo file era già stata
--    lanciata
-- ---------------------------------------------------------------------
-- "create table if not exists" crea la tabella solo se non c'e': se c'e' già,
-- le colonne aggiunte dopo NON entrano, e il file gira senza errori facendo
-- finta di niente. Queste righe le aggiungono comunque.
-- (Su un database nuovo non fanno niente: le colonne ci sono già.)

alter table public.gest_computi add column if not exists preventivo_id uuid;
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'gest_computi_preventivo_id_fkey'
                    and conrelid = 'public.gest_computi'::regclass) then
    alter table public.gest_computi
      add constraint gest_computi_preventivo_id_fkey
      foreign key (preventivo_id) references public.gest_preventivi(id) on delete set null;
  end if;
end$$;

alter table public.gest_computi           add column if not exists ribasso_perc   numeric(6,3);
alter table public.gest_computi           add column if not exists prezzario      text;
alter table public.gest_computi           add column if not exists prezzario_anno integer;
alter table public.gest_computo_voci      add column if not exists incidenza_manodopera numeric(6,3);
alter table public.gest_computo_voci      add column if not exists oneri_sicurezza      numeric(14,2);
alter table public.gest_prezzi_propri     add column if not exists incidenza_manodopera numeric(6,3);
alter table public.gest_prezzi_propri     add column if not exists fonte                text;


-- ---------------------------------------------------------------------
-- VERIFICA (facoltativa) — deve dare tutti 0 e nessun errore
-- ---------------------------------------------------------------------
-- select count(*) from public.gest_computi;
-- select count(*) from public.gest_computo_capitoli;
-- select count(*) from public.gest_computo_voci;
-- select count(*) from public.gest_computo_misure;
-- select count(*) from public.gest_prezzi_propri;
-- select * from public.gest_computo_totali;
--
-- Prova del calcolo: 2 parti x 3,20 x 2,70 deve fare 17,280
-- select (2 * 3.20 * 2.70)::numeric(16,5) as deve_fare_17_28000;


-- ---------------------------------------------------------------------
-- LA RIGA DI RISULTATO — si legge a colpo d'occhio
-- ---------------------------------------------------------------------
select
  'FATTO — le viste del computo sono state ricreate da questo file' as esito,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='gest_computo_voci_calc')  as colonne_della_vista,
  '⚠️ adesso esegui sql/gest-variante-origine-vista.sql e poi sql/gest-analisi-prezzi.sql, se non l''hai gia'' fatto'
                                                                          as e_poi;
