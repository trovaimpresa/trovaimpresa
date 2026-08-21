-- =====================================================================
-- TrovaImpresa — RAPPORTINO GIORNALIERO DI CANTIERE
-- Da salvare come  sql/gest-rapportini.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 — Fase 2a: il rapportino si scrive dal telefono.
--
-- COSA MANCAVA DAVVERO
-- Il margine di ogni lavoro il gestionale lo sa gia' fare (margineLavoro:
-- importo meno spese, meno fatture dei fornitori, meno manodopera). E la
-- tabella delle ore, gest_ore, esiste dal 9 agosto.
-- Il buco era un altro: gest_ore NON compare nemmeno una volta in
-- gestionale-operatore.html. Cioe' le ore le puo' scrivere solo il titolare,
-- dal pannello, a mano, la sera. Chi sta in cantiere non puo'.
-- Il margine quindi e' vero solo per i lavori in cui qualcuno si e' ricordato
-- di inserirle. Questo file apre quella porta.
--
-- COSA AGGIUNGE
--   1) gest_rapportini            -> la giornata di cantiere: lavoro, data,
--                                    materiali usati (a parole), note, foto
--   2) gest_ore.rapportino_id     -> le ore restano in gest_ore, dove sono
--                                    sempre state: cosi' entrano SUBITO nel
--                                    margine che c'e' gia', senza ricollegare
--                                    niente dopo
--   3) i permessi perche' il capo squadra possa scriverle dal telefono
--
-- ⚠️ I MATERIALI QUI DENTRO NON HANNO UN PREZZO, E NON E' UNA DIMENTICANZA.
-- Il costo dei materiali sta gia' nelle spese e nelle fatture dei fornitori,
-- e da li' entra gia' nel margine. Se lo riscrivessimo anche qui, ogni sacco
-- di premiscelato verrebbe contato DUE VOLTE e il margine direbbe il falso.
-- E' la stessa regola che il gestionale gia' scrive all'utente quando collega
-- una fattura fornitore a un lavoro: "non riscriverla anche fra le Spese: la
-- conteresti due volte".
-- Qui dentro si scrive COSA si e' consumato, non QUANTO e' costato.
--
-- IL GESTIONALE FUNZIONA ANCHE PRIMA DI LANCIARE QUESTO FILE:
-- se le tabelle non ci sono, la sezione lo dice con una frase chiara invece
-- di restare a girare o di rompersi.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LA GIORNATA DI CANTIERE
-- ---------------------------------------------------------------------
-- Una riga per lavoro e per giorno. Non un diario libero: e' la scatola a cui
-- si appendono le ore della squadra.
--
-- Perche' ogni collegamento e' fatto cosi':
--   user_id      cascade   -> e' l'impresa proprietaria: se sparisce l'account
--                             sparisce tutto, come per ogni altra tabella gest_
--   mestiere_id  cascade   -> il reparto; stessa regola di gest_ore
--   lavoro_id    cascade   -> un rapportino senza il suo lavoro non vuol dire
--                             niente: e' il rapportino DI quel cantiere
--   creato_da    set null  -> se il collaboratore viene tolto dalla squadra il
--                             rapportino RESTA (quella giornata c'e' stata
--                             davvero), perde solo il nome di chi l'ha scritto.
--                             Stessa scelta gia' fatta per gest_ore.operatore_id

create table if not exists public.gest_rapportini (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id)             on delete cascade,
  mestiere_id  uuid          references public.gest_mestieri(id)   on delete cascade,
  lavoro_id    uuid not null references public.gest_lavori(id)     on delete cascade,
  creato_da    uuid          references public.gest_operatori(id)  on delete set null,

  data         date not null default current_date,
  materiali    text,          -- COSA si e' usato, a parole. Mai un importo.
  note         text,          -- com'e' andata, intoppi, chi e' passato

  eliminato_il timestamptz,   -- il Cestino: si cancella scrivendo la data qui
  created_at   timestamptz not null default now()
);

create index if not exists gest_rapportini_user_idx
  on public.gest_rapportini (user_id, mestiere_id, data desc);
create index if not exists gest_rapportini_lavoro_idx
  on public.gest_rapportini (lavoro_id);


-- ---------------------------------------------------------------------
-- 2. LE ORE RESTANO DOVE SONO SEMPRE STATE
-- ---------------------------------------------------------------------
-- Non creo una seconda tabella delle ore. gest_ore esiste, e il calcolo del
-- margine legge da li'. Una tabella nuova avrebbe voluto dire due posti dove
-- stanno le ore, e prima o poi due numeri diversi.
--
-- ⚠️ set null e NON cascade, ed e' la riga piu' importante del file.
-- Se buttando via un rapportino sparissero anche le sue ore, il margine di un
-- lavoro gia' CHIUSO cambierebbe da solo, in silenzio, e un lavoro in perdita
-- potrebbe smettere di sembrarlo. E' esattamente il difetto trovato il
-- 12 agosto con le tariffe delle persone eliminate.
-- Le ore sono state fatte davvero: restano. Perdono solo il rapportino.

alter table public.gest_ore
  add column if not exists rapportino_id uuid
  references public.gest_rapportini(id) on delete set null;

create index if not exists gest_ore_rapportino_idx
  on public.gest_ore (rapportino_id);


-- ---------------------------------------------------------------------
-- 3. CHI PUO' FARE COSA
-- ---------------------------------------------------------------------
-- La spunta si chiama "rapportini" e va nella scheda della persona, in Squadra.
-- Vale la regola gia' in uso: gest_puo_sezione(impresa, sezione) e' vera per il
-- titolare sempre, e per un collaboratore attivo solo se ha quella spunta.

alter table public.gest_rapportini enable row level security;

-- Il titolare fa tutto, come su ogni altra tabella sua.
drop policy if exists "gest_rapportini_own" on public.gest_rapportini;
create policy "gest_rapportini_own" on public.gest_rapportini
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Il collaboratore con la spunta LEGGE i rapportini dell'impresa.
drop policy if exists "gest_rapportini_team_read" on public.gest_rapportini;
create policy "gest_rapportini_team_read" on public.gest_rapportini
  for select using (gest_puo_sezione(user_id, 'rapportini'));

-- ...e ne SCRIVE di nuovi, ma solo a nome suo: creato_da deve essere la
-- persona che e' lui. Senza questo controllo un collaboratore potrebbe
-- firmare un rapportino col nome di un altro.
drop policy if exists "gest_rapportini_team_insert" on public.gest_rapportini;
create policy "gest_rapportini_team_insert" on public.gest_rapportini
  for insert with check (
    gest_puo_sezione(user_id, 'rapportini')
    and exists (
      select 1 from public.gest_membri m
       where m.membro_id = auth.uid()
         and m.impresa_id = gest_rapportini.user_id
         and m.stato = 'attivo'
         and m.operatore_id = gest_rapportini.creato_da
    )
  );

-- ...e puo' correggere SOLO quelli che ha scritto lui. Quelli degli altri no:
-- in cantiere le ore di un altro non si toccano.
drop policy if exists "gest_rapportini_team_update" on public.gest_rapportini;
create policy "gest_rapportini_team_update" on public.gest_rapportini
  for update using (
    gest_puo_sezione(user_id, 'rapportini')
    and exists (
      select 1 from public.gest_membri m
       where m.membro_id = auth.uid()
         and m.impresa_id = gest_rapportini.user_id
         and m.stato = 'attivo'
         and m.operatore_id = gest_rapportini.creato_da
    )
  ) with check (
    gest_puo_sezione(user_id, 'rapportini')
  );


-- ---------------------------------------------------------------------
-- 4. LE ORE: il collaboratore deve poterle scrivere
-- ---------------------------------------------------------------------
-- Oggi gest_ore ha UNA sola regola, "gest_ore_own": auth.uid() = user_id.
-- Vuol dire che il collaboratore non puo' scrivere nemmeno un'ora, ed e'
-- il motivo per cui il rapportino dal telefono oggi non puo' esistere.
--
-- ⚠️ La regola del titolare NON viene toccata: resta esattamente com'e'.
-- Qui si aggiunge soltanto quello che serve al collaboratore.

-- ⚠️ rapportino_id NOT NULL, e non e' un dettaglio: e' quello che chiude un
-- buco trovato provando. Senza questa riga il capo squadra poteva scrivere ore
-- "sciolte", e poi NON LE RIVEDEVA PIU': non erano sue e non stavano sotto un
-- suo rapportino, quindi la regola di lettura qui sotto non gliele mostrava.
-- Ore scritte, invisibili a chi le ha scritte, impossibili da correggere.
-- Il titolare non e' toccato: lui le ore le scrive sciolte come ha sempre fatto.
drop policy if exists "gest_ore_team_insert" on public.gest_ore;
create policy "gest_ore_team_insert" on public.gest_ore
  for insert with check (
    gest_puo_sezione(user_id, 'rapportini')
    and rapportino_id is not null
  );

-- In lettura il collaboratore vede POCO apposta: le proprie ore, e quelle dei
-- rapportini che ha scritto lui. Non le ore di tutta l'azienda.
-- Le ore degli altri, incrociate col costo orario, sono di fatto le loro paghe.
drop policy if exists "gest_ore_team_read" on public.gest_ore;
create policy "gest_ore_team_read" on public.gest_ore
  for select using (
    gest_puo_sezione(user_id, 'rapportini')
    and (
      exists (
        select 1 from public.gest_membri m
         where m.membro_id = auth.uid()
           and m.impresa_id = gest_ore.user_id
           and m.stato = 'attivo'
           and m.operatore_id = gest_ore.operatore_id
      )
      or exists (
        select 1 from public.gest_rapportini r
        join public.gest_membri m
          on m.membro_id = auth.uid()
         and m.impresa_id = r.user_id
         and m.stato = 'attivo'
         and m.operatore_id = r.creato_da
         where r.id = gest_ore.rapportino_id
      )
    )
  );

-- Correggere e cancellare le ore resta del titolare: non si aggiunge niente.


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- (I raise notice su Supabase non si vedono.)
-- =====================================================================
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_schema='public' AND table_name='gest_rapportini')
      THEN 'NIENTE FATTO — la tabella gest_rapportini non c''e''. Rilancia il file tutto intero.'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='gest_ore'
                        AND column_name='rapportino_id')
      THEN 'A META'' — la tabella c''e'' ma manca la colonna rapportino_id su gest_ore: le ore non si aggancerebbero al rapportino.'
    WHEN (SELECT COUNT(*) FROM pg_policies
           WHERE schemaname='public' AND tablename='gest_rapportini') < 4
      THEN 'A META'' — mancano dei permessi su gest_rapportini: il collaboratore non riuscirebbe a scrivere dal telefono.'
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies
                      WHERE schemaname='public' AND tablename='gest_ore'
                        AND policyname='gest_ore_team_insert')
      THEN 'A META'' — manca il permesso di scrittura delle ore per il collaboratore.'
    ELSE 'FATTO — il rapportino puo'' nascere dal telefono. Adesso servono le due schermate.'
  END AS risultato,
  (SELECT COUNT(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='gest_rapportini') AS permessi_rapportini,
  (SELECT COUNT(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='gest_ore') AS permessi_ore,
  (SELECT COUNT(*) FROM public.gest_rapportini) AS rapportini_presenti;
