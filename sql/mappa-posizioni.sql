-- ============================================================
-- mappa-posizioni.sql
-- Prepara "imprese" per la mappa.
--
-- PERCHE': su 87 imprese solo 4 hanno lat/lng. Le altre non
-- compaiono sulla mappa, oppure il sito va a cercare la posizione
-- della citta' UNA ALLA VOLTA mentre l'utente aspetta (1,1 secondi
-- per citta'). Con lat/lng gia' scritte, la mappa e' immediata.
--
-- Qui si aggiungono solo due caselle:
--   posizione_da = 'indirizzo'  -> il pallino e' sul punto vero
--   posizione_da = 'citta'      -> il pallino e' nella zona, non e'
--                                  l'indirizzo dell'impresa
--   posizione_il = quando e' stata messa
--
-- Serve perche' la scheda dell'impresa sappia se puo' scrivere
-- l'indirizzo o se deve scrivere "zona di Roma".
--
-- Le posizioni vere le riempie tools/riempi-mappa.html, che Alessio
-- apre dal suo computer (serve internet per chiedere a OpenStreetMap).
--
-- Da incollare nell'SQL Editor di Supabase. E' una migrazione sola.
-- ============================================================

alter table public.imprese add column if not exists posizione_da text;
alter table public.imprese add column if not exists posizione_il timestamptz;

-- il controllo si aggiunge una volta sola (Postgres non ha
-- "add constraint if not exists")
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'imprese_posizione_da_ok'
      and conrelid = 'public.imprese'::regclass
  ) then
    alter table public.imprese
      add constraint imprese_posizione_da_ok
      check (posizione_da is null or posizione_da in ('indirizzo', 'citta'));
  end if;
end $$;

-- Le due caselle nuove devono poterle LEGGERE anche i visitatori del
-- sito, come tutto il resto della scheda impresa. Se su "imprese" i
-- permessi fossero stati dati colonna per colonna, una colonna nuova
-- resterebbe invisibile e la scheda andrebbe in errore 403.
grant select (posizione_da, posizione_il) on public.imprese to anon, authenticated;

-- ------------------------------------------------------------
-- La riga di risultato: dice quanto lavoro resta da fare.
-- ------------------------------------------------------------
select
  'colonne posizione pronte'                                          as esito,
  count(*)                                                            as imprese,
  count(*) filter (where lat is not null and lng is not null)         as gia_sulla_mappa,
  count(*) filter (where lat is null and indirizzo is not null)       as da_fare_con_indirizzo,
  count(*) filter (where lat is null and indirizzo is null
                     and citta is not null)                           as da_fare_solo_citta,
  count(*) filter (where lat is null and indirizzo is null
                     and citta is null)                               as senza_niente
from public.imprese
where is_test = false;
