/* 13 nov 2026 — link DIRETTO di attivazione per chi non ha confermato l'email.
   Il codice lo chiediamo a Supabase (admin/generate_link, tipo magiclink:
   aprirlo conferma anche l'email) e va nel pulsante: un clic e il profilo e'
   attivo, senza aspettare una seconda mail.
   ⚠️ Il codice scade presto: va creato nel momento in cui la mail PARTE,
   mai prima. Se arriva tardi, conferma.html con prom=1 mostra la casella
   «Mandami il link di attivazione» (mai «link scaduto»).
   Se Supabase non risponde, resta il link vecchio (?attiva=1). */

function linkVecchio(email) {
  return 'https://trovaimpresa.com/conferma.html?attiva=1&email=' + encodeURIComponent(email || '');
}

// { 'email minuscola': 'link diretto' } — 10 alla volta, per stare nei 10 secondi
async function linkDiretti(emails, SUPABASE_URL, KEY) {
  const mappa = {};
  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
  const lista = Array.from(new Set((emails || []).map(e => String(e || '').trim()).filter(Boolean)));
  for (let k = 0; k < lista.length; k += 10) {
    await Promise.all(lista.slice(k, k + 10).map(async (email) => {
      try {
        const r = await fetch(SUPABASE_URL + '/auth/v1/admin/generate_link', {
          method: 'POST', headers: H, body: JSON.stringify({ type: 'magiclink', email })
        });
        if (!r.ok) return;
        const j = await r.json();
        const h = j.hashed_token || (j.properties && j.properties.hashed_token);
        if (h) mappa[email.toLowerCase()] = 'https://trovaimpresa.com/conferma.html?token_hash='
          + encodeURIComponent(h) + '&type=magiclink&prom=1&email=' + encodeURIComponent(email);
      } catch (e) { /* resta il link vecchio */ }
    }));
  }
  return mappa;
}

// in una mail GIA' fatta (html), il link vecchio diventa quello diretto
const VECCHIO_RE = /https:\/\/trovaimpresa\.com\/conferma\.html\?attiva=1(?:&amp;|&)email=[^"'<\s]*/g;
function haLinkVecchio(html) { return /conferma\.html\?attiva=1/.test(String(html || '')); }
function mettiDiretto(html, diretto) {
  if (!diretto) return html;
  return String(html).replace(VECCHIO_RE, diretto.replace(/&/g, '&amp;'));
}

module.exports = { linkVecchio, linkDiretti, haLinkVecchio, mettiDiretto };
