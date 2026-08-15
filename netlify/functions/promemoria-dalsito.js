// netlify/functions/promemoria-dalsito.js
//
// 15 agosto 2026 — "Hai una richiesta che ti aspetta".
//
// A CHE SERVE
// Una richiesta arrivata dal sito vale solo se l'impresa la legge. Chi apre il
// gestionale tutte le mattine la vede subito; chi non lo apre per due giorni
// perde il cliente, perche' nel frattempo ne ha chiamato un altro.
// Questa funzione gira ogni mattina e manda UNA email a chi ha una richiesta
// arrivata da piu' di 24 ore e mai aperta.
//
// COME EVITA I DOPPIONI
// Il registro e' la tabella gest_dalsito_avvisi: prima di mandare si controlla,
// dopo aver mandato si scrive. Anche se girasse due volte nello stesso giorno,
// la stessa email non parte due volte.
//
// CHI NON RICEVE NIENTE
// - chi la richiesta l'ha gia' aperta (c'e' la riga in gest_dalsito)
// - chi non ha il gestionale (piano diverso da premium, o premium scaduto):
//   per quelle imprese non cambia niente, ricevono le richieste come prima
// - le richieste piu' vecchie di 7 giorni: al primo giro non si spara addosso
//   a tutto l'arretrato
//
// COSA NON C'E' DENTRO L'EMAIL
// Email e telefono del cliente. Restano dove stanno: si vedono nel gestionale,
// dove passano dal controllo di contatto-preventivo.js.

const { schedule } = require('@netlify/functions');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;

const ORE_MINIME  = 24;
const GIORNI_MAX  = 7;

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, m => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]
  ));
}

async function sb(path, opt) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, Object.assign({
    headers: {
      apikey: SERVICE_KEY,
      Authorization: 'Bearer ' + SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  }, opt || {}));
  if (!res.ok) throw new Error(path + ' -> ' + res.status + ' ' + (await res.text()));
  const txt = await res.text();
  return txt ? JSON.parse(txt) : [];
}

function corpo(impresa, righe) {
  const uno = righe.length === 1;
  const lista = righe.map(r => `
    <tr><td style="padding:12px 14px;border-bottom:1px solid #e5e7eb">
      <div style="font-weight:700;font-size:16px;color:#0a2a4d">${esc(r.nome || 'Un cliente')}</div>
      <div style="font-size:15px;color:#42546b;margin-top:3px">
        ${esc(r.categoria_lavoro || r.tipo_lavoro || 'Richiesta di preventivo')}${r.citta ? ' — ' + esc(r.citta) : ''}
      </div>
    </td></tr>`).join('');

  return `<!DOCTYPE html><html lang="it"><body style="margin:0;background:#f7f9fa;font-family:'Trebuchet MS',Arial,sans-serif;color:#1f2933">
  <div style="max-width:600px;margin:0 auto;padding:26px 20px">
    <h1 style="font-size:23px;line-height:1.3;color:#0a2a4d;margin:0 0 14px">
      ${uno ? 'Hai una richiesta che ti aspetta' : 'Hai ' + righe.length + ' richieste che ti aspettano'}
    </h1>
    <p style="font-size:16.5px;line-height:1.6;margin:0 0 18px">
      Gentile ${esc(impresa.nome_attivita || impresa.nome || '')},<br>
      ${uno ? 'un cliente ti ha scritto' : 'dei clienti ti hanno scritto'} da TrovaImpresa
      ${uno ? 'piu’ di un giorno fa' : 'nei giorni scorsi'} e non ${uno ? 'l’hai' : 'le hai'} ancora ${uno ? 'aperta' : 'aperte'}.
    </p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:0 0 22px">
      ${lista}
    </table>
    <p style="text-align:center;margin:0 0 22px">
      <a href="https://trovaimpresa.com/gestionale-app.html#dalsito"
         style="display:inline-block;background:#ff8800;color:#fff;text-decoration:none;font-weight:700;font-size:16.5px;padding:15px 28px;border-radius:12px">
        Apri le richieste nel gestionale &rarr;
      </a>
    </p>
    <p style="font-size:15px;line-height:1.6;color:#42546b;margin:0 0 6px">
      Dentro trovi cosa ${uno ? 'ti ha chiesto' : 'ti hanno chiesto'}, i ${uno ? 'suoi' : 'loro'} contatti,
      e il pulsante che ti prepara il preventivo gia’ compilato.
    </p>
    <p style="font-size:14.5px;color:#7a8a9c;margin:22px 0 0">
      Un cordiale saluto,<br>Il Team di TrovaImpresa.com
    </p>
  </div></body></html>`;
}

const handler = async function () {
  if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_KEY) {
    return { statusCode: 500, body: 'Mancano le variabili di ambiente' };
  }

  const ora     = Date.now();
  const daQuando = new Date(ora - GIORNI_MAX * 24 * 3600e3).toISOString();
  const finoA    = new Date(ora - ORE_MINIME * 3600e3).toISOString();

  // 1. le richieste arrivate fra 7 giorni fa e 24 ore fa
  const prev = await sb('preventivi?select=id,impresa_id,nome,citta,categoria_lavoro,tipo_lavoro,created_at'
    + '&created_at=gte.' + daQuando + '&created_at=lte.' + finoA
    + '&impresa_id=not.is.null&order=created_at.desc&limit=500');
  if (!prev.length) return { statusCode: 200, body: 'Nessuna richiesta nella finestra' };

  // 2. quali sono gia' state avvisate
  const ids = prev.map(p => p.id);
  const gia = await sb('gest_dalsito_avvisi?select=preventivo_id&preventivo_id=in.(' + ids.join(',') + ')');
  const giaSet = new Set(gia.map(x => String(x.preventivo_id)));

  // 3. quali sono gia' state aperte nel gestionale
  const aperte = await sb('gest_dalsito?select=preventivo_id&preventivo_id=in.(' + ids.join(',') + ')');
  const aperteSet = new Set(aperte.map(x => String(x.preventivo_id)));

  const restano = prev.filter(p => !giaSet.has(String(p.id)) && !aperteSet.has(String(p.id)));
  if (!restano.length) return { statusCode: 200, body: 'Tutte gia’ aperte o gia’ avvisate' };

  // 4. solo le imprese che usano il gestionale (premium non scaduto)
  const impIds = [...new Set(restano.map(p => p.impresa_id))];
  const imprese = await sb('imprese?select=id,user_id,nome,nome_attivita,email,piano,premium_scadenza'
    + '&id=in.(' + impIds.join(',') + ')');

  const usaGestionale = i => {
    if (String(i.piano || '').trim().toLowerCase() !== 'premium') return false;
    if (i.premium_scadenza) {
      const s = new Date(i.premium_scadenza);
      if (!isNaN(s.getTime()) && s.getTime() < Date.now()) return false;
    }
    return !!i.email;
  };

  // 5. una email per impresa, con dentro tutte le sue richieste
  let inviate = 0, saltate = 0, errori = 0;
  for (const imp of imprese) {
    if (!usaGestionale(imp)) { saltate++; continue; }
    const sue = restano.filter(p => String(p.impresa_id) === String(imp.id));
    if (!sue.length) continue;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TrovaImpresa <info@trovaimpresa.com>',
          to: [imp.email],
          subject: sue.length === 1
            ? 'Hai una richiesta che ti aspetta'
            : 'Hai ' + sue.length + ' richieste che ti aspettano',
          html: corpo(imp, sue)
        })
      });
      if (!res.ok) throw new Error(await res.text());

      // 6. si segna SOLO dopo che l'email e' partita davvero
      await sb('gest_dalsito_avvisi', {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: 'Bearer ' + SERVICE_KEY,
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates'
        },
        body: JSON.stringify(sue.map(p => ({ preventivo_id: p.id })))
      });
      inviate++;
    } catch (e) {
      errori++;
      console.error('promemoria-dalsito, impresa ' + imp.id + ':', e.message);
    }
  }

  return {
    statusCode: 200,
    body: 'email inviate: ' + inviate + ' — imprese senza gestionale saltate: ' + saltate + ' — errori: ' + errori
  };
};

// ogni mattina alle 7:20 italiane (6:20 UTC d'inverno, 5:20 d'estate:
// si sceglie 6:20 UTC, che d'estate sono le 8:20 — va bene lo stesso,
// l'impresa apre il gestionale la mattina presto)
exports.handler = schedule('20 6 * * *', handler);
