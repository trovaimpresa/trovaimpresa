// netlify/functions/controlla-scadenze-premium.js
//
// Gira ogni mattina alle 9 e manda la mail "il tuo Premium (in regalo) scade
// fra 7 giorni" a chi ha il Piano Premium gratuito (reverse trial) in scadenza.
// È il messaggio che converte i regali in abbonamenti veri: senza questo avviso
// il Premium scade in silenzio (il cron lo declassa a Free) e quasi nessuno
// torna a pagare.
//
// Nessuna modifica al database: la ricerca usa una DATA ESATTA (finestra di un
// solo giorno su premium_scadenza), quindi ogni impresa viene presa in
// considerazione una volta sola, il giorno in cui mancano esattamente 7 giorni.
// I paganti (premium_pagato = true, premium_scadenza NULL) sono esclusi in
// automatico perché non hanno una data di scadenza.
//
// ⛔ 2 SETTEMBRE 2026 — I PREZZI ERANO QUELLI VECCHI.
// Questa email diceva «a partire da soli €5 al mese (oppure €49 all'anno)»:
// prezzi archiviati su Stripe dal 30 agosto. I veri sono 29/249 (Premium) e
// 39/349 (Premium AI). Le prime scadenze sono il 19 ottobre, quindi il 12
// ottobre sarebbero partite 27 email che promettevano 5€ verso una pagina che
// ne chiede 29. Corretto prima che partisse una sola email.
// ⚠️ E' l'unico posto in tutte le functions che nominava i prezzi vecchi:
// cercato in tutte. `prove-claude/banco-email-prezzi.js` adesso diventa rosso
// se un'email nomina un prezzo del Premium che non esiste in prezzi.html.
//
// ⚠️ IL TONO, deciso da Alessio il 2 settembre, in QUEST'ORDINE:
//  1. prima di tutto RESTARE NON COSTA NULLA — si torna al Free, la scheda
//     resta online, TrovaImpresa e' «una vetrina in piu'» e resta sua; il
//     gestionale non serve per restare sul sito;
//  2. poi il prezzo, e il prezzo si spiega COL GESTIONALE, non con la
//     visibilita'. ⛔ La prima versione diceva «se vuoi continuare a farti
//     trovare per primo, costa 29€»: bocciata da Alessio — «sembra che deve
//     pagare tutti quei soldi solamente per farsi trovare per primo, ma
//     invece con quei soldi ci comprera' il gestionale, uno strumento
//     eccezionale per organizzare il proprio lavoro».
// ⚠️ L'elenco di quello che c'e' dentro e' copiato da `prezzi.html` (piano
// Premium): preventivi col PDF, fatture per lo SDI, lavori e cantieri,
// agenda, scadenze fiscali, calcolatrice. Piu' il COMPUTO, messo in cima da
// Alessio il 2 settembre: e' la cosa che le imprese oggi fanno su Excel.
// ⚠️ Il computo si chiama in DUE modi apposta, ed e' scritto in
// gestionale-app.html: «Computo metrico» e' la parola del TECNICO, che quel
// documento lo crea; l'impresa se lo trova in mano e ci deve mettere i
// prezzi, e per lei si chiama «Computo da prezzare». L'email va alle imprese
// e agli studi tecnici insieme, quindi li nomina tutti e due — prima quello
// dell'impresa. Chi cambia questa riga non scelga un nome solo. Il gestionale E' COMPRESO nei 29€:
// i 39€ del Premium AI aggiungono solo l'aiuto dell'AI dentro al gestionale.
// Se un giorno cambia quella pagina, va cambiata anche questa email.

const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function giorno(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function dataItaliana(iso) {
  const [a, m, g] = String(iso).slice(0, 10).split('-');
  return `${g}/${m}/${a}`;
}

async function inviaEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'TrovaImpresa <info@trovaimpresa.com>',
      to: [to], subject, html
    })
  });
  if (!res.ok) console.error('Resend:', to, await res.text());
  return res.ok;
}

// Mail in voce personale di Alex (prima persona singolare), tono caldo.
/* ⛔ 2 SETTEMBRE 2026, chiesto da Alessio: «inserisci anche computo da
   prezzare se non e' un professionista».
   La sezione del gestionale si chiama in DUE modi apposta, ed e' scritto in
   gestionale-app.html: «Computo metrico» e' la parola del TECNICO, che quel
   documento lo crea; l'impresa se lo trova in mano dal geometra e ci deve
   mettere i prezzi, e per lei si chiama «Computo da prezzare».
   L'email va a tutti e due, quindi la parola la sceglie il destinatario.
   Misurato sul database il 2 settembre: 57 artigiani, 41 imprese, 4
   professionisti, 4 senza tipo. Chi non ha tipo prende la parola
   dell'impresa, che e' il caso di gran lunga piu' probabile. */
function parolaComputo(tipo) {
  return String(tipo || '').trim().toLowerCase() === 'professionista'
    ? 'Computo metrico'
    : 'Computo da prezzare';
}
function emailScadenzaPremium(nome, scadenza, tipo) {
  const saluto = nome ? 'Gentile ' + esc(nome) + ',' : 'Gentile utente,';
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;margin:0;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(10,42,77,0.08);">
        <tr><td style="background:#0066ff;padding:26px 32px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">🏗️ TrovaImpresa</div>
          <div style="font-size:13px;color:#dbe8ff;margin-top:4px;">Il portale delle imprese e degli artigiani</div>
        </td></tr>
        <tr><td style="background:#7b1fa2;padding:13px 32px;text-align:center;color:#ffffff;font-size:15px;font-weight:700;">⏳ Il tuo Premium scade fra 7 giorni</td></tr>
        <tr><td style="padding:32px;color:#1a2733;font-size:15px;line-height:1.65;">
          <p style="margin:0 0 16px;">${saluto}</p>
          <p style="margin:0 0 16px;">ti scrivo perché i <strong>3 mesi di Piano Premium</strong> che ti ho attivato in regalo stanno per terminare: il tuo Premium resta attivo fino al <strong>${esc(dataItaliana(scadenza))}</strong>.</p>
          <p style="margin:0 0 18px;padding:14px 16px;background:#eef4fb;border-radius:10px;">Prima di tutto la cosa più importante: <strong>restare su TrovaImpresa non ti costa nulla</strong>. Se non fai niente, allo scadere il profilo torna al piano <strong>Free</strong>, <strong>senza alcun addebito</strong>: la tua scheda resta online, i clienti continuano a trovarti e a scriverti. TrovaImpresa è una vetrina in più per la tua impresa, e resta tua. Il gestionale è <strong>uno strumento di lavoro</strong>: non serve per restare sul sito, e non averlo non toglie niente alla tua presenza qui.</p>
          <p style="margin:0 0 10px;">Detto questo: con il Premium non paghi la visibilità, paghi <strong>il gestionale</strong>. È un programma per tenere in ordine il lavoro, pensato per le imprese edili e per gli artigiani:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="padding:0 0 0 4px;font-size:15px;line-height:1.7;color:#1a2733;">
            &#9989; <strong>${parolaComputo(tipo)}</strong>, coi prezzi presi dal prezzario e gli stati di avanzamento<br>
            &#9989; <strong>Preventivi</strong> con le voci e il PDF da mandare al cliente<br>
            &#9989; <strong>Fatture elettroniche</strong>, col file pronto per lo SDI<br>
            &#9989; <strong>Lavori e cantieri</strong> con lo stato a colori<br>
            &#9989; <strong>Agenda</strong>, calendario degli operai e mappa dei cantieri<br>
            &#9989; <strong>Scadenze fiscali</strong> e calcolatrice edile<br>
            &#9989; <strong>Preventivi con l'AI</strong>: descrivi il lavoro a parole tue e le voci si scrivono da sole
          </td></tr></table>
          <p style="margin:0 0 16px;">Il gestionale è compreso nel Premium: <strong>€29 al mese</strong> oppure <strong>€249 all'anno</strong>. Dentro ci sono anche la maggiore visibilità sul sito, la priorità nei risultati di ricerca, la visibilità oltre la tua città e le foto e i video dei lavori senza limiti.</p>
          <p style="margin:0 0 10px;">E poi c'è la cosa che cambia davvero il modo di lavorare: <strong>l'aiuto intelligente dentro il gestionale</strong>. Non è un giocattolo — è come avere qualcuno in ufficio che conosce i tuoi lavori:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px;padding:14px 16px;background:#f3eefc;border-radius:10px;"><tr><td style="font-size:15px;line-height:1.7;color:#1a2733;">
            &#129302; Gli <strong>chiedi a voce tua</strong> «quanto ho speso nel cantiere di via Roma?» e ti risponde <strong>coi conti dei tuoi lavori veri</strong><br>
            &#129302; Gli detti una frase — «ieri Mario 8 ore al cantiere Bianchi» — e <strong>ti compila lui il modulo</strong><br>
            &#129302; Ogni lunedì mattina ti arriva per email <strong>il riepilogo della settimana</strong>: cosa è entrato, cosa è uscito, cosa scade
          </td></tr></table>
          <p style="margin:0 0 16px;">Questo è il <strong>Premium AI</strong>: <strong>€39 al mese</strong> (o €349 all'anno), cioè 10 euro in più del Premium, con 300 messaggi al mese.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto 22px;"><tr>
            <td align="center" style="border-radius:9px;background:#7b1fa2;">
              <a href="https://trovaimpresa.com/prezzi.html" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9px;">Guarda i piani &rarr;</a>
            </td>
          </tr></table>
          <p style="margin:0 0 16px;color:#5a6b7b;font-size:14px;">Il tuo account, la tua scheda e i tuoi dati restano attivi in ogni caso.</p>
          <p style="margin:0 0 16px;">Resto a disposizione per qualsiasi necessità o chiarimento tramite questo indirizzo email.</p>
          <p style="margin:0;">Un cordiale saluto,<br><strong>Il Team di TrovaImpresa.com</strong></p>
        </td></tr>
        <tr><td style="background:#0a2a4d;padding:18px 32px;text-align:center;color:#a9c9f5;font-size:12px;line-height:1.5;">
          &copy; 2026 TrovaImpresa &ndash; Alessio Pinto &ndash; Rieti (RI)<br>
          <a href="mailto:info@trovaimpresa.com" style="color:#a9c9f5;text-decoration:underline;">info@trovaimpresa.com</a> &middot;
          <a href="https://trovaimpresa.com/privacy-policy.html" style="color:#a9c9f5;text-decoration:underline;">Privacy</a>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

const handler = async function () {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY) return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const risultato = { avvisi: 0, saltati: 0, errori: [] };

  try {
    // Regali Premium in scadenza ESATTAMENTE fra 7 giorni (finestra di 1 giorno).
    const { data: inScadenza, error } = await sb
      .from('imprese')
      .select('id, email, nome, nome_attivita, tipo, premium_scadenza')
      .eq('piano', 'premium')
      .eq('premium_pagato', false)
      .gte('premium_scadenza', giorno(7))
      .lt('premium_scadenza', giorno(8));
    if (error) throw error;

    for (const imp of inScadenza || []) {
      if (!imp.email) { risultato.saltati++; risultato.errori.push('email mancante per impresa ' + imp.id); continue; }
      const ok = await inviaEmail(
        imp.email,
        '⏳ Il tuo Premium TrovaImpresa scade fra 7 giorni',
        emailScadenzaPremium((imp.nome_attivita || imp.nome || ''), imp.premium_scadenza, imp.tipo)
      );
      if (ok) risultato.avvisi++;
      else risultato.errori.push('invio fallito per ' + imp.email);
    }

    // Riepilogo allo staff (solo se c'è stato almeno un avviso).
    if (risultato.avvisi > 0) {
      await inviaEmail(
        'info@trovaimpresa.com',
        '🔔 Premium in scadenza: ' + risultato.avvisi + ' avvisi inviati',
        '<p>Ho inviato ' + risultato.avvisi + ' email "Premium scade fra 7 giorni".</p>'
        + (risultato.errori.length ? '<p>Errori: ' + esc(risultato.errori.join(', ')) + '</p>' : '')
      );
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, ...risultato }) };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};

exports.handler = schedule('0 9 * * *', handler);
