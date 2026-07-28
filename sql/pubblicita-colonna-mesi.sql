-- sql/pubblicita-colonna-mesi.sql
-- Aggiunge la colonna "mesi" a annunci_pubblicitari.
--
-- Perché: finora la durata dell'abbonamento veniva ricavata da
-- data_inizio → data_fine, arrotondando ai mesi pieni. Con periodi non
-- standard (es. 45 giorni, o una proroga manuale) il dato usciva sbagliato.
-- Ora la durata acquistata è scritta esplicitamente sulla riga.
--
-- Da eseguire una volta sola nel SQL Editor di Supabase.

-- 1) Colonna nuova (idempotente: si può rilanciare senza rompere nulla)
alter table public.annunci_pubblicitari
  add column if not exists mesi smallint;

comment on column public.annunci_pubblicitari.mesi is
  'Durata acquistata in mesi (1, 3, 12). Fonte di verità per prezzo e rinnovi.';

-- 2) Backfill delle righe già esistenti, ricavando i mesi dalle date.
--    Solo dove mesi è ancora nullo, così non tocca i dati futuri.
update public.annunci_pubblicitari
set mesi = greatest(1, round(
      (data_fine - data_inizio)::numeric / 30.44
    )::int)
where mesi is null
  and data_inizio is not null
  and data_fine is not null;

-- 3) Normalizzo ai tagli del listino (1 / 3 / 12): gli arrotondamenti del
--    backfill possono aver prodotto 2 o 11 su periodi a cavallo di mesi corti.
update public.annunci_pubblicitari set mesi = 1  where mesi = 2;
update public.annunci_pubblicitari set mesi = 3  where mesi in (4);
update public.annunci_pubblicitari set mesi = 12 where mesi between 11 and 13;

-- 4) Controllo: nessuna riga deve restare senza durata
--    (le righe senza date restano a NULL: l'admin mostra "—")
select mesi, count(*) as righe
from public.annunci_pubblicitari
group by mesi
order by mesi nulls last;
