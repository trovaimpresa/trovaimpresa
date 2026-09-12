// Avvisa l'impresa che e' arrivata una candidatura, e le manda i dati della
// persona (piu' il curriculum come allegato, se c'e').
//
// Perche' per email: un annuncio pubblicato SENZA account non ha un pannello
// dove far vedere le candidature — non c'e' nessuna impresa iscritta. L'email e'
// l'unico posto dove possono arrivare. Per le imprese iscritte la candidatura
// resta anche nel pannello, come prima.
//
// Sicurezza: dal browser arriva solo l'id della candidatura (e il file). Nomi,
// telefoni e indirizzi li legge il SERVER dal database: cosi' questa funzione non
// si puo' usare per mandare email a indirizzi scelti da chi chiama.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const SITO = 'https://trovaimpresa.com';

const MAX_CV_BYTE = 3 * 1024 * 1024; // 3 MB
const TIPI_CV = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic'
};

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sb(path, opzioni = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opzioni,
    headers: {
      apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', ...(opzioni.headers || {})
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Supabase ${r.status} su ${path}`);
  return r.json();
}

function riga(etichetta, valore) {
  if (!valore) return '';
  return `<tr><td style="padding:7px 14px 7px 0;color:#667;font-size:15px;white-space:nowrap">${esc(etichetta)}</td>
          <td style="padding:7px 0;font-size:16px;font-weight:bold">${esc(valore)}</td></tr>`;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: H, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!SERVICE_KEY || !RESEND_KEY) {
    console.error('[candidatura-avvisa] env vars mancanti');
    return { statusCode: 500, headers: H, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let candidatura_id, cv;
  try { ({ candidatura_id, cv } = JSON.parse(event.body || '{}')); }
  catch { return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Body JSON non valido.' }) }; }
  if (!candidatura_id) return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'candidatura_id obbligatorio.' }) };

  try {
    const cand = await sb(`candidature?id=eq.${encodeURIComponent(candidatura_id)}&select=id,candidato_id,offerta_id,impresa_id,messaggio,data_candidatura`);
    if (!cand.length) return { statusCode: 404, headers: H, body: JSON.stringify({ error: 'Candidatura non trovata.' }) };
    const c = cand[0];

    const [pers] = await sb(`candidati_lavoro?id=eq.${c.candidato_id}&select=id,nome,email,telefono,citta,provincia,mestiere,anni_esperienza,descrizione,cv`);
    const [off] = await sb(`offerte_lavoro?id=eq.${encodeURIComponent(c.offerta_id)}&select=id,titolo,nome_azienda,email,citta,impresa_id`);
    if (!pers || !off) return { statusCode: 404, headers: H, body: JSON.stringify({ error: 'Dati non trovati.' }) };

    // a chi va l'email: l'indirizzo scritto nell'annuncio; se manca (annuncio di
    // un'impresa iscritta vecchio) si prende quello dell'impresa
    let destinatario = off.email;
    if (!destinatario && off.impresa_id) {
      const [imp] = await sb(`imprese?id=eq.${off.impresa_id}&select=email`);
      destinatario = imp && imp.email;
    }
    if (!destinatario) {
      console.error('[candidatura-avvisa] nessun destinatario per offerta', off.id);
      return { statusCode: 200, headers: H, body: JSON.stringify({ success: false, email_non_partita: true }) };
    }

    // --- il curriculum, se c'e'
    let allegati = [];
    if (cv && cv.base64 && TIPI_CV[cv.tipo]) {
      const byte = Buffer.from(cv.base64, 'base64');
      if (byte.length <= MAX_CV_BYTE) {
        const est = TIPI_CV[cv.tipo];
        const percorso = `senza-account/${pers.id}/cv-${Date.now()}.${est}`;
        const up = await fetch(`${SUPABASE_URL}/storage/v1/object/cv-candidati/${percorso}`, {
          method: 'POST',
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': cv.tipo },
          body: byte,
          signal: AbortSignal.timeout(15000)
        });
        if (up.ok) {
          await fetch(`${SUPABASE_URL}/rest/v1/candidati_lavoro?id=eq.${pers.id}`, {
            method: 'PATCH',
            headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ cv: percorso }),
            signal: AbortSignal.timeout(8000)
          });
        } else {
          console.error('[candidatura-avvisa] upload cv fallito', up.status);
        }
        // in ogni caso l'allegato parte: e' la cosa che serve davvero all'impresa
        allegati = [{ filename: `CV-${(pers.nome || 'candidato').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}.${est}`, content: cv.base64 }];
      } else {
        console.log('[candidatura-avvisa] cv troppo grande, ignorato:', byte.length);
      }
    }

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto">
        <div style="text-align:center;padding:16px 0 20px">
          <a href="${SITO}" style="text-decoration:none">
            <img src="${SITO}/img/logo-email.png" width="220" alt="TrovaImpresa"
                 style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
          </a>
        </div>
        <h2 style="font-size:20px;margin:0 0 6px">Una persona si &egrave; candidata</h2>
        <p style="font-size:16px;line-height:1.6;color:#555;margin:0 0 18px">
          Per il tuo annuncio <strong>&laquo;${esc(off.titolo)}&raquo;</strong>${off.citta ? ' a ' + esc(off.citta) : ''}.</p>

        <div style="background:#f0f5ff;border-radius:12px;padding:16px 18px">
          <table style="border-collapse:collapse;width:100%">
            ${riga('Nome', pers.nome)}
            ${riga('Telefono', pers.telefono)}
            ${riga('Email', pers.email)}
            ${riga('Mestiere', pers.mestiere)}
            ${riga('Esperienza', pers.anni_esperienza)}
            ${riga('Città', pers.citta)}
          </table>
        </div>

        ${pers.telefono ? `<p style="margin:18px 0">
          <a href="tel:${esc(String(pers.telefono).replace(/\s/g, ''))}" style="background:#0066ff;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px;display:inline-block">Chiama ${esc(pers.nome)}</a>
        </p>` : ''}

        ${pers.descrizione ? `<p style="font-size:16px;line-height:1.6;margin:18px 0 0"><strong>Cosa scrive:</strong><br>${esc(pers.descrizione).replace(/\n/g, '<br>')}</p>` : ''}
        ${allegati.length ? `<p style="font-size:15px;color:#555;margin:16px 0 0">&#128206; Il curriculum &egrave; allegato a questa email.</p>` : ''}

        <p style="font-size:15px;line-height:1.6;color:#555;margin:20px 0 0">
          Per rispondere basta che rispondi a questa email: va dritta a ${esc(pers.nome)}.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="font-size:13px;color:#777">TrovaImpresa &ndash; Alessio Pinto &ndash; Rieti (RI) &ndash;
          <a href="mailto:info@trovaimpresa.com" style="color:#0066ff">info@trovaimpresa.com</a></p>
      </div>`;

    const corpo = {
      from: 'TrovaImpresa <info@trovaimpresa.com>',
      to: [destinatario],
      reply_to: pers.email || 'info@trovaimpresa.com',
      subject: `Candidatura da ${pers.nome} — ${off.titolo}`,
      html
    };
    if (allegati.length) corpo.attachments = allegati;

    const rr = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(15000)
    });

    if (!rr.ok) {
      console.error('[candidatura-avvisa] Resend', rr.status, await rr.text());
      // La candidatura E' salvata: non va detto al candidato che e' fallito tutto.
      return { statusCode: 200, headers: H, body: JSON.stringify({ success: false, email_non_partita: true }) };
    }

    console.log('[candidatura-avvisa] avviso inviato per candidatura', candidatura_id);
    return { statusCode: 200, headers: H, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('[candidatura-avvisa] eccezione:', err.message);
    return { statusCode: 200, headers: H, body: JSON.stringify({ success: false, email_non_partita: true }) };
  }
};
