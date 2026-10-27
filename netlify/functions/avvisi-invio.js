// AVVISI CLIENTI — l'invio (27 ottobre 2026)
//
// Ogni ora guarda le imprese, gli artigiani e i professionisti NUOVI (email
// confermata, scheda pubblica accesa: la vista imprese_pubbliche li filtra gia')
// e scrive ai clienti iscritti per quella citta' (e quel lavoro, se l'hanno scelto).
// Decisione di Alex: «ogni volta che si registra», cosi' anche l'impresa nuova
// riceve subito un contatto.
//
// Regole:
//  - un cliente riceve solo le iscrizioni arrivate DOPO che ha attivato l'avviso
//  - una mail sola per indirizzo a ogni giro, con dentro tutte le novita'
//  - avvisi_inviati tiene chi ha gia' ricevuto cosa: niente doppioni, anche se
//    Netlify lancia la funzione due volte (la riga si scrive PRIMA di mandare)
//  - ⛔ TETTO: Resend gratis = 100 email al giorno per TUTTO il sito (conferme
//    iscrizione comprese). Gli avvisi ne usano al massimo MAX_24H nelle ultime
//    24 ore; quelli in piu' partono al giro dopo. Quando si passa a Resend Pro
//    (20 $/mese, niente tetto giornaliero) basta alzare MAX_24H.
//
// ⛔ Le due righe vanno insieme: l'import di `schedule` qui sotto e
//    `exports.handler = schedule(...)` in fondo. Se ne resta una sola Netlify
//    rifiuta di pubblicare il sito.
const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');
const { SITO, esc, mailAvvisi, invia, linkCancella, NOMI_TIPO } = require('./_avvisi-email');

const MAX_24H = 20;          // righe di avvisi_inviati nelle ultime 24 ore
const FINESTRA_GIORNI = 7;   // le iscrizioni piu' vecchie di cosi' non si annunciano piu'

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();

function combacia(a, i) {
  if (a.tipo !== i.tipo) return false;
  const c = norm(a.citta);
  if (c !== norm(i.citta) && c !== norm(i.provincia)) return false;
  if (!a.mestiere) return true;
  if (i.mestiere === a.mestiere) return true;
  return a.tipo !== 'professionista' && Array.isArray(i.mestieri) && i.mestieri.includes(a.mestiere);
}

const PAGINA = { impresa: 'cerca-imprese.html', artigiano: 'cerca-artigiani.html', professionista: 'cerca-professionisti.html' };

function mail(email, righe, token) {
  const n = righe.length;
  const citta = righe[0].a.citta;
  const titolo = n === 1 ? 'Nuovo arrivo a ' + esc(citta) : n + ' nuovi arrivi a ' + esc(citta);
  const card = righe.map(({ i }) => {
    const mest = (Array.isArray(i.mestieri) && i.mestieri.length ? i.mestieri.join(', ') : i.mestiere) || '';
    const url = SITO + '/profilo-impresa?id=' + i.id;
    return '<tr><td style="padding:0 0 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border:2px solid #0a2a4d;border-radius:12px;padding:14px 16px">' +
      '<a href="' + url + '" style="font-size:19px;font-weight:800;color:#0a2a4d;text-decoration:none">' + esc(i.nome_attivita || i.nome) + '</a>' +
      '<div style="font-size:15px;color:#25384d;margin-top:4px">' + esc(mest) + (i.citta ? ' &middot; ' + esc(i.citta) : '') + '</div>' +
      '<div style="margin-top:8px"><a href="' + url + '" style="font-size:15px;font-weight:700;color:#ff8800">Guarda la scheda e contattalo &rarr;</a></div>' +
      '</td></tr></table></td></tr>';
  }).join('');
  const primo = righe[0].a;
  return {
    oggetto: n === 1 ? 'Nuovo a ' + citta + ': ' + (righe[0].i.nome_attivita || righe[0].i.nome) : n + ' nuovi arrivi a ' + citta + ' su TrovaImpresa',
    html: mailAvvisi({
      titolo,
      sub: 'Si ' + (n === 1 ? 'è appena iscritto' : 'sono appena iscritti') + ' su TrovaImpresa, nella zona che ci hai indicato.',
      corpo: '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + card + '</table>',
      cta: { url: SITO + '/' + PAGINA[primo.tipo] + '?citta=' + encodeURIComponent(citta), testo: 'Vedi tutti i ' + NOMI_TIPO[primo.tipo] + ' a ' + esc(citta) + ' &rarr;' },
      sotto: 'Ricevi questa email perché hai chiesto di essere avvisato su TrovaImpresa.',
      cancella: linkCancella(token)
    })
  };
}

async function handler() {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
    console.error('[avvisi-invio] variabili di ambiente mancanti');
    return { statusCode: 500 };
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  try {
    const ieri = new Date(Date.now() - 864e5).toISOString();
    const { count: usate, error: e0 } = await sb.from('avvisi_inviati').select('id', { count: 'exact', head: true }).gte('inviato_il', ieri);
    if (e0) throw e0;
    let restano = MAX_24H - (usate || 0);
    if (restano <= 0) { console.log('[avvisi-invio] tetto delle 24 ore raggiunto'); return { statusCode: 200 }; }

    const da = new Date(Date.now() - FINESTRA_GIORNI * 864e5).toISOString();
    const { data: nuove, error: e1 } = await sb.from('imprese_pubbliche')
      .select('id, nome, nome_attivita, tipo, mestiere, mestieri, citta, provincia, created_at')
      .gte('created_at', da).in('tipo', ['impresa', 'artigiano', 'professionista']).order('created_at', { ascending: true }).limit(500);
    if (e1) throw e1;
    if (!nuove || !nuove.length) return { statusCode: 200 };

    const { data: avvisi, error: e2 } = await sb.from('avvisi_clienti')
      .select('id, email, citta, tipo, mestiere, token, confermato_il')
      .eq('attivo', true).not('confermato_il', 'is', null).limit(5000);
    if (e2) throw e2;
    if (!avvisi || !avvisi.length) return { statusCode: 200 };

    // tutte le coppie avviso-impresa nuove che combaciano
    let coppie = [];
    for (const a of avvisi) for (const i of nuove) {
      if (new Date(i.created_at) > new Date(a.confermato_il) && combacia(a, i)) coppie.push({ a, i });
    }
    if (!coppie.length) return { statusCode: 200 };

    // via quelle gia' mandate
    const ids = [...new Set(coppie.map(c => c.a.id))];
    const { data: fatte, error: e3 } = await sb.from('avvisi_inviati').select('avviso_id, impresa_id').in('avviso_id', ids);
    if (e3) throw e3;
    const giaFatte = new Set((fatte || []).map(f => f.avviso_id + ':' + f.impresa_id));
    coppie = coppie.filter(c => !giaFatte.has(c.a.id + ':' + c.i.id));

    // una mail per indirizzo e citta'; la stessa impresa una volta sola nella mail
    const gruppi = new Map();
    for (const c of coppie) {
      const k = c.a.email.toLowerCase() + '|' + norm(c.a.citta);
      if (!gruppi.has(k)) gruppi.set(k, []);
      gruppi.get(k).push(c);
    }

    let mandate = 0;
    for (const righe of gruppi.values()) {
      if (restano <= 0) break;
      // si prenota PRIMA di mandare: se un altro giro le ha gia' prese, qui non tornano
      const { data: prese, error: e4 } = await sb.from('avvisi_inviati')
        .upsert(righe.map(c => ({ avviso_id: c.a.id, impresa_id: c.i.id })), { onConflict: 'avviso_id,impresa_id', ignoreDuplicates: true })
        .select('id, avviso_id, impresa_id');
      if (e4) { console.error('[avvisi-invio] prenotazione', e4.message); continue; }
      if (!prese || !prese.length) continue;
      const presi = new Set(prese.map(p => p.avviso_id + ':' + p.impresa_id));
      const mie = righe.filter(c => presi.has(c.a.id + ':' + c.i.id));
      const unici = [...new Map(mie.map(c => [c.i.id, c])).values()];
      const m = mail(mie[0].a.email, unici, mie[0].a.token);
      try {
        await invia(RESEND_API_KEY, mie[0].a.email, m.oggetto, m.html, linkCancella(mie[0].a.token));
        mandate++;
        restano -= prese.length;
      } catch (e) {
        // non partita: si libera la prenotazione, ci riprova il giro dopo
        console.error('[avvisi-invio] invio', e.message);
        await sb.from('avvisi_inviati').delete().in('id', prese.map(p => p.id));
        if (/429|quota|limit/i.test(e.message)) break;
      }
    }
    console.log('[avvisi-invio] mail mandate:', mandate);
    return { statusCode: 200 };
  } catch (e) {
    console.error('[avvisi-invio]', e);
    return { statusCode: 500 };
  }
}

exports.handler = schedule('17 * * * *', handler);
// per il banco di prova
exports._interno = { combacia, norm, mail, handler };
