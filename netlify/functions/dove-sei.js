/* netlify/functions/dove-sei.js — 4 nov 2026
 * Dice in che citta' (con pagina su TrovaImpresa) si trova chi entra, dalla
 * sua connessione. Serve alla fascia «Sei a Rieti?» della home nazionale
 * (js/citta-automatica.js). Non salva niente e non legge il database.
 * La posizione viene da Netlify (intestazione x-nf-geo): e' approssimativa,
 * per questo la fascia CHIEDE e non porta via da sola.
 */
const MAPPA = require('./lib/comuni-capoluogo.json');
const chiave = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

function leggiGeo(event) {
  const h = event.headers || {};
  const grezzo = h['x-nf-geo'] || h['X-Nf-Geo'];
  if (!grezzo) return null;
  try { return JSON.parse(Buffer.from(grezzo, 'base64').toString('utf8')); }
  catch (e) { try { return JSON.parse(grezzo); } catch (e2) { return null; } }
}

exports.handler = async function (event) {
  const geo = leggiGeo(event);
  let citta = null;
  if (geo && geo.country && geo.country.code === 'IT') {
    citta = MAPPA[chiave(geo.city)] || null;
  }
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
    body: JSON.stringify({ citta }),
  };
};
