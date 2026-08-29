// netlify/functions/riepilogo-lunedi.js
//
// 11 agosto 2026 — IL RIEPILOGO DEL LUNEDI' MATTINA.
//
// A CHE SERVE
// Il Riepilogo del gestionale e' bellissimo, ma bisogna ricordarsi di aprirlo.
// Il lunedi' mattina uno accende il telefono, non il gestionale. Questa
// funzione gira una volta a settimana e manda UNA email con le tre cose che
// fanno perdere soldi se sfuggono:
//   1. le scadenze dei prossimi 7 giorni
//   2. le fatture emesse che nessuno ha pagato
//   3. i lavori (o le pratiche) con la data prevista gia' passata
//
// I CONTI SONO GLI STESSI DEL RIEPILOGO
// Le formule qui sotto sono copiate dal Riepilogo di gestionale-app.html, non
// riscritte a mente: il totale di una fattura e' imponibile + IVA - sconto +
// bollo - ritenuta, e "scaduta" vuol dire emessa con la data superata dei
// giorni di pagamento dei Dati azienda. Se le due schermate dessero numeri
// diversi, la persona smetterebbe di fidarsi di tutte e due.
//
// CHI LA RICEVE (per adesso)
// Solo l'indirizzo scritto in SOLO_A qui sotto. Serve a vedere quattro lunedi'
// di fila che i numeri sono giusti prima di mandarla agli iscritti.
// PER APRIRLA A TUTTI: metti  const SOLO_A = null;  e basta, il resto e' gia'
// scritto per funzionare con tutti.
//
// CHI NON LA RICEVE MAI
// - chi ha tolto la spunta "Mandami il riepilogo del lunedi'" nei Dati azienda
// - chi in quella settimana non ha NIENTE da segnalare: niente email a vuoto.
//   Tre email "va tutto bene" di fila e la quarta non la apre piu' nessuno.
//
// PRIMA DI FUNZIONARE VUOLE
// - sql/gest-azienda-riepilogo-lunedi.sql eseguito su Supabase (la colonna
//   dell'interruttore). Se non lo esegui parte lo stesso: senza la colonna
//   considera tutti "accesi", come prima.
// - SUPABASE_SERVICE_KEY e RESEND_API_KEY su Netlify: ci sono gia', le usano
//   promemoria-scadenze.js e invia-promemoria.js.

const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// L'UNICA RIGA DA CAMBIARE QUANDO VUOI APRIRLA A TUTTI: metti  null
// ---------------------------------------------------------------------------
const SOLO_A = 'pintoalessio@icloud.com';

const SITO = 'https://trovaimpresa.com/gestionale-app.html';

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function oggiISO() {
  return new Date().toISOString().slice(0, 10);
}
// stessa funzione del gestionale (_giorniDopo): niente fusi orari di mezzo
function giorniDopo(ds, n) {
  const [y, m, d] = String(ds).split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return dt.getFullYear() + '-' + mm + '-' + dd;
}
function dataIt(iso) {
  if (!iso) return '';
  const [a, m, g] = String(iso).split('-');
  return g + '/' + m + '/' + a;
}
function quantiGiorni(da, a) {
  const p = s => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(a) - p(da)) / 86400000);
}
// useGrouping:true e' esplicito apposta, come nel gestionale. Senza, qui
// usciva "2550,00 €" invece di "2.550,00 €": trovato facendo girare davvero
// la funzione, non leggendola.
function euro(n) {
  return new Intl.NumberFormat('it-IT',
    { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })
    .format(+n || 0) + ' €';
}
const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
function nomeGiorno(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return GIORNI[new Date(y, m - 1, d).getDay()];
}
function fra(n) {
  return n === 0 ? 'oggi' : n === 1 ? 'domani' : 'fra ' + n + ' giorni';
}
function plurale(n, uno, tanti) { return n + ' ' + (n === 1 ? uno : tanti); }

// ===========================================================================
// ⛔ IL GRADINO 4 — L'AI SCRIVE LA SETTIMANA. 29 agosto 2026.
//
// L'elenco qui sotto c'era gia' e non si tocca. Quello che si aggiunge sono
// QUATTRO O CINQUE RIGHE in cima: cosa guardare per primo, e perche'.
// L'elenco dice COSA c'e'; queste righe dicono DA DOVE COMINCIARE.
//
// ⛔ SE L'AI NON RISPONDE, L'EMAIL PARTE LO STESSO, senza il cappello.
//    Un avviso che non arriva e' molto peggio di un avviso senza commento: il
//    lunedi' e' l'unico momento in cui uno guarda queste cose. Percio' qui non
//    si lancia mai un errore, e il tetto del tempo e' CORTO apposta — la
//    function ha il suo limite, e non deve saltare tutta per un commento.
//
// ⛔ E NON INVENTA NUMERI: a Claude si passano solo i numeri gia' calcolati
//    qui sopra, e gli si dice di non tirarne fuori altri. I conti li fa il
//    gestionale, lui li racconta.
//
// ⚠️ PRIMA DI APRIRLA A TUTTI (SOLO_A = null) vanno decise due cose:
//    1. se scrivere da qualche parte che quel pezzo l'ha scritto un'AI —
//       sulla propria email si sa, sull'email di un altro e' un'altra cosa;
//    2. chi paga: adesso e' una chiamata a settimana per una persona sola.
// ===========================================================================
const AI_MODELLO = 'claude-sonnet-4-5';
const AI_TEMPO   = 9000;   // ms — corto apposta, vedi sopra

// Quello che l'AI puo' guardare: solo roba gia' calcolata qui. E' una funzione
// pura, cosi' il banco puo' leggerla senza chiamare nessuno.
function cosaDire(d) {
  const r = [];
  r.push('Oggi e\' ' + nomeGiorno(d.oggi) + ' ' + dataIt(d.oggi) + '.');
  r.push('Chi legge fa questo mestiere: ' + (d.pro ? 'studio tecnico' : 'impresa o artigiano') + '.');
  r.push('');

  r.push('SCADENZE DEI PROSSIMI 7 GIORNI: ' + d.scadenze.length);
  d.scadenze.forEach(function (x) {
    r.push('- ' + (x.titolo || 'senza titolo')
      + ' | ' + nomeGiorno(x.data_scadenza) + ' ' + dataIt(x.data_scadenza)
      + ' | ' + fra(x.giorni)
      + (x.reparto ? ' | reparto ' + x.reparto : ''));
  });
  r.push('');

  r.push('FATTURE EMESSE E NON PAGATE: ' + d.fatture.length);
  d.fatture.forEach(function (x) {
    r.push('- fattura ' + (x.numero || 'senza numero')
      + (x.cliente ? ' | ' + x.cliente : '')
      + ' | ' + euro(x.totale)
      + ' | in ritardo di ' + plurale(x.giorniRitardo, 'giorno', 'giorni'));
  });
  if (d.fatture.length) r.push('In tutto devono avere: ' + euro(d.totaleScaduto));
  r.push('');

  r.push((d.pro ? 'PRATICHE' : 'LAVORI') + ' CON LA DATA GIA\' PASSATA: ' + d.lavori.length);
  d.lavori.forEach(function (x) {
    r.push('- ' + (x.titolo || 'senza titolo')
      + (x.cliente ? ' | ' + x.cliente : '')
      + ' | doveva finire il ' + dataIt(x.data_prevista)
      + ' | ' + plurale(x.giorniRitardo, 'giorno fa', 'giorni fa'));
  });

  return r.join('\n');
}

function istruzioniSettimana() {
  return [
    'Scrivi il cappello dell\'email del lunedì mattina del gestionale TrovaImpresa. Chi la legge è un artigiano o un\'impresa edile, e la apre dal telefono, in piedi, prima di uscire.',
    '',
    'Scrivi da QUATTRO a CINQUE righe, non di più. Italiano semplice e concreto, come un collega che ti dice da dove cominciare.',
    'Dì COSA GUARDARE PER PRIMO e PERCHÉ. Sotto queste righe c\'è già l\'elenco completo di tutto: non rifarlo.',
    '',
    '⛔ Usa SOLO i numeri, le date e i nomi che ti do qui sotto. Non inventarne altri, non stimare e non fare somme che non ti ho già dato: i conti li ha fatti il gestionale.',
    'Scrivi i soldi come te li do, all\'italiana: 8.000,00 €.',
    '',
    'NON scrivere: saluti, firme, titoli, elenchi puntati, e niente frasi di incoraggiamento. Comincia dalla cosa più importante.',
    'NON dare consigli su tasse, aliquote, norme di sicurezza o contratti: non è il posto.',
    'Non dire che sei un\'intelligenza artificiale e non parlare di te.'
  ].join('\n');
}

// Ritorna il testo, oppure null. NON lancia mai: vedi la nota in cima.
async function frasiDellaSettimana(d) {
  const chiave = process.env.ANTHROPIC_API_KEY;
  if (!chiave) return null;
  let scaduta;
  try {
    const controllore = new AbortController();
    scaduta = setTimeout(function () { controllore.abort(); }, AI_TEMPO);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controllore.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': chiave,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: AI_MODELLO,
        max_tokens: 400,
        system: istruzioniSettimana(),
        messages: [{ role: 'user', content: cosaDire(d) }]
      })
    });
    if (!res.ok) { console.error('[lunedi] AI HTTP ' + res.status); return null; }
    const b = await res.json();
    const testo = (b.content || [])
      .filter(function (x) { return x.type === 'text'; })
      .map(function (x) { return x.text; }).join('\n').trim();
    return testo || null;
  } catch (e) {
    console.error('[lunedi] AI:', (e && e.message) || e);
    return null;
  } finally {
    clearTimeout(scaduta);
  }
}

// ---------------------------------------------------------------------------
// L'email. Testo grande e righe distanziate: si legge dal telefono, in piedi.
// ---------------------------------------------------------------------------
function sezione(colore, titolo, righe, bottone, link, coda) {
  if (!righe.length) return '';   // sezione vuota = sezione che sparisce
  return `
  <div style="padding:18px 26px 6px">
    <div style="font-size:19px;font-weight:800;color:#0a2a4d;border-left:5px solid ${colore};padding-left:12px;line-height:1.4">${titolo}</div>
  </div>
  <div style="padding:6px 26px">
    <table style="width:100%;border-collapse:collapse">${righe.join('')}</table>
    ${coda || ''}
    <div style="margin:16px 0 22px">
      <a href="${link}" style="display:inline-block;background:#0066ff;color:#ffffff;padding:13px 24px;border-radius:9px;font-size:16px;font-weight:700;text-decoration:none">${bottone} &rarr;</a>
    </div>
  </div>`;
}
function riga(titolo, sotto, evidenza, colore) {
  return `<tr><td style="padding:16px 0;border-bottom:1px solid #edf1f6">
    <div style="font-size:17px;font-weight:700;color:#0a2a4d;line-height:1.5">${esc(titolo)}</div>
    ${sotto ? `<div style="font-size:15px;color:#5b6b7d;margin-top:5px">${esc(sotto)}</div>` : ''}
    ${evidenza ? `<div style="font-size:16px;font-weight:700;color:${colore};margin-top:7px">${evidenza}</div>` : ''}
  </td></tr>`;
}

/* Il cappello in cima all'email.
   ⚠️ IL TESTO ARRIVA DA FUORI: esc() PRIMA, e solo dopo gli a capo diventano
      <br>. Mai mettere in una pagina testo grezzo, nemmeno se l'ha scritto
      Claude — e' la stessa regola di mdInline in js/ai-integrazione.js.
   ⛔ Se l'AI non ha risposto resta ESATTAMENTE la riga di prima: l'email non
      cambia forma solo perche' e' saltata una chiamata. */
function cappelloHTML(d) {
  if (!d.cappello) {
    return `<div style="padding:26px 26px 8px">
    <p style="font-size:17px;line-height:1.7;margin:0">Buongiorno. Ecco cosa ti aspetta questa settimana, preso dal tuo gestionale.</p>
  </div>`;
  }
  return `<div style="padding:26px 26px 6px">
    <div style="background:#f2f7ff;border-left:5px solid #0066ff;border-radius:10px;padding:18px 20px;font-size:17px;line-height:1.7;color:#22303f">${esc(d.cappello).replace(/\n+/g, '<br>')}</div>
  </div>`;
}

function costruisciEmail(d) {
  const parole = d.pro
    ? { lavori: 'Pratiche in ritardo', lavoro: 'pratica', lavoriP: 'pratiche', apri: 'Apri le pratiche' }
    : { lavori: 'Lavori in ritardo', lavoro: 'lavoro', lavoriP: 'lavori', apri: 'Apri i lavori' };

  const rScad = d.scadenze.map(s => riga(
    s.titolo || 'Scadenza',
    s.tipo_pratica || s.reparto || '',
    nomeGiorno(s.data_scadenza) + ' ' + dataIt(s.data_scadenza).slice(0, 5) + ' — ' + fra(s.giorni),
    s.giorni <= 1 ? '#c62828' : s.giorni <= 3 ? '#e65100' : '#0066ff'));

  const rFatt = d.fatture.map(f => riga(
    'Fattura ' + (f.numero || '—') + (f.cliente ? ' — ' + f.cliente : ''),
    '',
    euro(f.totale) + ' &middot; scaduta da ' + plurale(f.giorniRitardo, 'giorno', 'giorni'),
    '#c62828'));

  const rLav = d.lavori.map(l => riga(
    l.titolo || 'Senza titolo',
    l.cliente || '',
    'Doveva essere finit' + (d.pro ? 'a' : 'o') + ' il ' + dataIt(l.data_prevista)
      + ' — ' + plurale(l.giorniRitardo, 'giorno fa', 'giorni fa'),
    '#e65100'));

  const codaFatt = d.fatture.length
    ? `<div style="background:#fdf0f0;border-radius:10px;padding:14px 16px;margin-top:16px;font-size:17px;font-weight:800;color:#0a2a4d">In tutto ti devono ${euro(d.totaleScaduto)}</div>`
    : '';

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;color:#22303f;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dfe5ee">
  <div style="background:linear-gradient(135deg,#0a2a4d,#0066ff);padding:30px 26px">
    <div style="color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;margin:0">La tua settimana</div>
    <div style="color:#c9dcff;font-size:16px;margin-top:8px">${esc(nomeGiorno(d.oggi) + ' ' + dataIt(d.oggi))}${d.azienda ? ' &middot; ' + esc(d.azienda) : ''}</div>
  </div>
  ${cappelloHTML(d)}
  ${sezione('#0066ff', 'Scadenze di questa settimana', rScad, 'Apri lo scadenzario', SITO + '#scadenzario')}
  ${sezione('#c62828', 'Non ti hanno ancora pagato', rFatt, 'Apri le fatture', SITO + '#fatture', codaFatt)}
  ${sezione('#e65100', parole.lavori, rLav, parole.apri, SITO + '#lavori')}
  <div style="padding:6px 26px 28px;border-top:1px solid #edf1f6;margin-top:6px">
    <p style="font-size:14px;color:#7a8798;line-height:1.7;margin:18px 0 0">
      Ricevi questa email il lunedì mattina perché hai il riepilogo settimanale acceso.
      Puoi spegnerlo quando vuoi dai <b>Dati azienda</b> del gestionale.
    </p>
  </div>
</div>
<p style="text-align:center;font-size:13px;color:#9aa5b1;margin-top:14px;font-family:system-ui,sans-serif">
  TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#9aa5b1">trovaimpresa.com</a></p>`;
}

function oggetto(d) {
  const pezzi = [];
  if (d.scadenze.length) pezzi.push(plurale(d.scadenze.length, 'scadenza', 'scadenze'));
  if (d.fatture.length)  pezzi.push(plurale(d.fatture.length, 'fattura scaduta', 'fatture scadute'));
  if (d.lavori.length)   pezzi.push(plurale(d.lavori.length, d.pro ? 'pratica in ritardo' : 'lavoro in ritardo',
                                                             d.pro ? 'pratiche in ritardo' : 'lavori in ritardo'));
  return 'La tua settimana — ' + pezzi.join(', ');
}

// ---------------------------------------------------------------------------
const handler = async function () {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY)            return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
  if (!process.env.RESEND_API_KEY) return { statusCode: 500, body: 'RESEND_API_KEY non configurata' };

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const oggi = oggiISO();
  const fra7 = giorniDopo(oggi, 7);

  try {
    // -----------------------------------------------------------------------
    // 1. Chi ha un gestionale. La riga gest_azienda e' quella che esiste solo
    //    per chi lo usa davvero: e' il modo piu' onesto di fare l'elenco.
    // -----------------------------------------------------------------------
    let colonnaInterruttore = true;
    let az = null;
    {
      const r = await sb.from('gest_azienda').select('user_id, nome, giorni_pagamento, riepilogo_lunedi');
      if (r.error && /riepilogo_lunedi/.test(r.error.message || '')) {
        // la migrazione non e' ancora stata eseguita: si tira dritto e si
        // considerano tutti accesi, invece di non mandare niente a nessuno
        colonnaInterruttore = false;
        const r2 = await sb.from('gest_azienda').select('user_id, nome, giorni_pagamento');
        if (r2.error) throw r2.error;
        az = r2.data || [];
      } else if (r.error) { throw r.error; }
      else { az = r.data || []; }
    }
    const aziende = az.filter(a => colonnaInterruttore ? a.riepilogo_lunedi !== false : true);
    if (!aziende.length) return { statusCode: 200, body: JSON.stringify({ ok: true, emailInviate: 0 }) };

    const utenti = aziende.map(a => a.user_id);

    // -----------------------------------------------------------------------
    // 2. I dati, in tre letture sole invece di tre per persona
    // -----------------------------------------------------------------------
    // IL CESTINO. Dal 9 agosto cancellare vuol dire "scrivi la data in
    // eliminato_il": la riga resta nel database. Il gestionale la nasconde da
    // solo (js/cestino.js), ma qui si legge da fuori, senza quel filtro. Senza
    // questa precauzione il lunedi' arriverebbe l'elenco delle fatture non
    // pagate CON DENTRO quelle gia' buttate nel cestino.
    // Se la colonna non esistesse (migrazione non fatta), si rilegge senza:
    // meglio qualche riga di troppo che nessuna email.
    const senzaCestino = async (costruisci) => {
      const r = await costruisci(true);
      if (r.error && /eliminato_il/.test(r.error.message || '')) return costruisci(false);
      return r;
    };
    const vivi = (q, filtra) => filtra ? q.is('eliminato_il', null) : q;

    const [qScad, qFatt, qLav, qCli, qImp, qMest] = await Promise.all([
      senzaCestino(f => vivi(sb.from('gest_scadenze')
        .select('user_id, mestiere_id, titolo, tipo_pratica, data_scadenza, stato')
        .in('user_id', utenti).gte('data_scadenza', oggi).lte('data_scadenza', fra7), f)),
      senzaCestino(f => vivi(sb.from('gest_fatture')
        .select('id, user_id, numero, data, stato, sconto, bollo, ritenuta_perc, cliente_id')
        .in('user_id', utenti).eq('stato', 'emessa'), f)),
      /* ⛔ 29 agosto 2026 — QUI C'ERA SCRITTO `titolo`, E QUELLA COLONNA NON
         ESISTE: in `gest_lavori` si chiama `descrizione`. PostgREST rispondeva
         «column does not exist», l'errore usciva dal try e la function
         restituiva 500. Cioe': il lunedi' non partiva NESSUNA email, a
         nessuno, e non se ne accorgeva nessuno — una scheduled function che
         fallisce non avvisa, si vede solo nei log di Netlify.
         ⚠️ E' lo stesso errore dei →5← nomi di colonna sbagliati trovati il
         29 agosto in chat-gestionale.js: i nomi si LEGGONO DAL DATABASE, non
         si scrivono a memoria. Questi sono stati riletti uno per uno. */
      senzaCestino(f => vivi(sb.from('gest_lavori')
        .select('user_id, descrizione, stato, data_prevista, cliente_id')
        .in('user_id', utenti).neq('stato', 'fatto').lt('data_prevista', oggi), f)),
      // i clienti si leggono TUTTI, cestino compreso: se hai buttato la scheda
      // del cliente ma la sua fattura è ancora da incassare, il nome ti serve
      // lo stesso (è la stessa scelta già fatta nei documenti PDF)
      sb.from('gest_clienti').select('id, nome').in('user_id', utenti),
      sb.from('imprese').select('user_id, tipo').in('user_id', utenti),
      senzaCestino(f => vivi(sb.from('gest_mestieri').select('id, nome').in('user_id', utenti), f))
    ]);
    for (const q of [qScad, qFatt, qLav, qCli, qImp, qMest]) if (q.error) throw q.error;

    /* ⛔ 29 agosto 2026 (notte) — IL TOTALE NON SI RIFA' PIU' QUI.
       Qui c'era la TERZA copia della formula dei soldi, e sbagliava:
       sommava solo qta * prezzo, quindi SENZA la cassa previdenziale e
       SENZA le spese. Su una parcella vera del reparto «progetto casa»
       erano 305 € di differenza — e il commento sopra diceva «STESSA
       formula del Riepilogo del gestionale», che non era vero.
       Adesso il totale lo chiede alla vista `gest_fatture_totali`, che a
       sua volta chiede a `gest_fattura_conti()`: la formula dei soldi sta
       in un posto solo, ed e' la regola 6 del gestionale.
       ⚠️ La vista porta gia' il SEGNO: una nota di credito toglie soldi
          invece di aggiungerli. */
    const idFatture = (qFatt.data || []).map(f => f.id);
    const totali = {};
    if (idFatture.length) {
      const q = await sb.from('gest_fatture_totali').select('fattura_id, totale')
                        .in('fattura_id', idFatture);
      if (q.error) throw q.error;
      (q.data || []).forEach(t => { totali[String(t.fattura_id)] = +t.totale || 0; });
    }

    const nomeCli  = Object.fromEntries((qCli.data  || []).map(c => [String(c.id), c.nome || '']));
    const nomeMest = Object.fromEntries((qMest.data || []).map(m => [String(m.id), m.nome || '']));
    const tipoUte  = Object.fromEntries((qImp.data  || []).map(i => [String(i.user_id), i.tipo || '']));

    // quanto ti bonifica il cliente: lo dice la vista, non si ricalcola
    const totaleFattura = f => totali[String(f.id)] || 0;

    // -----------------------------------------------------------------------
    // 3. Una busta per persona
    // -----------------------------------------------------------------------
    let inviate = 0, saltateVuote = 0, senzaEmail = 0, conCappello = 0;
    const errori = [];

    for (const a of aziende) {
      const uid = a.user_id;
      const ggPag = (+a.giorni_pagamento) || 30;

      const scadenze = (qScad.data || [])
        .filter(s => s.user_id === uid && s.stato !== 'fatta' && s.data_scadenza)
        .map(s => ({ ...s, giorni: quantiGiorni(oggi, s.data_scadenza),
                     reparto: nomeMest[String(s.mestiere_id)] || '' }))
        .sort((x, y) => x.giorni - y.giorni);

      const fatture = (qFatt.data || [])
        .filter(f => f.user_id === uid && f.data && giorniDopo(f.data, ggPag) < oggi)
        .map(f => ({ numero: f.numero, cliente: nomeCli[String(f.cliente_id)] || '',
                     totale: totaleFattura(f),
                     giorniRitardo: quantiGiorni(giorniDopo(f.data, ggPag), oggi) }))
        .sort((x, y) => y.giorniRitardo - x.giorniRitardo);

      const lavori = (qLav.data || [])
        .filter(l => l.user_id === uid && l.data_prevista)
        .map(l => ({ titolo: l.descrizione, cliente: nomeCli[String(l.cliente_id)] || '',
                     data_prevista: l.data_prevista,
                     giorniRitardo: quantiGiorni(l.data_prevista, oggi) }))
        .sort((x, y) => y.giorniRitardo - x.giorniRitardo);

      // settimana pulita = nessuna email. Il silenzio e' un'informazione.
      if (!scadenze.length && !fatture.length && !lavori.length) { saltateVuote++; continue; }

      let email = null;
      try {
        const { data: u } = await sb.auth.admin.getUserById(uid);
        email = u && u.user ? u.user.email : null;
      } catch (e) { errori.push('getUserById ' + uid + ': ' + e.message); }
      if (!email) { senzaEmail++; continue; }

      // periodo di prova: parte solo verso un indirizzo
      if (SOLO_A && String(email).trim().toLowerCase() !== SOLO_A.toLowerCase()) continue;

      const d = {
        oggi, azienda: a.nome || '', pro: tipoUte[String(uid)] === 'professionista',
        scadenze, fatture, lavori,
        totaleScaduto: fatture.reduce((s, f) => s + f.totale, 0)
      };

      /* ⛔ QUI, e non prima: sta DOPO il filtro SOLO_A, quindi in questo
         periodo di prova la chiamata si paga per una persona sola. E se
         torna null l'email parte lo stesso, senza cappello. */
      d.cappello = await frasiDellaSettimana(d);
      if (d.cappello) conCappello++;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TrovaImpresa <info@trovaimpresa.com>',
          to: [email],
          subject: oggetto(d),
          html: costruisciEmail(d)
        })
      });
      if (!res.ok) { errori.push('Resend ' + email + ': ' + (await res.text())); continue; }
      inviate++;
    }

    return { statusCode: 200, body: JSON.stringify({
      ok: true, emailInviate: inviate, conCappello, settimanePulite: saltateVuote,
      senzaEmail, interruttore: colonnaInterruttore ? 'attivo' : 'colonna mancante, tutti accesi',
      errori
    }) };
  } catch (err) {
    console.error('riepilogo-lunedi:', err.message);
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};

// Lunedì alle 5:30 UTC = le 7:30 in Italia con l'ora legale (adesso).
// Da fine ottobre, con l'ora solare, diventerebbe le 6:30: quando cambia
// l'ora basta mettere  '30 6 * * 1'  qui sotto e torna alle 7:30.
exports.handler = schedule('30 5 * * 1', handler);

// Per provarla a mano senza aspettare lunedì:
// exports.handler = handler;
module.exports.eseguiOra = handler;

// per il banco: le parti pure si provano da sole, senza rete e senza database
module.exports.cosaDire = cosaDire;
module.exports.istruzioniSettimana = istruzioniSettimana;
module.exports.cappelloHTML = cappelloHTML;
module.exports.costruisciEmail = costruisciEmail;
module.exports.oggetto = oggetto;
