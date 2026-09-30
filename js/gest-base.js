// [SPOSTATO] gest-base.js: era dentro gest-core.js, righe 1-421, spostato identico. Il resto del codice e' ancora in gest-core.js.
/* ═══ 29 settembre 2026 — IL CODICE DELLA PAGINA, FUORI DALLA PAGINA ═══════════
   Questo era dentro gestionale-app.html: 12.600 righe, 725 KB di JavaScript
   nello stesso file del disegno. Adesso sta qui, IDENTICO, riga per riga.

   PERCHE'
   - il browser tiene da parte il codice gia' letto (anche in forma compilata)
     e non lo rilegge ogni volta che si apre la pagina: piu' veloce sul telefono;
   - una modifica al disegno (HTML) non fa piu' riscaricare 725 KB di codice;
   - i confronti fra versioni (diff) diventano leggibili.

   ⚠️ NON CAMBIA NIENTE nel modo di funzionare: gira nello stesso punto e nello
      stesso ordine di prima (dopo gest-fatture.js... e prima di ai-integrazione.js).
      Le variabili «const»/«let» di questo file le vedono gli altri js, come prima.
   ⚠️ Chi legge il codice della pagina da un programma (le prove in
      prove-claude/) ora deve leggere ANCHE questo file.
   ═════════════════════════════════════════════════════════════════════════ */
  const KEY="gestionale_multiservizi_v5";
  /* ⛔ 24 settembre 2026 — IL GIRO («Fai un giro» sulla pagina /gestionale).
     Con ?giro=1 il gestionale mostra un'impresa FINTA piena di dati finti
     (Rossi, Bianchi srl...). Si guarda senza account: il database lascia
     leggere a tutti SOLO le righe di GIRO_UID (regola giro_demo_lettura) e
     non lascia scrivere niente a nessuno su quelle righe.
     ⚠️ In giro il quaderno locale (window.storage) vive solo in memoria:
        se no i reparti finti finirebbero nel browser di chi ha un account vero. */
  /* 24 set 2026 — tre giri, uno per mestiere: ?giro=1&tipo=artigiano|impresa|professionista */
  const GIRI={impresa:"de770000-0000-4000-8000-000000000001",artigiano:"de770000-0000-4000-8000-000000000002",professionista:"de770000-0000-4000-8000-000000000003"};
  const GIRO_TIPO=GIRI[new URLSearchParams(location.search).get("tipo")]?new URLSearchParams(location.search).get("tipo"):"impresa";
  const GIRO_UID=GIRI[GIRO_TIPO];
  const TI_GIRO=new URLSearchParams(location.search).get("giro")==="1";
  window.TI_GIRO=TI_GIRO;
  if(TI_GIRO){const _m={};window.storage={get:async k=>(k in _m?{value:_m[k]}:null),set:async(k,v)=>{_m[k]=v;return{value:v};},delete:async k=>{delete _m[k];return{deleted:true};}};}
  /* ⚠️ 21 agosto 2026 — LE ICONE DEL REPARTO: 14 -> 50, E DIVISE PER MESTIERE.
     Erano quattordici in fila, senza un titolo: chi apriva la finestra doveva
     guardarle una per una. Adesso stanno in sei gruppi con il nome sopra.
     ⛔ SI SCRIVONO CON IL SELETTORE DI VARIANTE (il carattere invisibile dopo
        certe emoji: 🏗️ ⛏️ ❄️ ☀️ 🖌️ 🏛️ 🗺️ 🛠️ 🏷️ 🪶). Senza, Windows le
        disegna in BIANCO E NERO come quadratini: e' esattamente quello che e'
        successo il 10 agosto con 🏷, ed e' il motivo per cui erano state
        tolte tutte. Il problema era la scrittura, non le emoji.
     ⛔ NON TOGLIERE un'icona da questa lista: i reparti gia' creati tengono
        l'emoji dentro `gest_mestieri.icona`, e se sparisce di qui la card
        resta senza niente. Aggiungere si', togliere no. */
  const ICONE_GRUPPI=[
    ["Muratura e struttura", ["🧱","🏗️","🚧","⛏️","🏠","🏢","🏭"]],
    ["Impianti",             ["🔌","⚡","💡","🚿","💧","🔥","❄️","🛁","📡","🔋"]],
    ["Finiture",             ["🎨","🖌️","🚪","🧽","🖼️","🛋️","🧴"]],
    ["Esterni e verde",      ["🌳","🌿","🌱","🌻","🧹","🏊","🚜","☀️"]],
    ["Studio tecnico",       ["📐","📏","📋","🏛️","🗺️","📷","🔍","📊","🦺","📝"]],
    ["Generiche",            ["🛠️","🔧","🧰","🚚","📦","🏷️","🔨","⭐"]]
  ];

  /* ⛔ 21 agosto 2026 — LE SETTE CHE IL COMPUTER NON SA DISEGNARE.
     Alessio ha aperto la tendina e sette icone erano QUADRATINI BIANCHI:
     scala, pietra, legno, sega, finestra, specchio, pianta in vaso. Stanno
     tutte nel blocco Unicode U+1FA70..U+1FAFF (2019-2021), e il Segoe UI
     Emoji del suo Windows non ce l'ha. Tolte dalla lista.
     ⛔ NIENTE EMOJI DI QUEL BLOCCO, mai: il banco lo controlla numero per
        numero. (La prima volta fu il 10 agosto con 🏷.)
     E poi il passo vero: le emoji non le disegniamo noi, percio' non si
     possono migliorare. Adesso le disegniamo. Vedi qui sotto. */

  /* =====================================================================
     21 agosto 2026 — LE ICONE DEL REPARTO, DISEGNATE DA NOI
     =====================================================================
     Alessio ha scelto lo stile 2 fra tre proposte: disegno a tratto, del
     colore del reparto.

     ⛔ PERCHE' NON PIU' LE EMOJI. Le emoji non le disegniamo noi: le
        disegna Windows. Quindi non si possono migliorare, e quelle che il
        computer non ha escono come QUADRATINI BIANCHI — ne sono usciti
        sette in faccia ad Alessio il 21 agosto (scala, pietra, legno,
        sega, finestra, specchio, pianta). Con un disegno nostro il
        problema non esiste: e' identico su ogni computer.

     ⛔ LA CHIAVE RESTA L'EMOJI, e non e' pigrizia: i reparti gia' creati
        hanno l'emoji dentro `gest_mestieri.icona`. Tenendola come chiave
        non serve spostare nessun dato: cambia solo cosa si disegna.

     ⚠️ Chiave sconosciuta (un reparto vecchio con un'emoji che non e' piu'
        in lista) -> si disegna il martello. Mai un buco. */
  const ICO_REPARTO={
    /* ---- muratura e struttura ---- */
    "🧱":'<rect x="2" y="5" width="20" height="14" rx="1"/><path d="M2 12h20"/><path d="M9 5v7"/><path d="M16 5v7"/><path d="M5.5 12v7"/><path d="M12.5 12v7"/><path d="M19 12v7"/>',
    "🏗️":'<path d="M4 21h6"/><path d="M7 21V2"/><path d="M3 5h16"/><path d="m7 2 8 3"/><path d="M15 5v5"/><path d="M13.6 10c0 1.4 2.8 1.4 2.8 0"/>',
    "🚧":'<path d="M12 3 6.5 18h11L12 3Z"/><path d="M3.5 21h17"/><path d="M9.8 11h4.4"/><path d="M8.4 15h7.2"/>',
    "⛏️":'<path d="m4 20 8-8"/><path d="M8 8.5C11.5 4.5 17 5 19.5 9.5"/><path d="m12 12 5-2"/>',
    "🏠":'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V13h6v9"/>',
    "🏢":'<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 6h1"/><path d="M14 6h1"/><path d="M9 10h1"/><path d="M14 10h1"/><path d="M9 14h1"/><path d="M14 14h1"/><path d="M10 22v-4h4v4"/>',
    "🏭":'<path d="M3 21h18"/><path d="M4 21V10l6 4V10l6 4V6h4v15"/><path d="M8 21v-4"/><path d="M14 21v-4"/>',
    /* ---- impianti ---- */
    "🔌":'<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M6 8h12v4a6 6 0 0 1-12 0Z"/>',
    "⚡":'<path d="M13 2 3 14h7l-1 8 11-12h-7l1-8z"/>',
    "💡":'<path d="M15 14c.2-1 .7-1.7 1.5-2.5A5 5 0 0 0 12 3a5 5 0 0 0-4.5 8.5c.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    "🚿":'<path d="M4 21V6a3 3 0 0 1 3-3h1"/><path d="M8 3h4"/><path d="M10 3v4"/><path d="M6 7h8l-2 4H8Z"/><path d="M8 15v.01"/><path d="M11 17v.01"/><path d="M14 14v.01"/><path d="M12 21v.01"/><path d="M16 19v.01"/>',
    "💧":'<path d="M12 2.7c3.5 3.6 6 6.7 6 10.1a6 6 0 0 1-12 0c0-3.4 2.5-6.5 6-10.1Z"/>',
    "🔥":'<path d="M12 2c1 4-2 5-2 8a4 4 0 0 0 8 0c0-2-1-3-2-4 3 2 5 5 5 8a9 9 0 0 1-18 0c0-5 5-7 9-12Z"/>',
    "❄️":'<path d="M12 2v20"/><path d="m4 7 16 10"/><path d="m20 7-16 10"/><path d="M9 5l3-3 3 3"/><path d="M9 19l3 3 3-3"/>',
    "🛁":'<path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 12V5a2 2 0 0 1 4 0"/><path d="M7 19l-1 3"/><path d="M17 19l1 3"/>',
    "📡":'<path d="M4 20 20 4"/><path d="M12 12a9 9 0 0 0-9-9"/><path d="M9 15a5 5 0 0 0-5-5"/><path d="M6 18a2 2 0 0 0-2-2"/><path d="m14 10 6 6-3 3-6-6z"/>',
    "🔋":'<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2"/><path d="M9 10v4"/><path d="M7 12h4"/>',
    /* ---- finiture ---- */
    "🎨":'<path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 0-4 4 4 0 0 1 4-4h2a4 4 0 0 0 4-4c0-4.4-4.5-8-10-8Z"/><path d="M7.5 10v.01"/><path d="M10 6.5v.01"/><path d="M14.5 6.5v.01"/><path d="M17.5 10v.01"/>',
    "🖌️":'<path d="M14 3 21 10"/><path d="m17 6-8.5 8.5a3 3 0 0 0-.8 1.4L7 19l3-.7a3 3 0 0 0 1.4-.8L20 9"/><path d="M6 18c-1.5.5-2.5 2-3 4 2-.5 3.5-1.5 4-3"/>',
    "🚪":'<rect x="5" y="2" width="14" height="20" rx="1"/><path d="M15 12v.01"/><path d="M3 22h18"/>',
    "🧽":'<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M3 14h18"/><path d="M8 8V6a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v2"/>',
    "🖼️":'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 16-5-5-6 6-2-2-5 5"/>',
    "🛋️":'<path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 14a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4H2Z"/><path d="M6 18v2"/><path d="M18 18v2"/>',
    "🧴":'<path d="M9 7h6a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a3 3 0 0 1 3-3Z"/><path d="M10 7V4h4v3"/><path d="M6 12h12"/>',
    /* ---- esterni e verde ---- */
    "🌳":'<path d="M12 20v-6"/><path d="M9 14a5 5 0 0 1-2-9.5 4.5 4.5 0 0 1 8-1 4 4 0 0 1 2 7.6A4 4 0 0 1 15 14Z"/><path d="M8 20h8"/>',
    "🌿":'<path d="M4 21c2-7 7-12 15-13"/><path d="M19 8c0 6-4 10-9 10-2 0-3-1-3-3 0-5 5-8 12-7Z"/>',
    "🌱":'<path d="M12 21v-8"/><path d="M12 13C12 8 8 6 4 6c0 5 4 7 8 7Z"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6Z"/>',
    "🌻":'<circle cx="12" cy="12" r="3"/><path d="M12 5V2"/><path d="M12 22v-3"/><path d="M5 12H2"/><path d="M22 12h-3"/><path d="m7 7-2-2"/><path d="m19 19-2-2"/><path d="m7 17-2 2"/><path d="m19 5-2 2"/>',
    "🧹":'<path d="m9.5 14.5 8-8a2.1 2.1 0 1 1 3 3l-8 8"/><path d="M9 15c-2 0-5 1-6 6 3 0 6-1 8-4Z"/><path d="m12 12 3 3"/>',
    "🏊":'<path d="M2 18c1.5 0 1.5 1.5 3 1.5S6.5 18 8 18s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5"/><path d="M2 13c1.5 0 1.5 1.5 3 1.5S6.5 13 8 13s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5"/><circle cx="17" cy="6" r="2"/><path d="m5 10 5-3 4 2"/>',
    "🚜":'<circle cx="7" cy="17" r="4"/><circle cx="18" cy="18" r="3"/><path d="M7 13V8h5l2 5"/><path d="M12 8V5h4"/><path d="M11 17h4"/>',
    "☀️":'<circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.9 4.9 2.1 2.1"/><path d="m17 17 2.1 2.1"/><path d="m4.9 19.1 2.1-2.1"/><path d="m17 7 2.1-2.1"/>',
    /* ---- studio tecnico ---- */
    "📐":'<path d="M4 4v16h16"/><path d="M4 4 20 20"/><path d="M4 12h4"/><path d="M12 12v4"/>',
    "📏":'<rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v3"/><path d="M10 8v5"/><path d="M14 8v3"/><path d="M18 8v5"/>',
    "📋":'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6"/><path d="M9 15h4"/>',
    "🏛️":'<path d="M3 22h18"/><path d="m12 3 9 6H3Z"/><path d="M6 19v-8"/><path d="M10 19v-8"/><path d="M14 19v-8"/><path d="M18 19v-8"/>',
    "🗺️":'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
    "📷":'<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="4"/>',
    "🔍":'<circle cx="11" cy="11" r="7"/><path d="m20 20-4.3-4.3"/>',
    "📊":'<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12.5" y="8" width="3" height="10"/><rect x="18" y="5" width="3" height="13"/>',
    "🦺":'<path d="M8 3 4 5v16h16V5l-4-2"/><path d="M8 3v7l4 3 4-3V3"/><path d="M4 12h4"/><path d="M16 12h4"/>',
    "📝":'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    /* ---- generiche ---- */
    "🛠️":'<path d="m15 12-8.5 8.5a2.1 2.1 0 1 1-3-3L12 9"/><path d="m17.6 3.2 3.4 3.3-2 2-3.4-3.4z"/><path d="m14 7 3 3"/>',
    "🔧":'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-8 8l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 8-8l-3.8 3.8z"/>',
    "🧰":'<rect x="2" y="8" width="20" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 13h20"/><path d="M10 13v3h4v-3"/>',
    "🚚":'<path d="M2 6h11v11H2Z"/><path d="M13 9h4l3 3v5h-7Z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
    "📦":'<path d="M3 8 12 3l9 5v8l-9 5-9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    "🏷️":'<path d="M20.6 12.4 12.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6Z"/><path d="M7 7h.01"/>',
    "🔨":'<path d="m14 8-9 9a2.1 2.1 0 0 0 3 3l9-9"/><path d="M11 5 16 0"/><path d="m12 3 5 5-3 3-5-5z"/>',
    "⭐":'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
    /* ---- ⛔ FUORI LISTA, MA IL DISEGNO CI VUOLE LO STESSO ----
       Queste sette sono le emoji che Windows non sa disegnare: tolte dalla
       tendina il 21 agosto. Ma DUE di loro (la scala e la sega) erano fra
       le quattordici di prima, e un reparto puo\' averle gia\' salvate nel
       database. Se non avessero un disegno cadrebbero sulla riserva, e chi
       si era scelto la scala si ritroverebbe un martello.
       ⛔ Non si sceglie piu\', ma si disegna ancora. */
    "🪜":'<path d="M8 3v18"/><path d="M16 3v18"/><path d="M8 7.5h8"/><path d="M8 12h8"/><path d="M8 16.5h8"/>',
    "🪚":'<path d="M3 16h8l7-7-3-3-8 8z"/><path d="m18 6 3-3"/><path d="M5.5 16v2.5"/><path d="M9 16v2.5"/>',
    "🪨":'<path d="M4 15 8 6l7-2 5 6-3 8H7z"/><path d="m8 6 4 5"/>',
    "🪵":'<path d="M6 6h12a3 3 0 0 1 0 12H6a3 3 0 0 1 0-12Z"/><path d="M6 6a3 3 0 0 1 0 12"/><circle cx="6" cy="12" r="1.5"/>',
    "🪟":'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/>',
    "🪞":'<path d="M12 2c4 0 7 3.6 7 8s-3 8-7 8-7-3.6-7-8 3-8 7-8Z"/><path d="M12 18v3"/><path d="M9 21h6"/>',
    "🪴":'<path d="M6 13h12l-1.5 8h-9Z"/><path d="M12 13V9"/><path d="M12 9C12 5.5 9.5 3 6 3c0 3.5 2.5 6 6 6Z"/><path d="M12 10c0-3 2-5 5-5 0 3-2 5-5 5Z"/>'
  };
  /* ⚠️ chiave sconosciuta -> martello: un reparto vecchio non resta mai senza */
  const icoRep=e=>'<svg class="ico-rep" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    +'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    +(ICO_REPARTO[e]||ICO_REPARTO["🔨"])+'</svg>';
  /* la lista piatta, per chi deve solo sapere se un'emoji e' delle nostre */
  const ICONE=ICONE_GRUPPI.reduce((t,g)=>t.concat(g[1]),[]);
  const COLORI=[
    {a:"#2e629e",ad:"#1f497a",as:"#e6f4ec"},{a:"#2570c4",ad:"#1a539a",as:"#e6eefa"},
    {a:"#c0703a",ad:"#9c5526",as:"#f7ece2"},{a:"#7c3aed",ad:"#5b27b0",as:"#efe8fb"},
    {a:"#d6336c",ad:"#a51f52",as:"#fbe6ee"},{a:"#2a609d",ad:"#1f7268",as:"#e6f4f2"},
    {a:"#d99e00",ad:"#a87a00",as:"#fbf2d9"},{a:"#5a6670",ad:"#3f4850",as:"#eceef0"},
    /* ⚠️ 21 agosto 2026 — QUATTRO TINTE CHE NON C'ERANO.
       Degli otto qui sopra, QUATTRO erano lo stesso blu (#2e629e #2570c4
       #2a609d #5a6670) e due erano incoerenti: pallino blu e sfondo verde.
       ⛔ Quei otto NON si toccano, e non e' pigrizia: `a` e' la chiave con
          cui i reparti gia' creati si ritrovano la palette
          (`COLORI.find(c=>c.a===m.colore)` in renderLanding). Cambiarne uno
          scollegherebbe i reparti che l'hanno gia' addosso, e l'icona
          finirebbe scura su scuro. Se un giorno vanno sistemati, serve
          prima spostare i dati nel database — e' un lavoro suo.
       Qui sotto invece si AGGIUNGE, e aggiungere non rompe niente: verde,
       rosso mattone, verde-acqua e indaco. Ogni terna e' della stessa tinta
       (pallino, testo, sfondo), come dev'essere. */
    {a:"#2f9e5f",ad:"#1e7444",as:"#e4f5eb"},{a:"#c0392b",ad:"#93281c",as:"#fae7e4"},
    {a:"#0f8b8d",ad:"#0a6668",as:"#e0f2f2"},{a:"#4f46e5",ad:"#3730a3",as:"#eae8fd"}
  ];
  let nuovoSel={icon:"🛠️",col:0};
  let state={};
  let cur=null, filter={vista:"tutti",q:""}, cal=new Date(), editing=null, galFilter={op:"",tipo:"",media:"",lav:""}, agFilter={op:"",stato:"aperti"};
  const fotoCache={};

  const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
  const uid=()=>"id"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  /* useGrouping:true è esplicito apposta: senza, certi browser non mettono il
     punto delle migliaia e usciva "1000,00 €" invece di "1.000,00 €". */
  /* ⛔ 29 agosto 2026 - I CENTESIMI ANCHE QUI. eur() arrotondava all'euro:
     nel Riepilogo, nei Lavori, nei Preventivi, nelle Carte e nel Report un
     2.800,50 € si leggeva "2.800 €" e un 5,50 € diventava "6 €". Adesso ha
     i centesimi come le fatture. eurTondo() resta per le tacche dell'asse
     del grafico, dove i centesimi non ci starebbero. */
  const eur=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(+n||0);
  const eurTondo=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0,useGrouping:true}).format(n||0);
  const fdate=d=>{if(!d)return"—";const[y,m,g]=d.split("-");return g+"/"+m+"/"+y;};
  /* 11 agosto 2026 — L'OROLOGIO DI GREENWICH FACEVA VIVERE IERI.
     Prima: new Date().toISOString().slice(0,10). toISOString dà l'ora di
     Greenwich, che d'estate è indietro di due ore rispetto all'Italia. Fra
     mezzanotte e le due il gestionale era ancora al GIORNO PRIMA: una scadenza
     segnata all'una di notte nasceva già di ieri, un lavoro di oggi risultava
     "in ritardo", e la lettera d'incarico stampava la data sbagliata sul foglio
     che firma il cliente. Adesso si legge l'orologio del telefono, come fa già
     _giorniDopo. */
  const todayStr=()=>{const d=new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  const thisMonth=d=>d&&d.slice(0,7)===todayStr().slice(0,7);
  const ymd=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const statoLabel={da_fare:"Da fare",in_corso:"In corso",fatto:"Fatto"};
  /* Lavoro in ritardo: data prevista già passata e non ancora fatto.
     Il rosso (--err) è riservato SOLO a questo caso; il "da fare" normale è ambra (--attesa). */
  const inRitardo=(stato,data)=>!!data&&stato!=="fatto"&&data<todayStr();
  const mesi=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  const esc=s=>(s==null?"":String(s)).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const db=()=>state[cur];
  const cliById=id=>db().clienti.find(c=>c.id===id);
  /* 12 agosto 2026 (sera) — dipById tolta: leggeva db().dipendenti, l'archivio
     locale del primo gestionale, che da quando la squadra sta su Supabase resta
     vuoto per sempre. Tornava sempre "niente", e chi la usava finiva per
     stampare l'id della persona al posto del nome. La squadra vera e'
     dipCache (gest_operatori). */
  const curMestiere=()=>{const p=(state.panels||[]).find(x=>x.id===cur);return p?p.mestiere_id:null;};
  /* ⛔ 29 agosto 2026 — L'UNICA RIGA CHE ESCE DALLA CLOSURE.
     Tutto questo file vive dentro una closure: da fuori `sb` e
     `curMestiere` non si vedono. E' scritto in cima a
     js/ai-integrazione.js, che infatti si arrangia leggendo il titolo
     della pagina per sapere il reparto.
     Alla chat il NOME del reparto non basta: le serve l'id, perche' e'
     con quello che la function filtra i dati. Quindi si presta la
     funzione, non lo stato: chi la chiama legge, non scrive. */
  window.curMestiere=curMestiere;
  let cliCache=[]; /* clienti del reparto corrente, da gest_clienti (Supabase) */
  /* ⛔ 4 settembre 2026 — I CLIENTI SENZA REPARTO SI VEDONO OVUNQUE.
     Dal 24 agosto il Noleggio scrive i clienti nuovi SENZA mestiere_id, col
     commento «lo vede comunque tutta l'azienda, in ogni reparto». Non era
     vero: qui ogni lettura chiedeva .eq("mestiere_id", reparto), e un vuoto
     non e' mai uguale a un reparto. Un cliente nato dal Noleggio non
     compariva ne' in Clienti ne' nelle tendine di lavori, preventivi e
     fatture. Adesso un cliente senza reparto e' un cliente DELL'AZIENDA e
     si vede in tutti i reparti. Un posto solo per la regola: chi legge i
     clienti di un reparto passa di qui, non riscrive il filtro. */
  const _cliOr=m=>"mestiere_id.eq."+m+",mestiere_id.is.null";
  let dipCache=[]; /* squadra del reparto corrente: id,nome,telefono,ruolo,permessi (gest_operatori + gest_membri) */

  if(!window.storage){window.storage={get:async k=>{const v=localStorage.getItem(k);return v===null?null:{value:v};},set:async(k,v)=>{localStorage.setItem(k,v);return{value:v};},delete:async k=>{localStorage.removeItem(k);return{deleted:true};}};}
  async function load(){
    try{const r=await window.storage.get(KEY);if(r&&r.value)state=JSON.parse(r.value);}catch(e){}
    state.azienda=state.azienda||{num:1};
    state.panels=state.panels||[];
    state.panels.forEach(p=>{
      if(!state[p.id])state[p.id]={clienti:[],dipendenti:[],lavori:[],note:{}};
      const b=state[p.id];
      b.clienti=b.clienti||[];b.dipendenti=b.dipendenti||[];b.lavori=b.lavori||[];b.note=b.note||{};
      b.lavori.forEach(l=>{if(!l.fattStato)l.fattStato=l.pagato?"pagata":"none";});
    });
    await save();
    backfillMestieri();
  }
  async function save(){try{await window.storage.set(KEY,JSON.stringify(state));}catch(e){toast("Errore salvataggio");}}
  /* ---- gli errori del database arrivano in inglese tecnico: qui vengono
     tradotti in italiano semplice prima di finire sotto gli occhi dell'utente ---- */
  function traduciErrore(s){
    if(window.TI_GIRO)return "questo è il giro di prova con dati finti: qui non si salva niente. Per usarlo col tuo lavoro provalo gratis 30 giorni";
    const M=[
      [/row-level security|violates row-level/i,"il database ha bloccato la scrittura. Esci e rientra, poi riprova"],
      [/Failed to fetch|NetworkError|network error|fetch failed|Load failed/i,"la connessione non risponde. Controlla la rete e riprova"],
      [/JWT|token.*expired|invalid claim|not authenticated|No API key|refresh_token/i,"la sessione è scaduta: esci e rientra"],
      [/duplicate key|unique constraint/i,"esiste già un elemento uguale"],
      [/Could not find the .+ column|column .* does not exist|schema cache/i,"manca un aggiornamento del database (colonna non trovata)"],
      [/violates foreign key/i,"un collegamento non torna: ricarica la pagina e riprova"],
      [/timeout|timed out|57014/i,"il database non ha risposto in tempo. Riprova"],
      [/permission denied/i,"permessi insufficienti: esci e rientra, poi riprova"]
    ];
    for(const p of M){
      if(p[0].test(s)){const i=s.indexOf(":");return (i>0&&i<30?s.slice(0,i+1)+" ":"Errore: ")+p[1];}
    }
    return s;
  }
  /* Il messaggio capisce da solo se è un errore (resta 5 secondi, rosso)
     o una conferma (verde). Prima tutto spariva in 1,9 secondi. */
  function toast(m){
    const t=$("#toast"), s=String(m);
    const isErr=/^(errore|non salvat|non eliminat|non rimoss|nota non|attenzione|le vecchie voci)/i.test(s)||/manca la migrazione/i.test(s);
    const isOk=/[✔✅📌]/.test(s);
    t.textContent=_msgPro(isErr?traduciErrore(s):s);
    t.classList.remove("ok","err");
    if(isErr)t.classList.add("err");else if(isOk)t.classList.add("ok");
    t.classList.add("show");
    clearTimeout(t._t);
    t._t=setTimeout(()=>t.classList.remove("show"),isErr?5000:2600);
  }
  /* Solo professionista: i testi dei toast/confirm passano dalla mappa _FRASI (un solo punto qui).
     Artigiano e negozio restano invariati. Non tocca il contenuto utente già interpolato (numeri, nomi). */
  function _msgPro(m){return ruoloUtente==='professionista'?_swapPratiche(String(m)):m;}
  function gconfirm(m){return confirm(_msgPro(m));}

  /* ---- librerie pesanti caricate al primo uso (stesso pattern di mpCaricaLeaflet).
     Se il download fallisce si riprova al clic successivo. ---- */
  function _caricaScript(src){
    return new Promise(resolve=>{
      const s=document.createElement("script");
      s.src=src;s.onload=()=>resolve(true);s.onerror=()=>resolve(false);
      document.head.appendChild(s);
    });
  }
  let _pdfProm=null,_xlsProm=null;
  function caricaJsPDF(){
    if(window.jspdf)return Promise.resolve(true);
    if(!_pdfProm)_pdfProm=_caricaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js").then(ok=>{if(!ok)_pdfProm=null;return ok;});
    return _pdfProm;
  }
  function caricaXLSX(){
    if(window.XLSX)return Promise.resolve(true);
    if(!_xlsProm)_xlsProm=_caricaScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js").then(ok=>{if(!ok)_xlsProm=null;return ok;});
    return _xlsProm;
  }

  /* Passo 1 separazione reparti: ogni panel ha un mestiere_id (gest_mestieri) */
  let mestieriBackfilled=false;
  async function backfillMestieri(){
    if(mestieriBackfilled||!sb||!sbUid||!state.panels)return;
    const need=state.panels.filter(p=>!p.mestiere_id);
    mestieriBackfilled=true;
    if(!need.length)return;
    const used=new Set(state.panels.map(p=>p.mestiere_id).filter(Boolean));
    const {data:existing}=await sb.from("gest_mestieri").select("id,nome").eq("user_id",sbUid);
    const squadra=(existing||[]).find(m=>m.nome==="Squadra"&&!used.has(m.id));
    let squadraId=squadra?squadra.id:null, changed=false;
    for(const p of need){
      let mid=null;
      if(squadraId){mid=squadraId;squadraId=null;}
      else{
        const {data:m,error}=await sb.from("gest_mestieri").insert({user_id:sbUid,nome:p.nome,icona:p.icon,colore:p.a,ordine:0}).select().single();
        if(error){toast("Errore reparto: "+error.message);continue;}
        mid=m.id;
      }
      p.mestiere_id=mid;changed=true;
    }
    if(changed){await save();if(!cur)renderLanding();}
  }

  /* ⛔ 4 settembre 2026 — I REPARTI FANTASMA.
     Il browser ricordava un reparto che nel database non c'era piu' (era
     stato cancellato, magari da un altro computer) e all'apertura ci entrava
     dritto: menu, riepilogo, tutto normale. Ma ogni salvataggio falliva —
     il database rifiuta una riga attaccata a un reparto che non esiste — e
     il messaggio dava la colpa a un aggiornamento del database mai fatto.
     Visto dal vivo il 3 settembre.

     ⚠️ PERCHE' NON STA DENTRO renderLanding, dove l'avevo messo prima.
     Chi rientra nel reparto di ieri non passa MAI da renderLanding con
     l'utente gia' noto: `_authRefresh` fa «se sono dentro un reparto
     ridisegna, se no disegna i reparti», e chi e' dentro non disegna i
     reparti. Il controllo era li' e non partiva: il banco era verde e la
     pagina vera no. Adesso sta qui, e lo chiama _authRefresh appena sa chi
     e' l'utente — dentro o fuori da un reparto.

     I reparti senza mestiere_id non si toccano: sono i vecchi, solo locali,
     e ci pensa backfillMestieri. Se la rete non risponde non si tocca
     niente e si riprova al giro dopo: meglio un reparto di troppo che un
     reparto buono buttato via per una connessione storta. */
  let _repartiPuliti=false;
  async function pulisciRepartiSpariti(){
    /* ⛔ SI CHIAMA DA DUE PUNTI, e non e' una svista.
       Servono due cose per lavorare: sapere CHI e' l'utente (l'auth) e avere
       in mano i reparti del browser (load()). Arrivano in ordine diverso a
       ogni apertura: Supabase spesso risponde per primo, leggendo il gettone
       gia' salvato, e allora `state.panels` non c'e' ancora. La prima volta
       che manca un pezzo si esce SENZA segnare niente, cosi' la chiamata
       dell'altro punto rifa' il giro. Se si segnasse «fatto» qui, il
       controllo non girerebbe mai — ed e' esattamente quello che e'
       successo il 4 settembre sul sito vero, con il banco verde. */
    if(_repartiPuliti||!sb||!sbUid||!state.panels)return;
    /* ⛔ SI LEGGE COL CESTINO APERTO (_sbTutto), non con sb.from.
       Un reparto BUTTATO NEL CESTINO non e' un reparto sparito: si recupera
       quando si vuole, e finche' sta li' deve restare anche nella memoria del
       browser. sb.from salta le righe eliminate, quindi avrebbe dato per
       morto un reparto solo cestinato. Misurato il 4 settembre sull'account
       di Alessio: «pulizia» ed «elettricista» sono nel cestino dal 21 agosto,
       e devono restare dove sono. Qui muore solo quello che nel database non
       c'e' proprio piu'. */
    const {data:mest,error}=await _sbTutto("gest_mestieri").select("id,eliminato_il").eq("user_id",sbUid);
    if(error||!mest)return;
    _repartiPuliti=true;
    const vivi=new Set(mest.map(m=>String(m.id)));
    /* ⛔ 18 settembre 2026 — LA BANDIERINA DEL CESTINO.
       Questa lettura è l'unica del gestionale che vede anche i reparti
       cestinati: è l'unico posto da cui si può sapere chi è nel cestino senza
       una seconda chiamata. La schermata dei reparti la legge in
       _landingDisegna. */
    const inCestino=new Set(mest.filter(m=>m.eliminato_il).map(m=>String(m.id)));
    let segnati=false;
    state.panels.forEach(p=>{
      const c=!!(p.mestiere_id&&inCestino.has(String(p.mestiere_id)));
      if(!!p.cestinato!==c){p.cestinato=c;segnati=true;}
    });
    const morti=state.panels.filter(p=>p.mestiere_id&&!vivi.has(String(p.mestiere_id)));
    if(!morti.length){
      if(segnati){await save();if(!cur)renderLanding();}
      return;
    }
    const nomeAperto=(morti.find(p=>p.id===cur)||{}).nome||null;
    state.panels=state.panels.filter(p=>morti.indexOf(p)<0);
    morti.forEach(p=>{delete state[p.id];});
    await save();
    if(nomeAperto){
      try{localStorage.removeItem(GEST_ULTIMO);}catch(e){}
      toast("Il reparto «"+nomeAperto+"» non esiste più: scegli un altro reparto");
      goHome();
    }else if(!cur)renderLanding();
  }

  /* SUPABASE — solo per il tab Squadra (riusa gestionale-config.html) */
  const SUPA_URL="https://nacvrsgkyfavykxjxszu.supabase.co";
  const SUPA_KEY="sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R";
  const sb=window.supabase?window.supabase.createClient(SUPA_URL,SUPA_KEY):null;
  /* Da qui in poi "cancella" vuol dire "metti da parte": vedi js/cestino.js */
  if(sb&&window.attivaCestino)window.attivaCestino(sb);
  let sbUid=null;
  /* 27 set 2026 — il logo dell'impresa in cima (js/gest-logo.js) */
  if(window.gestLogoAvvia)window.gestLogoAvvia(sb,()=>sbUid);

