-- sql/messaggi-chat-separati.sql
--
-- 14 settembre 2026 — LA CHAT ESCE DAL PORTAFOGLIO DEI CREDITI
--
-- COM'ERA. Finiti i 300 messaggi compresi del mese, chat-gestionale.mjs
-- chiamava `consume_ai_credit('chat')`, che si mangiava prima i crediti
-- MENSILI (40 del Gestionale, 100 del Gestionale AI) e poi quelli comprati.
-- Ma quei crediti sono dell'ASSISTENZA — «Compila con AI» e «Genera con AI».
-- Uno chiacchierava, passava i 300 senza accorgersene, e poi trovava
-- l'assistenza a secco senza capire perche'. I «300 messaggi» scritti nel
-- listino in realta' erano 400.
--
-- COM'E' ADESSO, deciso da Alex il 14 set 2026 («cosi resta separata ma
-- darei anche alla chat di ricaricarsi separatamente»): DUE PORTAFOGLI.
--   • crediti  -> assistenza. La chat non li tocca piu'.
--   • messaggi -> chat. 300 compresi al mese col Gestionale AI; finiti
--     quelli si spendono i messaggi comprati; finiti anche quelli la chat
--     si FERMA e non addebita niente da sola.
-- I pacchetti: 300 = 9 €, 1.000 = 25 €, 3.000 = 69 €. Non scadono.
--
-- GIA' ESEGUITO SU SUPABASE il 14 set 2026, in tre migrazioni:
--   messaggi_chat_separati_dai_crediti_14set2026
--   chat_stato_compresi_restanti_14set2026
--   chat_stato_assaggio_torna_come_prima_14set2026
-- Qui sta il RISULTATO FINALE, non i tre passi: le due correzioni fatte in
-- corsa sono raccontate in fondo, perche' sono lezioni.
--
-- ⚠️ TUTTO ADDITIVO: nessuna colonna tolta, nessun dato cambiato.
--    `consume_ai_credit` e' rimasta dov'era e fa quello che faceva: cambia
--    solo CHI la chiama. Quindi il sito vecchio continua a funzionare anche
--    nei minuti fra la migrazione e la pubblicazione del codice.
--
-- CHI TOCCA COSA, dopo questa migrazione:
--   netlify/functions/chat-gestionale.mjs   -> consume_chat_message / refund_chat_message
--   netlify/functions/crea-checkout-crediti.js -> apre il pagamento dei due tipi
--   netlify/functions/stripe-webhook-abbonamenti.js -> add_chat_pack
--   ricarica-crediti.html + js/gest-chat.js -> i numeri a schermo


-- =====================================================================
-- 1. IL PORTAFOGLIO NUOVO
-- =====================================================================
alter table public.ai_accounts
  add column if not exists chat_extra integer not null default 0;

comment on column public.ai_accounts.chat_extra is
  'Messaggi di chat COMPRATI. Non scadono e non si rinnovano: si spendono solo quando i 300 compresi del mese sono finiti. Non c''entrano niente con credits_extra, che e'' dell''assistenza.';

-- la ricevuta deve dire COSA e' stato comprato, se no nei conti
-- 300 messaggi e 300 crediti sono la stessa riga
alter table public.ai_credit_purchases
  add column if not exists tipo text not null default 'crediti';

alter table public.ai_credit_purchases
  drop constraint if exists ai_credit_purchases_tipo_chk;
alter table public.ai_credit_purchases
  add constraint ai_credit_purchases_tipo_chk check (tipo in ('crediti','chat'));

comment on column public.ai_credit_purchases.tipo is
  '''crediti'' = ricarica dell''assistenza (credits_extra). ''chat'' = pacchetto di messaggi (chat_extra). Le righe di prima del 14 set 2026 sono tutte ''crediti''.';


-- =====================================================================
-- 2. chat_stato — ADESSO DICE ANCHE I MESSAGGI COMPRATI
--
-- ⚠️ Cambia il tipo restituito, quindi va buttata e rifatta.
--    Le due colonne nuove stanno IN FONDO: chi legge solo usati/compresi/
--    restanti/ha_pro/assaggio continua a funzionare com'e'.
-- ⛔ `restanti` comprende i messaggi comprati: e' il numero che si scrive
--    sotto la chat. `compresi_restanti` invece e' solo quelli del mese, ed
--    e' quello che decide quando cominciare a scalare i comprati.
-- =====================================================================
drop function if exists public.chat_stato(uuid);

create function public.chat_stato(p_user uuid default null)
returns table(usati integer, compresi integer, restanti integer,
              ha_pro boolean, assaggio boolean, extra integer,
              compresi_restanti integer)
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_catalog'
as $function$
declare
  v_ruolo    text;
  v_chi      uuid;
  v_compresi constant integer := 300;   -- ⛔ i messaggi del Gestionale AI, qui e solo qui
  v_assaggio constant integer := 10;    -- ⛔ e l'assaggio di chi non ce l'ha
  v_usati    integer;
  v_pro      boolean;
  v_extra    integer;
  v_rimasti  integer;
begin
  v_ruolo := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims',     true), '')::jsonb ->> 'role',
    'postgres'
  );

  if v_ruolo in ('service_role', 'postgres', 'supabase_admin') then
    v_chi := coalesce(p_user, auth.uid());
  else
    v_chi := auth.uid();
  end if;
  if v_chi is null then
    return;
  end if;

  select (i.chat_pro is true)
     and (i.chat_pro_scadenza is null or i.chat_pro_scadenza > now())
     and (lower(trim(coalesce(i.piano,''))) = 'premium')
     and (i.premium_scadenza is null or i.premium_scadenza > now())
    into v_pro
    from public.imprese i
   where i.user_id = v_chi;

  v_pro := coalesce(v_pro, false);

  -- i messaggi comprati stanno sul conto che paga (il titolare, se chi
  -- scrive e' un collaboratore): stessa regola dei crediti
  select coalesce(a.chat_extra, 0) into v_extra
    from public.ai_accounts a
   where a.user_id = public.ai_conto_di(v_chi);
  v_extra := coalesce(v_extra, 0);

  if v_pro then
    select count(*)::integer into v_usati
      from public.gest_chat_messaggi
     where user_id = v_chi
       and ruolo = 'utente'
       and created_at >= date_trunc('month', now());
    v_rimasti := greatest(v_compresi - v_usati, 0);
    -- usati · compresi · restanti · ha_pro · assaggio · extra · compresi_restanti
    return query select v_usati, v_compresi, v_rimasti + v_extra,
                        true, false, v_extra, v_rimasti;
  else
    -- ⛔ l'assaggio si conta SENZA filtro sul mese, se no il primo di ogni
    --    mese sarebbe una chat gratis a vita.
    select count(*)::integer into v_usati
      from public.gest_chat_messaggi
     where user_id = v_chi
       and ruolo = 'utente';
    v_rimasti := greatest(v_assaggio - v_usati, 0);
    -- ⚠️ `ha_pro` qui vuol dire «puo' scrivere», non «ha il piano»: o
    --    l'assaggio non e' finito, o ha messaggi COMPRATI da spendere.
    --    Chi ha pagato un pacchetto e poi e' sceso di piano deve poterlo
    --    usare lo stesso: e' merce sua.
    -- ⚠️ `assaggio` resta true FISSO come nella versione originale: vuol
    --    dire «sta in modalita' assaggio», non «gliene restano».
    return query select v_usati, v_assaggio, v_rimasti + v_extra,
                        (v_rimasti > 0 or v_extra > 0),
                        true,
                        v_extra, v_rimasti;
  end if;
end
$function$;

grant execute on function public.chat_stato(uuid) to anon, authenticated, service_role;


-- =====================================================================
-- 3. SPENDERE UN MESSAGGIO COMPRATO
--
-- La chiama chat-gestionale.mjs SOLO quando i compresi del mese sono
-- finiti. Non guarda ne' monthly_quota ne' credits_extra: quelli sono
-- dell'assistenza e non si toccano piu'.
-- =====================================================================
create or replace function public.consume_chat_message()
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_chi    uuid := auth.uid();
  v_user   uuid;
  v_acc    public.ai_accounts%rowtype;
  v_log_id uuid;
begin
  if v_chi is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated', 'remaining', 0);
  end if;

  v_user := public.ai_conto_di(v_chi);

  select * into v_acc from public.ai_accounts where user_id = v_user for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_chat_messages', 'remaining', 0);
  end if;

  if coalesce(v_acc.chat_extra, 0) < 1 then
    return json_build_object('ok', false, 'reason', 'no_chat_messages', 'remaining', 0);
  end if;

  update public.ai_accounts
     set chat_extra = chat_extra - 1,
         updated_at = now()
   where user_id = v_user;

  insert into public.ai_usage_log (user_id, feature, credits_cost, status, usato_da)
  values (v_user, 'chat_extra', 1, 'pending', v_chi)
  returning id into v_log_id;

  return json_build_object('ok', true, 'log_id', v_log_id,
                           'remaining', coalesce(v_acc.chat_extra, 0) - 1);
end;
$function$;

grant execute on function public.consume_chat_message() to authenticated, service_role;


-- =====================================================================
-- 4. E RIDARLO INDIETRO SE LA RISPOSTA NON ARRIVA
--
-- Stessa regola dei crediti: far pagare un messaggio mai arrivato e' il
-- modo piu' veloce per farsi disdire il piano.
-- ⚠️ Rifiuta i log che non sono di tipo 'chat_extra': un rimborso preso
--    dal portafoglio sbagliato sarebbe peggio di nessun rimborso.
-- =====================================================================
create or replace function public.refund_chat_message(p_log_id uuid, p_error text default null)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_log public.ai_usage_log%rowtype;
begin
  select * into v_log from public.ai_usage_log where id = p_log_id for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'log_not_found');
  end if;
  if v_log.status <> 'pending' then
    return json_build_object('ok', false, 'reason', 'already_settled');
  end if;
  if v_log.feature <> 'chat_extra' then
    return json_build_object('ok', false, 'reason', 'not_a_chat_message');
  end if;

  update public.ai_accounts
     set chat_extra = chat_extra + v_log.credits_cost,
         updated_at = now()
   where user_id = v_log.user_id;

  update public.ai_usage_log
     set status = 'refunded', error_message = p_error
   where id = p_log_id;

  return json_build_object('ok', true);
end;
$function$;

grant execute on function public.refund_chat_message(uuid, text) to authenticated, service_role;


-- =====================================================================
-- 5. ACCREDITARE UN PACCHETTO COMPRATO
--
-- Gemella di add_credits_pack. La ricevuta in ai_credit_purchases e'
-- quella che impedisce il doppio accredito quando Stripe rimanda lo
-- stesso avviso: stesso payment_reference = unique_violation = «ok, c'e'
-- gia'».
-- ⛔ La chiama SOLO il webhook col service role: dal browser no, se no
--    uno si regala i messaggi da solo.
-- =====================================================================
create or replace function public.add_chat_pack(
  p_user_id uuid, p_messaggi integer, p_amount_eur numeric,
  p_payment_provider text, p_payment_reference text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_righe integer;
  v_dopo  integer;
begin
  if p_user_id is null then
    return json_build_object('ok', false, 'reason', 'utente_mancante');
  end if;
  if p_messaggi is null or p_messaggi < 1 then
    return json_build_object('ok', false, 'reason', 'messaggi_non_validi');
  end if;
  if p_payment_reference is null or btrim(p_payment_reference) = '' then
    return json_build_object('ok', false, 'reason', 'riferimento_mancante');
  end if;

  insert into public.ai_accounts (user_id, plan, monthly_quota)
  values (p_user_id, 'base', 0)
  on conflict (user_id) do nothing;

  insert into public.ai_credit_purchases
    (user_id, credits, amount_eur, payment_provider, payment_reference, tipo)
  values
    (p_user_id, p_messaggi, p_amount_eur, p_payment_provider, btrim(p_payment_reference), 'chat');

  update public.ai_accounts
     set chat_extra = chat_extra + p_messaggi,
         updated_at = now()
   where user_id = p_user_id
  returning chat_extra into v_dopo;

  get diagnostics v_righe = row_count;

  if v_righe <> 1 or v_dopo is null then
    raise exception 'messaggi non accreditati' using errcode = 'TI001';
  end if;

  return json_build_object('ok', true, 'messaggi', p_messaggi, 'chat_extra', v_dopo);

exception
  when unique_violation then
    return json_build_object('ok', false, 'reason', 'already_processed');
  when foreign_key_violation then
    return json_build_object('ok', false, 'reason', 'utente_sconosciuto');
  when sqlstate 'TI001' then
    return json_build_object('ok', false, 'reason', 'accredito_non_riuscito');
end;
$function$;

revoke execute on function public.add_chat_pack(uuid, integer, numeric, text, text) from anon, authenticated;
grant  execute on function public.add_chat_pack(uuid, integer, numeric, text, text) to service_role;


-- =====================================================================
-- 6. get_ai_status — dice anche quanti messaggi di chat sono in cassa
--     (serve a ricarica-crediti.html per mostrare il saldo)
--
-- ⚠️ Cambia UNA riga sola rispetto a prima: il campo `chat_extra`.
--    `remaining` NON lo comprende, ed e' voluto: `remaining` e'
--    l'assistenza, e ci si appoggia js/ai-integrazione.js per decidere se
--    aprire «Compila con AI». Se ci sommassimo i messaggi della chat, uno
--    con 1.000 messaggi comprati si vedrebbe aprire un'assistenza che non
--    ha pagato.
-- =====================================================================
create or replace function public.get_ai_status()
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_chi        uuid := auth.uid();
  v_conto      uuid;
  v_acc        public.ai_accounts%rowtype;
  v_mio        public.ai_accounts%rowtype;
  v_used       integer;
  v_quota      integer;
  v_quota_left integer;
  v_help_used  integer;
  v_premium    boolean;
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
                             'remaining', 0, 'chat_extra', 0,
                             'help_left', greatest(public.quota_help() - v_help_used, 0));
  end if;

  select coalesce(bool_or(lower(btrim(coalesce(i.piano,''))) = 'premium'
                          and (i.premium_scadenza is null or i.premium_scadenza > now())), false)
    into v_premium
    from public.imprese i
   where i.user_id = v_conto;

  -- Applica il reset mensile "virtualmente", senza scrivere
  if v_acc.period_start < date_trunc('month', now()) then
    v_used  := 0;
    v_quota := public.quota_ai(v_acc.plan, v_premium);
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
    'chat_extra',    coalesce(v_acc.chat_extra, 0),
    'help_left',     greatest(public.quota_help() - v_help_used, 0),
    'renews_at',     (date_trunc('month', now()) + interval '1 month'),
    'expires_at',    v_acc.subscription_expires_at
  );
end;
$function$;


-- =====================================================================
-- LE DUE CORREZIONI FATTE IN CORSA, scritte perche' sono lezioni
--
-- ⛔ 1. `ha_pro` NON vuol dire «ha il piano»: vuol dire «puo' scrivere».
--    Per chi non ha il Gestionale AI valeva `usati < 10`, cioe' l'assaggio
--    non ancora finito. Riscrivendola l'avevo messa a `extra > 0` e cosi'
--    l'ASSAGGIO SPARIVA: uno al terzo messaggio di prova si sarebbe
--    sentito dire «la chat e' nel piano AI».
--
-- ⛔ 2. `assaggio` non vuol dire «l'assaggio e' ancora aperto»: nella
--    versione originale valeva `true` FISSO per chiunque non abbia il
--    Gestionale AI, cioe' «questa persona sta in modalita' assaggio». La
--    legge js/gest-chat.js per decidere cosa scrivere sotto la casella.
--    L'avevo riscritta come `usati < 10` e cambiava significato.
--
-- ⚠️ LA REGOLA: quando si riscrive una funzione che c'era gia', si rilegge
--    il corpo vecchio riga per riga. Non il ricordo di cosa faceva.
--
-- IL COLLAUDO, fatto in transazioni annullate (tutto verde):
--   • il pacchetto comprato finisce su chat_extra e NON su credits_extra
--   • lo stesso avviso di Stripe due volte non raddoppia l'accredito
--   • spendere 3 messaggi su 3 funziona, il quarto risponde no_chat_messages
--   • dopo aver speso, i crediti dell'assistenza sono ancora 0 usati su 100
--   • il rimborso rimette il messaggio in cassa
--   • i 4 casi di chat_stato: col piano / col piano e comprati / sceso di
--     piano con comprati / sceso e senza niente
--
-- CONTROLLI (devono rispondere come scritto qui a fianco)
-- select count(*) from public.ai_accounts where chat_extra <> 0;        -- 0 prima del primo acquisto
-- select tipo, count(*) from public.ai_credit_purchases group by tipo;  -- le righe vecchie tutte 'crediti'
-- select * from public.chat_stato('<un user_id>');                      -- 7 colonne, non 5
