-- =====================================================================
-- 10 novembre 2026 — GLI ACQUISTI: le righe di merce delle fatture e
-- delle bolle dei fornitori.
--
-- Chiesto da Alessio: «quando si fanno le foto alle fatture o alle bolle
-- mi serve una lista di tutto quello che si compra: a fine mese dice
-- guanti 10 paia, malta venti sacchi, martello 1, e si invia in PDF».
--
-- Prima di oggi di una fattura del fornitore restavano fornitore, numero,
-- data e totale (gest_fatture_fornitori): le righe della merce no.
--
-- ⛔ SOLO AGGIUNTE: una tabella nuova. Niente di quello che c'e' cambia.
-- ⛔ Una riga appartiene a una fattura (fattura_id). Se la fattura viene
--    eliminata per sempre, le sue righe se ne vanno con lei (cascade).
--    Se la fattura va nel CESTINO le righe restano: e' la lista del mese
--    (js/gest-acquisti.js) che salta le righe delle fatture cestinate.
-- ⛔ RLS: ognuno vede e scrive solo le sue (auth.uid() = user_id).
-- ⚠️ `importo` e' il totale della riga come sta scritto sul documento
--    (quantita' x prezzo, sconti compresi): non si ricalcola.
-- =====================================================================
create table if not exists public.gest_acquisti (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id)                    on delete cascade,
  mestiere_id     uuid          references public.gest_mestieri(id)          on delete set null,
  fattura_id      uuid          references public.gest_fatture_fornitori(id) on delete cascade,
  fornitore_id    uuid          references public.gest_fornitori(id)         on delete set null,
  lavoro_id       uuid          references public.gest_lavori(id)            on delete set null,

  data            date not null default current_date,   -- la data del documento
  descrizione     text not null default '',             -- "Malta premiscelata 25 kg"
  quantita        numeric(14,3),                        -- 20
  unita           text,                                 -- "sacchi", "paia", "pz", "m²"
  prezzo_unitario numeric(14,4),
  importo         numeric(14,2),

  created_at      timestamptz not null default now()
);

create index if not exists gest_acquisti_user_data_idx on public.gest_acquisti (user_id, data);
create index if not exists gest_acquisti_fattura_idx   on public.gest_acquisti (fattura_id);

alter table public.gest_acquisti enable row level security;

drop policy if exists gest_acquisti_owner_all on public.gest_acquisti;
create policy gest_acquisti_owner_all on public.gest_acquisti
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.gest_acquisti to authenticated;
