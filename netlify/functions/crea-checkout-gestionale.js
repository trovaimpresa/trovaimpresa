// =====================================================================
// ⛔ PORTA CHIUSA — 20 settembre 2026
//
// Questa era la cassa del vecchio ADD-ON GESTIONALE: 12 euro al mese o
// 119 all'anno, presi da due variabili d'ambiente su Netlify
// (STRIPE_PRICE_GESTIONALE_MENSILE / _ANNUALE). Oggi il Gestionale si
// vende a 29/249 e 39/349 e passa TUTTO da `crea-checkout-abbonamento`.
//
// PERCHE' NON BASTAVA LASCIARLA LI'. Era una porta aperta sul sito:
//   1. chiunque conoscesse l'indirizzo poteva comprare a 119 invece di
//      249 — il prezzo vecchio era ancora vivo, solo nascosto;
//   2. e soprattutto avrebbe pagato PER NIENTE: quella cassa scriveva
//      `metadata.prodotto = 'gestionale'`, e il webhook a quel punto
//      accende `gestionale_attivo`, che il cancello del gestionale
//      (js/gate-gestionale.js) non guarda nemmeno. Avrebbe pagato e
//      trovato il muro.
//
// CONTROLLATO PRIMA DI CHIUDERLA, il 20 settembre 2026:
//   - nel sito non la chiamava piu' nessuno: l'unica riga rimasta era
//     `window.attivaGestionale` dentro gate-gestionale.js, che a sua
//     volta non era chiamata da niente. Tolta lo stesso giorno;
//   - nel database `gestionale_attivo = true` risultava su UN account
//     solo, quello del fondatore. Nessun cliente vero su questa strada.
//
// Il file resta, invece di sparire, per due motivi: se qualcosa la
// chiamasse ancora si vede un errore CHIARO invece di un 404 muto, e
// chi legge capisce perche' non c'e' piu'.
// =====================================================================
exports.handler = async () => ({
  statusCode: 410,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    error: 'porta_chiusa',
    messaggio: 'Questa cassa non è più in uso. Il Gestionale si attiva dalla pagina del gestionale.'
  })
});
