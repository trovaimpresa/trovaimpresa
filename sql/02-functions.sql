-- =====================================================================
-- TrovaImpresa — Sistema crediti AI
-- File 2/2: FUNZIONI ATOMICHE
-- Incolla tutto in Supabase > SQL Editor > Run (dopo 01-schema.sql)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Quota per piano — modifica qui i numeri se cambi i piani
-- ---------------------------------------------------------------------
create or replace function public.quota_per_piano(p_plan public.ai_plan)
returns integer
language sql
immutable
as $$
  select case p_plan
    when 'base'   then 0
    when 'ai'     then 60
    when 'ai_pro' then 300
  end;
$$;

-- =====================================================================
-- consume_ai_credit — IL CUORE DEL SISTEMA
--
-- Atomica: fa SELECT ... FOR UPDATE, quindi due richieste parallele
-- dello stesso utente vengono serializzate. Impossibile consumare
-- 10 operazioni scalando 1 credito.
--
-- Ritorna JSON:
--   { ok: true,  log_id: uuid, remaining: int }
--   { ok: false, reason: text, remaining: int }
-- =====================================================================
create or replace function public.consume_ai_credit(
  p_feature text,
  p_cost    integer default 1
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user       uuid := auth.uid();
  v_acc        public.ai_accounts%rowtype;
  v_quota_left integer;
  v_available  integer;
  v_from_extra integer := 0;
  v_log_id     uuid;
  v_period     timestamptz := date_trunc('month', now());
begin
  if v_user is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated', 'remaining', 0);
  end if;

  if p_cost is null or p_cost < 1 then
    p_cost := 1;
  end if;

  -- LOCK sulla riga: qui si serializzano le richieste concorrenti
  select * into v_acc
  from public.ai_accounts
  where user_id = v_user
  for update;

  if not found then
    return json_build_object('ok', false, 'reason', 'no_account', 'remaining', 0);
  end if;

  -- Piano senza AI
  if v_acc.plan = 'base' then
    return json_build_object('ok', false, 'reason', 'plan_without_ai', 'remaining', 0);
  end if;

  -- Abbonamento scaduto
  if v_acc.subscription_expires_at is not null
     and v_acc.subscription_expires_at < now() then
    return json_build_object('ok', false, 'reason', 'subscription_expired', 'remaining', 0);
  end if;

  -- Reset mensile: la quota NON si accumula
  if v_acc.period_start < v_period then
    v_acc.credits_used  := 0;
    v_acc.period_start  := v_period;
    -- riallinea la quota al piano corrente (se hai cambiato i prezzi)
    v_acc.monthly_quota := public.quota_per_piano(v_acc.plan);
  end if;

  v_quota_left := greatest(v_acc.monthly_quota - v_acc.credits_used, 0);
  v_available  := v_quota_left + v_acc.credits_extra;

  -- CREDITI FINITI -> blocco
  if v_available < p_cost then
    update public.ai_accounts
       set credits_used  = v_acc.credits_used,
           period_start  = v_acc.period_start,
           monthly_quota = v_acc.monthly_quota,
           updated_at    = now()
     where user_id = v_user;

    return json_build_object('ok', false, 'reason', 'no_credits', 'remaining', v_available);
  end if;

  -- Scala prima dalla quota mensile, poi dalle ricariche
  if v_quota_left >= p_cost then
    v_acc.credits_used := v_acc.credits_used + p_cost;
  else
    v_from_extra        := p_cost - v_quota_left;
    v_acc.credits_used  := v_acc.monthly_quota;
    v_acc.credits_extra := v_acc.credits_extra - v_from_extra;
  end if;

  update public.ai_accounts
     set credits_used  = v_acc.credits_used,
         credits_extra = v_acc.credits_extra,
         period_start  = v_acc.period_start,
         monthly_quota = v_acc.monthly_quota,
         updated_at    = now()
   where user_id = v_user;

  insert into public.ai_usage_log (user_id, feature, credits_cost, status)
  values (v_user, p_feature, p_cost, 'pending')
  returning id into v_log_id;

  return json_build_object(
    'ok',        true,
    'log_id',    v_log_id,
    'remaining', v_available - p_cost
  );
end;
$$;

revoke all on function public.consume_ai_credit(text, integer) from public, anon;
grant execute on function public.consume_ai_credit(text, integer) to authenticated, service_role;


-- =====================================================================
-- refund_ai_credit — se l'AI fallisce, il credito torna indietro.
-- Chiamata solo dalla Edge Function con service_role.
-- =====================================================================
create or replace function public.refund_ai_credit(
  p_log_id uuid,
  p_error  text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log public.ai_usage_log%rowtype;
  v_acc public.ai_accounts%rowtype;
begin
  select * into v_log from public.ai_usage_log where id = p_log_id for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'log_not_found');
  end if;

  -- gia' processato: non rimborsare due volte
  if v_log.status <> 'pending' then
    return json_build_object('ok', false, 'reason', 'already_settled');
  end if;

  select * into v_acc from public.ai_accounts where user_id = v_log.user_id for update;

  -- Rimborsa nel periodo corrente se e' lo stesso, altrimenti come credito extra
  if v_acc.period_start = date_trunc('month', now()) then
    update public.ai_accounts
       set credits_used = greatest(credits_used - v_log.credits_cost, 0),
           updated_at   = now()
     where user_id = v_log.user_id;
  else
    update public.ai_accounts
       set credits_extra = credits_extra + v_log.credits_cost,
           updated_at    = now()
     where user_id = v_log.user_id;
  end if;

  update public.ai_usage_log
     set status = 'refunded', error_message = p_error
   where id = p_log_id;

  return json_build_object('ok', true);
end;
$$;

-- IMPORTANTE: Supabase concede di default l'EXECUTE su ogni nuova funzione
-- anche ad 'anon' e 'authenticated'. Vanno revocati ESPLICITAMENTE, altrimenti
-- un utente puo' rimborsarsi i crediti da solo dalla console del browser.
revoke all on function public.refund_ai_credit(uuid, text) from public, anon, authenticated;
grant execute on function public.refund_ai_credit(uuid, text) to service_role;


-- =====================================================================
-- settle_ai_usage — chiude il log con i token realmente consumati.
-- Serve a te per monitorare il margine reale.
-- =====================================================================
create or replace function public.settle_ai_usage(
  p_log_id        uuid,
  p_input_tokens  integer,
  p_output_tokens integer,
  p_cost_eur      numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage_log
     set status        = 'ok',
         input_tokens  = p_input_tokens,
         output_tokens = p_output_tokens,
         cost_eur      = p_cost_eur
   where id = p_log_id and status = 'pending';
end;
$$;

revoke all on function public.settle_ai_usage(uuid, integer, integer, numeric)
  from public, anon, authenticated;
grant execute on function public.settle_ai_usage(uuid, integer, integer, numeric) to service_role;


-- =====================================================================
-- get_ai_status — quanti crediti mi restano? (NON consuma nulla)
-- Usata dal badge nel frontend.
-- =====================================================================
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
begin
  select * into v_acc from public.ai_accounts where user_id = auth.uid();
  if not found then
    return json_build_object('has_ai', false, 'plan', 'base', 'remaining', 0);
  end if;

  -- Applica il reset mensile "virtualmente", senza scrivere
  if v_acc.period_start < date_trunc('month', now()) then
    v_used  := 0;
    v_quota := public.quota_per_piano(v_acc.plan);
  else
    v_used  := v_acc.credits_used;
    v_quota := v_acc.monthly_quota;
  end if;

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
    'renews_at',     (date_trunc('month', now()) + interval '1 month'),
    'expires_at',    v_acc.subscription_expires_at
  );
end;
$$;

revoke all on function public.get_ai_status() from public, anon;
grant execute on function public.get_ai_status() to authenticated, service_role;


-- =====================================================================
-- add_credits_pack — ricarica dopo un pagamento (Stripe webhook).
-- Idempotente grazie a payment_reference UNIQUE.
-- Solo service_role.
-- =====================================================================
create or replace function public.add_credits_pack(
  p_user_id           uuid,
  p_credits           integer,
  p_amount_eur        numeric,
  p_payment_provider  text,
  p_payment_reference text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_credit_purchases
    (user_id, credits, amount_eur, payment_provider, payment_reference)
  values
    (p_user_id, p_credits, p_amount_eur, p_payment_provider, p_payment_reference);

  update public.ai_accounts
     set credits_extra = credits_extra + p_credits,
         updated_at    = now()
   where user_id = p_user_id;

  return json_build_object('ok', true);
exception
  when unique_violation then
    -- webhook duplicato: non ricaricare due volte
    return json_build_object('ok', false, 'reason', 'already_processed');
end;
$$;

-- CRITICO: senza questo revoke un utente si autoricarica crediti gratis.
revoke all on function public.add_credits_pack(uuid, integer, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.add_credits_pack(uuid, integer, numeric, text, text) to service_role;


-- =====================================================================
-- set_plan — attiva/cambia piano dopo il pagamento dell'abbonamento.
-- Solo service_role.
-- =====================================================================
create or replace function public.set_plan(
  p_user_id uuid,
  p_plan    public.ai_plan,
  p_months  integer default 12
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_accounts
     set plan                    = p_plan,
         monthly_quota           = public.quota_per_piano(p_plan),
         credits_used            = 0,
         period_start            = date_trunc('month', now()),
         subscription_expires_at = greatest(coalesce(subscription_expires_at, now()), now())
                                   + (p_months || ' months')::interval,
         updated_at              = now()
   where user_id = p_user_id;

  return json_build_object('ok', true);
end;
$$;

-- CRITICO: senza questo revoke un utente si attiva il piano AI Pro da solo.
revoke all on function public.set_plan(uuid, public.ai_plan, integer)
  from public, anon, authenticated;
grant execute on function public.set_plan(uuid, public.ai_plan, integer) to service_role;


-- =====================================================================
-- VISTA MARGINI — quanto ti costa davvero l'AI, mese per mese
-- =====================================================================
create or replace view public.ai_margini_mensili as
select
  date_trunc('month', created_at) as mese,
  count(*)                        as operazioni,
  count(distinct user_id)         as utenti_attivi,
  sum(input_tokens)               as token_input,
  sum(output_tokens)              as token_output,
  round(sum(cost_eur), 2)         as costo_totale_eur,
  round(avg(cost_eur), 4)         as costo_medio_operazione_eur
from public.ai_usage_log
where status = 'ok'
group by 1
order by 1 desc;

-- Le viste bypassano la RLS: questa aggrega i costi di TUTTI gli utenti,
-- quindi va vista solo da te (SQL Editor = service_role).
revoke all on public.ai_margini_mensili from public, anon, authenticated;
grant select on public.ai_margini_mensili to service_role;
