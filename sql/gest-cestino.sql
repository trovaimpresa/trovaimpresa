-- =====================================================================
-- TrovaImpresa — IL CESTINO del gestionale
-- Da salvare come  sql/gest-cestino.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 9 agosto 2026 — richiesta di Alessio: "se uno cancella per errore e'
-- meglio poter recuperare".
--
-- COME FUNZIONA
-- Le righe non si cancellano piu' davvero: si scrive la data e l'ora in
-- "eliminato_il". Il gestionale mostra solo le righe con eliminato_il vuoto,
-- quindi per chi guarda sono sparite; dal Cestino si rimettono a posto.
--
-- PERCHE' E' MEGLIO DEL CANCELLARE DAVVERO
-- Nel database ci sono le cancellazioni a catena: cancellando un reparto se
-- ne andavano anche tutte le sue pratiche, cancellando una carta tutti i suoi
-- movimenti. Con questo sistema la catena NON scatta mai: i figli restano
-- attaccati al padre e tornano su insieme a lui.
--
-- COSA NON ENTRA NEL CESTINO (e perche')
--   gest_preventivo_righe, gest_fattura_righe  -> ogni volta che salvi un
--     preventivo o una fattura le sue righe vengono cancellate e riscritte da
--     capo: nel cestino finirebbero decine di copie fantasma a ogni salvataggio.
--   gest_lavoro_mezzi -> e' solo un collegamento fra due cose che restano
--     entrambe; si rifa' con un clic.
--   gest_carte_movimenti e gest_rifornimenti -> alimentano due VISTE del
--     database (gest_carte_saldo e gest_mezzi_carburante) che non stanno nei
--     file del progetto: furono create a mano. Mettendoli nel cestino il
--     movimento sparirebbe dall'elenco ma il saldo della carta resterebbe
--     scalato, e i km/litro conterebbero pieni che non ci sono piu'.
--     Meglio una cancellazione vera che un saldo sbagliato. Quando le due
--     viste saranno nel progetto, si aggiungono anche loro.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. La colonna, su tutte le tabelle che entrano nel cestino
-- ---------------------------------------------------------------------
-- "if exists" sulla tabella: se una di queste non c'e' ancora nel tuo
-- database (per esempio gest_ore, se non hai ancora lanciato l'altro file),
-- quella riga viene saltata invece di far fallire tutto.

alter table if exists public.gest_lavori             add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_clienti            add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_preventivi         add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_fatture            add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_scadenze           add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_mestieri           add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_mezzi              add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_operatori          add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_carte              add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_fornitori          add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_fatture_fornitori  add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_spese              add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_ore                add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_crediti            add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_note               add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_foto               add column if not exists eliminato_il timestamptz;
alter table if exists public.gest_video              add column if not exists eliminato_il timestamptz;


-- ---------------------------------------------------------------------
-- 2. Indici
-- ---------------------------------------------------------------------
-- Ogni elenco del gestionale adesso chiede "solo le righe non eliminate".
-- L'indice parziale tiene dentro SOLO le righe vive: e' piccolo e velocissimo,
-- ed e' esattamente quello che serve al 99% delle letture.

create index if not exists gest_lavori_vivi_idx     on public.gest_lavori(user_id)    where eliminato_il is null;
create index if not exists gest_clienti_vivi_idx    on public.gest_clienti(user_id)   where eliminato_il is null;
create index if not exists gest_preventivi_vivi_idx on public.gest_preventivi(user_id)where eliminato_il is null;
create index if not exists gest_fatture_vivi_idx    on public.gest_fatture(user_id)   where eliminato_il is null;
create index if not exists gest_scadenze_vivi_idx   on public.gest_scadenze(user_id)  where eliminato_il is null;
create index if not exists gest_mezzi_vivi_idx      on public.gest_mezzi(user_id)     where eliminato_il is null;
create index if not exists gest_operatori_vivi_idx  on public.gest_operatori(user_id) where eliminato_il is null;

-- Per il Cestino serve il contrario: le righe eliminate, dalla piu' recente.
create index if not exists gest_lavori_cestino_idx    on public.gest_lavori(user_id, eliminato_il)    where eliminato_il is not null;
create index if not exists gest_clienti_cestino_idx   on public.gest_clienti(user_id, eliminato_il)   where eliminato_il is not null;


-- ---------------------------------------------------------------------
-- 3. VERIFICA (facoltativa)
-- ---------------------------------------------------------------------
-- Deve elencare tutte le tabelle qui sopra, ognuna con la colonna nuova:
--
-- select table_name
--   from information_schema.columns
--  where column_name = 'eliminato_il' and table_schema = 'public'
--  order by table_name;
--
-- Per vedere cosa c'e' nel cestino delle pratiche:
-- select id, descrizione, eliminato_il from public.gest_lavori
--  where eliminato_il is not null order by eliminato_il desc;


-- ---------------------------------------------------------------------
-- 4. I VINCOLI DI UNICITA' DEVONO IGNORARE IL CESTINO
-- ---------------------------------------------------------------------
-- Questo pezzo e' obbligatorio, non un di piu'.
--
-- LE FATTURE. Il numero e' unico per anno. Con il cestino la riga eliminata
-- resta nella tabella, quindi il numero 7 risultava ancora "occupato" da una
-- fattura che non esiste piu': la fattura dopo non si riusciva piu' a
-- emettere. Il vincolo va rifatto in modo che guardi solo le righe vive.

drop index if exists public.gest_fatture_numero_anno_uniq;
create unique index if not exists gest_fatture_numero_anno_uniq
  on public.gest_fatture (user_id, anno, numero)
  where numero is not null and eliminato_il is null;

-- LE NOTE DEL CALENDARIO. Una nota per giorno. Eliminandone una, la riga
-- restava e il salvataggio successivo su quello stesso giorno finiva sopra la
-- riga nel cestino: sembrava salvata ma alla ricarica era sparita, e quel
-- giorno non era piu' scrivibile. Stessa cura.

alter table if exists public.gest_note drop constraint if exists gest_note_user_id_mestiere_id_data_key;
drop index if exists public.gest_note_giorno_uniq;
create unique index if not exists gest_note_giorno_uniq
  on public.gest_note (user_id, mestiere_id, data)
  where eliminato_il is null;


-- ---------------------------------------------------------------------
-- 5. LA VISTA DELLE SCADENZE DEI MEZZI DEVE IGNORARE IL CESTINO
-- ---------------------------------------------------------------------
-- gest_mezzi_scadenze conta le scadenze aperte di ogni mezzo: e' quella che
-- accende il pallino rosso. Senza questo pezzo, una revisione eliminata
-- continuava a contare e il pallino restava rosso per sempre.
-- Stessa vista di sql/gestionale-mezzi-allinea.sql, con due righe in piu'.

drop view if exists public.gest_mezzi_scadenze;
create view public.gest_mezzi_scadenze
with (security_invoker = true) as
select
  m.id          as mezzo_id,
  m.user_id     as user_id,
  m.mestiere_id as mestiere_id,
  m.nome        as nome,
  m.categoria   as categoria,
  m.targa       as targa,
  m.stato       as stato,
  count(s.id) filter (
    where s.stato is distinct from 'fatta'
  )::int as aperte,
  count(s.id) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza < current_date
  )::int as scadute,
  min(s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ) as prossima_data,
  (array_agg(s.titolo order by s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ))[1] as prossimo_titolo,
  (array_agg(s.tipo_pratica order by s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ))[1] as prossimo_tipo
from public.gest_mezzi m
left join public.gest_scadenze s
  on s.mezzo_id = m.id and s.user_id = m.user_id
  and s.eliminato_il is null          -- <-- le scadenze nel cestino non contano
where m.eliminato_il is null          -- <-- e nemmeno i mezzi nel cestino
group by m.id, m.user_id, m.mestiere_id, m.nome, m.categoria, m.targa, m.stato;

grant select on public.gest_mezzi_scadenze to authenticated;


-- ---------------------------------------------------------------------
-- 6. INDICI PER IL CESTINO (uno per tabella)
-- ---------------------------------------------------------------------
-- La sezione Cestino chiede a ogni tabella "dammi le righe eliminate":
-- senza indice sarebbe una lettura completa di ogni tabella.

create index if not exists gest_preventivi_cestino_idx on public.gest_preventivi(user_id, eliminato_il) where eliminato_il is not null;
create index if not exists gest_fatture_cestino_idx    on public.gest_fatture(user_id, eliminato_il)    where eliminato_il is not null;
create index if not exists gest_scadenze_cestino_idx   on public.gest_scadenze(user_id, eliminato_il)   where eliminato_il is not null;
create index if not exists gest_mestieri_cestino_idx   on public.gest_mestieri(user_id, eliminato_il)   where eliminato_il is not null;
create index if not exists gest_mezzi_cestino_idx      on public.gest_mezzi(user_id, eliminato_il)      where eliminato_il is not null;
create index if not exists gest_operatori_cestino_idx  on public.gest_operatori(user_id, eliminato_il)  where eliminato_il is not null;
create index if not exists gest_carte_cestino_idx      on public.gest_carte(user_id, eliminato_il)      where eliminato_il is not null;
create index if not exists gest_fornitori_cestino_idx  on public.gest_fornitori(user_id, eliminato_il)  where eliminato_il is not null;
create index if not exists gest_fattforn_cestino_idx   on public.gest_fatture_fornitori(user_id, eliminato_il) where eliminato_il is not null;
create index if not exists gest_spese_cestino_idx      on public.gest_spese(user_id, eliminato_il)      where eliminato_il is not null;
create index if not exists gest_note_cestino_idx       on public.gest_note(user_id, eliminato_il)       where eliminato_il is not null;
create index if not exists gest_foto_cestino_idx       on public.gest_foto(user_id, eliminato_il)       where eliminato_il is not null;
create index if not exists gest_video_cestino_idx      on public.gest_video(user_id, eliminato_il)      where eliminato_il is not null;
-- gest_ore e gest_crediti solo se hai gia' lanciato sql/gest-ore-e-crediti.sql:
create index if not exists gest_ore_cestino_idx        on public.gest_ore(user_id, eliminato_il)        where eliminato_il is not null;
create index if not exists gest_crediti_cestino_idx    on public.gest_crediti(user_id, eliminato_il)    where eliminato_il is not null;
