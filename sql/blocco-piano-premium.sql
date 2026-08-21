-- ============================================================
-- TrovaImpresa — IL PIANO NON SI CAMBIA PIU' DAL BROWSER
-- 21 agosto 2026
--
-- IL PROBLEMA
-- La regola "imprese_update_owner" (sql/rls-batch2-imprese.sql) lascia
-- all'iscritto la modifica della PROPRIA riga su TUTTE le colonne, e fra
-- quelle ci sono "piano", "premium_pagato" e "premium_scadenza".
-- Chi apre la console del browser scrive:
--     update imprese set piano='premium', premium_pagato=true
--      where user_id = auth.uid();
-- e ha il Premium per sempre, gratis: il controllo notturno delle scadenze
-- non lo riprende, perche' guarda solo chi ha una data di scadenza scritta.
--
-- LA CHIUSURA
-- Un guardiano che scatta PRIMA di ogni modifica alla tabella "imprese" e
-- rimette il piano com'era. Non da' errore: la modifica passa, ma quelle
-- tre colonne non si muovono. Cosi' non si rompe nessuna schermata che
-- salva il profilo insieme ad altri campi.
--
-- CHI PASSA LO STESSO
--   1. le funzioni del server (service_role): il webhook di Stripe che
--      attiva l'abbonamento pagato e il controllo notturno delle scadenze;
--   2. l'SQL Editor (ruolo postgres): questa finestra qui;
--   3. l'account del fondatore, per il pulsante "Piano" della sua barra
--      (js/fondatore.js). E' l'unica eccezione, ed e' legata alla mail.
--
-- COSA NON TOCCA
--   - "rinnovo_auto_piano" e "disdetto_piano_il" restano modificabili:
--     li scrive modifica-profilo.html quando l'impresa disdice.
--   - l'inserimento di una riga nuova resta libero sul piano, cosi' il
--     regalo dei 3 mesi ai nuovi iscritti continua a funzionare com'e';
--     viene forzato solo "premium_pagato = false", perche' nessuno possa
--     nascere come "gia' pagante" e quindi senza scadenza.
--
-- Si esegue nell'SQL Editor di Supabase. Si puo' rilanciare quante volte
-- si vuole. In fondo risponde con una riga che dice com'e' andata.
-- ============================================================


create or replace function public.imprese_blocca_piano()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $funzione$
declare
  v_ruolo text;
  v_mail  text;
begin
  -- Chi sta scrivendo? Supabase mette il ruolo dentro il gettone JWT.
  -- Se non c'e' nessun gettone siamo nell'SQL Editor: ruolo "postgres".
  v_ruolo := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims',     true), '')::jsonb ->> 'role',
    'postgres'
  );

  -- 1) il server e l'SQL Editor passano sempre
  if v_ruolo in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  -- 2) l'eccezione del fondatore
  select u.email into v_mail from auth.users u where u.id = auth.uid();
  if v_mail = 'pintoalessio@icloud.com' then
    return new;
  end if;

  -- 3) tutti gli altri
  if tg_op = 'INSERT' then
    -- nascere "gia' pagante" vorrebbe dire non scadere mai
    new.premium_pagato := false;
    return new;
  end if;

  new.piano            := old.piano;
  new.premium_pagato   := old.premium_pagato;
  new.premium_scadenza := old.premium_scadenza;
  return new;
end
$funzione$;


-- Il nome comincia per "trg_b": i guardiani BEFORE scattano in ordine
-- alfabetico, e questo deve venire PRIMA di "trg_scadenza_premium", se no
-- il regalo dei 3 mesi verrebbe calcolato su un piano che poi rimettiamo
-- com'era.
drop trigger if exists trg_blocco_piano on public.imprese;
create trigger trg_blocco_piano
  before insert or update on public.imprese
  for each row execute function public.imprese_blocca_piano();


-- ------------------------------------------------------------
-- LA RIGA DI RISULTATO
-- ------------------------------------------------------------
select 'guardiano acceso: ' || t.tgname
    || '  ·  scatta prima di: ' || coalesce((
         select string_agg(t2.tgname, ', ' order by t2.tgname)
           from pg_trigger t2
          where t2.tgrelid = t.tgrelid
            and not t2.tgisinternal
            and t2.tgname > t.tgname), 'nessun altro')
    || '  ·  eccezione per: pintoalessio@icloud.com'
       as risultato
  from pg_trigger t
 where t.tgrelid = 'public.imprese'::regclass
   and t.tgname  = 'trg_blocco_piano';
