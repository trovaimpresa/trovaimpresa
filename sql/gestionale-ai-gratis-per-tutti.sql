-- ═══ 1 novembre 2026 — IL GESTIONALE CON AI E' GRATIS PER TUTTI ═══════════
-- Deciso da Alessio: via il gestionale base, resta solo quello con l'AI e
-- diventa gratis. Si pagano solo i pacchetti (crediti e messaggi chat).
-- Ogni iscritto (= ha una riga in `imprese`) ha ogni mese:
--   30 crediti AI  (Compila/Genera con AI, Parla, capitolato...)
--   50 messaggi della Chat con AI
-- Chi ha gia' un piano pagato tiene il suo (ai = 100, ai_pro = 300, chat_pro = 300).
-- ⛔ I due numeri stanno in UN posto solo ciascuno:
--    30 -> quota_ai()      50 -> chat_stato()

-- chi e' iscritto: ha una riga in imprese
create or replace function public.ai_iscritto(p_user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select p_user is not null and exists (select 1 from public.imprese i where i.user_id = p_user);
$$;

-- il secondo parametro ora vuol dire «e' iscritto», non «ha il Premium»
create or replace function public.quota_ai(p_plan ai_plan, p_premium boolean)
returns integer language sql immutable as $$
  select case
    when p_plan = 'ai_pro' then 300
    when p_plan = 'ai'     then 100   -- chi aveva pagato il Gestionale AI
    when p_premium         then 30    -- 1 nov 2026: ogni iscritto, gratis
    else 0                            -- non iscritto (es. un cliente)
  end;
$$;

-- allinea il conto AI: la quota la decide l'essere iscritto
create or replace function public.ai_allinea_piano(p_user_id uuid)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare
  v_piano text; v_scad timestamptz; v_chatpro boolean; v_chatscad timestamptz;
  v_trovata boolean; v_premium boolean; v_ai boolean; v_fine timestamptz;
  v_target public.ai_plan; v_quota integer; v_acc public.ai_accounts%rowtype;
begin
  if p_user_id is null then return 'nessun utente'; end if;

  select i.piano, i.premium_scadenza, i.chat_pro, i.chat_pro_scadenza
    into v_piano, v_scad, v_chatpro, v_chatscad
    from public.imprese i where i.user_id = p_user_id order by i.id limit 1;
  v_trovata := found;

  v_premium := coalesce(v_trovata, false)
               and lower(btrim(coalesce(v_piano, ''))) = 'premium'
               and (v_scad is null or v_scad > now());
  v_ai := v_premium and v_chatpro is true and (v_chatscad is null or v_chatscad > now());
  v_fine := case when v_ai then least(v_scad, v_chatscad) else null end;

  select * into v_acc from public.ai_accounts where user_id = p_user_id for update;
  if not found then
    insert into public.ai_accounts (user_id, plan, monthly_quota)
    values (p_user_id, 'base', 0) on conflict (user_id) do nothing;
    select * into v_acc from public.ai_accounts where user_id = p_user_id for update;
    if not found then return 'utente sconosciuto'; end if;
  end if;

  if v_acc.plan = 'ai_pro' then return 'ai_pro lasciato com''e'; end if;

  v_target := case when v_ai then 'ai'::public.ai_plan else 'base'::public.ai_plan end;
  v_quota  := public.quota_ai(v_target, coalesce(v_trovata, false));   -- 1 nov: iscritto

  if v_acc.plan = v_target and v_acc.monthly_quota = v_quota
     and v_acc.subscription_expires_at is not distinct from v_fine then
    return 'gia allineato';
  end if;

  update public.ai_accounts
     set plan = v_target, monthly_quota = v_quota, subscription_expires_at = v_fine,
         credits_used = case when period_start < date_trunc('month', now()) then 0 else credits_used end,
         period_start = greatest(period_start, date_trunc('month', now())),
         updated_at = now()
   where user_id = p_user_id;
  return v_target::text;
end;
$function$;

-- spendere un credito: basta essere iscritti (o avere crediti comprati)
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
  if p_cost is null or p_cost < 1 then p_cost := 1; end if;

  select * into v_acc from public.ai_accounts where user_id = v_user for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_account', 'remaining', 0);
  end if;

  v_iscritto := public.ai_iscritto(v_user);

  -- si ferma solo chi non e' iscritto e non ha crediti comprati
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

-- quello che vede lo schermo: stessa regola di consume_ai_credit
create or replace function public.get_ai_status()
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_chi uuid := auth.uid(); v_conto uuid; v_acc public.ai_accounts%rowtype;
  v_mio public.ai_accounts%rowtype; v_used integer; v_quota integer; v_quota_left integer;
  v_help_used integer; v_iscritto boolean; v_puo boolean;
begin
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

  -- ⚠️ copiata da consume_ai_credit: se cambia una, cambia l'altra
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

-- la chat: 50 messaggi al mese a ogni iscritto (300 a chi aveva pagato)
create or replace function public.chat_stato(p_user uuid default null)
returns table(usati integer, compresi integer, restanti integer, ha_pro boolean,
              assaggio boolean, extra integer, compresi_restanti integer)
language plpgsql security definer set search_path to 'public', 'auth', 'pg_catalog' as $function$
declare
  v_ruolo text; v_chi uuid;
  v_compresi_pro constant integer := 300;  -- chi aveva pagato il Gestionale AI
  v_compresi     constant integer := 50;   -- ⛔ 1 nov 2026: ogni iscritto, qui e solo qui
  v_usati integer; v_pro boolean; v_iscritto boolean; v_extra integer; v_rimasti integer; v_tetto integer;
begin
  v_ruolo := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    'postgres');
  if v_ruolo in ('service_role', 'postgres', 'supabase_admin') then
    v_chi := coalesce(p_user, auth.uid());
  else
    v_chi := auth.uid();
  end if;
  if v_chi is null then return; end if;

  select (i.chat_pro is true)
     and (i.chat_pro_scadenza is null or i.chat_pro_scadenza > now())
     and (lower(trim(coalesce(i.piano,''))) = 'premium')
     and (i.premium_scadenza is null or i.premium_scadenza > now())
    into v_pro from public.imprese i where i.user_id = v_chi;
  v_pro := coalesce(v_pro, false);

  -- un collaboratore usa la chat dell'impresa per cui lavora
  v_iscritto := public.ai_iscritto(public.ai_conto_di(v_chi));

  select coalesce(a.chat_extra, 0) into v_extra
    from public.ai_accounts a where a.user_id = public.ai_conto_di(v_chi);
  v_extra := coalesce(v_extra, 0);

  v_tetto := case when v_pro then v_compresi_pro when v_iscritto then v_compresi else 0 end;

  select count(*)::integer into v_usati
    from public.gest_chat_messaggi
   where user_id = v_chi and ruolo = 'utente'
     and created_at >= date_trunc('month', now());
  v_rimasti := greatest(v_tetto - v_usati, 0);

  -- usati · compresi · restanti · ha_pro(=puo' scrivere) · assaggio · extra · compresi_restanti
  return query select v_usati, v_tetto, v_rimasti + v_extra,
                      (v_rimasti > 0 or v_extra > 0 or v_iscritto),
                      false, v_extra, v_rimasti;
end
$function$;
