-- 19 nov 2026 — IL FONDATORE NON CONSUMA CREDITI AI.
-- Deciso da Alex il 10 nov per i messaggi della chat (chat_stato); oggi anche
-- per i crediti AI (pratica, cliente, documento, preventivo, firma SMS...).
-- I due account sono quelli di sono_il_fondatore(): pintoalessio@icloud.com e
-- info@trovaimpresa.com. Si scrive lo stesso una riga nel registro, con
-- credits_cost = 0: se la funzione poi «rimborsa», non regala crediti.
-- ⛔ Chi cambia consume_ai_credit cambia anche get_ai_status (vedi il commento li').

create or replace function public.consume_ai_credit(p_feature text, p_cost integer default 1)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_chi uuid := auth.uid(); v_user uuid; v_acc public.ai_accounts%rowtype;
  v_iscritto boolean; v_quota_left integer; v_available integer;
  v_from_extra integer := 0; v_log_id uuid; v_period timestamptz := date_trunc('month', now());
begin
  if v_chi is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated', 'remaining', 0);
  end if;
  v_user := public.ai_conto_di(v_chi);
  -- 19 nov 2026: il fondatore non ha limite
  if public.sono_il_fondatore() then
    insert into public.ai_usage_log (user_id, feature, credits_cost, status, usato_da)
    values (coalesce(v_user, v_chi), p_feature, 0, 'pending', v_chi) returning id into v_log_id;
    return json_build_object('ok', true, 'log_id', v_log_id, 'remaining', 9999, 'fondatore', true);
  end if;
  if p_cost is null or p_cost < 1 then p_cost := 1; end if;
  select * into v_acc from public.ai_accounts where user_id = v_user for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_account', 'remaining', 0);
  end if;
  v_iscritto := public.ai_iscritto(v_user);
  -- 1 nov 2026: si ferma solo chi NON e' iscritto e non ha crediti comprati
  if not v_iscritto and coalesce(v_acc.credits_extra, 0) <= 0 then
    return json_build_object('ok', false, 'reason', 'plan_without_ai', 'remaining', 0);
  end if;
  if v_acc.subscription_expires_at is not null and v_acc.subscription_expires_at < now() then
    return json_build_object('ok', false, 'reason', 'subscription_expired', 'remaining', 0);
  end if;
  if v_acc.period_start < v_period then
    v_acc.credits_used  := 0;
    v_acc.period_start  := v_period;
    v_acc.monthly_quota := public.quota_ai(v_acc.plan, v_iscritto);
  end if;
  v_quota_left := greatest(v_acc.monthly_quota - v_acc.credits_used, 0);
  v_available  := v_quota_left + v_acc.credits_extra;
  if v_available < p_cost then
    update public.ai_accounts
       set credits_used = v_acc.credits_used, period_start = v_acc.period_start,
           monthly_quota = v_acc.monthly_quota, updated_at = now()
     where user_id = v_user;
    return json_build_object('ok', false, 'reason', 'no_credits', 'remaining', v_available);
  end if;
  if v_quota_left >= p_cost then
    v_acc.credits_used := v_acc.credits_used + p_cost;
  else
    v_from_extra        := p_cost - v_quota_left;
    v_acc.credits_used  := v_acc.monthly_quota;
    v_acc.credits_extra := v_acc.credits_extra - v_from_extra;
  end if;
  update public.ai_accounts
     set credits_used = v_acc.credits_used, credits_extra = v_acc.credits_extra,
         period_start = v_acc.period_start, monthly_quota = v_acc.monthly_quota, updated_at = now()
   where user_id = v_user;
  insert into public.ai_usage_log (user_id, feature, credits_cost, status, usato_da)
  values (v_user, p_feature, p_cost, 'pending', v_chi) returning id into v_log_id;
  return json_build_object('ok', true, 'log_id', v_log_id, 'remaining', v_available - p_cost);
end;
$function$;

create or replace function public.consume_ai_credit_pagati(p_feature text, p_cost integer default 1)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_chi uuid := auth.uid(); v_user uuid; v_acc public.ai_accounts%rowtype;
  v_iscritto boolean; v_pagante boolean; v_quota_left integer; v_available integer;
  v_from_extra integer := 0; v_log_id uuid; v_period timestamptz := date_trunc('month', now());
begin
  if v_chi is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated', 'remaining', 0);
  end if;
  v_user := public.ai_conto_di(v_chi);
  -- 19 nov 2026: il fondatore non ha limite (anche la firma SMS)
  if public.sono_il_fondatore() then
    insert into public.ai_usage_log (user_id, feature, credits_cost, status, usato_da)
    values (coalesce(v_user, v_chi), p_feature, 0, 'pending', v_chi) returning id into v_log_id;
    return json_build_object('ok', true, 'log_id', v_log_id, 'remaining', 9999, 'fondatore', true);
  end if;
  if p_cost is null or p_cost < 1 then p_cost := 1; end if;
  select * into v_acc from public.ai_accounts where user_id = v_user for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_paid_credits', 'remaining', 0);
  end if;
  v_iscritto := public.ai_iscritto(v_user);
  v_pagante  := v_acc.plan in ('ai', 'ai_pro')
                and (v_acc.subscription_expires_at is null or v_acc.subscription_expires_at >= now());
  if v_acc.period_start < v_period then
    v_acc.credits_used  := 0;
    v_acc.period_start  := v_period;
    v_acc.monthly_quota := public.quota_ai(v_acc.plan, v_iscritto);
  end if;
  v_quota_left := case when v_pagante then greatest(v_acc.monthly_quota - v_acc.credits_used, 0) else 0 end;
  v_available  := v_quota_left + coalesce(v_acc.credits_extra, 0);
  if v_available < p_cost then
    update public.ai_accounts
       set credits_used = v_acc.credits_used, period_start = v_acc.period_start,
           monthly_quota = v_acc.monthly_quota, updated_at = now()
     where user_id = v_user;
    return json_build_object('ok', false, 'reason', 'no_paid_credits', 'remaining', v_available);
  end if;
  if v_quota_left >= p_cost then
    v_acc.credits_used := v_acc.credits_used + p_cost;
  else
    v_from_extra        := p_cost - v_quota_left;
    v_acc.credits_used  := v_acc.credits_used + v_quota_left;
    v_acc.credits_extra := v_acc.credits_extra - v_from_extra;
  end if;
  update public.ai_accounts
     set credits_used = v_acc.credits_used, credits_extra = v_acc.credits_extra,
         period_start = v_acc.period_start, monthly_quota = v_acc.monthly_quota, updated_at = now()
   where user_id = v_user;
  insert into public.ai_usage_log (user_id, feature, credits_cost, status, usato_da)
  values (v_user, p_feature, p_cost, 'pending', v_chi) returning id into v_log_id;
  return json_build_object('ok', true, 'log_id', v_log_id, 'remaining', v_available - p_cost);
end;
$function$;

create or replace function public.get_ai_status()
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_chi uuid := auth.uid(); v_conto uuid; v_acc public.ai_accounts%rowtype;
  v_mio public.ai_accounts%rowtype; v_used integer; v_quota integer; v_quota_left integer;
  v_help_used integer; v_iscritto boolean; v_puo boolean;
begin
  -- 19 nov 2026: il fondatore non ha limite (come in consume_ai_credit)
  if public.sono_il_fondatore() then
    return json_build_object('has_ai', true, 'plan', 'fondatore', 'monthly_quota', 9999, 'monthly_left', 9999,
      'credits_extra', 0, 'remaining', 9999, 'chat_extra', 0, 'help_left', 9999,
      'renews_at', (date_trunc('month', now()) + interval '1 month'), 'expires_at', null, 'fondatore', true);
  end if;
  v_conto := public.ai_conto_di(v_chi);
  v_help_used := 0;
  select * into v_mio from public.ai_accounts where user_id = v_chi;
  if found and v_mio.help_period_start >= date_trunc('month', now()) then
    v_help_used := v_mio.help_used;
  end if;
  select * into v_acc from public.ai_accounts where user_id = v_conto;
  if not found then
    return json_build_object('has_ai', false, 'plan', 'base', 'remaining', 0, 'chat_extra', 0,
                             'help_left', greatest(public.quota_help() - v_help_used, 0));
  end if;
  v_iscritto := public.ai_iscritto(v_conto);
  if v_acc.period_start < date_trunc('month', now()) then
    v_used := 0; v_quota := public.quota_ai(v_acc.plan, v_iscritto);
  else
    v_used := v_acc.credits_used; v_quota := v_acc.monthly_quota;
  end if;
  v_quota_left := greatest(v_quota - v_used, 0);
  -- copiata da consume_ai_credit: se cambia una, cambia l'altra
  v_puo := (v_acc.plan <> 'base' or v_iscritto or coalesce(v_acc.credits_extra, 0) > 0)
           and (v_acc.subscription_expires_at is null or v_acc.subscription_expires_at > now());
  return json_build_object(
    'has_ai', v_puo, 'plan', v_acc.plan, 'monthly_quota', v_quota, 'monthly_left', v_quota_left,
    'credits_extra', v_acc.credits_extra, 'remaining', v_quota_left + v_acc.credits_extra,
    'chat_extra', coalesce(v_acc.chat_extra, 0),
    'help_left', greatest(public.quota_help() - v_help_used, 0),
    'renews_at', (date_trunc('month', now()) + interval '1 month'),
    'expires_at', v_acc.subscription_expires_at);
end;
$function$;
