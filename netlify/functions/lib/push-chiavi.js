// =====================================================================
// 3 novembre 2026 — LE NOTIFICHE DEL TELEFONO (web push), SENZA LIBRERIE
// ⛔ Perche' niente «web-push» da npm: installarlo riscriveva
//    package-lock.json e cambiava la versione di supabase-js usata da
//    TUTTE le funzioni. Qui c'e' solo il crypto di Node (RFC 8291 + 8292),
//    provato contro http_ece (la libreria usata da web-push).
//
// Le chiavi le crea da sola la prima volta e le mette in app_chiavi_push
// (sql/gest-avviso-sera.sql). La privata non esce mai dal server.
// ⛔ Non rigenerarle: i telefoni gia' iscritti non riceverebbero piu' niente.
// =====================================================================
const crypto = require('crypto');
let cache = null;

const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function nuoveChiavi() {
  const e = crypto.createECDH('prime256v1'); e.generateKeys();
  return { pubblica: b64u(e.getPublicKey()), privata: b64u(e.getPrivateKey()) };
}

async function chiavi(sb) {
  if (cache) return cache;
  const r = await sb.from('app_chiavi_push').select('pubblica,privata').eq('id', 1).maybeSingle();
  if (r.error) throw new Error('chiavi: ' + r.error.message);
  if (r.data) { cache = r.data; return cache; }
  const k = nuoveChiavi();
  await sb.from('app_chiavi_push').insert({ id: 1, pubblica: k.pubblica, privata: k.privata });
  const r2 = await sb.from('app_chiavi_push').select('pubblica,privata').eq('id', 1).single();
  if (r2.error) throw new Error('chiavi: ' + r2.error.message);
  cache = r2.data; return cache;
}

// la chiave privata grezza (32 byte) diventa un oggetto chiave di Node
function chiavePrivata(pub, priv) {
  const P = deb64u(pub);
  return crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: b64u(deb64u(priv)), x: b64u(P.subarray(1, 33)), y: b64u(P.subarray(33, 65)) }, format: 'jwk' });
}

// RFC 8292: il «chi sono» firmato per il servizio di notifiche
function vapid(endpoint, k) {
  const aud = new URL(endpoint).origin;
  const h = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const p = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:info@trovaimpresa.com' }));
  const firma = crypto.sign('sha256', Buffer.from(h + '.' + p), { key: chiavePrivata(k.pubblica, k.privata), dsaEncoding: 'ieee-p1363' });
  return 'vapid t=' + h + '.' + p + '.' + b64u(firma) + ', k=' + k.pubblica;
}

// RFC 8291: il messaggio cifrato per quel telefono (aes128gcm)
function cifra(testo, p256dh, auth) {
  const uaPub = deb64u(p256dh), segreto = deb64u(auth);
  const as = crypto.createECDH('prime256v1'); as.generateKeys();
  const asPub = as.getPublicKey();
  const comune = as.computeSecret(uaPub);
  const info = Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', comune, segreto, info, 32));
  const sale = crypto.randomBytes(16);
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, sale, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, sale, Buffer.from('Content-Encoding: nonce\0'), 12));
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const corpo = Buffer.concat([c.update(Buffer.concat([Buffer.from(testo), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([sale, rs, Buffer.from([asPub.length]), asPub, corpo]);
}

async function manda(sb, sub, dati) {
  const k = await chiavi(sb);
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: { Authorization: vapid(sub.endpoint, k), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '10800', Urgency: 'normal' },
    body: cifra(JSON.stringify(dati), sub.p256dh, sub.auth)
  });
  if (!res.ok) { const e = new Error('push ' + res.status + ': ' + (await res.text()).slice(0, 200)); e.statusCode = res.status; throw e; }
  return res.status;
}

module.exports = { chiavi, manda, nuoveChiavi, cifra, vapid };
