-- =====================================================================
-- «TOGLI DAL MIO ELENCO» LATO IMPRESA  --  5 settembre 2026
-- =====================================================================
-- Il difetto: il bottone «🗑 Elimina conversazione» del pannello faceva
--   DELETE from chat_messaggi where conversation_id = ...
-- Le righe sparivano per TUTTI E DUE: il cliente si ritrovava la
-- conversazione vuota senza sapere perche'. Il 2 settembre il bottone del
-- CLIENTE era gia' stato sistemato (li' basta dimenticare il codice della
-- conversazione, che sta nel suo browser); questo era rimasto.
--
-- Qui non si cancella niente: si segna che quella conversazione l'impresa
-- non la vuole piu' in elenco.
--
-- ⚠️ E si segna anche QUANDO: il pannello salta la conversazione solo se
-- dopo quel momento non e' arrivato altro. Se il cliente riscrive, la
-- conversazione TORNA in elenco da sola — se no l'impresa perderebbe un
-- messaggio nuovo senza accorgersene, che e' peggio del difetto di partenza.
--
-- Gia' passato sul database il 5 set 2026. Si puo' rilanciare.
-- =====================================================================
create table if not exists public.chat_nascoste (
  impresa_id      bigint      not null references public.imprese(id) on delete cascade,
  conversation_id text        not null,
  quando          timestamptz not null default now(),
  primary key (impresa_id, conversation_id)
);

alter table public.chat_nascoste enable row level security;

-- Stessa forma delle regole di chat_messaggi: solo la propria impresa.
drop policy if exists "chat_nascoste_impresa_all" on public.chat_nascoste;
create policy "chat_nascoste_impresa_all"
on public.chat_nascoste for all
to authenticated
using (exists (select 1 from public.imprese im
               where im.id = chat_nascoste.impresa_id and im.user_id = auth.uid()))
with check (exists (select 1 from public.imprese im
                    where im.id = chat_nascoste.impresa_id and im.user_id = auth.uid()));

grant select, insert, update, delete on public.chat_nascoste to authenticated;
