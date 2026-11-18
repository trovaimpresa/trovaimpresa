-- 18 nov 2026 — L'ARCHIVIO DELLA CHAT CON AI DIVISO PER REPARTO (chiesto da Alex)
-- Prima chat_elenco dava le chat di TUTTI i reparti dell'account: in «ferramenta»
-- si vedevano anche quelle fatte in «giardiniere».
-- Adesso:
--   p_mestiere  = il reparto aperto (null = tutti, come prima: chi chiama ancora
--                 senza il parametro non si rompe)
--   iniziata    = quando e' stata fatta la chat (il primo messaggio), da
--                 scrivere accanto a ogni chat
-- Al 18 nov: 0 messaggi senza reparto, 0 chat con messaggi di due reparti.
-- ⚠️ Cambia cosa restituisce: va prima tolta la vecchia.

drop function if exists public.chat_elenco(integer);

create or replace function public.chat_elenco(p_quante integer default 40, p_mestiere uuid default null)
 returns table(conversazione_id uuid, titolo text, quando timestamp with time zone, messaggi integer, iniziata timestamp with time zone)
 language sql
 security definer
 set search_path to 'public', 'auth', 'pg_catalog'
as $function$
  with vive as (
    select m.*
      from public.gest_chat_messaggi m
     where m.user_id = auth.uid()
       and m.eliminato_il is null
       and (p_mestiere is null or m.mestiere_id = p_mestiere)
  ),
  gruppi as (
    select v.conversazione_id,
           max(v.created_at)                       as quando,
           min(v.created_at)                       as iniziata,
           count(*)::integer                       as messaggi,
           (array_agg(v.testo order by v.created_at)
              filter (where v.ruolo = 'utente'))[1] as prima_domanda
      from vive v
     group by v.conversazione_id
  )
  select g.conversazione_id,
         coalesce(nullif(left(trim(g.prima_domanda), 60), ''), 'Chiacchierata') as titolo,
         g.quando,
         g.messaggi,
         g.iniziata
    from gruppi g
   order by g.quando desc
   limit greatest(coalesce(p_quante, 40), 1);
$function$;

revoke all on function public.chat_elenco(integer, uuid) from public, anon;
grant execute on function public.chat_elenco(integer, uuid) to authenticated;
