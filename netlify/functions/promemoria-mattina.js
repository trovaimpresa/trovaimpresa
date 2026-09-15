// netlify/functions/promemoria-mattina.js
//
// 14 settembre 2026 — IL PROMEMORIA DEL MATTINO. UNA EMAIL SOLA.
//
// PERCHE' ESISTE
// Prima le email automatiche del gestionale erano QUATTRO, tutte fra le 6:00 e
// le 7:30 dello stesso mattino:
//   - invia-promemoria.js   (6:00) i suoi appunti con una data
//   - promemoria-scadenze.js(6:15) le scadenze a 30, 7 e 1 giorno
//   - promemoria-dalsito.js (6:20) le richieste dal sito non aperte
//   - riepilogo-lunedi.js   (lun 5:30) il riepilogo della settimana
// Quattro messaggi prima delle 6:30 non sono quattro promemoria: sono una
// cartella che uno smette di aprire. Questa funzione le assorbe tutte e ne
// manda UNA.
//
// LA REGOLA, decisa il 14 settembre 2026
// ⛔ IN SETTIMANA SI INTERROMPE SOLO PER LE COSE CHE SONO CAMBIATE OGGI:
//    - una scadenza che taglia oggi il traguardo dei 30, 7 o 1 giorno
//    - una scadenza appena scaduta (era ieri, ed e' ancora aperta)
//    - una richiesta dal sito ferma da piu' di 24 ore e mai aperta
// ⛔ IL LUNEDI' arriva il quadro completo: anche le cose vecchie — scadenze
//    gia' passate, fatture che non ti hanno pagato, lavori in ritardo.
//
// PERCHE' LE COSE VECCHIE NON INTERROMPONO
// Un lavoro in ritardo da 46 giorni non e' urgente OGGI: era urgente 46 giorni
// fa. Mandarlo ogni mattina e' una sveglia che suona a vuoto, e in due
// settimane non si apre piu' niente. Quello sta nel lunedi'.
//
// I DUE PALETTI CONTRO LO SPAM
//   1. al massimo UNA email al giorno a persona (tabella gest_promemoria_inviati)
//   2. la stessa cosa non si ripete: ogni avviso si segna dove si segnava gia'
//      prima — la colonna gest_scadenze.avvisi e la tabella gest_dalsito_avvisi.
//      I registri sono quelli vecchi apposta: chi e' gia' stato avvisato ieri
//      da promemoria-scadenze.js non viene riavvisato oggi da qui.
//
// CHI NON RICEVE NIENTE
// - chi ha tolto la spunta in Dati azienda (gest_azienda.riepilogo_lunedi)
// - chi non ha il gestionale (piano diverso da premium, o premium scaduto)
// - chi in quel giorno non ha NIENTE da segnalare: nessuna email a vuoto
//
// I CONTI SONO QUELLI DEL GESTIONALE
// Il totale di una fattura lo dice la vista gest_fatture_totali, che a sua
// volta chiama gest_fattura_conti(). La formula dei soldi sta in un posto solo.
//
// PRIMA DI FUNZIONARE VUOLE
// - sql/promemoria-mattina-registro.sql eseguito su Supabase
// - SUPABASE_SERVICE_KEY e RESEND_API_KEY su Netlify (ci sono gia')

const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

const SITO = 'https://trovaimpresa.com/gestionale-app.html';

/* ⛔ IL CAPPELLO SCRITTO DALL'AI RESTA SOLO SUL SUO INDIRIZZO.
   Non e' il filtro di chi riceve l'email — quello non c'e' piu', l'email va a
   tutti. E' solo chi riceve le quattro righe di commento in cima.
   Due motivi, tutti e due scritti nel vecchio riepilogo-lunedi.js e mai
   decisi: (1) sulla propria email si sa che l'ha scritta un'AI, sull'email di
   un altro andrebbe detto; (2) e' una chiamata a pagamento per ogni persona
   ogni lunedi'. Finche' non si decidono quelle due cose, gli altri ricevono la
   riga fissa — che e' esattamente quello che ricevevano prima. */
const CAPPELLO_AI_SOLO_A = 'pintoalessio@icloud.com';

// le tre tappe dell'avviso, identiche a quelle di promemoria-scadenze.js
const TAPPE = [
  { giorni: 30, testo: 'fra 30 giorni', colore: '#0066ff' },
  { giorni: 7,  testo: 'fra 7 giorni',  colore: '#e65100' },
  { giorni: 1,  testo: 'DOMANI',        colore: '#c62828' }
];
// il segno che si scrive in gest_scadenze.avvisi quando si avvisa di una gia'
// scaduta: sta insieme a "30,7,1" e non da' fastidio a nessuno
const SEGNO_SCADUTA = 'scaduta';

const ORE_MINIME_RICHIESTA = 24;   // prima di 24 ore non si avvisa: la sta guardando
const GIORNI_MAX_RICHIESTA = 7;    // piu' vecchie di cosi' non si spara addosso all'arretrato

// ---------------------------------------------------------------------------
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function oggiISO() { return new Date().toISOString().slice(0, 10); }
// stessa funzione del gestionale (_giorniDopo): niente fusi orari di mezzo
function giorniDopo(ds, n) {
  const [y, m, d] = String(ds).split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0')
         + '-' + String(dt.getDate()).padStart(2, '0');
}
function dataIt(iso) {
  if (!iso) return '';
  /* ⚠️ 15 set 2026: si taglia ai primi 10 caratteri. Le colonne `data` sono
     date secche (2026-09-15) ma `created_at` e' un orario completo
     (2026-09-14T17:30:00+00:00): senza il taglio usciva
     «14T17:30:00+00:00/09/2026». Trovato mentre si passava all'AI la data in
     cui il promemoria e' stato scritto. */
  const [a, m, g] = String(iso).slice(0, 10).split('-');
  return g + '/' + m + '/' + a;
}
function quantiGiorni(da, a) {
  const p = s => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(a) - p(da)) / 86400000);
}
// useGrouping:true e' esplicito apposta, come nel gestionale. Senza, qui
// usciva "2550,00 €" invece di "2.550,00 €".
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
function eLunedi(iso) { return nomeGiorno(iso) === 'Lunedì'; }
function fra(n) { return n === 0 ? 'oggi' : n === 1 ? 'domani' : 'fra ' + n + ' giorni'; }
function plurale(n, uno, tanti) { return n + ' ' + (n === 1 ? uno : tanti); }

// ===========================================================================
// IL CAPPELLO SCRITTO DALL'AI
// ⛔ SE L'AI NON RISPONDE, L'EMAIL PARTE LO STESSO, senza il cappello.
//    Un avviso che non arriva e' molto peggio di un avviso senza commento.
//    Percio' qui non si lancia mai un errore, e il tetto del tempo e' CORTO.
// ⛔ E NON INVENTA NUMERI: si passano solo i numeri gia' calcolati qui sopra.
//    I conti li fa il gestionale, lui li racconta.
// ===========================================================================
const AI_MODELLO = 'claude-sonnet-4-5';
const AI_TEMPO   = 9000;

// Funzione pura: il banco la legge senza chiamare nessuno.
function cosaDire(d) {
  const r = [];
  r.push('Oggi e\' ' + nomeGiorno(d.oggi) + ' ' + dataIt(d.oggi) + '.');
  r.push('Chi legge fa questo mestiere: ' + (d.pro ? 'studio tecnico' : 'impresa o artigiano') + '.');
  r.push(d.completo
    ? 'E\' il quadro completo del lunedi\': dentro ci sono anche le cose vecchie.'
    : 'E\' un avviso in mezzo alla settimana: dentro ci sono SOLO le cose cambiate oggi.');
  r.push('');

  /* I suoi promemoria per primi: quello che l'AI legge per primo e' quello di
     cui parla per primo, e questi se li e' scritti lui di sua mano. */
  /* ⛔ 15 settembre 2026 — LA DATA VA ETICHETTATA, SE NO L'AI LA SCAMBIA.
     Prima qui usciva «- il mio promemoria | oggi alle 07:30». L'AI ha letto
     quell'«oggi alle 07:30» come il momento in cui lui l'aveva SCRITTO, e ha
     aperto l'email con «Oggi alle 07:30 hai messo un promemoria di prova».
     Invece era la data in cui la cosa VA FATTA, e lui l'aveva scritto il
     giorno prima. Adesso ogni data porta la sua etichetta, e c'e' anche la
     data in cui l'ha scritto: cosi' non c'e' piu' niente da indovinare.
     ⚠️ Vale in generale: un elenco per l'AI non deve avere date senza nome. */
  r.push('PROMEMORIA CHE SI E\' SCRITTO LUI, DA DIRGLI OGGI: ' + (d.promemoria || []).length);
  (d.promemoria || []).forEach(function (x) {
    r.push('- ' + (x.testo || 'senza testo')
      + ' | da fare: ' + (x.giorni < 0 ? 'era il ' + dataIt(x.data)
               : x.giorni === 0 ? 'oggi' : x.giorni === 1 ? 'domani' : 'il ' + dataIt(x.data))
      + (x.ora ? ' alle ' + String(x.ora).slice(0, 5) : '')
      + (x.created_at ? ' | se l\'e\' scritto il ' + dataIt(x.created_at) : '')
      + (x.note ? ' | nota sua: ' + x.note : ''));
  });
  r.push('');

  r.push('APPENA SCADUTE: ' + d.appenaScadute.length);
  d.appenaScadute.forEach(x => r.push('- ' + (x.titolo || 'senza titolo') + ' | era il ' + dataIt(x.data_scadenza)));
  r.push('');

  r.push('SCADENZE IN ARRIVO: ' + d.inArrivo.length);
  d.inArrivo.forEach(x => r.push('- ' + (x.titolo || 'senza titolo')
    + ' | ' + nomeGiorno(x.data_scadenza) + ' ' + dataIt(x.data_scadenza) + ' | ' + fra(x.giorni)));
  r.push('');

  r.push('RICHIESTE DAL SITO MAI APERTE: ' + d.richieste.length);
  d.richieste.forEach(x => r.push('- ' + (x.nome || 'un cliente')
    + (x.lavoro ? ' | ' + x.lavoro : '') + (x.citta ? ' | ' + x.citta : '')));

  if (!d.completo) return r.join('\n');

  r.push('');
  r.push('SUOI PROMEMORIA GIA\' PASSATI E ANCORA DA FARE: ' + (d.promPassati || []).length);
  (d.promPassati || []).forEach(x => r.push('- ' + (x.testo || 'senza testo')
    + ' | da fare: era il ' + dataIt(x.data) + (x.ora ? ' alle ' + String(x.ora).slice(0, 5) : '')
    + (x.created_at ? ' | se l\'e\' scritto il ' + dataIt(x.created_at) : '')));
  r.push('');
  r.push('SCADENZE GIA\' PASSATE E ANCORA APERTE: ' + d.scadute.length);
  d.scadute.forEach(x => r.push('- ' + (x.titolo || 'senza titolo')
    + ' | era il ' + dataIt(x.data_scadenza)
    + ' | scaduta da ' + plurale(-x.giorni, 'giorno', 'giorni')));
  r.push('');

  r.push('FATTURE EMESSE E NON PAGATE: ' + d.fatture.length);
  d.fatture.forEach(x => r.push('- fattura ' + (x.numero || 'senza numero')
    + (x.cliente ? ' | ' + x.cliente : '') + ' | ' + euro(x.totale)
    + ' | in ritardo di ' + plurale(x.giorniRitardo, 'giorno', 'giorni')));
  if (d.fatture.length) r.push('In tutto devono avere: ' + euro(d.totaleScaduto));
  r.push('');

  r.push((d.pro ? 'PRATICHE' : 'LAVORI') + ' CON LA DATA GIA\' PASSATA: ' + d.lavori.length);
  d.lavori.forEach(x => r.push('- ' + (x.titolo || 'senza titolo')
    + (x.cliente ? ' | ' + x.cliente : '')
    + ' | doveva finire il ' + dataIt(x.data_prevista)
    + ' | ' + plurale(x.giorniRitardo, 'giorno fa', 'giorni fa')));

  return r.join('\n');
}

function istruzioni(completo) {
  return [
    'Scrivi il cappello dell\'email del mattino del gestionale TrovaImpresa. Chi la legge è un artigiano o un\'impresa edile, e la apre dal telefono, in piedi, prima di uscire.',
    '',
    'Scrivi da TRE a CINQUE righe, non di più. Italiano semplice e concreto, come un collega che ti dice da dove cominciare.',
    'Dì COSA GUARDARE PER PRIMO e PERCHÉ. Sotto queste righe c\'è già l\'elenco completo di tutto: non rifarlo.',
    completo
      ? 'Oggi è lunedì: c\'è dentro anche la roba vecchia. Comincia comunque dalla cosa che costa di più se la si lascia lì.'
      : 'Non è lunedì: si scrive solo perché oggi è cambiato qualcosa. Dì subito qual è quella cosa.',
    '',
    '⛔ Usa SOLO i numeri, le date e i nomi che ti do qui sotto. Non inventarne altri, non stimare e non fare somme che non ti ho già dato: i conti li ha fatti il gestionale.',
    '⛔ Ogni data qui sotto dice a cosa serve. «da fare: oggi alle 07:30» è QUANDO LA COSA VA FATTA, non quando lui l\'ha scritta. Non dire mai quando ha scritto un promemoria, a meno che non ti serva davvero e allora usa «se l\'è scritto il ...».',
    'Scrivi i soldi come te li do, all\'italiana: 8.000,00 €.',
    '',
    'NON scrivere: saluti, firme, titoli, elenchi puntati, e niente frasi di incoraggiamento. Comincia dalla cosa più importante.',
    'NON dare consigli su tasse, aliquote, norme di sicurezza o contratti: non è il posto.',
    'Non dire che sei un\'intelligenza artificiale e non parlare di te.'
  ].join('\n');
}

// Ritorna il testo, oppure null. NON lancia mai.
async function frasiDelGiorno(d) {
  const chiave = process.env.ANTHROPIC_API_KEY;
  if (!chiave) return null;
  let scaduta;
  try {
    const controllore = new AbortController();
    scaduta = setTimeout(() => controllore.abort(), AI_TEMPO);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controllore.signal,
      headers: { 'Content-Type': 'application/json', 'x-api-key': chiave,
                 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: AI_MODELLO, max_tokens: 400,
        system: istruzioni(d.completo),
        messages: [{ role: 'user', content: cosaDire(d) }]
      })
    });
    if (!res.ok) { console.error('[mattina] AI HTTP ' + res.status); return null; }
    const b = await res.json();
    const testo = (b.content || []).filter(x => x.type === 'text')
      .map(x => x.text).join('\n').trim();
    return testo || null;
  } catch (e) {
    console.error('[mattina] AI:', (e && e.message) || e);
    return null;
  } finally { clearTimeout(scaduta); }
}

// ---------------------------------------------------------------------------
// L'email. Testo grande e righe distanziate: si legge dal telefono, in piedi.
// ---------------------------------------------------------------------------
/* bottone = null vuol dire «sezione senza pulsante». Serve per le tre sezioni
   delle scadenze, che vanno tutte e tre nello stesso posto: il lunedi'
   uscivano tre «Apri lo scadenzario» nella stessa email, uno sotto l'altro.
   Tre pulsanti uguali non sono tre scelte, sono rumore: adesso il pulsante
   sta solo sotto l'ultima delle tre. */
function sezione(colore, titolo, righe, bottone, link, coda) {
  if (!righe.length) return '';   // sezione vuota = sezione che sparisce
  return `
  <div style="padding:18px 26px 6px">
    <div style="font-size:19px;font-weight:800;color:#0a2a4d;border-left:5px solid ${colore};padding-left:12px;line-height:1.4">${titolo}</div>
  </div>
  <div style="padding:6px 26px">
    <table style="width:100%;border-collapse:collapse">${righe.join('')}</table>
    ${coda || ''}
    ${bottone ? `<div style="margin:16px 0 22px">
      <a href="${link}" style="display:inline-block;background:#0066ff;color:#ffffff;padding:13px 24px;border-radius:9px;font-size:16px;font-weight:700;text-decoration:none">${bottone} &rarr;</a>
    </div>` : '<div style="height:10px"></div>'}
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
      Claude — e' la stessa regola di mdInline in js/ai-integrazione.js. */
function cappelloHTML(d) {
  if (!d.cappello) {
    const fisso = d.completo
      ? 'Buongiorno. Ecco cosa ti aspetta questa settimana, preso dal tuo gestionale.'
      : 'Buongiorno. Ti scrivo perché stamattina è cambiato qualcosa nel tuo gestionale.';
    return `<div style="padding:26px 26px 8px">
    <p style="font-size:17px;line-height:1.7;margin:0">${fisso}</p>
  </div>`;
  }
  return `<div style="padding:26px 26px 6px">
    <div style="background:#f2f7ff;border-left:5px solid #0066ff;border-radius:10px;padding:18px 20px;font-size:17px;line-height:1.7;color:#22303f">${esc(d.cappello).replace(/\n+/g, '<br>')}</div>
  </div>`;
}

function costruisciEmail(d) {
  const parole = d.pro
    ? { lavori: 'Pratiche in ritardo', apri: 'Apri le pratiche' }
    : { lavori: 'Lavori in ritardo',   apri: 'Apri i lavori' };

  /* I promemoria che ha scritto lui. L'ora sta DENTRO la riga, non decide
     l'orario dell'email: si scrive «oggi alle 15:00» perche' l'email parte
     comunque la mattina. */
  const conOra = p => {
    const o = p.ora ? String(p.ora).slice(0, 5) : '';
    const g = p.giorni < 0 ? 'era il ' + dataIt(p.data)
            : p.giorni === 0 ? 'oggi'
            : p.giorni === 1 ? 'domani'
            : nomeGiorno(p.data) + ' ' + dataIt(p.data);
    return g + (o ? ' alle ' + o : '');
  };
  const rProm = (d.promemoria || []).map(p => riga(
    p.testo || 'Promemoria', p.note || '',
    conOra(p), p.giorni <= 0 ? '#c62828' : p.giorni <= 3 ? '#e65100' : '#0066ff'));

  const rPromVecchi = (d.promPassati || []).map(p => riga(
    p.testo || 'Promemoria', p.note || '',
    conOra(p) + ' — ancora da fare', '#c62828'));

  const rAppena = d.appenaScadute.map(s => riga(
    s.titolo || 'Scadenza', s.tipo_pratica || s.reparto || '',
    'Era ieri, ' + dataIt(s.data_scadenza) + ' — ancora aperta', '#c62828'));

  const rArrivo = d.inArrivo.map(s => riga(
    s.titolo || 'Scadenza', s.tipo_pratica || s.reparto || '',
    nomeGiorno(s.data_scadenza) + ' ' + dataIt(s.data_scadenza).slice(0, 5) + ' — ' + fra(s.giorni),
    s.giorni <= 1 ? '#c62828' : s.giorni <= 7 ? '#e65100' : '#0066ff'));

  const rRich = d.richieste.map(r => riga(
    r.nome || 'Un cliente',
    [r.lavoro, r.citta].filter(Boolean).join(' — '),
    'Ti ha scritto e non l\'hai ancora aperta', '#e65100'));

  const rVecchie = d.scadute.map(s => riga(
    s.titolo || 'Scadenza', s.tipo_pratica || s.reparto || '',
    'Era il ' + dataIt(s.data_scadenza) + ' — scaduta da ' + plurale(-s.giorni, 'giorno', 'giorni'),
    '#c62828'));

  const rFatt = d.fatture.map(f => riga(
    'Fattura ' + (f.numero || '—') + (f.cliente ? ' — ' + f.cliente : ''), '',
    euro(f.totale) + ' &middot; scaduta da ' + plurale(f.giorniRitardo, 'giorno', 'giorni'),
    '#c62828'));

  const rLav = d.lavori.map(l => riga(
    l.titolo || 'Senza titolo', l.cliente || '',
    'Doveva essere finit' + (d.pro ? 'a' : 'o') + ' il ' + dataIt(l.data_prevista)
      + ' — ' + plurale(l.giorniRitardo, 'giorno fa', 'giorni fa'),
    '#e65100'));

  /* quale delle tre sezioni delle scadenze si porta il pulsante: l'ultima che
     esiste davvero, cosi' il pulsante sta sempre in fondo al gruppo */
  const ultimaScad = rVecchie.length ? 'vecchie' : rArrivo.length ? 'arrivo'
                   : rAppena.length  ? 'appena'  : null;
  // stessa cosa per i due riquadri dei promemoria: un pulsante solo, in fondo
  const ultimoProm = rPromVecchi.length ? 'vecchi' : rProm.length ? 'oggi' : null;

  const codaFatt = d.fatture.length
    ? `<div style="background:#fdf0f0;border-radius:10px;padding:14px 16px;margin-top:16px;font-size:17px;font-weight:800;color:#0a2a4d">In tutto ti devono ${euro(d.totaleScaduto)}</div>`
    : '';

  const titolo = d.completo ? 'La tua settimana' : 'Guarda questo';

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;color:#22303f;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dfe5ee">
  <div style="text-align:center;padding:16px 0 20px">
    <a href="https://trovaimpresa.com" style="text-decoration:none">
      <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
           style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
    </a>
  </div>
  <div style="background:linear-gradient(135deg,#0a2a4d,#0066ff);padding:30px 26px">
    <div style="color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;margin:0">${titolo}</div>
    <div style="color:#c9dcff;font-size:16px;margin-top:8px">${esc(nomeGiorno(d.oggi) + ' ' + dataIt(d.oggi))}${d.azienda ? ' &middot; ' + esc(d.azienda) : ''}</div>
  </div>
  ${cappelloHTML(d)}
  ${sezione('#0066ff', 'Te lo eri segnato', rProm, ultimoProm === 'oggi' ? 'Apri i promemoria' : null, SITO + '#promemoria')}
  ${sezione('#c62828', 'Promemoria ancora da fare', rPromVecchi, ultimoProm === 'vecchi' ? 'Apri i promemoria' : null, SITO + '#promemoria')}
  ${sezione('#c62828', 'Scaduta ieri', rAppena, ultimaScad === 'appena' ? 'Apri lo scadenzario' : null, SITO + '#scadenzario')}
  ${sezione('#0066ff', 'Scadenze in arrivo', rArrivo, ultimaScad === 'arrivo' ? 'Apri lo scadenzario' : null, SITO + '#scadenzario')}
  ${sezione('#c62828', 'Scadenze già passate', rVecchie, ultimaScad === 'vecchie' ? 'Apri lo scadenzario' : null, SITO + '#scadenzario')}
  ${sezione('#e65100', 'Richieste che ti aspettano', rRich, 'Apri le richieste', SITO + '#dalsito')}
  ${sezione('#c62828', 'Non ti hanno ancora pagato', rFatt, 'Apri le fatture', SITO + '#fatture', codaFatt)}
  ${sezione('#e65100', parole.lavori, rLav, parole.apri, SITO + '#lavori')}
  <div style="padding:6px 26px 28px;border-top:1px solid #edf1f6;margin-top:6px">
    <p style="font-size:14px;color:#7a8798;line-height:1.7;margin:18px 0 0">
      ${d.completo
        ? 'È lunedì: questo è il quadro completo.'
        : 'Ti scrivo solo quando cambia qualcosa. Il quadro completo arriva il lunedì.'}
      Puoi spegnere queste email dai <b>Dati azienda</b> del gestionale.
    </p>
  </div>
</div>
<p style="text-align:center;font-size:13px;color:#9aa5b1;margin-top:14px;font-family:system-ui,sans-serif">
  TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#9aa5b1">trovaimpresa.com</a></p>`;
}

function oggetto(d) {
  const pezzi = [];
  /* i suoi promemoria per primi: se l'ha scritto lui di sua mano, e' la cosa
     che si aspetta di leggere nell'anteprima del telefono */
  if ((d.promemoria || []).length) pezzi.push(plurale(d.promemoria.length, 'promemoria', 'promemoria'));
  if (d.appenaScadute.length) pezzi.push(plurale(d.appenaScadute.length, 'scadenza passata ieri', 'scadenze passate ieri'));
  if (d.richieste.length)     pezzi.push(plurale(d.richieste.length, 'richiesta che ti aspetta', 'richieste che ti aspettano'));
  if (d.inArrivo.length)      pezzi.push(plurale(d.inArrivo.length, 'scadenza in arrivo', 'scadenze in arrivo'));
  if (d.completo) {
    if ((d.promPassati || []).length) pezzi.push(plurale(d.promPassati.length, 'promemoria da fare', 'promemoria da fare'));
    if (d.scadute.length) pezzi.push(plurale(d.scadute.length, 'scadenza già passata', 'scadenze già passate'));
    if (d.fatture.length) pezzi.push(plurale(d.fatture.length, 'fattura scaduta', 'fatture scadute'));
    if (d.lavori.length)  pezzi.push(plurale(d.lavori.length,
      d.pro ? 'pratica in ritardo' : 'lavoro in ritardo',
      d.pro ? 'pratiche in ritardo' : 'lavori in ritardo'));
  }
  return (d.completo ? 'La tua settimana — ' : 'TrovaImpresa — ') + pezzi.join(', ');
}

// ---------------------------------------------------------------------------
const handler = async function () {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY)               return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
  if (!process.env.RESEND_API_KEY) return { statusCode: 500, body: 'RESEND_API_KEY non configurata' };

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const oggi     = oggiISO();
  const ieri     = giorniDopo(oggi, -1);
  const fra7     = giorniDopo(oggi, 7);
  const completo = eLunedi(oggi);

  try {
    /* -----------------------------------------------------------------------
       1. CHI PUO' RICEVERE. 14 set 2026: l'elenco NON parte piu' da
          gest_azienda. Quella riga esiste solo per chi ha aperto «Dati
          azienda» — erano 3 persone su 132, e le richieste dal sito prima
          arrivavano a TUTTE le imprese premium. Partire da gest_azienda
          avrebbe spento quell'email a 129 persone senza dirlo a nessuno.
          Adesso l'elenco e' chi ha il gestionale, come gia' faceva
          promemoria-dalsito.js; gest_azienda serve solo per l'interruttore,
          il nome e i giorni di pagamento.
       ----------------------------------------------------------------------- */
    const qImp = await sb.from('imprese')
      .select('id, user_id, tipo, nome_attivita, piano, premium_scadenza');
    if (qImp.error) throw qImp.error;

    const haGestionale = i => {
      if (!i.user_id) return false;
      if (String(i.piano || '').trim().toLowerCase() !== 'premium') return false;
      if (i.premium_scadenza) {
        const s = new Date(i.premium_scadenza);
        if (!isNaN(s.getTime()) && s.getTime() < Date.now()) return false;
      }
      return true;
    };
    const imprese = (qImp.data || []).filter(haGestionale);
    if (!imprese.length) return { statusCode: 200, body: JSON.stringify({ ok: true, emailInviate: 0 }) };

    const utenti = imprese.map(i => i.user_id);

    /* L'interruttore. Chi non ha la riga gest_azienda e' acceso: non ha mai
       detto di no. Se la colonna non esistesse (migrazione non fatta) si tira
       dritto e si considerano tutti accesi, invece di non mandare niente. */
    let colonnaInterruttore = true;
    let az = [];
    {
      const r = await sb.from('gest_azienda')
        .select('user_id, nome, giorni_pagamento, riepilogo_lunedi').in('user_id', utenti);
      if (r.error && /riepilogo_lunedi/.test(r.error.message || '')) {
        colonnaInterruttore = false;
        const r2 = await sb.from('gest_azienda')
          .select('user_id, nome, giorni_pagamento').in('user_id', utenti);
        if (r2.error) throw r2.error;
        az = r2.data || [];
      } else if (r.error) { throw r.error; }
      else { az = r.data || []; }
    }
    const azPerUte = Object.fromEntries(az.map(a => [String(a.user_id), a]));
    const spento = uid => {
      const a = azPerUte[String(uid)];
      return colonnaInterruttore && a && a.riepilogo_lunedi === false;
    };

    /* -----------------------------------------------------------------------
       2. I DATI, in poche letture invece di una manciata per persona
       -----------------------------------------------------------------------
       IL CESTINO. Cancellare vuol dire "scrivi la data in eliminato_il": la
       riga resta nel database. Il gestionale la nasconde da solo, ma qui si
       legge da fuori, senza quel filtro. Senza questa precauzione arriverebbe
       l'elenco delle fatture non pagate CON DENTRO quelle gia' buttate. */
    const senzaCestino = async (costruisci) => {
      const r = await costruisci(true);
      if (r.error && /eliminato_il/.test(r.error.message || '')) return costruisci(false);
      return r;
    };
    const vivi = (q, filtra) => filtra ? q.is('eliminato_il', null) : q;

    // le tre date delle tappe + ieri: una lettura sola per tutte e quattro
    const dateTappa = TAPPE.map(t => giorniDopo(oggi, t.giorni));
    const tappaPerData = {};
    TAPPE.forEach((t, i) => { tappaPerData[dateTappa[i]] = t; });

    /* I PROMEMORIA SUOI (tabella `promemoria`, sezione del gestionale dal
       14 set 2026). Si legge fino a 30 giorni avanti perche' il massimo che si
       puo' chiedere e' «avvisami 30 giorni prima»: piu' in la' di cosi' non
       c'e' niente da mandare oggi.
       ⛔ `inviato` e' il registro di questi: si scrive DOPO l'invio, come per
          le scadenze. Un promemoria avvisato ieri non torna oggi. */
    const fra30 = giorniDopo(oggi, 30);

    const [qScad, qCli, qMest, qProm] = await Promise.all([
      /* Tutte le scadenze aperte che ci servono oggi: quelle delle tappe,
         quella di ieri, e — solo il lunedi' — tutte le passate piu' la
         settimana davanti. Si legge largo una volta e si divide dopo. */
      senzaCestino(f => vivi(sb.from('gest_scadenze')
        .select('id, user_id, mestiere_id, titolo, tipo_pratica, data_scadenza, stato, avvisa, avvisi')
        .in('user_id', utenti).lte('data_scadenza', fra7).neq('stato', 'fatta'), f)),
      sb.from('gest_clienti').select('id, user_id, nome').in('user_id', utenti),
      senzaCestino(f => vivi(sb.from('gest_mestieri').select('id, nome').in('user_id', utenti), f)),
      senzaCestino(f => vivi(sb.from('promemoria')
        .select('id, user_id, testo, note, data, ora, avvisa_giorni, ripeti_mesi, stato, inviato, created_at')
        .in('user_id', utenti).lte('data', fra30).neq('stato', 'fatto'), f))
    ]);
    for (const q of [qScad, qCli, qMest, qProm]) if (q.error) throw q.error;

    // il lunedi' servono anche i soldi e i lavori: negli altri giorni non si
    // leggono nemmeno, perche' nell'email non ci entrerebbero comunque
    let qFatt = { data: [] }, qLav = { data: [] }, totali = {};
    if (completo) {
      const r = await Promise.all([
        senzaCestino(f => vivi(sb.from('gest_fatture')
          .select('id, user_id, numero, data, stato, cliente_id')
          .in('user_id', utenti).eq('stato', 'emessa'), f)),
        senzaCestino(f => vivi(sb.from('gest_lavori')
          .select('user_id, descrizione, stato, data_prevista, cliente_id')
          .in('user_id', utenti).neq('stato', 'fatto').lt('data_prevista', oggi), f))
      ]);
      qFatt = r[0]; qLav = r[1];
      for (const q of [qFatt, qLav]) if (q.error) throw q.error;

      /* ⛔ IL TOTALE NON SI RIFA' QUI. La formula dei soldi (imponibile, IVA,
         sconto, bollo, ritenuta, cassa, spese) sta in un posto solo: la vista
         gest_fatture_totali, che chiama gest_fattura_conti().
         ⚠️ La vista porta gia' il SEGNO: una nota di credito toglie soldi. */
      const idFatture = (qFatt.data || []).map(f => f.id);
      if (idFatture.length) {
        const q = await sb.from('gest_fatture_totali').select('fattura_id, totale')
                          .in('fattura_id', idFatture);
        if (q.error) throw q.error;
        (q.data || []).forEach(t => { totali[String(t.fattura_id)] = +t.totale || 0; });
      }
    }

    /* -----------------------------------------------------------------------
       3. LE RICHIESTE DAL SITO — la parte che arrivava da promemoria-dalsito.js
       ----------------------------------------------------------------------- */
    const ora      = Date.now();
    const daQuando = new Date(ora - GIORNI_MAX_RICHIESTA * 24 * 3600e3).toISOString();
    const finoA    = new Date(ora - ORE_MINIME_RICHIESTA * 3600e3).toISOString();
    const impresaDiUtente = Object.fromEntries(imprese.map(i => [String(i.id), String(i.user_id)]));

    let richiestePerUte = {};
    {
      const qPrev = await sb.from('preventivi')
        .select('id, impresa_id, nome, citta, categoria_lavoro, tipo_lavoro, created_at')
        .in('impresa_id', imprese.map(i => i.id))
        .gte('created_at', daQuando).lte('created_at', finoA)
        .order('created_at', { ascending: false }).limit(500);
      if (qPrev.error) throw qPrev.error;
      const prev = qPrev.data || [];
      if (prev.length) {
        const ids = prev.map(p => p.id);
        const [qGia, qAperte] = await Promise.all([
          sb.from('gest_dalsito_avvisi').select('preventivo_id').in('preventivo_id', ids),
          sb.from('gest_dalsito').select('preventivo_id').in('preventivo_id', ids)
        ]);
        if (qGia.error) throw qGia.error;
        if (qAperte.error) throw qAperte.error;
        const giaSet    = new Set((qGia.data || []).map(x => String(x.preventivo_id)));
        const aperteSet = new Set((qAperte.data || []).map(x => String(x.preventivo_id)));
        prev.filter(p => !giaSet.has(String(p.id)) && !aperteSet.has(String(p.id)))
            .forEach(p => {
              const uid = impresaDiUtente[String(p.impresa_id)];
              if (!uid) return;
              (richiestePerUte[uid] = richiestePerUte[uid] || []).push({
                id: p.id, nome: p.nome,
                lavoro: p.categoria_lavoro || p.tipo_lavoro || 'Richiesta di preventivo',
                citta: p.citta
              });
            });
      }
    }

    const nomeCli  = Object.fromEntries((qCli.data  || []).map(c => [String(c.id), c.nome || '']));
    const nomeMest = Object.fromEntries((qMest.data || []).map(m => [String(m.id), m.nome || '']));

    /* -----------------------------------------------------------------------
       4. Una busta per persona
       ----------------------------------------------------------------------- */
    let inviate = 0, niente = 0, giaOggi = 0, senzaEmail = 0, conCappello = 0;
    let senzaRegistro = false;
    const errori = [];

    for (const imp of imprese) {
      const uid = String(imp.user_id);
      if (spento(uid)) { niente++; continue; }

      const a     = azPerUte[uid] || {};
      const ggPag = (+a.giorni_pagamento) || 30;
      const pro   = imp.tipo === 'professionista';

      const mie = (qScad.data || []).filter(s => String(s.user_id) === uid && s.data_scadenza)
        .map(s => ({ ...s, giorni: quantiGiorni(oggi, s.data_scadenza),
                     reparto: nomeMest[String(s.mestiere_id)] || '',
                     gia: String(s.avvisi || '').split(',').filter(Boolean) }));

      /* LE COSE CAMBIATE OGGI — sono queste tre che possono interrompere. */

      // a) la scadenza che taglia oggi il traguardo dei 30, 7 o 1 giorno
      const inArrivo = mie.filter(s => s.avvisa !== false
        && tappaPerData[s.data_scadenza]
        && !s.gia.includes(String(tappaPerData[s.data_scadenza].giorni)));

      // b) la scadenza che era ieri ed e' ancora aperta
      const appenaScadute = mie.filter(s => s.avvisa !== false
        && s.data_scadenza === ieri && !s.gia.includes(SEGNO_SCADUTA));

      // c) la richiesta dal sito ferma da piu' di 24 ore
      const richieste = richiestePerUte[uid] || [];

      /* d) il promemoria che ha scritto lui, arrivato al suo giorno di avviso.
         Il giorno dell'avviso e' `data` meno `avvisa_giorni`: chi ha chiesto
         «7 giorni prima» lo riceve una settimana avanti. Si usa `<=` e non
         `===` apposta: se l'email di quel giorno non e' partita (Resend giu',
         function caduta) domani parte lo stesso, invece di saltare il giro e
         lasciarlo senza avviso per sempre. A non ripeterlo ci pensa
         `inviato`. */
      const miei = (qProm.data || []).filter(x => String(x.user_id) === uid && x.data);
      const promemoria = miei
        .filter(x => !x.inviato && giorniDopo(x.data, -(+x.avvisa_giorni || 0)) <= oggi)
        .map(x => ({ ...x, giorni: quantiGiorni(oggi, x.data) }))
        .sort((a, b) => a.giorni - b.giorni);

      const cambiato = inArrivo.length + appenaScadute.length + richieste.length + promemoria.length;

      /* IL QUADRO COMPLETO — solo il lunedi'. Sono le cose vecchie: non
         interrompono mai in settimana, ma il lunedi' vanno viste. */
      const scadute = completo
        ? mie.filter(s => s.giorni < 0).sort((x, y) => x.giorni - y.giorni)
        : [];
      const fatture = completo
        ? (qFatt.data || [])
            .filter(f => String(f.user_id) === uid && f.data && giorniDopo(f.data, ggPag) < oggi)
            .map(f => ({ numero: f.numero, cliente: nomeCli[String(f.cliente_id)] || '',
                         totale: totali[String(f.id)] || 0,
                         giorniRitardo: quantiGiorni(giorniDopo(f.data, ggPag), oggi) }))
            .sort((x, y) => y.giorniRitardo - x.giorniRitardo)
        : [];
      const lavori = completo
        ? (qLav.data || [])
            .filter(l => String(l.user_id) === uid && l.data_prevista)
            .map(l => ({ titolo: l.descrizione, cliente: nomeCli[String(l.cliente_id)] || '',
                         data_prevista: l.data_prevista,
                         giorniRitardo: quantiGiorni(l.data_prevista, oggi) }))
            .sort((x, y) => y.giorniRitardo - x.giorniRitardo)
        : [];

      /* il lunedi' si vedono anche i promemoria gia' passati e ancora aperti,
         pure quelli gia' avvisati: e' il quadro completo, non un avviso nuovo */
      const promPassati = completo
        ? miei.filter(x => x.data < oggi && !promemoria.some(p => String(p.id) === String(x.id)))
              .map(x => ({ ...x, giorni: quantiGiorni(oggi, x.data) }))
              .sort((a, b) => a.giorni - b.giorni)
        : [];

      const vecchio = scadute.length + fatture.length + lavori.length + promPassati.length;

      /* ⛔ LA REGOLA, IN UNA RIGA SOLA.
         In settimana si scrive solo se e' cambiato qualcosa. Il lunedi' basta
         che ci sia qualcosa da dire, vecchio o nuovo. Se non c'e' niente non
         parte niente: il silenzio e' un'informazione. */
      if (!(completo ? (cambiato + vecchio) : cambiato)) { niente++; continue; }

      let email = null;
      try {
        const { data: u } = await sb.auth.admin.getUserById(uid);
        email = u && u.user ? u.user.email : null;
      } catch (e) { errori.push('getUserById ' + uid + ': ' + e.message); }
      if (!email) { senzaEmail++; continue; }

      /* ⛔ PALETTO 1 — AL MASSIMO UNA EMAIL AL GIORNO.
         Si prende il posto PRIMA di chiamare l'AI e prima di mandare: se una
         scheduled function di Netlify non finisce in tempo viene rilanciata, e
         il secondo giro rifarebbe tutto da capo. E' successo davvero il 14 set
         2026 col vecchio riepilogo-lunedi.js: due email identiche a 52 secondi
         una dall'altra.
         ⚠️ Se l'invio poi fallisce la riga viene TOLTA, cosi' domani si
            riprova. */
      {
        const segno = await sb.from('gest_promemoria_inviati')
          .insert({ user_id: uid, giorno: oggi }).select('user_id');
        if (segno.error) {
          if (segno.error.code === '23505') { giaOggi++; continue; }
          if (/42P01|does not exist/.test(segno.error.code + ' ' + (segno.error.message || ''))) {
            senzaRegistro = true;
          } else { errori.push('registro ' + email + ': ' + segno.error.message); continue; }
        }
      }

      const d = {
        oggi, completo, pro,
        azienda: a.nome || imp.nome_attivita || '',
        appenaScadute, inArrivo, richieste, promemoria, promPassati,
        scadute, fatture, lavori,
        totaleScaduto: fatture.reduce((s, f) => s + f.totale, 0),
        cappello: null
      };

      if (String(email).trim().toLowerCase() === CAPPELLO_AI_SOLO_A) {
        d.cappello = await frasiDelGiorno(d);
        if (d.cappello) conCappello++;
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TrovaImpresa <info@trovaimpresa.com>',
          to: [email], subject: oggetto(d), html: costruisciEmail(d)
        })
      });
      if (!res.ok) {
        errori.push('Resend ' + email + ': ' + (await res.text()));
        await sb.from('gest_promemoria_inviati').delete()
          .eq('user_id', uid).eq('giorno', oggi);
        continue;
      }
      inviate++;

      /* ⛔ PALETTO 2 — LA STESSA COSA NON SI RIPETE.
         Si segna DOPO che l'email e' partita davvero, e nei registri VECCHI:
         gest_scadenze.avvisi e gest_dalsito_avvisi. Sono quelli che usavano
         promemoria-scadenze.js e promemoria-dalsito.js, percio' chi e' gia'
         stato avvisato da loro ieri non viene riavvisato da qui oggi. */
      for (const s of inArrivo) {
        const nuovo = s.gia.concat(String(tappaPerData[s.data_scadenza].giorni)).join(',');
        const e2 = await sb.from('gest_scadenze').update({ avvisi: nuovo }).eq('id', s.id);
        if (e2.error) errori.push('avvisi ' + s.id + ': ' + e2.error.message);
      }
      for (const s of appenaScadute) {
        const nuovo = s.gia.concat(SEGNO_SCADUTA).join(',');
        const e2 = await sb.from('gest_scadenze').update({ avvisi: nuovo }).eq('id', s.id);
        if (e2.error) errori.push('avvisi ' + s.id + ': ' + e2.error.message);
      }
      if (richieste.length) {
        const e3 = await sb.from('gest_dalsito_avvisi')
          .upsert(richieste.map(r => ({ preventivo_id: r.id })), { ignoreDuplicates: true });
        if (e3.error) errori.push('dalsito_avvisi: ' + e3.error.message);
      }
      /* il registro dei suoi promemoria e' la colonna `inviato`, che c'era gia'
         nella tabella dal primo giorno. ⚠️ La sezione la rimette a false ogni
         volta che si cambia la data o si riapre un promemoria: se no, spostare
         un F24 di un mese vorrebbe dire non essere piu' avvisati. */
      if (promemoria.length) {
        const e4 = await sb.from('promemoria').update({ inviato: true })
          .in('id', promemoria.map(p => p.id));
        if (e4.error) errori.push('promemoria inviato: ' + e4.error.message);
      }
    }

    return { statusCode: 200, body: JSON.stringify({
      ok: true, giorno: oggi, quadroCompleto: completo,
      emailInviate: inviate, conCappello, nienteDaDire: niente,
      giaMandataOggi: giaOggi, senzaEmail,
      registro: senzaRegistro ? 'TABELLA MANCANTE — rischio doppioni' : 'attivo',
      interruttore: colonnaInterruttore ? 'attivo' : 'colonna mancante, tutti accesi',
      errori
    }) };
  } catch (err) {
    console.error('promemoria-mattina:', err.message);
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};

// Ogni mattina alle 5:30 UTC = le 7:30 in Italia con l'ora legale (adesso).
// Da fine ottobre, con l'ora solare, diventerebbe le 6:30: quando cambia l'ora
// basta mettere '30 6 * * *' qui sotto e torna alle 7:30.
exports.handler = schedule('30 5 * * *', handler);

// Per provarla a mano senza aspettare domani mattina:
module.exports.eseguiOra = handler;

// per il banco: le parti pure si provano da sole, senza rete e senza database
module.exports.cosaDire = cosaDire;
module.exports.istruzioni = istruzioni;
module.exports.cappelloHTML = cappelloHTML;
module.exports.costruisciEmail = costruisciEmail;
module.exports.oggetto = oggetto;
module.exports.eLunedi = eLunedi;
