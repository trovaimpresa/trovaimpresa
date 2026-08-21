-- ============================================================
-- TrovaImpresa — IL BANCO DI CONSEGNA DEI PREVENTIVI AI
-- 21 agosto 2026 (notte)
--
-- A COSA SERVE
-- Il preventivo AI dei pannelli andava in timeout (504) sui lavori
-- grossi: Netlify taglia una function normale a 26 secondi, e il modello
-- su una "ristrutturazione chiavi in mano" ci mette il doppio.
-- Da adesso il lavoro lo fa una function IN BACKGROUND (fino a 15
-- minuti), che non risponde al browser: deposita il preventivo qui, e il
-- pannello ripassa a ritirarlo ogni due secondi.
--
-- COSA C'E' DENTRO
-- Una riga per ogni preventivo chiesto: chi l'ha chiesto, se e' ancora in
-- corso, e il testo quando e' pronto. Niente dati di clienti: solo il
-- testo che l'AI ha scritto per l'impresa che l'ha chiesto.
--
-- ⚠️ IL LUCCHETTO: ognuno vede SOLO i suoi. La riga si lega all'impresa,
--    e l'impresa all'account (imprese.user_id = auth.uid()). Dal browser
--    non si puo' scrivere niente: scrive solo il server col service_role.
--
-- ⚠️ LE RIGHE VECCHIE SI CANCELLANO DA SOLE dopo 7 giorni: le pulisce la
--    function a ogni preventivo nuovo. Qui non serve nessun mestiere.
--
-- Si esegue nell'SQL Editor di Supabase. Si puo' rilanciare quante volte
-- si vuole: la tabella si crea SOLO se non c'e' gia', e niente viene mai
-- cancellato o ricreato. In fondo risponde con una riga che dice com'e'
-- andata.
-- ============================================================

create table if not exists public.ai_lavori (
  id          uuid primary key,                 -- lo sceglie il browser, e il server rifiuta i doppioni
  -- ⚠️ imprese.id e' un NUMERO (bigint), non un uuid come nelle altre
  --    tabelle: scritto uuid, il file non parte proprio («incompatible
  --    types: uuid and bigint»). Preso il 21 agosto sul database vero.
  impresa_id  bigint not null references public.imprese(id) on delete cascade,
  azione      text not null default 'preventivo',
  stato       text not null default 'in_corso'
              check (stato in ('in_corso','finito','errore')),
  risposta    text,
  errore      text,
  creato_il   timestamptz not null default now(),
  finito_il   timestamptz
);

create index if not exists ai_lavori_impresa_idx
    on public.ai_lavori (impresa_id, creato_il desc);

-- serve alla pulizia delle righe vecchie
create index if not exists ai_lavori_creato_idx
    on public.ai_lavori (creato_il);


-- ------------------------------------------------------------
-- IL LUCCHETTO
-- Si legge soltanto, e soltanto la propria roba. Scrivere, modificare e
-- cancellare non e' concesso a nessuno dal browser: nessuna policy lo
-- prevede, e il server passa da un'altra porta (service_role).
-- ------------------------------------------------------------
alter table public.ai_lavori enable row level security;

revoke all on public.ai_lavori from anon, authenticated;
grant select on public.ai_lavori to authenticated;

drop policy if exists ai_lavori_solo_i_miei on public.ai_lavori;
create policy ai_lavori_solo_i_miei
  on public.ai_lavori
  for select
  to authenticated
  using (
    impresa_id in (select i.id from public.imprese i where i.user_id = auth.uid())
  );


-- ------------------------------------------------------------
-- LA RIGA DI RISULTATO
-- ------------------------------------------------------------
select 'banco preventivi pronto'
    || '  ·  righe adesso: '
    || (select count(*)::text from public.ai_lavori)
    || '  ·  lucchetto acceso: '
    || case when (select c.relrowsecurity from pg_class c
                   join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'ai_lavori')
            then 'si' else 'NO — QUALCOSA E ANDATO STORTO' end
    || '  ·  senza account non si legge: '
    || case when not has_table_privilege('anon','public.ai_lavori','select')
            then 'giusto' else 'NO — QUALCOSA E ANDATO STORTO' end
    || '  ·  dal browser non si scrive: '
    || case when not has_table_privilege('authenticated','public.ai_lavori','insert')
             and not has_table_privilege('authenticated','public.ai_lavori','update')
             and not has_table_privilege('authenticated','public.ai_lavori','delete')
            then 'giusto' else 'NO — QUALCOSA E ANDATO STORTO' end
    || '  ·  la regola c e: '
    || case when exists (select 1 from pg_policies
                          where schemaname = 'public' and tablename = 'ai_lavori'
                            and policyname = 'ai_lavori_solo_i_miei')
            then 'si' else 'NO — QUALCOSA E ANDATO STORTO' end
       as risultato;
