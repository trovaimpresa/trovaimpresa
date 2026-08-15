-- =====================================================================
-- TrovaImpresa — I CREDITI AI LI PAGA L'IMPRESA, NON L'OPERAIO
-- Da salvare come  sql/ai-crediti-collaboratori.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 — serve alla nota vocale dal cantiere.
--
-- IL PROBLEMA
-- I crediti AI stanno attaccati a UN account: ai_accounts.user_id e' la chiave
-- primaria, e consume_ai_credit parte da `auth.uid()`.
-- Quando David apre l'app del cantiere, chi e' collegato e' DAVID, non
-- l'impresa. Quindi il server va a cercare i crediti di David, che ha piano
-- 'base' e quota 0, e risponde «Hai esaurito i crediti AI di questo mese» —
-- e non e' nemmeno vero: David non li ha mai avuti.
-- Con la regola di oggi la voce in cantiere NON puo' funzionare, per nessuno.
--
-- LA REGOLA NUOVA, IN UNA RIGA
-- Se chi preme e' un COLLABORATORE ATTIVO di UNA sola impresa, i crediti sono
-- dell'impresa. In tutti gli altri casi sono suoi, esattamente come oggi.
--
-- ⚠️ IL TITOLARE NON CAMBIA DI UNA VIRGOLA. Lui in gest_membri non c'e' come
-- membro di se stesso, quindi la ricerca non trova niente e si ricade sul
-- comportamento di prima, riga per riga.
--
-- ⚠️ DUE IMPRESE = NESSUNA. Se una persona collabora con due imprese diverse,
-- non si indovina a chi far pagare: paga lei. Indovinare su chi paga e' il
-- tipo di errore che non si scopre mai, perche' i soldi spariscono da una
-- parte e nessuno guarda dall'altra.
--
-- ⚠️ E I CREDITI NON SPARISCONO PIU' SENZA UN NOME. Fino a oggi il registro
-- diceva solo di CHI erano i crediti spesi. Da adesso dice anche CHI li ha
-- spesi: con quattro operai in squadra e' la differenza fra un registro e un
-- mistero.
--
-- COSA NON SI TOCCA
-- refund_ai_credit: rimborsa partendo dalla riga di registro, e quella riga
-- e' gia' intestata all'impresa. Si aggiusta da solo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. CHI LI HA SPESI
-- ---------------------------------------------------------------------
alter table public.ai_usage_log
  add column if not exists usato_da uuid;

comment on column public.ai_usage_log.usato_da is
  'Chi ha premuto il pulsante. Diverso da user_id quando un collaboratore usa i crediti dell''impresa.';


-- ---------------------------------------------------------------------
-- 2. LA REGOLA, IN UN POSTO SOLO
-- ---------------------------------------------------------------------
-- Una funzione sola, usata da tutte e due quelle che vengono dopo. Se domani
-- la regola cambia, si cambia qui e non in due posti che si disallineano.

create or replace function public.ai_conto_di(_chi uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_quante integer;
  v_imp    uuid;
begin
  if _chi is null then
    return null;
  end if;

  -- collaboratore ATTIVO: lo stato conta. Chi e' stato sospeso o non ha ancora
  -- accettato l'invito non deve poter spendere i crediti di nessuno.
  select count(distinct m.impresa_id) into v_quante
    from public.gest_membri m
   where m.membro_id = _chi
     and m.stato = 'attivo';

  if v_quante = 1 then
    select distinct m.impresa_id into v_imp
      from public.gest_membri m
     where m.membro_id = _chi
       and m.stato = 'attivo';
    return v_imp;
  end if;

  -- zero imprese (e' il titolare, o non e' nessuno) oppure due o piu':
  -- paga chi ha premuto, come e' sempre stato.
  return _chi;
end;
$$;

comment on function public.ai_conto_di(uuid) is
  'Di chi sono i crediti AI: dell''impresa se chi preme e'' un collaboratore attivo di UNA sola impresa, altrimenti suoi.';

revoke all on function public.ai_conto_di(uuid) from public, anon;
grant execute on function public.ai_conto_di(uuid) to authenticated, service_role;


-- ---------------------------------------------------------------------
-- 3. CONSUMA — identica a prima, tranne le prime righe e il registro
-- ---------------------------------------------------------------------
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
  v_chi        uuid := auth.uid();          -- chi ha premuto il pulsante
  v_user       uuid;                        -- di chi sono i crediti
  v_acc        public.ai_accounts%rowtype;
  v_quota_left integer;
  v_available  integer;
  v_from_extra integer := 0;
  v_log_id     uuid;
  v_period     timestamptz := date_trunc('month', now());
begin
  if v_chi is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated', 'remaining', 0);
  end if;

  -- ⚠️ L'UNICA RIGA CHE CAMBIA IL COMPORTAMENTO. Tutto il resto sotto e'
  -- identico a prima: stessi controlli, stesso ordine, stessi messaggi.
  v_user := public.ai_conto_di(v_chi);

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

  insert into public.ai_usage_log (user_id, feature, credits_cost, status, usato_da)
  values (v_user, p_feature, p_cost, 'pending', v_chi)
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


-- ---------------------------------------------------------------------
-- 4. QUANTI NE RESTANO — la stessa regola, se no dal cantiere si
--    leggerebbe «0 crediti» mentre l'impresa ce li ha
-- ---------------------------------------------------------------------
-- ⚠️ PARTITA DA sql/03-assistente.sql, NON da sql/02-functions.sql.
-- La versione che gira oggi e' quella dell'assistente gratuito, e restituisce
-- anche 'help_left' (le 30 domande gratis del mese). Ripartendo dalla versione
-- vecchia, quel numero sparirebbe e nel gestionale l'assistente direbbe
-- "0 domande rimaste" a tutti. Trovato provandolo, prima di consegnare.
--
-- ⚠️ E L'AIUTO GRATIS RESTA DI CHI PREME. Le 30 domande sono gratuite per
-- tutti: se le facessi pagare all'impresa, quattro operai in squadra le
-- brucerebbero al titolare in una settimana. Per questo qui sotto 'help_left'
-- si legge dalla riga dell'impresa solo quando la riga E' quella dell'impresa,
-- e per il resto consume_help_credit non si tocca: continua a scalare le
-- domande a chi le fa.

create or replace function public.get_ai_status()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chi        uuid := auth.uid();          -- chi guarda
  v_conto      uuid;                        -- di chi sono i crediti
  v_acc        public.ai_accounts%rowtype;  -- la riga dei crediti
  v_mio        public.ai_accounts%rowtype;  -- la MIA riga, per l'aiuto gratis
  v_used       integer;
  v_quota      integer;
  v_quota_left integer;
  v_help_used  integer;
begin
  v_conto := public.ai_conto_di(v_chi);

  -- l'aiuto gratis e' sempre mio, anche se i crediti sono dell'impresa
  v_help_used := 0;
  select * into v_mio from public.ai_accounts where user_id = v_chi;
  if found and v_mio.help_period_start >= date_trunc('month', now()) then
    v_help_used := v_mio.help_used;
  end if;

  select * into v_acc from public.ai_accounts where user_id = v_conto;
  if not found then
    return json_build_object('has_ai', false, 'plan', 'base',
                             'remaining', 0,
                             'help_left', greatest(public.quota_help() - v_help_used, 0));
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
    'help_left',     greatest(public.quota_help() - v_help_used, 0),
    'renews_at',     (date_trunc('month', now()) + interval '1 month'),
    'expires_at',    v_acc.subscription_expires_at
  );
end;
$$;

revoke all on function public.get_ai_status() from public, anon;
grant execute on function public.get_ai_status() to authenticated, service_role;


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- =====================================================================
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='ai_usage_log'
                        AND column_name='usato_da')
      THEN 'NIENTE FATTO — manca la colonna «usato_da». Rilancia il file tutto intero.'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                      WHERE n.nspname='public' AND p.proname='ai_conto_di')
      THEN 'A META'' — manca la funzione ai_conto_di: la regola non c''e''.'
    WHEN (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='consume_ai_credit') <> 1
      THEN 'ATTENZIONE — ci sono piu'' versioni di consume_ai_credit: una potrebbe essere eseguibile da chiunque. Scrivimelo.'
    WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='consume_ai_credit'
                    AND has_function_privilege('anon', p.oid, 'EXECUTE'))
      THEN 'PERICOLO — consume_ai_credit e'' eseguibile da un utente non collegato. NON usare: scrivimelo subito.'
    ELSE 'FATTO — un collaboratore attivo usa i crediti della sua impresa, e nel registro resta scritto chi li ha spesi.'
  END AS risultato,
  (SELECT COUNT(*) FROM public.ai_usage_log) AS righe_di_registro,
  (SELECT COUNT(*) FROM public.ai_accounts)  AS account_con_crediti;
