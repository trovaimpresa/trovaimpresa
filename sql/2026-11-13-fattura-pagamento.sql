-- =====================================================================
-- 13 nov 2026 — quarto giro del controllore, lista «MANCA», GRUPPO 1
-- 1) La fattura ha la SUA scadenza, il modo di pagamento e l'IBAN.
-- 2) La ricevuta di pagamento si lega a una fattura.
-- Si puo' rieseguire: non rompe niente.
-- =====================================================================

-- 1) FATTURA (App) e FATTURA DEL NOLEGGIO
--    scadenza        = entro quando va pagata. Vuota = data + i giorni di
--                      pagamento dei Dati azienda (la regola di prima).
--    modo_pagamento  = bonifico | contanti | assegno | carta | riba
--    iban            = l'IBAN scritto su QUESTA fattura (vuoto = Dati azienda)
alter table public.gest_fatture add column if not exists scadenza date;
alter table public.gest_fatture add column if not exists modo_pagamento text;
alter table public.gest_fatture add column if not exists iban text;
alter table public.nol_fatture  add column if not exists scadenza date;
alter table public.nol_fatture  add column if not exists modo_pagamento text;
alter table public.nol_fatture  add column if not exists iban text;

-- 2) RICEVUTA DI PAGAMENTO
--    fattura_id   = la fattura che questa ricevuta salda (o di cui e' acconto)
--    fattura_nome = «n. 15/2026», scritto una volta: resta anche se la
--                   fattura un giorno sparisce
alter table public.gest_ricevute_pagamento add column if not exists fattura_id uuid;
alter table public.gest_ricevute_pagamento add column if not exists fattura_nome text;

-- 3) CHAT CON AI, «liquidità a 30 giorni» (chat_liquidita)
--    Prima contava sempre «data + giorni di pagamento». Adesso, se la fattura
--    ha la SUA scadenza, vale quella. Tutto il resto e' uguale a prima.
create or replace function public.chat_liquidita(p_mestiere uuid)
 returns json
 language plpgsql
 security definer
 set search_path to 'public', 'auth', 'pg_catalog'
as $function$
declare
  v_chi uuid := auth.uid();
  v_oggi date := (now() at time zone 'Europe/Rome')::date;
  v_gg int;
  v_r json;
begin
  if v_chi is null or p_mestiere is null then
    return json_build_object('errore','manca chi chiede o il reparto');
  end if;
  if not exists (select 1 from public.gest_mestieri m where m.id = p_mestiere and m.user_id = v_chi) then
    return json_build_object('errore','questo reparto non e'' tuo');
  end if;

  select coalesce((select a.giorni_pagamento from public.gest_azienda a where a.user_id = v_chi limit 1), 30) into v_gg;
  if v_gg is null or v_gg < 0 then v_gg := 30; end if;

  with e as (
    select coalesce(f.scadenza, f.data + v_gg) as scad, t.totale
    from public.gest_fatture f
    join public.gest_fatture_totali t on t.fattura_id = f.id
    where f.user_id = v_chi and f.mestiere_id = p_mestiere
      and f.eliminato_il is null
      and coalesce(f.stato,'') <> 'bozza'
      and f.data_pagata is null
      and f.data is not null
  ), u as (
    select ff.scadenza as scad, ff.importo
    from public.gest_fatture_fornitori ff
    where ff.user_id = v_chi and ff.mestiere_id = p_mestiere
      and ff.eliminato_il is null
      and ff.data_pagata is null
  )
  select json_build_object(
    'oggi', v_oggi,
    'giorni_pagamento_usati', v_gg,
    'entrate', json_build_object(
      'gia_scadute',  (select json_build_object('quante',count(*),'totale',round(coalesce(sum(totale),0)::numeric,2)) from e where scad < v_oggi),
      'entro_7_giorni',  (select json_build_object('quante',count(*),'totale',round(coalesce(sum(totale),0)::numeric,2)) from e where scad >= v_oggi and scad <= v_oggi + 7),
      'da_8_a_14_giorni',(select json_build_object('quante',count(*),'totale',round(coalesce(sum(totale),0)::numeric,2)) from e where scad > v_oggi + 7 and scad <= v_oggi + 14),
      'da_15_a_30_giorni',(select json_build_object('quante',count(*),'totale',round(coalesce(sum(totale),0)::numeric,2)) from e where scad > v_oggi + 14 and scad <= v_oggi + 30)
    ),
    'uscite', json_build_object(
      'gia_scadute',  (select json_build_object('quante',count(*),'totale',round(coalesce(sum(importo),0)::numeric,2)) from u where scad is not null and scad < v_oggi),
      'entro_7_giorni',  (select json_build_object('quante',count(*),'totale',round(coalesce(sum(importo),0)::numeric,2)) from u where scad >= v_oggi and scad <= v_oggi + 7),
      'da_8_a_14_giorni',(select json_build_object('quante',count(*),'totale',round(coalesce(sum(importo),0)::numeric,2)) from u where scad > v_oggi + 7 and scad <= v_oggi + 14),
      'da_15_a_30_giorni',(select json_build_object('quante',count(*),'totale',round(coalesce(sum(importo),0)::numeric,2)) from u where scad > v_oggi + 14 and scad <= v_oggi + 30),
      'senza_scadenza',(select json_build_object('quante',count(*),'totale',round(coalesce(sum(importo),0)::numeric,2)) from u where scad is null)
    ),
    'saldo_previsto_30_giorni', round((
        coalesce((select sum(totale) from e where scad >= v_oggi and scad <= v_oggi + 30),0)
      - coalesce((select sum(importo) from u where scad >= v_oggi and scad <= v_oggi + 30),0))::numeric, 2)
  ) into v_r;
  return v_r;
end
$function$;
