-- ============================================================
-- gest-sal.sql — LA CONTABILITA' DEI LAVORI (Stati di Avanzamento)
--
-- A cosa serve: hai un lavoro lungo, non aspetti la fine per farti
-- pagare. Ogni tanto conti quello che hai fatto e chiedi un acconto.
-- Quel conto si chiama SAL, Stato Avanzamento Lavori.
--
-- ⚠️ LA SCELTA PIU' IMPORTANTE DI QUESTO FILE: LE QUANTITA' SONO
--    PROGRESSIVE, cioe' "quanto ho fatto DA QUANDO HO COMINCIATO",
--    non "quanto ho fatto dall'ultima volta".
--
--    Perche': se un mese sbagli a contare, il mese dopo si raddrizza
--    da solo. Con le quantita' "da ultima volta" l'errore resta
--    dentro per sempre e a fine lavori i conti non tornano piu'.
--    E' anche come lo chiede la legge sui lavori pubblici (Allegato
--    II.14 del D.Lgs. 36/2023): il SAL dice il corrispettivo
--    complessivamente maturato e gli acconti gia' corrisposti.
--
--    Quindi:  questo SAL = maturato di oggi − maturato del SAL prima.
--
-- ⚠️ SECONDA REGOLA, la stessa del computo: I CONTI LI FA IL
--    DATABASE. Il gestionale scrive nelle tabelle e legge dalle
--    viste. Non ricalcola niente per conto suo.
--
-- Il SAL si appoggia al COMPUTO che c'e' gia': le righe sono le voci
-- del computo, con i loro prezzi. Non si riscrive niente.
--
-- Da incollare nell'SQL Editor di Supabase. E' una migrazione sola.
-- ============================================================


-- ---------------------------------------------------------------------
-- 1. IL SAL (la testata)
-- ---------------------------------------------------------------------
create table if not exists public.gest_sal (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id)              on delete cascade,
  computo_id    uuid not null references public.gest_computi(id)     on delete cascade,
  mestiere_id   uuid          references public.gest_mestieri(id)    on delete cascade,
  lavoro_id     uuid          references public.gest_lavori(id)      on delete set null,

  -- 1, 2, 3... dentro lo stesso computo. E' l'ordine che conta:
  -- il "SAL precedente" e' quello col numero subito piu' basso.
  numero        integer not null default 1,

  data          date not null default current_date,
  periodo_dal   date,
  periodo_al    date,

  -- La ritenuta di garanzia: una fetta di ogni acconto che il committente
  -- tiene da parte e ti ridà a fine lavori, a collaudo fatto. Sui lavori
  -- pubblici e' lo 0,50%. Sui privati si mette 0 se non e' stata pattuita.
  ritenuta_perc numeric(6,3) not null default 0.500,

  stato         text not null default 'bozza',   -- bozza | emesso
  note          text,

  eliminato_il  timestamptz,                     -- il cestino, come tutto il resto
  created_at    timestamptz not null default now(),

  constraint gest_sal_stato_ok    check (stato in ('bozza','emesso')),
  constraint gest_sal_numero_ok   check (numero >= 1 and numero <= 999),
  constraint gest_sal_ritenuta_ok check (ritenuta_perc >= 0 and ritenuta_perc <= 100),
  constraint gest_sal_periodo_ok  check (periodo_dal is null or periodo_al is null
                                         or periodo_al >= periodo_dal)
);

-- Due SAL con lo stesso numero sullo stesso computo non possono esistere:
-- sarebbe impossibile dire quale viene prima, e il conto del "precedente"
-- diventerebbe casuale. Quelli nel cestino non contano.
create unique index if not exists gest_sal_numero_unico
  on public.gest_sal (computo_id, numero) where eliminato_il is null;

create index if not exists gest_sal_user_idx
  on public.gest_sal (user_id, mestiere_id);
create index if not exists gest_sal_computo_idx
  on public.gest_sal (computo_id, numero) where eliminato_il is null;
create index if not exists gest_sal_cestino_idx
  on public.gest_sal (user_id, eliminato_il) where eliminato_il is not null;


-- ---------------------------------------------------------------------
-- 2. LE RIGHE (una per voce del computo che hai toccato)
-- ---------------------------------------------------------------------
-- Non serve una riga per ogni voce del computo: solo per quelle su cui
-- hai fatto qualcosa. Le altre valgono zero e non si scrivono.
create table if not exists public.gest_sal_righe (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)                    on delete cascade,
  sal_id      uuid not null references public.gest_sal(id)               on delete cascade,
  voce_id     uuid not null references public.gest_computo_voci(id)      on delete cascade,

  -- QUANTO HAI FATTO FINO A OGGI, dall'inizio del lavoro.
  -- Non "da ultima volta". Vedi la nota in cima al file.
  quantita_eseguita numeric(16,5) not null default 0,

  note        text,
  created_at  timestamptz not null default now(),

  constraint gest_sal_righe_qta_ok check (quantita_eseguita >= 0)
);

-- La stessa voce due volte nello stesso SAL la conterebbe doppia.
create unique index if not exists gest_sal_righe_unica
  on public.gest_sal_righe (sal_id, voce_id);

create index if not exists gest_sal_righe_sal_idx
  on public.gest_sal_righe (sal_id);


-- ---------------------------------------------------------------------
-- 3. I CONTI — UNA FORMULA SOLA, E STA QUI
-- ---------------------------------------------------------------------
-- gest_sal_righe_calc  -> ogni riga con prezzo, importo maturato, e se
--                          hai superato la quantita' del computo
-- gest_sal_totali      -> per ogni SAL: maturato, maturato del SAL
--                          precedente, e quanto vale QUESTO SAL
--
-- Il ribasso e gli oneri della sicurezza NON si applicano qui: li
-- applica compRiepilogoDa() nel gestionale, che e' l'unico posto dove
-- quella formula esiste. Qui si danno i tre numeri che le servono
-- (lordo, sicurezza, manodopera), maturati.

drop view if exists public.gest_sal_totali;
drop view if exists public.gest_sal_righe_calc;

create view public.gest_sal_righe_calc
with (security_invoker = true)
as
select
  r.id,
  r.user_id,
  r.sal_id,
  r.voce_id,
  v.computo_id,
  v.capitolo_id,
  v.ordine,
  v.codice,
  v.descrizione,
  v.unita,
  v.prezzo_unitario,
  v.quantita                                as quantita_computo,
  r.quantita_eseguita,
  (r.quantita_eseguita * v.prezzo_unitario)::numeric(16,2) as importo,
  -- quanto pesa questa riga in percentuale sul previsto (per la schermata)
  (case when v.quantita > 0
        then (r.quantita_eseguita / v.quantita * 100)
        else null end)::numeric(8,2)        as percentuale,
  -- ⚠️ hai contato piu' di quello che c'era nel computo: non e' vietato
  -- (i lavori cambiano), ma la schermata lo deve dire, non nasconderlo.
  (r.quantita_eseguita > v.quantita)        as oltre_computo,
  -- le due quote che servono alle gare pubbliche, in proporzione a
  -- quanto e' stato eseguito
  (case when v.quantita > 0
        then coalesce(v.oneri_sicurezza,0) * (r.quantita_eseguita / v.quantita)
        else 0 end)::numeric(16,2)          as oneri_sicurezza,
  (case when v.quantita > 0
        then (r.quantita_eseguita * v.prezzo_unitario)
             * coalesce(v.incidenza_manodopera,0) / 100
        else 0 end)::numeric(16,2)          as importo_manodopera,
  r.note
from public.gest_sal_righe r
join public.gest_computo_voci_calc v on v.id = r.voce_id;


create view public.gest_sal_totali
with (security_invoker = true)
as
select
  s.id            as sal_id,
  s.user_id,
  s.computo_id,
  s.numero,
  s.ritenuta_perc,
  coalesce(t.righe, 0)                                   as righe,
  coalesce(t.importo, 0)::numeric(16,2)                  as maturato,
  coalesce(t.oneri_sicurezza, 0)::numeric(16,2)          as oneri_sicurezza,
  coalesce(t.importo_manodopera, 0)::numeric(16,2)       as importo_manodopera,
  -- ⚠️ IL SAL PRECEDENTE E' UNO SOLO, NON LA SOMMA DI TUTTI.
  -- Le quantita' sono progressive: il maturato del SAL n.2 comprende
  -- gia' dentro tutto il n.1. Sommarli conterebbe il lavoro due volte.
  coalesce(p.importo, 0)::numeric(16,2)                  as maturato_precedente,
  coalesce(p.oneri_sicurezza, 0)::numeric(16,2)          as oneri_sicurezza_precedenti,
  coalesce(p.importo_manodopera, 0)::numeric(16,2)       as manodopera_precedente,
  p.numero                                               as numero_precedente
from public.gest_sal s
left join lateral (
  select count(*) as righe,
         sum(rc.importo)             as importo,
         sum(rc.oneri_sicurezza)     as oneri_sicurezza,
         sum(rc.importo_manodopera)  as importo_manodopera
    from public.gest_sal_righe_calc rc
   where rc.sal_id = s.id
) t on true
left join lateral (
  -- il SAL col numero piu' alto fra quelli PRIMA di questo, cestino escluso
  select ps.numero,
         (select sum(rc.importo)            from public.gest_sal_righe_calc rc where rc.sal_id = ps.id) as importo,
         (select sum(rc.oneri_sicurezza)    from public.gest_sal_righe_calc rc where rc.sal_id = ps.id) as oneri_sicurezza,
         (select sum(rc.importo_manodopera) from public.gest_sal_righe_calc rc where rc.sal_id = ps.id) as importo_manodopera
    from public.gest_sal ps
   where ps.computo_id = s.computo_id
     and ps.numero < s.numero
     and ps.eliminato_il is null
   order by ps.numero desc
   limit 1
) p on true
where s.eliminato_il is null;


-- ---------------------------------------------------------------------
-- 4. I PERMESSI
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.gest_sal       to authenticated;
grant select, insert, update, delete on public.gest_sal_righe to authenticated;
grant select on public.gest_sal_righe_calc to authenticated;
grant select on public.gest_sal_totali     to authenticated;

alter table public.gest_sal       enable row level security;
alter table public.gest_sal_righe enable row level security;

-- Il SAL e' del titolare, come il computo da cui nasce.
drop policy if exists "gest_sal_own" on public.gest_sal;
create policy "gest_sal_own" on public.gest_sal
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computi c
                 where c.id = computo_id and c.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.gest_computi c
                 where c.id = computo_id and c.user_id = auth.uid())
  );

drop policy if exists "gest_sal_righe_own" on public.gest_sal_righe;
create policy "gest_sal_righe_own" on public.gest_sal_righe
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.gest_sal s
                 where s.id = sal_id and s.user_id = auth.uid())
    -- ⚠️ la voce deve essere di un computo TUO: senza questo controllo si
    -- potrebbe agganciare al proprio SAL una voce del computo di un altro
    -- e leggerne descrizione e prezzo attraverso la vista.
    and exists (select 1 from public.gest_computo_voci v
                 where v.id = voce_id and v.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.gest_sal s
                 where s.id = sal_id and s.user_id = auth.uid())
    and exists (select 1 from public.gest_computo_voci v
                 where v.id = voce_id and v.user_id = auth.uid())
  );


-- ---------------------------------------------------------------------
-- 5. La riga di risultato
-- ---------------------------------------------------------------------
select
  'contabilita lavori (SAL) pronta'                                as esito,
  (select count(*) from public.gest_sal)                           as sal_esistenti,
  (select count(*) from pg_policies where schemaname='public'
      and tablename in ('gest_sal','gest_sal_righe'))              as regole_attive,
  (select count(*) from pg_views where schemaname='public'
      and viewname in ('gest_sal_righe_calc','gest_sal_totali'))   as viste_create,
  (select count(*) from pg_indexes where schemaname='public'
      and indexname in ('gest_sal_numero_unico','gest_sal_righe_unica')) as controlli_doppioni;
