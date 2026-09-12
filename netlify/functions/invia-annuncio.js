const crypto = require('crypto');
// ============================================================
// SCRIVI A TUTTI — TrovaImpresa (agosto 2026)
//
// Manda la stessa email a un gruppo di iscritti, ma personalizzata:
// ognuno riceve il proprio nome e la propria data di scadenza.
//
// Segnaposto utilizzabili nel testo e nell'oggetto:
//   [NOME]      nome dell'attivita' (o "utente" se manca)
//   [SCADENZA]  data di scadenza del Premium, scritta all'italiana
//   [CITTA]     citta' dell'impresa
//   [VETRINA]   link alla sua scheda pubblica (esiste sempre)
//   [PAGINA]    link alla pagina mestiere+citta' dove compare
//
// Gruppi: 'completi' | 'incompleti' | 'tutti' | 'prova'
// 'prova' manda solo ad Alessio, per vedere com'e' venuta prima di
// spedirla a tutti. Usare SEMPRE quello prima dell'invio vero.
//
// L'invio passa dall'endpoint "batch" di Resend, che accetta al massimo
// 100 email per chiamata. Da 100 in su la lista viene SPEZZATA in gruppi
// da 100 e mandata un gruppo alla volta, con una pausa fra uno e l'altro
// per non sbattere contro il limite di velocita' di Resend.
//
// ⚠️ 12 set 2026 — PERCHE' E' STATO CAMBIATO.
// Con →102← iscritti il primo invio a tutti si e' fermato con «Troppi
// destinatari in una volta (102). Il massimo e' 100»: il limite di Resend
// era stato usato come tetto nostro. Adesso il tetto nostro e'
// MAX_DESTINATARI (alto, si ragiona per migliaia di iscritti) e il limite
// di Resend lo gestisce lo spezzettamento, che da fuori non si vede.
// ============================================================
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const MITTENTE = 'TrovaImpresa <info@trovaimpresa.com>';
const EMAIL_PROVA = 'pintoalessio@icloud.com';
/* Quanti ne accetta Resend in UNA chiamata batch: e' un limite loro. */
const PER_LOTTO = 100;
/* Quanti ne accettiamo NOI in un invio solo. Sta qui per non far partire
   per sbaglio una campagna enorme, non perche' Resend non ce la faccia:
   1000 email = 10 chiamate = pochi secondi, dentro il tempo massimo di
   una funzione Netlify. Se un giorno gli iscritti saranno di piu', questo
   numero va alzato E l'invio va spostato su una funzione «background»,
   che di tempo ne ha 15 minuti invece di 10 secondi. */
const MAX_DESTINATARI = 1000;
const PAUSA_FRA_LOTTI_MS = 600;

function aspetta(ms) { return new Promise(r => setTimeout(r, ms)); }

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dataIta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Il testo arriva scritto a mano, con le righe vuote fra i paragrafi.
// Qui diventa HTML leggibile, senza che Alessio debba scrivere tag.
// stesso calcolo della funzione SQL codice_disiscrizione()
function codiceDisiscrizione(email) {
  return crypto.createHash('sha256')
    .update(String(email || '').trim().toLowerCase() + 'ti-niente-email-2026')
    .digest('hex');
}

/* ⚠️ 12 set 2026 — I LINK NON ERANO CLICCABILI.
   Nella campagna del 12 set i due indirizzi ([PAGINA] e [VETRINA])
   uscivano come testo semplice dentro il paragrafo. Alcuni programmi di
   posta li rendono cliccabili da soli, altri NO: chi legge da li' vede
   un indirizzo che non si puo' toccare e non apre niente. Su una mail
   il cui scopo e' far aprire due pagine, e' il difetto peggiore possibile.
   Qui ogni indirizzo che comincia per http diventa un vero <a href>,
   blu e sottolineato, cliccabile ovunque.
   ⚠️ Si linkifica DOPO esc(), quindi dentro l'href finisce il testo gia'
   messo al sicuro (&amp; al posto di &): in HTML e' la forma giusta.
   ⚠️ La punteggiatura finale (punto, virgola, parentesi) resta FUORI dal
   link, se no il link si porta dietro il punto e la pagina non esiste. */
function cliccabili(html) {
  return html.replace(/https?:\/\/[^\s<]+/g, function (url) {
    let coda = '';
    const m = url.match(/[.,;:!?)\]]+$/);
    if (m) { coda = m[0]; url = url.slice(0, -coda.length); }
    return '<a href="' + url + '" style="color:#0066ff;text-decoration:underline;word-break:break-all">' + url + '</a>' + coda;
  });
}

function testoInHtml(testo, emailDest) {
  const paragrafi = String(testo || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const corpo = paragrafi
    .map(p => '<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#12233a">' + cliccabili(esc(p).replace(/\n/g, '<br>')) + '</p>')
    .join('');
  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f7fb">'
    + '<div style="max-width:600px;margin:0 auto;padding:28px 22px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">'
    +   '<div style="text-align:center;padding:0 0 18px"><a href="https://trovaimpresa.com" style="text-decoration:none"><img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a></div>'
    + '<div style="background:#fff;border-radius:14px;padding:30px 28px">'
    + '<div style="font-size:22px;font-weight:800;color:#0a2a4d;margin-bottom:22px">'
    + '<span style="color:#0066ff">Trova</span><span style="color:#0a2a4d">Impresa</span></div>'
    + corpo
    + '</div>'
    + '<div style="text-align:center;font-size:13px;color:#5b6b80;padding:18px 10px;line-height:1.6">'
    + 'TrovaImpresa.com &middot; Alessio Pinto &middot; Rieti (RI)<br>'
    + 'Ricevi questa email perche&#39; sei iscritto a TrovaImpresa.com<br>'
    + '<a href="https://trovaimpresa.com/niente-email?e=' + encodeURIComponent(emailDest || '')
    + '&c=' + codiceDisiscrizione(emailDest)
    + '" style="color:#5b6b80">Non vuoi piu&#39; ricevere queste email? Togliti con un clic</a>'
    + '</div></div></body></html>';
}


/* ============================================================
   IL LINK DELLA SUA VETRINA — 12 settembre 2026

   Un'impresa iscritta non sa di stare su /muratore-roma: lo sa
   solo chi guarda il sito da dentro. Questi due segnaposto le
   mettono in mano il link, dritto, dentro l'email.

     [VETRINA]  la sua scheda pubblica — esiste SEMPRE
     [PAGINA]   la pagina mestiere+citta' dove compare

   ⚠️ [PAGINA] si scrive solo se la citta' e' fra quelle che hanno
   le pagine generate: per tutte le altre si torna alla scheda, che
   non sbaglia mai. Meglio un link in meno che un link nel vuoto.
   Quando genera-mestiere-citta.js aggiunge citta', aggiungerle qui.
   ============================================================ */
const CITTA_CON_PAGINE = {
  'roma': 'roma', 'milano': 'milano', 'torino': 'torino', 'napoli': 'napoli',
  'rieti': 'rieti', 'palermo': 'palermo', 'genova': 'genova', 'bologna': 'bologna',
  'firenze': 'firenze', 'bari': 'bari', 'catania': 'catania', 'verona': 'verona',
  'venezia': 'venezia', 'messina': 'messina', 'padova': 'padova', 'trieste': 'trieste',
  'brescia': 'brescia', 'parma': 'parma', 'modena': 'modena', 'reggio emilia': 'reggio-emilia',
  'agrigento': 'agrigento', 'alessandria': 'alessandria', 'ancona': 'ancona', 'aosta': 'aosta',
  'arezzo': 'arezzo', 'ascoli piceno': 'ascoli-piceno', 'asti': 'asti', 'avellino': 'avellino',
  'barletta': 'barletta', 'belluno': 'belluno', 'benevento': 'benevento', 'bergamo': 'bergamo',
  'biella': 'biella', 'bolzano': 'bolzano', 'brindisi': 'brindisi', 'cagliari': 'cagliari',
  'caltanissetta': 'caltanissetta', 'campobasso': 'campobasso', 'caserta': 'caserta', 'catanzaro': 'catanzaro',
  'chieti': 'chieti', 'como': 'como', 'cosenza': 'cosenza', 'cremona': 'cremona',
  'crotone': 'crotone', 'cuneo': 'cuneo', 'enna': 'enna', 'fermo': 'fermo',
  'ferrara': 'ferrara', 'foggia': 'foggia', 'forlì': 'forlì', 'frosinone': 'frosinone',
  'gorizia': 'gorizia', 'grosseto': 'grosseto', 'imperia': 'imperia', 'isernia': 'isernia',
  'l\'aquila': 'l-aquila', 'la spezia': 'la-spezia', 'latina': 'latina', 'lecce': 'lecce',
  'lecco': 'lecco', 'livorno': 'livorno', 'lodi': 'lodi', 'lucca': 'lucca',
  'macerata': 'macerata', 'mantova': 'mantova', 'massa': 'massa', 'matera': 'matera',
  'monza': 'monza', 'novara': 'novara', 'nuoro': 'nuoro', 'oristano': 'oristano',
  'pavia': 'pavia', 'perugia': 'perugia', 'pesaro': 'pesaro', 'pescara': 'pescara',
  'piacenza': 'piacenza', 'pisa': 'pisa', 'pistoia': 'pistoia', 'pordenone': 'pordenone',
  'potenza': 'potenza', 'prato': 'prato', 'ragusa': 'ragusa', 'ravenna': 'ravenna',
  'reggio calabria': 'reggio-calabria', 'rimini': 'rimini', 'rovigo': 'rovigo', 'salerno': 'salerno',
  'sassari': 'sassari', 'savona': 'savona', 'siena': 'siena', 'siracusa': 'siracusa',
  'sondrio': 'sondrio', 'taranto': 'taranto', 'teramo': 'teramo', 'terni': 'terni',
  'trapani': 'trapani', 'trento': 'trento', 'treviso': 'treviso', 'udine': 'udine',
  'varese': 'varese', 'verbania': 'verbania', 'vercelli': 'vercelli', 'vibo valentia': 'vibo-valentia',
  'vicenza': 'vicenza', 'viterbo': 'viterbo'
};

/* Quello che l'impresa ha scritto nel suo profilo -> la pagina giusta.
   Copiato dal campo `db` di genera-mestiere-citta.js: se cambia li',
   va cambiato anche qui. */
const MESTIERE_PAGINA = {
  'ristrutturazione': 'impresa-edile', 'ristrutturazione completa': 'impresa-edile',
  'costruzione nuova': 'impresa-edile',
  'edilizia / muratura': 'muratore', 'muratura e strutture': 'muratore',
  'idraulica': 'idraulico',
  'impianti elettrici': 'elettricista', 'antennista / allarmi': 'elettricista',
  'pittura e tinteggiatura': 'imbianchino',
  'pavimenti e piastrelle': 'piastrellista',
  'cartongesso': 'cartongessista',
  'serramenti / infissi': 'serramentista', 'tende da sole / zanzariere': 'serramentista',
  'vetraio': 'serramentista',
  'climatizzazione / caldaie': 'termoidraulico',
  'fotovoltaico / pannelli solari': 'installatore-fotovoltaico',
  'coperture e tetti': 'rifacimento-tetti', 'coperture / tetti': 'rifacimento-tetti',
  'geometra': 'geometra', 'architetto': 'architetto',
  'ingegnere_strutturale': 'ingegnere-strutturale', 'ingegnere strutturale': 'ingegnere-strutturale',
  'consulente_energetico': 'certificato-energetico', 'certificatore energetico': 'certificato-energetico',
  'termotecnico': 'certificato-energetico',
  'direttore_lavori': 'direttore-lavori', 'direttore dei lavori': 'direttore-lavori',
  'interior_designer': 'interior-designer', 'interior designer': 'interior-designer',
  'arredatore': 'interior-designer'
};

function linkVetrina(imp) {
  return 'https://trovaimpresa.com/profilo-impresa?id=' + encodeURIComponent(imp.id);
}


/* ⚠️ 12 set 2026 — LA PROVINCIA CHE NON SI CHIAMA COME IL CAPOLUOGO.
   genera-mestiere-citta.js pesca le imprese con `provincia ilike 'Monza%'`:
   quindi una ditta di Besana in Brianza (provincia «Monza e della Brianza»)
   FINISCE DAVVERO dentro muratore-monza. Qui invece si cercava la provincia
   tale e quale nell'elenco, «Monza e della Brianza» non c'era, e la stessa
   impresa riceveva il link della scheda invece che quello della pagina dove
   sta. Stessa storia per «Forli'-Cesena» e «Massa-Carrara».
   La cura: se la provincia non si trova identica, si cerca una citta'
   dell'elenco con cui la provincia COMINCIA — la stessa regola del
   generatore, cosi' i due non possono piu' dire cose diverse.
   ⚠️ Restano fuori le province che non cominciano col nome del capoluogo
   («Verbano-Cusio-Ossola» per Verbania, «Sud Sardegna»): quelle imprese non
   compaiono nemmeno nelle pagine, quindi il link alla scheda e' corretto. */
function dallaProvincia(prov) {
  if (!prov) return null;
  for (const nome in CITTA_CON_PAGINE) {
    if (prov === nome || prov.startsWith(nome + ' ') || prov.startsWith(nome + '-')) {
      return CITTA_CON_PAGINE[nome];
    }
  }
  return null;
}

function linkPagina(imp) {
  /* ⚠️ 12 set 2026 — LA PROVINCIA CONTA.
     Le pagine mestiere+citta' pescano le imprese per citta' O PROVINCIA:
     una ditta di Portici compare dentro muratore-napoli. Guardando solo
     la citta' la mandavamo alla scheda invece che alla pagina dove sta
     davvero. Quindi: prima la citta', e se non basta la provincia. */
  const citta = String(imp.citta || '').trim().toLowerCase();
  const prov  = String(imp.provincia || '').trim().toLowerCase();
  const slugCitta = CITTA_CON_PAGINE[citta] || CITTA_CON_PAGINE[prov] || dallaProvincia(prov);
  if (!slugCitta) return linkVetrina(imp);

  const voci = []
    .concat(Array.isArray(imp.mestieri) ? imp.mestieri : [])
    .concat(imp.mestiere ? [imp.mestiere] : [])
    .map(v => String(v).toLowerCase().trim());

  for (const v of voci) {
    if (MESTIERE_PAGINA[v]) return 'https://trovaimpresa.com/' + MESTIERE_PAGINA[v] + '-' + slugCitta;
  }
  return 'https://trovaimpresa.com/imprese-' + slugCitta;
}

function riempi(testo, imp) {
  const nome = (imp.nome_attivita || imp.nome || '').trim() || 'utente';
  return String(testo || '')
    .replace(/\[NOME\]/g, nome)
    .replace(/\[SCADENZA\]/g, dataIta(imp.premium_scadenza))
    .replace(/\[CITTA\]/g, (imp.citta || '').trim())
    .replace(/\[VETRINA\]/g, linkVetrina(imp))
    .replace(/\[PAGINA\]/g, linkPagina(imp));
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const ADMIN_USER = (process.env.ADMIN_USER || '').trim();
  const ADMIN_PASS = process.env.ADMIN_PASS || '';
  const RESEND = (process.env.RESEND_API_KEY || '').trim();

  let u, p, gruppo, oggetto, testo, solo_conteggio, azione;
  try { ({ u, p, gruppo, oggetto, testo, solo_conteggio, azione } = JSON.parse(event.body || '{}')); }
  catch { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) }; }

  if (!ADMIN_USER || !ADMIN_PASS || u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione database mancante.' }) };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  // ---- storico: le email gia' mandate (pannello "Email inviate") ----
  if (azione === 'storico') {
    const { data, error: e } = await sb.from('admin_email_inviate')
      .select('id, created_at, modo, gruppo, oggetto, testo, quanti, destinatari')
      .order('created_at', { ascending: false })
      .limit(100);
    if (e) return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Lettura storico: ' + e.message }) };
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, email: data || [] }) };
  }

  // ---- chi riceve ----
  const { data: tutte, error } = await sb.from('imprese')
    .select('id, nome, nome_attivita, email, citta, provincia, tipo, mestiere, mestieri, piano, premium_scadenza, is_test, email_promo')
    .eq('is_test', false)
    .eq('email_confermata', true)
    // chi si e' tolto dalle email promozionali non riceve piu' nulla da qui
    // (7 set 2026). Le email di servizio partono da altre funzioni.
    .neq('email_promo', false);
  if (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Lettura imprese: ' + error.message }) };
  }

  const conEmail = (tutte || []).filter(i => i.email && i.email.includes('@'));
  const completo = i => !!(i.nome_attivita && String(i.nome_attivita).trim());

  let destinatari;
  if (gruppo === 'prova') {
    const io = conEmail.find(i => (i.email || '').toLowerCase() === EMAIL_PROVA)
      || { nome_attivita: 'Impresa di prova', email: EMAIL_PROVA, citta: 'Rieti', premium_scadenza: new Date().toISOString() };
    destinatari = [io];
  } else if (gruppo === 'completi') {
    destinatari = conEmail.filter(completo);
  } else if (gruppo === 'incompleti') {
    destinatari = conEmail.filter(i => !completo(i));
  } else {
    destinatari = conEmail;
  }

  // Il pannello chiede prima quanti sono, per farli vedere ad Alessio
  // insieme all'anteprima, prima di spedire davvero.
  if (solo_conteggio) {
    const primo = destinatari[0];
    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        quanti: destinatari.length,
        anteprima: primo ? {
          a: primo.email,
          oggetto: riempi(oggetto, primo),
          testo: riempi(testo, primo)
        } : null
      })
    };
  }

  if (!oggetto || !String(oggetto).trim() || !testo || !String(testo).trim()) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Oggetto o testo mancante.' }) };
  }
  if (!RESEND) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Manca RESEND_API_KEY: le email non possono partire.' }) };
  }
  if (!destinatari.length) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Nessun destinatario in questo gruppo.' }) };
  }
  if (destinatari.length > MAX_DESTINATARI) {
    return {
      statusCode: 400, headers: corsHeaders,
      body: JSON.stringify({ error: 'Troppi destinatari in una volta (' + destinatari.length + '). Il massimo e\' ' + MAX_DESTINATARI + '.' })
    };
  }

  // ---- invio, un gruppo da 100 alla volta ----
  const lotto = destinatari.map(i => ({
    from: MITTENTE,
    to: [i.email],
    subject: riempi(oggetto, i),
    html: testoInHtml(riempi(testo, i), i.email)
  }));

  const gruppi = [];
  for (let i = 0; i < lotto.length; i += PER_LOTTO) gruppi.push(lotto.slice(i, i + PER_LOTTO));

  let inviate = 0;
  const partiti = [];

  try {
    for (let g = 0; g < gruppi.length; g++) {
      if (g > 0) await aspetta(PAUSA_FRA_LOTTI_MS);
      const r = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
        body: JSON.stringify(gruppi[g])
      });
      const risposta = await r.json().catch(() => ({}));
      if (!r.ok) {
        /* ⚠️ Se si rompe a meta' NON si puo' dire «non e' partita»: i gruppi
           prima di questo sono gia' usciti davvero. Si dice quante sono
           partite, se no si rimanda tutto due volte alle stesse persone. */
        const motivo = (risposta && risposta.message) || ('errore ' + r.status);
        const messaggio = inviate > 0
          ? 'Partite ' + inviate + ' email su ' + lotto.length + ', poi Resend si e\' fermato: ' + motivo
            + '. Le prime ' + inviate + ' NON vanno rimandate.'
          : 'Resend ha rifiutato l\'invio: ' + motivo;
        if (inviate > 0) {
          try {
            await sb.from('admin_email_inviate').insert({
              modo: gruppo === 'prova' ? 'prova' : 'vero',
              gruppo, oggetto: String(oggetto), testo: String(testo),
              quanti: inviate, destinatari: partiti
            });
          } catch (e) { console.error('[invia-annuncio] storico non salvato:', e.message); }
        }
        return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ error: messaggio, inviate }) };
      }
      const quante = Array.isArray(risposta.data) ? risposta.data.length : gruppi[g].length;
      inviate += quante;
      for (const m of gruppi[g]) partiti.push(m.to[0]);
    }

    // Archivio: ogni invio resta scritto, prova compresa, cosi' Alessio
    // ritrova cosa ha mandato, a chi e quando. Un errore qui non deve
    // far sembrare fallito un invio che invece e' partito.
    try {
      await sb.from('admin_email_inviate').insert({
        modo: gruppo === 'prova' ? 'prova' : 'vero',
        gruppo,
        oggetto: String(oggetto),
        testo: String(testo),
        quanti: inviate,
        destinatari: partiti
      });
    } catch (e) { console.error('[invia-annuncio] storico non salvato:', e.message); }

    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        inviate,
        gruppi: gruppi.length,
        destinatari: partiti
      })
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore di rete verso Resend: ' + err.message + (inviate > 0 ? ' — ma ' + inviate + ' email erano gia\' partite, non rimandarle.' : ''), inviate }) };
  }
};
