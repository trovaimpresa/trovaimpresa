// =====================================================================
// 8 novembre 2026 — LE EMAIL PROGRAMMATE: AL MASSIMO 50 AL GIORNO
//
// Resend gratis manda →100← email al giorno IN TUTTO il sito, conferme
// d'iscrizione comprese. Se una campagna le prende tutte, chi si iscrive
// dopo non riceve il link e non puo' attivarsi.
// Quindi dall'admin («Scrivi a tutti» → «Programma») le email finiscono
// nella tabella email_coda, gia' personalizzate, e questa funzione ogni
// mattina ne manda al massimo TETTO_GIORNO. Le altre →50← restano libere.
//
// - Parte solo da campagne con parte_dal <= oggi, prima la piu' vecchia:
//   cosi' Alessio puo' programmare un argomento diverso per ogni settimana.
// - Toglie dal tetto le email gia' mandate OGGI a mano da «Invia a tutti»
//   (tabella admin_email_inviate): il tetto vale per tutte e due le strade.
// - Chi nel frattempo si e' tolto dalle email (imprese.email_promo = false)
//   viene saltato.
// - Ogni giro si scrive in admin_email_inviate (modo 'programmata'), cosi'
//   compare in «Email inviate».
//
// ⛔ Le due righe vanno insieme: l'import di `schedule` qui sotto e
//    `exports.handler = schedule(...)` in fondo. Se ne resta una sola
//    Netlify si rifiuta di pubblicare il sito.
// =====================================================================
const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

const TETTO_GIORNO = 70;          // uguale a TETTO_GIORNO di invia-annuncio.js (8 nov: Alex ha scelto 70)
const MITTENTE = 'TrovaImpresa <info@trovaimpresa.com>';
/* 8 nov 2026: ogni giorno che parte qualcosa, una COPIA va ad Alessio
   (la prima mail del giro, con in cima quante ne sono partite). */
const COPIA_A = 'info@trovaimpresa.com';

function oggiRoma() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }); // AAAA-MM-GG
}
/* mezzanotte di oggi a Roma, in UTC (inverno +1, estate +2) */
function inizioGiornoRoma() {
  const ora = new Date();
  const roma = new Date(ora.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  const diff = roma.getTime() - ora.getTime();
  const mezzanotte = new Date(roma); mezzanotte.setHours(0, 0, 0, 0);
  return new Date(mezzanotte.getTime() - diff).toISOString();
}

const handler = async () => {
  const URL = (process.env.SUPABASE_URL || '').trim();
  const KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  const RESEND = (process.env.RESEND_API_KEY || '').trim();
  if (!URL || !KEY || !RESEND) { console.error('invia-coda-email: configurazione mancante'); return { statusCode: 500, body: 'config' }; }
  const sb = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const oggi = oggiRoma();

  // 1. quante ne sono gia' partite oggi da «Scrivi a tutti» (a mano o da qui)
  const { data: giaOggi, error: eg } = await sb.from('admin_email_inviate')
    .select('quanti').gte('created_at', inizioGiornoRoma());
  if (eg) { console.error('invia-coda-email: storico', eg.message); return { statusCode: 500, body: 'db' }; }
  const usate = (giaOggi || []).reduce((t, r) => t + (Number(r.quanti) || 0), 0);
  const posto = TETTO_GIORNO - usate - 1;   // -1: la copia di controllo per Alessio
  if (posto <= 0) { console.log('invia-coda-email: tetto gia\' pieno oggi', { usate }); return { statusCode: 200, body: 'pieno' }; }

  // 2. le campagne attive gia' partite, dalla piu' vecchia
  const { data: camp, error: ec } = await sb.from('email_campagne')
    .select('id, oggetto, testo, gruppo').eq('stato', 'attiva').lte('parte_dal', oggi)
    .order('parte_dal', { ascending: true }).order('id', { ascending: true });
  if (ec) { console.error('invia-coda-email: campagne', ec.message); return { statusCode: 500, body: 'db' }; }

  let resto = posto, totale = 0;
  for (const c of camp || []) {
    if (resto <= 0) break;
    const { data: righe, error: er } = await sb.from('email_coda')
      .select('id, email, oggetto, html').eq('campagna_id', c.id).eq('stato', 'attesa')
      .order('id', { ascending: true }).limit(resto);
    if (er) { console.error('invia-coda-email: coda', er.message); break; }

    if (righe && righe.length) {
      // chi si e' tolto dalle email nel frattempo viene saltato
      const emails = righe.map(r => r.email);
      const { data: tolti } = await sb.from('imprese').select('email').in('email', emails).eq('email_promo', false);
      const nonVuole = new Set((tolti || []).map(t => String(t.email).toLowerCase()));
      const daSaltare = righe.filter(r => nonVuole.has(String(r.email).toLowerCase()));
      const daMandare = righe.filter(r => !nonVuole.has(String(r.email).toLowerCase()));
      if (daSaltare.length) {
        await sb.from('email_coda').update({ stato: 'saltata', errore: 'si e\' tolto dalle email' })
          .in('id', daSaltare.map(r => r.id));
      }

      if (daMandare.length) {
        const r = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
          body: JSON.stringify(daMandare.map(m => ({ from: MITTENTE, to: [m.email], subject: m.oggetto, html: m.html })))
        });
        const risposta = await r.json().catch(() => ({}));
        if (!r.ok) {
          // non si segna niente come inviato: domani si riprova
          console.error('invia-coda-email: Resend ha rifiutato', r.status, risposta && risposta.message);
          break;
        }
        await sb.from('email_coda').update({ stato: 'inviata', inviata_il: new Date().toISOString() })
          .in('id', daMandare.map(m => m.id));
        try {
          await sb.from('admin_email_inviate').insert({
            modo: 'programmata', gruppo: c.gruppo, oggetto: c.oggetto, testo: c.testo,
            quanti: daMandare.length, destinatari: daMandare.map(m => m.email)
          });
        } catch (e) { console.error('invia-coda-email: storico non salvato', e.message); }
        totale += daMandare.length;
        resto -= daMandare.length;

        // la copia di controllo per Alessio (se fallisce, pazienza: le mail vere sono partite)
        try {
          const { count: mancano } = await sb.from('email_coda').select('id', { count: 'exact', head: true })
            .eq('campagna_id', c.id).eq('stato', 'attesa');
          const fascia = '<div style="background:#fff4e5;border:2px solid #ff8800;border-radius:12px;padding:14px 18px;'
            + 'margin:16px auto;max-width:600px;font-family:system-ui,Arial,sans-serif;font-size:16px;color:#12233a">'
            + '<b>Copia di controllo</b><br>Oggi partite: <b>' + daMandare.length + '</b> &middot; '
            + 'ancora da mandare: <b>' + (mancano || 0) + '</b><br>Questa e\' la mail arrivata a ' + daMandare[0].email + '</div>';
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: MITTENTE, to: [COPIA_A], subject: '[Copia] ' + daMandare[0].oggetto,
              html: daMandare[0].html.replace(/<body([^>]*)>/, '<body$1>' + fascia) })
          });
        } catch (e) { console.error('invia-coda-email: copia non mandata', e.message); }
      }
    }

    // finita? (nessuna riga piu' in attesa)
    const { count } = await sb.from('email_coda').select('id', { count: 'exact', head: true })
      .eq('campagna_id', c.id).eq('stato', 'attesa');
    if (count === 0) await sb.from('email_campagne').update({ stato: 'finita' }).eq('id', c.id);
  }

  console.log('invia-coda-email', oggi, { usate_prima: usate, mandate: totale });
  return { statusCode: 200, body: JSON.stringify({ oggi, mandate: totale }) };
};

// ⛔ Va insieme all'import di `schedule` in cima.
// Ogni giorno alle 7:30 UTC = 8:30 in inverno, 9:30 in estate (ora italiana).
exports.handler = schedule('30 7 * * *', handler);
