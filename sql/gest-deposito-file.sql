-- =====================================================================
-- LE REGOLE DEL DEPOSITO DEI FILE — 19 agosto 2026
-- Bucket «gestionale-foto» e «gestionale-video».
--
-- COSA SISTEMA, in parole semplici.
-- Il deposito che si chiama «foto» non ha dentro solo le foto. Guardando
-- come l'app costruisce i percorsi, li' dentro finiscono cinque cose:
--
--     <impresa>/<lavoro>/…            le foto e i video di cantiere
--     <impresa>/fatture/<id>/…        i PDF delle fatture
--     <impresa>/clienti/<id>/…        i documenti dei clienti
--     <impresa>/fornitori/<id>/…      i documenti dei fornitori
--     <impresa>/commercialista/…      i documenti del commercialista
--
-- E la regola era una sola per tutti: gest_puo_accedere, cioe' «sei un
-- collaboratore attivo». Nessuna spunta. Quindi QUALSIASI persona della
-- squadra — anche una con tutte le spunte tolte — poteva SCARICARE le
-- fatture e i documenti del commercialista, e CANCELLARLI.
--
-- Sulle tabelle gest_foto e gest_video la spunta c'e' dal 13 agosto.
-- Nel deposito no: e chi passava dal deposito scavalcava la tabella.
--
-- COSA CAMBIA
--   · cancellare dal deposito: SOLO IL TITOLARE.
--     Non e' una restrizione inventata. Sulle tabelle solo foto_owner e
--     video_owner cancellano (i collaboratori non hanno nessuna regola di
--     cancellazione), e gestionale-operatore.html dal deposito non cancella
--     mai: carica e basta. Controllato riga per riga.
--   · fornitori e commercialista: solo il titolare, anche in lettura.
--     Nell'app dell'operaio quelle due sezioni non esistono nemmeno.
--   · fatture -> spunta «fatture» · clienti -> spunta «clienti»
--   · cartella di un lavoro -> spunta «foto» oppure «lavori» (leggere),
--     «foto» oppure «fatture» (caricare) — vedi l'avviso qui sotto.
--
-- ⚠️ LA CARTELLA DI UN LAVORO NON HA SOLO FOTO.
--    gestionale-operatore.html carica i PDF delle fatture DENTRO la
--    cartella del lavoro (MIO.impresaId+"/"+lavoro+"/…"), non dentro
--    «fatture/». Se qui si chiedesse solo la spunta «foto», una persona
--    con Fatture ✔ e Foto ✘ non riuscirebbe piu' a caricare una fattura
--    dal telefono, e il file resterebbe orfano. E' la stessa trappola
--    chiusa il 13 agosto sulle tabelle, dall'altro verso.
--
-- ⚠️ IL PERCORSO STORTO.
--    Le regole di prima facevano ((storage.foldername(name))[1])::uuid a
--    occhi chiusi. Basta UN file il cui percorso non comincia con un uuid
--    e la lettura di TUTTO il deposito va in errore — non «salta quel
--    file»: fallisce la Galleria intera. Adesso il pezzo che non e' un
--    uuid diventa «nessuna impresa», cioe' un NO, senza errori.
--
-- COME E' STATO PROVATO
--    Su un PostgreSQL 16 vero, con gest_puo_accedere, gest_puo_sezione e
--    storage.foldername copiate VERBATIM dal database di produzione.
--    308 prove (11 persone × 9 file × 3 azioni, piu' l'elenco del
--    deposito), tutte verdi. 10 sabotaggi su 10 presi.
--
-- SE TI RISPONDE «must be owner of table objects»: fermati e dimmelo,
-- te lo rifaccio in un altro modo. Non forzare niente.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. DA UN PERCORSO SI CAPISCE DI CHI E' E CHE COS'E'
-- ---------------------------------------------------------------------

-- di chi e' il file. Se il primo pezzo del percorso non e' un uuid non si
-- fa nessuna conversione: si risponde «nessuna impresa» e quindi NO.
create or replace function public.gest_file_impresa(_path text)
returns uuid
language sql
immutable
set search_path to 'public','storage','pg_catalog'
as $function$
  select case when (storage.foldername(_path))[1] ~*
              '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then ((storage.foldername(_path))[1])::uuid end;
$function$;

-- che cos'e' quel file. La seconda cartella lo dice: sono i nomi che
-- scrive l'app. Tutto il resto e' l'id di un lavoro, cioe' cantiere.
create or replace function public.gest_file_reparto(_path text)
returns text
language sql
immutable
set search_path to 'public','storage','pg_catalog'
as $function$
  select case coalesce((storage.foldername(_path))[2],'')
           when 'fatture'        then 'fatture'
           when 'clienti'        then 'clienti'
           when 'fornitori'      then 'fornitori'
           when 'commercialista' then 'commercialista'
           else 'lavoro' end;
$function$;


-- ---------------------------------------------------------------------
-- 2. LA DECISIONE, IN UN POSTO SOLO
--    Sei regole che ripetono la stessa condizione si disallineano: e'
--    gia' successo (la lezione di compRiepilogoDa, «una formula sola in
--    tre posti»). Qui la regola sta qui dentro e basta.
-- ---------------------------------------------------------------------
create or replace function public.gest_puo_file(_bucket text, _path text, _azione text)
returns boolean
language sql
stable
security definer
set search_path to 'public','storage','pg_catalog'
as $function$
  select case
    -- percorso storto: NO, e senza andare in errore
    when gest_file_impresa(_path) is null then false
    -- il titolare passa sempre, su tutto
    when gest_file_impresa(_path) = auth.uid() then true

    when _bucket = 'gestionale-video' then
      case _azione
        when 'legge'  then gest_puo_sezione(gest_file_impresa(_path),'foto')
                        or gest_puo_sezione(gest_file_impresa(_path),'lavori')
        when 'carica' then gest_puo_sezione(gest_file_impresa(_path),'foto')
        else false                    -- cancellare dal deposito: solo il titolare
      end

    when _bucket = 'gestionale-foto' then
      case gest_file_reparto(_path)
        -- nell'app dell'operaio queste due sezioni non esistono nemmeno
        when 'commercialista' then false
        when 'fornitori'      then false
        when 'fatture' then (_azione in ('legge','carica')
                             and gest_puo_sezione(gest_file_impresa(_path),'fatture'))
        when 'clienti' then (_azione in ('legge','carica')
                             and gest_puo_sezione(gest_file_impresa(_path),'clienti'))
        else
          -- la cartella di un lavoro: foto di cantiere E fatture caricate
          -- dall'operaio dal telefono (vedi l'avviso in testa al file)
          case _azione
            when 'legge'  then gest_puo_sezione(gest_file_impresa(_path),'foto')
                            or gest_puo_sezione(gest_file_impresa(_path),'lavori')
                            or gest_puo_sezione(gest_file_impresa(_path),'fatture')
            when 'carica' then gest_puo_sezione(gest_file_impresa(_path),'foto')
                            or gest_puo_sezione(gest_file_impresa(_path),'fatture')
            else false
          end
      end
    else false
  end;
$function$;


-- ---------------------------------------------------------------------
-- 3. LE REGOLE DEL DEPOSITO
--    ⚠️ «foto_lavoro_select_own» e «foto_team_select» dicevano la stessa
--       identica cosa: due regole di lettura sovrapposte, e la piu' larga
--       vince sempre. Ne resta UNA.
--    ⚠️ Le tre regole dei video erano «to public», cioe' valutate anche
--       per chi non ha nessun account. Non era un buco (senza account
--       auth.uid() e' vuoto e la risposta e' no lo stesso), ma «to
--       authenticated» dice quello che intende davvero.
-- ---------------------------------------------------------------------
drop policy if exists "foto_lavoro_select_own" on storage.objects;
drop policy if exists "foto_team_select"       on storage.objects;
drop policy if exists "foto_team_insert"       on storage.objects;
drop policy if exists "foto_team_delete"       on storage.objects;
drop policy if exists "video_team_select"      on storage.objects;
drop policy if exists "video_team_insert"      on storage.objects;
drop policy if exists "video_team_delete"      on storage.objects;

create policy "foto_team_select" on storage.objects for select to authenticated
  using (bucket_id = 'gestionale-foto'
         and public.gest_puo_file('gestionale-foto', name, 'legge'));

create policy "foto_team_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'gestionale-foto'
         and public.gest_puo_file('gestionale-foto', name, 'carica'));

create policy "foto_team_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'gestionale-foto'
         and public.gest_puo_file('gestionale-foto', name, 'cancella'));

create policy "video_team_select" on storage.objects for select to authenticated
  using (bucket_id = 'gestionale-video'
         and public.gest_puo_file('gestionale-video', name, 'legge'));

create policy "video_team_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'gestionale-video'
         and public.gest_puo_file('gestionale-video', name, 'carica'));

create policy "video_team_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'gestionale-video'
         and public.gest_puo_file('gestionale-video', name, 'cancella'));


-- ---------------------------------------------------------------------
-- 4. COSA E' STATO FATTO — riga di risultato, non un messaggio
-- ---------------------------------------------------------------------
select
  (select count(*) from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname in ('foto_team_select','foto_team_insert','foto_team_delete',
                         'video_team_select','video_team_insert','video_team_delete'))
    as regole_nuove_in_piedi,
  (select count(*) from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname = 'foto_lavoro_select_own')
    as doppione_rimasto,
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('gest_file_impresa','gest_file_reparto','gest_puo_file'))
    as funzioni_nuove,
  'sei regole nuove, zero doppioni, tre funzioni: e a posto' as come_deve_essere;


-- =====================================================================
-- COME SI TORNA INDIETRO
-- Se dopo questo file qualcosa non funziona piu' e serve rimettere le
-- cose com'erano SUBITO, incolla solo il blocco qui sotto togliendo i
-- due trattini davanti a ogni riga.
-- ⚠️ Rimette anche il buco: usalo per tirare avanti la giornata, non
--    per lasciarlo li'.
-- =====================================================================
-- drop policy if exists "foto_team_select"  on storage.objects;
-- drop policy if exists "foto_team_insert"  on storage.objects;
-- drop policy if exists "foto_team_delete"  on storage.objects;
-- drop policy if exists "video_team_select" on storage.objects;
-- drop policy if exists "video_team_insert" on storage.objects;
-- drop policy if exists "video_team_delete" on storage.objects;
-- create policy "foto_lavoro_select_own" on storage.objects for select to authenticated
--   using ((bucket_id = 'gestionale-foto') and gest_puo_accedere(((storage.foldername(name))[1])::uuid));
-- create policy "foto_team_select" on storage.objects for select to authenticated
--   using ((bucket_id = 'gestionale-foto') and gest_puo_accedere(((storage.foldername(name))[1])::uuid));
-- create policy "foto_team_insert" on storage.objects for insert to authenticated
--   with check ((bucket_id = 'gestionale-foto') and gest_puo_accedere(((storage.foldername(name))[1])::uuid));
-- create policy "foto_team_delete" on storage.objects for delete to authenticated
--   using ((bucket_id = 'gestionale-foto') and gest_puo_accedere(((storage.foldername(name))[1])::uuid));
-- create policy "video_team_select" on storage.objects for select to public
--   using ((bucket_id = 'gestionale-video') and gest_puo_accedere(((storage.foldername(name))[1])::uuid));
-- create policy "video_team_insert" on storage.objects for insert to public
--   with check ((bucket_id = 'gestionale-video') and gest_puo_accedere(((storage.foldername(name))[1])::uuid));
-- create policy "video_team_delete" on storage.objects for delete to public
--   using ((bucket_id = 'gestionale-video') and gest_puo_accedere(((storage.foldername(name))[1])::uuid));


-- =====================================================================
-- RESTA APERTO, e non e' in questo file
--   · «documenti-incarichi»: la regola docinc_insert_any lascia caricare
--     file a CHIUNQUE, anche senza account (serve — un cliente che manda
--     un incarico non ha un account) ma senza nessun limite di cartella,
--     di misura e di tipo. Il limite di 10 MB sta solo dentro la pagina,
--     e una pagina si aggira. Da chiudere in una tornata sua.
--   · «cv-candidati/registrazioni»: stessa famiglia, stesso discorso.
-- =====================================================================
