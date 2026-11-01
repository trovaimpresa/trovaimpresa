-- 1 nov 2026 — «Come ti trovi col gestionale?»: le stelle degli iscritti (js/invito-g2.js).
-- Gia' eseguita su Supabase (migrazione gest_voti_1nov2026). Per leggere i voti:
--   select v.created_at, i.nome_attivita, v.stelle, v.testo from gest_voti v
--   left join imprese i on i.user_id=v.user_id order by v.created_at desc;
create table if not exists public.gest_voti (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  stelle smallint not null check (stelle between 1 and 5),
  testo text check (testo is null or length(testo) <= 2000),
  pagina text check (pagina is null or length(pagina) <= 60),
  created_at timestamptz not null default now()
);
alter table public.gest_voti enable row level security;
create policy gest_voti_insert_proprio on public.gest_voti for insert to authenticated with check (user_id = auth.uid());
create policy gest_voti_select_proprio on public.gest_voti for select to authenticated using (user_id = auth.uid() or public.sono_il_fondatore());
create policy gest_voti_update_proprio on public.gest_voti for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists gest_voti_user on public.gest_voti(user_id, created_at desc);
