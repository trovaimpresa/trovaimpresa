/* =====================================================================
   «VOGLIO CONTATTARLO» — 18 agosto 2026

   Fino a oggi la richiesta di un cliente partiva verso 5 imprese con
   dentro nome, telefono ed email in chiaro. Le imprese non avevano
   chiesto niente: se lo trovavano in casella.

   Adesso l'email arriva SENZA i contatti, con un pulsante che porta qui.
   Questa funzione li fa vedere solo a chi li chiede davvero, e segna chi
   e quando.

   ⚠️ SI CHIEDONO IN DUE PASSAGGI, E NON E' UN CAPRICCIO.
   Aprire il link (GET) mostra soltanto un riepilogo senza contatti e un
   pulsante. I contatti escono al POST, cioe' dopo un clic vero. Il
   motivo: molti sistemi di posta aziendali aprono da soli i link delle
   email per controllarli. Con un passaggio solo, quel controllo
   automatico avrebbe scoperto i contatti e li avrebbe segnati come
   «chiesti da un'impresa» — che e' esattamente la bugia che questo
   lavoro serve a togliere.

   ⚠️ Il link vale 60 giorni. Un'email vecchia di un anno non deve
   continuare ad aprire il telefono di una persona.
   ===================================================================== */
const { createClient } = require('@supabase/supabase-js');

const GIORNI_VALIDI = 60;

const testa = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  /* ⚠️ Su questa pagina puo' esserci il telefono di una persona: fuori
     da Google, sempre, anche se l'indirizzo finisse in giro. */
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer'
};

const esc = s => (s == null ? '' : String(s))
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function pagina(titolo, dentro){
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>${esc(titolo)} | TrovaImpresa</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
       background:#f5f8fc;color:#0a2a4d;padding:24px 16px}
  .scatola{max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;
           border-radius:14px;overflow:hidden}
  .cima{background:linear-gradient(135deg,#0066ff,#0a2a4d);color:#fff;padding:26px 24px}
  .cima h1{margin:0;font-size:21px;line-height:1.3}
  .corpo{padding:26px 24px}
  p{font-size:16px;line-height:1.6;margin:0 0 18px;color:#334155}
  .riga{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid #eef2f7;font-size:16px}
  .riga:last-child{border-bottom:none}
  .riga .k{color:#64748b;min-width:120px}
  .riga .v{font-weight:700;color:#0a2a4d}
  .btn{display:block;width:100%;text-align:center;padding:17px 20px;border:none;
       border-radius:10px;background:#0066ff;color:#fff;font-size:17px;font-weight:700;
       text-decoration:none;cursor:pointer;font-family:inherit}
  .btn.verde{background:#16a34a}
  .nota{font-size:14px;color:#64748b;line-height:1.5;margin-top:18px}
  .avviso{background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;
          padding:14px 16px;font-size:15px;line-height:1.55;color:#7c2d12;margin:0 0 20px}
  @media(max-width:480px){.riga{flex-direction:column;gap:2px}.riga .k{min-width:0;font-size:14px}}
</style>
</head>
<body>
  <div class="scatola">
    <div class="cima"><h1>${esc(titolo)}</h1></div>
    <div class="corpo">${dentro}</div>
  </div>
</body>
</html>`;
}

const rispondi = (codice, html) => ({ statusCode: codice, headers: testa, body: html });

const pagLinkKo = () => rispondi(404, pagina('Questo link non funziona', `
  <p>Il collegamento non &egrave; valido, oppure &egrave; passato troppo tempo
  (i link delle richieste valgono ${GIORNI_VALIDI} giorni).</p>
  <p class="nota">Se pensi che sia un errore, scrivici a
  <a href="mailto:info@trovaimpresa.com">info@trovaimpresa.com</a>.</p>
  <a class="btn" href="https://trovaimpresa.com">Vai a TrovaImpresa</a>`));

function leggiToken(event){
  const q = (event.queryStringParameters || {}).t;
  if (q) return String(q).trim().slice(0, 100);
  const corpo = event.body || '';
  if (!corpo) return '';
  try {
    const j = JSON.parse(corpo);
    if (j && j.t) return String(j.t).trim().slice(0, 100);
  } catch { /* non e' JSON: sara' un modulo */ }
  const m = /(?:^|&)t=([^&]*)/.exec(corpo);
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')).trim().slice(0, 100) : '';
}

exports.handler = async function (event) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[prendi-richiesta] env Supabase mancanti');
    return rispondi(500, pagina('Non riusciamo a rispondere',
      '<p>C\'&egrave; un problema dalla nostra parte. Riprova fra qualche minuto.</p>'));
  }

  const token = leggiToken(event);
  if (!token) return pagLinkKo();

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: riga, error } = await sb
    .from('richieste_inviate')
    .select('id, richiesta_id, impresa_id, created_at, contatto_visto_at')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    console.error('[prendi-richiesta] lettura fallita:', error.message);
    return rispondi(500, pagina('Non riusciamo a rispondere',
      '<p>C\'&egrave; un problema dalla nostra parte. Riprova fra qualche minuto.</p>'));
  }
  if (!riga) return pagLinkKo();

  /* ⚠️ Scaduto: si risponde come a un link sbagliato, senza dire «era
     valido fino a marzo». Chi provasse i codici a caso non deve capire
     dalla risposta se ci e' andato vicino. */
  const nato = new Date(riga.created_at).getTime();
  if (isFinite(nato) && Date.now() - nato > GIORNI_VALIDI * 24 * 60 * 60 * 1000)
    return pagLinkKo();

  const { data: ric, error: errRic } = await sb
    .from('richieste_clienti')
    .select('id, nome, telefono, email, categoria, zona, ricerca, created_at')
    .eq('id', riga.richiesta_id)
    .maybeSingle();

  if (errRic) {
    console.error('[prendi-richiesta] richiesta illeggibile:', errRic.message);
    return rispondi(500, pagina('Non riusciamo a rispondere',
      '<p>C\'&egrave; un problema dalla nostra parte. Riprova fra qualche minuto.</p>'));
  }
  if (!ric) return pagLinkKo();

  const quando = ric.created_at
    ? new Date(ric.created_at).toLocaleString('it-IT',
        { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const riepilogo = `
    <div class="riga"><span class="k">Zona</span><span class="v">${esc(ric.zona) || '—'}</span></div>
    <div class="riga"><span class="k">Categoria</span><span class="v">${esc(ric.categoria) || '—'}</span></div>
    <div class="riga"><span class="k">Cosa cerca</span><span class="v" style="white-space:pre-wrap;font-weight:400">${esc(ric.ricerca) || '—'}</span></div>
    ${quando ? `<div class="riga"><span class="k">Arrivata il</span><span class="v" style="font-weight:400">${esc(quando)}</span></div>` : ''}`;

  const gliAveva = !!riga.contatto_visto_at;
  const chiede   = event.httpMethod === 'POST';

  /* ---- I contatti: solo dopo un clic vero, o se li aveva gia' chiesti ---- */
  if (chiede || gliAveva){
    if (!gliAveva){
      const { data: agg, error: errAgg } = await sb
        .from('richieste_inviate')
        .update({ contatto_visto_at: new Date().toISOString() })
        .eq('id', riga.id)
        .select('id');
      /* ⚠️ Supabase non lancia mai: se non si guarda l'esito, una
         scrittura bloccata e' identica a una riuscita. Qui pero' non si
         nega il contatto per colpa nostra: si scrive nei log e si va
         avanti. Chi ha cliccato ha diritto alla risposta. */
      if (errAgg || !agg || !agg.length)
        console.error('[prendi-richiesta] non ho segnato la presa in carico',
                      riga.id, errAgg ? errAgg.message : 'zero righe');
    }

    const tel = String(ric.telefono || '').replace(/[^0-9+]/g, '');
    return rispondi(200, pagina('Ecco come contattarlo', `
      <p>Chiama tu: il cliente sta aspettando una risposta, e chi risponde
      per primo di solito prende il lavoro.</p>
      <div class="riga"><span class="k">Cliente</span><span class="v">${esc(ric.nome) || '—'}</span></div>
      <div class="riga"><span class="k">Telefono</span><span class="v">${esc(ric.telefono) || '—'}</span></div>
      ${ric.email ? `<div class="riga"><span class="k">Email</span><span class="v" style="font-weight:400"><a href="mailto:${esc(ric.email)}">${esc(ric.email)}</a></span></div>` : ''}
      ${riepilogo}
      ${tel ? `<div style="margin-top:22px"><a class="btn verde" href="tel:${esc(tel)}">Chiama ${esc(ric.nome) || 'il cliente'}</a></div>` : ''}
      <p class="nota">Questi dati te li ha dati il cliente per essere
      ricontattato su questo lavoro. Servono a quello: non vanno usati per
      altro, n&eacute; passati ad altri.</p>`));
  }

  /* ---- Prima schermata: nessun contatto, solo il pulsante ---- */
  return rispondi(200, pagina('Una richiesta nella tua zona', `
    <p>Un cliente sta cercando qualcuno dalle tue parti. Ecco cosa ha scritto:</p>
    ${riepilogo}
    <form method="POST" action="/prendi-richiesta" style="margin-top:24px">
      <input type="hidden" name="t" value="${esc(token)}">
      <button class="btn" type="submit">S&igrave;, voglio contattarlo</button>
    </form>
    <p class="nota">I contatti del cliente (nome, telefono ed email) compaiono
    solo se premi il pulsante. Se non ti interessa, chiudi pure: al cliente
    non arriva niente e i suoi dati restano dove sono.</p>`));
};
