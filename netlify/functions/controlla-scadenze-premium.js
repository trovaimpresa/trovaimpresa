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
function emailScadenzaPremium(nome, scadenza) {
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
          <p style="margin:0 0 16px;">In queste settimane il Premium ti ha dato <strong>maggiore visibilità</strong>, posizione prioritaria nei risultati di ricerca e più possibilità di essere contattato dai potenziali clienti. Se vuoi <strong>continuare a farti trovare per primo</strong>, puoi mantenere il Premium a partire da soli <strong>€5 al mese</strong> (oppure €49 all'anno).</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto 22px;"><tr>
            <td align="center" style="border-radius:9px;background:#7b1fa2;">
              <a href="https://trovaimpresa.com/prezzi.html?piano=premium" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9px;">Mantieni il Premium &rarr;</a>
            </td>
          </tr></table>
          <p style="margin:0 0 16px;color:#5a6b7b;font-size:14px;">Se invece preferisci non proseguire, non devi fare nulla: allo scadere il tuo profilo tornerà automaticamente al piano <strong>Free</strong>, <strong>senza alcun addebito</strong>. Il tuo account e i tuoi dati restano attivi.</p>
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
      .select('id, email, nome, nome_attivita, premium_scadenza')
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
        emailScadenzaPremium((imp.nome_attivita || imp.nome || ''), imp.premium_scadenza)
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
