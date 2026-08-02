-- =====================================================================
-- TrovaImpresa — LE FATTURE DIVENTANO UNA COSA A SE'
-- Da salvare come  sql/gestionale-fatture.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Lanciarlo due volte non fa danni.
--
-- IL PROBLEMA CHE RISOLVE
-- Fino a oggi la fattura non esisteva: erano tre caselle attaccate al lavoro
-- (fatt_stato, num_fatt, data_fatt_emessa). Da li' venivano sette limiti:
-- una fattura per lavoro, una riga sola, niente IVA, niente acconti, niente
-- nota di credito, niente ritenuta, niente bollo. E senza l'IVA riga per riga
-- il file XML per lo SDI non si puo' nemmeno cominciare.
--
-- SCELTE PROGETTUALI
-- 1. Stesso stampo dei preventivi (gest_preventivi + gest_preventivo_righe),
--    che funzionano gia' bene: testata + righe.
-- 2. Una fattura puo' agganciare PIU' lavori -> tabella ponte gest_fattura_lavori.
--    E' quello che risolve le tre fatture allo stesso condominio.
-- 3. Le vecchie caselle su gest_lavori NON vengono cancellate. Restano dove
--    sono: il travaso le legge, non le distrugge. Se qualcosa va storto si
--    torna indietro senza aver perso niente.
-- 4. Numerazione per anno: il vincolo unique(user_id, anno, numero) impedisce
--    due fatture con lo stesso numero nello stesso anno, che e' il primo
--    motivo per cui un commercialista boccia un gestionale.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TESTATA DELLA FATTURA
-- ---------------------------------------------------------------------
create table if not exists public.gest_fatture (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id)           on delete cascade,
  mestiere_id  uuid          references public.gest_mestieri(id) on delete cascade,
  cliente_id   uuid          references public.gest_clienti(id)  on delete set null,

  -- numerazione: progressivo che riparte ogni anno
  anno         integer not null default extract(year from current_date)::int,
  numero       integer,                       -- null finche' e' bozza: una bozza
                                              -- non deve consumare un numero
  tipo         text not null default 'fattura',
                                              -- 'fattura' | 'acconto' | 'nota_credito'
  data         date not null default current_date,
  stato        text not null default 'bozza',
                                              -- 'bozza' | 'emessa' | 'pagata' | 'annullata'
  data_pagata  date,

  -- copia dei dati del cliente al momento dell'emissione: se domani cambi
  -- l'indirizzo in anagrafica, la fattura gia' emessa non deve cambiare
  cli_nome        text,
  cli_piva        text,
  cli_cod_fiscale text,
  cli_indirizzo   text,
  cli_cap         text,
  cli_citta       text,
  cli_prov        text,
  cli_sdi         text,
  cli_pec         text,

  -- regime al momento dell'emissione (RF01 ordinario, RF19 forfettario...)
  regime_fiscale  text,

  -- importi in fondo alla fattura, oltre alle righe
  ritenuta_perc   numeric(5,2)  not null default 0,   -- ritenuta d'acconto in %
  bollo           numeric(10,2) not null default 0,   -- 2.00 per i forfettari sopra 77,47
  sconto          numeric(10,2) not null default 0,

  note         text,
  created_at   timestamptz not null default now(),

  constraint gest_fatture_tipo_ok
    check (tipo in ('fattura','acconto','nota_credito')),
  constraint gest_fatture_stato_ok
    check (stato in ('bozza','emessa','pagata','annullata'))
);

create index if not exists gest_fatture_user_idx     on public.gest_fatture (user_id);
create index if not exists gest_fatture_mestiere_idx on public.gest_fatture (mestiere_id);
create index if not exists gest_fatture_cliente_idx  on public.gest_fatture (cliente_id);
create index if not exists gest_fatture_stato_idx    on public.gest_fatture (stato);

-- Due fatture non possono avere lo stesso numero nello stesso anno.
-- Le bozze (numero null) restano fuori: possono essere quante vuoi.
create unique index if not exists gest_fatture_numero_anno_uniq
  on public.gest_fatture (user_id, anno, numero)
  where numero is not null;


-- ---------------------------------------------------------------------
-- 2. RIGHE DELLA FATTURA
--    Come gest_preventivo_righe, ma con l'aliquota: senza quella
--    la fattura elettronica non si fa.
-- ---------------------------------------------------------------------
create table if not exists public.gest_fattura_righe (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id)          on delete cascade,
  fattura_id   uuid not null references public.gest_fatture(id) on delete cascade,

  descrizione  text not null,
  qta          numeric(12,3) not null default 1,
  prezzo       numeric(12,2) not null default 0,
  iva          numeric(5,2)  not null default 10,   -- 22 | 10 | 4 | 0
  ordine       integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists gest_fattura_righe_fatt_idx on public.gest_fattura_righe (fattura_id);
create index if not exists gest_fattura_righe_user_idx on public.gest_fattura_righe (user_id);


-- ---------------------------------------------------------------------
-- 3. QUALI LAVORI DENTRO QUALE FATTURA (tabella ponte)
--    E' il pezzo che permette di mettere tre lavori in una fattura sola.
-- ---------------------------------------------------------------------
create table if not exists public.gest_fattura_lavori (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)          on delete cascade,
  fattura_id  uuid not null references public.gest_fatture(id) on delete cascade,
  lavoro_id   uuid not null references public.gest_lavori(id)  on delete cascade,
  created_at  timestamptz not null default now(),

  -- lo stesso lavoro non puo' finire due volte nella stessa fattura
  unique (fattura_id, lavoro_id)
);

create index if not exists gest_fattura_lavori_fatt_idx   on public.gest_fattura_lavori (fattura_id);
create index if not exists gest_fattura_lavori_lavoro_idx on public.gest_fattura_lavori (lavoro_id);


-- ---------------------------------------------------------------------
-- 4. RLS — pattern standard del progetto
--    Titolare: pieno controllo. Collaboratori attivi: sola lettura.
-- ---------------------------------------------------------------------
alter table public.gest_fatture        enable row level security;
alter table public.gest_fattura_righe  enable row level security;
alter table public.gest_fattura_lavori enable row level security;

drop policy if exists "gest_fatture_own" on public.gest_fatture;
create policy "gest_fatture_own" on public.gest_fatture
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gest_fattura_righe_own" on public.gest_fattura_righe;
create policy "gest_fattura_righe_own" on public.gest_fattura_righe
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gest_fattura_lavori_own" on public.gest_fattura_lavori;
create policy "gest_fattura_lavori_own" on public.gest_fattura_lavori
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sola lettura per la squadra: serve alla segretaria, che deve vedere le
-- fatture ma non deve poterle cambiare. Senza questa policy la sezione
-- risulta vuota per i collaboratori — lo stesso problema gia' capitato
-- con gest_scadenze e con gest_mezzi.
drop policy if exists "gest_fatture_team_read" on public.gest_fatture;
create policy "gest_fatture_team_read" on public.gest_fatture
  for select using (
    exists (select 1 from public.gest_membri m
            where m.membro_id = auth.uid()
              and m.impresa_id = gest_fatture.user_id
              and m.stato = 'attivo')
  );

drop policy if exists "gest_fattura_righe_team_read" on public.gest_fattura_righe;
create policy "gest_fattura_righe_team_read" on public.gest_fattura_righe
  for select using (
    exists (select 1 from public.gest_membri m
            where m.membro_id = auth.uid()
              and m.impresa_id = gest_fattura_righe.user_id
              and m.stato = 'attivo')
  );

drop policy if exists "gest_fattura_lavori_team_read" on public.gest_fattura_lavori;
create policy "gest_fattura_lavori_team_read" on public.gest_fattura_lavori
  for select using (
    exists (select 1 from public.gest_membri m
            where m.membro_id = auth.uid()
              and m.impresa_id = gest_fattura_lavori.user_id
              and m.stato = 'attivo')
  );


-- ---------------------------------------------------------------------
-- 5. DATI FISCALI DEL CLIENTE
--    Servono all'XML tanto quanto quelli dell'impresa. Facoltativi.
-- ---------------------------------------------------------------------
alter table public.gest_clienti add column if not exists piva        text;
alter table public.gest_clienti add column if not exists cod_fiscale text;
alter table public.gest_clienti add column if not exists cap         text;
alter table public.gest_clienti add column if not exists citta       text;
alter table public.gest_clienti add column if not exists prov        text;
alter table public.gest_clienti add column if not exists sdi_codice  text;
alter table public.gest_clienti add column if not exists sdi_pec     text;


-- ---------------------------------------------------------------------
-- 5b. IL PDF CARICATO A MANO SI AGGANCIA ALLA FATTURA
--     Prima il PDF della fattura vera (quello del commercialista) si
--     appoggiava al lavoro. Ora che la fattura esiste, si appoggia a lei:
--     una fattura puo' avere dentro piu' lavori, il PDF e' uno solo.
-- ---------------------------------------------------------------------
alter table public.gest_foto add column if not exists fattura_id uuid
  references public.gest_fatture(id) on delete cascade;

create index if not exists gest_foto_fattura_idx on public.gest_foto (fattura_id);


-- ---------------------------------------------------------------------
-- 6. IL TRAVASO — una volta sola
--    Ogni lavoro gia' segnato "emessa" o "pagata" diventa una fattura vera
--    con una riga sola, tenendo il suo numero e la sua data.
--    Il "where not exists" fa si' che rilanciando questo file non si creino
--    doppioni: i lavori gia' travasati vengono saltati.
-- ---------------------------------------------------------------------
-- Un lavoro alla volta, dentro un ciclo: cosi' ogni fattura sa con certezza
-- da quale lavoro e' nata. (Fare tutto in una query sola sembrava piu' furbo,
-- ma bisognava fidarsi dell'ordine con cui il database restituisce le righe
-- inserite, e quell'ordine non e' garantito: bastava una riga fuori posto per
-- attaccare la fattura al lavoro sbagliato.)
do $$
declare
  l record;
  nuova_id uuid;
  quante   int := 0;
begin
  for l in
    select *
    from public.gest_lavori
    where coalesce(fatt_stato,'none') in ('emessa','pagata')
      and not exists (select 1 from public.gest_fattura_lavori fl where fl.lavoro_id = gest_lavori.id)
    order by num_fatt nulls last, id
  loop
    insert into public.gest_fatture
      (user_id, mestiere_id, cliente_id, anno, numero, data, stato, data_pagata, note)
    values (
      l.user_id,
      l.mestiere_id,
      l.cliente_id,
      extract(year from coalesce(l.data_fatt_emessa, l.data_fatto, l.data_prevista, current_date))::int,
      l.num_fatt,
      coalesce(l.data_fatt_emessa, l.data_fatto, l.data_prevista, current_date),
      case when l.fatt_stato = 'pagata' then 'pagata' else 'emessa' end,
      case when l.fatt_stato = 'pagata' then coalesce(l.data_fatto, l.data_fatt_emessa) end,
      'Portata dentro dal vecchio sistema il ' || to_char(current_date,'DD/MM/YYYY')
    )
    returning id into nuova_id;

    insert into public.gest_fattura_lavori (user_id, fattura_id, lavoro_id)
    values (l.user_id, nuova_id, l.id);

    insert into public.gest_fattura_righe (user_id, fattura_id, descrizione, qta, prezzo, iva, ordine)
    values (l.user_id, nuova_id,
            coalesce(nullif(trim(l.descrizione),''),'Prestazione di servizi'),
            1, coalesce(l.importo,0), 0, 0);

    -- il PDF caricato a mano su quel lavoro segue la sua fattura
    update public.gest_foto
       set fattura_id = nuova_id
     where lavoro_id = l.id and tipo = 'fattura' and fattura_id is null;

    quante := quante + 1;
  end loop;

  raise notice 'Fatture portate dentro dal vecchio sistema: %', quante;
end $$;

-- Nota sull'IVA del travaso: le fatture vecchie non avevano l'IVA da nessuna
-- parte, quindi l'importo che c'era e' l'unico dato certo. Lo metto come
-- imponibile con aliquota 0, cosi' il totale della fattura resta identico a
-- quello che vedevi prima e i conti dell'anno non si spostano di un euro.
-- Se una di quelle fatture aveva l'IVA dentro, la correggi tu a mano.


-- ---------------------------------------------------------------------
-- 7. VISTA: la fattura con i suoi totali gia' calcolati
--    Cosi' il gestionale non deve rifare la somma ogni volta che apre
--    la sezione, e i numeri in cima escono con una lettura sola.
-- ---------------------------------------------------------------------
create or replace view public.gest_fatture_totali as
select
  f.id                as fattura_id,
  f.user_id,
  f.mestiere_id,
  coalesce(sum(r.qta * r.prezzo), 0)                          as imponibile,
  coalesce(sum(r.qta * r.prezzo * r.iva / 100), 0)            as iva,
  coalesce(sum(r.qta * r.prezzo * (1 + r.iva / 100)), 0)
    - f.sconto + f.bollo
    - coalesce(sum(r.qta * r.prezzo), 0) * f.ritenuta_perc / 100  as totale,
  count(r.id)                                                 as n_righe
from public.gest_fatture f
left join public.gest_fattura_righe r on r.fattura_id = f.id
group by f.id, f.user_id, f.mestiere_id, f.sconto, f.bollo, f.ritenuta_perc;

-- Senza security_invoker la vista mostrerebbe le fatture di tutti.
alter view public.gest_fatture_totali set (security_invoker = true);


-- ---------------------------------------------------------------------
-- 8. VERIFICA — lancia queste tre righe dopo il Run qui sopra
-- ---------------------------------------------------------------------
-- select count(*) as fatture_create   from public.gest_fatture;
-- select count(*) as righe_create     from public.gest_fattura_righe;
-- select f.anno, f.numero, f.stato, t.imponibile, t.iva, t.totale
--   from public.gest_fatture f
--   join public.gest_fatture_totali t on t.fattura_id = f.id
--  order by f.anno desc, f.numero desc;
