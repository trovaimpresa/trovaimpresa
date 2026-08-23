-- ============================================================
-- TrovaImpresa — LE PRENOTAZIONI
-- 23 agosto 2026
--
-- PERCHE'
-- Nello studio del mercato le prenotazioni ce le hanno 14 gestionali su 19:
-- e' una delle otto cose che hanno tutti, e a noi manca. E' anche il pane
-- quotidiano di un noleggiatore: «mi tieni l'escavatore per lunedi'?».
--
-- ⛔ E soprattutto serve a non promettere due volte lo stesso mezzo. Oggi
--    il gestionale non se ne accorgerebbe nemmeno: due noleggi dello stesso
--    mezzo sugli stessi giorni si salvano tutti e due, in silenzio.
--
-- COSA AGGIUNGE
-- Una colonna sola: in che FASE sta un noleggio.
--   'prenotato'  il mezzo e' impegnato ma non e' ancora uscito
--   'fuori'      e' dal cliente
--   'rientrato'  e' tornato
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE DEI DATI CHE CI SONO. La fase dei
--    noleggi gia' scritti si ricava dalle loro date, una volta sola:
--      ha la data di rientro effettivo -> rientrato
--      esce nel futuro                 -> prenotato
--      tutto il resto                  -> fuori
--    Si puo' rilanciare: la seconda volta non tocca piu' niente, perche'
--    aggiorna solo le righe rimaste al valore di partenza.
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

alter table public.nol_noleggi
  add column if not exists fase              text not null default 'fuori',
  -- quando la prenotazione e' diventata un'uscita vera
  add column if not exists uscita_confermata_il timestamptz,
  -- una prenotazione puo' essere un'opzione, non ancora confermata
  add column if not exists prenotazione_nota text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_noleggi_fase_ck') then
    alter table public.nol_noleggi
      add constraint nol_noleggi_fase_ck check (fase in ('prenotato','fuori','rientrato'));
  end if;
end $$;

-- la fase dei noleggi che c'erano gia', ricavata dalle date.
-- ⚠️ Si toccano SOLO le righe rimaste al valore di partenza 'fuori' e mai
--    aggiornate a mano: cosi' rilanciare il file non disfa niente.
update public.nol_noleggi
   set fase = case
                when data_rientro_effettivo is not null then 'rientrato'
                when data_uscita is not null and data_uscita > current_date then 'prenotato'
                else 'fuori'
              end
 where fase = 'fuori'
   and uscita_confermata_il is null;

create index if not exists nol_noleggi_fase_idx on public.nol_noleggi(user_id, fase);
-- serve al controllo delle sovrapposizioni: «questo mezzo, in questi giorni»
create index if not exists nol_noleggi_mezzo_date_idx
  on public.nol_noleggi(mezzo_id, data_uscita, data_rientro_prevista);


-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA
-- ------------------------------------------------------------
select
  count(*)                                          as noleggi_in_tutto,
  count(*) filter (where fase = 'prenotato')        as prenotati,
  count(*) filter (where fase = 'fuori')            as fuori_adesso,
  count(*) filter (where fase = 'rientrato')        as rientrati
from public.nol_noleggi;
