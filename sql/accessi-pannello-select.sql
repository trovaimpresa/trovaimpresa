-- sql/accessi-pannello-select.sql
-- 13 settembre 2026 — perche' il contatore delle visite non ha mai scritto niente.
--
-- GIA' APPLICATO SU SUPABASE il 13 set 2026
-- (migrazione: accessi_pannello_select_propria_13set2026).
-- Questo file e' la copia scritta, per sapere cosa c'e' dentro il database.
--
-- ============================================================
-- IL GUASTO
-- La tabella accessi_pannello e' nata il 6 settembre con RLS accesa e
-- NESSUNA policy SELECT, di proposito: "l'iscritto scrive solo le sue
-- righe, legge solo il service role".
--
-- Dal 6 al 13 settembre la tabella e' rimasta a ZERO righe, mentre nello
-- stesso periodo c'erano stati 16 accessi veri.
--
-- LA CAUSA, misurata una riga per volta:
--   * INSERT semplice come iscritto .......... PASSA
--   * UPDATE ... WHERE id = ... .............. tocca 0 RIGHE (nessun errore!)
--   * upsert (ON CONFLICT DO UPDATE) ......... MUORE: 42501
--     "new row violates row-level security policy"
--
-- Con RLS accesa e zero policy SELECT, l'iscritto non VEDE nessuna riga —
-- nemmeno le proprie. E per aggiornare una riga bisogna prima vederla.
-- Il contatore fa un upsert ogni 15 secondi: moriva sempre.
--
-- ⛔ LA LEZIONE: l'UPDATE non dava errore, diceva "0 righe". Un guasto che
-- non fa rumore e' il peggiore. Nel file js/conta-pannello.js l'errore
-- veniva pure buttato via con .catch(function(){}) — per questo nessuno
-- se n'e' accorto per una settimana.
--
-- LA CURA, la piu' stretta possibile: ognuno vede SOLO le proprie righe.
-- L'intento di partenza resta intatto — nessuno legge le visite degli altri.
-- Verificato dopo l'applicazione:
--   * un altro iscritto vede .......... 0 righe
--   * un visitatore non iscritto vede . 0 righe
-- ============================================================

create policy ap_select_propria
  on public.accessi_pannello
  for select
  to authenticated
  using (user_id = auth.uid());
