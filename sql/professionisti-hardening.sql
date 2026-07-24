-- ============================================================
-- TrovaImpresa — PROFESSIONISTI — FASE A: HARDENING
-- Luglio 2026
--
-- Da eseguire nell'SQL Editor di Supabase. Idempotente dove possibile.
-- Contiene: indici GIN, backfill prestazioni, normalizzazione comuni,
--           + query di TEST (RLS incarichi/bucket, trigger albo).
-- ============================================================


-- ------------------------------------------------------------
-- A.1 — INDICI GIN su prestazioni e comuni_competenza
-- ------------------------------------------------------------
create index if not exists idx_imprese_prestazioni
  on public.imprese using gin (prestazioni);
create index if not exists idx_imprese_comuni_competenza
  on public.imprese using gin (comuni_competenza);


-- ------------------------------------------------------------
-- A.2 — BACKFILL prestazioni per i professionisti "vecchi"
--       (prestazioni NULL o vuoto).
--
-- PERCHE' QUESTA SOLUZIONE (mappa mestiere -> prestazioni di default):
--   Se lasciassimo prestazioni NULL, il filtro della landing
--   (prestazioni @> {...}) non li troverebbe MAI e sparirebbero dai
--   risultati per prestazione. Metterli a '{}' li rende "innocui" ma
--   comunque invisibili quando si filtra per prestazione.
--   La cosa migliore e' assegnare a ciascuno un set di prestazioni
--   plausibile in base al mestiere gia' dichiarato: cosi' restano
--   visibili con dati sensati, e il professionista potra' affinarli
--   dal pannello. E' un dato "seed", non definitivo.
-- ------------------------------------------------------------
update public.imprese
set prestazioni = case mestiere
  when 'geometra' then array[
    'Accatastamento e pratiche catastali (DOCFA)','Visure e volture catastali',
    'Frazionamenti e tipo mappale (PREGEO)','Rilievi topografici',
    'Pratiche edilizie (CILA, SCIA, permesso di costruire)','Sanatorie e condoni edilizi',
    'Certificato di agibilità','Computo metrico estimativo','Direzione lavori',
    'Successioni immobiliari','APE - Attestato di Prestazione Energetica','Perizie e stime immobiliari']
  when 'architetto' then array[
    'Pratiche edilizie (CILA, SCIA, permesso di costruire)','Progettazione BIM',
    'Direzione lavori','Certificato di agibilità','Sanatorie e condoni edilizi']
  when 'ingegnere_civile' then array[
    'Progettazione strutturale (c.a., acciaio, legno)','Calcolo strutturale e relazioni di calcolo',
    'Direzione lavori strutturali','Collaudo statico','Pratiche sismiche e deposito al Genio Civile',
    'Progettazione impianti (elettrico, termico, idraulico)']
  when 'ingegnere_strutturale' then array[
    'Progettazione strutturale (c.a., acciaio, legno)','Calcolo strutturale e relazioni di calcolo',
    'Collaudo statico','Pratiche sismiche e deposito al Genio Civile','Direzione lavori strutturali',
    'Classificazione sismica e Sismabonus']
  when 'ingegnere_impiantistico' then array[
    'Progettazione impianti (elettrico, termico, idraulico)','Direzione lavori impiantistici',
    'Collaudo e certificazione impianti','Pratiche antincendio (SCIA VVF)']
  when 'perito_industriale' then array[
    'Progettazione impianti elettrici','Progettazione impianti termici e climatizzazione',
    'Dichiarazione di conformità impianti (DM 37/2008)','Progettazione impianto fotovoltaico',
    'Pratiche antincendio','Collaudo e certificazione impianti','Consulenza efficientamento energetico',
    'Direzione lavori impiantistici']
  when 'topografo' then array[
    'Rilievi topografici','Frazionamenti e tipo mappale (PREGEO)',
    'Accatastamento e pratiche catastali (DOCFA)']
  when 'consulente_energetico' then array[
    'APE - Attestato di Prestazione Energetica','Consulenza efficientamento energetico',
    'Classificazione sismica e Sismabonus']
  when 'consulente_sicurezza' then array[
    'Coordinamento sicurezza (CSP/CSE)','Pratiche antincendio (SCIA VVF)']
  when 'direttore_lavori' then array[
    'Direzione lavori','Direzione lavori strutturali','Direzione lavori impiantistici']
  when 'collaudatore_strutture' then array[
    'Collaudo statico','Collaudo e certificazione impianti']
  when 'project_manager' then array[
    'Direzione lavori','Computo metrico estimativo']
  when 'amministratore_condominio' then array[
    'Pratiche edilizie (CILA, SCIA, permesso di costruire)','Computo metrico estimativo']
  else '{}'::text[]
end
where tipo = 'professionista'
  and (prestazioni is null or array_length(prestazioni, 1) is null);


-- ------------------------------------------------------------
-- A.3 — NORMALIZZAZIONE COMUNI (lato scrittura)
--
-- Regola unica (stessa del JS normalizzaComune):
--   minuscolo, senza accenti, apostrofi -> spazio, via punteggiatura,
--   spazi compattati. Applicata SIA in scrittura (qui, sui dati
--   esistenti) SIA nella query (JS, vedi professionisti.html).
--
-- Backfill: normalizza i comuni_competenza gia' salvati, cosi' i dati
-- vecchi combaciano con quelli nuovi scritti normalizzati dal frontend.
-- ------------------------------------------------------------
update public.imprese
set comuni_competenza = (
  select array_agg(distinct v) from (
    select trim(regexp_replace(
             regexp_replace(
               lower(translate(c,
                 'àáâäãèéêëìíîïòóôöõùúûüçñ''`’',
                 'aaaaaeeeeiiiiooooouuuucn   ')),
               '[^a-z0-9 -]', '', 'g'),
             '\s+', ' ', 'g')) as v
    from unnest(comuni_competenza) as c
    where c is not null and trim(c) <> ''
  ) t
  where v <> ''
)
where tipo = 'professionista'
  and comuni_competenza is not null
  and array_length(comuni_competenza, 1) is not null;


-- ============================================================
-- TEST DA ESEGUIRE (sostituisci gli <UUID> con user_id reali).
-- Per trovarli: select id, nome, user_id, tipo from public.imprese
--               where tipo='professionista' limit 5;
-- ============================================================

-- ------------------------------------------------------------
-- A.4 — TEST RLS: un professionista vede SOLO i propri incarichi
--
-- 1) COME PROFESSIONISTA PROPRIETARIO (deve vedere le SUE righe):
-- ------------------------------------------------------------
-- begin;
--   select set_config('request.jwt.claims',
--     json_build_object('sub','<UUID_PROF_A>','role','authenticated')::text, true);
--   set local role authenticated;
--   -- Deve restituire SOLO gli incarichi indirizzati alle imprese di A:
--   select id, professionista_id, nome from public.incarichi_richieste;
-- rollback;

-- 2) COME ALTRO PROFESSIONISTA (NON deve vedere quelli di A):
-- begin;
--   select set_config('request.jwt.claims',
--     json_build_object('sub','<UUID_PROF_B>','role','authenticated')::text, true);
--   set local role authenticated;
--   -- Deve restituire 0 righe che appartengono ad A:
--   select count(*) from public.incarichi_richieste
--   where professionista_id in (select id from public.imprese where user_id = '<UUID_PROF_A>');
-- rollback;

-- 3) COME ANONIMO (non loggato) — NON deve vedere nulla in lettura:
-- begin;
--   select set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
--   set local role anon;
--   select count(*) from public.incarichi_richieste;   -- atteso: 0
-- rollback;

-- ------------------------------------------------------------
-- A.4bis — TEST RLS BUCKET documenti-incarichi
--   Solo il professionista destinatario (prima cartella del path =
--   suo id impresa) puo' leggere i file.
-- ------------------------------------------------------------
-- begin;
--   select set_config('request.jwt.claims',
--     json_build_object('sub','<UUID_PROF_A>','role','authenticated')::text, true);
--   set local role authenticated;
--   -- Deve mostrare SOLO gli oggetti nelle cartelle <id_impresa_di_A>/...
--   select name from storage.objects where bucket_id = 'documenti-incarichi';
-- rollback;
--
-- begin;
--   select set_config('request.jwt.claims',
--     json_build_object('sub','<UUID_PROF_B>','role','authenticated')::text, true);
--   set local role authenticated;
--   -- Atteso: 0 file appartenenti alle cartelle di A.
--   select count(*) from storage.objects where bucket_id = 'documenti-incarichi';
-- rollback;

-- ------------------------------------------------------------
-- A.5 — TEST TRIGGER albo_verificato (deve FALLIRE da non-admin)
--   Un professionista autenticato NON deve poter mettere
--   albo_verificato = true sulla propria riga: il trigger
--   blocca_autoverifica_albo riporta il valore a quello vecchio.
-- ------------------------------------------------------------
-- begin;
--   select set_config('request.jwt.claims',
--     json_build_object('sub','<UUID_PROF_A>','role','authenticated')::text, true);
--   set local role authenticated;
--   update public.imprese set albo_verificato = true
--     where user_id = '<UUID_PROF_A>';
--   -- Deve restare false (la modifica viene ignorata dal trigger):
--   select albo_verificato from public.imprese where user_id = '<UUID_PROF_A>';
-- rollback;
--
-- Come admin (service_role / SQL editor) invece funziona:
-- update public.imprese set albo_verificato = true where id = <ID_IMPRESA>;
