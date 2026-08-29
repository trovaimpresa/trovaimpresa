/* =====================================================================
   I CENTESIMI CONTATI IN MODO ESATTO — 29 agosto 2026
   TrovaImpresa · gestionale

   ⛔ IL DIFETTO CHE QUESTO FILE CHIUDE
   `Math.round(n*100)/100` sbaglia, e non di rado: il browser tiene i
   numeri in VIRGOLA MOBILE, e 2280,805 x 100 li' fa 228080,49999999997
   invece di 228080,5. Mezzo centesimo esatto viene letto come «poco meno
   di mezzo», l'arrotondamento va IN GIU' e si perde un centesimo.
   Postgres tiene i numeri cifra per cifra e arrotonda IN SU, che e' la
   regola giusta. Misurato su 200.000 parcelle: 252 numeri diversi, uno
   ogni 794.

   ⛔ NON E' IL DATABASE CHE SBAGLIA: E' IL BROWSER. Percio' si e' portato
      il browser a contare come il database, mai il contrario.

   ⚠️ COME FA A INDOVINARE. Non indovina: NON guarda i bit del numero,
      guarda le CIFRE che il numero ha davvero, prendendone QUINDICI
      (`toPrecision(15)`). Un numero in doppia precisione ne porta poco
      meno di sedici: la sedicesima e' polvere della virgola mobile, e
      buttarla via rimette in piedi il numero che l'utente ha scritto —
      «2280.805», non «2280.80499999999». Da li' in poi si lavora con
      NUMERI INTERI (BigInt), dove la virgola mobile non c'e' e nessun
      errore e' possibile.

   ⛔ TRE BUCHI, NON UNO. La virgola mobile sbaglia in tre punti diversi,
      e servono tre rimedi:
        1. l'ARROTONDAMENTO   → `_cent2`      (uno ogni 794)
        2. la MOLTIPLICAZIONE → `_centMult` · `_centPerc` · `_centMulDiv`
                                (due ogni cento: molto piu' frequente)
        3. la SOMMA           → la polvere, tolta dalle quindici cifre
      Chiuderne uno solo non basta: sono stati misurati tutti e tre.

   ⚠️ CHI LO USA (se ne aggiungi uno, mettilo in questa lista)
      · gestionale-app.html — impRiga, calcolaParcella e i totali dei
        preventivi
      · js/gest-fatture.js  — fattBasi, il file per lo SDI e i PDF
      · `eur2` e `eurPdf` — anche SCRIVERE un numero e' un arrotondamento
      Non si ricopia da nessuna parte: e' la regola 6 del gestionale, una
      formula dei soldi sta in un posto solo.

   ⚠️ NON tocca i documenti gia' salvati: fa solo il conto, e il conto lo
      rifa' chi apre il documento. Le fatture gia' mandate allo SDI si
      portano dietro i loro numeri e non si ricalcolano.

   Prove: prove/conti/banco.js (browser contro conto esatto) e
          prove/vista-fatture/banco.js (browser contro Supabase)
   ===================================================================== */
(function (glob) {
  'use strict';

  /* spezza un numero nelle sue cifre vere: segno, parte intera, decimali.
     Torna null quando il numero non ha una scrittura decimale semplice
     (infinito, non-numero, o notazione con la «e» dei numeri enormi o
     piccolissimi): in quei casi chi chiama torna al conto di prima, che
     su numeri simili non fa nessuna differenza. */
  function cifre(n) {
    n = +n;
    if (!isFinite(n)) return null;
    /* ⛔ 29 agosto 2026 (notte) — LA POLVERE DELLE SOMME.
       Sommando importi gia' a due decimali la virgola mobile lascia della
       polvere: 729,34 + 19.488,19 + 4.450,37 li' fa 24.667,899999999998, e
       il 5% di quel numero e' 1.233,3949... invece di 1.233,395, cioe' un
       centesimo in meno. Un numero in doppia precisione porta poco meno di
       SEDICI cifre buone: prendendone QUINDICI si butta via la polvere e
       resta il numero che l'utente ha scritto. `toPrecision(15)` fa
       esattamente questo. Fuori dall'intervallo dove ha senso (numeri
       piccolissimi o enormi) si torna alla scrittura normale. */
    var a = n < 0 ? -n : n;
    var t = (a === 0 || (a >= 1e-7 && a < 1e15))
      ? n.toPrecision(15).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
      : String(n);
    if (t.indexOf('e') >= 0 || t.indexOf('E') >= 0) return null;
    var neg = t.charAt(0) === '-';
    if (neg) t = t.slice(1);
    var p = t.split('.');
    return { neg: neg, intera: p[0], dec: p[1] || '' };
  }

  /* il numero rimesso in piedi dalle sue cifre, senza la polvere */
  function pulito(c) {
    return Number((c.neg ? '-' : '') + c.intera + '.' + (c.dec || '0'));
  }

  /* arrotonda al centesimo, MEZZO IN SU (in valore assoluto), come round()
     di Postgres — la stessa regola della vista `gest_preventivi_totali` e
     di `gest_parcella()`. */
  function cent2(n) {
    var c = cifre(n);
    if (!c) return Math.round((+n || 0) * 100) / 100;
    /* gia' a due decimali: si torna il numero PULITO ricostruito dalle
       cifre, non quello sporco di partenza. */
    if (c.dec.length <= 2) return pulito(c);
    var centesimi = BigInt(c.intera) * 100n + BigInt(c.dec.slice(0, 2));
    if (c.dec.charAt(2) >= '5') centesimi += 1n;    /* mezzo in su */
    var v = Number(centesimi) / 100;
    return c.neg ? -v : v;
  }

  /* arrotonda al centesimo PER DIFETTO (verso meno infinito, come
     Math.floor). Serve dove un tetto non deve MAI superare il valore vero:
     lo sconto di una riga di fattura.
     ⚠️ Qui sparisce anche il vecchio trucco dell'1e-9: non serve piu'
        nessun margine, perche' non si moltiplica piu' per cento in virgola
        mobile. 0,29 resta 0,29, non 28,999999999999996. */
  function centGiu(n) {
    var c = cifre(n);
    if (!c) return Math.floor((+n || 0) * 100 + 1e-9) / 100;
    if (c.dec.length <= 2) return pulito(c);
    var centesimi = BigInt(c.intera) * 100n + BigInt(c.dec.slice(0, 2));
    var restoNonZero = /[1-9]/.test(c.dec.slice(2));
    if (c.neg && restoNonZero) centesimi += 1n;     /* verso meno infinito */
    var v = Number(centesimi) / 100;
    return c.neg ? -v : v;
  }

  /* le cifre di un numero, tutte attaccate, come numero intero col segno */
  function intero(c) {
    var v = BigInt(c.intera + c.dec);
    return c.neg ? -v : v;
  }

  /* ⛔ 29 agosto 2026 (notte) — IL SECONDO BUCO, PIU' FREQUENTE DEL PRIMO.
     `cent2` sistema l'ARROTONDAMENTO, ma non puo' rimediare a un prodotto
     che la virgola mobile ha gia' sbagliato PRIMA di arrivare qui:
       3,25 x 1747,62  in virgola mobile fa  5679,764999999999
       e non 5679,765  →  cent2 arrotonda a 5679,76 invece che a 5679,77.
     Misurato: succede su circa DUE fatture ogni CENTO, molto piu' spesso
     del difetto dell'arrotondamento (uno ogni 794). Non si vedeva perche'
     il primo banco partiva da un compenso gia' scritto e non moltiplicava
     mai quantita' per prezzo con tre o quattro decimali.

     `centMulDiv(a, b, d)` arrotonda al centesimo il valore a x b / d
     contando SOLO con numeri interi: il prodotto non passa mai per la
     virgola mobile, quindi non c'e' niente da rimediare.
       · a x b            →  centMulDiv(a, b, 1)      = centMult(a, b)
       · a x per cento    →  centMulDiv(a, p, 100)    = centPerc(a, p)
       · a x b / c        →  centMulDiv(a, b, c)      (le quote dello sconto) */
  function centMulDiv(a, b, d) {
    var ca = cifre(a), cb = cifre(b), cd = cifre(d);
    if (!ca || !cb || !cd) return cent2((+a || 0) * (+b || 0) / ((+d || 0) || 1));
    var ia = intero(ca), ib = intero(cb), id = intero(cd);
    if (id === 0n) return 0;
    /* si vuole arrotondare (ia*ib) / (id * 10^scala) al centesimo, cioe'
       il numeratore va moltiplicato per cento e poi diviso, tenendo il resto */
    var scala = ca.dec.length + cb.dec.length - cd.dec.length;
    var num = ia * ib * 100n;
    var den = id;
    if (scala > 0) den = den * (10n ** BigInt(scala));
    else if (scala < 0) num = num * (10n ** BigInt(-scala));
    var meno = (num < 0n) !== (den < 0n);
    var n = num < 0n ? -num : num;
    var q = den < 0n ? -den : den;
    var intera = n / q, resto = n % q;
    if (resto * 2n >= q) intera += 1n;              /* mezzo lontano da zero */
    var v = Number(intera) / 100;
    return meno ? -v : v;
  }
  function centMult(a, b) { return centMulDiv(a, b, 1); }
  function centPerc(a, p) { return centMulDiv(a, p, 100); }

  glob._cent2     = cent2;
  glob._centGiu   = centGiu;
  glob._centMult  = centMult;
  glob._centPerc  = centPerc;
  glob._centMulDiv = centMulDiv;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cent2: cent2, centGiu: centGiu, centMult: centMult,
                       centPerc: centPerc, centMulDiv: centMulDiv };
  }
})(typeof window !== 'undefined' ? window : globalThis);
