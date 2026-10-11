-- 11 ottobre 2026 — Attestati, patentini e corsi: una riga per ognuno, con data di inizio e di scadenza.
-- Visibili solo al titolare (come gest_operatori). Se si cancella la persona, spariscono anche i suoi attestati.
-- Additivo: nessuna riga esistente cambia. Gia' eseguito su Supabase l'11/10/2026.
create table if not exists public.gest_operatore_documenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  operatore_id uuid not null references public.gest_operatori(id) on delete cascade,
  tipo text not null,
  numero text,
  data_inizio date,
  data_scadenza date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists gest_op_doc_idx on public.gest_operatore_documenti(operatore_id);
alter table public.gest_operatore_documenti enable row level security;
drop policy if exists op_doc_owner on public.gest_operatore_documenti;
create policy op_doc_owner on public.gest_operatore_documenti for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists trg_gest_stesso_padrone on public.gest_operatore_documenti;
create trigger trg_gest_stesso_padrone before insert or update on public.gest_operatore_documenti for each row execute function public.gest_stesso_padrone();
