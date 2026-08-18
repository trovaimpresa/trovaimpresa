-- =====================================================================
-- 18 agosto 2026 — I CONTATTI DEL CLIENTE SI DANNO SOLO A CHI LI CHIEDE
--
-- Prima: la richiesta del cliente partiva subito verso 5 imprese con
-- dentro nome, telefono ed email in chiaro. Le imprese non avevano
-- chiesto niente: se lo trovavano in casella.
--
-- Adesso: l'impresa riceve la richiesta SENZA i contatti (zona,
-- categoria, cosa cerca) e un pulsante «Voglio contattarlo». I contatti
-- compaiono solo a chi clicca, e resta scritto chi e quando.
--
-- ⚠️ COSA HO TROVATO PREPARANDO QUESTO FILE
-- La tabella `richieste_inviate` NON ESISTE. Il codice ci scriveva
-- dentro da sempre, ma PostgREST non lancia: risponde {error} e basta,
-- e quella riga non veniva mai controllata. Conseguenze, tutte in
-- silenzio:
--   · non c'era nessuna traccia di chi avesse ricevuto cosa;
--   · il tetto di 3 email al giorno per impresa non ha MAI funzionato,
--     perche' la lettura falliva e il conteggio restava vuoto.
-- Questo file la crea davvero.
--
-- Si puo' rilanciare quante volte si vuole: non rompe niente.
-- =====================================================================

create table if not exists public.richieste_inviate (
  id                bigserial primary key,
  richiesta_id      bigint,
  impresa_id        bigint,
  created_at        timestamptz not null default now()
);

-- ⚠️ `impresa_id` e' un NUMERO, non un uuid: su TrovaImpresa `imprese.id`
--    e' bigint (67, 68, 69). Il 14 agosto una colonna uuid al posto di un
--    numero aveva fatto fallire una scrittura IN SILENZIO.
-- ⚠️ Niente chiave esterna verso `imprese`: se un'impresa si cancella,
--    la riga di registro deve restare (dice che quell'email era partita).

alter table public.richieste_inviate
  add column if not exists token             text,
  add column if not exists email_inviata_a   text,
  add column if not exists contatto_visto_at timestamptz;

comment on column public.richieste_inviate.token is
  'Il codice segreto dentro il link "Voglio contattarlo". Uno per ogni coppia richiesta+impresa: non si passa a nessun altro.';
comment on column public.richieste_inviate.contatto_visto_at is
  'Quando quell''impresa ha chiesto e ricevuto i contatti del cliente. Vuoto = non li ha mai visti.';

-- Il token e' l'unica chiave del link: due righe con lo stesso token
-- vorrebbero dire due imprese che aprono la stessa porta.
--
-- ⚠️ L'indice e' INTERO, non parziale, ed e' una scelta: in PostgreSQL un
--    indice unico lascia passare quanti NULL vuoi anche senza scrivere
--    `where token is not null`, quindi la parte "parziale" non serviva a
--    niente — e in cambio rompeva `on conflict (token)`, che un indice
--    parziale non lo accetta come arbitro. E' la stessa trappola che il 9
--    agosto aveva bloccato il salvataggio delle note del calendario.
--    La prima versione di questo file, del 18 agosto mattina, ce l'aveva:
--    se l'hai gia' lanciata, la riga qui sotto la toglie da sola.
drop index if exists public.richieste_inviate_token_uniq;
create unique index if not exists richieste_inviate_token_key
  on public.richieste_inviate (token);

create index if not exists richieste_inviate_giorno_idx
  on public.richieste_inviate (impresa_id, created_at);
create index if not exists richieste_inviate_richiesta_idx
  on public.richieste_inviate (richiesta_id);

-- ⚠️ Qui dentro ci sono i collegamenti ai contatti dei clienti: la legge
--    e' "non la legge nessuno tranne il server". RLS accesa e NESSUNA
--    policy = nessuno passa. Il `revoke` toglie anche il permesso, cosi'
--    non basta che un domani qualcuno scriva una policy per sbaglio.
alter table public.richieste_inviate enable row level security;
revoke all on public.richieste_inviate from anon, authenticated;
revoke all on sequence public.richieste_inviate_id_seq from anon, authenticated;

-- ⚠️ IL PERMESSO AL SERVER SI DA' A MANO, NON SI DA' PER SCONTATO.
--    Il 15 agosto sono stati stretti i permessi su 94 tabelle e anche
--    quelli automatici sulle tabelle NUOVE (`alter default privileges`).
--    Se il server non avesse il permesso qui, la funzione Netlify
--    scriverebbe a vuoto: PostgREST non lancia, risponde {error} — ed e'
--    esattamente il modo in cui questa tabella e' rimasta finta per
--    settimane senza che se ne accorgesse nessuno.
grant all on public.richieste_inviate to service_role;
grant usage, select on sequence public.richieste_inviate_id_seq to service_role;

-- La riga di risposta (l'SQL Editor i "notice" non li fa vedere).
select 'FATTO'                                                        as esito,
       (select count(*) from public.richieste_inviate)                as righe_registrate,
       (select count(*) from public.richieste_inviate
         where contatto_visto_at is not null)                         as contatti_gia_chiesti,
       (select count(*) from pg_policies
         where schemaname = 'public' and tablename = 'richieste_inviate') as policy_aperte,
       (select count(*) from information_schema.column_privileges
         where table_schema = 'public' and table_name = 'richieste_inviate'
           and grantee in ('anon', 'authenticated'))                  as permessi_al_pubblico,
       case when has_table_privilege('service_role', 'public.richieste_inviate', 'insert')
            then 'si' else 'NO — QUALCOSA NON VA' end                 as il_server_puo_scrivere;
