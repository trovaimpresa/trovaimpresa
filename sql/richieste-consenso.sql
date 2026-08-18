-- =====================================================================
-- IL CONSENSO SCRITTO SULLE RICHIESTE DEI CLIENTI — 16 agosto 2026
--
-- La funzione `richiesta-cliente.js` manda nome, telefono ed email del
-- cliente a un massimo di 5 imprese. Da oggi il cliente deve mettere una
-- spunta, e qui si scrive QUANDO l'ha messa e COSA c'era scritto.
--
-- Senza la frase esatta il consenso non si puo' dimostrare: fra un anno
-- il testo della pagina sara' cambiato, e quello che conta e' quello che
-- aveva davanti agli occhi lui, quel giorno.
--
-- Si puo' rilanciare quante volte si vuole: non fa danni.
-- =====================================================================

alter table public.richieste_clienti
  add column if not exists consenso_at    timestamptz,
  add column if not exists consenso_testo text;

comment on column public.richieste_clienti.consenso_at is
  'Quando il cliente ha messo la spunta. Vuoto = richiesta arrivata prima del 16 agosto 2026.';
comment on column public.richieste_clienti.consenso_testo is
  'La frase esatta che il cliente ha accettato, com''era scritta quel giorno.';

-- Le richieste vecchie restano com'erano: non si inventa un consenso che
-- non c'e' stato. Restano riconoscibili perche' consenso_at e' vuoto.

-- ---------------------------------------------------------------------
-- LA RIGA DI RISULTATO (l'SQL Editor i «notice» non li mostra)
-- ---------------------------------------------------------------------
select
  'FATTO' as esito,
  count(*)                                    as richieste_in_tutto,
  count(*) filter (where consenso_at is null) as senza_consenso_scritto,
  count(*) filter (where consenso_at is not null) as con_consenso_scritto
from public.richieste_clienti;
