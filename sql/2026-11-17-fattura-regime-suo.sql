-- ============================================================
-- 17 novembre 2026 — UNA FATTURA SI CONTA COL REGIME CHE AVEVA QUANDO E' NATA
--
-- gest_fattura_conti() leggeva il forfettario dai Dati azienda di OGGI.
-- Chi cambia regime (ordinario -> forfettario, o il contrario) si
-- ritrovava le fatture vecchie, gia' emesse con l'IVA, contate senza IVA:
-- chat, email del mattino e «Farsi pagare» dicevano un numero piu' basso
-- del vero (caso misurato: 1.850 invece di 2.345).
--
-- Regola nuova, la stessa di fattBasi() in js/gest-fatture.js:
--   · fattura COL NUMERO che si ricorda il suo regime -> usa il suo;
--   · bozza, o fattura senza regime scritto          -> i Dati azienda di oggi.
--
-- Cambia solo come si sceglie v_forf: il conto (gest_fattura_parcella)
-- non e' toccato. Al 17 nov nel database c'e' UNA sola fattura che cambia
-- (quella di prova del fondatore). Si puo' rilanciare.
-- ============================================================
CREATE OR REPLACE FUNCTION public.gest_fattura_conti(p_fattura uuid)
 RETURNS TABLE(compenso numeric, cassa numeric, spese numeric, spese_iva numeric, sconto numeric, imponibile numeric, iva numeric, ritenuta numeric, totale_documento numeric, totale numeric, n_righe bigint, segno integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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

  -- ⚠️ stesso ordine del file per lo SDI: «la riga numero 3» deve voler dire
  --    la stessa cosa nei due posti.
  select coalesce(array_agg(coalesce(x.qta,0)   order by coalesce(x.ordine,0), x.created_at, x.id), '{}'),
         coalesce(array_agg(coalesce(x.prezzo,0) order by coalesce(x.ordine,0), x.created_at, x.id), '{}'),
         coalesce(array_agg(coalesce(x.iva,0)    order by coalesce(x.ordine,0), x.created_at, x.id), '{}')
    into v_qta, v_prz, v_iva
    from public.gest_fattura_righe x where x.fattura_id = f.id;

  return query
    select * from public.gest_fattura_parcella(
      coalesce(v_forf, false), f.cassa_perc, f.spese, f.spese_iva, f.spese_regime,
      f.sconto, f.bollo, f.ritenuta_perc, f.tipo, v_qta, v_prz, v_iva);
end
$function$;
