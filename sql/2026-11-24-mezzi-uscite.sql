-- ============================================================
-- USCITE E RIENTRI DEI MEZZI — 24 novembre 2026
-- Chi prende il furgone, quando, con quanti km, dove va; e quando
-- torna con quanti km. Lo scrive il titolare dal gestionale (voce
-- Mezzi e attrezzature) oppure l'operaio dalla sua app (scheda Mezzi).
--
-- ⚠️ L'operaio NON scrive la tabella direttamente: passa da tre
--    funzioni (gest_mezzi_operaio, gest_mezzo_prendo,
--    gest_mezzo_riporto) che controllano chi e' e se ha il permesso
--    «mezzi». Cosi' non vede costi, tariffe e note dei mezzi.
-- ⚠️ Un mezzo puo' avere UNA sola uscita aperta (indice unico):
--    due operai che premono insieme «Prendo questo» → il secondo
--    riceve «gia_fuori».
-- ⚠️ Permesso «mezzi»: casella mai toccata (null o {}) = si', come
--    le altre spunte di partenza; scritta = vale quella.
-- ============================================================

alter table public.gest_mezzi add column if not exists km_attuali numeric;

create table if not exists public.gest_mezzi_uscite (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,                       -- l'impresa (il titolare)
  mezzo_id      uuid not null references public.gest_mezzi(id) on delete cascade,
  operatore_id  uuid references public.gest_operatori(id) on delete set null,
  chi_nome      text,                                -- il nome com'era quel giorno
  lavoro_id     uuid references public.gest_lavori(id) on delete set null,
  motivo        text,
  km_uscita     numeric,
  km_rientro    numeric,
  uscita_il     timestamptz not null default now(),
  rientro_il    timestamptz,
  creato_da     uuid default auth.uid(),
  eliminato_il  timestamptz,
  created_at    timestamptz default now()
);

create index if not exists gest_mezzi_uscite_mezzo on public.gest_mezzi_uscite (mezzo_id, uscita_il desc);
create unique index if not exists gest_mezzi_uscite_una_aperta
  on public.gest_mezzi_uscite (mezzo_id) where rientro_il is null and eliminato_il is null;

alter table public.gest_mezzi_uscite enable row level security;

drop policy if exists gest_mezzi_uscite_own on public.gest_mezzi_uscite;
create policy gest_mezzi_uscite_own on public.gest_mezzi_uscite
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists trg_gest_stesso_padrone on public.gest_mezzi_uscite;
create trigger trg_gest_stesso_padrone before insert or update on public.gest_mezzi_uscite
  for each row execute function gest_stesso_padrone();
drop trigger if exists trg_gest_piano on public.gest_mezzi_uscite;
create trigger trg_gest_piano before insert or delete or update on public.gest_mezzi_uscite
  for each row execute function gest_blocco_piano('user_id');

-- chi sono io per questa impresa, e posso prendere i mezzi?
create or replace function public.gest_mezzi_io(_impresa uuid)
returns uuid language sql stable security definer
set search_path to 'public','pg_catalog' as $$
  select m.operatore_id from gest_membri m
   where m.impresa_id = _impresa and m.membro_id = auth.uid() and m.stato = 'attivo'
     and m.operatore_id is not null
     and (m.permessi is null or m.permessi = '{}'::jsonb
          or coalesce(m.permessi -> 'mezzi','false'::jsonb) in ('true'::jsonb,'"true"'::jsonb))
   limit 1;
$$;

-- l'elenco per l'app: solo quello che serve, niente costi ne' note
create or replace function public.gest_mezzi_operaio(_impresa uuid)
returns jsonb language plpgsql stable security definer
set search_path to 'public','pg_catalog' as $$
declare io uuid;
begin
  io := gest_mezzi_io(_impresa);
  if io is null then return jsonb_build_object('ok',false,'errore','permesso'); end if;
  return jsonb_build_object('ok',true,'io',io,'mezzi',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',z.id,'nome',z.nome,'targa',z.targa,'tipo',z.tipo,'stato',z.stato,
      'km',coalesce(z.km_attuali,(select max(greatest(coalesce(u.km_rientro,0),coalesce(u.km_uscita,0)))
                                  from gest_mezzi_uscite u where u.mezzo_id=z.id and u.eliminato_il is null)),
      'aperta',(select jsonb_build_object('id',u.id,'chi',u.chi_nome,'mia',u.operatore_id=io,
                        'uscita_il',u.uscita_il,'km_uscita',u.km_uscita,'lavoro_id',u.lavoro_id)
                  from gest_mezzi_uscite u
                 where u.mezzo_id=z.id and u.rientro_il is null and u.eliminato_il is null limit 1)
    ) order by z.nome)
    from gest_mezzi z
   where z.user_id=_impresa and z.eliminato_il is null
     and coalesce(z.categoria,'mezzo')<>'attrezzatura'),'[]'::jsonb));
end $$;

create or replace function public.gest_mezzo_prendo(_impresa uuid, _mezzo uuid, _km numeric, _lavoro uuid, _motivo text)
returns jsonb language plpgsql security definer
set search_path to 'public','pg_catalog' as $$
declare io uuid; nome_io text; chi text; nuovo uuid;
begin
  io := gest_mezzi_io(_impresa);
  if io is null then return jsonb_build_object('ok',false,'errore','permesso'); end if;
  if not exists (select 1 from gest_mezzi where id=_mezzo and user_id=_impresa and eliminato_il is null) then
    return jsonb_build_object('ok',false,'errore','mezzo');
  end if;
  if _km is not null and (_km < 0 or _km > 9999999) then
    return jsonb_build_object('ok',false,'errore','km');
  end if;
  if _lavoro is not null and not exists (select 1 from gest_lavori where id=_lavoro and user_id=_impresa) then
    _lavoro := null;
  end if;
  select chi_nome into chi from gest_mezzi_uscite
   where mezzo_id=_mezzo and rientro_il is null and eliminato_il is null limit 1;
  if found then return jsonb_build_object('ok',false,'errore','gia_fuori','chi',chi); end if;
  select nome into nome_io from gest_operatori where id=io;
  begin
    insert into gest_mezzi_uscite(user_id,mezzo_id,operatore_id,chi_nome,lavoro_id,motivo,km_uscita)
    values (_impresa,_mezzo,io,nome_io,_lavoro,nullif(left(trim(coalesce(_motivo,'')),300),''),_km)
    returning id into nuovo;
  exception when unique_violation then
    return jsonb_build_object('ok',false,'errore','gia_fuori');
  end;
  if _km is not null then
    update gest_mezzi set km_attuali=_km where id=_mezzo and (km_attuali is null or km_attuali<_km);
  end if;
  return jsonb_build_object('ok',true,'id',nuovo);
end $$;

create or replace function public.gest_mezzo_riporto(_impresa uuid, _uscita uuid, _km numeric)
returns jsonb language plpgsql security definer
set search_path to 'public','pg_catalog' as $$
declare io uuid; u record;
begin
  io := gest_mezzi_io(_impresa);
  if io is null then return jsonb_build_object('ok',false,'errore','permesso'); end if;
  select * into u from gest_mezzi_uscite
   where id=_uscita and user_id=_impresa and rientro_il is null and eliminato_il is null;
  if not found then return jsonb_build_object('ok',false,'errore','non_aperta'); end if;
  if u.operatore_id is distinct from io then return jsonb_build_object('ok',false,'errore','non_tua'); end if;
  if _km is not null and (_km < 0 or _km > 9999999) then return jsonb_build_object('ok',false,'errore','km'); end if;
  if _km is not null and u.km_uscita is not null and _km < u.km_uscita then
    return jsonb_build_object('ok',false,'errore','km_bassi','km_uscita',u.km_uscita);
  end if;
  update gest_mezzi_uscite set rientro_il=now(), km_rientro=_km where id=_uscita;
  if _km is not null then
    update gest_mezzi set km_attuali=_km where id=u.mezzo_id and (km_attuali is null or km_attuali<_km);
  end if;
  return jsonb_build_object('ok',true,'km_fatti',case when _km is not null and u.km_uscita is not null then _km-u.km_uscita end);
end $$;

revoke all on function public.gest_mezzi_io(uuid) from public, anon;
revoke all on function public.gest_mezzi_operaio(uuid) from public, anon;
revoke all on function public.gest_mezzo_prendo(uuid,uuid,numeric,uuid,text) from public, anon;
revoke all on function public.gest_mezzo_riporto(uuid,uuid,numeric) from public, anon;
grant execute on function public.gest_mezzi_operaio(uuid) to authenticated;
grant execute on function public.gest_mezzo_prendo(uuid,uuid,numeric,uuid,text) to authenticated;
grant execute on function public.gest_mezzo_riporto(uuid,uuid,numeric) to authenticated;
