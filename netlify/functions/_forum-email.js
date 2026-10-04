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
    '<div style="padding:18px 24px;border-bottom:1px solid #e6ebf1"><img src="' + SITO + '/logo-email.png" alt="TrovaImpresa" style="height:44px"></div>' +
    '<div style="padding:24px;color:#1f2d3d;line-height:1.55;font-size:15px"><h2 style="margin:0 0 12px;color:#0a2a4d;font-size:20px">' + titolo + '</h2>' + corpo + '</div>' +
    '<div style="padding:14px 24px;background:#0a2a4d;color:#a9c9f5;font-size:12px;line-height:1.5">' + (piede || 'TrovaImpresa – Forum Edilizia – Rieti (RI) – info@trovaimpresa.com') + '</div>' +
    '</div></div>';
}

function bottone(url, testo) {
  return '<p style="margin:20px 0"><a href="' + url + '" style="background:#e8733a;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:24px;display:inline-block">' + testo + '</a></p>';
}

async function inviaUna(apiKey, a, oggetto, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a], subject: oggetto, html })
  });
  return r.ok;
}

module.exports = { SITO, esc, linkNienteEmail, cornice, bottone, inviaUna };
