// =====================================================================
// SUBAPPALTI — L'EMAIL DI ABBINAMENTO (19 nov 2026, richiesta di Alex)
//
// Quando un annuncio di subappalto va online, lo diciamo alle imprese
// iscritte della stessa regione:
//   - «offre» (una squadra è disponibile)  → alle IMPRESE della regione,
//     cioè chi dà lavori in subappalto
//   - «cerca» (un'impresa cerca una squadra) → a imprese E artigiani
//     della regione, cioè chi può prendere il lavoro
//
// ⛔ Resend gratis: →100← email al giorno per TUTTO il sito (conferme
//    d'iscrizione comprese, e la coda programmata ne usa già →50←).
//    Quindi: al massimo PER_ANNUNCIO a ogni annuncio e TETTO_GIORNO in
//    tutto il giorno, contati nella tabella subappalti_avvisi.
// - Annunci senza una regione riconoscibile («Tutta Italia») NON mandano
//   niente: scriverebbero a tutti.
// - Saltati: chi si è tolto dalle email (email_promo = false), chi non ha
//   confermato l'email, le prove, e chi ha pubblicato l'annuncio.
// - Una stessa impresa riceve al massimo UN avviso al giorno.
// - In fondo c'è sempre il link per togliersi con un clic (niente-email).
// =====================================================================
const crypto = require('crypto');

const SITO = 'https://trovaimpresa.com';
const PER_ANNUNCIO = 10;
const TETTO_GIORNO = 20;

const REGIONI = [
  ['Lombardia', ['lombardia', 'milano', 'bergamo', 'brescia', 'como', 'cremona', 'lecco', 'lodi', 'mantova', 'monza', 'brianza', 'pavia', 'sondrio', 'varese']],
  ['Lazio', ['lazio', 'roma', 'rieti', 'latina', 'frosinone', 'viterbo']],
  ['Emilia-Romagna', ['emilia', 'romagna', 'bologna', 'modena', 'parma', 'reggio emilia', 'ferrara', 'ravenna', 'rimini', 'forli', 'forlì', 'piacenza']],
  ['Piemonte', ['piemonte', 'torino', 'alessandria', 'asti', 'biella', 'cuneo', 'novara', 'verbania', 'vercelli']],
  ['Campania', ['campania', 'napoli', 'salerno', 'caserta', 'avellino', 'benevento']],
  ['Toscana', ['toscana', 'firenze', 'pisa', 'livorno', 'arezzo', 'siena', 'lucca', 'prato', 'pistoia', 'grosseto', 'massa', 'carrara']],
  ['Sicilia', ['sicilia', 'palermo', 'catania', 'messina', 'siracusa', 'ragusa', 'trapani', 'agrigento', 'caltanissetta']],
  ['Veneto', ['veneto', 'venezia', 'verona', 'padova', 'vicenza', 'treviso', 'rovigo', 'belluno']],
  ['Puglia', ['puglia', 'bari', 'lecce', 'brindisi', 'taranto', 'foggia', 'barletta', 'andria']],
  ['Sardegna', ['sardegna', 'cagliari', 'sassari', 'nuoro', 'oristano', 'olbia']],
  ['Liguria', ['liguria', 'genova', 'savona', 'imperia', 'spezia']],
  ['Umbria', ['umbria', 'perugia', 'terni']],
  ['Calabria', ['calabria', 'reggio calabria', 'cosenza', 'catanzaro', 'crotone']],
  ['Abruzzo', ['abruzzo', "l'aquila", 'pescara', 'chieti', 'teramo']],
  ['Friuli-Venezia Giulia', ['friuli', 'trieste', 'udine', 'pordenone', 'gorizia']],
  ['Trentino-Alto Adige', ['trentino', 'alto adige', 'trento', 'bolzano']],
  ['Marche', ['marche', 'ancona', 'pesaro', 'macerata', 'ascoli']],
  ['Basilicata', ['basilicata', 'potenza', 'matera']],
  ['Molise', ['molise', 'campobasso', 'isernia']],
  ["Valle d'Aosta", ['valle d', 'aosta']]
];

/* Le regioni scritte nell'annuncio (campo regione + zona libera).
   Parola INTERA: «roma» non deve scattare dentro «Emilia-Romagna»,
   «como» non dentro «comodo». */
function regioniDi(a) {
  // 27 nov 2026: «Friuli-Venezia Giulia» contiene «venezia» e mandava le email anche al Veneto
  const testo = (' ' + [a.regione, a.citta].filter(Boolean).join(' ').toLowerCase() + ' ').replace(/friuli[\s-]*venezia[\s-]*giulia/g, ' friuli ');
  const trovate = [];
  for (const [nome, chiavi] of REGIONI) {
    if (chiavi.some(k => new RegExp('[^a-zàèéìòù]' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-zàèéìòù])').test(testo))) trovate.push(nome);
  }
  return trovate;
}

function codiceDisiscrizione(email) {
  return crypto.createHash('sha256')
    .update(String(email || '').trim().toLowerCase() + 'ti-niente-email-2026')
    .digest('hex');
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function parti(a) {
  const testo = String((a.tipo === 'cerca' ? (a.descrizione || a.lavoro) : (a.lavoro || a.descrizione)) || '').trim();
  const righe = testo.split('\n').map(r => r.trim()).filter(Boolean);
  let titolo = righe[0] || 'Lavori edili';
  if (titolo.length > 90) titolo = titolo.slice(0, Math.max(40, titolo.lastIndexOf(' ', 85))) + '…';
  let resto = righe.slice(1).join(' ');
  if (!resto && testo.length > titolo.length) resto = testo.slice(titolo.length - 1);
  if (resto.length > 170) resto = resto.slice(0, Math.max(60, resto.lastIndexOf(' ', 165))) + '…';
  return { titolo, resto };
}

function oggetto(a, regione) {
  const { titolo } = parti(a);
  const t = titolo.replace(/…$/, '').slice(0, 60);
  return a.tipo === 'cerca'
    ? `Lavoro in subappalto in ${regione}: ${t}`
    : `Squadra disponibile in ${regione}: ${t}`;
}

function htmlEmail(a, dest, regione) {
  const { titolo, resto } = parti(a);
  const cerca = a.tipo === 'cerca';
  const link = `${SITO}/subappalto-annuncio?id=${encodeURIComponent(a.id)}`;
  const titoloMail = cerca ? 'Cercano una squadra nella tua zona' : 'Una squadra è disponibile nella tua zona';
  const frase = cerca
    ? `un'impresa cerca chi faccia questo lavoro in subappalto in <strong>${esc(regione)}</strong>:`
    : `un'impresa ha appena dato disponibilità per lavori in subappalto in <strong>${esc(regione)}</strong>:`;
  const altro = cerca
    ? `Hai una squadra libera? <a href="${SITO}/subappalto-offre" style="color:#0066ff">Pubblica la tua disponibilità gratis</a>`
    : `Hai un lavoro da dare in subappalto? <a href="${SITO}/subappalto-cerca" style="color:#0066ff">Pubblicalo gratis</a>`;
  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f7fb">'
    + '<div style="max-width:600px;margin:0 auto;padding:28px 22px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">'
    + `<div style="text-align:center;padding:0 0 18px"><a href="${SITO}" style="text-decoration:none"><img src="${SITO}/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a></div>`
    + '<div style="background:#fff;border-radius:14px;padding:30px 28px">'
    + `<div style="font-size:23px;font-weight:800;color:#0a2a4d;margin:0 0 14px;line-height:1.3">${titoloMail}</div>`
    + `<p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#12233a">Ciao ${esc(dest.nome || 'e grazie di essere su TrovaImpresa')},<br>${frase}</p>`
    + '<div style="border:2px solid #dbe6f5;border-radius:12px;padding:18px 20px;margin:0 0 22px">'
    +   `<div style="font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:${cerca ? '#d35400' : '#0066ff'};margin:0 0 6px">${cerca ? 'Cerca subappaltatori' : 'Offre disponibilità'}</div>`
    +   `<div style="font-size:19px;font-weight:800;color:#0a2a4d;line-height:1.35;margin:0 0 8px">${esc(titolo)}</div>`
    +   (resto ? `<div style="font-size:15px;line-height:1.6;color:#4a5a70;margin:0 0 10px">${esc(resto)}</div>` : '')
    +   `<div style="font-size:15px;color:#12233a"><strong>${esc(a.nome_impresa || '')}</strong>${a.citta ? ' &middot; 📍 ' + esc(a.citta) : ''}</div>`
    + '</div>'
    + `<div style="text-align:center;margin:8px 0 22px"><a href="${link}" style="display:inline-block;background:#ff8800;color:#ffffff;font-size:18px;font-weight:800;text-decoration:none;padding:16px 30px;border-radius:12px">Vedi l'annuncio e i contatti</a></div>`
    + `<p style="margin:0;font-size:15px;line-height:1.6;color:#4a5a70;text-align:center">${altro}</p>`
    + '</div>'
    + '<div style="text-align:center;font-size:13px;color:#5b6b80;padding:18px 10px;line-height:1.6">'
    + 'TrovaImpresa &middot; Rieti (RI)<br>'
    + `Ricevi questa email perch&eacute; sei iscritto a TrovaImpresa in ${esc(regione)}<br>`
    + `<a href="${SITO}/niente-email?e=${encodeURIComponent(dest.email || '')}&c=${codiceDisiscrizione(dest.email)}" style="color:#5b6b80">Non vuoi pi&ugrave; ricevere queste email? Togliti con un clic</a>`
    + '</div></div></body></html>';
}

/* mezzanotte di oggi a Roma, in UTC */
function inizioGiornoRoma() {
  const ora = new Date();
  const roma = new Date(ora.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  const diff = roma.getTime() - ora.getTime();
  const mezzanotte = new Date(roma); mezzanotte.setHours(0, 0, 0, 0);
  return new Date(mezzanotte.getTime() - diff).toISOString();
}

/* Manda gli avvisi per un annuncio appena pubblicato.
   sb(path, opzioni) = la chiamata al database della funzione che ci usa.
   Restituisce { inviate, motivo } e non lancia mai: l'annuncio è già online. */
async function mandaAbbinamenti(a, { sb, resendKey, fetchFn = fetch }) {
  try {
    if (!resendKey) return { inviate: 0, motivo: 'senza chiave Resend' };
    const regioni = regioniDi(a);
    if (!regioni.length) return { inviate: 0, motivo: 'nessuna regione riconosciuta' };

    const da = inizioGiornoRoma();
    const giaAnnuncio = await sb(`subappalti_avvisi?subappalto_id=eq.${encodeURIComponent(a.id)}&select=id&limit=1`);
    if (giaAnnuncio.length) return { inviate: 0, motivo: 'già avvisati' };
    const oggi = await sb(`subappalti_avvisi?inviato_il=gte.${encodeURIComponent(da)}&select=impresa_id`);
    const posto = Math.min(PER_ANNUNCIO, TETTO_GIORNO - oggi.length);
    if (posto <= 0) return { inviate: 0, motivo: 'tetto del giorno pieno' };
    const avvisatiOggi = new Set(oggi.map(r => r.impresa_id));

    const tipi = a.tipo === 'cerca' ? '(impresa,artigiano)' : '(impresa)';
    const lista = regioni.map(r => '"' + r.replace(/"/g, '') + '"').join(',');
    const imprese = await sb(`imprese?tipo=in.${tipi}&regione=in.(${encodeURIComponent(lista)})`
      + `&email_confermata=eq.true&and=(or(email_promo.is.null,email_promo.eq.true),or(is_test.is.null,is_test.eq.false))`
      + `&select=id,nome_attivita,nome,email,user_id,regione&limit=500`);

    const mia = String(a.email || '').trim().toLowerCase();
    const viste = new Set();
    let candidati = imprese.filter(i => {
      const e = String(i.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) || viste.has(e)) return false;
      viste.add(e);
      if (e === mia) return false;
      if (a.user_id && i.user_id === a.user_id) return false;
      return !avvisatiOggi.has(i.id);
    });
    if (!candidati.length) return { inviate: 0, motivo: 'nessuna impresa nella regione' };

    /* A turno: prima chi ha ricevuto meno avvisi negli ultimi 30 giorni,
       così non scriviamo sempre alle stesse */
    const trenta = new Date(Date.now() - 30 * 864e5).toISOString();
    const ids = candidati.map(i => i.id).join(',');
    const storia = await sb(`subappalti_avvisi?impresa_id=in.(${ids})&inviato_il=gte.${encodeURIComponent(trenta)}&select=impresa_id`);
    const quanti = {};
    storia.forEach(r => { quanti[r.impresa_id] = (quanti[r.impresa_id] || 0) + 1; });
    candidati.forEach(i => { i._ord = (quanti[i.id] || 0) + Math.random() * 0.5; });
    candidati.sort((x, y) => x._ord - y._ord);
    candidati = candidati.slice(0, posto);

    const lotto = candidati.map(i => {
      const regione = regioni.includes(i.regione) ? i.regione : regioni[0];
      const dest = { nome: i.nome_attivita || i.nome || '', email: i.email.trim() };
      const togli = `${SITO}/niente-email?e=${encodeURIComponent(dest.email)}&c=${codiceDisiscrizione(dest.email)}`;
      return {
        from: 'TrovaImpresa <info@trovaimpresa.com>', to: [dest.email], reply_to: 'info@trovaimpresa.com',
        subject: oggetto(a, regione), html: htmlEmail(a, dest, regione),
        headers: { 'List-Unsubscribe': `<${togli}>` }
      };
    });
    const r = await fetchFn('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(lotto),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) { console.error('[abbinamento] Resend', r.status, await r.text()); return { inviate: 0, motivo: 'Resend ' + r.status }; }

    await sb('subappalti_avvisi', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(candidati.map(i => ({ subappalto_id: a.id, impresa_id: i.id, email: i.email.trim(), regione: regioni.includes(i.regione) ? i.regione : regioni[0] })))
    });
    return { inviate: candidati.length, regioni, nomi: candidati.map(i => i.nome_attivita || i.nome || i.email) };
  } catch (e) {
    console.error('[abbinamento]', e.message);
    return { inviate: 0, motivo: 'errore: ' + e.message };
  }
}

module.exports = { regioniDi, oggetto, htmlEmail, parti, mandaAbbinamenti, PER_ANNUNCIO, TETTO_GIORNO };
