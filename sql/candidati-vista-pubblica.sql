-- ============================================================
-- TrovaImpresa — Bacheca candidature: contatti visibili solo alle imprese
-- Agosto 2026
--
-- Problema: chiunque, anche senza login, poteva leggere nome, cognome,
-- telefono ed email di tutti i candidati. Nascondere i contatti solo
-- nella pagina non basta: i dati passano comunque dal browser e chiunque
-- può leggerli. Vanno tolti alla fonte.
--
-- Soluzione: una vista pubblica che espone SOLO i campi non sensibili.
-- La pagina usa la vista per i visitatori e la tabella vera per le
-- imprese che hanno fatto login.
-- ============================================================

-- 1) Vista pubblica: niente cognome intero, niente telefono, niente email, niente CV
create or replace view public.candidati_lavoro_pubblici as
select
  id,
  nome,
  case
    when cognome is null or cognome = '' then null
    else left(cognome, 1) || '.'
  end as iniziale_cognome,
  mestiere,
  citta,
  provincia,
  regione,
  eta,
  sesso,
  anni_esperienza,
  competenze,
  created_at
from public.candidati_lavoro;

-- 2) La vista è leggibile da tutti
grant select on public.candidati_lavoro_pubblici to anon, authenticated;


-- ============================================================
-- 3) SECONDO PASSO — da eseguire SOLO DOPO aver verificato che
--    la bacheca candidature funziona ancora (sia da sloggato che
--    da impresa loggata).
--
--    Questo comando toglie ai visitatori non registrati la lettura
--    diretta della tabella con i contatti. È il comando che rende
--    la protezione reale invece che solo estetica.
--
--    Se dopo averlo eseguito qualcosa smette di funzionare, si torna
--    indietro con:  grant select on public.candidati_lavoro to anon;
-- ============================================================

-- revoke select on public.candidati_lavoro from anon;
