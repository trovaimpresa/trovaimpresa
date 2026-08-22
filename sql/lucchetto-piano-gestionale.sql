-- ============================================================
-- TrovaImpresa — IL LUCCHETTO DEL PIANO DENTRO IL DATABASE
-- 22 agosto 2026
--
-- IL BUCO
-- Il gestionale si apre solo a chi ha il Premium, ma quel controllo sta
-- nella PAGINA (haPremium() in gestionale-app.html). Le regole del database
-- guardano una cosa sola: «questa riga e' tua?». Del piano non sanno niente.
-- Controllato sul database vero il 22 agosto: regole che nominano il piano,
-- ZERO. Quindi un account gratis che non passa dalla pagina, ma parla
-- direttamente con l'API di Supabase, legge e scrive TUTTE le tabelle
-- gest_*: lavori, clienti, preventivi, fatture, computi. Non gli serve
-- nessun trucco: gli basta la chiave pubblica, che sta scritta dentro la
-- pagina come in tutti i siti.
--
-- LA CHIUSURA
-- Un guardiano solo, sempre lo stesso, messo PRIMA di ogni scrittura su
-- tutte le tabelle del gestionale. Chiama UNA funzione — gest_piano_ok() —
-- che risponde «ha il Premium?». Se un domani il piano cambia, si cambia li'
-- dentro e cambia dappertutto: non ci sono trenta copie della condizione.
--
-- COSA SUCCEDE A CHI SCADE (deciso da Alessio il 22 agosto)
--   LEGGE ed ESPORTA tutto quello che ha, come prima. Non perde una riga.
--   NON puo' creare, modificare o cancellare finche' non rinnova.
--   Appena rinnova torna tutto com'era, nello stesso istante.
-- Il motivo: chi si dimentica di pagare per due giorni non deve trovarsi
-- chiuso fuori dai propri lavori.
--
-- I COLLABORATORI
-- Passano dal piano del TITOLARE, non dal loro: un operaio non ha un piano
-- suo. Viene da se': le righe che scrive (ore, rapportini, spese) portano
-- gia' il user_id del titolare, e gest_membri usa impresa_id, che e' l'uid
-- del titolare. Il guardiano guarda quella colonna li'.
--
-- CHI PASSA LO STESSO (identico al guardiano di "imprese")
--   1. le funzioni del server (service_role): Stripe, i controlli notturni;
--   2. l'SQL Editor (ruolo postgres): questa finestra qui;
--   3. l'account del fondatore.
--
-- TRE TABELLE RESTANO FUORI, apposta. Non sono dati di lavoro, sono porte
-- di servizio, e chiuderle farebbe danno:
--   · gest_accessi     — il registro di chi apre il gestionale. Deve poter
--                        scrivere anche la riga «ha trovato il paywall»:
--                        e' proprio quella che serve a te per sapere chi
--                        bussa e non entra.
--   · gest_interessati — «avvisami quando e' pronto»: per definizione la
--                        scrive chi NON paga.
--   · gest_richieste   — «chiedi una funzione»: i messaggi ad Alessio. Uno
--                        scaduto deve poter scrivere per chiedere aiuto.
--
-- ⚠️ QUANDO NASCE UNA TABELLA gest_ NUOVA, SI RILANCIA QUESTO FILE.
--    Il guardiano si mette da solo su tutte le gest_* che trova al momento
--    in cui lo esegui. Su quelle nate dopo non c'e'. La riga di risultato in
--    fondo dice sempre su quante sta e quante ne mancano.
--
-- Si esegue nell'SQL Editor di Supabase. Si puo' rilanciare quante volte si
-- vuole. In fondo risponde con una riga che dice com'e' andata.
-- ============================================================


-- ------------------------------------------------------------
-- 1. LA FUNZIONE SOLA — «ha il Premium?»
--    Le stesse tre condizioni di haPremium() in gestionale-app.html:
--    piano scritto 'premium' (senza guardare maiuscole e spazi), e se c'e'
--    una scadenza non deve essere passata. Niente scadenza = non scade.
-- ------------------------------------------------------------
create or replace function public.gest_piano_ok(_titolare uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $funzione$
  select exists (
    select 1
      from public.imprese i
     where i.user_id = _titolare
       and lower(btrim(coalesce(i.piano, ''))) = 'premium'
       and (i.premium_scadenza is null or i.premium_scadenza >= now())
  );
$funzione$;

comment on function public.gest_piano_ok(uuid) is
  'Vero se quell''account ha il Piano Premium attivo. E'' l''UNICO posto dove sta scritto cosa vuol dire "attivo": tutti i lucchetti del gestionale chiamano questa.';

-- ⚠️ "security definer" qui sopra non e' un di piu': serve perche' questa
--    funzione la puo' chiamare anche l'app dell'operaio, che le regole di
--    "imprese" NON lasciano leggere la riga del titolare. Senza, a un
--    collaboratore risponderebbe sempre "no". A "anon" non si concede:
--    chi non ha fatto l'accesso non deve poter chiedere al database chi paga.
-- ⚠️ La riga "revoke" serve davvero: Postgres regala il permesso di eseguire
--    a TUTTI appena una funzione nasce. Senza toglierlo, "grant" a
--    authenticated non cambia niente e anche anon puo' chiamarla.
--    Trovato provandolo, non leggendolo.
revoke execute on function public.gest_piano_ok(uuid) from public;
grant  execute on function public.gest_piano_ok(uuid) to authenticated, service_role;


-- ------------------------------------------------------------
-- 2. IL GUARDIANO — uno solo, per tutte le tabelle
--    Il nome della colonna del proprietario arriva come argomento del
--    trigger, cosi' la stessa funzione va bene su gest_membri (impresa_id)
--    come su tutte le altre (user_id).
-- ------------------------------------------------------------
create or replace function public.gest_blocco_piano()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $funzione$
declare
  v_ruolo    text;
  v_mail     text;
  v_colonna  text := tg_argv[0];
  v_titolare uuid;
  v_libero   boolean := false;
begin
  -- Chi sta scrivendo? Supabase mette il ruolo dentro il gettone JWT.
  -- Se non c'e' nessun gettone siamo nell'SQL Editor: ruolo "postgres".
  v_ruolo := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims',     true), '')::jsonb ->> 'role',
    'postgres'
  );

  if v_ruolo in ('service_role', 'postgres', 'supabase_admin') then
    v_libero := true;
  end if;

  -- ⚠️ IL CASO DELLA RIGA SENZA PADRONE.
  -- Se la colonna del proprietario e' vuota, il guardiano si fa da parte e
  -- lascia decidere le regole (RLS), che su quelle righe dicono gia' di no.
  -- Non e' pigrizia: le cancellazioni a catena passano di qui. Cancellare un
  -- mezzo cancella i suoi rifornimenti, e cancellare un operatore ne svuota
  -- la casella (on delete set null), che e' una MODIFICA e sveglia questo
  -- guardiano. Se una di quelle righe avesse la colonna vuota, un cliente
  -- PAGANTE non riuscirebbe piu' a cancellare il suo mezzo.

  if not v_libero and tg_op <> 'INSERT' then
    v_titolare := nullif(to_jsonb(old) ->> v_colonna, '')::uuid;
    if v_titolare is not null and not public.gest_piano_ok(v_titolare) then
      select u.email into v_mail from auth.users u where u.id = auth.uid();
      if coalesce(v_mail, '') <> 'pintoalessio@icloud.com' then
        raise exception
          'Il gestionale è compreso nel Piano Premium, e il tuo piano non è attivo. I tuoi dati ci sono tutti: puoi vederli e scaricarli, ma per salvare le modifiche serve il Premium. Lo riattivi dal tuo pannello e torna tutto come prima.'
          using errcode = '42501';
      end if;
      v_libero := true;   -- e' il fondatore: passa anche il controllo dopo
    end if;
  end if;

  if not v_libero and tg_op <> 'DELETE' then
    v_titolare := nullif(to_jsonb(new) ->> v_colonna, '')::uuid;
    if v_titolare is not null and not public.gest_piano_ok(v_titolare) then
      select u.email into v_mail from auth.users u where u.id = auth.uid();
      if coalesce(v_mail, '') <> 'pintoalessio@icloud.com' then
        raise exception
          'Il gestionale è compreso nel Piano Premium, e il tuo piano non è attivo. I tuoi dati ci sono tutti: puoi vederli e scaricarli, ma per salvare le modifiche serve il Premium. Lo riattivi dal tuo pannello e torna tutto come prima.'
          using errcode = '42501';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$funzione$;

comment on function public.gest_blocco_piano() is
  'Guardiano del piano sulle tabelle gest_*: senza Premium attivo si legge e si esporta, non si scrive. Il nome della colonna del proprietario arriva come argomento del trigger.';


-- ------------------------------------------------------------
-- 3. IL GUARDIANO SI METTE SU TUTTE LE TABELLE gest_*
--    La colonna del proprietario si legge dalla tabella stessa: user_id se
--    c'e', altrimenti impresa_id (e' il caso di gest_membri). Se non c'e' ne'
--    l'una ne' l'altra, la tabella non e' di nessuno e si salta: e' il caso
--    di gest_dalsito_avvisi, che ha le regole accese e nessuna regola
--    scritta, cioe' e' gia' chiusa a tutti tranne al server.
-- ------------------------------------------------------------
do $blocco$
declare
  r          record;
  v_colonna  text;
  v_fuori    text[] := array['gest_accessi', 'gest_interessati', 'gest_richieste'];
begin
  for r in
    select c.oid, c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind = 'r'
       and c.relname like 'gest\_%'
     order by c.relname
  loop
    -- prima si toglie sempre: cosi' il file si puo' rilanciare, e se una
    -- tabella entra nell'elenco delle escluse il guardiano se ne va davvero
    execute format('drop trigger if exists trg_gest_piano on public.%I', r.relname);

    if r.relname = any(v_fuori) then
      continue;
    end if;

    select a.attname into v_colonna
      from pg_attribute a
     where a.attrelid = r.oid
       and a.attnum > 0
       and not a.attisdropped
       and a.attname in ('user_id', 'impresa_id')
     order by case a.attname when 'user_id' then 1 else 2 end
     limit 1;

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
-- 4. LA RIGA DI RISULTATO
--    Non si fida di quello che c'e' scritto qui sopra: va a contare i
--    guardiani davvero attaccati, e dice quali tabelle gest_* sono rimaste
--    senza. Le tre escluse le nomina, cosi' non sembrano una dimenticanza.
-- ------------------------------------------------------------
with tabelle as (
  select c.oid, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'gest\_%'
),
con_guardiano as (
  select t.relname
    from tabelle t
    join pg_trigger g on g.tgrelid = t.oid and g.tgname = 'trg_gest_piano'
                     and not g.tgisinternal
)
select 'lucchetto acceso su ' || (select count(*) from con_guardiano)
    || ' tabelle gest_ su ' || (select count(*) from tabelle)
    || '  ·  fuori apposta: gest_accessi, gest_interessati, gest_richieste, gest_dalsito_avvisi'
    || '  ·  senza guardiano e SENZA motivo: '
    || coalesce((select string_agg(t.relname, ', ' order by t.relname)
                   from tabelle t
                  where t.relname not in (select relname from con_guardiano)
                    and t.relname not in ('gest_accessi', 'gest_interessati',
                                          'gest_richieste', 'gest_dalsito_avvisi')),
                'nessuna')
    || '  ·  la funzione del piano: '
    || coalesce((select 'c''e''' from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'gest_piano_ok'),
                'MANCA')
       as risultato;


-- ------------------------------------------------------------
-- SI TORNA INDIETRO COSI' (se mai servisse, in tre secondi)
-- ------------------------------------------------------------
-- do $$
-- declare r record;
-- begin
--   for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
--             where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'gest\_%'
--   loop
--     execute format('drop trigger if exists trg_gest_piano on public.%I', r.relname);
--   end loop;
-- end $$;
