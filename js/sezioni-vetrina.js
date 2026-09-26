/* =====================================================================
   LA GRAFICA DI «FOTO DEI LAVORI» E «MESSAGGI» NEI PANNELLI
   (26 settembre 2026 — Alessio: «si puo' migliorare la grafica?»,
   «queste linee lunghe e piatte»)

   Lo caricano i tre pannelli: impresa, artigiano, professionisti.
   NON riscrive le funzioni che c'erano: salvare una foto, aprire una
   conversazione, rispondere restano quelle di prima. Qui si fa soltanto:
   - si mette uno stile nuovo, valido SOLO dentro #sec-foto-lavori e
     #sec-messaggi (non esce dalle due sezioni);
   - si spostano gli elementi che c'erano gia', con i loro id, dentro
     riquadri piu' ordinati;
   - si aggiungono cose che si vedono e basta (anteprima della foto,
     l'iniziale del cliente, l'ora dell'ultimo messaggio).

   ⚠️ L'elenco delle foto gia' messe (#lista-lavori-foto) stava nel
      RIEPILOGO, lontano dal modulo per aggiungerle: qui si porta dentro
      «Foto dei lavori». La funzione che lo riempie
      (caricaListaLavoriFoto) lo cerca per id, quindi continua a funzionare.
   ⚠️ Le sezioni vanno a tutta pagina: Alex non vuole bordi vuoti ai lati.
   ===================================================================== */
(function () {
  'use strict';

  var CSS = '' +
  /* ---------- in comune ---------- */
  /* A TUTTA PAGINA (Alex, 26 set sera: «la preferisco a tutta pagina, non i bordi vuoti ai lati»).
     Prima: al centro, max 1240 px. Niente tetto di larghezza. */
  '#sec-foto-lavori.active,#sec-messaggi.active,#sec-prezzi.active,#sec-dashboard.active{max-width:none;margin-left:0;margin-right:0}' +
  /* la freccia Indietro dentro il titolo prendeva il carattere del titolo (con le grazie) */
  '.section .ti-back{font-family:\'DM Sans\',Arial,sans-serif}' +

  /* ---------- RIEPILOGO (26 set 2026) ----------
     - a tutta pagina, come le altre sezioni;
     - la copertina NON si tocca: resta 2,5:1 come la scheda pubblica (il tetto
       di 320 px tagliava il personaggio di Alex, 26 set sera: tolto);
     - numeri e carte SENZA la striscia colorata in cima (ogni carta aveva
       un colore diverso, senza un significato: e' la stessa regola gia'
       decisa per il riepilogo del gestionale, il 20 agosto);
     - carte in riga (icona a sinistra, scritte a destra) invece che
       impilate e centrate: meno alte, si leggono da sinistra come un elenco.
     ⚠️ Le due carte doppie (offerte di lavoro, subappalti) hanno lo stile
        scritto dentro l'HTML: per loro si sistemano i due mezzi, non la carta. */
  '#sec-dashboard .dash-stat-card{border-top:1px solid #e3e8ef !important;border:1px solid #e3e8ef;box-shadow:0 6px 20px rgba(10,42,77,.06)}' +
  '#sec-dashboard .dash-quick-title{font-size:15px;letter-spacing:.8px;color:#475569;margin:26px 0 12px}' +
  '#sec-dashboard .dash-quick-grid{gap:14px}' +
  '#sec-dashboard .dash-quick-card{border:1px solid #e3e8ef !important;box-shadow:0 6px 20px rgba(10,42,77,.06);border-radius:16px}' +
  '#sec-dashboard .dash-quick-card:hover{border-color:#0066ff !important;box-shadow:0 10px 26px rgba(10,42,77,.12)}' +
  '#sec-dashboard .dash-quick-card:not([data-card-id="lavoro"]):not([data-card-id="subappalto"]){display:grid;' +
    'grid-template-columns:52px minmax(0,1fr);grid-template-rows:auto auto;column-gap:14px;align-items:center;text-align:left;padding:16px 18px;min-height:86px}' +
  '#sec-dashboard .dash-quick-card .dash-quick-icon{grid-row:1 / span 2;width:52px;height:52px;border-radius:14px;background:#eef4ff;color:#0066ff;' +
    'display:flex;align-items:center;justify-content:center;margin:0;font-size:24px}' +
  '#sec-dashboard .dash-quick-card .dash-quick-icon svg{width:26px;height:26px}' +
  '#sec-dashboard .dash-quick-card .dash-quick-label{font-size:17px;font-weight:800;color:#0f172a;align-self:end;line-height:1.3}' +
  '#sec-dashboard .dash-quick-card .dash-quick-sub{font-size:15px;color:#5f6b7a;align-self:start;margin-top:2px;line-height:1.35}' +
  /* ⚠️ colonna scritta a mano: con la sola riga, la scritta veniva messa per prima nella colonna stretta */
  '#sec-dashboard .dash-quick-card .dash-quick-icon{grid-column:1}' +
  '#sec-dashboard .dash-quick-card .dash-quick-label,#sec-dashboard .dash-quick-card .dash-quick-sub{grid-column:2}' +
  '#sec-dashboard .dash-quick-card:not([data-card-id="lavoro"]):not([data-card-id="subappalto"]) .dash-quick-label:last-child{grid-row:1 / span 2;align-self:center}' +
  /* le due carte doppie */
  '#sec-dashboard .dash-quick-card[data-card-id="lavoro"]>a,#sec-dashboard .dash-quick-card[data-card-id="subappalto"]>a{display:grid !important;' +
    'grid-template-columns:44px minmax(0,1fr);column-gap:12px;align-items:center;text-align:left !important;padding:16px !important}' +
  '#sec-dashboard .dash-quick-card[data-card-id="lavoro"] .dash-quick-icon,#sec-dashboard .dash-quick-card[data-card-id="subappalto"] .dash-quick-icon{' +
    'grid-row:1;width:44px;height:44px;border-radius:12px}' +
  '#sec-dashboard .dash-quick-card[data-card-id="lavoro"] .dash-quick-label,#sec-dashboard .dash-quick-card[data-card-id="subappalto"] .dash-quick-label{font-size:16px}' +
  '@media(max-width:820px){#sec-dashboard .dash-quick-grid{grid-template-columns:1fr !important}' +
    '#sec-dashboard .dash-quick-card:not([data-card-id="lavoro"]):not([data-card-id="subappalto"]){min-height:74px;padding:14px}}' +

  /* ---------- I DUE GESTIONALI, AFFIANCATI (26 set 2026) ----------
     Prima: due riquadri enormi uno SOTTO l'altro, ognuno con tre carte alte
     →165← px in fila. Adesso: affiancati sul computer, e dentro ognuno le
     tre scelte sono righe basse (titolo, una riga, bottone a destra).
     ⛔ Resta tutto quello deciso il 13 set: stessa schermata per tutti,
        un solo arancione (Attiva), «Entra» verde in fondo. Cambia la forma,
        non cosa c'e' dentro ne' cosa fanno i bottoni. */
  '@media(min-width:1100px){#sec-dashboard #porte-gestionale{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:20px}}' +
  '#sec-dashboard .gest-porta{background:#fff;border:1px solid #e3e8ef;box-shadow:0 6px 20px rgba(10,42,77,.06);padding:20px}' +
  '#sec-dashboard .gest-mezzo{display:flex;flex-direction:column;align-items:center;margin:0 0 4px}' +
  '#sec-dashboard .gest-mezzo .gest-nome{font-family:\'DM Sans\',Arial,sans-serif;font-size:24px;font-weight:800;color:#0f172a}' +
  '#sec-dashboard .gest-mezzo .gest-emoji{margin-bottom:2px}' +
  '#sec-dashboard .gest-gruppo{margin-top:14px}' +
  '#sec-dashboard .gest-fila{grid-template-columns:minmax(0,1fr) !important;gap:10px}' +
  '#sec-dashboard .g-carta:not(.g-striscia){min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 190px;' +
    'grid-template-areas:"testa azione" "txt azione";column-gap:16px;row-gap:2px;align-items:center;padding:14px 16px}' +
  '#sec-dashboard .g-carta:not(.g-striscia) .g-testa{grid-area:testa;margin:0}' +
  '#sec-dashboard .g-carta:not(.g-striscia) .g-txt{grid-area:txt;font-size:15px;color:#475569}' +
  '#sec-dashboard .g-carta:not(.g-striscia) .g-azione{grid-area:azione;margin:0;padding:0;border:0}' +
  '#sec-dashboard .g-tit{font-size:18px}' +
  '#sec-dashboard .g-b{padding:11px 8px;font-size:15.5px;border-radius:10px}' +
  '#sec-dashboard .g-carta.g-striscia{grid-template-columns:auto minmax(0,1fr) 190px;gap:16px;padding:14px 16px}' +
  '@media(max-width:600px){#sec-dashboard .g-carta:not(.g-striscia){grid-template-columns:minmax(0,1fr);' +
    'grid-template-areas:"testa" "txt" "azione";row-gap:8px}' +
    '#sec-dashboard .g-carta.g-striscia{grid-template-columns:minmax(0,1fr)}}' +

  /* ---------- LA TUA GIORNATA (ex «Calendario & Orario», 26 set 2026) ----------
     Prima: orologio in una scatola enorme e vuota, meteo con le emoji,
     numeri del calendario piccoli, bordi e colori diversi per ogni pezzo.
     Adesso: in alto ora + data e meteo, sotto calendario e appunti, a destra
     la calcolatrice. Stessi bordi grigi delle altre carte, numeri grandi.
     ⚠️ SUL TELEFONO la calcolatrice era ROTTA: css/mobile.css mette a una
        colonna ogni griglia scritta nello stile (`[style*=grid-template-columns]`),
        anche i tasti. Il «=» restava in colonna 4 e i tasti diventavano
        stecchini. Qui le colonne si rimettono con un selettore piu' forte. */
  '#sec-dashboard .ti-giornata{padding:26px !important;border:1px solid #e3e8ef;box-shadow:0 6px 20px rgba(10,42,77,.06) !important}' +
  '#sec-dashboard .ti-giornata .tg-titolo{font-family:\'DM Sans\',Arial,sans-serif !important;font-size:22px !important;font-weight:800;margin-bottom:18px !important}' +
  '#sec-dashboard .ti-giornata .cal-section-grid{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,.95fr) !important;' +
    'grid-template-rows:auto 1fr !important;grid-template-areas:"ora meteo calc" "cal note calc";gap:16px !important}' +
  '#sec-dashboard .ti-giornata .tg-box{border:1px solid #e3e8ef !important;border-radius:16px !important;background:#fff !important;box-shadow:none !important}' +
  '#sec-dashboard .ti-giornata .tg-ora{grid-area:ora;flex-direction:column;align-items:flex-start !important;justify-content:center !important;padding:18px 22px !important;gap:4px}' +
  '#sec-dashboard .ti-giornata #cal-orologio{font-family:\'DM Sans\',Arial,sans-serif !important;font-size:44px !important;letter-spacing:1px !important;color:#0a2a4d !important;text-align:left !important;line-height:1.05;font-variant-numeric:tabular-nums}' +
  '#sec-dashboard .ti-giornata .tg-data{font-size:18px;font-weight:600;color:#5f6b7a}' +
  '#sec-dashboard .ti-giornata .tg-data::first-letter{text-transform:uppercase}' +
  '#sec-dashboard .ti-giornata .tg-meteo{grid-area:meteo;padding:18px 22px !important;gap:18px !important}' +
  '#sec-dashboard .ti-giornata #meteo-icona{width:52px;height:52px;flex:0 0 52px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:#fff6e0;color:#e8a317}' +
  '#sec-dashboard .ti-giornata #meteo-icona svg{width:32px;height:32px}' +
  '#sec-dashboard .ti-giornata #meteo-citta{font-size:17px !important;color:#0a2a4d !important}' +
  '#sec-dashboard .ti-giornata #meteo-temp{font-family:\'DM Sans\',Arial,sans-serif !important;font-size:30px !important;color:#0a2a4d !important;font-weight:800;line-height:1.1}' +
  '#sec-dashboard .ti-giornata #meteo-condizione{font-size:15px !important;color:#5f6b7a !important}' +
  '#sec-dashboard .ti-giornata .tg-cal{grid-area:cal}' +
  '#sec-dashboard .ti-giornata .tg-cal > div:first-child{padding:12px 16px !important}' +
  '#sec-dashboard .ti-giornata #cal-label{font-size:18px !important}' +
  '#sec-dashboard .ti-giornata .tg-cal button{font-size:28px !important;min-width:40px;min-height:40px !important}' +
  '#sec-dashboard .ti-giornata .calendar-header{background:#f3f6fa !important}' +
  '#sec-dashboard .ti-giornata .calendar-header > div{color:#5f6b7a !important;font-size:15px !important}' +
  '#sec-dashboard .ti-giornata #cal-griglia{background:#eef1f5 !important}' +
  '#sec-dashboard .ti-giornata #cal-griglia > div{font-size:17px !important;padding:10px 0 !important;min-height:46px;display:flex;align-items:center;justify-content:center}' +
  '#sec-dashboard .ti-giornata #cal-griglia > div > div{width:36px !important;height:36px !important;font-size:17px !important}' +
  '#sec-dashboard .ti-giornata .tg-note{grid-area:note;padding:18px !important;gap:12px !important}' +
  '#sec-dashboard .ti-giornata .tg-note > div:first-child,#sec-dashboard .ti-giornata .widget-calc-card > div:first-child{font-size:15px !important;color:#0a2a4d !important;letter-spacing:.6px}' +
  '#sec-dashboard .ti-giornata #widget-note{font-size:16px !important;min-height:96px;padding:12px !important;border-radius:12px !important;border-color:#d5dde8 !important}' +
  '#sec-dashboard .ti-giornata .tg-note > button{font-size:16px !important;padding:12px 18px !important;border-radius:12px !important}' +
  '#sec-dashboard .ti-giornata .widget-calc-card{grid-row:1 / span 2 !important;grid-column:3 !important;padding:18px !important}' +
  '#sec-dashboard .ti-giornata #wcalc-display{font-family:\'DM Sans\',Arial,sans-serif !important;font-size:32px !important;padding:14px 16px !important;border-radius:12px !important;background:#f3f6fa !important}' +
  '#sec-dashboard .ti-giornata .wcalc-keys{grid-template-columns:repeat(4,minmax(0,1fr)) !important;grid-auto-rows:minmax(52px,1fr) !important;gap:8px !important}' +
  '#sec-dashboard .ti-giornata .wcalc-btn{font-size:21px;border-radius:12px;min-height:0 !important}' +
  '#sec-dashboard .ti-giornata .wcalc-btn.wcalc-op{background:#eaf2ff;color:#0066ff}' +
  '@media(max-width:1100px){#sec-dashboard .ti-giornata .cal-section-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr) !important;' +
    'grid-template-areas:"ora meteo" "cal note" "calc calc"}' +
    '#sec-dashboard .ti-giornata .widget-calc-card{grid-row:3 !important;grid-column:1 / -1 !important}}' +
  '@media(max-width:768px){#sec-dashboard .ti-giornata{padding:16px !important}' +
    '#sec-dashboard .ti-giornata .cal-section-grid{grid-template-columns:minmax(0,1fr) !important;grid-template-areas:"ora" "meteo" "cal" "note" "calc";gap:12px !important}' +
    '#sec-dashboard .ti-giornata #cal-orologio{font-size:38px !important}' +
    '#sec-dashboard .ti-giornata .widget-calc-card{grid-row:5 !important;grid-column:1 !important}' +
    '#sec-dashboard .ti-giornata #cal-griglia > div{min-height:42px;padding:6px 0 !important}}' +

  /* ---------- LA MAPPA NEL MENU A SINISTRA (26 set 2026) ----------
     Le mattonelle di OpenStreetMap a quello zoom sono color pastello: nel menu
     sembrava sbiadita (Alex: «da' piu' colore alla mappa»). Si ravvivano i
     colori con un filtro, senza cambiare fornitore della mappa. */
  '#sidebar-map .leaflet-tile-pane{filter:saturate(1.9) contrast(1.12) brightness(.97)}' +
  '#sidebar-map{border:1px solid #e3e8ef;box-shadow:0 4px 14px rgba(10,42,77,.08)}' +

  /* ---------- FOTO DEI LAVORI ---------- */
  '#sec-foto-lavori .fl-card{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:26px;' +
    'box-shadow:0 8px 28px rgba(10,42,77,.08);margin:0 0 20px}' +
  '#sec-foto-lavori .fl-tit{font-size:20px;font-weight:800;color:#0f172a;margin:0 0 18px}' +
  '#sec-foto-lavori .fl-griglia{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:26px;align-items:start}' +
  '#sec-foto-lavori .fl-scatola{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;' +
    'height:380px;border:2.5px dashed #b8c4d6;border-radius:16px;background:#f5f8fc;cursor:pointer;overflow:hidden;' +
    'position:relative;text-align:center;padding:16px;transition:border-color .15s,background .15s}' +
  '#sec-foto-lavori .fl-scatola:hover{border-color:#0066ff;background:#eef4ff}' +
  '#sec-foto-lavori .fl-scatola svg{width:46px;height:46px;color:#0066ff}' +
  '#sec-foto-lavori .fl-scatola b{font-size:18px;color:#0f172a}' +
  '#sec-foto-lavori .fl-scatola small{font-size:15px;color:#5f6b7a}' +
  '#sec-foto-lavori .fl-scatola img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}' +
  '#sec-foto-lavori .fl-scatola.piena{border-style:solid;border-color:#0066ff}' +
  '#sec-foto-lavori .fl-scatola.piena img{display:block}' +
  '#sec-foto-lavori .fl-cambia{position:absolute;bottom:10px;right:10px;background:rgba(15,23,42,.8);color:#fff;' +
    'font-size:15px;font-weight:700;border-radius:999px;padding:7px 14px;display:none}' +
  '#sec-foto-lavori .fl-scatola.piena .fl-cambia{display:block}' +
  '#sec-foto-lavori #lav-foto-file{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}' +
  '#sec-foto-lavori #lav-foto-stato{font-size:15px;margin-top:8px;min-height:22px}' +
  '#sec-foto-lavori .fl-campi .form-group label{text-transform:none;letter-spacing:0;font-size:16px;color:#0f172a}' +
  '#sec-foto-lavori .fl-campi .form-group input,#sec-foto-lavori .fl-campi .form-group textarea{font-size:17px;padding:13px 15px}' +
  '#sec-foto-lavori .fl-aiuto{font-size:15px;color:#5f6b7a;margin:6px 0 0}' +
  '#sec-foto-lavori .fl-campi .btn-salva-annuncio{width:100%;font-size:18px;padding:15px}' +
  '#sec-foto-lavori .fl-elenco-tit{display:flex;align-items:baseline;gap:10px;font-size:20px;font-weight:800;color:#0f172a;margin:0 0 4px}' +
  '#sec-foto-lavori .fl-elenco-tit span{font-size:16px;color:#5f6b7a;font-weight:700}' +
  '#sec-foto-lavori .fl-elenco-sub{font-size:15px;color:#5f6b7a;margin:0}' +
  '#sec-foto-lavori .foto-grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px}' +
  '@media(max-width:820px){#sec-foto-lavori .fl-scatola{height:auto;aspect-ratio:4/3}#sec-foto-lavori .fl-griglia{grid-template-columns:1fr}#sec-foto-lavori .fl-card{padding:18px}' +
    '#sec-foto-lavori .foto-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}' +

  /* ---------- MESSAGGI ---------- */
  '#sec-messaggi #lista-conversazioni{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}' +
  '#sec-messaggi .msg-conv-aiuto,#sec-messaggi #lista-conversazioni .empty-state{grid-column:1/-1}' +
  '#sec-messaggi .msg-conv-item{margin:0;padding:18px;border:1px solid #e3e8ef;border-radius:16px;background:#fff;' +
    'box-shadow:0 6px 20px rgba(10,42,77,.07);align-items:flex-start}' +
  '#sec-messaggi .msg-conv-item:hover{border-color:#0066ff;box-shadow:0 10px 26px rgba(10,42,77,.12)}' +
  '#sec-messaggi .msg-conv-item.nuovo{border-color:#ff8800;background:#fffaf3}' +
  '#sec-messaggi .msg-conv-sx{display:flex;gap:14px;align-items:flex-start;flex:1}' +
  '#sec-messaggi .mv-avatar{flex:none;width:48px;height:48px;border-radius:50%;background:#e8f0ff;color:#0052cc;' +
    'display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}' +
  '#sec-messaggi .mv-testi{min-width:0;flex:1}' +
  '#sec-messaggi .msg-conv-ultimo{max-width:none;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.45}' +
  '#sec-messaggi .mv-quando{font-size:14px;color:#5f6b7a;margin-top:6px;font-weight:600}' +
  '#sec-messaggi .msg-conv-dx{flex-direction:column;align-items:flex-end;gap:8px}' +
  '#sec-messaggi .msg-badge{background:#ff8800;height:24px;line-height:24px;padding:0 10px;border-radius:999px;font-size:14px}' +
  /* la conversazione aperta */
  '#sec-messaggi #chat-aperta{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:18px;box-shadow:0 8px 28px rgba(10,42,77,.08)}' +
  '#sec-messaggi .mv-testa{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:0 0 14px;margin:0 0 14px;border-bottom:1px solid #e3e8ef}' +
  '#sec-messaggi .mv-chi{display:flex;align-items:center;gap:12px;flex:1;min-width:200px}' +
  '#sec-messaggi .mv-chi b{display:block;font-size:19px;color:#0f172a}' +
  '#sec-messaggi .mv-chi small{display:block;font-size:15px;color:#5f6b7a}' +
  '#sec-messaggi .mv-azioni{display:flex;gap:8px;flex-wrap:wrap}' +
  '#sec-messaggi .mv-azioni button{margin:0 !important;background:#fff !important;border:1.5px solid #cbd5e1 !important;' +
    'color:#334155 !important;border-radius:10px !important;padding:9px 14px !important;font-size:15px !important}' +
  '#sec-messaggi .mv-azioni #btn-blocco-cliente{color:#b42318 !important;border-color:#f1c0bb !important}' +
  '#sec-messaggi .msg-messages{background:#f4f7fb;border:none;border-radius:14px;min-height:320px;max-height:60vh;padding:18px}' +
  '#sec-messaggi .msg-bubble{max-width:72%;font-size:17px;box-shadow:0 2px 6px rgba(10,42,77,.06)}' +
  '#sec-messaggi .msg-bubble-meta{font-size:13.5px}' +
  '#sec-messaggi .msg-input-row{gap:10px}' +
  '#sec-messaggi .msg-input-row input{flex:1;font-size:17px;padding:14px 16px;border:1.5px solid #cbd5e1;border-radius:12px;font-family:inherit}' +
  '#sec-messaggi .msg-input-row button{font-size:17px;font-weight:800;padding:0 24px;border-radius:12px;min-height:50px}' +
  '@media(max-width:820px){#sec-messaggi #lista-conversazioni{grid-template-columns:1fr}' +
    '#sec-messaggi .msg-bubble{max-width:86%}#sec-messaggi #chat-aperta{padding:12px}}';

  var ICONA_FOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

  function gruppoDi(el) { return el && el.closest ? el.closest('.form-group') : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ------------------------------------------------------------------ */
  function foto() {
    var sec = document.getElementById('sec-foto-lavori');
    var file = document.getElementById('lav-foto-file');
    if (!sec || !file || sec.getAttribute('data-vetrina')) return;
    var vecchia = file.closest('.profilo-card');
    if (!vecchia) return;
    sec.setAttribute('data-vetrina', '1');

    var gTit = gruppoDi(document.getElementById('lav-titolo'));
    var gDesc = gruppoDi(document.getElementById('lav-descrizione'));
    var gFile = gruppoDi(file);
    var gPub = gruppoDi(document.getElementById('lav-pubblico'));
    var salva = vecchia.querySelector('.btn-salva-annuncio');
    var stato = document.getElementById('lav-foto-stato');
    var nascosto = document.getElementById('lav-foto');

    var card = document.createElement('div');
    card.className = 'fl-card';
    card.innerHTML = '<div class="fl-tit">Aggiungi un lavoro</div>' +
      '<div class="fl-griglia"><div class="fl-sx">' +
        '<label class="fl-scatola" for="lav-foto-file">' + ICONA_FOTO +
          '<b>Tocca per scegliere la foto</b><small>Dal telefono puoi scattarla subito</small>' +
          '<img alt="Anteprima della foto"><span class="fl-cambia">Cambia foto</span></label>' +
      '</div><div class="fl-campi"></div></div>';
    var sx = card.querySelector('.fl-sx');
    var campi = card.querySelector('.fl-campi');
    var scatola = card.querySelector('.fl-scatola');
    var anteprima = scatola.querySelector('img');

    /* si spostano gli elementi VERI, con i loro id e i loro onchange */
    sx.appendChild(file);
    if (nascosto) sx.appendChild(nascosto);
    if (stato) sx.appendChild(stato);
    if (gTit) {
      campi.appendChild(gTit);
      var l1 = gTit.querySelector('label'); if (l1) l1.textContent = 'Titolo del lavoro';
      var a1 = document.createElement('p'); a1.className = 'fl-aiuto';
      a1.textContent = 'Cosa hai fatto e dove, per esempio «Rifacimento bagno a Rieti».';
      gTit.appendChild(a1);
    }
    if (gDesc) {
      campi.appendChild(gDesc);
      var l2 = gDesc.querySelector('label'); if (l2) l2.textContent = 'Due righe di spiegazione';
      var ta = gDesc.querySelector('textarea'); if (ta) { ta.placeholder = 'Es. Tolte le vecchie piastrelle, nuovo impianto, doccia a filo pavimento.'; ta.style.minHeight = '110px'; }
    }
    if (gPub) campi.appendChild(gPub);
    if (salva) campi.appendChild(salva);
    if (gFile) gFile.remove();
    vecchia.replaceWith(card);

    /* l'anteprima: si mostra appena scelta, prima ancora che finisca di salire */
    var urlVecchio = null;
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (urlVecchio) { URL.revokeObjectURL(urlVecchio); urlVecchio = null; }
      if (f) { urlVecchio = URL.createObjectURL(f); anteprima.src = urlVecchio; scatola.classList.add('piena'); }
      else { anteprima.removeAttribute('src'); scatola.classList.remove('piena'); }
    });
    /* dopo «Salva» il pannello svuota i campi da solo: qui si svuota anche l'anteprima */
    if (typeof window.salvaLavoroFoto === 'function' && !window.salvaLavoroFoto.__vetrina) {
      var prima = window.salvaLavoroFoto;
      var nuova = async function () {
        var r = await prima.apply(this, arguments);
        if (nascosto && !nascosto.value) { anteprima.removeAttribute('src'); scatola.classList.remove('piena'); }
        return r;
      };
      nuova.__vetrina = true;
      window.salvaLavoroFoto = nuova;
      if (salva) salva.setAttribute('onclick', 'salvaLavoroFoto()');
    }

    /* l'elenco delle foto gia' messe: dal riepilogo a qui */
    var griglia = document.getElementById('lista-lavori-foto');
    if (griglia) {
      var box = griglia.parentNode;
      var elenco = document.createElement('div');
      elenco.className = 'fl-card';
      elenco.innerHTML = '<div class="fl-elenco-tit">Le tue foto <span id="fl-quante"></span></div>' +
        '<p class="fl-elenco-sub">La prima è quella che il cliente vede per prima. Con ⭐ scegli tu quale.</p>';
      elenco.appendChild(griglia);
      sec.appendChild(elenco);
      /* il vecchio riquadro del riepilogo, rimasto col solo titolo, si toglie */
      if (box && !box.querySelector('.foto-grid')) box.remove();
      var conta = function () {
        var n = [].filter.call(griglia.children, function (c) { return !c.classList.contains('empty-state'); }).length;
        var q = document.getElementById('fl-quante');
        if (q) q.textContent = n ? '(' + n + ')' : '';
      };
      new MutationObserver(conta).observe(griglia, { childList: true });
      conta();
    }
  }

  /* ------------------------------------------------------------------ */
  /* le tre carte che avevano un'emoji al posto dell'icona disegnata
     (Alessio non vuole emoji: regola dell'8 agosto) */
  var ICONE_CARTE = {
    'qr-profilo': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    'priorita': '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    'video-azienda': '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>'
  };
  function riepilogo() {
    Object.keys(ICONE_CARTE).forEach(function (id) {
      var ic = document.querySelector('#sec-dashboard .dash-quick-card[data-card-id="' + id + '"] .dash-quick-icon');
      if (ic && !ic.querySelector('svg')) {
        ic.innerHTML = '<svg class="ti-ic ti-ic-solo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
          'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONE_CARTE[id] + '</svg>';
      }
    });
  }

  function quando(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    var oggi = new Date(), ieri = new Date(Date.now() - 864e5);
    var ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === oggi.toDateString()) return 'Oggi alle ' + ora;
    if (d.toDateString() === ieri.toDateString()) return 'Ieri alle ' + ora;
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + ' alle ' + ora;
  }

  function abbellisciLista(rows) {
    var ultimi = {};
    (rows || []).forEach(function (m) { if (!ultimi[m.conversation_id]) ultimi[m.conversation_id] = m; });
    document.querySelectorAll('#sec-messaggi .msg-conv-item').forEach(function (it) {
      if (it.querySelector('.mv-avatar')) return;
      var sx = it.querySelector('.msg-conv-sx'); if (!sx) return;
      var nome = (it.getAttribute('data-nome') || 'Cliente').trim();
      var av = document.createElement('div'); av.className = 'mv-avatar';
      av.textContent = (nome.charAt(0) || '?').toUpperCase();
      var testi = document.createElement('div'); testi.className = 'mv-testi';
      while (sx.firstChild) testi.appendChild(sx.firstChild);
      var u = ultimi[it.getAttribute('data-conv')];
      if (u && u.created_at) {
        var q = document.createElement('div'); q.className = 'mv-quando';
        q.textContent = (u.mittente === 'impresa' ? 'Hai risposto · ' : '') + quando(u.created_at);
        testi.appendChild(q);
      }
      sx.appendChild(av); sx.appendChild(testi);
      if (it.querySelector('.msg-badge')) it.classList.add('nuovo');
    });
  }

  function messaggi() {
    var sec = document.getElementById('sec-messaggi');
    var aperta = document.getElementById('chat-aperta');
    if (!sec || !aperta || sec.getAttribute('data-vetrina')) return;
    sec.setAttribute('data-vetrina', '1');

    /* la testa della conversazione aperta: Indietro, chi e', e i due
       pulsanti (togli dall'elenco, blocca) piccoli a destra */
    /* ⚠️ js/freccia-indietro.js parte PRIMA e trasforma gia' «← Torna alle
       conversazioni» in un pulsante .ti-back: si cerca l'uno o l'altro */
    var torna = aperta.querySelector('a[onclick*="tornaAConversazioni"]') || aperta.querySelector('.ti-back');
    var togli = aperta.querySelector('button[onclick*="togliConversazioneDalMioElenco"]');
    var blocca = document.getElementById('btn-blocco-cliente');
    var testa = document.createElement('div'); testa.className = 'mv-testa';
    var indietro = document.createElement('button');
    indietro.type = 'button'; indietro.className = 'ti-back';
    indietro.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span>Tutte le conversazioni</span>';
    indietro.addEventListener('click', function () { if (typeof window.tornaAConversazioni === 'function') window.tornaAConversazioni(); });
    var chi = document.createElement('div'); chi.className = 'mv-chi';
    chi.innerHTML = '<div class="mv-avatar" id="mv-av"></div><div><b id="mv-nome"></b><small id="mv-email"></small></div>';
    var az = document.createElement('div'); az.className = 'mv-azioni';
    if (togli) az.appendChild(togli);
    if (blocca) az.appendChild(blocca);
    testa.appendChild(indietro); testa.appendChild(chi); testa.appendChild(az);
    if (torna) torna.replaceWith(testa); else aperta.insertBefore(testa, aperta.firstChild);

    if (typeof window.apriConversazione === 'function' && !window.apriConversazione.__vetrina) {
      var primaApri = window.apriConversazione;
      var nuovaApri = function (convId, nome, email) {
        var r = primaApri.apply(this, arguments);
        var n = (nome || 'Cliente').trim();
        var a = document.getElementById('mv-av'); if (a) a.textContent = (n.charAt(0) || '?').toUpperCase();
        var b = document.getElementById('mv-nome'); if (b) b.textContent = n;
        var e = document.getElementById('mv-email'); if (e) e.textContent = email || '';
        return r;
      };
      nuovaApri.__vetrina = true;
      window.apriConversazione = nuovaApri;
    }
    if (typeof window.renderListaConversazioni === 'function' && !window.renderListaConversazioni.__vetrina) {
      var primaLista = window.renderListaConversazioni;
      var nuovaLista = function (rows) {
        var r = primaLista.apply(this, arguments);
        try { abbellisciLista(rows); } catch (e) { console.error('messaggi grafica:', e); }
        return r;
      };
      nuovaLista.__vetrina = true;
      window.renderListaConversazioni = nuovaLista;
    }
  }


  /* LA TUA GIORNATA: dà i nomi ai pezzi (per il CSS), mette la data sotto
     l'ora e cambia le emoji del meteo in disegni come il resto del pannello. */
  var METEO_SVG = {
    sole: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    nuvola: '<path d="M17.5 19H8a5 5 0 1 1 1.3-9.8A6 6 0 0 1 20.8 12 3.5 3.5 0 0 1 17.5 19z"/>',
    pioggia: '<path d="M16 13H8a4 4 0 1 1 1-7.9A5 5 0 0 1 18.6 7 3 3 0 0 1 16 13z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
    neve: '<path d="M16 12H8a4 4 0 1 1 1-7.9A5 5 0 0 1 18.6 6 3 3 0 0 1 16 12z"/><path d="M8 16h.01M12 18h.01M16 16h.01M10 21h.01M14 21h.01"/>',
    tuono: '<path d="M16 12H8a4 4 0 1 1 1-7.9A5 5 0 0 1 18.6 6 3 3 0 0 1 16 12z"/><path d="m13 14-3 4h4l-3 4"/>',
    nebbia: '<path d="M4 9h16M4 13h16M6 17h12"/>',
    posto: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    no: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'
  };
  var EMOJI_METEO = { '☀️':'sole','⛅':'nuvola','☁️':'nuvola','🌫️':'nebbia','🌦️':'pioggia','🌧️':'pioggia',
    '🌨️':'neve','❄️':'neve','⛈️':'tuono','📍':'posto','❌':'no','🌡️':'sole' };
  function iconaMeteo(el) {
    if (!el || el.querySelector('svg.tg-m')) return;
    var t = (el.textContent || '').trim();
    var nome = EMOJI_METEO[t] || (t ? 'sole' : null);
    if (!nome) return;
    el.innerHTML = '<svg class="tg-m" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + METEO_SVG[nome] + '</svg>';
    el.style.color = nome === 'sole' ? '#e8a317' : (nome === 'posto' || nome === 'no') ? '#5f6b7a' : '#3a78d6';
    el.style.background = nome === 'sole' ? '#fff6e0' : '#eef4ff';
  }
  function giornata() {
    var griglia = document.querySelector('#sec-dashboard .cal-section-grid');
    if (!griglia || griglia.parentNode.classList.contains('ti-giornata')) return;
    var blocco = griglia.parentNode;
    blocco.classList.add('ti-giornata');
    var tit = blocco.firstElementChild;
    if (tit && tit !== griglia) {
      tit.classList.add('tg-titolo');
      for (var i = tit.childNodes.length - 1; i >= 0; i--) {
        var n = tit.childNodes[i];
        if (n.nodeType === 3 && /Calendario/.test(n.textContent)) { n.textContent = ' La tua giornata'; break; }
      }
    }
    function metti(sel, cls) { var e = document.querySelector(sel); var box = e && e.closest('.cal-section-grid > div'); if (box) box.classList.add('tg-box', cls); return box; }
    var ora = metti('#cal-orologio', 'tg-ora');
    metti('#meteo-icona', 'tg-meteo');
    metti('#cal-griglia', 'tg-cal');
    metti('#widget-note', 'tg-note');
    metti('.wcalc-keys', 'tg-calc');
    if (ora && !ora.querySelector('.tg-data')) {
      var d = document.createElement('div'); d.className = 'tg-data';
      var scrivi = function () { d.textContent = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); };
      scrivi(); setInterval(scrivi, 60000);
      ora.appendChild(d);
    }
    var mi = document.getElementById('meteo-icona');
    if (mi) {
      iconaMeteo(mi);
      new MutationObserver(function () { iconaMeteo(mi); }).observe(mi, { childList: true, characterData: true, subtree: true });
    }
  }


  /* LA MAPPA DEL MENU PARTE DALLA CITTA' DELL'IMPRESA (26 set 2026).
     Prima partiva sempre da mezza Europa, tagliata. Adesso si centra sulla
     citta' del profilo, con un puntino blu. Coordinate: quelle gia' salvate
     nel profilo (lat/lng); se mancano, si cercano UNA volta per citta' su
     OpenStreetMap (Nominatim) e si tengono in memoria nel browser. */
  function mappaCitta() {
    var tentativi = 0;
    function metti(lat, lng) {
      var m = window.sidebarMap;
      if (!m || !window.L || !isFinite(lat) || !isFinite(lng)) return;
      m.setView([lat, lng], 10);
      if (!m.__tiPunto) {
        m.__tiPunto = L.circleMarker([lat, lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#0066ff', fillOpacity: 1 }).addTo(m);
      } else m.__tiPunto.setLatLng([lat, lng]);
    }
    function cerca(citta) {
      var chiave = 'ti_geo_' + citta.toLowerCase();
      try { var c = JSON.parse(localStorage.getItem(chiave) || 'null'); if (c) { metti(c[0], c[1]); return; } } catch (e) {}
      fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&accept-language=it&q=' + encodeURIComponent(citta))
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (a) {
          if (!a || !a[0]) return;
          var lat = parseFloat(a[0].lat), lng = parseFloat(a[0].lon);
          try { localStorage.setItem(chiave, JSON.stringify([lat, lng])); } catch (e) {}
          metti(lat, lng);
        }).catch(function () {});
    }
    (function aspetta() {
      var imp = (typeof impresaCorrente !== 'undefined') ? impresaCorrente : null;
      if (window.sidebarMap && imp) {
        var lat = parseFloat(imp.lat), lng = parseFloat(imp.lng);
        if (isFinite(lat) && isFinite(lng) && (lat || lng)) { metti(lat, lng); return; }
        var citta = String(imp.citta || '').trim();
        if (citta) { cerca(citta); return; }
      }
      if (++tentativi < 40) setTimeout(aspetta, 500);
    })();
  }

  function parti() {
    var st = document.createElement('style'); st.id = 'sezioni-vetrina-css'; st.textContent = CSS;
    document.head.appendChild(st);
    try { foto(); } catch (e) { console.error('foto grafica:', e); }
    try { riepilogo(); } catch (e) { console.error('riepilogo grafica:', e); }
    try { messaggi(); } catch (e) { console.error('messaggi grafica:', e); }
    try { giornata(); } catch (e) { console.error('giornata grafica:', e); }
    try { mappaCitta(); } catch (e) { console.error('mappa citta:', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti);
  else parti();
})();
