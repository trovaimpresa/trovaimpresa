-- 24 nov 2026 — FATTURA A UN ENTE PUBBLICO (sì di Alex, foto approvata)
-- Un Comune, una scuola, un'ASL: codice univoco ufficio di 6 caratteri,
-- file FPA12, scissione dei pagamenti (l'IVA la versa l'ente, art. 17-ter
-- DPR 633/72), CIG e CUP dell'incarico.
--   scissione = la fattura e' in scissione dei pagamenti: il cliente paga
--               totale - IVA - ritenuta. Il valore del documento NON cambia.
--   cig, cup  = codici dell'incarico (facoltativi)
--   rif_pa    = numero della determina o dell'ordine (facoltativo)

alter table public.gest_fatture
  add column if not exists scissione boolean not null default false,
  add column if not exists cig text,
  add column if not exists cup text,
  add column if not exists rif_pa text;

-- «totale» qui e' quello che il cliente paga davvero (gia' senza ritenuta):
-- con la scissione si toglie anche l'IVA. totale_documento resta uguale.
create or replace function public.gest_fattura_conti(p_fattura uuid)
 returns table(compenso numeric, cassa numeric, spese numeric, spese_iva numeric, sconto numeric, imponibile numeric, iva numeric, ritenuta numeric, totale_documento numeric, totale numeric, n_righe bigint, segno integer)
 language plpgsql
 stable
 set search_path to 'public', 'pg_catalog'
as $function$
declare
  f      public.gest_fatture%rowtype;
  v_forf boolean;
  v_qta  numeric[];
  v_prz  numeric[];
  v_iva  numeric[];
begin
  select * into f from public.gest_fatture where id = p_fattura;
  if not found then return; end if;

  -- 17 nov 2026: la fattura gia' emessa (ha il numero) e che si ricorda il
  -- suo regime usa QUELLO; le altre i Dati azienda di oggi, come prima.
  if f.numero is not null and coalesce(f.regime_fiscale, '') <> '' then
    v_forf := (f.regime_fiscale = 'RF19');
  else
    select (coalesce(a.regime_fiscale, '') = 'RF19') into v_forf
      from public.gest_azienda a where a.user_id = f.user_id;
  end if;

  select coalesce(array_agg(coalesce(x.qta,0)   order by coalesce(x.ordine,0), x.created_at, x.id), '{}'),
         coalesce(array_agg(coalesce(x.prezzo,0) order by coalesce(x.ordine,0), x.created_at, x.id), '{}'),
         coalesce(array_agg(coalesce(x.iva,0)    order by coalesce(x.ordine,0), x.created_at, x.id), '{}')
    into v_qta, v_prz, v_iva
    from public.gest_fattura_righe x where x.fattura_id = f.id;

  return query
    select c.compenso, c.cassa, c.spese, c.spese_iva, c.sconto, c.imponibile, c.iva, c.ritenuta,
           c.totale_documento,
           -- 24 nov 2026: scissione dei pagamenti, l'IVA la versa l'ente
           case when coalesce(f.scissione, false) then round(c.totale - c.iva, 2) else c.totale end,
           c.n_righe, c.segno
      from public.gest_fattura_parcella(
        coalesce(v_forf, false), f.cassa_perc, f.spese, f.spese_iva, f.spese_regime,
        f.sconto, f.bollo, f.ritenuta_perc, f.tipo, v_qta, v_prz, v_iva) c;
end
$function$;
