// Importa i bandi/fondi perduti nella tabella Supabase 'bandi'.
// Riceve via POST il JSON open data di incentivi.gov.it (inviato dalla pagina importa-bandi.html),
// filtra i bandi utili a imprese edili/artigiani, e li salva/aggiorna.
//
// Variabili d'ambiente su Netlify:
//   SUPABASE_SERVICE_ROLE -> chiave segreta Supabase (gia' presente)
//   IMPORT_TOKEN          -> una password a tua scelta (per proteggere l'import)

const SUPA_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';

// Parole chiave cercate SOLO nel titolo del bando
const KW = [
  'edil', 'ediliz', 'costruzion', 'ristruttur', 'cappotto', 'efficientamento',
  'riqualificazione energetica', 'rigenerazione urban', 'rigenerazione', 'antisism',
  'efficienza energetica', 'infiss', 'coibent', 'opere edil', 'impiant',
  'artigian', 'fotovoltaic', 'abitat'
];

const joinArr = v => Array.isArray(v) ? v.join(', ') : (v || '');
const dateOnly = s => s ? String(s).slice(0, 10) : null;

exports.handler = async function (event) {
  const KEY = process.env.SUPABASE_SERVICE_ROLE;
  const TOKEN = process.env.IMPORT_TOKEN;
  if (!KEY) return { statusCode: 500, body: 'Config mancante: SUPABASE_SERVICE_ROLE non impostata su Netlify.' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Metodo non consentito: usa POST.' };
  if (!TOKEN || (event.headers['x-import-token'] || '') !== TOKEN) {
    return { statusCode: 401, body: 'Non autorizzato: token di import errato o mancante.' };
  }

  let all;
  try { all = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'File JSON non valido.' }; }
  if (!Array.isArray(all)) return { statusCode: 400, body: 'Il file deve essere una lista di incentivi (array JSON).' };

  const oggi = new Date().toISOString().slice(0, 10);
  const attivo = r => { const dc = dateOnly(r.Data_chiusura); return !dc || dc >= oggi; };
  const rilevante = r => { const t = (r.Titolo || '').toLowerCase(); return KW.some(k => t.includes(k)); };

  const righe = all.filter(r => attivo(r) && rilevante(r)).map(r => {
    const forme = Array.isArray(r.Forma_agevolazione) ? r.Forma_agevolazione : [];
    const fondoPerduto = forme.some(x => /fondo perduto|contributo/i.test(x));
    const tipo = fondoPerduto ? 'Fondo perduto' : (forme[0] || 'Incentivo');

    const regs = Array.isArray(r.Regioni) ? r.Regioni : [];
    const regione = regs.length >= 15 ? 'Nazionale' : (regs.join(', ') || 'Nazionale');

    const impMax = Number(r.Agevolazione_Concedibile_max);
    const importo = impMax > 0 ? ('fino a ' + impMax.toLocaleString('it-IT') + ' €') : null;

    return {
      external_id: String(r.ID_Incentivo),
      titolo: (r.Titolo || 'Bando').slice(0, 300),
      descrizione: (r.Descrizione || '').slice(0, 600),
      ente: r.Soggetto_Concedente || null,
      tipo,
      settore: joinArr(r.Settore_Attivita) || null,
      regione,
      importo,
      data_apertura: dateOnly(r.Data_apertura),
      data_scadenza: dateOnly(r.Data_chiusura),
      link_ufficiale: r.Link_istituzionale || null,
      fonte: 'incentivi.gov.it',
      attivo: true
    };
  });

  if (!righe.length) return { statusCode: 200, body: 'Nessun bando pertinente trovato nel file (0 importati).' };

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
    if (!up.ok) { const t = await up.text(); return { statusCode: 500, body: 'Upsert fallito: ' + t }; }

    // Nasconde i bandi ormai scaduti
    await fetch(SUPA_URL + '/rest/v1/bandi?data_scadenza=lt.' + oggi, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ attivo: false })
    });
  } catch (e) {
    return { statusCode: 500, body: 'Errore scrittura Supabase: ' + e.message };
  }

  return { statusCode: 200, body: 'OK: ' + righe.length + ' bandi importati/aggiornati.' };
};
