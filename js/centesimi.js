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
      guarda le CIFRE che il numero ha davvero, cioe' `String(n)`, che in
      JavaScript e' la scrittura decimale piu' corta che rimappa sullo
      stesso numero. Per il numero di cui sopra e' «2280.805»: le cifre
      che l'utente ha scritto e che il database vede. Da li' in poi si
      lavora con NUMERI INTERI (BigInt), dove la virgola mobile non c'e'
      e nessun errore e' possibile.

   ⚠️ CHI LO USA (se ne aggiungi uno, mettilo in questa lista)
      · gestionale-app.html — impRiga, calcolaParcella e i totali dei
        preventivi
      · js/gest-fatture.js  — fattBasi, il file per lo SDI e i PDF
      Non si ricopia da nessuna parte: e' la regola 6 del gestionale, una
      formula dei soldi sta in un posto solo.

   ⚠️ NON tocca i documenti gia' salvati: fa solo il conto, e il conto lo
      rifa' chi apre il documento. Le fatture gia' mandate allo SDI si
      portano dietro i loro numeri e non si ricalcolano.

   Prova: prove/conti/banco.js  (gira con node, senza rete)
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
    var t = String(n);
    if (t.indexOf('e') >= 0 || t.indexOf('E') >= 0) return null;
    var neg = t.charAt(0) === '-';
    if (neg) t = t.slice(1);
    var p = t.split('.');
    return { neg: neg, intera: p[0], dec: p[1] || '' };
  }

  /* arrotonda al centesimo, MEZZO IN SU (in valore assoluto), come round()
     di Postgres — la stessa regola della vista `gest_preventivi_totali` e
     di `gest_parcella()`. */
  function cent2(n) {
    var c = cifre(n);
    if (!c) return Math.round((+n || 0) * 100) / 100;
    if (c.dec.length <= 2) return +n || 0;          /* gia' a due decimali */
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
    if (c.dec.length <= 2) return +n || 0;
    var centesimi = BigInt(c.intera) * 100n + BigInt(c.dec.slice(0, 2));
    var restoNonZero = /[1-9]/.test(c.dec.slice(2));
    if (c.neg && restoNonZero) centesimi += 1n;     /* verso meno infinito */
    var v = Number(centesimi) / 100;
    return c.neg ? -v : v;
  }

  glob._cent2   = cent2;
  glob._centGiu = centGiu;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cent2: cent2, centGiu: centGiu };
  }
})(typeof window !== 'undefined' ? window : globalThis);
