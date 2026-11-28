// FACEBOOK — la coda dei post che Make.com pubblica DA SOLO sulla pagina
// «Trova impresa» (23 novembre 2026, passo 2 deciso con Alex).
//
// Make (piano gratis: un solo orario al giorno per scenario) chiama questo
// indirizzo OGNI ORA: /.netlify/functions/fb-coda?chiave=...
// Sono le ore a decidere il turno, e ogni post esce una volta sola:
//   dalle 8 alle 12  → Vetrina 1 + nuovi iscritti, subappalti, offerte
//   dalle 13 alle 18 → Vetrina 2 + il marchio del giorno + una parte del sito
//                      (forum, subappalti, offerte, candidature… — 28 nov 2026)
//   dalle 19 alle 21 → Vetrina 3 + il post del gestionale del giorno
//   di notte (22-7)  → niente
//
// Ogni post consegnato si scrive in fb_pubblicati: se Make richiama, quel
// post non torna (niente doppioni sulla pagina).
// ⛔ Il gruppo NO: Facebook non lascia pubblicare nei gruppi in automatico.
const { igSitoDelTurno, testoIgSito, testoInstagram, immaginiInstagram, SITO, marchioDelGiorno, gestionaleDelGiorno, testoVetrina, testoSubappalto, testoOfferta, testoIscritto, testoMarchio, testoGestionale, sezioneDelGiorno, testoSezione } = require('./lib/fb-testi');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CHIAVE = process.env.FB_CODA_CHIAVE;
const H = () => ({ apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' });

async function get(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H(), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}
const risposta = (code, body) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  body: JSON.stringify(body)
});

async function vetrina(giorno, turno) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fb_vetrina_del_giorno`, {
    method: 'POST', headers: H(), body: JSON.stringify({ p_giorno: giorno, p_turno: turno }), signal: AbortSignal.timeout(8000)
  });
  const id = r.ok ? await r.json() : null;
  if (!id) return null;
  const [i] = await get(`imprese_pubbliche?id=eq.${id}&select=id,user_id,tipo,nome_attivita,nome,mestiere,citta,provincia`);
  if (!i) return null;
  const foto = (await get(`lavori_foto?owner_id=eq.${i.user_id}&pubblico=eq.true&foto=like.https*&select=foto&order=ordine.desc,created_at.desc&limit=4`))
    .map(f => f.foto).filter(u => /^https:\/\//.test(u || ''));
  return { chiave: `vet:${giorno}:${turno}`, _t: 'vet', _id: i.id, _dove: i.citta, ...testoVetrina(i, foto) };
}

// 28 nov 2026 (Alex: «mandami una e-mail quando un post su fb viene
// pubblicato»): a ogni giro, UNA email con i post appena dati a Make.
// Se l'email non parte, i post escono lo stesso (si scrive solo nel log).
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function avvisaAlex(post, turno) {
  const KEY = process.env.RESEND_API_KEY;
  if (!KEY || !post.length) return;
  const ore = { 1: '8', 2: '13', 3: '19' }[turno] || '';
  // 28 nov (Alex, con la foto dell'email delle 6): stessa forma dell'email del
  // mattino — titolo, citta', e su OGNI post «Apri e condividi nel gruppo».
  const blocchi = post.map(p => {
    const gruppo = p._t && p._id != null ? `${SITO}/facebook-post?t=${p._t}&id=${encodeURIComponent(p._id)}` : '';
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb">
      <div style="font-size:17px;font-weight:800;color:#0a2a4d">📣 ${esc(p.titolo)}${p.foto && p.foto.length ? ` · 📷 ${p.foto.length}` : ''}</div>
      ${p._dove ? `<div style="font-size:15px;color:#475569;margin:2px 0 8px">📍 ${esc(p._dove)}</div>` : '<div style="height:8px"></div>'}
      ${gruppo ? `<a href="${gruppo}" style="display:inline-block;background:#1877f2;color:#fff;font-weight:800;font-size:16px;text-decoration:none;padding:11px 20px;border-radius:9px">Apri e condividi nel gruppo</a>` : ''}
    </td></tr>`;
  }).join('');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <h2 style="font-size:22px;color:#0a2a4d;margin:0 0 6px">Facebook: ${post.length} post in uscita${ore ? ' (giro delle ' + ore + ')' : ''}</h2>
    <p style="font-size:16px;color:#475569;margin:0 0 8px">Make li sta pubblicando adesso sulla pagina. Se vuoi, condividili nel <b>gruppo</b>: tocca il pulsante, copia il testo e apri il gruppo.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${blocchi}</table>
    <p style="font-size:14px;color:#64748b;margin:6px 0 0">I numeri li trovi nel pannello admin, voce «Facebook».</p>
  </div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [process.env.ADMIN_EMAIL || 'info@trovaimpresa.com'],
        subject: `Facebook: ${post.length} post pubblicat${post.length === 1 ? 'o' : 'i'} — ${post.map(p => p.titolo.split(' — ')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`, html }),
      signal: AbortSignal.timeout(6000)
    });
    if (!r.ok) console.error('[fb-coda] email', r.status, await r.text());
  } catch (e) { console.error('[fb-coda] email', e.message); }
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  if (!CHIAVE || q.chiave !== CHIAVE) return risposta(401, { errore: 'Chiave sbagliata' });
  if (!SERVICE_KEY) return risposta(500, { errore: 'Chiave del server mancante' });
  const prova = q.prova === '1'; // con prova=1 mostra i post ma non li segna come usciti
  const ora = new Date();
  const giorno = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(ora);
  const h = Number(new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hour12: false, timeZone: 'Europe/Rome' }).format(ora));
  if (h < 8 || h >= 22) return risposta(200, { giorno, turno: 0, prova, post: [] });
  const turno = h < 13 ? 1 : h < 19 ? 2 : 3;
  const post = [];
  try {
    const v = await vetrina(giorno, turno);
    if (v) post.push(v);
    // 28 nov 2026: mattina e sera un post SOLO per Instagram sul sito
    if (turno === 1 || turno === 3) {
      const ig = igSitoDelTurno(turno);
      post.push({ chiave: `igs:${giorno}:${turno}`, _t: 'igs', _id: ig.id, solo_ig: true, titolo: 'Instagram: ' + ig.id, testo: testoIgSito(ig) });
    }
    if (turno === 1) {
      // 72 ore: se un giro salta, il mattino dopo i post ci sono ancora; i doppioni li ferma fb_pubblicati.
      const da = encodeURIComponent(new Date(Date.now() - 3 * 864e5).toISOString());
      (await get(`imprese_pubbliche?created_at=gte.${da}&select=id,tipo,nome_attivita,nome,mestiere,citta,provincia&order=created_at.asc&limit=10`))
        .forEach(i => post.push({ chiave: `imp:${i.id}`, _t: 'imp', _id: i.id, _dove: i.citta, ...testoIscritto(i) }));
      (await get(`subappalti?attivo=eq.true&created_at=gte.${da}&select=id,tipo,nome_impresa,lavoro,citta&order=created_at.asc&limit=10`))
        .forEach(a => post.push({ chiave: `sub:${a.id}`, _t: 'sub', _id: a.id, _dove: a.citta, ...testoSubappalto(a) }));
      (await get(`offerte_lavoro?attiva=eq.true&data_pubblicazione=gte.${da}&select=id,titolo,nome_azienda,citta,provincia,tipo_contratto,stipendio&order=data_pubblicazione.asc&limit=10`))
        .forEach(o => post.push({ chiave: `off:${o.id}`, _t: 'off', _id: o.id, _dove: o.citta, ...testoOfferta(o) }));
    } else if (turno === 2) {
      const mc = marchioDelGiorno(), m = testoMarchio(mc);
      if (m) post.push({ chiave: `mar:${giorno}`, _t: 'mar', _id: mc, ...m });
      const sc = sezioneDelGiorno(), s = testoSezione(sc);
      if (s) post.push({ chiave: `sit:${giorno}`, _t: 'sit', _id: sc, ...s });
    } else {
      const gc = gestionaleDelGiorno(), g = testoGestionale(gc);
      if (g) post.push({ chiave: `ges:${giorno}`, _t: 'ges', _id: gc, ...g });
    }
    // togli quelli gia' consegnati
    const chiavi = post.map(p => p.chiave);
    const gia = chiavi.length ? await get(`fb_pubblicati?chiave=in.(${chiavi.map(c => '"' + c + '"').join(',')})&select=chiave`) : [];
    const fatti = new Set(gia.map(x => x.chiave));
    const nuovi = post.filter(p => !fatti.has(p.chiave)).map(p => ({
      chiave: p.chiave, titolo: p.titolo, testo: p.testo, link: p.link,
      con_foto: !!(p.foto && p.foto.length),
      // 23 nov: Make vuole anche «type» per ogni foto.
      // 26 nov: «caption» = il link sotto OGNI foto. In un post con piu' foto,
      // chi apre una foto sola su Facebook NON vede il testo del post (Roberta,
      // 25 nov: «non trovo il sito»). La didascalia la mettiamo qui e non nel
      // modulo di Make: salvare quel modulo dall'editor riscrive gli indirizzi
      // delle foto e Facebook li rifiuta (vetrine perse il 25-26 nov).
      foto: (p.foto || []).map(url => ({ type: 'url', url, caption: p.link ? `👉 Scheda e preventivo gratis: ${p.link}` : '' })),
      // 28 nov 2026: INSTAGRAM. ig_foto = la prima immagine (post a foto
      // singola); ig_carosello = tutte, solo se sono almeno 2 (post a carosello).
      ...(() => {
        const im = immaginiInstagram(p._t, p._id);
        return {
          ...(p.solo_ig ? { solo_ig: true } : {}),
          ig_testo: p.solo_ig ? p.testo : testoInstagram(p.testo),
          ig_foto: im[0] || '',
          ig_carosello: im.length > 1 ? im.map(u => ({ media_type: 'IMAGE', image_url: u })) : []
        };
      })()
    }));
    if (!prova && nuovi.length) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/fb_pubblicati`, {
        method: 'POST', headers: { ...H(), Prefer: 'resolution=ignore-duplicates' },
        body: JSON.stringify(nuovi.map(p => ({ chiave: p.chiave }))), signal: AbortSignal.timeout(8000)
      });
      if (!r.ok) throw new Error('segno consegnati ' + r.status);
      await avvisaAlex(post.filter(p => !fatti.has(p.chiave) && !p.solo_ig), turno);
    }
    return risposta(200, { giorno, turno, prova, post: nuovi });
  } catch (e) {
    console.error('[fb-coda]', e.message);
    return risposta(502, { errore: 'Non riesco a preparare i post, riprova fra poco.' });
  }
};
