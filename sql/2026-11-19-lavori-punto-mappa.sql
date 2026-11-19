-- 19 nov 2026 (sì di Alex) — IL PUNTO DEL CANTIERE PASSA ALL'OPERAIO
-- La Mappa del gestionale trova il cantiere sulla carta. Adesso lo salva nel
-- lavoro, così sul telefono dell'operaio «Portami lì» porta a QUEL punto
-- (e non a una via con lo stesso nome in un altro comune).
-- · dove_lat / dove_lon : il punto trovato
-- · dove_km             : quanti km dall'ufficio (in linea d'aria)
-- · dove_geo            : l'indirizzo a cui appartiene il punto. Se l'indirizzo
--                         del lavoro cambia, il punto non vale più: l'app
--                         dell'operaio confronta e, se non combacia, usa il testo.
-- Solo colonne nuove: niente di vecchio viene toccato.
alter table public.gest_lavori
  add column if not exists dove_lat double precision,
  add column if not exists dove_lon double precision,
  add column if not exists dove_km  numeric(8,1),
  add column if not exists dove_geo text;
