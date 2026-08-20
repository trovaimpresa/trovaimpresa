-- =====================================================================
-- L'ANALISI DEI PREZZI (analisi nuovo prezzo) — 21 agosto 2026
-- =====================================================================
-- Quando una lavorazione NON sta nel prezzario, il prezzo non te lo puoi
-- inventare: lo devi costruire e far vedere come. Si mettono in fila i
-- costi diretti — materiali, manodopera, noli e mezzi — poi si aggiungono
-- le SPESE GENERALI (dal 13 al 17%) e l'UTILE dell'impresa (10%).
-- Sui lavori pubblici quelle due percentuali le dice la legge.
--
-- ⚠️ L'ANALISI È SEMPRE PER UNA UNITÀ DI MISURA.
-- Se la lavorazione si misura al metro quadro, l'analisi dice quanto
-- costa UN metro quadro: quanto cemento, quante ore, quanto nolo per un
-- metro quadro. La quantità totale la mette il computo con le misure.
-- È l'errore più facile da fare, e su un documento di gara si vede
-- subito perché il prezzo esce fuori scala di cento volte.
--
-- ---------------------------------------------------------------------
-- ⛔ LA SCELTA IMPORTANTE: L'ANALISI COMANDA IL PREZZO
-- ---------------------------------------------------------------------
-- Decisa da Alessio il 21 agosto. Se una lavorazione ha l'analisi, il suo
-- prezzo VIENE da lì: non c'è nessun pulsante «usa questo prezzo» da
-- premere, e non c'è nessuna copia del numero che possa scollarsi.
-- Cambi una riga dei materiali e il computo, il SAL, la variante e tutti
-- i PDF dicono subito il prezzo nuovo.
--
-- È la stessa scelta già fatta due volte in questo gestionale:
--   - la QUANTITÀ non si scrive, la somma il database dalle misure;
--   - le DATE del cronoprogramma non si scrivono, le calcola cronoDate.
-- Un numero scritto in due posti è un numero che prima o poi dice due
-- cose diverse, e nessuno se ne accorge finché non lo legge un cliente.
--
-- La colonna `gest_computo_voci.prezzo_unitario` NON viene toccata:
-- resta lì, e resta il prezzo delle lavorazioni che l'analisi non ce
-- l'hanno (cioè quasi tutte). Se un giorno cancelli le righe
-- dell'analisi, il prezzo torna a essere quello scritto a mano.
--
-- ---------------------------------------------------------------------
-- ⚠️ IL PREZZO SI CHIUDE A DUE DECIMALI, NON A QUATTRO
-- ---------------------------------------------------------------------
-- La colonna dei prezzi ne accetta quattro, ma sui documenti se ne
-- stampano due. Se il prezzo dell'analisi avesse quattro decimali, sul
-- foglio si leggerebbe «18,50» e l'importo sarebbe calcolato su
-- 18,5025: il documento non tornerebbe più con la calcolatrice.
-- È la stessa regola della quantità chiusa a tre decimali del 19 agosto.
--
-- ---------------------------------------------------------------------
-- ⚠️ «create or replace» E LE COLONNE NUOVE IN FONDO
-- ---------------------------------------------------------------------
-- Da `gest_computo_voci_calc` dipendono `gest_computo_totali`,
-- `gest_sal_righe_calc` e `gest_sal_totali`. Un `drop` le porterebbe via
-- tutte e andrebbero riscritte a mano — quattro viste ricopiate a memoria
-- è il modo migliore per perderne un pezzo. `create or replace` le lascia
-- dove sono, a patto di non cambiare né l'ordine né il tipo delle colonne
-- che ci sono già, e di aggiungere le nuove SOLO IN FONDO.
--
-- ⚠️ PREREQUISITO: prima va eseguito `sql/gest-variante-origine-vista.sql`
-- (quello che ha aggiunto `origine_id` alla vista). Se non l'hai fatto,
-- questo file si ferma da solo e te lo dice, invece di togliere una
-- colonna che serve alla variante.
--
-- Nessun dato viene toccato. Si può eseguire più volte.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. LA RETE: non si parte se manca il pezzo di prima
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='gest_computo_voci_calc'
       and column_name='origine_id') then
    raise exception 'Prima esegui sql/gest-variante-origine-vista.sql: senza, questo file toglierebbe alla variante la colonna che le serve.';
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 1. LE RIGHE DELL'ANALISI
-- ---------------------------------------------------------------------
-- Una riga = una cosa che serve per fare UNA unità di lavorazione.
-- `tipo` serve a raggrupparle sul foglio (materiali, manodopera, noli):
-- su un'analisi di gara i tre gruppi vanno separati, non messi in fila.
--
-- ⚠️ «on delete cascade» dalla lavorazione: un'analisi senza la sua
-- lavorazione non vuol dire niente. E la lavorazione a sua volta va via
-- col computo. Le lavorazioni NON passano dal cestino (vedi la nota 3 di
-- gest-computo-metrico.sql): quando si cancellano, si cancellano.

create table if not exists public.gest_analisi_righe (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)                  on delete cascade,
  voce_id     uuid not null references public.gest_computo_voci(id)    on delete cascade,

  ordine      integer not null default 0,
  tipo        text    not null default 'materiale',
  descrizione text    not null default '',
  unita       text,                                -- m, mq, mc, kg, ora, cad...
  quantita        numeric(16,5) not null default 0,
  prezzo_unitario numeric(14,4) not null default 0,
  note        text,
  created_at  timestamptz not null default now(),

  -- ⚠️ il database non si fida di quello che gli arriva: la stessa
  -- colonna la scriverà anche chi domani userà un altro modo.
  constraint gest_analisi_tipo_valido
    check (tipo in ('materiale','manodopera','nolo','altro')),
  constraint gest_analisi_numeri_sensati
    check (quantita >= 0 and prezzo_unitario >= 0)
);

create index if not exists gest_analisi_righe_idx
  on public.gest_analisi_righe (voce_id, ordine);


-- ---------------------------------------------------------------------
-- 2. LE DUE PERCENTUALI, SULLA LAVORAZIONE
-- ---------------------------------------------------------------------
-- Stanno sulla voce e non su una tabella a parte: sono due numeri, e una
-- tabella in più per due numeri è una tabella in più da tenere allineata.
-- Vuote = si usano quelle di legge (15% e 10%), scritte nella vista.

alter table public.gest_computo_voci
  add column if not exists an_spese_perc numeric(6,3);
alter table public.gest_computo_voci
  add column if not exists an_utile_perc numeric(6,3);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='gest_voci_an_perc_sensate') then
    alter table public.gest_computo_voci
      add constraint gest_voci_an_perc_sensate
      check ( (an_spese_perc is null or (an_spese_perc >= 0 and an_spese_perc <= 100))
          and (an_utile_perc is null or (an_utile_perc >= 0 and an_utile_perc <= 100)) );
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 3. RLS — le stesse regole delle misure, che stanno allo stesso livello
-- ---------------------------------------------------------------------
alter table public.gest_analisi_righe enable row level security;

drop policy if exists "gest_analisi_righe_own" on public.gest_analisi_righe;
create policy "gest_analisi_righe_own" on public.gest_analisi_righe
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computo_voci v
                 where v.id = voce_id and v.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computo_voci v
                 where v.id = voce_id and v.user_id = auth.uid())
  );

grant select, insert, update, delete on public.gest_analisi_righe to authenticated;


-- ---------------------------------------------------------------------
-- 4. IL CONTO — in un posto solo
-- ---------------------------------------------------------------------
-- costi   = materiali + manodopera + noli + altro   (per UNA unità)
-- spese   = costi * spese generali %
-- utile   = (costi + spese) * utile %
-- prezzo  = costi + spese + utile,  chiuso a DUE decimali
--
-- ⚠️ L'utile si calcola su (costi + spese generali), non sui soli costi:
-- è così che si fa un'analisi, e su una gara pubblica è la differenza fra
-- un documento accettato e uno contestato.
--
-- Un `join` e non un `left join`: qui dentro ci sono SOLO le lavorazioni
-- che hanno davvero delle righe. Una lavorazione senza analisi non deve
-- comparire con un prezzo zero — deve non comparire affatto, se no il
-- prezzo scritto a mano verrebbe schiacciato a zero.

create or replace view public.gest_analisi_totali
with (security_invoker = true)
as
with somme as (
  select r.voce_id,
         count(*)                                                                   as righe,
         coalesce(sum(r.quantita*r.prezzo_unitario) filter (where r.tipo='materiale'), 0)  as materiali,
         coalesce(sum(r.quantita*r.prezzo_unitario) filter (where r.tipo='manodopera'), 0) as manodopera,
         coalesce(sum(r.quantita*r.prezzo_unitario) filter (where r.tipo='nolo'), 0)       as noli,
         coalesce(sum(r.quantita*r.prezzo_unitario) filter (where r.tipo='altro'), 0)      as altro
    from public.gest_analisi_righe r
   group by r.voce_id
),
base as (
  select v.id as voce_id, v.user_id, s.righe,
         s.materiali, s.manodopera, s.noli, s.altro,
         (s.materiali + s.manodopera + s.noli + s.altro) as costi,
         coalesce(v.an_spese_perc, 15) as sp,
         coalesce(v.an_utile_perc, 10) as up
    from public.gest_computo_voci v
    join somme s on s.voce_id = v.id
),
con_spese as (
  select b.*, round(b.costi * b.sp / 100, 4) as spese from base b
),
con_utile as (
  select c.*, round((c.costi + c.spese) * c.up / 100, 4) as utile from con_spese c
)
select
  voce_id,
  user_id,
  righe,
  round(materiali, 4)::numeric(16,4)  as materiali,
  round(manodopera,4)::numeric(16,4)  as manodopera,
  round(noli,      4)::numeric(16,4)  as noli,
  round(altro,     4)::numeric(16,4)  as altro,
  round(costi,     4)::numeric(16,4)  as costi,
  sp::numeric(6,3)                    as spese_perc,
  up::numeric(6,3)                    as utile_perc,
  spese::numeric(16,4)                as spese,
  utile::numeric(16,4)                as utile,
  -- ⚠️ DUE decimali: è il numero che si stampa, e l'importo si calcola
  -- su questo. Se ne avesse quattro, il foglio non tornerebbe più con la
  -- calcolatrice.
  round(costi + spese + utile, 2)::numeric(14,4) as prezzo
from con_utile;

grant select on public.gest_analisi_totali to authenticated;


-- ---------------------------------------------------------------------
-- 5. IL PREZZO DELLA LAVORAZIONE VIENE DALL'ANALISI, SE C'È
-- ---------------------------------------------------------------------
-- ⚠️ Le colonne di prima restano nello stesso ordine e dello stesso tipo,
-- e le due nuove vanno IN FONDO: solo così `create or replace` non tocca
-- le tre viste che stanno attaccate a questa.

create or replace view public.gest_computo_voci_calc
with (security_invoker = true)
as
select
  v.id, v.user_id, v.computo_id, v.capitolo_id, v.ordine,
  v.codice, v.descrizione, v.unita,
  -- il prezzo: dall'analisi se c'è, se no quello scritto a mano
  coalesce(a.prezzo, v.prezzo_unitario)::numeric(14,4) as prezzo_unitario,
  v.quantita_manuale, v.incidenza_manodopera, v.oneri_sicurezza, v.note,
  -- la quantità CHIUSA a tre decimali: è quella che si stampa ed è quella
  -- che si moltiplica. Una sola quantità, non due.   (invariata)
  round(
    (case when v.quantita_manuale then v.quantita
          else coalesce(m.somma, 0) end), 3
  )::numeric(16,5) as quantita,
  -- e l'importo si fa con LO STESSO prezzo di sopra, non con un altro
  (round(
     (case when v.quantita_manuale then v.quantita
           else coalesce(m.somma, 0) end), 3
   ) * coalesce(a.prezzo, v.prezzo_unitario))::numeric(16,2) as importo,
  coalesce(m.righe, 0) as misure,
  v.origine_id,
  -- ⬇ NUOVA, e va in fondo: questo prezzo è costruito o scritto a mano?
  --   Serve alla schermata e al foglio, per dirlo invece di lasciarlo
  --   indovinare.
  (a.prezzo is not null) as prezzo_da_analisi
from public.gest_computo_voci v
left join (
  select voce_id, sum(quantita) as somma, count(*) as righe
    from public.gest_computo_misure
   group by voce_id
) m on m.voce_id = v.id
left join public.gest_analisi_totali a on a.voce_id = v.id;

grant select on public.gest_computo_voci_calc to authenticated;


-- ---------------------------------------------------------------------
-- UNA RIGA DI RISULTATO che dice com'è andata
-- ---------------------------------------------------------------------
select case
  when (select count(*) from information_schema.tables
         where table_schema='public' and table_name='gest_analisi_righe') = 1
   and (select count(*) from information_schema.columns
         where table_schema='public' and table_name='gest_computo_voci'
           and column_name in ('an_spese_perc','an_utile_perc')) = 2
   and (select count(*) from information_schema.columns
         where table_schema='public' and table_name='gest_computo_voci_calc'
           and column_name in ('origine_id','prezzo_da_analisi')) = 2
   and (select count(*) from information_schema.tables
         where table_schema='public' and table_name='gest_analisi_totali') = 1
  then 'FATTO — l''analisi dei prezzi c''è: quando una lavorazione non sta nel prezzario, il prezzo si costruisce.'
  else 'NON FATTO — manca qualche pezzo. Riprova o dimmelo.'
end as esito;
