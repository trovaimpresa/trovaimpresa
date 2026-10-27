// AVVISI CLIENTI — iscrizione (27 ottobre 2026)
//
// Il cliente cerca, non trova quello che voleva, e lascia la sua email nel
// riquadro «Sei un cliente e non hai trovato quello che cercavi?» delle pagine
// cerca-imprese / cerca-artigiani / cerca-professionisti.
// Si salva: email + citta' (+ regione) + tipo (impresa/artigiano/professionista)
// + mestiere (vuoto = tutti i lavori).
//
// La prima volta parte una mail di conferma (un clic): senza, chiunque potrebbe
// iscrivere l'email di un altro. Se quella email ha GIA' confermato un avviso,
// i nuovi si attivano subito, senza seconda mail.
// L'invio degli avvisi lo fa avvisi-invio.js, ogni ora.

const { createClient } = require('@supabase/supabase-js');
const { esc, mailAvvisi, invia, linkConferma, linkCancella, cosaCerca } = require('./_avvisi-email');

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
const risposta = (code, obj) => ({ statusCode: code, headers: H, body: JSON.stringify(obj) });
const TIPI = ['impresa', 'artigiano', 'professionista', 'mestiere'];

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return risposta(405, { error: 'Method Not Allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
    console.error('[avvisi-iscrivi] variabili di ambiente mancanti');
    return risposta(500, { error: 'Configurazione server mancante.' });
  }

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch (e) { return risposta(400, { error: 'Dati non validi.' }); }
  // trappola anti-robot: casella nascosta, un umano non la riempie
  if (b.sito_web_extra) return risposta(200, { ok: true, stato: 'conferma' });

  const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
  const citta = String(b.citta || '').replace(/[%_,()]/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 80);
  const regione = String(b.regione || '').trim().slice(0, 60) || null;
  const tipo = String(b.tipo || '').trim();
  // per le pagine mestiere+citta' (tipo 'mestiere') qui arrivano le voci del database separate da |
  let mestiere = String(b.mestiere || '').trim().slice(0, 300);
  const etichetta = String(b.etichetta || '').trim().slice(0, 80) || null;
  if (!mestiere || mestiere === 'tutti' || mestiere === 'tutte') mestiere = null;
  const origine = String(b.origine || '').slice(0, 60) || null;

  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return risposta(400, { error: 'Scrivi un indirizzo email valido.' });
  if (citta.length < 2) return risposta(400, { error: 'Scrivi la città.' });
  if (!TIPI.includes(tipo)) return risposta(400, { error: 'Dati non validi.' });
  if (tipo === 'mestiere' && !mestiere) return risposta(400, { error: 'Dati non validi.' });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  try {
    // freno: max 10 iscrizioni nuove dalla stessa email in 24 ore
    const ieri = new Date(Date.now() - 864e5).toISOString();
    const { count } = await sb.from('avvisi_clienti').select('id', { count: 'exact', head: true })
      .eq('email', email).gte('creato_il', ieri);
    if ((count || 0) >= 10) return risposta(429, { error: 'Troppe iscrizioni oggi. Riprova domani.' });

    // questa email ha gia' confermato almeno un avviso? allora vale come confermata
    const { data: conf } = await sb.from('avvisi_clienti').select('id').eq('email', email)
      .not('confermato_il', 'is', null).limit(1);
    const giaFidata = !!(conf && conf.length);

    // c'e' gia' lo stesso avviso? (stessa email, citta', tipo, mestiere)
    let q = sb.from('avvisi_clienti').select('id, token, confermato_il, attivo')
      .eq('email', email).ilike('citta', citta).eq('tipo', tipo);
    q = mestiere ? q.eq('mestiere', mestiere) : q.is('mestiere', null);
    const { data: esist } = await q.limit(1);
    let riga = esist && esist[0];

    const adesso = new Date().toISOString();
    if (riga) {
      const upd = { attivo: true };
      if (!riga.confermato_il && giaFidata) upd.confermato_il = adesso;
      const { data: r2, error } = await sb.from('avvisi_clienti').update(upd).eq('id', riga.id)
        .select('id, token, confermato_il').single();
      if (error) throw error;
      riga = r2;
    } else {
      const { data: r2, error } = await sb.from('avvisi_clienti')
        .insert({ email, citta, regione, tipo, mestiere, etichetta, origine, confermato_il: giaFidata ? adesso : null })
        .select('id, token, confermato_il').single();
      if (error) throw error;
      riga = r2;
    }

    if (riga.confermato_il) return risposta(200, { ok: true, stato: 'attivo' });

    const cosa = cosaCerca({ tipo, mestiere, citta, etichetta });
    await invia(RESEND_API_KEY, email, 'Attiva i tuoi avvisi su TrovaImpresa', mailAvvisi({
      titolo: 'Un clic e ti avvisiamo noi',
      sub: 'Ti scriveremo quando arriva qualcuno di nuovo per:',
      corpo: '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#e7eef8;border-left:5px solid #ff8800;border-radius:12px;padding:14px 16px;font-size:18px;line-height:1.4;color:#0a2a4d;font-weight:800">' + esc(cosa) + '</td></tr></table>',
      cta: { url: linkConferma(riga.token), testo: 'Attiva gli avvisi &rarr;' },
      sotto: 'Non sei stato tu? Ignora questa email: senza il tuo clic non ti scriviamo.<br>Il pulsante non funziona? Copia questo indirizzo nel browser:<br>' + linkConferma(riga.token),
      cancella: linkCancella(riga.token)
    }));
    return risposta(200, { ok: true, stato: 'conferma' });
  } catch (e) {
    console.error('[avvisi-iscrivi]', e);
    return risposta(500, { error: 'Non sono riuscito a salvare. Riprova fra poco.' });
  }
};
