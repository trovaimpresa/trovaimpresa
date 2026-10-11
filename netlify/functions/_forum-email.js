// Pezzi in comune delle email del Forum Edilizia (non e' una funzione: il "_" davanti serve a questo).
const crypto = require('crypto');
const SITO = 'https://trovaimpresa.com';

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function linkNienteEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  const c = crypto.createHash('sha256').update(e + 'ti-niente-email-2026').digest('hex');
  return SITO + '/niente-email?e=' + encodeURIComponent(e) + '&c=' + c;
}

function cornice(titolo, corpo, piede) {
  return '<div style="background:#f4f6f8;padding:20px 0;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden">' +
    '<div style="padding:18px 24px;border-bottom:1px solid #e6ebf1"><img src="' + SITO + '/img/logo-email.png" alt="TrovaImpresa" style="height:44px"></div>' +
    '<div style="padding:24px;color:#1f2d3d;line-height:1.55;font-size:15px"><h2 style="margin:0 0 12px;color:#0a2a4d;font-size:20px">' + titolo + '</h2>' + corpo + '</div>' +
    '<div style="padding:14px 24px;background:#0a2a4d;color:#a9c9f5;font-size:12px;line-height:1.5">' + (piede || 'TrovaImpresa – Forum Edilizia – Rieti (RI) – info@trovaimpresa.com') + '</div>' +
    '</div></div>';
}

function bottone(url, testo) {
  return '<p style="margin:20px 0"><a href="' + url + '" style="background:#e8733a;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:24px;display:inline-block">' + testo + '</a></p>';
}


/* 11 ott 2026 — grafica «modello C» per le email del Forum (conferma e «e' online»).
   Logo Forum Edilizia, titolo, citazione del titolo della richiesta, un bottone grande,
   un solo riquadro blu. Icone e loghi stanno in img/email/ (PNG: le email non leggono gli SVG).
   o = { titolo, sub, citazione, cta: {url, testo}, box: {titolo, testo}, sotto } (il testo dei
   campi e' HTML: chi chiama deve gia' aver fatto esc() sui dati dell'utente). */
function mailForum(o) {
  const IMG = SITO + '/img/email/';
  const NAVY = '#0a2a4d', OR = '#ff8800';
  const quote = o.citazione ? '<tr><td style="padding:0 20px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#e7eef8;border-left:5px solid ' + OR + ';border-radius:12px;padding:14px 16px;font-size:17px;line-height:1.4;color:' + NAVY + ';font-weight:800">&laquo;' + o.citazione + '&raquo;</td></tr></table></td></tr>' : '';
  return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#e7eef8"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e7eef8;padding:18px 0;font-family:Arial,Helvetica,sans-serif"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden">' +
    '<tr><td align="center" style="padding:16px 24px 6px"><a href="' + SITO + '/forum"><img src="' + IMG + 'logo-forum-edilizia.png" width="190" alt="TrovaImpresa Forum Edilizia" style="display:block;border:0;width:190px;max-width:70%;height:auto"></a></td></tr>' +
    '<tr><td style="padding:8px 24px 14px;text-align:center"><div style="font-size:26px;line-height:1.2;font-weight:800;color:' + NAVY + '">' + o.titolo + '</div><div style="font-size:16px;line-height:1.5;color:#25384d;margin-top:6px">' + o.sub + '</div></td></tr>' +
    quote +
    '<tr><td style="padding:0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:' + OR + ';border-radius:16px;padding:20px 16px"><a href="' + o.cta.url + '" style="display:inline-block;background:' + NAVY + ';color:#ffffff;font-size:19px;font-weight:800;text-decoration:none;padding:16px 34px;border-radius:10px">' + o.cta.testo + '</a></td></tr></table></td></tr>' +
    '<tr><td style="padding:12px 20px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:' + NAVY + ';border-radius:16px;padding:16px 18px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
    '<td valign="middle" width="70" style="width:70px;padding-right:14px"><table role="presentation" width="56" cellpadding="0" cellspacing="0" style="width:56px"><tr><td width="56" height="56" align="center" valign="middle" style="width:56px;height:56px;background:' + OR + ';border-radius:28px"><img src="' + IMG + 'icona-forum-blu.png" width="32" height="32" alt="" style="display:block;margin:0 auto;border:0"></td></tr></table></td>' +
    '<td valign="middle"><div style="font-size:20px;font-weight:800;color:' + OR + ';line-height:1.2">' + o.box.titolo + '</div><div style="font-size:15px;line-height:1.45;color:#ffffff;margin-top:3px">' + o.box.testo + '</div></td></tr></table></td></tr></table></td></tr>' +
    (o.sotto ? '<tr><td style="padding:12px 24px 4px;font-size:13px;line-height:1.55;color:#5b6b80;text-align:center">' + o.sotto + '</td></tr>' : '') +
    '<tr><td height="14" style="height:14px;line-height:14px;font-size:14px">&nbsp;</td></tr>' +
    '<tr><td style="background:' + NAVY + ';padding:14px 24px;text-align:center;color:#a9c9f5;font-size:12px;line-height:1.5">TrovaImpresa &middot; Forum Edilizia &middot; Rieti (RI) &middot; <a href="mailto:info@trovaimpresa.com" style="color:#a9c9f5">info@trovaimpresa.com</a></td></tr>' +
    '</table></td></tr></table></body></html>';
}

async function inviaUna(apiKey, a, oggetto, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a], subject: oggetto, html })
  });
  return r.ok;
}

module.exports = { SITO, esc, linkNienteEmail, cornice, bottone, inviaUna, mailForum };
