// netlify/functions/recupera-carrelli-pubblicita.js
//
// 9 SETTEMBRE 2026 — CHI SI FERMA ALL'ULTIMO CLIC
//
// Ogni riga di annunci_pubblicitari nasce quando qualcuno arriva alla pagina
// del pagamento. Se poi non paga, resta li' e non la guarda piu' nessuno: e'
// la perdita che non si vede: quella gente ha gia' scelto spazio, citta' e
// periodo, e si e' fermata a un clic dalla fine.
//
// Questa funzione gira ogni ora e manda UNA sola email a chi ha lasciato
// l'ordine a meta' fra le 2 e le 48 ore fa. Poi segna la riga
// (promemoria_carrello) e non ci torna piu'.
//
// TRE REGOLE, per non fare figuracce:
//   1. Chi sta pagando PROPRIO ADESSO non si tocca: se la prenotazione e'
//      ancora valida (blocco_fino nel futuro) l'email non parte.
//   2. Se nel frattempo lo spazio e' stato venduto a un altro, l'email non
//      parte: non si invita nessuno a comprare una cosa che non c'e' piu'.
//      La riga viene segnata lo stesso, se no ci si riproverebbe ogni ora.
//   3. Una sola email per ordine. Mai un secondo sollecito.

const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

const NOMI_SPAZIO = {
  'hero-sx': 'Banner in alto (sinistra)', 'hero-dx': 'Banner in alto (destra)',
  'imprese-sx': "Trova un'impresa (sinistra)", 'imprese-dx': "Trova un'impresa (destra)",
  'piano-sx': 'Piani (sinistra)', 'piano-dx': 'Piani (destra)',
  'inserzioni-sx': 'Inserzioni lavoro (sinistra)', 'inserzioni-dx': 'Inserzioni lavoro (destra)',
  'subappalto-sx-1': 'Subappalti (sinistra 1)', 'subappalto-sx-2': 'Subappalti (sinistra 2)',
  'subappalto-dx-1': 'Subappalti (destra 1)', 'subappalto-dx-2': 'Subappalti (destra 2)',
  'profilo-sx-1': 'Profilo impresa (sinistra 1)', 'profilo-sx-2': 'Profilo impresa (sinistra 2)',
  'profilo-dx-1': 'Profilo impresa (destra 1)', 'profilo-dx-2': 'Profilo impresa (destra 2)'
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function euro(n) {
  return (Number(n) || 0).toFixed(2).replace('.', ',') + ' €';
}

function durataLabel(mesi) {
  const m = Number(mesi) || 1;
  if (m === 12) return '1 anno';
  if (m === 1) return '1 mese';
  return m + ' mesi';
}

async function inviaEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) { console.error('[carrelli] RESEND_API_KEY mancante'); return false; }
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
  if (!res.ok) console.error('[carrelli] Resend:', to, await res.text());
  return res.ok;
}

function emailCarrello(nome, spazio, citta, durata, prezzo) {
  return `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
    <div style="text-align:center;padding:16px 0 20px">
      <a href="https://trovaimpresa.com" style="text-decoration:none">
        <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
             style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
      </a>
    </div>
    <div style="background:linear-gradient(135deg,#0052cc,#0066ff);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="color:white;margin:0;font-size:22px">Lo spazio a ${esc(citta)} è ancora libero</h1>
    </div>
    <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
      <p style="font-size:15px;margin:0 0 18px">Ciao <strong>${esc(nome)}</strong>,</p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 20px">
        hai scelto uno spazio pubblicitario ma non hai completato il pagamento.
        Nessun problema: <strong>è ancora disponibile</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;background:#f7f9fc;border-radius:10px;margin:0 0 22px">
        <tr><td style="padding:12px 14px;color:#888">Spazio</td>
            <td style="padding:12px 14px;text-align:right"><strong>${esc(spazio)}</strong></td></tr>
        <tr><td style="padding:12px 14px;color:#888">Città</td>
            <td style="padding:12px 14px;text-align:right"><strong>${esc(citta)}</strong></td></tr>
        <tr><td style="padding:12px 14px;color:#888">Durata</td>
            <td style="padding:12px 14px;text-align:right"><strong>${esc(durata)}</strong></td></tr>
        <tr><td style="padding:12px 14px;color:#888">Prezzo</td>
            <td style="padding:12px 14px;text-align:right"><strong>${esc(prezzo)}</strong></td></tr>
      </table>
      <div style="text-align:center;margin:0 0 24px">
        <a href="https://trovaimpresa.com/pubblicita.html?citta=${encodeURIComponent(citta)}"
           style="display:inline-block;background:#e8733a;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
          Completa l'acquisto &rarr;
        </a>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 18px">
        Ci vogliono due minuti. Se hai cambiato idea va bene lo stesso: questa è
        l'unica email che ti mandiamo su questo ordine.
      </p>
      <p style="font-size:13px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
        Ricevi questa email perché hai iniziato un acquisto su TrovaImpresa.
      </p>
    </div>
    <p style="text-align:center;font-size:13px;color:#bbb;margin-top:12px">
      TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
    </p>
  </div>`;
}

const handler = async function () {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, body: 'Variabili Supabase mancanti' };
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const adesso = Date.now();
  const dueOreFa      = new Date(adesso - 2 * 3600 * 1000).toISOString();
  const quarantottoFa = new Date(adesso - 48 * 3600 * 1000).toISOString();

  const risultato = { guardati: 0, mandate: 0, saltati_occupato: 0, saltati_senza_email: 0, errori: [] };

  try {
    const { data: fermi, error } = await sb
      .from('annunci_pubblicitari')
      .select('id,spazio_id,citta,impresa_id,prezzo,mesi,stato,data_inizio,data_fine,blocco_fino,created_at')
      .in('stato', ['pending', 'annullato'])
      .is('promemoria_carrello', null)
      .lt('created_at', dueOreFa)
      .gt('created_at', quarantottoFa);
    if (error) throw error;

    risultato.guardati = (fermi || []).length;
    if (!risultato.guardati) return { statusCode: 200, body: JSON.stringify({ ok: true, ...risultato }) };

    // Tutti gli spazi venduti, per sapere quali non si possono piu' proporre
    const { data: venduti } = await sb
      .from('annunci_pubblicitari')
      .select('spazio_id,citta,data_inizio,data_fine')
      .eq('stato', 'pagato');

    for (const a of fermi) {
      // 1) sta pagando proprio adesso: si lascia in pace
      if (a.stato === 'pending' && a.blocco_fino && new Date(a.blocco_fino) > new Date()) continue;

      // 2) lo spazio nel frattempo e' stato venduto: niente email, ma si segna
      const occupato = (venduti || []).some(function (v) {
        return v.spazio_id === a.spazio_id
          && String(v.citta || '').toLowerCase() === String(a.citta || '').toLowerCase()
          && v.data_inizio <= a.data_fine && v.data_fine >= a.data_inizio;
      });
      if (occupato) {
        risultato.saltati_occupato++;
        await sb.from('annunci_pubblicitari')
          .update({ promemoria_carrello: new Date().toISOString() }).eq('id', a.id);
        continue;
      }

      const { data: imp } = await sb.from('imprese')
        .select('email,nome_attivita,nome').eq('id', a.impresa_id).single();
      const email = imp && imp.email;
      if (!email) {
        risultato.saltati_senza_email++;
        await sb.from('annunci_pubblicitari')
          .update({ promemoria_carrello: new Date().toISOString() }).eq('id', a.id);
        continue;
      }

      const ok = await inviaEmail(
        email,
        'Il tuo spazio a ' + a.citta + ' è ancora libero — TrovaImpresa',
        emailCarrello(
          (imp.nome_attivita || imp.nome || 'ciao'),
          (NOMI_SPAZIO[a.spazio_id] || a.spazio_id),
          a.citta,
          durataLabel(a.mesi),
          euro(a.prezzo)
        )
      );

      if (ok) {
        risultato.mandate++;
        const { error: e2 } = await sb.from('annunci_pubblicitari')
          .update({ promemoria_carrello: new Date().toISOString() }).eq('id', a.id);
        if (e2) risultato.errori.push('segno non salvato per ' + a.id + ': ' + e2.message);
      } else {
        risultato.errori.push('email non partita per ' + a.id);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, ...risultato }) };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};

exports.handler = schedule('0 * * * *', handler);
