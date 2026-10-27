// Pezzi in comune delle email «avvisi clienti» (27 ott 2026).
// Non e' una funzione: il "_" davanti dice a Netlify di non pubblicarla come tale.
// Stessa grafica delle email del Forum (modello C), ma col logo TrovaImpresa.
const SITO = 'https://trovaimpresa.com';
const NAVY = '#0a2a4d', OR = '#ff8800';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// o = { titolo, sub, corpo (HTML gia' sicuro), cta: {url, testo}, sotto (HTML), cancella (url) }
function mailAvvisi(o) {
  return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#e7eef8"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e7eef8;padding:18px 0;font-family:Arial,Helvetica,sans-serif"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden">' +
    '<tr><td align="center" style="padding:18px 24px 6px"><a href="' + SITO + '"><img src="' + SITO + '/img/logo-email.png" width="200" alt="TrovaImpresa" style="display:block;border:0;width:200px;max-width:70%;height:auto"></a></td></tr>' +
    '<tr><td style="padding:8px 24px 14px;text-align:center"><div style="font-size:26px;line-height:1.2;font-weight:800;color:' + NAVY + '">' + o.titolo + '</div>' +
    (o.sub ? '<div style="font-size:17px;line-height:1.5;color:#25384d;margin-top:6px">' + o.sub + '</div>' : '') + '</td></tr>' +
    (o.corpo ? '<tr><td style="padding:0 20px 12px">' + o.corpo + '</td></tr>' : '') +
    (o.cta ? '<tr><td style="padding:0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:' + OR + ';border-radius:16px;padding:20px 16px"><a href="' + o.cta.url + '" style="display:inline-block;background:' + NAVY + ';color:#ffffff;font-size:19px;font-weight:800;text-decoration:none;padding:16px 34px;border-radius:10px">' + o.cta.testo + '</a></td></tr></table></td></tr>' : '') +
    (o.sotto ? '<tr><td style="padding:14px 24px 4px;font-size:13px;line-height:1.55;color:#5b6b80;text-align:center">' + o.sotto + '</td></tr>' : '') +
    '<tr><td height="14" style="height:14px;line-height:14px;font-size:14px">&nbsp;</td></tr>' +
    '<tr><td style="background:' + NAVY + ';padding:14px 24px;text-align:center;color:#a9c9f5;font-size:12px;line-height:1.6">TrovaImpresa &middot; Rieti (RI) &middot; <a href="mailto:info@trovaimpresa.com" style="color:#a9c9f5">info@trovaimpresa.com</a>' +
    (o.cancella ? '<br><a href="' + o.cancella + '" style="color:#ffffff">Non voglio pi&ugrave; ricevere questi avvisi</a>' : '') + '</td></tr>' +
    '</table></td></tr></table></body></html>';
}

async function invia(apiKey, a, oggetto, html, cancella) {
  const corpo = { from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a], subject: oggetto, html };
  if (cancella) corpo.headers = { 'List-Unsubscribe': '<' + cancella + '>' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(10000)
  });
  if (!r.ok) throw new Error('Resend ' + r.status + ': ' + (await r.text()));
  return true;
}

const linkCancella = token => SITO + '/avvisi.html?a=cancella&t=' + token;
const linkConferma = token => SITO + '/avvisi.html?a=conferma&t=' + token;

// «Ristrutturazione a Roma», «artigiani a Roma», «Geometra a Roma»
const NOMI_TIPO = { impresa: 'imprese', artigiano: 'artigiani', professionista: 'professionisti', mestiere: 'imprese' };
const ETICHETTE_PROF = {
  architetto: 'Architetto', ingegnere_civile: 'Ingegnere civile', ingegnere_strutturale: 'Ingegnere strutturale',
  ingegnere_impiantistico: 'Ingegnere impiantistico', geometra: 'Geometra'
};
function cosaCerca(a) {
  if (a.tipo === 'mestiere') return (a.etichetta || 'Nuovi arrivi') + ' a ' + a.citta;
  const m = a.mestiere ? (ETICHETTE_PROF[a.mestiere] || a.mestiere.replace(/_/g, ' ')) : null;
  const tutti = { impresa: 'Tutte le imprese', artigiano: 'Tutti gli artigiani', professionista: 'Tutti i professionisti' };
  return (m ? m : tutti[a.tipo]) + ' a ' + a.citta;
}

module.exports = { SITO, esc, mailAvvisi, invia, linkCancella, linkConferma, cosaCerca, NOMI_TIPO };
