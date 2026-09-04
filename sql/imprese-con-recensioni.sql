-- =====================================================================
-- LA SITEMAP DELLE PAGINE RECENSIONI  --  5 settembre 2026
-- =====================================================================
-- `recensioni-impresa.html` non era in nessuna sitemap: per Google non
-- esisteva. E' una pagina per impresa (`?id=N`), quindi serve una sitemap
-- generata dal database, come per le schede.
--
-- La tabella `feedback_clienti` e' chiusa da RLS (da `anon` si leggono 0
-- righe), quindi si passa da una funzione security definer, come fanno
-- gia' recensioni_pubbliche() e recensioni_riepilogo().
--
-- Ci vanno SOLO le imprese con almeno una recensione confermata, non di
-- prova e con email confermata: una pagina recensioni vuota e' "contenuto
-- povero" e il giudizio ricade su tutto il sito.
--
-- Gia' passato sul database il 5 set 2026. Si puo' rilanciare.
-- =====================================================================
create or replace function public.imprese_con_recensioni()
returns table(impresa_id bigint, quante bigint, ultima timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select f.impresa_id,
         count(*)::bigint as quante,
         max(coalesce(f.confermata_il, f.created_at)) as ultima
  from public.feedback_clienti f
  join public.imprese i on i.id = f.impresa_id
  where f.confermata = true
    and coalesce(i.is_test, false) = false
    and coalesce(i.email_confermata, false) = true
  group by f.impresa_id
  order by f.impresa_id
$$;

revoke all on function public.imprese_con_recensioni() from public;
grant execute on function public.imprese_con_recensioni() to anon, authenticated, service_role;
