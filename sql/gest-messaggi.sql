-- 11 ottobre 2026 — CHAT tra titolare e squadra: una per ogni lavoro + una generale per ogni persona.
-- lavoro_id valorizzato = chat di quel lavoro (la vedono il titolare e chi ha il permesso «lavori»).
-- lavoro_id vuoto      = chat generale con UNA persona (la vedono il titolare e quella persona soltanto).
-- Additivo: non cambia nessuna tabella esistente. Niente cancellazione dei messaggi (per ora).
create table if not exists public.gest_messaggi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                 -- l'impresa (titolare)
  operatore_id uuid,                     -- la persona della squadra (chat generale) o chi scrive
  lavoro_id uuid,                        -- vuoto = chat generale
  autore text not null default 'operaio' check (autore in ('titolare','operaio')),
  autore_nome text,
  testo text not null check (char_length(testo) between 1 and 2000),
  letto_il timestamptz,                  -- quando l'ha letto l'ALTRA parte
  created_at timestamptz not null default now()
);
create index if not exists gest_msg_lavoro_idx on public.gest_messaggi(lavoro_id, created_at);
create index if not exists gest_msg_op_idx on public.gest_messaggi(user_id, operatore_id, created_at);
alter table public.gest_messaggi enable row level security;

drop policy if exists msg_accesso on public.gest_messaggi;
create policy msg_accesso on public.gest_messaggi for all
  using (
    user_id = auth.uid()
    or (lavoro_id is not null and public.gest_puo_sezione(user_id, 'lavori'))
    or (lavoro_id is null and exists (
          select 1 from public.gest_membri m
           where m.membro_id = auth.uid() and m.impresa_id = gest_messaggi.user_id
             and m.stato = 'attivo' and m.operatore_id = gest_messaggi.operatore_id))
  )
  with check (
    user_id = auth.uid()
    or (lavoro_id is not null and public.gest_puo_sezione(user_id, 'lavori'))
    or (lavoro_id is null and exists (
          select 1 from public.gest_membri m
           where m.membro_id = auth.uid() and m.impresa_id = gest_messaggi.user_id
             and m.stato = 'attivo' and m.operatore_id = gest_messaggi.operatore_id))
  );

-- chi scrive non puo' fingersi un altro, e un messaggio non si riscrive: si puo' solo segnare «letto»
create or replace function public.gest_messaggi_guardia() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if tg_op = 'INSERT' then
    new.autore := case when new.user_id = auth.uid() then 'titolare' else 'operaio' end;
    new.letto_il := null;
    new.created_at := now();
    return new;
  end if;
  if (to_jsonb(new) - 'letto_il') is distinct from (to_jsonb(old) - 'letto_il') then
    raise exception 'Un messaggio non si puo'' modificare.';
  end if;
  return new;
end $$;
drop trigger if exists trg_gest_messaggi_guardia on public.gest_messaggi;
create trigger trg_gest_messaggi_guardia before insert or update on public.gest_messaggi
  for each row execute function public.gest_messaggi_guardia();
