-- 20 nov 2026 (voce Strumenti dello studio, sì di Alex con la foto)
-- «Chi ce l'ha»: il collaboratore (o l'operaio) che tiene lo strumento,
-- l'attrezzatura o il mezzo. Vuoto = sta in studio / in azienda.
-- Se la persona viene buttata davvero (non nel Cestino), il campo si svuota.
alter table public.gest_mezzi
  add column if not exists operatore_id uuid references public.gest_operatori(id) on delete set null;
create index if not exists gest_mezzi_operatore_idx on public.gest_mezzi(operatore_id);
