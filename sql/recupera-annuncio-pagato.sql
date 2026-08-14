-- =====================================================================
-- RECUPERA L'ANNUNCIO GIÀ PAGATO
--
-- INCOLLA TUTTO QUESTO nell'SQL Editor, cambia il NUMERO qui sotto,
-- e premi Run. La risposta compare nella tabella dei risultati.
--
-- ┌─────────────────────────────────────────────────────────────────┐
-- │  DA CAMBIARE: lo 0 nella riga «select 0 as centesimi»           │
-- │  IN CENTESIMI — 49,00 euro si scrive 4900                       │
-- └─────────────────────────────────────────────────────────────────┘
--
-- 14 agosto 2026 (notte)
--
-- ---------------------------------------------------------------------
-- ⚠️ PERCHÉ QUESTO FILE È FATTO COSÌ E NON CON «raise notice»
-- ---------------------------------------------------------------------
-- La prima versione parlava con `raise notice`. **L'SQL Editor di Supabase
-- quei messaggi non li mostra.** Sullo schermo compariva solo
-- «Success. No rows returned», che si legge come «fatto» mentre voleva
-- dire «non ho scritto niente». Tutte le guardie erano lì e nessuna si
-- vedeva: la protezione c'era, l'avviso no.
--
-- Quindi adesso la risposta è una RIGA DI RISULTATO, che l'Editor mostra
-- sempre. Si legge quella e si sa cos'è successo.
--
-- ---------------------------------------------------------------------
-- L'IMPORTO SI LEGGE SU STRIPE, NON SI RICALCOLA
-- ---------------------------------------------------------------------
-- Il listino può essere cambiato da allora: ricalcolarlo darebbe un numero
-- verosimile e forse sbagliato, e un numero sbagliato dentro la
-- contabilità è peggio che non avere la riga — perché sembra giusto.
--
-- Il numero della sessione invece NON si ricopia a mano (quaranta
-- caratteri dove l, 1 e I si somigliano): visto che l'annuncio pagato è
-- uno solo, se lo prende da sé. Se un domani fossero più di uno, si ferma
-- e lo dice invece di indovinare quale.
-- =====================================================================

select
  case
    when v.centesimi is null or v.centesimi <= 0 then
      'NIENTE SCRITTO — manca l''importo: cambia lo 0 in cima. In centesimi: 49,00 euro = 4900'

    -- ⚠️ se per sbaglio si scrive 49 invece di 4900, nella contabilità
    -- finisce un incasso da 49 centesimi e non se ne accorge più nessuno.
    when v.centesimi < 500 then
      'NIENTE SCRITTO — ' || v.centesimi || ' centesimi fanno '
      || replace(round(v.centesimi::numeric/100, 2)::text, '.', ',')
      || ' euro: per un annuncio e'' stranissimo. Hai scritto gli euro invece dei centesimi?'

    when a.quanti = 0 then
      'NIENTE SCRITTO — non trovo nessun annuncio pagato con un numero di sessione Stripe'

    -- con più di un annuncio l'importo varrebbe per uno solo e non c'è modo
    -- di sapere quale: meglio fermarsi che scrivere la cifra sbagliata
    -- sotto il nome di qualcun altro.
    when a.quanti > 1 then
      'NIENTE SCRITTO — gli annunci pagati sono ' || a.quanti
      || ': questo file ne sa recuperare uno solo. Dimmelo e te lo rifaccio per tutti.'

    else
      case public.registra_pagamento(
             p_prodotto    => 'pubblicita',
             p_centesimi   => v.centesimi,
             p_riferimento => a.sessione,
             p_impresa_id  => a.impresa,          -- testo: imprese.id e' un numero
             p_tipo_evento => 'recuperato-a-mano-14ago2026'
           ) ->> 'ok'
        when 'true' then
          'SCRITTO: ' || replace(round(v.centesimi::numeric/100, 2)::text, '.', ',')
          || ' euro per l''annuncio dell''impresa ' || a.impresa
          || ' — guardalo nel pannello, sezione Incassi'
        else
          'C''ERA GIA'' — nessun doppione, la riga era stata gia'' scritta'
      end
  end as risultato

from
  -- ┌───────────────────────────────────────────────────────────────┐
  -- │  QUESTA E'' LA RIGA DA CAMBIARE                                │
  -- └───────────────────────────────────────────────────────────────┘
  (select 0 as centesimi) v,

  (select count(*)                     as quanti,
          max(stripe_session_id)       as sessione,
          max(impresa_id::text)        as impresa
     from public.annunci_pubblicitari
    where stato = 'pagato'
      and stripe_session_id is not null) a;
