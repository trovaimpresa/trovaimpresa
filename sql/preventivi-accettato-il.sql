-- =====================================================================
-- 11 novembre 2026 — QUANDO UN PREVENTIVO E' STATO ACCETTATO
-- Serve a «Il tuo mese» in cima all'Assistente: «2 preventivi accettati»
-- vuol dire accettati QUESTO mese, non scritti questo mese.
-- La data la mette il database, da solo, quando lo stato diventa
-- «accettato» (da qualunque porta: gestionale, chat, firma del cliente).
-- Se il preventivo torna indietro, la data si toglie.
-- I preventivi accettati prima di oggi restano senza data: il gestionale
-- usa la data del preventivo al suo posto.
-- Rieseguirlo non fa danni.
-- =====================================================================
alter table public.gest_preventivi add column if not exists accettato_il timestamptz;

create or replace function public.gest_preventivi_accettato_il()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.stato = 'accettato' then
    if tg_op = 'INSERT' or old.stato is distinct from 'accettato' then
      new.accettato_il := now();
    else
      new.accettato_il := old.accettato_il;
    end if;
  else
    new.accettato_il := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_gest_preventivi_accettato_il on public.gest_preventivi;
create trigger trg_gest_preventivi_accettato_il
  before insert or update of stato, accettato_il on public.gest_preventivi
  for each row execute function public.gest_preventivi_accettato_il();
