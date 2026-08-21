-- ============================================================
-- LA VARIANTE NON SI CONFRONTAVA — 21 agosto 2026
-- ============================================================
-- Il 20 agosto è stato aggiunto `gest_computo_voci.origine_id`: ogni riga
-- di una variante si ricorda da quale riga del computo di partenza nasce.
-- La colonna c'è, ed è scritta giusta.
--
-- ⛔ MA IL GESTIONALE NON LEGGE LA TABELLA: legge la VISTA
--    `gest_computo_voci_calc` (perché è lì che sta la quantità vera,
--    quella sommata dalle misure). E la vista elenca le colonne UNA PER
--    UNA: `origine_id` non era fra quelle. Quindi alla schermata
--    «Cosa è cambiato» arrivava sempre `origine_id` vuoto.
--
-- COSA SI VEDEVA: ogni riga della variante risultava AGGIUNTA e ogni
-- riga dell'originale risultava TOLTA. Su una variante appena creata,
-- identica al computo di partenza, la pagina elencava tutte le
-- lavorazioni due volte invece di dire «non è cambiato niente».
-- Il totale in fondo era giusto — ed è il motivo per cui il difetto non
-- si vedeva dai numeri: le righe uguali si annullano comunque.
--
-- LA LEZIONE: una colonna aggiunta a una tabella NON arriva da sola in
-- una vista che elenca le colonne per nome. Chi aggiunge una colonna che
-- il gestionale deve LEGGERE deve chiedersi da dove la legge.
--
-- ============================================================
-- PERCHÉ «create or replace» E NON «drop + create»
-- ============================================================
-- Da questa vista dipendono `gest_computo_totali` e
-- `gest_sal_righe_calc` (e da quella, `gest_sal_totali`). Un `drop` le
-- porterebbe via tutte e andrebbero riscritte a mano: quattro viste
-- ricopiate a memoria è il modo migliore per perdere un pezzo.
-- `create or replace` le lascia dove sono, a patto di NON cambiare né
-- l'ordine né il tipo delle colonne che ci sono già, e di aggiungere le
-- nuove SOLO IN FONDO. È esattamente quello che si fa qui.
--
-- Nessun dato viene toccato: è una vista, non una tabella.
-- Si può eseguire più volte.
-- ============================================================

create or replace view public.gest_computo_voci_calc
with (security_invoker = true)
as
select
  v.id, v.user_id, v.computo_id, v.capitolo_id, v.ordine,
  v.codice, v.descrizione, v.unita, v.prezzo_unitario,
  v.quantita_manuale, v.incidenza_manodopera, v.oneri_sicurezza, v.note,
  -- la quantità CHIUSA a tre decimali: è quella che si stampa ed è quella
  -- che si moltiplica. Una sola quantità, non due.   (invariata)
  round(
    (case when v.quantita_manuale then v.quantita
          else coalesce(m.somma, 0) end), 3
  )::numeric(16,5) as quantita,
  (round(
     (case when v.quantita_manuale then v.quantita
           else coalesce(m.somma, 0) end), 3
   ) * v.prezzo_unitario)::numeric(16,2) as importo,
  coalesce(m.righe, 0) as misure,
  -- ⬇⬇ L'UNICA COSA NUOVA, e va IN FONDO ⬇⬇
  -- da quale riga del computo di partenza nasce questa riga.
  -- Vuota su un computo normale; piena solo sulle varianti.
  v.origine_id
from public.gest_computo_voci v
left join (
  select voce_id, sum(quantita) as somma, count(*) as righe
    from public.gest_computo_misure
   group by voce_id
) m on m.voce_id = v.id;

grant select on public.gest_computo_voci_calc to authenticated;

-- ---------------------------------------------------------------------
-- UNA RIGA DI RISULTATO che dice com'è andata
-- ---------------------------------------------------------------------
select case
  when exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='gest_computo_voci_calc'
       and column_name='origine_id')
  then 'FATTO — adesso la variante sa da dove viene ogni riga: la pagina «Cosa è cambiato» funziona.'
  else 'NON FATTO — la vista non ha origine_id. Riprova o dimmelo.'
end as esito;
