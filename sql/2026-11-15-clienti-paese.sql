-- 15 nov 2026 (sesto giro, MANCA 4) — IL PAESE DEL CLIENTE
-- Due lettere (CH, FR, DE...). VUOTO = ITALIA: i clienti di prima non cambiano.
-- La scheda cliente dell'App e del Noleggio (stessa tabella) ha la tendina
-- «Paese»: per un cliente estero il CAP si scrive libero e la provincia non c'e'.
-- Si puo' rieseguire.
alter table public.gest_clienti add column if not exists paese text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gest_clienti_paese_due_lettere') then
    alter table public.gest_clienti
      add constraint gest_clienti_paese_due_lettere check (paese is null or paese ~ '^[A-Z]{2}$');
  end if;
end $$;
