-- =====================================================================
--  UNA LISTA SOLA DI MEZZI — 4 settembre 2026
--
--  Prima c'erano due liste separate:
--    · gest_mezzi  → il parco mezzi del gestionale, diviso per reparto,
--                    con le scadenze scritte come righe dello Scadenzario
--    · nol_mezzi   → i mezzi del Noleggio, con tariffe, contaore e le
--                    scadenze scritte addosso al mezzo
--  Lo stesso camion andava scritto due volte, e la revisione andava
--  aggiornata in due posti: bastava dimenticarne uno.
--
--  Da adesso l'anagrafica e' UNA SOLA: gest_mezzi.
--  Il Noleggio ci si appoggia; la spunta «noleggiabile» dice quali mezzi
--  compaiono nel listino del Noleggio.
--
--  ⚠️ SI PUO' RILANCIARE PIU' VOLTE senza fare danni (tutto IF NOT EXISTS
--     / ON CONFLICT DO NOTHING).
--  ⚠️ nol_mezzi NON viene cancellata: resta li' come copia di sicurezza.
--     Quando sei sicuro che tutto funziona, la si potra' buttare.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) UN DIFETTO TROVATO STRADA FACENDO
--    Il vincolo gest_mezzi_tipo_ok obbligava la colonna «tipo» a valere
--    'mezzo' o 'attrezzatura'. Ma nella scheda del mezzo il campo «Tipo»
--    e' scritto a mano ("furgone", "escavatore", "betoniera"): appena ci
--    si scriveva qualcosa, il salvataggio veniva rifiutato dal database.
--    Funzionava solo lasciandolo vuoto. Quel vincolo era sbagliato: la
--    colonna con quei due valori e' «categoria», che il suo vincolo ce
--    l'ha gia' (gest_mezzi_categoria_chk).
-- ---------------------------------------------------------------------
alter table public.gest_mezzi drop constraint if exists gest_mezzi_tipo_ok;

-- ---------------------------------------------------------------------
-- 2) LE COLONNE CHE PRIMA STAVANO SOLO SUI MEZZI DEL NOLEGGIO
--    Stessi nomi, stessi tipi, stessi valori di partenza di nol_mezzi:
--    cosi' il Noleggio le ritrova tali e quali.
-- ---------------------------------------------------------------------
alter table public.gest_mezzi
  add column if not exists noleggiabile          boolean not null default false,
  add column if not exists codice                text,
  -- tariffe
  add column if not exists tariffa_ora           numeric not null default 0,
  add column if not exists tariffa_giorno        numeric,
  add column if not exists tariffa_settimana     numeric,
  add column if not exists tariffa_mese          numeric,
  add column if not exists ore_incluse_giorno    numeric not null default 8,
  add column if not exists tariffa_ora_extra     numeric not null default 0,
  add column if not exists km_inclusi_giorno     numeric not null default 0,
  add column if not exists tariffa_km            numeric not null default 0,
  add column if not exists usura_fissa           numeric not null default 0,
  add column if not exists usura_percento        numeric not null default 0,
  add column if not exists cauzione              numeric,
  add column if not exists ha_contaore           boolean not null default false,
  add column if not exists ha_contakm            boolean not null default false,
  -- scadenze e manutenzione: DA QUI IN POI SI SCRIVONO UNA VOLTA SOLA
  add column if not exists verifica_ultima       date,
  add column if not exists verifica_mesi         integer not null default 0,
  add column if not exists verifica_ente         text,
  add column if not exists assicurazione_scad    date,
  add column if not exists revisione_scad        date,
  add column if not exists collaudo_scad         date,
  add column if not exists tagliando_ogni_ore    numeric not null default 0,
  add column if not exists tagliando_ultimo_ore  numeric,
  add column if not exists contaore_attuale      numeric,
  add column if not exists fuori_servizio        boolean not null default false,
  add column if not exists fuori_servizio_perche text,
  add column if not exists manutenzione_note     text;

-- ---------------------------------------------------------------------
-- 3) I MEZZI DEL NOLEGGIO ENTRANO NELL'ANAGRAFICA UNICA
--    Si tiene lo STESSO id: cosi' i noleggi gia' fatti (nol_noleggi.mezzo_id)
--    e le foto (nol_media.mezzo_id) continuano a puntare al mezzo giusto,
--    senza toccare una riga di storico.
--    · mestiere_id = NULL  → e' un mezzo dell'azienda, si vede in tutti i
--      reparti (come i clienti nati dal Noleggio)
--    · categoria = 'mezzo' → nel gestionale sta fra i Mezzi
--    · la vecchia «categoria» libera del noleggio ("movimento terra")
--      diventa il «tipo», che nel gestionale e' il campo scritto a mano
--    · stato 'noleggiato' non esiste nel gestionale: si chiama 'in_uso'
-- ---------------------------------------------------------------------
insert into public.gest_mezzi (
  id, user_id, mestiere_id, nome, categoria, tipo, targa, stato, note, created_at, eliminato_il,
  noleggiabile, codice,
  tariffa_ora, tariffa_giorno, tariffa_settimana, tariffa_mese,
  ore_incluse_giorno, tariffa_ora_extra, km_inclusi_giorno, tariffa_km,
  usura_fissa, usura_percento, cauzione, ha_contaore, ha_contakm,
  verifica_ultima, verifica_mesi, verifica_ente,
  assicurazione_scad, revisione_scad, collaudo_scad,
  tagliando_ogni_ore, tagliando_ultimo_ore, contaore_attuale,
  fuori_servizio, fuori_servizio_perche, manutenzione_note)
select
  n.id, n.user_id, null, n.nome, 'mezzo', nullif(trim(coalesce(n.categoria,'')),''), n.codice,
  case when n.stato = 'noleggiato' then 'in_uso'
       when n.stato in ('disponibile','in_uso','manutenzione','fuori_uso') then n.stato
       else 'disponibile' end,
  n.note, coalesce(n.created_at, now()), n.eliminato_il,
  true, n.codice,
  coalesce(n.tariffa_ora,0), n.tariffa_giorno, n.tariffa_settimana, n.tariffa_mese,
  coalesce(n.ore_incluse_giorno,8), coalesce(n.tariffa_ora_extra,0),
  coalesce(n.km_inclusi_giorno,0), coalesce(n.tariffa_km,0),
  coalesce(n.usura_fissa,0), coalesce(n.usura_percento,0), n.cauzione,
  coalesce(n.ha_contaore,false), coalesce(n.ha_contakm,false),
  n.verifica_ultima, coalesce(n.verifica_mesi,0), n.verifica_ente,
  n.assicurazione_scad, n.revisione_scad, n.collaudo_scad,
  coalesce(n.tagliando_ogni_ore,0), n.tagliando_ultimo_ore, n.contaore_attuale,
  coalesce(n.fuori_servizio,false), n.fuori_servizio_perche, n.manutenzione_note
from public.nol_mezzi n
on conflict (id) do nothing;

-- il codice/matricola del noleggio finisce anche nella «targa» del
-- gestionale solo se la targa non c'era: non si sovrascrive niente
update public.gest_mezzi set targa = codice
 where targa is null and codice is not null and noleggiabile;

-- ---------------------------------------------------------------------
-- 4) I NOLEGGI E LE FOTO PUNTANO ALLA LISTA UNICA
-- ---------------------------------------------------------------------
alter table public.nol_noleggi drop constraint if exists nol_noleggi_mezzo_id_fk;
alter table public.nol_noleggi
  add constraint nol_noleggi_mezzo_id_fk
  foreign key (mezzo_id) references public.gest_mezzi(id) on delete set null;

alter table public.nol_media drop constraint if exists nol_media_mezzo_fk;
alter table public.nol_media
  add constraint nol_media_mezzo_fk
  foreign key (mezzo_id) references public.gest_mezzi(id) on delete cascade;

-- ---------------------------------------------------------------------
-- 5) LE SCADENZE SCRITTE SULLA SCHEDA DEL MEZZO ENTRANO NELLO SCADENZARIO
--    La vista gest_mezzi_scadenze prima guardava SOLO le righe scritte a
--    mano in gest_scadenze. Adesso mette insieme le due cose:
--      · le scadenze scritte a mano (gest_scadenze)
--      · assicurazione, revisione, collaudo e verifica periodica scritte
--        sulla scheda del mezzo
--    Cosi' si scrivono in UN posto e si vedono dappertutto: nella colonna
--    «Prossima scadenza», sulla scheda del mezzo e nel Riepilogo.
--    ⚠️ Stessi nomi e stessi tipi di colonna di prima: le pagine che gia'
--       la leggono non se ne accorgono nemmeno.
-- ---------------------------------------------------------------------
create or replace view public.gest_mezzi_scadenze
with (security_invoker = true) as
with tutte as (
  select s.mezzo_id, s.user_id, s.data_scadenza, s.titolo, s.tipo_pratica
    from public.gest_scadenze s
   where s.mezzo_id is not null
     and s.eliminato_il is null
     and s.stato is distinct from 'fatta'
  union all
  select m.id, m.user_id, m.assicurazione_scad, 'Assicurazione', 'assicurazione'
    from public.gest_mezzi m
   where m.eliminato_il is null and m.assicurazione_scad is not null
  union all
  select m.id, m.user_id, m.revisione_scad, 'Revisione', 'revisione'
    from public.gest_mezzi m
   where m.eliminato_il is null and m.revisione_scad is not null
  union all
  select m.id, m.user_id, m.collaudo_scad, 'Collaudo', 'collaudo'
    from public.gest_mezzi m
   where m.eliminato_il is null and m.collaudo_scad is not null
  union all
  select m.id, m.user_id,
         (m.verifica_ultima + make_interval(months => m.verifica_mesi))::date,
         'Verifica periodica', 'verifica'
    from public.gest_mezzi m
   where m.eliminato_il is null
     and m.verifica_ultima is not null
     and coalesce(m.verifica_mesi,0) > 0
)
select
  m.id                                   as mezzo_id,
  m.user_id,
  m.mestiere_id,
  m.nome,
  m.categoria,
  m.targa,
  m.stato,
  count(t.data_scadenza)::integer        as aperte,
  count(t.data_scadenza) filter (where t.data_scadenza < current_date)::integer as scadute,
  min(t.data_scadenza)   filter (where t.data_scadenza >= current_date)         as prossima_data,
  (array_agg(t.titolo       order by t.data_scadenza) filter (where t.data_scadenza >= current_date))[1] as prossimo_titolo,
  (array_agg(t.tipo_pratica order by t.data_scadenza) filter (where t.data_scadenza >= current_date))[1] as prossimo_tipo
from public.gest_mezzi m
left join tutte t on t.mezzo_id = m.id and t.user_id = m.user_id
where m.eliminato_il is null
group by m.id, m.user_id, m.mestiere_id, m.nome, m.categoria, m.targa, m.stato;

commit;
