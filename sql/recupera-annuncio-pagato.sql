-- =====================================================================
-- RECUPERA L'ANNUNCIO GIÀ PAGATO
--
-- INCOLLA TUTTO QUESTO nell'SQL Editor, cambia le DUE RIGHE qui sotto,
-- e premi Run. Le due righe da sole non sono una query: servono tutte.
-- =====================================================================
do $$
declare
  -- ┌───────────────────────────────────────────────────────────────┐
  -- │  DA CAMBIARE — solo queste due righe                          │
  -- └───────────────────────────────────────────────────────────────┘

  v_sessione   text    := 'METTI-QUI-IL-STRIPE-SESSION-ID';

  v_centesimi  integer := 0;     -- IN CENTESIMI: 49,00 euro si scrive 4900

  -- ┌───────────────────────────────────────────────────────────────┐
  -- │  da qui in giù non si tocca niente                            │
  -- └───────────────────────────────────────────────────────────────┘
  --
  -- Il numero della sessione lo trovi con
  -- prove-claude/query-annuncio-da-recuperare-14ago.sql (colonna
  -- stripe_session_id). L'importo si legge su Stripe > Payments,
  -- cercando quel numero: NON si ricalcola dal listino, che può essere
  -- cambiato da allora. Un numero verosimile ma sbagliato dentro la
  -- contabilità è peggio che non avere la riga, perché sembra giusto.
  --
  -- ⚠️ I centesimi: se scrivi 49 invece di 4900 finiscono dentro 49
  -- centesimi. La query se ne accorge solo perché sotto i 5 euro si
  -- ferma e te lo chiede — sopra quella soglia non avrebbe modo di
  -- saperlo. Ricontrolla quella riga.
  --
  -- Se lasci i valori come stanno, NON scrive niente e te lo dice.

  v_ann     record;
  v_esito   json;
begin
  if v_sessione is null or v_sessione = 'METTI-QUI-IL-STRIPE-SESSION-ID'
     or btrim(v_sessione) = '' then
    raise notice ' ';
    raise notice '>>> NON HO SCRITTO NIENTE.';
    raise notice '>>> Manca il numero della sessione Stripe: apri il file e';
    raise notice '>>> riempi v_sessione (lo trovi con la query «guardare»).';
    return;
  end if;

  if v_centesimi is null or v_centesimi <= 0 then
    raise notice ' ';
    raise notice '>>> NON HO SCRITTO NIENTE.';
    raise notice '>>> Manca l''importo. Va scritto in CENTESIMI: 49,00 euro = 4900.';
    return;
  end if;

  -- ⚠️ un controllo che sembra esagerato e non lo e': se per sbaglio si
  -- scrive 49 invece di 4900, dentro la contabilita' finisce un incasso da
  -- 49 centesimi e nessuno se ne accorge mai piu'. Sotto i 5 euro, per un
  -- annuncio pubblicitario, e' quasi sicuramente questo l'errore.
  if v_centesimi < 500 then
    raise notice ' ';
    raise notice '>>> NON HO SCRITTO NIENTE.';
    raise notice '>>> % centesimi fanno % euro: per un annuncio e'' un importo molto strano.',
                 v_centesimi, round(v_centesimi::numeric/100, 2);
    raise notice '>>> Hai scritto gli euro invece dei centesimi?';
    raise notice '>>> Se e'' davvero cosi'' poco, togli questo controllo a mano.';
    return;
  end if;

  select * into v_ann
  from public.annunci_pubblicitari
  where stripe_session_id = v_sessione;

  if not found then
    raise notice ' ';
    raise notice '>>> NON HO SCRITTO NIENTE.';
    raise notice '>>> Nessun annuncio con quella sessione: ricontrolla il numero.';
    return;
  end if;

  -- si passa dalla funzione vera, non da un insert a mano: cosi' vale
  -- l'«unique» sul riferimento e rilanciare questo file non raddoppia
  -- l'incasso.
  select public.registra_pagamento(
    p_prodotto    => 'pubblicita',
    p_centesimi   => v_centesimi,
    p_riferimento => v_sessione,
    p_email       => null,
    p_impresa_id  => v_ann.impresa_id::text,   -- ⚠️ ::text — imprese.id e' un numero, non un uuid
    p_valuta      => 'eur',
    p_tipo_evento => 'recuperato-a-mano-14ago2026',
    p_quando      => null
  ) into v_esito;

  raise notice ' ';
  if (v_esito->>'ok') = 'true' then
    raise notice '>>> SCRITTO: % euro per l''annuncio %',
                 round(v_centesimi::numeric/100, 2), v_ann.id;
  elsif (v_esito->>'reason') = 'already_processed' then
    raise notice '>>> C''ERA GIA'': niente di nuovo, e nessun doppione.';
  else
    raise notice '>>> NON scritto: %', v_esito->>'reason';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- VERIFICA — cosa c'è adesso nella tabella dei pagamenti
-- ---------------------------------------------------------------------
select prodotto, importo_eur, riferimento, tipo_evento, quando
from public.pagamenti
order by quando desc;
