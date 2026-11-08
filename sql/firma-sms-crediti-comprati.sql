-- ============================================================
-- 8 NOVEMBRE 2026 — LA FIRMA CON CODICE SMS SI PAGA SOLO COI CREDITI COMPRATI
-- ============================================================
-- Openapi fa pagare ogni firma a TrovaImpresa (~0,49 €). I 30 crediti al mese
-- che ogni iscritto riceve GRATIS (quota_ai con plan 'base') non devono
-- pagarla: se no la firma la paga Alessio senza incassare niente.
--
-- Questa funzione e' gemella di consume_ai_credit, con UNA differenza:
--   • plan 'base'  → prende SOLO da credits_extra (comprati con Stripe)
--   • plan pagato ('ai', 'ai_pro') → prima la quota del mese (e' pagata
--     con l'abbonamento), poi i comprati
-- Il rimborso resta refund_ai_credit (rimette su credits_extra).
-- consume_ai_credit NON e' stata toccata.
-- ============================================================

create or replace function public.consume_ai_credit_pagati(p_feature text, p_cost integer default 1)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_chi uuid := auth.uid(); v_user uuid; v_acc public.ai_accounts%rowtype;
  v_iscritto boolean; v_pagante boolean; v_quota_left integer; v_available integer;
  v_from_extra integer := 0; v_log_id uuid; v_period timestamptz := date_trunc('month', now());
begin
  if v_chi is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated', 'remaining', 0);
  end if;
  v_user := public.ai_conto_di(v_chi);
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
  -- la quota del mese conta solo se e' pagata con un abbonamento
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

revoke all on function public.consume_ai_credit_pagati(text, integer) from public, anon;
grant execute on function public.consume_ai_credit_pagati(text, integer) to authenticated;
