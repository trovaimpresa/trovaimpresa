const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

/* ⚠️ 18 agosto 2026 — I CONTATTI NON PARTONO PIU' DENTRO L'EMAIL.
   Prima questa funzione mandava nome, telefono ed email del cliente a 5
   imprese che non avevano chiesto niente. Adesso l'email dice solo zona,
   categoria e cosa cerca, e porta un pulsante: i contatti li vede solo
   chi clicca, e resta scritto chi e quando (netlify/functions/prendi-richiesta.js).
   Il consenso che il cliente spunta nelle pagine «cerca» dice esattamente
   questo: se si cambia una delle due parti, va cambiata anche l'altra. */
const SITO = 'https://trovaimpresa.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Normalizzazione comuni: STESSA regola del frontend (professionisti.html, ecc.)
function normalizzaComune(s) {
  return (s == null ? '' : String(s)).trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inviaEmail(to, subject, html, replyTo) {
  const payload = { from: 'TrovaImpresa <info@trovaimpresa.com>', to: [to], subject, html };
  if (replyTo) payload.reply_to = [replyTo];
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[richiesta-cliente] env Supabase mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  const taglia = v => (v == null ? '' : String(v)).trim().slice(0, 200);
  const nome = taglia(body.nome);
  const telefono = taglia(body.telefono);
  const categoria = taglia(body.categoria);
  const zona = taglia(body.zona);
  const ricerca = (body.ricerca == null ? '' : String(body.ricerca)).trim().slice(0, 300);
  const emailRaw = taglia(body.email).toLowerCase();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw) ? emailRaw : '';

  if (!nome || !telefono) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Nome e telefono sono obbligatori.' }) };
  }

  /* ===== 16 agosto 2026 — IL CONSENSO SI CONTROLLA QUI, NON SOLO NEL BROWSER =====
     Questa funzione manda nome, telefono ed email a un massimo di 5 imprese.
     La spunta nella pagina si aggira con due clic dagli strumenti del browser:
     l'unico posto dove il controllo conta davvero e' questo.
     E si scrive anche COSA ha accettato: senza la frase esatta, il consenso
     non si puo' dimostrare. */
  const consenso = body.consenso === true || body.consenso === 'true';
  const consensoTesto = (body.consenso_testo == null ? '' : String(body.consenso_testo)).trim().slice(0, 600);
  if (!consenso) {
    return { statusCode: 400, headers: corsHeaders,
             body: JSON.stringify({ error: 'Serve la spunta: senza il tuo consenso non possiamo girare la richiesta alle imprese.' }) };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Anti-doppione: stessa richiesta arrivata negli ultimi 2 minuti -> la ignoriamo
  try {
    const dueMinutiFa = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: gia } = await supabaseAdmin
      .from('richieste_clienti')
      .select('id')
      .eq('telefono', telefono)
      .eq('ricerca', ricerca)
      .gte('created_at', dueMinutiFa)
      .limit(1);
    if (gia && gia.length) {
      console.log('[richiesta-cliente] doppione ignorato:', telefono);
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, duplicato: true }) };
    }
  } catch (err) {
    console.error('[richiesta-cliente] controllo doppione fallito:', err.message);
  }

  // Salvataggio richiesta (recuperiamo l'id per tracciare gli inoltri)
  let richiestaId = null;
  {
    const base = { nome, telefono, email: email || null, categoria, zona, ricerca };
    const conConsenso = Object.assign({}, base, {
      consenso_at: new Date().toISOString(),
      consenso_testo: consensoTesto || null
    });

    /* ⚠️ Paracadute colonne mancanti, come nei Dati azienda del gestionale:
       se `sql/richieste-consenso.sql` non e' ancora stato lanciato, la
       richiesta del cliente NON si deve perdere. Si riprova senza le due
       colonne nuove e si scrive nei log che manca la migrazione. */
    let ins = null, error = null;
    ({ data: ins, error } = await supabaseAdmin
      .from('richieste_clienti').insert(conConsenso).select('id').single());

    if (error && /consenso_(at|testo)/.test(error.message || '')) {
      console.error('[richiesta-cliente] manca sql/richieste-consenso.sql: salvo senza il consenso scritto');
      ({ data: ins, error } = await supabaseAdmin
        .from('richieste_clienti').insert(base).select('id').single());
    }

    if (error) {
      console.error('[richiesta-cliente] errore insert:', error.message);
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
    }
    richiestaId = ins ? ins.id : null;
  }

  const esc = s => (s == null ? '' : String(s))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const dataFmt = new Date()
    .toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ---------- 1) EMAIL DI AVVISO A TROVAIMPRESA (invariata) ----------
  const htmlAdmin = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <div style="background:linear-gradient(135deg,#0066ff,#0a2a4d);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">📞 Nuova richiesta cliente</h1>
      </div>
      <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:14px;line-height:1.6;margin-bottom:20px">
          Un cliente ha lasciato una richiesta su <strong>TrovaImpresa</strong>.
        </p>
        <div style="background:#f5f5f5;border-radius:8px;padding:8px 20px;margin-bottom:24px">
          <h3 style="font-size:13px;font-weight:700;color:#0066ff;text-transform:uppercase;letter-spacing:1px;margin:12px 0 4px">Dettagli</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666;width:140px">Nome</td><td style="padding:10px 0;font-weight:700">${esc(nome)}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666">Telefono</td><td style="padding:10px 0">${esc(telefono)}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666">Email</td><td style="padding:10px 0">${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : 'non lasciata'}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666">Categoria</td><td style="padding:10px 0">${esc(categoria) || '—'}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666">Zona</td><td style="padding:10px 0">${esc(zona) || '—'}</td></tr>
            <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666;vertical-align:top">Ricerca</td><td style="padding:10px 0;white-space:pre-wrap">${esc(ricerca) || '—'}</td></tr>
            <tr><td style="padding:10px 0;color:#666">Data</td><td style="padding:10px 0">${dataFmt}</td></tr>
          </table>
        </div>
        <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
          Email automatica dal sistema richieste clienti di TrovaImpresa.
        </p>
      </div>
    </div>
  `;
  try {
    const res = await inviaEmail('info@trovaimpresa.com', 'Nuova richiesta cliente da TrovaImpresa', htmlAdmin, email || null);
    if (!res.ok) console.error('[richiesta-cliente] errore Resend admin:', await res.text());
  } catch (err) {
    console.error('[richiesta-cliente] errore email admin:', err.message);
  }

  // ---------- 2) INOLTRO AUTOMATICO AGLI ISCRITTI CHE COMBACIANO ----------
  // Match: categoria -> tipo, zona -> comune/provincia/regione (cascata).
  // Anti-spam: max 5 destinatari, cap 3/giorno per impresa, no doppioni (richieste_inviate).
  const MAX_DESTINATARI = 5;
  const MAX_GIORNO = 3;
  try {
    const tipoMap = { imprese: 'impresa', artigiani: 'artigiano', negozi: 'negozio', professionisti: 'professionista' };
    const tipo = tipoMap[(categoria || '').toLowerCase()] || null;
    const zonaSafe = zona.replace(/[,()%]/g, '').trim();
    const normZona = normalizzaComune(zona);

    if (tipo && zonaSafe) {
      const ors = [`citta.ilike.%${zonaSafe}%`, `provincia.ilike.%${zonaSafe}%`, `regione.ilike.%${zonaSafe}%`];
      if (normZona) ors.splice(1, 0, `comuni_competenza.cs.{"${normZona}"}`);

      const { data: cand } = await supabaseAdmin
        .from('imprese')
        .select('id,nome,nome_attivita,email,tipo,citta,provincia,regione,comuni_competenza,piano,piano_ordine')
        .eq('is_test', false)
        .eq('tipo', tipo)
        .or(ors.join(','))
        .limit(60);

      let candidati = (cand || []).filter(im => im.email);

      // Punteggio di prossimità: comune (3) > provincia (2) > regione (1)
      const scoreOf = im => {
        const c = normalizzaComune(im.citta || '');
        const comuni = Array.isArray(im.comuni_competenza) ? im.comuni_competenza.map(x => normalizzaComune(x)) : [];
        if (normZona && (c === normZona || c.includes(normZona) || comuni.includes(normZona))) return 3;
        if (normZona && normalizzaComune(im.provincia || '').includes(normZona)) return 2;
        if (normZona && normalizzaComune(im.regione || '').includes(normZona)) return 1;
        return 0;
      };
      candidati.sort((a, b) => (scoreOf(b) - scoreOf(a)) || ((b.piano_ordine || 0) - (a.piano_ordine || 0)));

      // Cap giornaliero per impresa
      const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
      const { data: inviatiOggi, error: errOggi } = await supabaseAdmin
        .from('richieste_inviate')
        .select('impresa_id')
        .gte('created_at', oggi.toISOString());
      /* ⚠️ Questa lettura falliva da sempre in silenzio (la tabella non
         esisteva), quindi il tetto di 3 email al giorno per impresa non ha
         MAI funzionato. Adesso almeno si vede nei log. */
      if (errOggi)
        console.error('[richiesta-cliente] tetto giornaliero non applicato:', errOggi.message,
                      '— hai lanciato sql/richieste-contatto-su-richiesta.sql?');
      const countMap = {};
      (inviatiOggi || []).forEach(r => { countMap[r.impresa_id] = (countMap[r.impresa_id] || 0) + 1; });

      const selezionati = candidati
        .filter(im => (countMap[im.id] || 0) < MAX_GIORNO)
        .slice(0, MAX_DESTINATARI);

      for (const im of selezionati) {
        const nomeImp = esc(im.nome_attivita || im.nome || 'Gentile impresa');

        /* ⚠️ La riga di registro si scrive PRIMA dell'email, perche' e' lei
           che contiene il codice del pulsante: senza, il link porterebbe
           nel vuoto. E si guarda l'esito — Supabase non lancia mai, quindi
           una scrittura non riuscita e' identica a una riuscita se nessuno
           controlla. E' cosi' che questa tabella e' rimasta finta per
           settimane senza che se ne accorgesse nessuno. */
        const token = crypto.randomUUID();
        const { data: segno, error: errSegno } = await supabaseAdmin
          .from('richieste_inviate')
          .insert({ richiesta_id: richiestaId, impresa_id: im.id,
                    token, email_inviata_a: im.email })
          .select('id')
          .single();

        if (errSegno || !segno) {
          console.error('[richiesta-cliente] registro non scritto, non mando niente a',
                        im.id, errSegno ? errSegno.message : 'nessuna riga');
          continue;
        }

        const link = SITO + '/prendi-richiesta?t=' + encodeURIComponent(token);
        const htmlImp = `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
            <div style="background:linear-gradient(135deg,#0066ff,#0a2a4d);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:22px">🔔 Nuova richiesta nella tua zona</h1>
            </div>
            <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
              <p style="font-size:15px;margin-bottom:16px">Ciao <strong>${nomeImp}</strong>,</p>
              <p style="font-size:14px;line-height:1.6;margin-bottom:20px">
                un cliente sta cercando qualcuno nella tua zona. Ecco cosa ha scritto:
              </p>
              <div style="background:#f5f9ff;border-left:4px solid #0066ff;border-radius:6px;padding:8px 20px;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                  <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666;width:130px">Zona</td><td style="padding:10px 0;font-weight:700">${esc(zona) || '—'}</td></tr>
                  <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666">Categoria</td><td style="padding:10px 0">${esc(categoria) || '—'}</td></tr>
                  <tr style="border-bottom:1px solid #e5e5e5"><td style="padding:10px 0;color:#666;vertical-align:top">Cosa cerca</td><td style="padding:10px 0;white-space:pre-wrap">${esc(ricerca) || '—'}</td></tr>
                  <tr><td style="padding:10px 0;color:#666">Arrivata il</td><td style="padding:10px 0">${dataFmt}</td></tr>
                </table>
              </div>
              <div style="text-align:center;margin-bottom:20px">
                <a href="${esc(link)}" style="display:inline-block;background:#0066ff;color:white;padding:16px 34px;border-radius:8px;font-size:16px;font-weight:700;text-decoration:none">Voglio contattarlo</a>
              </div>
              <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 16px">
                Nome, telefono ed email del cliente compaiono solo se premi il pulsante.
                Se il lavoro non ti interessa, non fare niente: i suoi dati restano dove sono.
              </p>
              <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
                Ricevi questa email perché sei iscritto a TrovaImpresa nella zona indicata dal cliente.
                Il link vale 60 giorni ed è solo tuo.
              </p>
            </div>
            <p style="text-align:center;font-size:11px;color:#bbb;margin-top:12px">TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a></p>
          </div>
        `;
        try {
          /* ⚠️ Niente `reply_to` con l'email del cliente: rimetterebbe il
             suo indirizzo dentro l'email, cioe' proprio quello che stiamo
             togliendo. Si risponde a noi. */
          const r = await inviaEmail(im.email, 'Nuova richiesta cliente nella tua zona — TrovaImpresa', htmlImp, null);
          if (!r.ok) {
            console.error('[richiesta-cliente] inoltro Resend fallito', im.id, await r.text());
            /* L'email non e' partita: si toglie la riga, se no quel codice
               resterebbe appeso e occuperebbe una delle 3 al giorno. */
            await supabaseAdmin.from('richieste_inviate').delete().eq('id', segno.id);
          }
        } catch (e) {
          console.error('[richiesta-cliente] inoltro errore', im.id, e.message);
          try { await supabaseAdmin.from('richieste_inviate').delete().eq('id', segno.id); }
          catch (e2) { console.error('[richiesta-cliente] pulizia fallita', segno.id, e2.message); }
        }
      }
    }
  } catch (err) {
    console.error('[richiesta-cliente] inoltro (blocco) errore:', err.message);
  }

  return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
};
