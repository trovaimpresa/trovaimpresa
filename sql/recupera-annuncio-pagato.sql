-- =====================================================================
-- RECUPERA L'ANNUNCIO GIÀ PAGATO
--
-- INCOLLA TUTTO QUESTO nell'SQL Editor, cambia UNA RIGA qui sotto,
-- e premi Run.
-- =====================================================================
do $$
declare
  -- ┌───────────────────────────────────────────────────────────────┐
  -- │  DA CAMBIARE — una riga sola                                  │
  -- └───────────────────────────────────────────────────────────────┘

  v_centesimi  integer := 0;     -- IN CENTESIMI: 49,00 euro si scrive 4900

  -- ┌───────────────────────────────────────────────────────────────┐
  -- │  da qui in giù non si tocca niente                            │
  -- └───────────────────────────────────────────────────────────────┘
  --
  -- ⚠️ IL NUMERO DELLA SESSIONE NON SI RICOPIA A MANO.
  -- È una cosa tipo «cs_live_a1hDc2trSOMnaSCDIxtWnn1Lb1GiXO2A3Zuezh...»:
  -- quaranta caratteri a caso, dove l, 1 e I si somigliano tutti. Ricopiarlo
  -- vuol dire sbagliarlo. Visto che l'annuncio pagato è UNO SOLO, questo
  -- file se lo va a prendere da sé — e se un domani ce ne fosse più di uno
  -- si ferma e lo dice, invece di indovinare quale.
  --
  -- L'importo invece va letto su Stripe > Payments (cerca quel numero, che
  -- copi dal risultato della query, non dalle mie righe). NON si ricalcola
  -- dal listino: può essere cambiato da allora, e un numero verosimile ma
  -- sbagliato dentro la contabilità è peggio che non avere la riga, perché
  -- sembra giusto.
  --
  -- ⚠️ I centesimi: se scrivi 49 invece di 4900 finiscono dentro 49
  -- centesimi. Sotto i 5 euro questo file si ferma e te lo chiede — sopra
  -- quella soglia non avrebbe modo di saperlo. Ricontrolla quella riga.

  v_quanti  integer;
  v_ann     record;
  v_esito   json;
begin
  if v_centesimi is null or v_centesimi <= 0 then
    raise notice ' ';
    raise notice '>>> NON HO SCRITTO NIENTE.';
    raise notice '>>> Manca l''importo. Va scritto in CENTESIMI: 49,00 euro = 4900.';
    return;
  end if;

  if v_centesimi < 500 then
    raise notice ' ';
    raise notice '>>> NON HO SCRITTO NIENTE.';
    raise notice '>>> % centesimi fanno % euro: per un annuncio e'' un importo molto strano.',
                 v_centesimi, round(v_centesimi::numeric/100, 2);
    raise notice '>>> Hai scritto gli euro invece dei centesimi?';
    raise notice '>>> Se e'' davvero cosi'' poco, togli questo controllo a mano.';
    return;
  end if;

  select count(*) into v_quanti
  from public.annunci_pubblicitari
  where stato = 'pagato' and stripe_session_id is not null;

  if v_quanti = 0 then
    raise notice ' ';
    raise notice '>>> NON HO SCRITTO NIENTE.';
    raise notice '>>> Non trovo nessun annuncio pagato con un numero di sessione.';
    return;
  end if;

  -- ⚠️ con piu' di un annuncio, l'importo che hai scritto varrebbe per uno
  -- solo e non c'e' modo di sapere quale. Meglio fermarsi che scrivere la
  -- cifra sbagliata sotto il nome di qualcun altro.
  if v_quanti > 1 then
    raise notice ' ';
    raise notice '>>> NON HO SCRITTO NIENTE.';
    raise notice '>>> Gli annunci pagati sono %, e questo file ne sa recuperare uno solo.', v_quanti;
    raise notice '>>> Dimmelo e te lo rifaccio per tutti quanti.';
    return;
  end if;

  select * into v_ann
  from public.annunci_pubblicitari
  where stato = 'pagato' and stripe_session_id is not null;

  -- si passa dalla funzione vera, non da un insert a mano: cosi' vale
  -- l'«unique» sul riferimento e rilanciare questo file non raddoppia
  -- l'incasso.
  select public.registra_pagamento(
    p_prodotto    => 'pubblicita',
    p_centesimi   => v_centesimi,
    p_riferimento => v_ann.stripe_session_id,
    p_email       => null,
    -- ⚠️ ::text — imprese.id su TrovaImpresa e' un numero (67), non un uuid
    p_impresa_id  => v_ann.impresa_id::text,
    p_valuta      => 'eur',
    p_tipo_evento => 'recuperato-a-mano-14ago2026',
    p_quando      => null
  ) into v_esito;

  raise notice ' ';
  if (v_esito->>'ok') = 'true' then
    raise notice '>>> SCRITTO: % euro per l''annuncio dell''impresa %',
                 round(v_centesimi::numeric/100, 2), v_ann.impresa_id;
  elsif (v_esito->>'reason') = 'already_processed' then
    raise notice '>>> C''ERA GIA'': niente di nuovo, e nessun doppione.';
  else
    raise notice '>>> NON scritto: %', v_esito->>'reason';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- VERIFICA — cosa c'è adesso nella tabella dei pagamenti
-- ---------------------------------------------------------------------
select prodotto, importo_eur, impresa_id, riferimento, tipo_evento, quando
from public.pagamenti
order by quando desc;
