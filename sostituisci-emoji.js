/* ============================================================
   sostituisci-emoji.js — 22 settembre 2026

   A COSA SERVE
   Toglie le faccine (emoji) da TUTTE le pagine del sito e ci mette le
   icone disegnate, le stesse della home: stesso tratto, stesso colore
   del testo, uguali su ogni telefono.

   PERCHE'
   Le emoji le disegna il telefono di chi guarda: su Android sono una
   cosa, su iPhone un'altra, su Windows un'altra ancora. Le icone
   disegnate sono sempre identiche e seguono il colore della scritta.

   COSA NON TOCCA
   - quello che sta dentro i commenti, dentro <style> e dentro <script>
     (li' una faccina puo' essere un appunto per chi scrive il codice)
   - quello che sta DENTRO un tag, per esempio alt="🏠": li' una icona
     romperebbe la pagina
   - le frecce → ← e i trattini: non sono faccine

   COME SI USA
     node sostituisci-emoji.js            <- fa vedere cosa cambierebbe
     node sostituisci-emoji.js --scrivi   <- scrive davvero

   Alla fine dice anche se ha trovato faccine che non sa ancora
   tradurre, cosi' si aggiunge l'icona che manca e si rilancia.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const CARTELLA = __dirname;
const SCRIVI = process.argv.includes('--scrivi');

/* ---------- le icone, stesso stile della home ---------- */
const D = {
  casa:     '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  palazzo:  '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M2 9h20"/>',
  negozio:  '<path d="M3 9h18l-1.5 11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z"/><path d="M3 9 5 3h14l2 6"/><path d="M9 13h6"/>',
  chiave:   '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  goccia:   '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  vasca:    '<path d="M4 12V5a2 2 0 0 1 4 0v1"/><path d="M2 12h20v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><path d="M6 19v2"/><path d="M18 19v2"/>',
  mattoni:  '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9.5h18"/><path d="M3 15h18"/><path d="M9 4v5.5"/><path d="M15 4v5.5"/><path d="M12 9.5V15"/><path d="M7 15v5"/><path d="M17 15v5"/>',
  fulmine:  '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  neve:     '<path d="M12 2v20"/><path d="M2 12h20"/><path d="m5 5 14 14"/><path d="m19 5-14 14"/>',
  sole:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
  finestra: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/>',
  piastr:   '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  rullo:    '<rect x="3" y="2" width="16" height="6" rx="2"/><path d="M11 15v-2a2 2 0 0 1 2-2h6a2 2 0 0 0 2-2V6"/><rect x="9" y="15" width="4" height="7" rx="1"/>',
  fiamma:   '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  foglio:   '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  blocco:   '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  scontrino:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M16 8H8"/><path d="M16 12H8"/>',
  euro:     '<path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  calc:     '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h2"/><path d="M14 11h2"/><path d="M8 16h2"/><path d="M14 16h2"/>',
  lente:    '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  lampadina:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  avviso:   '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  check:    '<path d="M20 6 9 17l-5-5"/>',
  ics:      '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  megafono: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  fumetto:  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  casco:    '<path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/>',
  freccia:  '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  squadra:  '<path d="M3 3v16a2 2 0 0 0 2 2h16z"/><path d="M8 16v-4"/><path d="M12 16v-2"/>',
  pin:      '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  stella:   '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  gemma:    '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/><path d="m12 21 4-12-3-6"/><path d="m12 21-4-12 3-6"/>',
  grafico:  '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  calendario:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  telefono: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/>',
  busta:    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
  lucchetto:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  orologio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  razzo:    '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1 0-2.9a2 2 0 0 0-3-.1z"/><path d="M12 15 9 12a15 15 0 0 1 8-9 15 15 0 0 1-3 11z"/><path d="M9 12H6s.3-2.2 1.5-3.4C8.6 7.4 12 7 12 7"/><path d="M12 15v3s2.2-.3 3.4-1.5C16.6 15.4 17 12 17 12"/>',
  bersaglio:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  persona:  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  persone:  '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  attrezzi: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  coppa:    '<path d="M6 4h12v5a6 6 0 0 1-12 0z"/><path d="M6 6H4a2 2 0 0 0 2 4"/><path d="M18 6h2a2 2 0 0 1-2 4"/><path d="M9 20h6"/><path d="M12 15v5"/>',
  mappa:    '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
  mani:     '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 1 0-2.8l.8-.8a2 2 0 0 1 2.8 0L21 9"/><path d="m21 3-5 5"/><path d="M3 9l3.5-3.5a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L6 13"/>',
  valigetta:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
  scatola:  '<path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
  scala:    '<path d="M6 2v20"/><path d="M18 2v20"/><path d="M6 6h12"/><path d="M6 11h12"/><path d="M6 16h12"/>',
  cantiere: '<path d="M3 8h18v10H3z"/><path d="m3 8 4-4h10l4 4"/><path d="m7 8 5 10"/><path d="m17 8-5 10"/>',
  pollice:  '<path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/><path d="M7 10l4-8a2 2 0 0 1 3 1.8V8h4.5a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17 19H7"/>',
  cuore:    '<path d="M19 5.5a5 5 0 0 0-7 0l-1 1-1-1a5 5 0 0 0-7 7l8 8 8-8a5 5 0 0 0 0-7z"/>',
  serratura:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/>',
  festa:    '<path d="M4 21 8.5 8.5 17 17z"/><path d="M15 5a2 2 0 0 1 2-2"/><path d="M21 9a2 2 0 0 0-2 2"/><circle cx="19" cy="5" r="1"/><circle cx="14" cy="10" r="1"/>',
  carta:    '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  divieto:  '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  regalo:   '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v14"/><path d="M5 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/><path d="M12 8C12 8 11 3 8 3a2.5 2.5 0 0 0 0 5"/><path d="M12 8s1-5 4-5a2.5 2.5 0 0 1 0 5"/>',
  campana:  '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
  ingranaggio:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 7 2.6h.1A2 2 0 1 1 11 2.6V3a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/>',
  domanda:  '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  computer: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  penna:    '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  libro:    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  medaglia: '<circle cx="12" cy="15" r="6"/><path d="m8.2 9.5-3-6.5h13.6l-3 6.5"/>',
  cestino:  '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  camion:   '<path d="M14 17V5H2v12h2"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  cassetta: '<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 13h20"/>',
  catena:   '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  scarica:  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  carica:   '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 9 5-5 5 5"/><path d="M12 4v12"/>',
  cuffie:   '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  bussola:  '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
  mano:     '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8"/>',
  occhio:   '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  pallino:  '<circle cx="12" cy="12" r="6"/>',
  bandiera: '<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
  foto:     '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
};

/* ---------- quale faccina diventa quale icona ---------- */
const MAPPA = {
  '🏠': 'casa', '🏡': 'casa', '🏚️': 'casa', '🏚': 'casa', '🏘️': 'casa', '🏘': 'casa',
  '🏗️': 'casco', '🏗': 'casco', '🏢': 'palazzo', '🏬': 'palazzo', '🏪': 'negozio', '🏭': 'palazzo',
  '🔧': 'chiave', '🔩': 'chiave', '🛠️': 'attrezzi', '🛠': 'attrezzi', '🔨': 'attrezzi',
  '🚿': 'goccia', '🚰': 'goccia', '💧': 'goccia', '🛁': 'vasca',
  '🧱': 'mattoni', '⬛': 'piastr', '🟫': 'piastr', '🪵': 'mattoni',
  '⚡': 'fulmine', '🔌': 'fulmine', '❄️': 'neve', '❄': 'neve', '☀️': 'sole', '☀': 'sole', '🔥': 'fiamma',
  '🖼️': 'finestra', '🖼': 'finestra', '🪟': 'finestra', '🚪': 'serratura',
  '🎨': 'rullo', '🖌️': 'rullo', '🖌': 'rullo', '🖍️': 'rullo',
  '📄': 'foglio', '📃': 'foglio', '📝': 'foglio', '📋': 'blocco', '🧾': 'scontrino', '📑': 'foglio',
  '💶': 'euro', '💰': 'euro', '💵': 'euro', '💸': 'euro', '🪙': 'euro',
  '🧮': 'calc', '📐': 'squadra', '📏': 'squadra',
  '🔍': 'lente', '🔎': 'lente',
  '💡': 'lampadina', '⚠️': 'avviso', '⚠': 'avviso', '🚨': 'avviso', '⛔': 'ics',
  '✅': 'check', '✔️': 'check', '✔': 'check', '☑️': 'check', '❌': 'ics', '✖️': 'ics',
  '📣': 'megafono', '📢': 'megafono', '💬': 'fumetto', '🗨️': 'fumetto',
  '👷': 'casco', '👷‍♂️': 'casco', '👷‍♀️': 'casco',
  '👉': 'freccia', '👈': 'freccia', '➡️': 'freccia',
  '📍': 'pin', '🗺️': 'mappa', '🗺': 'mappa', '🌍': 'mappa', '🌎': 'mappa',
  '⭐': 'stella', '⭐️': 'stella', '🌟': 'stella', '✨': 'stella', '💎': 'gemma',
  '📊': 'grafico', '📈': 'grafico', '📉': 'grafico',
  '📅': 'calendario', '📆': 'calendario', '🗓️': 'calendario',
  '📞': 'telefono', '☎️': 'telefono', '📱': 'telefono',
  '✉️': 'busta', '📧': 'busta', '📨': 'busta', '📬': 'busta',
  '🔒': 'lucchetto', '🔐': 'lucchetto', '🛡️': 'lucchetto',
  '⏱️': 'orologio', '⏰': 'orologio', '🕐': 'orologio', '⌛': 'orologio', '⏳': 'orologio',
  '🚀': 'razzo', '🎯': 'bersaglio', '🏆': 'coppa',
  '👤': 'persona', '👥': 'persone', '🙋': 'persona', '🧑': 'persona',
  '🤝': 'mani', '💼': 'valigetta', '📦': 'scatola', '🪜': 'scala', '🚧': 'cantiere',
  '👍': 'pollice', '❤️': 'cuore', '💙': 'cuore',
  '🎉': 'festa', '🎊': 'festa', '🥳': 'festa',
  '💳': 'carta', '🏦': 'palazzo',
  '🚫': 'divieto', '🛑': 'divieto', '❗': 'avviso', '❓': 'domanda', 'ℹ️': 'info',
  '🎁': 'regalo', '🔔': 'campana', '🔕': 'campana',
  '⚙️': 'ingranaggio', '⚙': 'ingranaggio', '🔑': 'chiave',
  '💻': 'computer', '🖥️': 'computer', '🖥': 'computer',
  '✍️': 'penna', '✏️': 'penna', '🖊️': 'penna',
  '📖': 'libro', '📚': 'libro', '🎓': 'libro',
  '🥇': 'medaglia', '🏅': 'medaglia',
  '🗑️': 'cestino', '🗑': 'cestino',
  '🚚': 'camion', '🚛': 'camion', '🚗': 'camion',
  '🧰': 'cassetta', '🪛': 'attrezzi', '🪚': 'attrezzi', '⛏️': 'attrezzi', '🪓': 'attrezzi',
  '🔗': 'catena', '📌': 'pin', '🌐': 'mappa', '🖐️': 'mani', '👏': 'mani', '🙌': 'mani',
  '➕': 'check', '🔄': 'ingranaggio', '🧑‍💼': 'persona', '🧑‍🔧': 'casco',
  '📥': 'scarica', '📤': 'carica', '⬇️': 'scarica', '⬆️': 'carica',
  '🎧': 'cuffie', '🧭': 'bussola', '👋': 'mano',
  '🚶': 'persona', '🧍': 'persona', '🏃': 'persona',
  '👀': 'occhio', '👁': 'occhio', '👁️': 'occhio',
  '🟢': 'pallino', '🔴': 'pallino', '🟡': 'pallino', '🔵': 'pallino',
  '🟠': 'pallino', '🟣': 'pallino', '⚪': 'pallino', '⚫': 'pallino',
  '🔹': 'pallino', '🔸': 'pallino', '🔶': 'pallino', '🔷': 'pallino',
  '🚩': 'bandiera', '🏁': 'bandiera', '🏳️': 'bandiera',
  '📷': 'foto', '📸': 'foto', '🖼': 'finestra',
  '🥈': 'medaglia', '🥉': 'medaglia'
};

const CSS = `<style>
/* 22 set 2026 — le icone disegnate al posto delle faccine.
   Dentro una frase: grandi come la riga e dello stesso colore del testo.
   Da sole in un riquadro (le schede delle guide, i due banner): grandi
   quanto era la faccina e del colore della scheda — blu, o arancione
   dove la scheda e' arancione. */
.ti-ic{width:1.1em;height:1.1em;vertical-align:-.18em;display:inline-block;flex:none}
.ti-ic-solo{width:1em;height:1em;vertical-align:-.08em;color:var(--hc,#0066ff)}
</style>
`;

function svg(nome, solo) {
  return '<svg class="ti-ic' + (solo ? ' ti-ic-solo' : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
       + 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
       + D[nome] + '</svg>';
}

/* la faccina sta DA SOLA dentro il suo riquadro? (…>🏠</div>) */
function daSola(s, i, lung) {
  let a = i - 1; while (a >= 0 && /\s/.test(s[a])) a--;
  let b = i + lung; while (b < s.length && /\s/.test(s[b])) b++;
  return s[a] === '>' && s[b] === '<';
}

/* zone da non toccare: commenti, <style>, <script> e l'interno dei tag.
   22 set 2026 — segnate su una mappa di caselle (una per lettera) invece
   che in una lista da riscorrere ogni volta: con le pagine grosse la
   lista mandava lo script in stallo per minuti. */
function mascheraProtetta(s) {
  const m = new Uint8Array(s.length);
  const pats = [/<!--[\s\S]*?-->/g, /<style[^>]*>[\s\S]*?<\/style>/g,
                /<script[^>]*>[\s\S]*?<\/script>/g, /<[^>]*>/g];
  for (const p of pats) {
    p.lastIndex = 0;
    let x;
    while ((x = p.exec(s))) m.fill(1, x.index, x.index + x[0].length);
  }
  return m;
}

/* le faccine che non sappiamo ancora tradurre: le segnaliamo e basta */
const RE_FACCINE = /[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;
const FRECCE = new Set(['→', '←', '↑', '↓', '➔', '↔']);

const CHIAVI = Object.keys(MAPPA).sort((a, b) => b.length - a.length);

function lavora(file) {
  const fp = path.join(CARTELLA, file);
  const s0 = fs.readFileSync(fp, 'utf8');
  const prot = mascheraProtetta(s0);

  const pezzi = [];
  let i = 0, n = 0, ultimo = 0;
  while (i < s0.length) {
    /* quasi tutte le lettere non sono faccine: si saltano subito */
    if (prot[i] || s0.charCodeAt(i) < 0x2190) { i++; continue; }
    let preso = false;
    for (const em of CHIAVI) {
      if (s0.startsWith(em, i)) {
        pezzi.push(s0.slice(ultimo, i), svg(MAPPA[em], daSola(s0, i, em.length)));
        i += em.length; ultimo = i; n++; preso = true; break;
      }
    }
    if (!preso) i++;
  }
  if (!n) return { n: 0, restano: [] };
  pezzi.push(s0.slice(ultimo));
  let out = pezzi.join('');

  if (!out.includes('.ti-ic{')) out = out.replace('</head>', CSS + '</head>', 1);

  /* cosa e' rimasto fuori dalla mappa? */
  const prot2 = mascheraProtetta(out);
  const restano = new Set();
  let m;
  RE_FACCINE.lastIndex = 0;
  while ((m = RE_FACCINE.exec(out))) {
    if (prot2[m.index]) continue;
    if (FRECCE.has(m[0]) || m[0] === '\uFE0F') continue;
    restano.add(m[0]);
  }

  if (SCRIVI) fs.writeFileSync(fp, out, 'utf8');
  return { n, restano: [...restano] };
}

const files = fs.readdirSync(CARTELLA)
  .filter(f => f.endsWith('.html') && !f.startsWith('.'));
console.log(`Pagine da controllare: ${files.length}\n`);
let tot = 0, tocc = 0;
const sconosciute = new Map();

for (const f of files) {
  const r = lavora(f);
  if (!r.n) continue;
  tot += r.n; tocc++;
  if (tocc <= 40) console.log(`  ${f} — ${r.n}`);
  r.restano.forEach(e => sconosciute.set(e, (sconosciute.get(e) || 0) + 1));
}
if (tocc > 40) console.log(`  … e altre ${tocc - 40} pagine`);

console.log(`\nPagine toccate: ${tocc} · Faccine sostituite: ${tot}`);
if (sconosciute.size) {
  console.log('\nFaccine SENZA icona (da aggiungere alla mappa):');
  [...sconosciute.entries()].sort((a, b) => b[1] - a[1])
    .forEach(([e, k]) => console.log(`  ${e}  in ${k} pagine`));
}
if (!SCRIVI) console.log('\n(prova a vuoto: non ho scritto niente. Rilancia con --scrivi)');
