-- =====================================================================
-- 10 nov 2026 — LO SCONTO NEL PREVENTIVO + LE RICEVUTE DI PAGAMENTO
-- Richiesta di Spazio Giardino (Roma, artigiano) dalla chat del gestionale.
-- DA ESEGUIRE UNA VOLTA nello SQL Editor di Supabase.
-- Si puo' rieseguire: non rompe niente.
-- =====================================================================

-- 1) LO SCONTO DEL PREVENTIVO
--    sconto      = euro fissi
--    sconto_perc = percentuale (se c'e', vince lei e gli euro si ricalcolano)
alter table public.gest_preventivi add column if not exists sconto numeric;
alter table public.gest_preventivi add column if not exists sconto_perc numeric;

-- 2) LA VISTA DEI TOTALI: lo sconto si toglie dalla somma delle voci PRIMA
--    dell'IVA. Solo imprese e artigiani (lo studio ha la parcella).
--    ⛔ La stessa regola sta in prevSconto() di js/gest-preventivi.js.
--    Le colonne di prima restano uguali e nello stesso ordine; due nuove in fondo.
create or replace view public.gest_preventivi_totali
with (security_invoker = true) as
select
  p.id           as preventivo_id,
  p.user_id,
  p.mestiere_id,
  q.compenso_out as compenso,
  q.cassa,
  q.spese_out    as spese,
  q.imponibile,
  q.iva,
  q.ritenuta,
  q.totale,
  r.n_righe,
  r.somma        as totale_voci,
  s.sconto
from public.gest_preventivi p
left join public.imprese i on i.user_id = p.user_id
left join lateral (
  select
    coalesce(sum(round(
      (case when coalesce(x.qta, 0) = 0 then 1 else x.qta end) * coalesce(x.prezzo, 0), 2)), 0) as somma,
    count(*) as n_righe
  from public.gest_preventivo_righe x
  where x.preventivo_id = p.id
    and coalesce(x.sezione, false) = false
) r on true
left join lateral (
  select case
    when coalesce(i.tipo, '') = 'professionista' then 0::numeric
    else least(greatest(
      case when coalesce(p.sconto_perc, 0) > 0 then round(r.somma * p.sconto_perc / 100, 2)
           else round(coalesce(p.sconto, 0), 2) end, 0), r.somma)
  end as sconto
) s on true
left join lateral public.gest_parcella(
  r.somma - s.sconto,
  coalesce(p.cassa_perc, 0),
  p.iva_perc,
  coalesce(p.ritenuta, false),
  p.ritenuta_perc,
  coalesce(p.spese_forfait, 0),
  coalesce(i.tipo, '') = 'professionista'
) q on true;

-- 3) LE RICEVUTE DI PAGAMENTO (documento NON fiscale)
--    Numerate da 1 ogni anno. Ognuno vede solo le sue.
create table if not exists public.gest_ricevute_pagamento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  mestiere_id uuid,
  cliente_id uuid,
  cli_nome text,
  anno integer not null,
  numero integer not null,
  data date not null default current_date,
  importo numeric not null,
  causale text,
  metodo text,
  note text,
  created_at timestamptz not null default now(),
  eliminato_il timestamptz
);
create index if not exists gest_ricevute_pagamento_user
  on public.gest_ricevute_pagamento(user_id, anno, numero);
alter table public.gest_ricevute_pagamento enable row level security;
drop policy if exists gest_ricevute_pagamento_own on public.gest_ricevute_pagamento;
create policy gest_ricevute_pagamento_own on public.gest_ricevute_pagamento
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.gest_ricevute_pagamento to authenticated;
revoke all on public.gest_ricevute_pagamento from anon;
