-- =====================================================================
-- TrovaImpresa — LA SPESA SI REGISTRA DAL CANTIERE
-- Da salvare come  sql/gest-spese-cantiere.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 — serve al «+ Rapido» dell'app del cantiere.
--
-- PERCHE'
-- Oggi dall'app del dipendente si puo' registrare UNA sola cosa che riguarda i
-- soldi: il movimento della carta aziendale (gest_carte_movimenti), e solo se
-- quella persona ha una carta assegnata.
-- La spesa del cantiere — quella che entra nel MARGINE del lavoro — sta in
-- gest_spese, e la puo' scrivere solo il titolare dal pannello.
-- Quindi il sacco di premiscelato comprato al volo dall'operaio, di tasca sua
-- o con i contanti del cantiere, oggi non lo registra nessuno: sparisce, e il
-- margine di quel lavoro sembra piu' bello di quello che e'.
--
-- COSA AGGIUNGE
--   1) gest_spese.inserito_da  -> chi l'ha registrata
--   2) il permesso di scrivere una spesa a chi ha la spunta "Pagamenti"
--
-- ⚠️ NESSUNA SPUNTA NUOVA. Si usa "Pagamenti", che nella scheda della persona
-- dice gia' testualmente "Vede la sua carta aziendale e REGISTRA LE SPESE".
-- Chi ha quella spunta e' gia' una persona a cui l'impresa lascia muovere
-- soldi: e' la stessa fiducia, non una in piu'. Una nona casella nella scheda
-- avrebbe solo aggiunto una scelta da fare senza aggiungere una decisione.
--
-- ⚠️ E NIENTE LETTURA. Il collaboratore puo' SCRIVERE una spesa, non leggere
-- quelle degli altri: l'elenco delle spese di un cantiere, messo in fila,
-- racconta i margini dell'impresa. Non e' roba da telefono di cantiere.
-- Correggere e cancellare restano del titolare, come sempre.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. CHI L'HA REGISTRATA
-- ---------------------------------------------------------------------
-- Solo il nome, come fa gia' gest_carte_movimenti.inserito_da: non un
-- collegamento alla squadra, perche' se quella persona domani non c'e' piu' la
-- spesa deve restare leggibile com'era. Una spesa e' un fatto contabile: e'
-- successa, e chi l'ha scritta e' parte del fatto.

alter table public.gest_spese
  add column if not exists inserito_da text;


-- ---------------------------------------------------------------------
-- 2. IL PERMESSO DI SCRIVERLA
-- ---------------------------------------------------------------------
-- ⚠️ La regola del titolare NON viene toccata: qui si AGGIUNGE soltanto.
-- Su Supabase le regole si sommano: quella di prima resta esattamente com'e'.

alter table public.gest_spese enable row level security;

drop policy if exists "gest_spese_team_insert" on public.gest_spese;
create policy "gest_spese_team_insert" on public.gest_spese
  for insert with check (
    gest_puo_sezione(user_id, 'pagamenti')
    /* la spesa deve stare su un lavoro: una spesa senza cantiere non entra in
       nessun margine e diventa un numero che non serve a niente */
    and lavoro_id is not null
  );


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- =====================================================================
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='gest_spese'
                        AND column_name='inserito_da')
      THEN 'NIENTE FATTO — manca la colonna «inserito_da». Rilancia il file tutto intero.'
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies
                      WHERE schemaname='public' AND tablename='gest_spese'
                        AND policyname='gest_spese_team_insert')
      THEN 'A META'' — la colonna c''e'' ma manca il permesso: dal cantiere la spesa non si potrebbe scrivere.'
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies
                      WHERE schemaname='public' AND tablename='gest_spese'
                        AND cmd IN ('ALL','SELECT'))
      THEN 'ATTENZIONE — su gest_spese non risulta nessuna regola di lettura: controlla di vedere ancora le tue spese nel pannello.'
    ELSE 'FATTO — dal cantiere si puo'' registrare una spesa, e quei soldi entrano nel margine del lavoro.'
  END AS risultato,
  (SELECT COUNT(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='gest_spese') AS permessi_sulle_spese,
  (SELECT COUNT(*) FROM public.gest_spese) AS spese_che_hai;
