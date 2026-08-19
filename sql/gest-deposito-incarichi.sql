-- =====================================================================
-- IL DEPOSITO DEGLI INCARICHI — 19 agosto 2026
-- Bucket «documenti-incarichi».
--
-- COSA SISTEMA, in parole semplici.
-- Quando un cliente manda un incarico a un professionista, allega i suoi
-- documenti (planimetrie, visure, un DWG). Quel cliente NON ha un account
-- e non deve averlo: quindi il caricamento senza login deve restare.
--
-- Il problema era un altro. La regola diceva una cosa sola:
--     «il file va nel deposito documenti-incarichi»
-- e basta. Nessun controllo su DOVE, su QUANTO GRANDE, su cosa.
-- Risultato: chiunque, dal mondo, con la chiave pubblica che sta dentro
-- la pagina (e ci deve stare), poteva caricare file in cartelle che non
-- esistono nemmeno, grandi quanto voleva. Non e' un dato che esce: e' un
-- deposito che ti riempiono, e la banda la paghi tu.
--
-- COSA CAMBIA
--   1. Si puo' caricare SOLO dentro la cartella di un professionista che
--      esiste davvero. La cartella e' l'id del professionista, ed e' gia'
--      cosi' che la scrive la pagina (professionisti.html e
--      profilo-impresa.html: `${prof.id}/…`).
--   2. Il limite di 10 MB passa DAL DATABASE, non dalla pagina. Finora i
--      10 MB erano scritti solo dentro profilo-impresa.html, cioe' in un
--      posto che chiunque puo' aggirare.
--
-- ⚠️ PERCHE' NON METTO UN ELENCO DI TIPI DI FILE.
--    La pagina accetta .pdf .jpg .jpeg .png .dwg .doc .docx, e li carica
--    con `contentType: f.type || 'application/octet-stream'`. Un .dwg il
--    browser non sa cos'e' e lo manda come «octet-stream». Se mettessi un
--    elenco di tipi permessi dovrei per forza infilarci «octet-stream»,
--    che vuol dire QUALUNQUE FILE: il controllo sembrerebbe esserci e non
--    servirebbe a niente. Meglio dire che non c'e'. Il freno vero, qui,
--    e' la misura.
--
-- ⚠️ QUELLO CHE QUESTO FILE NON PUO' FARE.
--    Chi vuole, puo' ancora caricare tanti file da 10 MB dentro la
--    cartella di un professionista vero. Contro quello non c'e' una
--    regola del database: ci vuole un conteggio (quante richieste da uno
--    stesso indirizzo in un'ora), e quello e' un lavoro a parte.
--    Detto invece che nascosto.
--
-- COME E' STATO PROVATO
--    Su un PostgreSQL 16 vero, con storage.foldername copiata VERBATIM da
--    Supabase e la regola di lettura copiata verbatim da pg_policies.
--    ⚠️ Chi non ha fatto il login e' provato come RUOLO «anon», non come
--       «authenticated con l'uid vuoto»: sono due cose diverse, e provare
--       la seconda avrebbe provato la cosa sbagliata.
--
-- SE TI RISPONDE «must be owner of table objects»: fermati e dimmelo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. SI CARICA SOLO NELLA CARTELLA DI UN PROFESSIONISTA CHE ESISTE
--    Il nome vecchio, «docinc_insert_any», diceva la verita': andava
--    bene qualunque cosa. Il nome nuovo dice quello che fa adesso.
-- ---------------------------------------------------------------------
drop policy if exists "docinc_insert_any"          on storage.objects;
drop policy if exists "docinc_insert_professionista" on storage.objects;

create policy "docinc_insert_professionista" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'documenti-incarichi'
    and exists (
      select 1 from public.imprese im
       where (im.id)::text = (storage.foldername(name))[1]
    ));


-- ---------------------------------------------------------------------
-- 2. I 10 MB LI DICE IL DATABASE, NON LA PAGINA
--    10485760 = 10 × 1024 × 1024, gli stessi 10 MB che profilo-impresa.html
--    promette all'utente. I tipi di file restano liberi, e il perche' sta
--    scritto in testa al file.
-- ---------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 10485760
 where id = 'documenti-incarichi';


-- ---------------------------------------------------------------------
-- 3. COSA E' STATO FATTO — riga di risultato, non un messaggio
-- ---------------------------------------------------------------------
select
  (select count(*) from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='docinc_insert_any')            as regola_aperta_rimasta,
  (select count(*) from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='docinc_insert_professionista') as regola_nuova_in_piedi,
  (select file_size_limit from storage.buckets
    where id='documenti-incarichi')                  as limite_in_byte,
  'zero, uno, 10485760: e a posto'                   as come_deve_essere;


-- =====================================================================
-- COME SI TORNA INDIETRO
-- Se dopo questo file un cliente non riesce piu' a mandare i documenti,
-- incolla solo il blocco qui sotto togliendo i due trattini.
-- ⚠️ Rimette anche il buco: serve per tirare avanti la giornata, non per
--    lasciarlo li'.
-- =====================================================================
-- drop policy if exists "docinc_insert_professionista" on storage.objects;
-- create policy "docinc_insert_any" on storage.objects for insert to anon, authenticated
--   with check (bucket_id = 'documenti-incarichi'::text);
-- update storage.buckets set file_size_limit = null where id = 'documenti-incarichi';


-- =====================================================================
-- RESTA APERTO, e non e' in questo file
--   · «cv-candidati/registrazioni»: stessa famiglia. Li' la cartella e'
--     gia' bloccata («registrazioni»), quindi il buco del «dove» non c'e';
--     manca solo il limite di misura. Da guardare quando si passa di li'.
--   · il conteggio delle richieste per fermare chi insiste: lavoro a parte.
-- =====================================================================
