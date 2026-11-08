-- =====================================================================
-- 8 novembre 2026 — GLI AVVISI SUL TELEFONO (oltre alla domanda della sera)
-- Lo stesso telefono iscritto per la domanda della sera (gest_avvisi_sera)
-- puo' ricevere anche:
--   · mattina   = gli stessi avvisi dell'email del mattino (promemoria-mattina.js)
--   · richieste = appena arriva una richiesta dal sito (notifica-preventivo.js)
-- sera = la domanda della sera (avviso-sera-giro.js). Le righe che c'erano
-- gia' restano con la sera accesa: per loro non cambia niente.
-- ultimo_mattina: la notifica del mattino non parte due volte lo stesso giorno.
-- Solo colonne nuove, niente si toglie.
-- =====================================================================
alter table public.gest_avvisi_sera add column if not exists sera boolean not null default true;
alter table public.gest_avvisi_sera add column if not exists mattina boolean not null default false;
alter table public.gest_avvisi_sera add column if not exists richieste boolean not null default false;
alter table public.gest_avvisi_sera add column if not exists ultimo_mattina date;
