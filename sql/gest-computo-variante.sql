-- ============================================================
-- IL COMPUTO DI VARIANTE — 20 agosto 2026
-- ============================================================
-- I lavori cambiano in corsa: il muro che sotto l'intonaco era
-- diverso, il cliente che aggiunge un bagno, la quantita' vera che
-- non e' quella disegnata. La variante e' il documento che dice
-- COSA E' CAMBIATO rispetto al computo di partenza, e quanto costa
-- in piu' o in meno.
--
-- Sui lavori privati oggi si fa a voce, ed e' li' che nascono le
-- liti. Sui lavori pubblici e' un documento vero.
--
-- Servono DUE colonne, non una tabella nuova:
--
--   gest_computi.variante_di       da quale computo nasce
--   gest_computo_voci.origine_id   da quale riga nasce ogni riga
--
-- ⚠️ PERCHE' SERVE ANCHE origine_id, e non basta il codice di tariffa.
-- Due lavorazioni possono avere lo STESSO codice in due capitoli
-- diversi (la stessa demolizione al piano terra e al primo piano), e
-- una descrizione si puo' correggere. Confrontando per codice o per
-- descrizione, una riga corretta risulterebbe «tolta» e «nuova»
-- insieme, e la variante direbbe una bugia. Con origine_id ogni riga
-- sa da dove viene, sempre.
--
-- ⚠️ TUTTE E DUE «on delete set null», non «cascade».
-- Cancellando il computo originale la variante NON deve sparire: e'
-- un documento suo, magari gia' mandato al cliente. Resta, e diventa
-- un computo normale che non ha piu' con cosa confrontarsi — e la
-- schermata lo dice, invece di mostrare numeri sbagliati.
--
-- ⚠️ NIENTE CONFRONTO SCRITTO NEL DATABASE. Le differenze (quantita'
-- prima, quantita' dopo, quanto in piu') si CALCOLANO ogni volta
-- dalle due colonne qui sopra. Scriverle vorrebbe dire che al primo
-- cambio di quantita' sarebbero vecchie senza che nessuno se ne
-- accorga: e' la stessa scelta delle date del cronoprogramma e della
-- quantita' delle lavorazioni.
--
-- NIENTE RLS DA RIFARE: le regole valgono sulla riga, non sulla
-- singola colonna. Restano quelle.
--
-- Si puo' eseguire piu' volte: se le colonne ci sono gia', non
-- succede niente.
-- ============================================================

alter table public.gest_computi
  add column if not exists variante_di uuid
  references public.gest_computi(id) on delete set null;

alter table public.gest_computo_voci
  add column if not exists origine_id uuid
  references public.gest_computo_voci(id) on delete set null;

-- per trovare in fretta «tutte le varianti di questo computo»
create index if not exists gest_computi_variante_idx
  on public.gest_computi (variante_di);

-- ⚠️ un computo non puo' essere la variante di se' stesso: sarebbe un
-- confronto con lo specchio, e la schermata girerebbe a vuoto.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'gest_computi_variante_non_se_stesso'
  ) then
    alter table public.gest_computi
      add constraint gest_computi_variante_non_se_stesso
      check (variante_di is null or variante_di <> id);
  end if;
end $$;

-- una riga di risultato che dice com'e' andata
select case
  when (
    select count(*) from information_schema.columns
     where table_schema = 'public'
       and (   (table_name = 'gest_computi'      and column_name = 'variante_di')
            or (table_name = 'gest_computo_voci' and column_name = 'origine_id'))
  ) = 2
  then 'FATTO — le due colonne ci sono: il computo di variante si salva.'
  else 'NON FATTO — mancano delle colonne. Riprova o dimmelo.'
end as esito;
