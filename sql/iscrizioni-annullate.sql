-- =====================================================================
-- TrovaImpresa — CHI SE N'È ANDATO
-- Da salvare come  sql/iscrizioni-annullate.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 14 agosto 2026
--
-- ---------------------------------------------------------------------
-- PERCHÉ SERVE UNA TABELLA
-- ---------------------------------------------------------------------
-- Oggi «Annulla iscrizione» chiama una funzione che fa UNA cosa sola:
-- elimina l'utente dall'autenticazione. Da quel momento non esiste più
-- nessun posto dove sia scritto che quella persona c'era.
--
-- Quindi la domanda «se n'è andato qualcuno?» oggi NON HA RISPOSTA. Non è
-- che il pannello non la mostra: il dato proprio non c'è. Contare le
-- iscrizioni di ieri e quelle di oggi non basta — un numero fermo può
-- voler dire nessuno entrato e nessuno uscito, oppure tre entrati e tre
-- usciti, che sono due mondi diversi.
--
-- Qui si scrive PRIMA di cancellare. Quello che resta è il minimo per
-- capire: chi era, che tipo di attività, quanto è durato, e — se ha
-- voluto dirlo — perché se n'è andato.
--
-- ---------------------------------------------------------------------
-- LA SCELTA PIÙ IMPORTANTE DI QUESTO FILE
-- ---------------------------------------------------------------------
-- `user_id` NON ha il collegamento a auth.users, ed è voluto.
--
-- Con il collegamento (references auth.users on delete cascade) questa
-- riga sparirebbe **nello stesso momento** in cui l'account viene
-- eliminato: cioè la tabella fatta per ricordare chi se n'è andato si
-- dimenticherebbe esattamente di chi se n'è andato. È il tipo di errore
-- che non si vede mai, perché la tabella resta lì, vuota, e sembra che
-- non se ne sia andato nessuno.
--
-- L'id si tiene come numero, per poterlo confrontare con i log. Niente
-- di più.
--
-- ---------------------------------------------------------------------
-- COSA NON C'È DENTRO, DI PROPOSITO
-- ---------------------------------------------------------------------
-- Niente telefono, niente indirizzo, niente partita IVA. Chi chiede di
-- essere cancellato ha diritto a sparire: qui resta l'email (serve a non
-- contare due volte la stessa persona se si riscrive e si ricancella) e
-- il minimo per capire il fenomeno. Se un domani chiede di togliere anche
-- quella, si cancella questa riga e non resta niente.
-- =====================================================================

create table if not exists public.iscrizioni_annullate (
  id             uuid primary key default gen_random_uuid(),

  -- ⚠️ NIENTE references auth.users: leggi la nota qui sopra.
  user_id        uuid,

  email          text,
  nome_attivita  text,
  tipo           text,          -- impresa / artigiano / professionista / negozio
  citta          text,
  provincia      text,
  piano          text,          -- free / premium: se se ne vanno i paganti è un'altra storia

  iscritto_il    timestamptz,   -- quando si era iscritto
  annullato_il   timestamptz not null default now(),

  -- quanto è durato, in giorni. Si calcola da solo: è la prima cosa che
  -- si guarda (uno che se ne va dopo 2 giorni non ha capito cos'era;
  -- uno che se ne va dopo 8 mesi ha smesso di trovarci qualcosa).
  --
  -- ⚠️ NON si può scrivere «annullato_il::date - iscritto_il::date», che
  -- sarebbe il modo naturale: convertire un orario in data dipende dal
  -- FUSO ORARIO della sessione, e PostgreSQL rifiuta la tabella con
  -- «generation expression is not immutable» — cioè non si crea proprio.
  -- Trovato provandolo su un PostgreSQL 16 vero: leggendo il file non si
  -- vedeva, e sarebbe arrivato a Alessio come una query che dà errore.
  -- La differenza fra due orari invece è sempre la stessa ovunque.
  giorni_iscritto integer generated always as (
    case when iscritto_il is null then null
         else greatest(0, floor(extract(epoch from (annullato_il - iscritto_il)) / 86400)::int) end
  ) stored,

  -- facoltativo: se ha voluto dire perché
  motivo         text,
  motivo_libero  text,

  created_at     timestamptz not null default now()
);

create index if not exists iscrizioni_annullate_quando_idx
  on public.iscrizioni_annullate (annullato_il desc);
create index if not exists iscrizioni_annullate_email_idx
  on public.iscrizioni_annullate (lower(email));

-- ---------------------------------------------------------------------
-- IL LUCCHETTO
-- ---------------------------------------------------------------------
-- Questa tabella la scrive e la legge SOLO il server (service key), che
-- non passa da queste regole. Dal browser non la deve toccare nessuno:
-- niente grant, RLS accesa e nessuna policy = porta chiusa.
--
-- Non è una precauzione teorica: dentro ci sono le email di persone che
-- hanno chiesto di essere cancellate. Se fosse leggibile da un account
-- qualsiasi, sarebbe la lista peggiore da far uscire.

alter table public.iscrizioni_annullate enable row level security;

revoke all on public.iscrizioni_annullate from anon, authenticated;

-- ---------------------------------------------------------------------
-- VERIFICA — deve dare «chiusa a tutti e due»
-- ---------------------------------------------------------------------
select
  case when has_table_privilege('anon','public.iscrizioni_annullate','SELECT')
         or has_table_privilege('authenticated','public.iscrizioni_annullate','SELECT')
       then 'ATTENZIONE: qualcuno la legge dal browser'
       else 'chiusa a tutti e due' end as lucchetto,
  (select count(*) from public.iscrizioni_annullate) as righe_dentro;
