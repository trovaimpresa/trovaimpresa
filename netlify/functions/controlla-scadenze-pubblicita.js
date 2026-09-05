// netlify/functions/controlla-scadenze-pubblicita.js
//
// Gira ogni mattina alle 7 e chiude i due anelli che prima dipendevano dal
// fatto che Alex si ricordasse di guardare il pannello:
//
//   1. RINNOVI — gli annunci che scadono fra 7 giorni: manda all'inserzionista
//      un'email con il link per ricomprare lo stesso spazio. Il pagamento e'
//      una tantum (mode: 'payment'), quindi senza questo avviso l'annuncio
//      sparisce in silenzio e quasi nessuno torna a rinnovare.
//
//   2. LISTA D'ATTESA — gli annunci scaduti ieri: per quella citta' prende il
//      primo in lista e gli mette stato = 'offerto'. Da li' parte da sola
//      l'email gestita dal webhook notifica-spazio-libero.js.
//
// Nessuna modifica al database: entrambe le ricerche usano una data esatta,
// quindi ogni annuncio viene preso in considerazione una volta sola.

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
  const [a, m, g] = iso.split('-');
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

function emailRinnovo(nome, spazio, citta, scadenza) {
  return `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="text-align:center;padding:16px 0 20px">
          <a href="https://trovaimpresa.com" style="text-decoration:none">
            <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
                 style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
          </a>
        </div>
    <div style="background:linear-gradient(135deg,#0052cc,#0066ff);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="color:white;margin:0;font-size:22px">Il tuo spazio scade fra una settimana</h1>
    </div>
    <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
      <p style="font-size:15px;margin:0 0 18px">Ciao <strong>${esc(nome)}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 20px">
        il tuo spazio pubblicitario <strong>${esc(spazio)}</strong> a <strong>${esc(citta)}</strong>
        scade il <strong>${esc(scadenza)}</strong>. Dopo quella data l'annuncio smette di comparire
        e lo spazio torna disponibile per altri.
      </p>
      <div style="text-align:center;margin:0 0 24px">
        <a href="https://trovaimpresa.com/pubblicita.html?citta=${encodeURIComponent(citta)}"
           style="display:inline-block;background:#0066ff;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
          Rinnova il tuo spazio &rarr;
        </a>
      </div>
      <p style="font-size:13px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
        Ricevi questa email perché hai uno spazio pubblicitario attivo su TrovaImpresa.
      </p>
    </div>
    <p style="text-align:center;font-size:13px;color:#bbb;margin-top:12px">
      TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
    </p>
  </div>`;
}

// Riepilogo per Alex: cosa sta per scadere, così può chiamare/riproporre il rinnovo.
function emailRiepilogoAdmin(righe) {
  const tr = righe.map(function (r) {
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee"><strong>${esc(r.nome)}</strong><br>
        <span style="font-size:13px;color:#888">${esc(r.email || '—')}</span></td>
      <td style="padding:8px;border-bottom:1px solid #eee">${esc(r.spazio)}<br>
        <span style="font-size:13px;color:#888">📍 ${esc(r.citta)}</span></td>
      <td style="padding:8px;border-bottom:1px solid #eee">${esc(r.durata)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${esc(r.scadenza)}</td>
    </tr>`;
  }).join('');

  return `
  <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#333">
    <div style="background:#0a2a4d;padding:22px 24px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:19px">Spazi pubblicitari in scadenza fra 7 giorni</h1>
    </div>
    <div style="padding:24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
      <p style="font-size:14px;margin:0 0 16px">
        ${righe.length} annunc${righe.length === 1 ? 'io' : 'i'} in scadenza.
        Al cliente è già partita la mail di rinnovo automatica.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f5f7fa;text-align:left">
            <th style="padding:8px">Cliente</th><th style="padding:8px">Spazio</th>
            <th style="padding:8px">Durata</th><th style="padding:8px">Scade il</th>
          </tr>
        </thead>
        <tbody>${tr}</tbody>
      </table>
      <p style="margin:20px 0 0">
        <a href="https://trovaimpresa.com/admin" style="color:#0066ff;font-weight:700">Apri il pannello admin &rarr;</a>
      </p>
    </div>
  </div>`;
}

// Durata leggibile: usa la colonna "mesi"; se manca (righe vecchie) la ricava dalle date.
function durataLabel(inizio, fine, mesi) {
  let m = Number(mesi) > 0 ? Number(mesi) : null;
  if (m === null) {
    if (!inizio || !fine) return '—';
    const a = new Date(inizio), b = new Date(fine);
    m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  }
  if (m === 12) return '1 anno';
  if (m === 1) return '1 mese';
  if (m > 0 && m % 12 === 0) return (m / 12) + ' anni';
  return m > 0 ? m + ' mesi' : '—';
}

const handler = async function () {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY) return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const risultato = { promemoria: 0, offerte: 0, errori: [] };

  try {
    // ---------- 1. RINNOVI: annunci in scadenza fra 7 giorni ----------
    const { data: inScadenza, error: e1 } = await sb
      .from('annunci_pubblicitari')
      .select('id, spazio_id, citta, impresa_id, data_inizio, data_fine, mesi')
      .eq('stato', 'pagato')
      .eq('data_fine', giorno(7));
    if (e1) throw e1;

    const perAdmin = [];

    for (const ann of inScadenza || []) {
      const { data: imp } = await sb
        .from('imprese')
        .select('email, nome_attivita, nome')
        .eq('id', ann.impresa_id)
        .maybeSingle();
      const nomeCliente = (imp && (imp.nome_attivita || imp.nome)) || ('Impresa #' + ann.impresa_id);

      // Riga per il riepilogo ad Alex: ci finisce anche chi non ha l'email,
      // così il caso "email mancante" resta visibile invece di sparire.
      perAdmin.push({
        nome: nomeCliente,
        email: (imp && imp.email) || '',
        spazio: ann.spazio_id,
        citta: ann.citta,
        durata: durataLabel(ann.data_inizio, ann.data_fine, ann.mesi),
        scadenza: dataItaliana(ann.data_fine)
      });

      const email = imp && imp.email;
      if (!email) { risultato.errori.push('email mancante per annuncio ' + ann.id); continue; }

      const ok = await inviaEmail(
        email,
        'Il tuo spazio pubblicitario scade fra una settimana',
        emailRinnovo(nomeCliente, ann.spazio_id, ann.citta, dataItaliana(ann.data_fine))
      );
      if (ok) risultato.promemoria++;
    }

    // ---------- 1b. RIEPILOGO ad Alex ----------
    if (perAdmin.length) {
      const okAdmin = await inviaEmail(
        process.env.ADMIN_EMAIL || 'info@trovaimpresa.com',
        '[Admin] ' + perAdmin.length + ' spazi pubblicitari in scadenza fra 7 giorni',
        emailRiepilogoAdmin(perAdmin)
      );
      risultato.riepilogoAdmin = okAdmin;
    }

    // ---------- 2. LISTA D'ATTESA: spazi liberati ieri ----------
    const { data: scaduti, error: e2 } = await sb
      .from('annunci_pubblicitari')
      .select('spazio_id, citta')
      .eq('stato', 'pagato')
      .eq('data_fine', giorno(-1));
    if (e2) throw e2;

    // Una sola offerta per citta', anche se si liberano piu' spazi lo stesso giorno
    const citta = [...new Set((scaduti || []).map(function (s) { return s.citta; }))];

    for (const c of citta) {
      // Primo arrivato, primo servito. Se la tabella non avesse created_at
      // la query fallirebbe in silenzio: in quel caso ripiego sull'id.
      let coda = null;
      const perData = await sb
        .from('lista_attesa_pubblicita')
        .select('id')
        .ilike('citta', c)
        .eq('stato', 'attesa')
        .order('created_at', { ascending: true })
        .limit(1);
      if (perData.error) {
        const perId = await sb
          .from('lista_attesa_pubblicita')
          .select('id')
          .ilike('citta', c)
          .eq('stato', 'attesa')
          .order('id', { ascending: true })
          .limit(1);
        coda = perId.data;
      } else {
        coda = perData.data;
      }
      if (!coda || !coda.length) continue;

      // Il webhook notifica-spazio-libero.js scatta su questo passaggio di stato
      // e manda l'email: qui basta aggiornare il record.
      const { error: e3 } = await sb
        .from('lista_attesa_pubblicita')
        .update({ stato: 'offerto', offerta_scadenza: dataItaliana(giorno(7)) })
        .eq('id', coda[0].id);
      if (e3) risultato.errori.push('offerta non salvata per ' + c + ': ' + e3.message);
      else risultato.offerte++;
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, ...risultato }) };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};

exports.handler = schedule('0 7 * * *', handler);
