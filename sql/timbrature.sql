-- ============================================================
-- LA TIMBRATURA DELL'OPERAIO — 6 settembre 2026
-- Gia' applicata al database. Questo file e' la COPIA SCRITTA:
-- serve a sapere fra sei mesi com'e' fatta la tabella e perche'.
--
-- ⚠️ client_id: e' un codice generato DAL TELEFONO, non dal database.
--    In cantiere la rete va e viene: il telefono riprova a mandare la
--    stessa timbratura con lo STESSO codice, e l'indice unico qui sotto
--    fa rispondere 23505 «esiste gia'». Il sito legge quel 23505 come
--    «era gia' arrivata» e la toglie dalla coda. Senza indice unico una
--    timbratura riprovata 3 volte diventava 3 entrate.
--
-- ⚠️ creato_da NON e' auth.uid(): e' l'operatore_id di gest_membri.
--    Le regole qui sotto controllano m.operatore_id = creato_da.
--
-- ⚠️ ora_telefono: l'ora vera in cui l'operaio ha premuto il pulsante.
--    `quando` puo' arrivare ore dopo, quando torna la rete: se si
--    guardasse solo quello, un turno iniziato alle 7 risulterebbe alle 15.
-- ============================================================

create table if not exists public.gest_timbrature (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,                 -- l'impresa (il titolare)
  mestiere_id   uuid,
  lavoro_id     uuid,                          -- il cantiere, se oggi e' uno solo
  creato_da     uuid not null,                 -- l'OPERATORE (gest_membri.operatore_id)
  tipo          text not null check (tipo in ('entrata','uscita')),
  quando        timestamptz not null default now(),
  ora_telefono  timestamptz,                   -- quando ha premuto DAVVERO
  nota          text,
  client_id     text not null,                 -- il codice del telefono
  eliminato_il  timestamptz,                   -- il cestino: non si cancella, si mette da parte
  created_at    timestamptz default now()
);

create unique index if not exists gest_timbrature_client
  on public.gest_timbrature (user_id, client_id);

alter table public.gest_timbrature enable row level security;

-- il titolare: tutto quello che e' suo
create policy gest_timbrature_own on public.gest_timbrature
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- l'operaio scrive SOLO le sue, e solo se ha la spunta «rapportini»
create policy gest_timbrature_team_insert on public.gest_timbrature
  for insert with check (
    gest_puo_sezione(user_id, 'rapportini')
    and exists (select 1 from gest_membri m
                where m.membro_id = auth.uid()
                  and m.impresa_id = gest_timbrature.user_id
                  and m.stato = 'attivo'
                  and m.operatore_id = gest_timbrature.creato_da)
  );

-- preposto e segretaria leggono tutte (guidano la squadra),
-- l'operaio legge SOLO le sue — stessa scelta fatta per i rapportini
create policy gest_timbrature_team_read on public.gest_timbrature
  for select using (
    gest_puo_sezione(user_id, 'rapportini')
    and exists (select 1 from gest_membri m
                where m.membro_id = auth.uid()
                  and m.impresa_id = gest_timbrature.user_id
                  and m.stato = 'attivo'
                  and (m.ruolo in ('preposto','segretaria')
                       or m.operatore_id = gest_timbrature.creato_da))
  );

create policy gest_timbrature_team_update on public.gest_timbrature
  for update using (
    gest_puo_sezione(user_id, 'rapportini')
    and exists (select 1 from gest_membri m
                where m.membro_id = auth.uid()
                  and m.impresa_id = gest_timbrature.user_id
                  and m.stato = 'attivo'
                  and m.operatore_id = gest_timbrature.creato_da)
  ) with check (gest_puo_sezione(user_id, 'rapportini'));
