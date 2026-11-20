// FACEBOOK — ogni annuncio nuovo di Lavoro Edilizia esce da solo sulla pagina
// «Trova impresa» (20 novembre 2026)
//
// Ogni ora prende i subappalti e le offerte di lavoro NUOVI (nati dopo
// DA_QUANDO) non ancora pubblicati, ne pubblica al massimo MAX_PER_GIRO sulla
// pagina Facebook col link all'annuncio, e segna `fb_pubblicato_il`.
//
// Serve in Netlify (Site configuration → Environment variables):
//   FB_PAGE_ID     = id della pagina (61575390415610)
//   FB_PAGE_TOKEN  = il «Page access token» lungo della pagina
// Senza queste due la funzione non fa niente e lo scrive nel registro.
//
// ⛔ Nel post NON vanno telefono ed email: stanno dietro un clic sulla pagina
//    dell'annuncio (scelta di Alex del 6 set 2026, contro i raccoglitori di spam).
// ⛔ Le due righe vanno insieme: l'import di `schedule` e
//    `exports.handler = schedule(...)` in fondo.
const { schedule } = require('@netlify/functions');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAGE_ID = process.env.FB_PAGE_ID;
const PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const SITO = 'https://trovaimpresa.com';
const GRAPH = 'https://graph.facebook.com/v21.0';
const DA_QUANDO = '2026-11-20T00:00:00Z'; // i vecchi non escono tutti insieme
const MAX_PER_GIRO = 2;                   // niente raffiche sulla pagina

async function sb(path, opzioni = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opzioni,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(opzioni.headers || {}) },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

const pulisci = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const taglia = (s, n) => { s = pulisci(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const primaRiga = s => String(s ?? '').split(/\r?\n/).map(x => x.trim()).find(Boolean) || '';

function testoSubappalto(a) {
  const titolo = a.tipo === 'cerca' ? '🔎 Cercasi subappaltatori' : '🏗️ Impresa disponibile per subappalti';
  const righe = [
    titolo,
    a.nome_impresa ? `👷 ${pulisci(a.nome_impresa)}` : null,
    a.lavoro ? `🔧 ${taglia(primaRiga(a.lavoro), 160)}` : null,
    a.citta ? `📍 ${taglia(a.citta, 80)}` : null,
    '',
    '👉 Leggi l\'annuncio e contatta direttamente l\'impresa:',
    `${SITO}/subappalto-annuncio?id=${encodeURIComponent(a.id)}`,
    '',
    'Pubblica anche tu un subappalto o un\'offerta di lavoro, gratis:',
    `${SITO}/lavoro-edilizia`,
    '',
    '#subappalti #edilizia #lavoroedilizia #trovaimpresa'
  ];
  return { message: righe.filter(r => r !== null).join('\n'), link: `${SITO}/subappalto-annuncio?id=${encodeURIComponent(a.id)}` };
}

function testoOfferta(o) {
  const dove = [o.citta, o.provincia].map(pulisci).filter(Boolean).join(' (') + (o.citta && o.provincia ? ')' : '');
  const righe = [
    '💼 Offerta di lavoro in edilizia',
    o.titolo ? `🔧 ${taglia(o.titolo, 120)}` : null,
    o.nome_azienda ? `👷 ${pulisci(o.nome_azienda)}` : null,
    dove ? `📍 ${dove}` : null,
    o.tipo_contratto ? `📄 ${taglia(o.tipo_contratto, 60)}` : null,
    o.stipendio ? `💶 ${taglia(o.stipendio, 60)}` : null,
    '',
    '👉 Leggi l\'offerta e candidati:',
    `${SITO}/offerta-lavoro.html?id=${encodeURIComponent(o.id)}`,
    '',
    'Altri subappalti e offerte di lavoro, gratis:',
    `${SITO}/lavoro-edilizia`,
    '',
    '#lavoro #edilizia #offertedilavoro #trovaimpresa'
  ];
  return { message: righe.filter(r => r !== null).join('\n'), link: `${SITO}/offerta-lavoro.html?id=${encodeURIComponent(o.id)}` };
}

async function pubblica({ message, link }) {
  const corpo = new URLSearchParams({ message, link, access_token: PAGE_TOKEN });
  const r = await fetch(`${GRAPH}/${encodeURIComponent(PAGE_ID)}/feed`, { method: 'POST', body: corpo, signal: AbortSignal.timeout(10000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id) throw new Error(`Facebook ${r.status}: ${JSON.stringify(j.error || j)}`);
  return j.id;
}

const handler = async () => {
  if (!SERVICE_KEY) { console.error('[fb-pubblica] manca SUPABASE_SERVICE_KEY'); return { statusCode: 500 }; }
  if (!PAGE_ID || !PAGE_TOKEN) { console.log('[fb-pubblica] FB_PAGE_ID o FB_PAGE_TOKEN non impostati: non pubblico niente'); return { statusCode: 200 }; }

  const da = encodeURIComponent(DA_QUANDO);
  let fatti = 0;
  const coda = [];
  try {
    const sub = await sb(`subappalti?attivo=eq.true&fb_pubblicato_il=is.null&created_at=gte.${da}&select=id,tipo,nome_impresa,lavoro,citta&order=created_at.asc&limit=${MAX_PER_GIRO}`);
    sub.forEach(a => coda.push({ tabella: 'subappalti', id: a.id, post: testoSubappalto(a) }));
  } catch (e) { console.error('[fb-pubblica] lettura subappalti', e.message); }
  try {
    const off = await sb(`offerte_lavoro?attiva=eq.true&fb_pubblicato_il=is.null&data_pubblicazione=gte.${da}&select=id,titolo,nome_azienda,citta,provincia,tipo_contratto,stipendio&order=data_pubblicazione.asc&limit=${MAX_PER_GIRO}`);
    off.forEach(o => coda.push({ tabella: 'offerte_lavoro', id: o.id, post: testoOfferta(o) }));
  } catch (e) { console.error('[fb-pubblica] lettura offerte', e.message); }

  for (const x of coda.slice(0, MAX_PER_GIRO)) {
    try {
      const idPost = await pubblica(x.post);
      // la riga si segna SUBITO: se poi qualcosa salta, il post non esce due volte
      const fatto = await sb(`${x.tabella}?id=eq.${encodeURIComponent(x.id)}&select=id`, { method: 'PATCH', body: JSON.stringify({ fb_pubblicato_il: new Date().toISOString() }) });
      if (!fatto.length) console.error('[fb-pubblica] post uscito ma riga non segnata', x.tabella, x.id, idPost);
      fatti++;
      console.log('[fb-pubblica] pubblicato', x.tabella, x.id, idPost);
    } catch (e) {
      console.error('[fb-pubblica] errore', x.tabella, x.id, e.message);
      break; // token scaduto o limite di Facebook: inutile insistere in questo giro
    }
  }
  return { statusCode: 200, body: JSON.stringify({ pubblicati: fatti }) };
};

exports.handler = schedule('23 * * * *', handler);
// usati dal banco di prova
exports._prova = { testoSubappalto, testoOfferta };
