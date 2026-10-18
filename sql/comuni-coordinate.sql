-- comuni-coordinate.sql — 18 ottobre 2026
-- Il guasto: solo meta' delle imprese (65 su 135) aveva lat/lng. La ricerca
-- «per vicinanza» delle pagine cerca-* non vedeva le altre, e chi cercava un
-- paese senza iscritti trovava «Nessun risultato» anche con imprese a 20 km.
-- Qui: una tabella con le coordinate di tutti i comuni (dati ISTAT 2018,
-- ~7.970 comuni) e un guardiano su `imprese` che, se lat/lng mancano o se
-- cambia la citta', le prende dal comune. Vale per tutti gli iscritti futuri.
-- I dati si caricano a parte (insert generati da italy_geo.json): qui solo
-- la struttura.

create table if not exists public.comuni_coordinate (
  chiave text primary key,   -- nome normalizzato: minuscolo, senza accenti, apostrofi e trattini = spazio
  nome   text not null,
  lat    double precision not null,
  lng    double precision not null
);
alter table public.comuni_coordinate enable row level security;
-- nessuna regola: la legge solo la funzione qui sotto (security definer)

create or replace function public.norm_comune(t text)
returns text language sql immutable as $$
  select btrim(regexp_replace(
    translate(
      lower(regexp_replace(regexp_replace(coalesce(t,''), '\s*\([^)]*\)\s*$', ''), ',.*$', '')),
      'àáâäèéêëìíîïòóôöùúûüç’''`-_/.',
      'aaaaeeeeiiiioooouuuuc       '),
    '\s+', ' ', 'g'));
$$;

create or replace function public.imprese_coordinate_da_comune()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if new.citta is null or btrim(new.citta) = '' then return new; end if;
  -- se cambia la citta' e le coordinate non sono state cambiate insieme,
  -- quelle vecchie sono della citta' di prima: si rifanno
  if tg_op = 'UPDATE' and new.citta is distinct from old.citta
     and new.lat is not distinct from old.lat and new.lng is not distinct from old.lng then
    new.lat := null; new.lng := null;
  end if;
  if new.lat is null or new.lng is null then
    select lat, lng into c from comuni_coordinate where chiave = norm_comune(new.citta);
    if found then new.lat := c.lat; new.lng := c.lng; end if;
  end if;
  return new;
exception when others then
  return new;  -- mai bloccare un'iscrizione o un salvataggio per questo
end $$;

drop trigger if exists trg_imprese_coordinate on public.imprese;
create trigger trg_imprese_coordinate
  before insert or update of citta, lat, lng on public.imprese
  for each row execute function public.imprese_coordinate_da_comune();
