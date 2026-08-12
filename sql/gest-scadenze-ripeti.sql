-- ============================================================
-- SCADENZE CHE SI RIPETONO
-- 12 agosto 2026
-- ============================================================
--
-- Da eseguire UNA VOLTA SOLA in Supabase: SQL Editor -> incolla tutto -> Run.
-- Si puo' rilanciare senza rischi: ha "if not exists".
--
-- IL GESTIONALE FUNZIONA ANCHE PRIMA DI LANCIARLO. Il codice se ne accorge da
-- solo: se la colonna non c'e', la tendina "Si ripete" viene tolta al momento
-- del salvataggio e la scadenza si salva lo stesso, con un messaggio che dice
-- che serve questo file. Nessuna schermata bianca, niente dati persi.
--
-- COSA RISOLVE
-- Segnavi "fatta" la revisione del furgone, il DURC, l'assicurazione, la
-- taratura della stazione totale, la visita medica di un operaio... e il
-- gestionale non ti avvisava MAI PIU'. Ogni scadenza era una volta sola.
-- Con questa colonna una scadenza puo' dire "mi ripeto ogni N mesi": appena la
-- segni fatta, quella dopo nasce da sola con la data gia' giusta.
--
-- COSA AGGIUNGE
--   gest_scadenze.ripeti_mesi  -> ogni quanti mesi si ripete (0 o NULL = mai)
--
-- Non tocca nessuna riga esistente: le scadenze che hai adesso restano tutte
-- con ripeti_mesi vuoto, cioe' "non si ripete", esattamente come oggi.
-- ============================================================

alter table if exists public.gest_scadenze
  add column if not exists ripeti_mesi integer;

comment on column public.gest_scadenze.ripeti_mesi is
  'Ogni quanti mesi si ripete la scadenza. Vuoto o 0 = non si ripete. Quando la scadenza viene segnata "fatta", il gestionale ne crea una nuova con la data spostata avanti di questi mesi.';

-- una scadenza non si ripete "ogni -3 mesi", e nemmeno ogni 100 anni:
-- il vincolo evita che un errore di battitura crei date senza senso.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'gest_scadenze_ripeti_mesi_ok'
  ) then
    alter table public.gest_scadenze
      add constraint gest_scadenze_ripeti_mesi_ok
      check (ripeti_mesi is null or (ripeti_mesi >= 0 and ripeti_mesi <= 120));
  end if;
end $$;

-- ============================================================
-- COME CONTROLLARE CHE SIA ANDATA
-- Incolla anche questa e premi Run: deve restituire una riga.
-- ============================================================
-- select column_name, data_type
--   from information_schema.columns
--  where table_name = 'gest_scadenze' and column_name = 'ripeti_mesi';
