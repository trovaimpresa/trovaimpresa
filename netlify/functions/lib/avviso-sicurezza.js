/* 10 nov 2026: aggiunta la riga sugli inviti a riunioni finti.
   9 nov 2026 — il riquadro «Per la tua sicurezza» in fondo alle email.
   per = 'impresa' (chi e' iscritto) oppure 'cliente'. */
module.exports = function avvisoSicurezza(per) {
  const testo = per === 'cliente'
    ? 'TrovaImpresa non ti chiede mai soldi né password e non ti manda inviti a riunioni. Non pagare anticipi a nessuno prima di avere un preventivo scritto. Se qualcuno ti scrive a nome nostro per chiederti soldi o dati, è una truffa: non cliccare e avvisaci a <b>info@trovaimpresa.com</b>.'
    : 'TrovaImpresa non ti chiede mai la password, codici o pagamenti per email, telefono o WhatsApp, e non ti manda inviti a riunioni. I pagamenti si fanno solo dentro il tuo pannello. Se qualcuno ti scrive a nome nostro per chiederli, è una truffa: non cliccare e avvisaci a <b>info@trovaimpresa.com</b>.';
  return '<div style="background:#fff8e6;border:1px solid #f0c36d;border-radius:8px;padding:14px 18px;margin:0 0 18px;text-align:left">'
    + '<p style="font-size:15px;font-weight:700;margin:0 0 6px;color:#7a4b00">🔒 Per la tua sicurezza</p>'
    + '<p style="font-size:14px;line-height:1.55;margin:0;color:#5c4a1e">' + testo + '</p></div>';
};
