-- 13 nov 2026 (quarto giro del controllore) — UNA CHAT BUTTATA SPARISCE DAVVERO.
-- GIA' ESEGUITO il 13 nov 2026 (migrazione chat_butta_davvero_13nov2026).
-- La domanda dice «non si recupera», ma le parole restavano nel database
-- (solo eliminato_il scritto). Da adesso chat_svuota cancella anche il TESTO.
-- La riga resta: serve al conto dei messaggi del mese (chat_stato).
-- Vale da oggi in avanti: le chat buttate prima non vengono toccate.
create or replace function public.chat_svuota(p_conversazione uuid default null::uuid)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'auth', 'pg_catalog'
as $function$
declare
  v_chi uuid := auth.uid();
  v_n   integer;
begin
  if v_chi is null then
    return 0;
  end if;
  update public.gest_chat_messaggi
     set eliminato_il = now(),
         testo = null
   where user_id = v_chi
     and eliminato_il is null
     and (p_conversazione is null or conversazione_id = p_conversazione);
  get diagnostics v_n = row_count;
  return v_n;
end
$function$;
