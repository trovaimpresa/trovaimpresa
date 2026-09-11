// «Come ci hai conosciuto?» — la risposta che arriva da un clic nell'email.
//
// PERCHE' ESISTE
// La domanda c'era gia', nella schermata subito dopo l'iscrizione
// («Controlla la posta»). In due mesi ha raccolto →4← risposte: la gente
// quella schermata la chiude subito per andare a leggere la mail.
// Dall'11 settembre 2026 la stessa domanda sta anche nell'email di benvenuto,
// che arriva DOPO la conferma: li' l'iscritto e' gia' dentro, la mail la apre
// volentieri (ci sono i 3 mesi di Premium) e un clic non costa niente.
//
// COME FUNZIONA
// Ogni bottone dell'email e' un link a questa function:
//   /.netlify/functions/sondaggio?u=<user_id>&r=<risposta>&t=<tipo>
// Qui si controlla che la risposta sia una delle sei previste, si scrive la
// riga (UNA SOLA per iscritto) e si rimanda a una pagina di grazie.
//
// NON e' un dato delicato: nessun nome, nessuna email, solo «facebook» o
// «passaparola» legati a un id. Per questo il link puo' stare in chiaro.

const SCELTE = ['facebook', 'instagram', 'google', 'passaparola', 'linkedin', 'altro'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function vaiA(url) {
  return { statusCode: 302, headers: { Location: url, 'Cache-Control': 'no-store' }, body: '' };
}

exports.handler = async function (event) {
  const q = (event && event.queryStringParameters) || {};
  const u = String(q.u || '').trim();
  const r = String(q.r || '').trim().toLowerCase();
  const t = String(q.t || '').trim().toLowerCase();

  // Risposta non prevista o id storto: si ringrazia lo stesso e non si scrive
  // niente. Chi ha cliccato non deve vedere un errore per un nostro problema.
  if (!UUID.test(u) || SCELTE.indexOf(r) === -1) {
    console.warn('sondaggio: richiesta non valida');
    return vaiA('/grazie-sondaggio.html');
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY) {
    console.error('sondaggio: SUPABASE_SERVICE_KEY mancante');
    return vaiA('/grazie-sondaggio.html');
  }

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  try {
    // Una risposta sola per iscritto: se ha gia' risposto (magari dalla
    // schermata dopo l'iscrizione) non si sovrascrive.
    const gia = await fetch(
      SUPABASE_URL + '/rest/v1/come_ci_hanno_trovato?user_id=eq.' + encodeURIComponent(u) + '&select=id&limit=1',
      { headers }
    );
    if (gia.ok) {
      const righe = await gia.json();
      if (Array.isArray(righe) && righe.length) {
        console.log('sondaggio: gia risposto, non riscrivo');
        return vaiA('/grazie-sondaggio.html?r=' + encodeURIComponent(r));
      }
    }

    const ins = await fetch(SUPABASE_URL + '/rest/v1/come_ci_hanno_trovato', {
      method: 'POST',
      headers: Object.assign({ Prefer: 'return=minimal' }, headers),
      body: JSON.stringify({ user_id: u, risposta: r, tipo: t || null })
    });
    if (!ins.ok) {
      console.error('sondaggio: scrittura fallita', ins.status, await ins.text());
    } else {
      console.log('sondaggio: risposta', r, t || '');
    }
  } catch (e) {
    console.error('sondaggio: errore', e && e.message);
  }

  return vaiA('/grazie-sondaggio.html?r=' + encodeURIComponent(r));
};

// Esportati solo per il banco di prova.
exports._prova = { SCELTE, UUID };
