-- 10 nov 2026: gli account del fondatore non hanno limite di messaggi nella Chat con AI.
-- Prima anche il fondatore aveva i 50 al mese di tutti, e le prove li finivano.
-- Stessi indirizzi di sono_il_fondatore(). Tutto il resto di chat_stato non cambia.
CREATE OR REPLACE FUNCTION public.chat_stato(p_user uuid DEFAULT NULL::uuid)
 RETURNS TABLE(usati integer, compresi integer, restanti integer, ha_pro boolean, assaggio boolean, extra integer, compresi_restanti integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_catalog'
AS $function$
declare
  v_ruolo text; v_chi uuid;
  v_compresi_pro constant integer := 300;  -- chi aveva pagato il Gestionale AI
  v_compresi     constant integer := 50;   -- 1 nov 2026: ogni iscritto, qui e solo qui
  v_fondatore    constant integer := 100000; -- 10 nov 2026: il fondatore, di fatto senza limite
  v_usati integer; v_pro boolean; v_iscritto boolean; v_extra integer; v_rimasti integer; v_tetto integer;
  v_e_fondatore boolean;
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
    into v_pro from public.imprese i where i.user_id = v_chi limit 1;
  v_pro := coalesce(v_pro, false);
  select coalesce((select lower(u.email) from auth.users u where u.id = v_chi), '')
         in ('pintoalessio@icloud.com', 'info@trovaimpresa.com')
    into v_e_fondatore;
  -- un collaboratore usa la chat dell'impresa per cui lavora
  v_iscritto := public.ai_iscritto(public.ai_conto_di(v_chi));
  select coalesce(a.chat_extra, 0) into v_extra
    from public.ai_accounts a where a.user_id = public.ai_conto_di(v_chi);
  v_extra := coalesce(v_extra, 0);
  v_tetto := case when v_e_fondatore then v_fondatore
                  when v_pro then v_compresi_pro when v_iscritto then v_compresi else 0 end;
  select count(*)::integer into v_usati
    from public.gest_chat_messaggi
   where user_id = v_chi and ruolo = 'utente'
     and created_at >= date_trunc('month', now());
  v_rimasti := greatest(v_tetto - v_usati, 0);
  -- usati · compresi · restanti · ha_pro(=puo' scrivere) · assaggio · extra · compresi_restanti
  return query select v_usati, v_tetto, v_rimasti + v_extra,
                      (v_rimasti > 0 or v_extra > 0 or v_iscritto or v_e_fondatore),
                      false, v_extra, v_rimasti;
end
$function$;
