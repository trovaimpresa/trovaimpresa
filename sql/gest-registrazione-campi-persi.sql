-- =====================================================================
-- I CAMPI DELLA REGISTRAZIONE CHE IL SITO BUTTAVA VIA — 19 agosto 2026
--
-- COSA E' SUCCESSO, in parole semplici.
-- Il trigger `completa_profilo_extra` (sql/trigger-campi-extra.sql, scritto
-- l'8 agosto) doveva salvare i campi del blocco «Aggiungi altri dettagli»
-- della registrazione: indirizzo, CAP, descrizione, P.IVA, WhatsApp, sito,
-- specializzazioni, zone, anno, dipendenti, anni di esperienza, i mestieri
-- e la categoria del negozio.
--
-- Scriveva in DUE colonne che nella tabella `imprese` NON ESISTONO:
--     `nome_negozio`  -> non esiste (il modulo manda gia' `nome_attivita`)
--     `piva`          -> la colonna si chiama `partita_iva`
--
-- In SQL basta UNA colonna sbagliata e fallisce l'INTERO `update`, non solo
-- quella. E in fondo alla funzione c'era:
--     exception when others then return new;
-- cioe' «se qualcosa va storto, fai finta di niente». Cosi' il difetto e'
-- rimasto nascosto undici giorni: la registrazione andava a buon fine, e i
-- campi sparivano tutti, a ogni iscrizione, senza un errore da nessuna parte.
--
-- COSA SI VEDEVA (misurato il 19 agosto sugli ultimi 30 giorni):
--     83 iscritte · 0 con il profilo completo · 0 sulla mappa
--     «Via repubblica 41» scritta nel modulo, e in `imprese` casella vuota.
--
-- COSA FA QUESTO FILE
--   1. Una tabellina dove il trigger scrive gli errori invece di mangiarseli.
--   2. Il trigger corretto: `partita_iva` al posto di `piva`, via
--      `nome_negozio`. La registrazione continua a NON bloccarsi mai per un
--      campo in piu' — ma adesso l'errore si vede.
--   3. **Recupera l'arretrato.** I dati non erano persi: stanno ancora nella
--      scheda della registrazione (`auth.users.raw_user_meta_data`). Si
--      rimettono al loro posto. ⚠️ SOLO nelle caselle VUOTE: non si
--      sovrascrive niente di quello che c'e' gia'.
--   4. Righe di risultato: quante imprese hanno riavuto l'indirizzo.
--
-- Si puo' rieseguire quante volte si vuole: non fa danni e non raddoppia
-- niente.
--
-- COME E' STATO PROVATO
--   Su un PostgreSQL 16 vero, con la tabella `imprese` ricostruita dalle
--   colonne VERE (74 colonne lette dal database di produzione) e il trigger
--   vecchio copiato verbatim, per riprodurre il difetto prima di toccarlo.
--   ⚠️ `crea_profilo_impresa` (il trigger principale) NON sta in nessun file
--      di `sql/`: al banco e' un segnaposto che crea la riga, non la funzione
--      vera. Qui pero' non si tocca, e quello che si prova e' cosa succede
--      DOPO che la riga esiste.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. DOVE FINISCONO GLI ERRORI, invece che nel niente
-- ---------------------------------------------------------------------
create table if not exists public.errori_trigger(
  id        bigserial primary key,
  quando    timestamptz not null default now(),
  dove      text not null,
  chi       uuid,
  errore    text,
  dettaglio text
);
comment on table public.errori_trigger is
  'Gli errori dei trigger che NON devono bloccare la registrazione. Se qui dentro compare qualcosa, un campo si sta perdendo.';

-- non la legge nessuno dall''app: la guardi tu dall''SQL Editor
alter table public.errori_trigger enable row level security;


-- ---------------------------------------------------------------------
-- 2. IL TRIGGER CORRETTO
--    Cambia SOLO quello che deve cambiare: due nomi di colonna e il modo
--    in cui si comporta quando va storto. Il resto e' identico all'8 agosto.
-- ---------------------------------------------------------------------
create or replace function public.completa_profilo_extra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m           jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_tipo      text  := lower(coalesce(m->>'tipo', ''));
  v_negozio   text  := nullif(trim(coalesce(m->>'tipo_negozio', '')), '');
  v_mestieri  text[];
begin
  -- solo i 4 tipi business: i candidati hanno la loro tabella
  if v_tipo not in ('impresa', 'artigiano', 'professionista', 'negozio') then
    return new;
  end if;

  -- elenco mestieri (artigiano: principale + secondario + terzo)
  if m ? 'mestieri' and jsonb_typeof(m->'mestieri') = 'array' then
    select array_agg(x) into v_mestieri
    from jsonb_array_elements_text(m->'mestieri') as t(x)
    where nullif(trim(x), '') is not null;
  end if;

  update public.imprese
     set tipo_negozio     = coalesce(v_negozio,  tipo_negozio),
         mestieri         = coalesce(v_mestieri, mestieri),
         -- ⚠️ 19 agosto: era `piva`, e in `imprese` quella colonna non c'e'.
         --    Il modulo manda la chiave `piva`, la colonna si chiama
         --    `partita_iva`: si leggono tutte e due le chiavi, per sicurezza.
         partita_iva      = coalesce(nullif(trim(coalesce(m->>'piva','')),''),
                                     nullif(trim(coalesce(m->>'partita_iva','')),''),
                                     partita_iva),
         -- ⚠️ 19 agosto: qui c'era anche `nome_negozio`, che non esiste.
         --    Non serve: il modulo del negozio manda gia' `nome_attivita`,
         --    che scrive il trigger principale.
         indirizzo        = coalesce(nullif(trim(coalesce(m->>'indirizzo','')),''),        indirizzo),
         cap              = coalesce(nullif(trim(coalesce(m->>'cap','')),''),              cap),
         descrizione      = coalesce(nullif(trim(coalesce(m->>'descrizione','')),''),      descrizione),
         whatsapp         = coalesce(nullif(trim(coalesce(m->>'whatsapp','')),''),         whatsapp),
         sito_web         = coalesce(nullif(trim(coalesce(m->>'sito_web','')),''),         sito_web),
         specializzazioni = coalesce(nullif(trim(coalesce(m->>'specializzazioni','')),''), specializzazioni),
         zone             = coalesce(nullif(trim(coalesce(m->>'zone','')),''),             zone),
         anno_fondazione  = coalesce((nullif(regexp_replace(coalesce(m->>'anno_fondazione',''),'[^0-9]','','g'),''))::int,  anno_fondazione),
         dipendenti       = coalesce( nullif(regexp_replace(coalesce(m->>'dipendenti',''),'[^0-9]','','g'),''),             dipendenti),
         anni_esperienza  = coalesce((nullif(regexp_replace(coalesce(m->>'anni_esperienza',''),'[^0-9]','','g'),''))::int,  anni_esperienza)
   where user_id = new.id;

  return new;

exception when others then
  -- ⚠️ 19 agosto — LA RIGA CHE HA TENUTO NASCOSTO IL DIFETTO PER UNDICI
  --    GIORNI era questa, e diceva soltanto «return new».
  --    La regola resta giusta: un campo in piu' non deve MAI far fallire
  --    un'iscrizione. Ma «non bloccare» non vuol dire «non dirlo».
  --    Adesso l'errore viene scritto, e se il trigger si rompe di nuovo si
  --    vede guardando `select * from errori_trigger order by quando desc`.
  begin
    insert into public.errori_trigger(dove, chi, errore, dettaglio)
    values ('completa_profilo_extra', new.id, sqlerrm, sqlstate);
  exception when others then
    null;   -- se non si riesce nemmeno a scrivere l'errore, si va avanti
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_extra on auth.users;
create trigger on_auth_user_created_extra
  after insert on auth.users
  for each row execute function public.completa_profilo_extra();


-- ---------------------------------------------------------------------
-- 3. IL RECUPERO DELL'ARRETRATO
--    ⚠️ `coalesce(i.colonna, dal_modulo)`: prima quello che c'e' GIA' nel
--       profilo, e solo se manca quello scritto alla registrazione. Cosi'
--       chi nel frattempo ha sistemato il profilo a mano non se lo vede
--       riscrivere sotto il naso.
-- ---------------------------------------------------------------------
with meta as (
  select u.id as uid, coalesce(u.raw_user_meta_data, '{}'::jsonb) as m
  from auth.users u
),
pulito as (
  select uid,
         nullif(trim(coalesce(m->>'piva','')),'')             as v_piva,
         nullif(trim(coalesce(m->>'partita_iva','')),'')      as v_piva2,
         nullif(trim(coalesce(m->>'indirizzo','')),'')        as v_indirizzo,
         nullif(trim(coalesce(m->>'cap','')),'')              as v_cap,
         nullif(trim(coalesce(m->>'descrizione','')),'')      as v_descrizione,
         nullif(trim(coalesce(m->>'whatsapp','')),'')         as v_whatsapp,
         nullif(trim(coalesce(m->>'sito_web','')),'')         as v_sito,
         nullif(trim(coalesce(m->>'specializzazioni','')),'') as v_spec,
         nullif(trim(coalesce(m->>'zone','')),'')             as v_zone,
         nullif(trim(coalesce(m->>'tipo_negozio','')),'')     as v_negozio,
         (nullif(regexp_replace(coalesce(m->>'anno_fondazione',''),'[^0-9]','','g'),''))::int as v_anno,
          nullif(regexp_replace(coalesce(m->>'dipendenti',''),'[^0-9]','','g'),'')            as v_dip,
         (nullif(regexp_replace(coalesce(m->>'anni_esperienza',''),'[^0-9]','','g'),''))::int as v_anni,
         case when m ? 'mestieri' and jsonb_typeof(m->'mestieri') = 'array'
              then (select array_agg(x) from jsonb_array_elements_text(m->'mestieri') as t(x)
                     where nullif(trim(x),'') is not null) end as v_mestieri
  from meta
),
sistemate as (
  update public.imprese i
     set partita_iva      = coalesce(i.partita_iva,      p.v_piva, p.v_piva2),
         indirizzo        = coalesce(i.indirizzo,        p.v_indirizzo),
         cap              = coalesce(i.cap,              p.v_cap),
         descrizione      = coalesce(i.descrizione,      p.v_descrizione),
         whatsapp         = coalesce(i.whatsapp,         p.v_whatsapp),
         sito_web         = coalesce(i.sito_web,         p.v_sito),
         specializzazioni = coalesce(i.specializzazioni, p.v_spec),
         zone             = coalesce(i.zone,             p.v_zone),
         tipo_negozio     = coalesce(i.tipo_negozio,     p.v_negozio),
         anno_fondazione  = coalesce(i.anno_fondazione,  p.v_anno),
         dipendenti       = coalesce(i.dipendenti,       p.v_dip),
         anni_esperienza  = coalesce(i.anni_esperienza,  p.v_anni),
         mestieri         = coalesce(i.mestieri,         p.v_mestieri)
    from pulito p
   where p.uid = i.user_id
     -- si toccano SOLO le righe dove c'e' davvero qualcosa da rimettere:
     -- cosi' il numero che esce sotto e' vero e non gonfiato
     and ( (i.indirizzo        is null and p.v_indirizzo   is not null)
        or (i.partita_iva      is null and coalesce(p.v_piva,p.v_piva2) is not null)
        or (i.cap              is null and p.v_cap         is not null)
        or (i.descrizione      is null and p.v_descrizione is not null)
        or (i.whatsapp         is null and p.v_whatsapp    is not null)
        or (i.sito_web         is null and p.v_sito        is not null)
        or (i.specializzazioni is null and p.v_spec        is not null)
        or (i.zone             is null and p.v_zone        is not null)
        or (i.tipo_negozio     is null and p.v_negozio     is not null)
        or (i.anno_fondazione  is null and p.v_anno        is not null)
        or (i.dipendenti       is null and p.v_dip         is not null)
        or (i.anni_esperienza  is null and p.v_anni        is not null)
        or (i.mestieri         is null and p.v_mestieri    is not null) )
  returning i.id, i.indirizzo, i.descrizione, i.partita_iva
)
select count(*)                                        as imprese_sistemate,
       count(*) filter (where indirizzo   is not null) as con_indirizzo,
       count(*) filter (where descrizione is not null) as con_descrizione,
       count(*) filter (where partita_iva is not null) as con_partita_iva
from sistemate;


-- ---------------------------------------------------------------------
-- 4. COM'E' ADESSO — riga di risultato, non un messaggio
-- ---------------------------------------------------------------------
select
  count(*)                                                   as imprese_totali,
  count(*) filter (where indirizzo   is not null)            as con_indirizzo,
  count(*) filter (where descrizione is not null)            as con_descrizione,
  count(*) filter (where indirizzo is not null
                     and descrizione is not null)            as profilo_completo,
  (select count(*) from public.errori_trigger)               as errori_registrati
from public.imprese
where coalesce(is_test, false) = false;


-- =====================================================================
-- COME SI TORNA INDIETRO
-- Il recupero non si annulla (rimette dati veri in caselle vuote: non c'e'
-- niente da annullare). Il trigger invece si rimette com'era togliendo i
-- due trattini qui sotto — ⚠️ ma cosi' torna a buttare via tutto.
-- =====================================================================
-- create or replace function public.completa_profilo_extra() returns trigger
-- language plpgsql security definer set search_path = public as $$
-- begin return new; end $$;


-- =====================================================================
-- DA GUARDARE OGNI TANTO
--   select * from public.errori_trigger order by quando desc limit 20;
-- Se e' vuota, i campi della registrazione stanno arrivando tutti.
-- =====================================================================
