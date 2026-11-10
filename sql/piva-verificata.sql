-- 10 nov 2026 — IL BOLLINO «VERIFICATA» DIVENTA AUTOMATICO (P.IVA controllata)
--
-- 1) LA FALLA: fino a oggi un'impresa poteva scriversi `verificata = true`
--    da sola dal browser (regola imprese_update_owner, colonna non protetta;
--    la protezione c'era solo per albo_verificato). Adesso `verificata` e le
--    colonne del controllo P.IVA le scrivono SOLO il server (service_role) e
--    l'SQL Editor. Dal browser si ignorano, sia all'INSERT sia all'UPDATE.
-- 2) Se l'impresa CAMBIA la P.IVA, il controllo si rifa' da capo:
--    piva_stato torna vuoto e, se il bollino veniva dal controllo automatico,
--    il bollino si spegne finche' la P.IVA nuova non risulta valida.
-- 3) Il controllo lo fa netlify/functions/verifica-piva.js (ogni ora): prende
--    le imprese con P.IVA scritta e piva_stato vuoto, chiede all'archivio
--    europeo VIES, e scrive il risultato. Valida -> verificata = true.

alter table public.imprese
  add column if not exists piva_stato text,            -- null = da controllare · 'valida' · 'non_valida'
  add column if not exists piva_controllata_il timestamptz,
  add column if not exists piva_nome text;             -- il nome che risulta all'Agenzia (per l'admin)

create or replace function public.imprese_proteggi_verifica()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_ruolo text;
begin
  v_ruolo := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims',     true), '')::jsonb ->> 'role',
    'postgres');

  if v_ruolo in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verificata          := false;
    new.piva_stato          := null;
    new.piva_controllata_il := null;
    new.piva_nome           := null;
    return new;
  end if;

  -- dal browser queste colonne non si toccano
  new.verificata          := old.verificata;
  new.piva_stato          := old.piva_stato;
  new.piva_controllata_il := old.piva_controllata_il;
  new.piva_nome           := old.piva_nome;

  -- P.IVA cambiata: si ricontrolla. Il bollino si spegne solo se veniva dal
  -- controllo automatico (quello messo a mano dall'admin resta).
  if regexp_replace(coalesce(new.partita_iva, ''), '\D', '', 'g')
     is distinct from regexp_replace(coalesce(old.partita_iva, ''), '\D', '', 'g') then
    if old.piva_stato = 'valida' then
      new.verificata := false;
    end if;
    new.piva_stato          := null;
    new.piva_controllata_il := null;
    new.piva_nome           := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_proteggi_verifica on public.imprese;
create trigger trg_proteggi_verifica
  before insert or update on public.imprese
  for each row execute function public.imprese_proteggi_verifica();
