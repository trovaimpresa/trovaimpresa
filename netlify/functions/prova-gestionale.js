// =====================================================================
// LA PROVA DI 30 GIORNI DEL GESTIONALE
//
// 30 agosto 2026. Regola di Alessio: «prima lo visita, lo prova, e poi se
// gli sta bene sa il prezzo e paga».
//
// Questa funzione NON tocca Stripe: non crea clienti, non chiede carte,
// non fa pagare niente. Scrive una data su Supabase e basta.
//
// ⛔ LA DATA LA SCRIVE SOLO IL SERVER.
// Le regole di accesso di Supabase lasciano che ognuno modifichi la
// propria riga, e il guardiano `imprese_blocca_piano` rimette al posto
// vecchio `gest_prova_fine` per chiunque non sia il server. Se la scrivesse
// il browser, uno si darebbe la prova fino al 2050 dalla console.
//
// ⚠️ CHI CHIAMA SI LEGGE DAL GETTONE, MAI DAL MESSAGGIO. Stessa regola di
//    crea-checkout-crediti.js: con l'email mandata dal browser uno
//    aprirebbe la prova a nome di un altro.
//
// ⛔ UNA VOLTA SOLA. Se la data c'e' gia', non si allunga: si risponde
//    quello che c'e'. Anche a prova finita — se no basterebbe ricliccare
//    per averne un'altra, all'infinito.
// =====================================================================
const { createClient } = require('@supabase/supabase-js');

const GIORNI = 30;

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return rispondi(405, { error: 'Metodo non consentito' });
    }

    // ---- 1. chi sta chiedendo la prova ------------------------------
    const intestazione = event.headers.authorization || event.headers.Authorization || '';
    const token = intestazione.startsWith('Bearer ') ? intestazione.slice(7).trim() : '';
    if (!token) return rispondi(401, { error: 'Devi essere collegato.' });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: chi, error: erroreChi } = await supabase.auth.getUser(token);
    const utente = chi && chi.user;
    if (erroreChi || !utente || !utente.id) {
      return rispondi(401, { error: 'La sessione è scaduta. Rientra e riprova.' });
    }

    // ---- 2. com'e' messo adesso -------------------------------------
    const { data: impresa, error: erroreLettura } = await supabase
      .from('imprese')
      .select('id, piano, premium_scadenza, gest_prova_fine')
      .eq('user_id', utente.id)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (erroreLettura) {
      console.error('[prova] lettura fallita:', erroreLettura.message);
      return rispondi(500, { error: 'Non riesco a leggere il tuo profilo. Riprova fra poco.' });
    }
    if (!impresa) return rispondi(404, { error: 'Non trovo il tuo profilo.' });

    // ⚠️ chi ha gia' il piano attivo non ha niente da provare: se aprissimo
    //    la prova adesso, gliela consumeremmo mentre e' gia' dentro.
    const scad = impresa.premium_scadenza ? new Date(impresa.premium_scadenza) : null;
    const haPiano = String(impresa.piano || '').trim().toLowerCase() === 'premium'
      && (!scad || isNaN(scad.getTime()) || scad.getTime() > Date.now());
    if (haPiano) {
      return rispondi(200, { gia_dentro: true, messaggio: 'Il gestionale ce l\'hai già attivo.' });
    }

    // ---- 3. la prova si apre UNA VOLTA SOLA -------------------------
    if (impresa.gest_prova_fine) {
      const fine = new Date(impresa.gest_prova_fine);
      const attiva = !isNaN(fine.getTime()) && fine.getTime() > Date.now();
      return rispondi(200, {
        gia_usata: true,
        attiva,
        fine: impresa.gest_prova_fine,
        messaggio: attiva
          ? 'La tua prova è già aperta.'
          : 'La prova di 30 giorni l\'hai già usata. Per continuare serve attivare il piano.'
      });
    }

    const fine = new Date(Date.now() + GIORNI * 24 * 3600 * 1000).toISOString();
    const { error: erroreScrittura } = await supabase
      .from('imprese')
      .update({ gest_prova_fine: fine })
      .eq('id', impresa.id);

    if (erroreScrittura) {
      console.error('[prova] scrittura fallita:', erroreScrittura.message);
      return rispondi(500, { error: 'Non sono riuscito ad aprire la prova. Riprova fra poco.' });
    }

    console.log('[prova] aperta per ' + utente.id + ' fino al ' + fine);
    return rispondi(200, { ok: true, fine, giorni: GIORNI });

  } catch (err) {
    console.error('[prova] eccezione:', err && err.message);
    return rispondi(500, { error: String(err && err.message || err) });
  }
};
