// =====================================================================
// LE SCELTE DEL CLIENTE — la porta per il cliente (26 settembre 2026)
//
// Il cliente dell'impresa apre trovaimpresa.com/scelte?t=<link segreto>
// dal telefono, SENZA account. Questa funzione e' l'unica cosa che parla
// col database per lui.
//
//   GET  ?t=...              -> il lavoro, l'impresa e le cose da scegliere
//   POST {t, scelte:[{id, scelta, nota}], conferma:true}
//                            -> salva le scelte e le chiude
//
// ⛔ CHI SEI LO DICE SOLO IL LINK. Il browser non manda mai l'id del
//    lavoro ne' dell'impresa: si ricavano dal token. Ogni scelta mandata
//    deve appartenere a QUEL lavoro, e l'indice deve esistere fra le sue
//    possibilita': qualunque altra cosa si scarta.
// ⛔ DOPO LA CONFERMA LE SCELTE SONO FERME. Una seconda conferma risponde
//    409: se il cliente deve cambiare, l'impresa riapre dal gestionale.
// ⛔ AL CLIENTE NON ARRIVA NIENTE DELL'IMPRESA OLTRE AL NOME: niente
//    importi del lavoro, niente note interne, niente altri clienti.
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const TOKEN_OK = /^[A-Za-z0-9_-]{20,64}$/;

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex'
  },
  body: JSON.stringify(corpo)
});

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function mandaEmail(a, oggetto, html) {
  if (!process.env.RESEND_API_KEY || !a) return Promise.resolve(false);
  const data = JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a], subject: oggetto, html });
  return new Promise((ok) => {
    const req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => { res.resume(); res.on('end', () => ok(res.statusCode < 300)); });
    req.on('error', () => ok(false));
    req.setTimeout(6000, () => { req.destroy(); ok(false); });
    req.write(data); req.end();
  });
}

async function leggi(sb, token) {
  const { data: link } = await sb.from('gest_scelte_link')
    .select('lavoro_id, user_id, confermato_il').eq('token', token).maybeSingle();
  if (!link) return null;
  const [lav, az, sc] = await Promise.all([
    sb.from('gest_lavori').select('id, descrizione, eliminato_il').eq('id', link.lavoro_id).maybeSingle(),
    sb.from('gest_azienda').select('nome, tel, email').eq('user_id', link.user_id).maybeSingle(),
    sb.from('gest_scelte').select('id, titolo, opzioni, scelta, nota_cliente, ordine, created_at')
      .eq('lavoro_id', link.lavoro_id).eq('user_id', link.user_id)
      .order('ordine', { ascending: true }).order('created_at', { ascending: true })
  ]);
  if (!lav.data || lav.data.eliminato_il) return null;
  let nomeImpresa = az.data && az.data.nome;
  if (!nomeImpresa) {
    const { data: imp } = await sb.from('imprese').select('nome_attivita, nome').eq('user_id', link.user_id).limit(1).maybeSingle();
    nomeImpresa = (imp && (imp.nome_attivita || imp.nome)) || 'La tua impresa';
  }
  return { link, lavoro: lav.data, azienda: az.data || {}, nomeImpresa, scelte: sc.data || [] };
}

exports.handler = async (event) => {
  try {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // ------------------------------------------------------------ GET
    if (event.httpMethod === 'GET') {
      const t = (event.queryStringParameters || {}).t || '';
      if (!TOKEN_OK.test(t)) return rispondi(404, { error: 'Link non valido.' });
      const x = await leggi(sb, t);
      if (!x) return rispondi(404, { error: 'Questo link non è più attivo. Chiedi all\'impresa di mandartene uno nuovo.' });

      // le foto: link firmati che durano due ore, niente di pubblico
      const paths = [];
      x.scelte.forEach(s => (Array.isArray(s.opzioni) ? s.opzioni : []).forEach(o => { if (o && o.foto) paths.push(o.foto); }));
      const firmati = {};
      if (paths.length) {
        const { data } = await sb.storage.from('gestionale-foto').createSignedUrls(paths, 7200);
        (data || []).forEach(d => { if (d && d.path && d.signedUrl) firmati[d.path] = d.signedUrl; });
      }
      if (!x.link.aperto_il) {
        await sb.from('gest_scelte_link').update({ aperto_il: new Date().toISOString() }).eq('token', t);
      }
      return rispondi(200, {
        impresa: x.nomeImpresa,
        telefono: x.azienda.tel || null,
        lavoro: x.lavoro.descrizione || 'Il tuo lavoro',
        confermato_il: x.link.confermato_il,
        scelte: x.scelte.map(s => ({
          id: s.id,
          titolo: s.titolo,
          scelta: s.scelta,
          nota: s.nota_cliente || '',
          opzioni: (Array.isArray(s.opzioni) ? s.opzioni : []).map(o => ({
            nome: String((o && o.nome) || ''), prezzo: String((o && o.prezzo) || ''),
            foto: (o && o.foto && firmati[o.foto]) || null
          }))
        }))
      });
    }

    // ----------------------------------------------------------- POST
    if (event.httpMethod !== 'POST') return rispondi(405, { error: 'Metodo non consentito' });
    let corpo;
    try { corpo = JSON.parse(event.body || '{}'); } catch (e) { return rispondi(400, { error: 'Richiesta non valida.' }); }
    const t = String(corpo.t || '');
    if (!TOKEN_OK.test(t)) return rispondi(404, { error: 'Link non valido.' });
    const x = await leggi(sb, t);
    if (!x) return rispondi(404, { error: 'Questo link non è più attivo.' });
    if (x.link.confermato_il) return rispondi(409, { error: 'Le scelte sono già state confermate. Se vuoi cambiare qualcosa, chiama l\'impresa.' });

    const mandate = Array.isArray(corpo.scelte) ? corpo.scelte.slice(0, 100) : [];
    const perId = {}; x.scelte.forEach(s => { perId[String(s.id)] = s; });
    const adesso = new Date().toISOString();
    let salvate = 0;
    for (const m of mandate) {
      const s = perId[String(m && m.id)];
      if (!s) continue;
      const ops = Array.isArray(s.opzioni) ? s.opzioni : [];
      const i = Number.isInteger(m.scelta) ? m.scelta : null;
      if (i === null || i < 0 || i >= ops.length) continue;
      const nota = String(m.nota || '').trim().slice(0, 500) || null;
      const { error } = await sb.from('gest_scelte')
        .update({ scelta: i, scelta_nome: String(ops[i].nome || '').slice(0, 160), nota_cliente: nota, scelto_il: adesso })
        .eq('id', s.id).eq('lavoro_id', x.link.lavoro_id).eq('user_id', x.link.user_id);
      if (!error) salvate++;
    }

    // si conferma solo se TUTTE hanno una scelta: una conferma a meta'
    // lascerebbe l'impresa ad aspettare una cosa che non arrivera'
    const { data: dopo } = await sb.from('gest_scelte').select('titolo, scelta, scelta_nome, nota_cliente')
      .eq('lavoro_id', x.link.lavoro_id).eq('user_id', x.link.user_id).order('ordine').order('created_at');
    const mancano = (dopo || []).filter(s => s.scelta === null || s.scelta === undefined);
    if (corpo.conferma) {
      if (mancano.length) return rispondi(400, { error: 'Manca ancora da scegliere: ' + mancano.map(s => s.titolo).join(', ') + '.', salvate });
      const { data: chiuso } = await sb.from('gest_scelte_link').update({ confermato_il: adesso })
        .eq('token', t).is('confermato_il', null).select('lavoro_id');
      if (!chiuso || !chiuso.length) return rispondi(409, { error: 'Le scelte sono già state confermate.' });

      // l'avviso all'impresa: all'indirizzo con cui entra nel gestionale
      try {
        const { data: u } = await sb.auth.admin.getUserById(x.link.user_id);
        const a = u && u.user && u.user.email;
        const righe = (dopo || []).map(s => '<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569">' + esc(s.titolo)
          + '</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:700">' + esc(s.scelta_nome)
          + (s.nota_cliente ? '<div style="font-weight:400;color:#475569;font-style:italic">«' + esc(s.nota_cliente) + '»</div>' : '')
          + '</td></tr>').join('');
        await mandaEmail(a, 'Il cliente ha scelto: ' + (x.lavoro.descrizione || 'il tuo lavoro'),
          '<div style="font-family:Arial,sans-serif;font-size:16px;color:#0f172a;max-width:560px">'
          + '<p>Il cliente ha confermato le sue scelte per <b>' + esc(x.lavoro.descrizione || 'il lavoro') + '</b>:</p>'
          + '<table style="border-collapse:collapse;width:100%;font-size:15px">' + righe + '</table>'
          + '<p style="margin-top:18px">Le trovi nel gestionale, nel lavoro, alla voce «Scelte del cliente».</p>'
          + '<p><a href="https://trovaimpresa.com/gestionale" style="background:#0066ff;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Apri il gestionale</a></p>'
          + '</div>');
      } catch (e) { /* l'email e' un di piu': la conferma e' gia' salvata */ }
      return rispondi(200, { ok: true, confermato: true });
    }
    return rispondi(200, { ok: true, salvate, mancano: mancano.length });
  } catch (e) {
    console.error('scelte-cliente:', e);
    return rispondi(500, { error: 'Qualcosa non ha funzionato. Riprova fra un attimo.' });
  }
};
