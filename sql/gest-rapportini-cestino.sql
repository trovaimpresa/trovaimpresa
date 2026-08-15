-- =====================================================================
-- TrovaImpresa — IL CESTINO PER I RAPPORTINI
-- Da salvare come  sql/gest-rapportini-cestino.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 (10) — il rapportino si puo' buttare via, e le sue ore
-- se ne vanno con lui.
--
-- PERCHE' SERVE UNA FUNZIONE E NON BASTANO DUE COMANDI DALL'APP
--
-- 1) DEVONO PARTIRE INSIEME O NON PARTIRE.
--    Buttare via il rapportino e poi le sue ore sono due scritture. Se in
--    mezzo cade la linea, resta il caso peggiore: il rapportino sparito e le
--    ore vive. Da quel momento il margine di quel lavoro conta una manodopera
--    che nessuno vede piu' da nessuna schermata. Qui dentro sono una cosa
--    sola: o si scrivono tutte e due, o non si scrive niente.
--
-- 2) IL CAPO SQUADRA NON PUO' TOCCARE LE ORE, ED E' GIUSTO COSI'.
--    Le ore di tutta la squadra, incrociate col costo orario, sono le paghe.
--    Su gest_ore il collaboratore ha solo "scrivi" e "leggi le tue"
--    (sql/gest-rapportini.sql). Dargli il permesso di modificarle vorrebbe
--    dire dargli anche quello di CAMBIARE i numeri: le regole di Postgres non
--    sanno dire "solo questa colonna".
--    Questa funzione gira coi permessi del database (security definer) e fa
--    UNA cosa sola: scrivere la data di eliminazione. Niente altro.
--
-- 3) UN POSTO SOLO PER TUTTI E DUE.
--    La chiamano sia il pannello del titolare (gestionale-app.html) sia
--    l'app del telefono (gestionale-operatore.html). Una regola sola, scritta
--    una volta: non si possono scollare.
--
-- ⚠️ NON SI CANCELLA MAI NIENTE DAVVERO.
-- Questa funzione scrive solo una data. Il ripristino resta quello del
-- Cestino, che tira su il rapportino e le sue ore insieme.
--
-- ⚠️ QUESTO FILE NON CREA TABELLE E NON TOCCA I PERMESSI ESISTENTI.
-- La colonna eliminato_il su gest_rapportini c'e' gia' da
-- sql/gest-rapportini.sql. Qui si aggiunge solo la funzione.
-- =====================================================================

set check_function_bodies = off;


-- ---------------------------------------------------------------------
-- LA FUNZIONE
-- ---------------------------------------------------------------------
-- p_conferma = false  -> non tocca NIENTE, dice solo cosa succederebbe
-- p_conferma = true   -> butta via davvero (rapportino + ore, insieme)
--
-- Torna sempre un jsonb, mai un errore tecnico in faccia all'utente:
--   {"ok":false,"motivo":"assente"}   il rapportino non c'e' (o non e' tuo)
--   {"ok":false,"motivo":"gia"}       era gia' nel cestino
--   {"ok":false,"motivo":"permesso"}  non sei tu che l'hai scritto
--   {"ok":true,"fatto":false,...}     anteprima
--   {"ok":true,"fatto":true,...}      buttato via
-- con dentro sempre: data, righe_ore, ore.

create or replace function public.gest_rapportino_cestina(
  p_id       uuid,
  p_conferma boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid    uuid := auth.uid();
  v_owner  uuid;
  v_creato uuid;
  v_el     timestamptz;
  v_data   date;
  v_puo    boolean := false;
  v_righe  bigint  := 0;
  v_ore    numeric := 0;
begin
  if v_uid is null then
    raise exception 'Non sei collegato.';
  end if;
  if p_id is null then
    return jsonb_build_object('ok', false, 'motivo', 'assente');
  end if;

  -- "for update" tiene fermo il rapportino fino alla fine: se due telefoni
  -- premono Butta via nello stesso istante, il secondo trova "gia" invece di
  -- rifare il giro e contare le ore due volte.
  select user_id, creato_da, eliminato_il, data
    into v_owner, v_creato, v_el, v_data
    from public.gest_rapportini
   where id = p_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'assente');
  end if;
  if v_el is not null then
    return jsonb_build_object('ok', false, 'motivo', 'gia');
  end if;

  -- ------------------------------------------------------------------
  -- CHI PUO'
  -- Il titolare, sempre, sui suoi.
  -- Il collaboratore attivo con la spunta «Rapportini», SOLO su quelli che
  -- ha scritto lui: in cantiere il rapportino di un altro non si tocca.
  -- E' la stessa regola gia' scritta in gest_rapportini_team_update.
  -- ------------------------------------------------------------------
  if v_owner = v_uid then
    v_puo := true;
  elsif v_creato is not null and public.gest_puo_sezione(v_owner, 'rapportini') then
    select exists (
      select 1 from public.gest_membri m
       where m.membro_id   = v_uid
         and m.impresa_id  = v_owner
         and m.stato       = 'attivo'
         and m.operatore_id = v_creato
    ) into v_puo;
  end if;

  if not v_puo then
    return jsonb_build_object('ok', false, 'motivo', 'permesso');
  end if;

  -- ------------------------------------------------------------------
  -- QUANTE ORE SE NE VANNO CON LUI
  -- Si contano PRIMA, sia per l'anteprima sia per il messaggio finale.
  -- Solo quelle ancora vive: se una era gia' nel cestino da sola, resta
  -- dov'e' e non la si conta due volte.
  -- ------------------------------------------------------------------
  select count(*), coalesce(sum(o.ore), 0)
    into v_righe, v_ore
    from public.gest_ore o
   where o.rapportino_id = p_id
     and o.user_id       = v_owner
     and o.eliminato_il is null;

  if not p_conferma then
    return jsonb_build_object(
      'ok', true, 'fatto', false,
      'data', v_data, 'righe_ore', v_righe, 'ore', v_ore);
  end if;

  -- ------------------------------------------------------------------
  -- SI BUTTA VIA — prima le ore, poi il rapportino, stessa transazione.
  -- now() dentro una transazione e' lo stesso istante per tutte e due le
  -- scritture: serve al Cestino, che rimette a posto insieme le cose
  -- buttate via nello stesso momento (CEST_FIGLI in gestionale-app.html).
  -- ------------------------------------------------------------------
  update public.gest_ore
     set eliminato_il = now()
   where rapportino_id = p_id
     and user_id       = v_owner
     and eliminato_il is null;

  update public.gest_rapportini
     set eliminato_il = now()
   where id = p_id
     and eliminato_il is null;

  return jsonb_build_object(
    'ok', true, 'fatto', true,
    'data', v_data, 'righe_ore', v_righe, 'ore', v_ore);
end;
$$;

comment on function public.gest_rapportino_cestina(uuid, boolean) is
  'Mette nel Cestino un rapportino e le sue ore nello stesso istante. Con p_conferma=false non tocca niente e dice solo cosa succederebbe.';

-- Solo chi e' collegato. Mai anon, mai il pubblico.
revoke all on function public.gest_rapportino_cestina(uuid, boolean) from public;
revoke all on function public.gest_rapportino_cestina(uuid, boolean) from anon;
grant execute on function public.gest_rapportino_cestina(uuid, boolean) to authenticated;


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- (I raise notice su Supabase non si vedono.)
-- =====================================================================
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_schema='public' AND table_name='gest_rapportini')
      THEN 'NIENTE FATTO — manca la tabella gest_rapportini. Lancia prima sql/gest-rapportini.sql, tutto intero.'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='gest_rapportini'
                        AND column_name='eliminato_il')
      THEN 'NIENTE FATTO — su gest_rapportini manca la colonna eliminato_il: senza quella il Cestino non funziona. Rilancia sql/gest-rapportini.sql.'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='gest_ore'
                        AND column_name='rapportino_id')
      THEN 'A META'' — manca gest_ore.rapportino_id: le ore non sono agganciate al rapportino e non potrebbero seguirlo nel Cestino.'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                      WHERE n.nspname='public' AND p.proname='gest_rapportino_cestina')
      THEN 'NIENTE FATTO — la funzione non e'' stata creata. Rilancia il file tutto intero.'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                      WHERE n.nspname='public' AND p.proname='gest_puo_sezione')
      THEN 'A META'' — la funzione c''e'' ma manca gest_puo_sezione: lancia sql/gest-permessi-collaboratori.sql.'
    ELSE 'FATTO — adesso un rapportino si puo'' buttare via e le sue ore vanno nel Cestino insieme a lui. Ricarica il gestionale con CTRL+F5.'
  END AS risultato,
  (SELECT COUNT(*) FROM public.gest_rapportini WHERE eliminato_il IS NULL)     AS rapportini_vivi,
  (SELECT COUNT(*) FROM public.gest_rapportini WHERE eliminato_il IS NOT NULL) AS rapportini_nel_cestino,
  (SELECT COUNT(*) FROM public.gest_ore WHERE rapportino_id IS NOT NULL)       AS ore_agganciate;
