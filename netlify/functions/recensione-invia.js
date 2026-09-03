// Riceve una recensione dal profilo pubblico, la salva NASCOSTA
// e manda al cliente l'email con il link di conferma.
// Il codice di conferma non torna mai al browser: solo per email.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const SITO = 'https://trovaimpresa.com';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* 3 set 2026 — prima la risposta di Resend non si guardava: se rifiutava,
   la pagina diceva «ti abbiamo mandato una email» e non era partito niente.
   Adesso un rifiuto ferma tutto e finisce nel registro di Netlify. */
async function inviaEmail(to, subject, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [to], subject, html })
  });
  const testo = await r.text();
  if (!r.ok) throw new Error('Resend ' + r.status + ': ' + testo);
  console.log('[recensione-invia] email mandata a', to, testo);
  return testo;
}

function emailConferma(nome, nomeImpresa, link) {
  return `
      <div style="font-family:system-ui,Arial,sans-serif;font-size:17px;line-height:1.6;color:#12233a;max-width:560px">
        <p>Ciao ${esc(nome)},</p>
        <p>hai scritto una recensione per <strong>${esc(nomeImpresa)}</strong> su TrovaImpresa.</p>
        <p><strong>Manca un ultimo passo:</strong> clicca il bottone qui sotto e la recensione va online.</p>
        <p style="margin:28px 0">
          <a href="${link}" style="background:#0066ff;color:#fff;text-decoration:none;font-weight:700;padding:16px 28px;border-radius:10px;display:inline-block;font-size:17px">Pubblica la mia recensione</a>
        </p>
        <p style="font-size:15px;color:#5b6b80">Il link vale 14 giorni. Se non hai scritto tu questa recensione, ignora questa email: senza il tuo clic non verra pubblicata.</p>
        <p style="font-size:15px;color:#5b6b80">Se il bottone non funziona, copia questo indirizzo nel browser:<br>${link}</p>
      </div>
    `;
}

const stella = v => {
  const n = parseInt(v, 10);
  return (n >= 1 && n <= 5) ? n : null;
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !process.env.RESEND_API_KEY) {
    console.error('[recensione-invia] variabili di ambiente mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let b;
  try { b = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Dati non validi.' }) }; }

  const impresa_id = parseInt(b.impresa_id, 10);
  const nome = String(b.nome_cliente || '').trim().slice(0, 120);
  const email = String(b.email_cliente || '').trim().toLowerCase().slice(0, 200);
  const testo = String(b.testo || '').trim().slice(0, 2000);
  const voti = {
    stelle_qualita: stella(b.stelle_qualita),
    stelle_puntualita: stella(b.stelle_puntualita),
    stelle_prezzo: stella(b.stelle_prezzo),
    stelle_professionalita: stella(b.stelle_professionalita)
  };
  const mese = String(b.mese_lavoro || '').trim().slice(0, 20) || null;
  const anno = parseInt(b.anno_lavoro, 10);

  if (!impresa_id || !nome || !email) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Nome, email e impresa sono obbligatori.' }) };
  }
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Indirizzo email non valido.' }) };
  }
  if (!Object.values(voti).some(v => v !== null)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Dai almeno una valutazione.' }) };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  try {
    // l'impresa esiste?
    const { data: imp } = await sb.from('imprese').select('id, nome').eq('id', impresa_id).maybeSingle();
    if (!imp) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Impresa non trovata.' }) };
    }

    // una recensione a testa per impresa
    const { data: gia } = await sb.from('feedback_clienti')
      .select('id, confermata')
      .eq('impresa_id', impresa_id)
      .ilike('email_cliente', email)
      .maybeSingle();
    if (gia && gia.confermata) {
      return {
        statusCode: 200, headers: corsHeaders,
        body: JSON.stringify({ ok: false, gia: true, messaggio: 'Hai gia lasciato una recensione per questa impresa.' })
      };
    }
    if (gia) {
      /* 3 set 2026 — recensione scritta ma mai confermata (l'email non e'
         arrivata, o e' finita nello spam): si RIMANDA l'email con un link
         nuovo, invece di dire «controlla la casella» a chi l'ha gia' guardata */
      const token2 = crypto.randomBytes(24).toString('hex');
      const scade2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { error: e2 } = await sb.from('feedback_clienti')
        .update({ token: token2, token_scade: scade2 }).eq('id', gia.id);
      if (e2) throw e2;
      await inviaEmail(email, 'Conferma la tua recensione su ' + imp.nome,
        emailConferma(nome, imp.nome, `${SITO}/conferma-recensione.html?t=${token2}`));
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, email, rimandata: true }) };
    }

    // freno anti-valanga: max 5 recensioni dalla stessa email in 24 ore
    const ieri = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await sb.from('feedback_clienti')
      .select('id', { count: 'exact', head: true })
      .ilike('email_cliente', email)
      .gte('created_at', ieri);
    if ((count || 0) >= 5) {
      return { statusCode: 429, headers: corsHeaders, body: JSON.stringify({ error: 'Troppe recensioni inviate oggi da questo indirizzo. Riprova domani.' }) };
    }

    const token = crypto.randomBytes(24).toString('hex');
    const scade = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await sb.from('feedback_clienti').insert({
      impresa_id, nome_cliente: nome, email_cliente: email, testo,
      ...voti,
      mese_lavoro: mese,
      anno_lavoro: Number.isFinite(anno) ? anno : null,
      confermata: false, verificata: false,
      token, token_scade: scade,
      created_at: new Date().toISOString()
    });
    if (error) throw error;

    const link = `${SITO}/conferma-recensione.html?t=${token}`;
    await inviaEmail(email, 'Conferma la tua recensione su ' + imp.nome, emailConferma(nome, imp.nome, link));

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, email }) };
  } catch (e) {
    console.error('[recensione-invia]', e);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Errore durante l'invio. Riprova." }) };
  }
};
