-- 13 nov 2026 (lista «MANCA», gruppo 3) — UNA SERIE SOLA DI NUMERI DELLE FATTURE
--
-- Prima: l'App dava «il numero più alto dell'anno + 1» contando solo
-- gest_fatture; il Noleggio usava il contatore gest_azienda.num_fattura, che
-- non ripartiva a gennaio e non sapeva niente dell'App. Con la stessa partita
-- IVA uscivano due «n. 1» nello stesso anno. Deciso da Alex il 13 nov: una
-- serie sola, App e Noleggio contano insieme, si riparte da 1 a gennaio.
--
-- ⛔ Il numero lo dà QUESTA funzione e basta: la usano js/gest-fatture.js
--    (fattProssimoNumero) e js/nol-fatture.js (al salvataggio di una fattura
--    non più bozza). Contano anche le fatture nel Cestino (eliminato_il non
--    vuoto): un numero già usato non si riusa.
-- ⛔ security invoker: legge solo quello che chi chiama può già leggere (RLS).
-- gest_azienda.num_fattura resta nel database ma non si usa più.

create or replace function public.fattura_prossimo_numero(p_user uuid, p_anno integer)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select greatest(
    coalesce((select max(g.numero) from public.gest_fatture g
               where g.user_id = p_user and g.anno = p_anno and g.numero is not null), 0),
    coalesce((select max(n.numero::integer) from public.nol_fatture n
               where n.user_id = p_user and extract(year from n.data)::integer = p_anno
                 and n.numero ~ '^[0-9]{1,9}$'), 0)
  ) + 1;
$$;

revoke all on function public.fattura_prossimo_numero(uuid, integer) from public, anon;
grant execute on function public.fattura_prossimo_numero(uuid, integer) to authenticated;
