// netlify/functions/promemoria-scadenze.js
//
// 9 agosto 2026 — Il promemoria delle scadenze del gestionale.
//
// A CHE SERVE
// Un geometra o un architetto non perde il lavoro perche' sbaglia un calcolo:
// lo perde perche' buca una data. Questa funzione gira ogni mattina e manda
// UNA SOLA email a chi ha una scadenza fra 30, 7 o 1 giorno.
//
// COME EVITA I DOPPIONI
// Ogni riga di gest_scadenze ha la colonna "avvisi": ci finiscono dentro le
// tappe gia' spedite, per esempio "30,7". Prima di mandare si controlla, dopo
// aver mandato si scrive. Cosi' anche se la funzione girasse due volte nello
// stesso giorno, la stessa email non parte due volte.
//
// CHI NON RICEVE NIENTE
// - le scadenze gia' segnate "fatta"
// - le scadenze con avvisa = false (l'interruttore nel modulo)
// - chi non ha nessuna scadenza in quelle tre date: niente email a vuoto
//
// PRIMA DI FUNZIONARE VUOLE
// - sql/gest-scadenze-pratiche.sql eseguito su Supabase (colonne avvisi e avvisa)
// - le variabili SUPABASE_SERVICE_KEY e RESEND_API_KEY su Netlify (ci sono gia',
//   le usano invia-promemoria.js e controlla-scadenze-premium.js)

const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// data di oggi + n giorni, in formato 2026-08-09
function giorno(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function dataItaliana(iso) {
  if (!iso) return '';
  const [a, m, g] = String(iso).split('-');
  return g + '/' + m + '/' + a;
}

// le tre tappe dell'avviso
const TAPPE = [
  { giorni: 30, testo: 'fra 30 giorni', colore: '#0066ff' },
  { giorni: 7,  testo: 'fra 7 giorni',  colore: '#e65100' },
  { giorni: 1,  testo: 'DOMANI',        colore: '#c62828' }
];

const handler = async function () {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY) {
    return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
  }
  if (!process.env.RESEND_API_KEY) {
    return { statusCode: 500, body: 'RESEND_API_KEY non configurata' };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Le tre date che ci interessano oggi
    const dateCercate = TAPPE.map(t => giorno(t.giorni));
    const tappaPerData = {};
    TAPPE.forEach((t, i) => { tappaPerData[dateCercate[i]] = t; });

    // 2. Tutte le scadenze aperte che cadono in una di quelle tre date
    const { data: righe, error } = await sb
      .from('gest_scadenze')
      .select('id, user_id, titolo, tipo_pratica, data_scadenza, stato, avvisa, avvisi, lavoro_id')
      .in('data_scadenza', dateCercate)
      .neq('stato', 'fatta');
    if (error) throw error;

    if (!righe || righe.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, emailInviate: 0, scadenze: 0 }) };
    }

    // 3. Tengo solo quelle che vogliono l'avviso e a cui questa tappa non e'
    //    ancora stata spedita
    const daAvvisare = [];
    for (const r of righe) {
      if (r.avvisa === false) continue;
      const tappa = tappaPerData[r.data_scadenza];
      if (!tappa) continue;
      const gia = String(r.avvisi || '').split(',').filter(Boolean);
      if (gia.includes(String(tappa.giorni))) continue;
      daAvvisare.push({ riga: r, tappa, gia });
    }

    if (daAvvisare.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, emailInviate: 0, scadenze: righe.length }) };
    }

    // 4. Una sola email per persona, anche se ha piu' scadenze
    const perUtente = {};
    for (const x of daAvvisare) {
      if (!perUtente[x.riga.user_id]) perUtente[x.riga.user_id] = [];
      perUtente[x.riga.user_id].push(x);
    }

    let emailInviate = 0;
    const spedite = [];   // { id, avvisi } da riscrivere dopo

    for (const [userId, lista] of Object.entries(perUtente)) {
      // 5. L'indirizzo email dell'utente (serve il service role)
      let email = null;
      try {
        const { data: u } = await sb.auth.admin.getUserById(userId);
        email = u && u.user ? u.user.email : null;
      } catch (e) {
        console.error('getUserById fallita per', userId, e.message);
      }
      if (!email) {
        console.error('Email non trovata per user', userId);
        continue;
      }

      // 6. Le piu' urgenti in cima: domani prima di fra 7, fra 7 prima di fra 30
      lista.sort((a, b) => a.tappa.giorni - b.tappa.giorni);

      const urgente = lista[0].tappa.giorni === 1;
      const itemsHtml = lista.map(x => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #eee">
            <div style="font-size:16px;font-weight:700;color:#0a2a4d;line-height:1.4">${esc(x.riga.titolo || 'Scadenza')}</div>
            ${x.riga.tipo_pratica ? `<div style="font-size:14px;color:#666;margin-top:3px">${esc(x.riga.tipo_pratica)}</div>` : ''}
            <div style="font-size:15px;margin-top:6px">
              <span style="color:${x.tappa.colore};font-weight:800">${x.tappa.testo}</span>
              <span style="color:#666"> — ${dataItaliana(x.riga.data_scadenza)}</span>
            </div>
          </td>
        </tr>`).join('');

      const quante = lista.length === 1 ? 'una scadenza in arrivo' : `${lista.length} scadenze in arrivo`;

      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
          <div style="background:linear-gradient(135deg,#0a2a4d,#0066ff);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:22px">&#9200; Le tue scadenze</h1>
          </div>
          <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
              Gentile utente,<br>
              hai <b>${quante}</b> nel tuo gestionale TrovaImpresa.
            </p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:28px">${itemsHtml}</table>
            <div style="text-align:center;margin-bottom:28px">
              <a href="https://trovaimpresa.com/gestionale-app.html#scadenzario"
                 style="display:inline-block;background:#0066ff;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
                Apri lo scadenzario &rarr;
              </a>
            </div>
            <p style="font-size:13px;color:#777;line-height:1.6;margin:0 0 16px">
              Quando una scadenza &egrave; sistemata, segnala come <b>fatta</b> nel gestionale:
              cos&igrave; smette di ricordartela.
            </p>
            <p style="font-size:13px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
              Ricevi questa email perch&eacute; hai attivato il promemoria su queste scadenze.
              Puoi spegnerlo per ognuna dal modulo della scadenza.
            </p>
          </div>
          <p style="text-align:center;font-size:13px;color:#bbb;margin-top:12px">
            TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
          </p>
        </div>`;

      const oggetto = urgente
        ? '⏰ Scadenza DOMANI — TrovaImpresa'
        : '⏰ Le tue scadenze in arrivo — TrovaImpresa';

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'TrovaImpresa <info@trovaimpresa.com>',
          to: [email],
          subject: oggetto,
          html
        })
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Errore Resend per', email, errBody);
        continue;   // non segno niente: domani si riprova
      }

      emailInviate++;
      lista.forEach(x => {
        spedite.push({ id: x.riga.id, avvisi: x.gia.concat(String(x.tappa.giorni)).join(',') });
      });
    }

    // 7. Segno le tappe spedite, una riga alla volta: ognuna ha il suo valore
    for (const s of spedite) {
      const { error: e2 } = await sb.from('gest_scadenze')
        .update({ avvisi: s.avvisi }).eq('id', s.id);
      if (e2) console.error('Non ho potuto segnare avvisi su', s.id, e2.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, emailInviate, scadenze: daAvvisare.length })
    };
  } catch (err) {
    console.error('promemoria-scadenze:', err.message);
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};

// ogni mattina alle 6:15 UTC (8:15 in Italia d'estate, 7:15 d'inverno).
// Sfasata di 15 minuti da invia-promemoria.js per non partire tutte insieme.
exports.handler = schedule('15 6 * * *', handler);
