-- ============================================================
-- IL CRONOPROGRAMMA DEI LAVORI — 20 agosto 2026
-- ============================================================
-- Le lavorazioni del computo messe sul calendario: quando comincia
-- ogni fase e quanto dura. Sui lavori pubblici è obbligatorio; a
-- un'impresa serve per sapere quando mandare la squadra e quando
-- ordinare i materiali.
--
-- SCELTA IMPORTANTE: la durata sta sul CAPITOLO, non sulla singola
-- lavorazione. Su un computo da 87 righe scrivere 87 durate è una
-- serata di lavoro, e nessuno programma la singola voce di prezzario:
-- in cantiere si ragiona per fasi (Demolizioni, Murature, Impianti).
-- Sei numeri invece di ottantasette.
--
-- Servono TRE colonne, non una tabella nuova:
--
--   gest_computi.data_inizio        quando comincia il cantiere
--   gest_computo_capitoli.giorni    quanti GIORNI DI LAVORO dura la fase
--   gest_computo_capitoli.insieme   true = comincia insieme al capitolo
--                                   prima, invece che dopo (fasi in
--                                   parallelo: mentre l'idraulico fa i
--                                   tubi, l'elettricista tira i cavi)
--
-- ⚠️ LE DATE NON SI SCRIVONO NEL DATABASE, SI CALCOLANO.
-- Qui dentro stanno solo la data di partenza e le durate. Chi comincia
-- quando lo decide la catena: ogni capitolo parte quando finisce il
-- precedente, saltando sabato e domenica. Se le date fossero scritte,
-- basterebbe spostare l'inizio del cantiere di un giorno per averle
-- tutte sbagliate e nessuno che se ne accorge. È la stessa scelta
-- della quantità delle lavorazioni, che il gestionale LEGGE e non
-- scrive mai.
--
-- NIENTE RLS DA RIFARE: le regole di gest_computi e
-- gest_computo_capitoli valgono sulla riga, non sulla singola
-- colonna. Restano quelle.
--
-- Si può eseguire più volte: se le colonne ci sono già, non succede
-- niente.
-- ============================================================

alter table public.gest_computi
  add column if not exists data_inizio date;

alter table public.gest_computo_capitoli
  add column if not exists giorni integer;

alter table public.gest_computo_capitoli
  add column if not exists insieme boolean not null default false;

-- ⚠️ una durata negativa non esiste, e una da 3000 giorni è un errore
-- di battitura (sono più di otto anni). Il gestionale lo dice già a
-- schermo, ma il database non deve fidarsi di quello che gli arriva:
-- la stessa colonna la scrive anche chi domani userà un altro modo.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'gest_capitoli_giorni_sensati'
  ) then
    alter table public.gest_computo_capitoli
      add constraint gest_capitoli_giorni_sensati
      check (giorni is null or (giorni >= 0 and giorni <= 2000));
  end if;
end $$;

-- una riga di risultato che dice com'è andata
select case
  when (
    select count(*) from information_schema.columns
     where table_schema = 'public'
       and (   (table_name = 'gest_computi'          and column_name = 'data_inizio')
            or (table_name = 'gest_computo_capitoli' and column_name = 'giorni')
            or (table_name = 'gest_computo_capitoli' and column_name = 'insieme'))
  ) = 3
  then 'FATTO — le tre colonne ci sono: il cronoprogramma si salva.'
  else 'NON FATTO — mancano delle colonne. Riprova o dimmelo.'
end as esito;
