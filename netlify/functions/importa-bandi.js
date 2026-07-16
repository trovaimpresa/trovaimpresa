// Importa in automatico i bandi/fondi perduti da incentivi.gov.it (open data JSON)
// nella tabella Supabase 'bandi'. Gira in automatico ogni giorno (vedi netlify.toml).
//
// Variabili d'ambiente necessarie su Netlify:
//   BANDI_JSON_URL        -> il link "SCARICA JSON" della pagina incentivi.gov.it/it/open-data
//   SUPABASE_SERVICE_ROLE -> la chiave service_role di Supabase (Settings > API)

const SUPA_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';

// Parole chiave cercate SOLO nel titolo del bando (per tenere i temi utili a imprese edili/artigiani)
const KW = [
  'edil', 'ediliz', 'costruzion', 'ristruttur', 'cappotto', 'efficientamento',
  'riqualificazione energetica', 'rigenerazione urban', 'rigenerazione', 'antisism',
  'efficienza energetica', 'infiss', 'coibent', 'opere edil', 'impiant',
  'artigian', 'fotovoltaic', 'abitat'
];

const joinArr = v => Array.isArray(v) ? v.join(', ') : (v || '');
const dateOnly = s => s ? String(s).slice(0, 10) : null;

exports.handler = async function () {
  const JSON_URL = process.env.BANDI_JSON_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE;
  if (!JSON_URL || !KEY) {
    return { statusCode: 500, body: 'Config mancante: imposta BANDI_JSON_URL e SUPABASE_SERVICE_ROLE su Netlify.' };
  }

  // 1) Scarica l'open data
  let all;
  try {
    const res = await fetch(JSON_URL);
    if (!res.ok) return { statusCode: 502, body: 'Download open data fallito: HTTP ' + res.status };
    all = await res.json();
  } catch (e) {
    return { statusCode: 502, body: 'Errore download open data: ' + e.message };
  }
  if (!Array.isArray(all)) return { statusCode: 500, body: 'Formato open data inatteso.' };

  const oggi = new Date().toISOString().slice(0, 10);
  const attivo = r => { const dc = dateOnly(r.Data_chiusura); return !dc || dc >= oggi; };
  const rilevante = r => { const t = (r.Titolo || '').toLowerCase(); return KW.some(k => t.includes(k)); };

  // 2) Filtra e mappa sui campi della tabella 'bandi'
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

  // 3) Upsert su Supabase (la service_role bypassa le RLS)
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

    // 4) Nasconde i bandi ormai scaduti
    await fetch(SUPA_URL + '/rest/v1/bandi?data_scadenza=lt.' + oggi, {
      method: 'PATCH',
      headers: {
        apikey: KEY,
        Authorization: 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ attivo: false })
    });
  } catch (e) {
    return { statusCode: 500, body: 'Errore scrittura Supabase: ' + e.message };
  }

  return { statusCode: 200, body: 'OK: ' + righe.length + ' bandi importati/aggiornati.' };
};
