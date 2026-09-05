-- =====================================================================
-- I RIMBORSI                                        5 settembre 2026
-- =====================================================================
-- ⛔ IL BUCO CHE C'ERA: non c'era niente. Il webhook di Stripe ascoltava
-- →5← avvisi e nessuno riguardava i rimborsi. La parola «refund» nel
-- sito non compariva da nessuna parte. Quindi: si ridavano i soldi, il
-- cliente si teneva quello che aveva comprato, e il registro incassi
-- continuava a contare quell'incasso.
--
-- Scoperto da un rimborso VERO di Alessio: il →16 agosto← aveva pagato
-- →19,00 €← per →150← crediti AI (`cs_live_...`) e poi si era rimborsato.
-- Tre settimane dopo, nel database: →150← crediti ancora sul suo account
-- e →19,00 €← ancora segnati come incasso.
--
-- Da oggi ci pensa il webhook (`charge.refunded`). Questa funzione e' il
-- pezzo che tocca i crediti.
-- =====================================================================

create or replace function public.togli_crediti_rimborso(
  p_user_id     uuid,
  p_credits     integer,
  p_amount_eur  numeric,
  p_riferimento text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare aveva integer; tolti integer;
begin
  if p_user_id is null or p_credits is null or p_credits <= 0 then
    return json_build_object('ok', false, 'reason', 'dati_mancanti');
  end if;
  if p_riferimento is null or btrim(p_riferimento) = '' then
    return json_build_object('ok', false, 'reason', 'riferimento_mancante');
  end if;

  -- La riga in NEGATIVO. ⛔ Non si cancella la riga dell'acquisto: la
  -- storia deve restare leggibile. E il vincolo unique su
  -- payment_reference e' anche il lucchetto contro il doppio avviso di
  -- Stripe: se lo stesso rimborso arriva due volte, la seconda esce da
  -- sola con `already_processed`.
  insert into public.ai_credit_purchases
    (user_id, credits, amount_eur, payment_provider, payment_reference)
  values
    (p_user_id, -p_credits, -coalesce(p_amount_eur, 0), 'stripe', btrim(p_riferimento));

  select coalesce(credits_extra, 0) into aveva
    from public.ai_accounts where user_id = p_user_id;

  if aveva is null then
    return json_build_object('ok', false, 'reason', 'account_inesistente');
  end if;

  -- ⚠️ NON si scende sotto zero. Se una parte l'aveva gia' spesa, quella
  -- e' spesa: mettere il saldo in negativo vorrebbe dire far pagare al
  -- prossimo acquisto una cosa gia' consumata.
  tolti := least(aveva, p_credits);

  update public.ai_accounts
     set credits_extra = credits_extra - tolti,
         updated_at    = now()
   where user_id = p_user_id;

  return json_build_object('ok', true, 'tolti', tolti, 'chiesti', p_credits,
                           'non_recuperati', p_credits - tolti);
exception
  when unique_violation then
    return json_build_object('ok', false, 'reason', 'already_processed');
end;
$$;

-- ⚠️ Come `registra_pagamento`: la puo' chiamare SOLO il server. Se la
-- potesse chiamare un utente del sito, potrebbe togliere i crediti a
-- chiunque.
revoke all on function public.togli_crediti_rimborso(uuid, integer, numeric, text)
  from public, anon, authenticated;
grant execute on function public.togli_crediti_rimborso(uuid, integer, numeric, text)
  to service_role;


-- =====================================================================
-- IL RECUPERO DEL 16 AGOSTO — gia' fatto il 5 set, NON rilanciare
-- =====================================================================
-- Il rimborso vecchio di Alessio, messo a posto con la STESSA funzione
-- che usa il sito: se sbagliasse qui, sbaglierebbe anche in produzione.
--
--   PRIMA:  crediti 150 · usati 3 · righe acquisto 1 · registro 19,00 €
--   DOPO:   crediti   0 · usati 3 · righe acquisto 2 · registro  0,00 €
--
-- Le righe vecchie NON sono state cancellate: ce ne sono di nuove, in
-- negativo, accanto. Per tornare indietro basta togliere le due righe
-- col riferimento qui sotto e rimettere credits_extra a 150.
-- ---------------------------------------------------------------------
-- select public.togli_crediti_rimborso(
--   '1119cf1e-3dd6-4263-8cc6-bea28394c307'::uuid, 150, 19.00,
--   'rimborso-manuale-16ago-cs_live_a1NgIZS3dJtXMwwESmjHfqux9bZYpbK5gqyZsEAEkMrpXHisj1XGufDBpd');
--
-- select public.registra_pagamento(
--   'crediti-ai', -1900,
--   'rimborso-manuale-16ago-cs_live_a1NgIZS3dJtXMwwESmjHfqux9bZYpbK5gqyZsEAEkMrpXHisj1XGufDBpd',
--   'pintoalessio@icloud.com', '1119cf1e-3dd6-4263-8cc6-bea28394c307'::uuid, null,
--   'eur', 'rimborso.recuperato.a.mano', '2026-08-16T14:00:00Z'::timestamptz);

-- =====================================================================
-- ⚠️ PERCHE' FUNZIONI, l'avviso `charge.refunded` va ACCESO anche dalla
-- parte di Stripe: Dashboard → Sviluppatori → Webhook → l'endpoint degli
-- abbonamenti → «Select events». Se non lo si accende, questo codice non
-- fa danni: semplicemente non arriva mai niente — ed e' esattamente il
-- modo in cui un buco resta aperto sembrando chiuso.
-- =====================================================================
