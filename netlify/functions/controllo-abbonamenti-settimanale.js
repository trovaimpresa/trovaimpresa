// =====================================================================
// L'OROLOGIO DELLA RETE — 21 settembre 2026
//
// Ogni lunedi' mattina rifa' da solo il controllo del pannello
// («Controlla gli abbonamenti») e ti scrive SOLO SE HA TROVATO QUALCOSA.
//
// PERCHE' UN OROLOGIO E NON SOLO IL BOTTONE
// Il bottone c'e' e funziona, ma va schiacciato: e un controllo che
// dipende dal fatto che uno se lo ricordi, nei mesi normali non lo
// schiaccia nessuno. Lo scollamento fra Stripe e il database non fa
// rumore — il cliente paga e trova il muro, oppure tu regali un premium
// — e resta li' finche' qualcuno non guarda. Questo guarda al posto tuo.
//
// ⚠️ IL SILENZIO E' LA BUONA NOTIZIA. Se non arriva niente, vuol dire
// che soldi e permessi sono allineati. Niente email «va tutto bene»:
// tre di fila e la quarta non la apre piu' nessuno — e' la stessa
// regola del riepilogo del lunedi'.
//
// ⚠️ MA IL SILENZIO NON DEVE POTER VOLER DIRE «SI E' ROTTO». Per questo
// se il controllo NON RIESCE (Stripe non risponde, chiave mancante,
// database giu') l'email parte lo stesso e dice che non ha potuto
// controllare. Un guardiano che si addormenta senza avvisare e' peggio
// di nessun guardiano: ti lascia la sensazione di essere coperto.
//
// ⛔ NON TOCCA NIENTE, come il bottone: legge Stripe, legge il database,
// scrive un'email. Le riparazioni le fai tu a mano.
//
// IL CONFRONTO E' UNA COPIA SOLA e sta in
// netlify/functions/admin-controllo-abbonamenti.js (funzione
// `confronta`). Qui c'e' solo l'orologio e la busta.
//
// VUOLE SU NETLIFY: STRIPE_SECRET_KEY, SUPABASE_URL,
// SUPABASE_SERVICE_KEY, RESEND_API_KEY. Ci sono gia' tutte.
// =====================================================================

/* ⛔ DUE RIGHE, NON UNA: questa e `exports.handler = schedule(...)` in
   fondo. E vanno insieme: se importi `schedule` e poi non lo usi,
   Netlify si RIFIUTA di pubblicare il sito — «The schedule helper was
   imported but we couldn't find any usages». E' l'errore che il 14
   settembre ha fatto fallire due pubblicazioni di fila, con il push
   andato a buon fine tutte e due le volte e il sito online rimasto
   fermo a quello di prima. */
const { schedule } = require('@netlify/functions');

const { confronta } = require('./admin-controllo-abbonamenti.js');

// A chi arriva. Se un giorno cambi indirizzo, metti ADMIN_EMAIL su
// Netlify e non serve ripubblicare questo file.
const A_CHI = (process.env.ADMIN_EMAIL || 'pintoalessio@icloud.com').trim();

const NOMI_URL = ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
const NOMI_KEY = [
  'SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_KEY'
];

function trova(nomi) {
  for (const n of nomi) {
    const v = (process.env[n] || '').trim();
    if (v) return v;
  }
  return '';
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function inviaEmail(oggetto, html) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[controllo-settimanale] RESEND_API_KEY mancante: email non mandata');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'TrovaImpresa <info@trovaimpresa.com>',
      to: [A_CHI],
      subject: oggetto,
      html
    })
  });
  if (!res.ok) console.error('[controllo-settimanale] Resend:', await res.text());
  return res.ok;
}

// ---------------------------------------------------------------------
// LA BUSTA. Prima il guaio grosso (uno che paga e non ha niente): e' il
// solo che ha un cliente vero dall'altra parte che aspetta.
// ---------------------------------------------------------------------
function blocco(titolo, spiegazione, righe, colore) {
  if (!righe.length) return '';
  const elenco = righe.map(r => {
    const imp = r.impresa || {};
    const st = r.stripe || {};
    const chi = imp.nome ? esc(imp.nome) + ' — ' : '';
    const dettagli = [];
    if (imp.id) dettagli.push('riga nel sito n. ' + esc(imp.id));
    if (imp.piano) dettagli.push('piano: ' + esc(imp.piano));
    if (st.stato) dettagli.push('Stripe: ' + esc(st.stato));
    if (st.prodotto) dettagli.push('prodotto: ' + esc(st.prodotto));
    if (st.disdetto_a_fine_periodo) dettagli.push('ha già disdetto');
    return '<li style="margin:0 0 12px">'
      + '<b>' + chi + esc(r.email) + '</b><br>'
      + '<span style="color:#5b6b80">' + esc(r.perche) + '</span>'
      + (dettagli.length ? '<br><span style="color:#8a97a8;font-size:13px">' + dettagli.join(' &middot; ') + '</span>' : '')
      + '</li>';
  }).join('');

  return '<div style="border-left:4px solid ' + colore + ';padding:2px 0 2px 14px;margin:0 0 22px">'
    + '<h3 style="margin:0 0 4px;font-size:17px;color:#16263d">' + esc(titolo) + ' (' + righe.length + ')</h3>'
    + '<p style="margin:0 0 10px;color:#5b6b80;font-size:14px">' + spiegazione + '</p>'
    + '<ul style="margin:0;padding-left:18px;font-size:15px;color:#16263d">' + elenco + '</ul>'
    + '</div>';
}

function costruisciEmail(r) {
  return '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;padding:22px">'
    + '<h2 style="margin:0 0 6px;font-size:21px;color:#16263d">Soldi e permessi non sono allineati</h2>'
    + '<p style="margin:0 0 20px;color:#5b6b80;font-size:15px">'
    + 'Controllo automatico del lunedì. Su Stripe risultano <b>' + r.quanti.abbonamenti_vivi_su_stripe + '</b> abbonamenti vivi; '
    + 'nel sito risultano paganti <b>' + r.quanti.risultano_paganti_nel_sito + '</b> imprese. Ecco dove i due non tornano.'
    + '</p>'
    + blocco(
        'Paga e non ha niente',
        'Questi hanno pagato ma nel sito non risultano: aprono il gestionale e trovano il muro. <b>Da sistemare subito.</b>',
        r.paga_e_non_ha, '#c0392b')
    + blocco(
        'Ha e non paga',
        'Nel sito risultano paganti ma su Stripe non c’è nessun abbonamento vivo: non danneggia loro, costa a te. (I premium regalati non compaiono qui.)',
        r.ha_e_non_paga, '#c98a00')
    + '<p style="margin:24px 0 0;color:#5b6b80;font-size:14px">'
    + 'Il rapporto completo lo rivedi quando vuoi dal pannello, in <b>Chi usa il gestionale</b> &rarr; <b>Controlla gli abbonamenti</b>.'
    + '</p>'
    + '<p style="margin:14px 0 0;color:#8a97a8;font-size:13px">'
    + 'Se una settimana non arriva niente, vuol dire che andava tutto bene: scrivo solo quando trovo qualcosa.'
    + '</p>'
    + '</div>';
}

function emailGuasto(messaggio) {
  return '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;padding:22px">'
    + '<h2 style="margin:0 0 6px;font-size:21px;color:#16263d">Non sono riuscito a controllare gli abbonamenti</h2>'
    + '<p style="margin:0 0 16px;color:#5b6b80;font-size:15px">'
    + 'Il controllo automatico del lunedì non è riuscito a girare. <b>Non vuol dire che c’è un problema sui pagamenti</b>: '
    + 'vuol dire che questa settimana nessuno ha guardato. Ti avviso perché il silenzio, qui, deve voler dire «tutto a posto» e basta.'
    + '</p>'
    + '<p style="margin:0 0 16px;padding:12px 14px;background:#fdecea;border:1px solid #f5c2bd;border-radius:10px;color:#b3261e;font-size:14px">'
    + esc(messaggio) + '</p>'
    + '<p style="margin:0;color:#5b6b80;font-size:14px">'
    + 'Puoi rifarlo a mano dal pannello: <b>Chi usa il gestionale</b> &rarr; <b>Controlla gli abbonamenti</b>.'
    + '</p>'
    + '</div>';
}

// ---------------------------------------------------------------------
const handler = async function () {
  try {
    const url = trova(NOMI_URL), key = trova(NOMI_KEY);
    const chiaveStripe = (process.env.STRIPE_SECRET_KEY || '').trim();

    if (!url || !key || !chiaveStripe) {
      const mancano = [!chiaveStripe && 'STRIPE_SECRET_KEY', !url && 'SUPABASE_URL', !key && 'SUPABASE_SERVICE_KEY']
        .filter(Boolean).join(', ');
      await inviaEmail('Controllo abbonamenti: non sono riuscito a controllare',
        emailGuasto('Mancano queste variabili su Netlify: ' + mancano));
      return { statusCode: 200, body: 'variabili mancanti: ' + mancano };
    }

    const r = await confronta({ chiaveStripe, url, key });

    if (r.tutto_a_posto) {
      /* ⚠️ Qui NON si manda niente, ed e' voluto. Vedi la regola in cima. */
      console.log('[controllo-settimanale] tutto a posto:',
        r.quanti.abbonamenti_vivi_su_stripe, 'su Stripe,',
        r.quanti.risultano_paganti_nel_sito, 'nel sito');
      return { statusCode: 200, body: JSON.stringify({ tutto_a_posto: true, quanti: r.quanti }) };
    }

    const quante = r.quanti.paga_e_non_ha + r.quanti.ha_e_non_paga;
    const oggetto = r.quanti.paga_e_non_ha > 0
      ? 'Controllo abbonamenti: ' + r.quanti.paga_e_non_ha + (r.quanti.paga_e_non_ha === 1 ? ' cliente paga e non ha niente' : ' clienti pagano e non hanno niente')
      : 'Controllo abbonamenti: ' + quante + (quante === 1 ? ' cosa da guardare' : ' cose da guardare');

    await inviaEmail(oggetto, costruisciEmail(r));
    console.log('[controllo-settimanale] avviso mandato:', JSON.stringify(r.quanti));
    return { statusCode: 200, body: JSON.stringify({ tutto_a_posto: false, quanti: r.quanti }) };

  } catch (err) {
    console.error('[controllo-settimanale] eccezione:', err && err.message);
    /* l'email del guasto sta in un try suo: se non parte nemmeno quella,
       almeno nel log resta scritto cosa e' successo. */
    try { await inviaEmail('Controllo abbonamenti: non sono riuscito a controllare', emailGuasto(String(err && err.message || err))); }
    catch (e2) { console.error("[controllo-settimanale] non e' partita nemmeno l'email del guasto:", e2 && e2.message); }
    return { statusCode: 200, body: 'errore: ' + String(err && err.message || err) };
  }
};

/* Lunedi' alle 6:00 UTC = le 8:00 in Italia con l'ora legale (adesso).
   Da fine ottobre, con l'ora solare, diventano le 7:00: se ti da'
   fastidio, cambia in '0 7 * * 1' e torna alle 8:00.
   ⛔ Questa riga e l'import di `schedule` in cima vanno sempre insieme. */
exports.handler = schedule('0 6 * * 1', handler);

// Per provarlo subito senza aspettare lunedi':
module.exports.eseguiOra = handler;

// per il banco: la busta si prova da sola, senza rete
module.exports.costruisciEmail = costruisciEmail;
module.exports.emailGuasto = emailGuasto;
module.exports.blocco = blocco;
