// netlify/edge-functions/scheda-meta.js
//
// ⛔ 1 SETTEMBRE 2026 — I META DELLA SCHEDA, SCRITTI PRIMA DI SPEDIRE.
//
// PERCHE' ESISTE. Su `profilo-impresa.html` il nome dell'impresa lo scrive il
// JavaScript, dopo che la pagina e' arrivata. Google il JavaScript lo esegue e
// prima o poi lo vede; WhatsApp, Facebook e LinkedIn NO: leggono l'HTML come
// arriva e si fermano li'. Per questo un link condiviso su WhatsApp mostrava
// «Profilo — TrovaImpresa» su tutte e 82 le schede.
// Questa funzione gira sul bordo della rete, prima che la pagina parta: legge
// l'id dall'indirizzo, chiede la riga a Supabase e riscrive il pezzo di <head>
// racchiuso fra <!--META-SCHEDA--> e <!--/META-SCHEDA-->.
//
// ⚠️ REGOLA NUMERO UNO: NEL DUBBIO, LA PAGINA PASSA INTATTA.
// Ogni singolo motivo per non riuscire (id non valido, Supabase giu', riga che
// non esiste, segnaposto sparito, qualsiasi errore) fa uscire la pagina COSI'
// COM'E'. Una scheda senza meta e' un peccato; una scheda rotta e' un danno.
//
// ⚠️ `costruisciMeta` qui sotto e' la COPIA ESATTA di quella dentro
// `profilo-impresa.html`. Deve restare identica carattere per carattere: se
// una cambia e l'altra no, WhatsApp mostra una cosa e Google un'altra, e
// nessuno se ne accorge. Il banco `banco-meta-scheda.js` confronta l'impronta
// md5 delle due copie e diventa rosso se si allontanano.
//
// ⚠️ COSTA. Questa funzione gira a ogni apertura di scheda, e le funzioni sul
// bordo si pagano. Per tenerle basse la risposta si fa mettere in cache un'ora
// dalla rete di Netlify (`netlify-cdn-cache-control`), cosi' la seconda
// apertura della stessa scheda non la fa girare di nuovo. Alessio il 31 agosto
// e' rimasto senza crediti: se un giorno il consumo desse fastidio, si spegne
// togliendo `path` qui in fondo e la pagina torna com'era.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

const APRE = '<!--META-SCHEDA-->';
const CHIUDE = '<!--/META-SCHEDA-->';

// le virgolette dentro un attributo spaccano il tag: si scappano sempre
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function costruisciMeta(d){
  var nome=String((d&&d.nome_attivita)||'').trim()||String((d&&d.nome)||'').trim()||'Scheda impresa';
  var citta=String((d&&d.citta)||'').trim();
  var tipo=String((d&&d.tipo)||'').trim().toLowerCase();
  var CAT={impresa:'Impresa edile',artigiano:'Artigiano',professionista:'Professionista',negozio:'Negozio'};
  var categoria=CAT[tipo]||'Impresa';
  var mest=(d&&Array.isArray(d.mestieri)&&d.mestieri.length)
    ? d.mestieri.filter(Boolean).join(', ')
    : String((d&&d.mestiere)||'').trim();
  var titolo=nome+' — '+categoria+(citta?' a '+citta:'')+' | TrovaImpresa';
  if(titolo.length>70) titolo=nome+(citta?' — '+categoria+' a '+citta:'')||titolo;
  var pezzi=[];
  pezzi.push(nome+': '+categoria.toLowerCase()+(citta?' a '+citta:'')+'.');
  if(mest) pezzi.push('Si occupa di '+mest+'.');
  var descr=String((d&&d.descrizione)||'').trim();
  /* la descrizione la scrive l'impresa e spesso non finisce col punto:
     senza, in Google si legge «...certificato Chiedi un preventivo» */
  if(descr){descr=descr.replace(/\s+/g,' ');if(!/[.!?…]$/.test(descr))descr+='.';pezzi.push(descr);}
  pezzi.push('Chiedi un preventivo gratuito su TrovaImpresa.');
  var descrizione=pezzi.join(' ');
  if(descrizione.length>300) descrizione=descrizione.slice(0,297).replace(/\s+\S*$/,'')+'…';
  var pers=(d&&d.personalizzazione)||{};
  var immagine=String(pers.banner_url||(d&&d.foto_copertina_url)||(d&&d.logo_url)||'').trim()
    ||'https://trovaimpresa.com/logo.png';
  var url='https://trovaimpresa.com/profilo-impresa?id='+String((d&&d.id)||'');
  return {titolo:titolo,descrizione:descrizione,immagine:immagine,url:url,
          nome:nome,citta:citta,categoria:categoria,mestieri:mest};
}

function bloccoMeta(M) {
  const righe = [
    APRE,
    '<!-- scritto dal bordo della rete: vedi netlify/edge-functions/scheda-meta.js -->',
    `<meta name="description" content="${esc(M.descrizione)}">`,
    '<meta property="og:type" content="profile">',
    '<meta property="og:site_name" content="TrovaImpresa">',
    `<meta property="og:title" content="${esc(M.titolo)}">`,
    `<meta property="og:description" content="${esc(M.descrizione)}">`,
    `<meta property="og:url" content="${esc(M.url)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta property="og:image" content="${esc(M.immagine)}">`,
    `<meta name="twitter:title" content="${esc(M.titolo)}">`,
    `<meta name="twitter:description" content="${esc(M.descrizione)}">`,
    `<meta name="twitter:image" content="${esc(M.immagine)}">`
  ];
  /* larghezza e altezza si dicono solo del logo del sito, che sappiamo essere
     1200x630. Di una foto caricata da un'impresa non le sappiamo, e dirle
     sbagliate e' peggio che non dirle. */
  if (M.immagine.indexOf('trovaimpresa.com/logo.png') >= 0) {
    righe.push('<meta property="og:image:width" content="1200">');
    righe.push('<meta property="og:image:height" content="630">');
  }
  righe.push(CHIUDE);
  return righe.join('\n');
}

export default async (request, context) => {
  const risposta = await context.next();
  try {
    const tipo = risposta.headers.get('content-type') || '';
    if (!tipo.includes('text/html')) return risposta;

    const id = (new URL(request.url).searchParams.get('id') || '').trim();
    // senza un id valido la pagina non mostra nessuna impresa: si lascia stare
    if (!/^[0-9]{1,12}$/.test(id)) return risposta;

    /* 5 set 2026 — dalla tabella alla vista `imprese_pubbliche`: le stesse
       colonne, e i due filtri (profili di prova, email confermata) li fa gia'
       la vista. Qui si usa la chiave PUBBLICA, quindi questa pagina era una
       delle strade da cui si leggeva la tabella intera. */
    const q = new URLSearchParams({
      select: 'id,nome,nome_attivita,citta,provincia,cap,indirizzo,tipo,mestiere,mestieri,descrizione,logo_url,foto_copertina_url,personalizzazione',
      id: 'eq.' + id,
      limit: '1'
    });
    const r = await fetch(`${SUPABASE_URL}/rest/v1/imprese_pubbliche?${q}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    if (!r.ok) return risposta;
    const righe = await r.json();
    if (!Array.isArray(righe) || !righe.length) return risposta;

    let html = await risposta.text();
    const i = html.indexOf(APRE), j = html.indexOf(CHIUDE);
    // segnaposto sparito: la pagina esce com'e', senza inventare posti dove scrivere
    if (i < 0 || j < 0 || j < i) return new Response(html, risposta);

    const M = costruisciMeta(righe[0]);
    html = html.slice(0, i) + bloccoMeta(M) + html.slice(j + CHIUDE.length);
    html = html.replace(/<title id="page-title">[\s\S]*?<\/title>/,
                        '<title id="page-title">' + esc(M.titolo) + '</title>');

    const testate = new Headers(risposta.headers);
    testate.set('content-type', 'text/html; charset=utf-8');
    testate.delete('content-length');
    // un'ora di cache sulla rete di Netlify: la seconda apertura della stessa
    // scheda non fa girare di nuovo la funzione (vedi la nota sui crediti)
    testate.set('cache-control', 'public, max-age=0, must-revalidate');
    testate.set('netlify-cdn-cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return new Response(html, { status: risposta.status, headers: testate });
  } catch (_e) {
    // qualsiasi cosa vada storta: la pagina esce come sarebbe uscita comunque
    return risposta;
  }
};

export const config = { path: ['/profilo-impresa', '/profilo-impresa.html'] };
