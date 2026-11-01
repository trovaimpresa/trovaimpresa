-- =====================================================================
-- LE VERSIONI DEL CAPITOLATO — 1 novembre 2026 (approvato da Alex con le foto)
--
-- Ogni volta che si preme «Salva capitolato» e il testo e' cambiato, il
-- capitolato DI PRIMA finisce qui. Dalla finestra del capitolato,
-- «Versioni (n)» le elenca: Vedi · Ripristina. Ripristinare rimette la
-- versione nelle caselle; diventa vera solo col Salva (che a sua volta
-- mette da parte quella che c'era): quindi si torna sempre indietro.
--
-- ⛔ Si tengono le ultime 30 per preventivo: le piu' vecchie le toglie il
--    trigger qui sotto. Il capitolato e' testo, 30 versioni pesano poco.
-- ⛔ Va col preventivo: on delete cascade. Il preventivo nel Cestino NON
--    e' cancellato, quindi le versioni restano finche' non si svuota.
-- ⛔ Le foto: js/gest-capitolato.js non cancella piu' dal deposito un file
--    che sta ancora in una versione, se no il ripristino tornerebbe senza foto.
--
-- ✅ Eseguito su Supabase il 1 nov 2026 (migrazione gest_capitolato_versioni_1nov2026).
-- =====================================================================

create table if not exists public.gest_capitolato_versioni (
  id            uuid primary key default gen_random_uuid(),
  preventivo_id uuid not null references public.gest_preventivi(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  capitolato    jsonb not null check (jsonb_typeof(capitolato) = 'object'),
  creato_il     timestamptz not null default now()
);
create index if not exists gest_capitolato_versioni_prev_idx
  on public.gest_capitolato_versioni(preventivo_id, creato_il desc);

alter table public.gest_capitolato_versioni enable row level security;

drop policy if exists gest_capitolato_versioni_own on public.gest_capitolato_versioni;
create policy gest_capitolato_versioni_own on public.gest_capitolato_versioni
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists gest_capitolato_versioni_team_read on public.gest_capitolato_versioni;
create policy gest_capitolato_versioni_team_read on public.gest_capitolato_versioni
  for select using (public.gest_puo_accedere(user_id));

-- ⛔ Il preventivo deve essere DELL'IMPRESA che scrive.
create or replace function public.gest_capitolato_versioni_controlla()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from gest_preventivi p where p.id = new.preventivo_id and p.user_id = new.user_id) then
    raise exception 'Preventivo non tuo' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.gest_capitolato_versioni_controlla() from public, anon, authenticated;
drop trigger if exists gest_capitolato_versioni_tuo on public.gest_capitolato_versioni;
create trigger gest_capitolato_versioni_tuo before insert or update on public.gest_capitolato_versioni
  for each row execute function public.gest_capitolato_versioni_controlla();

-- le ultime 30 per preventivo
create or replace function public.gest_capitolato_versioni_pota()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from gest_capitolato_versioni v
   where v.preventivo_id = new.preventivo_id
     and v.id in (select id from gest_capitolato_versioni
                   where preventivo_id = new.preventivo_id
                   order by creato_il desc offset 30);
  return null;
end $$;
revoke execute on function public.gest_capitolato_versioni_pota() from public, anon, authenticated;
drop trigger if exists gest_capitolato_versioni_pota on public.gest_capitolato_versioni;
create trigger gest_capitolato_versioni_pota after insert on public.gest_capitolato_versioni
  for each row execute function public.gest_capitolato_versioni_pota();
