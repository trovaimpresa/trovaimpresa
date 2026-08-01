-- =====================================================================
-- TrovaImpresa — Assistente "Come si fa" (GRATIS per tutti)
-- Quota separata dai crediti a pagamento: chi e' sul piano base
-- puo' comunque farsi aiutare. Costo per te: ~5€/anno su 40 clienti.
--
-- Incolla in Supabase > SQL Editor > Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Contatore separato per l'aiuto
-- ---------------------------------------------------------------------
alter table public.ai_accounts
  add column if not exists help_used         integer     not null default 0,
  add column if not exists help_period_start timestamptz not null default date_trunc('month', now());

-- ---------------------------------------------------------------------
-- 2. Quota mensile di domande gratuite — cambia qui il numero
-- ---------------------------------------------------------------------
create or replace function public.quota_help()
returns integer language sql immutable as $$ select 30 $$;

-- ---------------------------------------------------------------------
-- 3. Scalo atomico dell'aiuto (stessa logica anti-abuso dei crediti)
-- ---------------------------------------------------------------------
create or replace function public.consume_help_credit()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_acc    public.ai_accounts%rowtype;
  v_period timestamptz := date_trunc('month', now());
  v_left   integer;
begin
  if v_user is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated', 'remaining', 0);
  end if;

  select * into v_acc from public.ai_accounts where user_id = v_user for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_account', 'remaining', 0);
  end if;

  -- reset mensile
  if v_acc.help_period_start < v_period then
    v_acc.help_used         := 0;
    v_acc.help_period_start := v_period;
  end if;

  v_left := public.quota_help() - v_acc.help_used;

  if v_left < 1 then
    update public.ai_accounts
       set help_used = v_acc.help_used, help_period_start = v_acc.help_period_start
     where user_id = v_user;
    return json_build_object('ok', false, 'reason', 'no_help_credits', 'remaining', 0);
  end if;

  update public.ai_accounts
     set help_used         = v_acc.help_used + 1,
         help_period_start = v_acc.help_period_start,
         updated_at        = now()
   where user_id = v_user;

  return json_build_object('ok', true, 'remaining', v_left - 1);
end;
$$;

revoke all on function public.consume_help_credit() from public, anon;
grant execute on function public.consume_help_credit() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3b. Restituzione della domanda se l'AI fallisce (solo service_role)
-- ---------------------------------------------------------------------
create or replace function public.restituisci_help(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_accounts
     set help_used = greatest(help_used - 1, 0), updated_at = now()
   where user_id = p_user_id;
end;
$$;

revoke all on function public.restituisci_help(uuid) from public, anon, authenticated;
grant execute on function public.restituisci_help(uuid) to service_role;

-- ---------------------------------------------------------------------
-- 4. get_ai_status espone anche l'aiuto residuo
-- ---------------------------------------------------------------------
create or replace function public.get_ai_status()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acc        public.ai_accounts%rowtype;
  v_used       integer;
  v_quota      integer;
  v_quota_left integer;
  v_help_used  integer;
begin
  select * into v_acc from public.ai_accounts where user_id = auth.uid();
  if not found then
    return json_build_object('has_ai', false, 'plan', 'base',
                             'remaining', 0, 'help_left', public.quota_help());
  end if;

  if v_acc.period_start < date_trunc('month', now()) then
    v_used := 0; v_quota := public.quota_per_piano(v_acc.plan);
  else
    v_used := v_acc.credits_used; v_quota := v_acc.monthly_quota;
  end if;

  v_help_used := case when v_acc.help_period_start < date_trunc('month', now())
                      then 0 else v_acc.help_used end;

  v_quota_left := greatest(v_quota - v_used, 0);

  return json_build_object(
    'has_ai',        v_acc.plan <> 'base'
                     and (v_acc.subscription_expires_at is null
                          or v_acc.subscription_expires_at > now()),
    'plan',          v_acc.plan,
    'monthly_quota', v_quota,
    'monthly_left',  v_quota_left,
    'credits_extra', v_acc.credits_extra,
    'remaining',     v_quota_left + v_acc.credits_extra,
    'help_left',     greatest(public.quota_help() - v_help_used, 0),
    'renews_at',     (date_trunc('month', now()) + interval '1 month'),
    'expires_at',    v_acc.subscription_expires_at
  );
end;
$$;

revoke all on function public.get_ai_status() from public, anon;
grant execute on function public.get_ai_status() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5. Vista: chi chiede aiuto e su cosa (ti dice dove il prodotto
--    non si capisce — vale piu' di qualsiasi sondaggio)
-- ---------------------------------------------------------------------
create or replace view public.ai_domande_aiuto as
select date_trunc('day', created_at) as giorno,
       count(*)                      as domande,
       count(distinct user_id)       as utenti
from public.ai_usage_log
where feature = 'assistente' and status = 'ok'
group by 1 order by 1 desc;

revoke all on public.ai_domande_aiuto from public, anon, authenticated;
grant select on public.ai_domande_aiuto to service_role;
