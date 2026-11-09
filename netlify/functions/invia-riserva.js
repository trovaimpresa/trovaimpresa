// =====================================================================
// 9 novembre 2026 — LE EMAIL RIMASTE INDIETRO
//
// Quando Resend ha il tetto del giorno pieno, lib/resend-riserva.js mette
// l'email da parte nella tabella email_riserva (benvenuto, nuova richiesta
// di preventivo, chat, risposte, bacheca...). Questa funzione ogni mattina
// alle 7:00 (ora italiana d'inverno) le manda, dalla piu' vecchia, PRIMA
// delle email programmate (invia-coda-email.js alle 8:30), che poi tolgono
// queste dal loro conto.
// - Al massimo TETTO email per giro: il resto del tetto di Resend serve
//   alle conferme e agli avvisi della giornata.
// - Le email piu' vecchie di 7 giorni non partono piu': ormai non servono.
// - Se Resend risponde ancora «pieno», si ferma e riprova domani.
//
// ⛔ Le due righe vanno insieme: l'import di `schedule` qui sotto e
//    `exports.handler = schedule(...)` in fondo. Se ne resta una sola
//    Netlify si rifiuta di pubblicare il sito.
// =====================================================================
const { schedule } = require('@netlify/functions');

const TETTO = 30;
const GIORNI_MAX = 7;

const handler = async () => {
  const URL = (process.env.SUPABASE_URL || '').trim();
  const KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  const RESEND = (process.env.RESEND_API_KEY || '').trim();
  if (!URL || !KEY || !RESEND) { console.error('invia-riserva: configurazione mancante'); return { statusCode: 500, body: 'config' }; }
  const h = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

  const limite = new Date(Date.now() - GIORNI_MAX * 86400000).toISOString();
  const rr = await fetch(`${URL}/rest/v1/email_riserva?inviata_il=is.null&creata_il=gte.${encodeURIComponent(limite)}&order=creata_il.asc&limit=${TETTO}&select=id,dati,tentativi`, { headers: h });
  if (!rr.ok) { console.error('invia-riserva: lettura', rr.status, await rr.text()); return { statusCode: 500, body: 'db' }; }
  const righe = await rr.json();
  let mandate = 0;
  for (const riga of righe) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
      body: JSON.stringify(riga.dati)
    });
    if (r.status === 429) {
      const t = await r.text();
      if (/quota/i.test(t)) { console.log('invia-riserva: Resend ancora pieno, riprovo domani'); break; }
      await new Promise(ok => setTimeout(ok, 1000));
      continue;
    }
    const agg = r.ok
      ? { inviata_il: new Date().toISOString(), errore: null }
      : { tentativi: (riga.tentativi || 0) + 1, errore: ('HTTP ' + r.status + ' ' + (await r.text())).slice(0, 300) };
    // dopo 3 errori veri (non di tetto) si smette di riprovare
    if (!r.ok && agg.tentativi >= 3) agg.inviata_il = new Date(0).toISOString();
    await fetch(`${URL}/rest/v1/email_riserva?id=eq.${riga.id}`, { method: 'PATCH', headers: h, body: JSON.stringify(agg) });
    if (r.ok) mandate++;
    await new Promise(ok => setTimeout(ok, 600));   // Resend: non piu' di 2 al secondo
  }
  console.log('invia-riserva: mandate', mandate, 'su', righe.length);
  return { statusCode: 200, body: JSON.stringify({ mandate, trovate: righe.length }) };
};

exports.handler = schedule('0 6 * * *', handler);
