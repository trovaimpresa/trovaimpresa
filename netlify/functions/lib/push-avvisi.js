// =====================================================================
// 8 novembre 2026 — MANDA UN AVVISO A TUTTI I TELEFONI ACCESI DI UNA PERSONA
// campo = 'mattina' | 'richieste' | 'sera' (le colonne di gest_avvisi_sera,
// sql/gest-avvisi-telefono.sql). Un telefono che non esiste piu' (404/410)
// si cancella da solo, come nella domanda della sera.
// ⛔ Non lancia MAI un errore: un avviso sul telefono che non parte non deve
//    fermare l'email o il salvataggio che lo ha chiamato. Ritorna quanti
//    telefoni l'hanno ricevuto (0 se nessuno, o se la tabella non risponde).
// =====================================================================
const { manda } = require('./push-chiavi');

async function avvisaTelefoni(sb, userId, campo, msg) {
  try {
    if (!userId || !['mattina', 'richieste', 'sera'].includes(campo)) return 0;
    const r = await sb.from('gest_avvisi_sera').select('id,endpoint,p256dh,auth')
      .eq('user_id', userId).eq(campo, true).limit(10);
    if (r.error || !r.data || !r.data.length) return 0;
    let n = 0;
    for (const t of r.data) {
      try { await manda(sb, t, msg); n++; }
      catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          try { await sb.from('gest_avvisi_sera').delete().eq('id', t.id); } catch (_) {}
        } else console.error('avvisaTelefoni:', e.message);
      }
    }
    return n;
  } catch (e) { console.error('avvisaTelefoni:', e.message); return 0; }
}

module.exports = { avvisaTelefoni };
