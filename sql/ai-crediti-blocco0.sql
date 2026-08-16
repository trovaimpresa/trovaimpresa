-- =====================================================================
-- TrovaImpresa — BLOCCO 0: CHIUDERE IL BUCO DEI CREDITI AI
-- Da salvare come  sql/ai-crediti-blocco0.sql
-- Incolla TUTTO in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 16 agosto 2026
--
-- ---------------------------------------------------------------------
-- COSA SISTEMA, IN PAROLE POVERE
-- ---------------------------------------------------------------------
-- 1. Il Premium comprende 100 crediti AI al mese (prima ne dava 60).
--
-- 2. Chi paga il Premium adesso RICEVE DAVVERO l'AI.
--    Prima no: il webhook di Stripe scriveva solo `imprese.piano='premium'`
--    e non toccava mai `ai_accounts`. Tutti restavano sul piano 'base', e
--    `consume_ai_credit` sul piano 'base' si ferma alla seconda riga --
--    PRIMA ancora di guardare i crediti comprati. Vuol dire che uno poteva
--    comprare 150 crediti, vederseli nel conto, e sentirsi rispondere
--    lo stesso «non hai l'AI». Pagati per niente.
--
-- 3. `add_credits_pack` non dice piu' «fatto» quando non ha fatto niente.
--    Il buco vero: se la riga in `ai_accounts` non c'era, l'`update` non
--    toccava nessuna riga e la funzione rispondeva `ok:true` lo stesso.
--    Uno pagava, Stripe era contento, e i crediti non esistevano da
--    nessuna parte. Silenzioso: il modo peggiore di perdere dei soldi.
--
-- ---------------------------------------------------------------------
-- LE DUE COSE CHE NON SI TOCCANO MAI
-- ---------------------------------------------------------------------
-- ⚠️ I CREDITI COMPRATI (`credits_extra`) NON SI AZZERANO MAI, per nessun
--    motivo, nemmeno quando il Premium scade. Sono stati pagati.
--
-- ⚠️ IL PIANO 'ai_pro' NON LO TOCCA NIENTE DI QUESTO FILE. Quello resta
--    una cosa che decidi tu a mano, come oggi.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LA QUOTA MENSILE — 100 crediti per chi paga
--
-- Il file vero e' sql/02-functions.sql: questa e' la stessa funzione con
-- il solo numero cambiato (60 -> 100). 'ai_pro' resta a 300 come deciso.
-- ---------------------------------------------------------------------
create or replace function public.quota_per_piano(p_plan public.ai_plan)
returns integer
language sql
immutable
as $$
  select case p_plan
    when 'base'   then 0
    when 'ai'     then 100
    when 'ai_pro' then 300
  end;
$$;

comment on function public.quota_per_piano(public.ai_plan) is
  'Crediti AI compresi ogni mese: base 0, ai 100 (il Premium), ai_pro 300. Non si accumulano.';


-- ---------------------------------------------------------------------
-- 2. L'ACCREDITO DOPO IL PAGAMENTO — adesso dice la verita'
--
-- Firma identica a prima (stessi 5 parametri, stesso nome): niente
-- di quello che gia' esiste si accorge del cambio.
--
-- ⚠️ COSA CAMBIA DAVVERO
--    a) se la riga dei crediti non c'e', la crea invece di far finta;
--    b) se l'utente non esiste proprio, risponde 'utente_sconosciuto'
--       invece di esplodere;
--    c) se l'accredito non ha toccato ESATTAMENTE una riga, annulla tutto
--       (compresa la ricevuta) e risponde 'accredito_non_riuscito'.
--       Annullare anche la ricevuta e' il punto: se restasse scritta, il
--       secondo tentativo di Stripe direbbe «gia' fatto» e quei soldi
--       sarebbero persi per sempre. Cosi' invece il secondo tentativo
--       riprova davvero.
--
-- ⚠️ IL WEBHOOK DOPPIO: non serve niente di nuovo. Stripe rimanda lo
--    stesso avviso piu' volte, ma `ai_credit_purchases.payment_reference`
--    e' `unique`: la seconda volta l'inserimento sbatte contro il muro e
--    la funzione risponde 'already_processed' senza accreditare.
--    Questo c'era gia' e funziona. Le prove lo verificano lo stesso.
-- ---------------------------------------------------------------------
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
declare
  v_righe integer;
  v_dopo  integer;
begin
  -- controlli in ingresso: meglio un 'no' chiaro che una riga storta
  if p_user_id is null then
    return json_build_object('ok', false, 'reason', 'utente_mancante');
  end if;
  if p_credits is null or p_credits < 1 then
    return json_build_object('ok', false, 'reason', 'crediti_non_validi');
  end if;
  if p_payment_reference is null or btrim(p_payment_reference) = '' then
    return json_build_object('ok', false, 'reason', 'riferimento_mancante');
  end if;

  -- La riga dei crediti DEVE esistere prima di accreditare.
  -- Se l'utente non c'e' in auth.users, qui salta fuori una
  -- foreign_key_violation, che viene presa in fondo.
  insert into public.ai_accounts (user_id, plan, monthly_quota)
  values (p_user_id, 'base', 0)
  on conflict (user_id) do nothing;

  -- La ricevuta. E' questa che impedisce il doppio accredito.
  insert into public.ai_credit_purchases
    (user_id, credits, amount_eur, payment_provider, payment_reference)
  values
    (p_user_id, p_credits, p_amount_eur, p_payment_provider, btrim(p_payment_reference));

  update public.ai_accounts
     set credits_extra = credits_extra + p_credits,
         updated_at    = now()
   where user_id = p_user_id
  returning credits_extra into v_dopo;

  get diagnostics v_righe = row_count;

  if v_righe <> 1 or v_dopo is null then
    -- annulla tutto, ricevuta compresa
    raise exception 'crediti non accreditati' using errcode = 'TI001';
  end if;

  return json_build_object('ok', true, 'credits', p_credits, 'credits_extra', v_dopo);

exception
  when unique_violation then
    -- lo stesso avviso di Stripe arrivato due volte. NON e' un errore.
    return json_build_object('ok', false, 'reason', 'already_processed');
  when foreign_key_violation then
    return json_build_object('ok', false, 'reason', 'utente_sconosciuto');
  when sqlstate 'TI001' then
    return json_build_object('ok', false, 'reason', 'accredito_non_riuscito');
end;
$$;

comment on function public.add_credits_pack(uuid, integer, numeric, text, text) is
  'Accredita i crediti comprati su ai_accounts.credits_extra. Una volta sola per riferimento di pagamento. Risponde ok:false se NON ha accreditato: in quel caso il webhook deve far riprovare Stripe.';

-- CRITICO: senza questo revoke un utente si autoricarica crediti gratis.
revoke all on function public.add_credits_pack(uuid, integer, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.add_credits_pack(uuid, integer, numeric, text, text) to service_role;


-- ---------------------------------------------------------------------
-- 3. IL PONTE FRA IL PREMIUM E L'AI
--
-- La regola e' la STESSA di haPremium() dentro gestionale-app.html
-- (riga 16426): piano 'premium', e se c'e' una scadenza, non passata.
-- Scritta in un posto solo, cosi' non si disallinea.
--
-- Premium valido -> ai_accounts.plan = 'ai'   (100 crediti al mese)
-- Premium finito -> ai_accounts.plan = 'base' (0 crediti al mese)
--
-- ⚠️ `credits_extra` non viene toccato in nessuno dei due casi.
-- ⚠️ Chi e' su 'ai_pro' viene lasciato esattamente com'e'.
-- ⚠️ `credits_used` si azzera SOLO al cambio di mese, mai al cambio di
--    piano: se no bastava togliere e rimettere il Premium per avere
--    altri 100 crediti nello stesso mese.
-- ---------------------------------------------------------------------
create or replace function public.ai_allinea_piano(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_piano   text;
  v_scad    timestamptz;
  v_trovata boolean;
  v_premium boolean;
  v_target  public.ai_plan;
  v_acc     public.ai_accounts%rowtype;
begin
  if p_user_id is null then
    return 'nessun utente';
  end if;

  select i.piano, i.premium_scadenza
    into v_piano, v_scad
    from public.imprese i
   where i.user_id = p_user_id
   order by i.id
   limit 1;

  v_trovata := found;

  v_premium := coalesce(v_trovata, false)
               and lower(btrim(coalesce(v_piano, ''))) = 'premium'
               and (v_scad is null or v_scad > now());

  if not v_premium then
    v_scad := null;
  end if;

  select * into v_acc from public.ai_accounts where user_id = p_user_id for update;

  if not found then
    insert into public.ai_accounts (user_id, plan, monthly_quota)
    values (p_user_id, 'base', 0)
    on conflict (user_id) do nothing;
    select * into v_acc from public.ai_accounts where user_id = p_user_id for update;
    if not found then
      return 'utente sconosciuto';
    end if;
  end if;

  -- il Pro lo decidi tu a mano: da qui non si tocca
  if v_acc.plan = 'ai_pro' then
    return 'ai_pro lasciato com''e';
  end if;

  v_target := case when v_premium then 'ai'::public.ai_plan else 'base'::public.ai_plan end;

  if v_acc.plan = v_target
     and v_acc.monthly_quota = public.quota_per_piano(v_target)
     and v_acc.subscription_expires_at is not distinct from v_scad then
    return 'gia allineato';
  end if;

  update public.ai_accounts
     set plan                    = v_target,
         monthly_quota           = public.quota_per_piano(v_target),
         subscription_expires_at = v_scad,
         credits_used            = case when period_start < date_trunc('month', now())
                                        then 0 else credits_used end,
         period_start            = greatest(period_start, date_trunc('month', now())),
         updated_at              = now()
   where user_id = p_user_id;

  return v_target::text;
end;
$$;

comment on function public.ai_allinea_piano(uuid) is
  'Mette ai_accounts.plan in riga con il Premium dell''impresa. Non tocca mai i crediti comprati ne'' il piano ai_pro.';

revoke all on function public.ai_allinea_piano(uuid) from public, anon, authenticated;
grant execute on function public.ai_allinea_piano(uuid) to service_role;


-- ---------------------------------------------------------------------
-- 4. E CHE SI FACCIA DA SOLO
--
-- Un trigger su `imprese`: ogni volta che cambia il piano o la scadenza,
-- l'AI si allinea da sola. Copre tutti e tre i modi in cui oggi cambia
-- il Premium, senza dover toccare nessuno dei tre:
--   - il webhook di Stripe quando uno paga;
--   - te che regali il Premium dal Table Editor;
--   - il lavoro notturno delle 3 (pg_cron) che fa scadere i regali.
--
-- ⚠️ NON DEVE MAI IMPEDIRE IL SALVATAGGIO DI UN PROFILO. Se qualcosa
--    qui dentro va storto, si tira dritto: meglio un'AI non allineata
--    che un'impresa che non riesce a salvare i suoi dati.
--    Per accorgersene c'e' la query di controllo in fondo al file.
-- ---------------------------------------------------------------------
create or replace function public.ai_allinea_da_imprese()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    if tg_op = 'DELETE' then
      perform public.ai_allinea_piano(old.user_id);
    else
      perform public.ai_allinea_piano(new.user_id);
      if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id then
        perform public.ai_allinea_piano(old.user_id);
      end if;
    end if;
  exception when others then
    null;   -- vedi sopra: il profilo si salva comunque
  end;
  return null;
end;
$$;

drop trigger if exists trg_ai_allinea_piano on public.imprese;
create trigger trg_ai_allinea_piano
  after insert or delete or update of piano, premium_scadenza, premium_pagato, user_id
  on public.imprese
  for each row execute function public.ai_allinea_da_imprese();


-- ---------------------------------------------------------------------
-- 5. E ADESSO QUELLI CHE CI SONO GIA'
--
-- Due passaggi:
--   a) chi ha il Premium oggi prende il piano AI;
--   b) chi era gia' sul piano AI passa da 60 a 100 crediti senza
--      aspettare il primo del mese.
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select distinct user_id from public.imprese where user_id is not null loop
    perform public.ai_allinea_piano(r.user_id);
  end loop;
end $$;

update public.ai_accounts
   set monthly_quota = public.quota_per_piano(plan),
       updated_at    = now()
 where monthly_quota is distinct from public.quota_per_piano(plan);


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- =====================================================================
select
  case
    when public.quota_per_piano('ai') <> 100
      then 'NIENTE FATTO — la quota del piano che paga non e'' 100. Rilancia il file tutto intero.'
    when not exists (select 1 from pg_trigger
                      where tgname = 'trg_ai_allinea_piano' and not tgisinternal)
      then 'A META'' — manca il collegamento fra il Premium e l''AI: chi paga non riceve i crediti.'
    when has_function_privilege('anon',
           'public.add_credits_pack(uuid,integer,numeric,text,text)', 'EXECUTE')
      or has_function_privilege('authenticated',
           'public.add_credits_pack(uuid,integer,numeric,text,text)', 'EXECUTE')
      then 'PERICOLO — chiunque puo'' autoricaricarsi crediti gratis. NON usare: scrivimelo subito.'
    when has_function_privilege('anon',
           'public.ai_allinea_piano(uuid)', 'EXECUTE')
      or has_function_privilege('authenticated',
           'public.ai_allinea_piano(uuid)', 'EXECUTE')
      then 'PERICOLO — chiunque puo'' attivarsi il piano AI da solo. NON usare: scrivimelo subito.'
    else 'FATTO — chi ha il Premium ha 100 crediti al mese, e i crediti comprati si accreditano una volta sola.'
  end                                                                        as risultato,
  (select count(*) from public.ai_accounts where plan = 'ai')                as imprese_con_ai,
  (select count(*) from public.ai_accounts where plan = 'ai_pro')            as imprese_con_ai_pro,
  (select coalesce(sum(credits_extra), 0) from public.ai_accounts)           as crediti_comprati_in_giro,
  (select count(*) from public.imprese i
     join public.ai_accounts a on a.user_id = i.user_id
    where lower(btrim(coalesce(i.piano,''))) = 'premium'
      and (i.premium_scadenza is null or i.premium_scadenza > now())
      and a.plan = 'base')                                                   as premium_senza_ai_da_controllare;
