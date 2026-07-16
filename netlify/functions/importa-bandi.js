// Riceve via POST i bandi GIA' filtrati dalla pagina importa-bandi.html
// (poche righe, non il file intero) e li salva/aggiorna nella tabella Supabase 'bandi'.
//
// Variabili d'ambiente su Netlify:
//   SUPABASE_SERVICE_ROLE -> chiave segreta Supabase (gia' presente)
//   IMPORT_TOKEN          -> la password scelta per proteggere l'import

const SUPA_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';

exports.handler = async function (event) {
  const KEY = process.env.SUPABASE_SERVICE_ROLE;
  const TOKEN = process.env.IMPORT_TOKEN;
  if (!KEY) return { statusCode: 500, body: 'Config mancante: SUPABASE_SERVICE_ROLE non impostata.' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Metodo non consentito: usa POST.' };
  if (!TOKEN || (event.headers['x-import-token'] || '') !== TOKEN) {
    return { statusCode: 401, body: 'Token di import errato o mancante.' };
  }

  let righe;
  try { righe = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'Dati non validi.' }; }
  if (!Array.isArray(righe)) return { statusCode: 400, body: 'Formato inatteso (serve una lista).' };

  // tiene solo righe valide, limite di sicurezza
  righe = righe.filter(r => r && r.external_id && r.titolo).slice(0, 2000);
  if (!righe.length) return { statusCode: 200, body: 'Nessun bando pertinente da importare (0).' };

  const oggi = new Date().toISOString().slice(0, 10);
  try {
    const up = await fetch(SUPA_URL + '/rest/v1/bandi?on_conflict=external_id', {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(righe)
    });
    if (!up.ok) { const t = await up.text(); return { statusCode: 500, body: 'Salvataggio fallito: ' + t }; }

    // nasconde i bandi ormai scaduti
    await fetch(SUPA_URL + '/rest/v1/bandi?data_scadenza=lt.' + oggi, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ attivo: false })
    });
  } catch (e) {
    return { statusCode: 500, body: 'Errore Supabase: ' + e.message };
  }

  return { statusCode: 200, body: 'OK: ' + righe.length + ' bandi importati/aggiornati.' };
};
