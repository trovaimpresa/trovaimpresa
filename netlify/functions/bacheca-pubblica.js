// Bacheca «Richieste dei clienti» — il cliente pubblica SENZA registrarsi.
// La richiesta nasce in_attesa e va online solo dopo il clic nell'email di conferma.
// Il codice di conferma non torna mai al browser: solo per email.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { mailForum } = require('./_forum-email');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
const SITO = 'https://trovaimpresa.com';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function slugify(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'richiesta';
}

async function inviaEmail(to, subject, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [to], subject, html })
  });
  const testo = await r.text();
  if (!r.ok) throw new Error('Resend ' + r.status + ': ' + testo);
  return testo;
}

function emailConferma(nome, titolo, link) {
  return mailForum({
    titolo: 'La tua richiesta è quasi online',
    sub: 'Un solo clic e le imprese della tua zona possono risponderti.',
    citazione: esc(titolo),
    cta: { url: link, testo: 'Pubblica la mia richiesta &rarr;' },
    box: { titolo: 'Ci vuole un solo clic', testo: 'Il tuo indirizzo email non sarà mai visibile sul sito. Il link vale <b>14 giorni</b>. <b>Non l&rsquo;hai scritta tu?</b> Ignora questa email: senza il tuo clic non viene pubblicata.' },
    sotto: 'Il pulsante non funziona? Copia questo indirizzo nel browser:<br>' + link
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
    console.error('[bacheca-pubblica] variabili di ambiente mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let b;
  try { b = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Dati non validi.' }) }; }

  // trappola anti-robot: il campo «sito_web_extra» e' nascosto, un umano non lo riempie
  if (b.sito_web_extra) return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };

  const titolo = String(b.titolo || '').trim().slice(0, 120);
  const testo = String(b.testo || '').trim().slice(0, 3000);
  const mestiere = String(b.mestiere || '').trim().slice(0, 60) || null;
  const citta = String(b.citta || '').trim().slice(0, 80) || null;
  const nome = String(b.nome || '').trim().slice(0, 60) || null;
  const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
  const foto = (Array.isArray(b.foto) ? b.foto : []).map(String)
    .filter(u => u.startsWith(SUPABASE_URL + '/storage/v1/object/public/')).slice(0, 4);

  if (titolo.length < 8) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Scrivi un titolo di almeno 8 lettere.' }) };
  if (testo.length < 20) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Descrivi meglio il problema (almeno 20 lettere).' }) };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Indirizzo email non valido.' }) };
  // niente link nel testo: e' il primo segnale di spam
  if (/https?:\/\/|www\./i.test(titolo + ' ' + testo)) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Nel testo non mettere link: descrivi il lavoro a parole.' }) };

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  try {
    // freno: max 3 richieste dalla stessa email in 24 ore
    const ieri = new Date(Date.now() - 864e5).toISOString();
    const { count } = await sb.from('bacheca_richieste').select('id', { count: 'exact', head: true })
      .eq('email', email).gte('creato_il', ieri);
    if ((count || 0) >= 3) return { statusCode: 429, headers: corsHeaders, body: JSON.stringify({ error: 'Hai gia pubblicato diverse richieste oggi. Riprova domani.' }) };

    const slug = slugify(titolo + (citta ? ' ' + citta : '')) + '-' + crypto.randomBytes(2).toString('hex');
    const { data: nuova, error } = await sb.from('bacheca_richieste')
      .insert({ slug, titolo, testo, mestiere, citta, nome_pubblico: nome, email, foto })
      .select('token_conferma').single();
    if (error) throw error;

    const link = `${SITO}/conferma-richiesta.html?t=${nuova.token_conferma}`;
    await inviaEmail(email, 'Conferma la tua richiesta su TrovaImpresa', emailConferma(nome, titolo, link));
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, email }) };
  } catch (e) {
    console.error('[bacheca-pubblica]', e);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Errore durante l'invio. Riprova." }) };
  }
};
