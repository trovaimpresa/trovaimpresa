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
      <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
        Ricevi questa email perché hai uno spazio pubblicitario attivo su TrovaImpresa.
      </p>
    </div>
    <p style="text-align:center;font-size:11px;color:#bbb;margin-top:12px">
      TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
    </p>
  </div>`;
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
      .select('id, spazio_id, citta, impresa_id, data_fine')
      .eq('stato', 'pagato')
      .eq('data_fine', giorno(7));
    if (e1) throw e1;

    for (const ann of inScadenza || []) {
      const { data: imp } = await sb
        .from('imprese')
        .select('email, nome_attivita, nome')
        .eq('id', ann.impresa_id)
        .maybeSingle();
      const email = imp && imp.email;
      if (!email) { risultato.errori.push('email mancante per annuncio ' + ann.id); continue; }

      const ok = await inviaEmail(
        email,
        'Il tuo spazio pubblicitario scade fra una settimana',
        emailRinnovo(
          (imp.nome_attivita || imp.nome || ''),
          ann.spazio_id, ann.citta, dataItaliana(ann.data_fine)
        )
      );
      if (ok) risultato.promemoria++;
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
