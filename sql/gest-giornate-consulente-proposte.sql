-- =====================================================================
-- 3 novembre 2026 — GIORNATE: IL CONSULENTE E LE PROPOSTE DEGLI OPERAI
--
-- 1. IL CONSULENTE DEL LAVORO. In Giornate l'impresa scrive l'email del
--    consulente e accende «Mandagliele ogni mese». Il primo del mese
--    netlify/functions/giornate-consulente.js gli manda le giornate del
--    mese finito. cdl_ultimo = l'ultimo mese mandato («2026-10»): cosi'
--    lo stesso mese non parte mai due volte.
--
-- 2. LE PROPOSTE. Un operaio senza il permesso «Rapportini» racconta la
--    sua giornata; finisce qui, «da vedere». Il capo la vede in Giornate
--    e con «Approva» diventa una giornata vera (giorScrivi).
--    ⛔ L'operaio scrive SOLO per se stesso: operatore_id deve essere il
--       suo (gest_mio_operatore), e solo con il permesso «Lavori».
--    ⛔ Non tocca gest_ore: le ore le scrive il capo approvando.
-- =====================================================================
alter table public.gest_azienda add column if not exists cdl_email text;
alter table public.gest_azienda add column if not exists cdl_invio boolean not null default false;
alter table public.gest_azienda add column if not exists cdl_ultimo text;
alter table public.gest_azienda add column if not exists cdl_prova timestamptz;

create table if not exists public.gest_giornate_proposte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operatore_id uuid not null references public.gest_operatori(id) on delete cascade,
  membro_id uuid not null default auth.uid(),
  data date not null,
  dove text not null check (char_length(dove) between 1 and 120),
  cosa text check (char_length(cosa) <= 2000),
  stato text not null default 'da_vedere' check (stato in ('da_vedere','approvata','scartata')),
  creato_il timestamptz not null default now(),
  visto_il timestamptz
);
create index if not exists gest_giornate_proposte_user on public.gest_giornate_proposte(user_id, stato, data desc);
alter table public.gest_giornate_proposte enable row level security;

drop policy if exists gest_giornate_proposte_own on public.gest_giornate_proposte;
create policy gest_giornate_proposte_own on public.gest_giornate_proposte
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists gest_giornate_proposte_mie_read on public.gest_giornate_proposte;
create policy gest_giornate_proposte_mie_read on public.gest_giornate_proposte
  for select to authenticated using (membro_id = auth.uid());

drop policy if exists gest_giornate_proposte_mie_insert on public.gest_giornate_proposte;
create policy gest_giornate_proposte_mie_insert on public.gest_giornate_proposte
  for insert to authenticated with check (
    membro_id = auth.uid()
    and stato = 'da_vedere'
    and operatore_id = gest_mio_operatore(user_id)
    and gest_puo_sezione(user_id, 'lavori')
  );

-- freno: un operaio non puo' mandare piu' di 30 proposte in un giorno
create or replace function public.gest_giornate_proposte_freno()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.membro_id is distinct from new.user_id then
    if (select count(*) from gest_giornate_proposte
         where membro_id = new.membro_id and creato_il > now() - interval '1 day') >= 30 then
      raise exception 'Troppe giornate mandate oggi. Riprova domani.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_gest_giornate_proposte_freno on public.gest_giornate_proposte;
create trigger trg_gest_giornate_proposte_freno before insert on public.gest_giornate_proposte
  for each row execute function public.gest_giornate_proposte_freno();

grant select, insert, update, delete on public.gest_giornate_proposte to authenticated;
