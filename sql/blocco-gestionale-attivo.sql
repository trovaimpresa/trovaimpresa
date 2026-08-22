-- ============================================================
-- TrovaImpresa — ANCHE IL GESTIONALE NON SI ACCENDE PIU' DAL BROWSER
-- 22 agosto 2026
--
-- IL PROBLEMA
-- Il 21 agosto abbiamo chiuso il piano Premium: un iscritto non puo' piu'
-- scriversi da solo "piano = premium". Il guardiano pero' rimetteva a posto
-- TRE colonne sole:
--     piano · premium_pagato · premium_scadenza
-- e in "imprese" ce ne sono altre due che valgono soldi:
--     gestionale_attivo · gestionale_scadenza
-- Sono quelle che aprono il gestionale del NEGOZIO (l'add-on da 12 euro al
-- mese, 119 all'anno), e le scrive il webhook di Stripe quando uno paga.
--
-- Siccome la regola "imprese_update_owner" lascia all'iscritto la modifica
-- della PROPRIA riga su tutte le colonne, dalla console del browser bastava:
--     update imprese set gestionale_attivo = true where user_id = auth.uid();
-- e il gestionale del negozio si apriva gratis, per sempre.
-- ⛔ Controllato sul database vero il 22 agosto: nessuna regola nomina il
--    piano, e il guardiano proteggeva davvero solo quelle tre colonne.
--
-- LA CHIUSURA
-- La stessa di prima, allungata: le due colonne del gestionale entrano
-- nell'elenco di quelle che il guardiano rimette com'erano. Come prima non
-- da' errore — la modifica passa, ma quelle colonne non si muovono — cosi'
-- non si rompe nessuna schermata che salva il profilo insieme ad altri campi.
--
-- ⚠️ QUESTO FILE RISCRIVE IL GUARDIANO DEL 21 AGOSTO.
--    Non e' un secondo guardiano: e' lo stesso, con due colonne in piu'.
--    Dentro c'e' tutto quello che c'era prima, riga per riga. Se un giorno
--    si rilancia "sql/blocco-piano-premium.sql", quello riporta indietro il
--    guardiano alla versione a tre colonne e questo lavoro si perde in
--    silenzio: allora si rilancia questo file, che e' piu' nuovo.
--
-- CHI PASSA LO STESSO (identico a prima)
--   1. le funzioni del server (service_role): il webhook di Stripe, che e'
--      l'unico che deve poter accendere il gestionale;
--   2. l'SQL Editor (ruolo postgres): questa finestra qui;
--   3. l'account del fondatore, per i pulsanti della sua barra.
--
-- COSA CAMBIA SULL'INSERIMENTO
-- Una riga nuova nasce con "gestionale_attivo = false", come gia' nasce con
-- "premium_pagato = false": nessuno deve poter nascere gia' attivo.
--
-- Si esegue nell'SQL Editor di Supabase. Si puo' rilanciare quante volte si
-- vuole. In fondo risponde con una riga che dice com'e' andata.
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
    new.premium_pagato    := false;
    -- 22 agosto 2026: e nemmeno nascere col gestionale gia' acceso
    new.gestionale_attivo := false;
    return new;
  end if;

  new.piano                := old.piano;
  new.premium_pagato       := old.premium_pagato;
  new.premium_scadenza     := old.premium_scadenza;
  -- 22 agosto 2026 — le due colonne dell'add-on gestionale
  new.gestionale_attivo    := old.gestionale_attivo;
  new.gestionale_scadenza  := old.gestionale_scadenza;
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
-- Dice quali colonne il guardiano rimette a posto DAVVERO, lette dentro la
-- funzione appena scritta: non ci si fida di quello che c'e' scritto qui.
-- ------------------------------------------------------------
select 'guardiano acceso: ' || t.tgname
    || '  ·  colonne protette: ' || coalesce((
         select string_agg(m[1], ', ')
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           cross join lateral regexp_matches(pg_get_functiondef(p.oid),
                                             'new\.([a-z_]+)\s*:=\s*old\.', 'g') m
          where n.nspname = 'public' and p.proname = 'imprese_blocca_piano'),
         'NESSUNA: qualcosa non e andato')
    || '  ·  eccezione per: pintoalessio@icloud.com'
       as risultato
  from pg_trigger t
 where t.tgrelid = 'public.imprese'::regclass
   and t.tgname  = 'trg_blocco_piano';
