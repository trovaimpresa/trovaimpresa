/* 9 nov 2026 — si usa AL POSTO di fetch per mandare un'email con Resend.
   Fa la stessa identica chiamata; in piu', se Resend risponde che il tetto
   del giorno (o del mese) e' pieno, mette l'email da parte nella tabella
   email_riserva. La manda la mattina dopo netlify/functions/invia-riserva.js.
   Non rompe mai niente: se il salvataggio fallisce, si scrive solo nel log. */
module.exports = async function resendRiserva(url, opzioni) {
  const r = await fetch(url, opzioni);
  if (r.status !== 429) return r;
  try {
    const testo = await r.clone().text();
    if (!/quota/i.test(testo)) return r;          // troppo veloci: non e' il tetto
    const URL = (process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co').trim();
    const KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
    if (!KEY) return r;
    const dati = JSON.parse(opzioni && opzioni.body || '{}');
    const s = await fetch(URL + '/rest/v1/email_riserva', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ dati })
    });
    if (!s.ok) console.error('[resend-riserva] non salvata:', s.status, await s.text());
    else console.log('[resend-riserva] tetto pieno: email messa da parte per domani', dati.subject || '');
  } catch (e) {
    console.error('[resend-riserva]', e.message);
  }
  return r;
};
