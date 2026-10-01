// [SPOSTATO] op-base.js: era dentro op-core.js, righe 1-268, spostato identico.
/* ═══ 29 settembre 2026 — IL CODICE DELL'AGENDA OPERAIO, FUORI DALLA PAGINA ═══
   Questo era dentro gestionale-operatore.html, dentro il tag script della pagina.
   E' IDENTICO, riga per riga: e' stato solo spostato. Gira nello stesso
   punto della pagina, quindi vede le stesse cose di prima.
   ═════════════════════════════════════════════════════════════════════════ */
/* ===== Supabase =====
   Se la pagina non si connette, copia SUPA_URL e SUPA_KEY
   IDENTICI da gestionale-invito.html (lì funzionano di sicuro). */
const SUPA_URL="https://nacvrsgkyfavykxjxszu.supabase.co";
const SUPA_KEY="sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R";
/* ⚠️ 19 agosto 2026 — SENZA LINEA L'APP MORIVA MUTA.
   Qui c'era `supabase.createClient(...)` e basta. Ma la libreria arriva
   da internet (la riga <script> in cima alla pagina), e in cantiere la
   linea non c'e' sempre: se quel file non arrivava, questa riga lanciava
   un errore e TUTTO il resto dello script non partiva mai. Risultato:
   pagina bianca, nessun messaggio, e l'operaio che non sa cosa fare —
   proprio nel posto dove serve di piu' e dove il campo c'e' di meno.
   Adesso si controlla, e se manca si dice cos'e' successo. */
const sb=window.supabase?window.supabase.createClient(SUPA_URL,SUPA_KEY):null;
/* Da qui in poi "cancella" vuol dire "metti da parte": vedi js/cestino.js */
if(sb&&window.attivaCestino)window.attivaCestino(sb);

const MIO={uid:null,impresaId:null,operatoreId:null,nome:"",permessi:{}};
let LAVORI=[], CLIENTI={}, selDate=ymd(new Date()), calY, calM, curLavoro=null;
let CLIENTI_LISTA=null;
let SCADENZE_LISTA=null;
let SCAD_CLIMAP={};
let FATTURE_LISTA=null;
let FATT_CLIMAP={};
let FATT_PDFCACHE={};
let fattUploadLavoroId=null;

const $=s=>document.querySelector(s);
const MESI=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
const DOW=["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function dataIt(s){if(!s)return"";const[a,m,g]=s.split("-");return g+"/"+m+"/"+a;}
function eur(n){return "€ "+(Number(n)||0).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2});}
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("on");setTimeout(()=>el.classList.remove("on"),2200);}
/* ===== 13 agosto 2026 — I CENTESIMI DELL'OPERAIO =====
   La casella dell'importo speso era type="number" con inputmode="decimal": il
   telefono faceva uscire il tasto VIRGOLA su una casella che la virgola non la
   accetta. L'operaio scriveva 12,50 e il browser restituiva "" — quindi o
   "Inserisci un importo valido" senza capire perche', o, su altri browser,
   1.250 € registrati sulla carta aziendale al posto di 12,50.
   E' lo stesso difetto chiuso il 12 agosto nel pannello del titolare e lasciato
   in piedi proprio nel file che si usa in cantiere, col guanto da lavoro.
   Adesso la casella e' di testo e il numero si legge all'italiana: virgola e
   punto valgono uguale, i punti delle migliaia si buttano, e se non c'e' un
   numero vero torna null invece di zero. */
/* ⚠️ COPIA VERBATIM di _numeroIt in gestionale-app.html (cerca "LA REGOLA DEI
   NUMERI"). I due file non condividono codice, quindi la copia e' inevitabile:
   se tocchi una, tocca anche l'altra. La prima versione scritta stanotte era
   piu' corta e divergeva gia' — sulla STESSA tabella del database, con lo
   stesso importo digitato: "1.250" dal pannello del titolare faceva 1250, dal
   telefono dell'operaio 1,25. Su una carta carburante 1.250 e' un importo che
   si scrive davvero. */
function _numIt(v){
  /* via euro, spazi normali, spazi insecabili e apostrofi delle migliaia */
  let t=String(v==null?"":v).replace(/[€\s '’]/g,"").trim();
  if(t==="")return null;
  const vir=t.lastIndexOf(","), pun=t.lastIndexOf(".");
  if(vir>=0&&pun>=0){
    if(vir>pun) t=t.replace(/\./g,"").replace(/,/g,".");   /* italiano */
    else        t=t.replace(/,/g,"");                      /* inglese  */
  }else if(vir>=0){
    /* piu' virgole e nessun punto = migliaia all'inglese (1,250,000) */
    t=((t.split(",").length-1)>1) ? t.replace(/,/g,"") : t.replace(",",".");
  }else if(pun>=0){
    const punti=t.split(".").length-1;
    const dopo=t.length-pun-1;
    /* prima dell'ultimo punto: se comincia per zero non sono migliaia
       (0.500 e' mezzo, non cinquecento) */
    const prima=t.slice(0,pun).replace(/\./g,"");
    const zeroDavanti=prima==="0"||prima==="-0"||/^-?0/.test(prima);
    if(punti>1||(dopo===3&&!zeroDavanti)) t=t.replace(/\./g,"");
  }
  const n=parseFloat(t);
  return isFinite(n)?n:null;
}
function show(v){
  $("#gate").classList.toggle("hidden",v!=="gate");
  $("#app").classList.toggle("hidden",v==="gate");
  $("#view-agenda").classList.toggle("hidden",v!=="agenda");
  $("#view-lavoro").classList.toggle("hidden",v!=="lavoro");
  $("#view-clienti").classList.toggle("hidden",v!=="clienti");
  $("#view-scadenze").classList.toggle("hidden",v!=="scadenze");
  $("#view-fatture").classList.toggle("hidden",v!=="fatture");
  if(v==="agenda"||v==="clienti"||v==="scadenze"||v==="fatture"){curView=v;renderNav();}
}
function gate(msg){$("#gate-msg").textContent=msg;show("gate");}

/* ============================================================
   ⛔ 5 SETTEMBRE 2026 — IL CAPO CHE APRE QUESTA PAGINA
   ============================================================
   Da oggi nel gestionale c'e' il pulsante «📱 App operaio», e da li' ci arriva
   anche il TITOLARE. Prima si trovava un lucchetto che gli diceva «usa il link
   che ti ha mandato la tua impresa»: a lui, che l'impresa e'. Sembrava un
   difetto e invece era solo una frase scritta per un'altra persona.
   Adesso, se chi apre non e' in squadra ma HA una squadra sua (o comunque un
   account suo), gli si spiega di cosa si tratta e lo si rimanda al gestionale.
   ⚠️ Non si cambia nessun permesso: cambia solo cosa c'e' scritto.
   ============================================================ */
function gateCapo(){
  const t=document.getElementById("gate-titolo");
  if(t)t.textContent="Questa è l'app di chi lavora con te";
  $("#gate-msg").textContent="Non è la tua: qui entra il tuo operaio, con il suo account, e vede i lavori del giorno. Tu lo inviti dal gestionale: Squadra → «+ Persona» → menu dei tre puntini → «Copia link» o «Invia su WhatsApp».";
  const b=document.getElementById("gate-btn");
  if(b){ b.textContent="← Torna al gestionale"; b.setAttribute("href","gestionale-app.html"); }
  show("gate");
}
/* si e' un titolare? lo si chiede al database: `gest_operatori` si legge solo
   se `user_id` e' il proprio (regola `operatori_owner`), quindi una riga qui
   vuol dire «questa e' la mia squadra». Se la lettura non riesce, si resta sul
   messaggio di prima: meglio una frase generica che una sbagliata. */
async function forseSonoIlCapo(){
  try{
    const {data,error}=await sb.from("gest_operatori").select("id").limit(1);
    return !error && !!data && data.length>0;
  }catch(_){ return false; }
}

/* ============================================================
   12 agosto 2026 (sera) — I PERMESSI ADESSO COMANDANO DAVVERO

   Nel gestionale del capo, sulla scheda di ogni persona, ci sono sette
   caselle: Calendario, Lavori, Foto, Note, Clienti, Fatture, Pagamenti.
   Si spuntavano, si salvavano... e qui dentro se ne leggevano SOLO TRE
   (lavori, clienti, fatture), per accendere o spegnere i pulsanti in alto.
   Le altre quattro non facevano niente: il capo toglieva la spunta a
   «Pagamenti» e l'operaio poteva lo stesso spendere sulla carta aziendale;
   toglieva «Foto» e l'operaio caricava foto lo stesso.

   Adesso valgono tutte e sette:
     calendario -> puo' girare fra i giorni e i mesi. Senza, vede solo oggi.
     lavori     -> vede l'agenda e le scadenze, apre i lavori, li segna fatti.
     foto       -> puo' AGGIUNGERE foto e video (quelle del capo le vede
                   comunque: sono le istruzioni per lavorare).
     note       -> puo' scrivere cosa ha fatto.
     clienti    -> vede l'elenco dei clienti.
     fatture    -> vede le fatture.
     pagamenti  -> vede la sua carta aziendale e puo' registrare le spese.

   ⚠️ CORRETTO IL 5 SETTEMBRE 2026 — QUI SOTTO C'ERA SCRITTO IL CONTRARIO.
   Il commento vecchio diceva: «non e' un lucchetto sul database, il lucchetto
   vero sono le regole RLS, che vanno scritte in SQL». NON E' PIU' VERO, ed
   era gia' falso: le RLS ci sono. Sul database c'e' la funzione
   `gest_puo_sezione(user_id, sezione)` e la chiamano le regole di
   `gest_ore`, `gest_rapportini`, `gest_lavori`, `gest_spese`, `gest_foto`,
   `gest_video`, `gest_fatture`, `gest_clienti`, `gest_scadenze` e
   `gest_carte_movimenti` (controllato riga per riga in `pg_policies` il
   5 set). Quindi le spunte comandano in due punti: qui, su cosa si VEDE, e
   sul database, su cosa si PUO' SCRIVERE E LEGGERE davvero — anche
   chiamando Supabase da fuori.
   ⛔ L'UNICO BUCO RIMASTO: `gest_spese` ha la regola per INSERIRE
   (`gest_spese_team_insert`) ma NESSUNA regola per LEGGERE. L'operaio
   scrive una spesa e poi non la rivede piu'.
   ============================================================ */
/* 13 agosto 2026 — LA CASELLA MAI TOCCATA
   Le persone create prima che i permessi esistessero hanno la casella vuota
   ({} oppure niente). Prima qui si diceva «lasciamo tutto acceso», ma sul
   database gest_puo_sezione rispondeva «no» a tutto: la barra si riempiva di
   pulsanti e ogni sezione si apriva VUOTA, senza spiegare niente.
   Adesso «mai toccata» vuol dire questi permessi qui, uguali identici anche
   dentro sql/gest-permessi-collaboratori.sql. Sono quelli che quelle persone
   avevano davvero: agenda, lavori, foto e note. Clienti, fatture e pagamenti
   non li hanno mai avuti nella barra nemmeno prima, e restano chiusi. */
const PERMESSI_PARTENZA={calendario:true,lavori:true,foto:true,note:true,
                         clienti:false,fatture:false,pagamenti:false};
function permessiMai(){ return !MIO.permessi || Object.keys(MIO.permessi).length===0; }
function puo(k){
  if(permessiMai())return PERMESSI_PARTENZA[k]===true;
  return MIO.permessi[k]===true;
}
/* 13 agosto 2026 — QUALI SPUNTE APRONO DAVVERO UNA SCHERMATA
   Lavori, Clienti, Fatture e Pagamenti hanno una loro sezione. Calendario,
   Foto e Note invece cambiano solo quello che si puo' fare DENTRO una
   sezione: da sole non aprono niente, e chi aveva soltanto quelle si
   trovava il lucchetto senza capire perche'. */
const SEZIONI_VERE=["lavori","clienti","fatture","pagamenti"];
function qualcosaDaVedere(){ return SEZIONI_VERE.some(puo); }
function applicaPermessi(){
  const _mostra=(sel,si)=>{const e=$(sel);if(e)e.classList.toggle("hidden",!si);};
  const vediLavori=puo("lavori");
  /* il calendario: senza il permesso resta solo il giorno di oggi.
     E chi non ha «Lavori» non ha nessun lavoro da guardare: niente calendario. */
  const cal=document.querySelector("#view-agenda .cal");
  if(cal)cal.style.display=(vediLavori&&puo("calendario"))?"":"none";
  /* l'elenco dei lavori del giorno: chi ha solo la carta aziendale non lo vede */
  const dt=$("#day-title"); if(dt)dt.style.display=vediLavori?"":"none";
  const dl=$("#day-list");  if(dl)dl.style.display=vediLavori?"":"none";
  /* foto e video: si vedono sempre quelle del capo, si AGGIUNGONO solo col permesso */
  _mostra("#btn-foto",  puo("foto"));
  _mostra("#btn-video", puo("foto"));
  /* + Rapido: compare solo se c'e' almeno UNA cosa che questa persona puo'
     segnare, e solo se vede i lavori (senza, non c'e' niente su cui segnarla) */
  _mostra("#btn-rapido", vediLavori && (puo("rapportini")||puo("pagamenti")));
  /* 6 set 2026 — la timbratura: stesso permesso dei rapportini (sono ore di
     lavoro), e serve essere un operatore vero: senza operatore_id la riga non
     passerebbe le regole del database e il pulsante darebbe errore ogni volta. */
  _mostra("#tmb-card", vediLavori && puo("rapportini") && !!MIO.operatoreId);
  /* le note: senza il permesso restano LEGGIBILI e bloccate, non sparite.
     Prima la casella veniva nascosta, e l'operaio non poteva piu' rileggere
     nemmeno quello che aveva scritto lui: restava un riquadro intitolato
     «Cosa hai fatto / note» con dentro il nulla. */
  const scrivo=puo("note");
  const note=$("#lv-note");
  if(note){
    note.classList.remove("hidden");
    note.readOnly=!scrivo;
    note.placeholder=scrivo?"Scrivi qui cosa hai fatto…":"Nessuna nota su questo lavoro.";
    note.style.background=scrivo?"":"#f4f6f5";
  }
  _mostra("#lv-note-ro", !scrivo);
  _mostra("#btn-salva", scrivo);
  /* la carta aziendale: il pannello lo accende caricaCartaMia, ma senza il
     permesso non si accende per niente */
  if(!puo("pagamenti")){
    const cp=$("#carta-panel"); if(cp)cp.style.display="none";
    const cn=$("#carta-nessuna"); if(cn)cn.classList.add("hidden");
  }
}
/* ===== 13 agosto 2026 — I FILE CHE RESTAVANO NEL DEPOSITO =====
   Nel pannello del titolare, da agosto, c'e' _fileOrfano: se la riga che
   nomina un file non si scrive, il file caricato si toglie subito. Qui dentro
   non c'era. E qui e' peggio che nel pannello: le foto le carica chi sta in
   cantiere, spesso con poco campo, e ogni tentativo andato male lasciava
   megabyte nel deposito che non nominava piu' nessuno — invisibili, e a
   pagamento. Provato: 1 foto e 1 video rimasti dentro, con «Foto su, ma non
   salvata» a schermo e zero pulizia.
   Adesso appena si sa che la riga non c'e', il file si toglie. */
async function _fileOrfano(bucket,path){
  if(!sb||!path)return false;
  try{
    const {error}=await sb.storage.from(bucket).remove([path]);
    if(error){console.warn("[operatore] file orfano NON tolto:",bucket,path,error.message);return false;}
    return true;
  }catch(e){console.warn("[operatore] file orfano NON tolto:",bucket,path,e&&e.message);return false;}
}

/* rete di sicurezza sulle AZIONI: anche se un pulsante restasse raggiungibile
   (schermo stretto, pagina rimasta aperta da prima), l'azione si ferma qui e
   dice perche'. Nascondere e basta non e' una risposta. */
function chiedoPermesso(k,cosa){
  if(puo(k))return true;
  toast("Il capo non ti ha dato il permesso "+cosa+".");
  return false;
}
let curView="agenda";
function renderNav(){
  /* si passa da puo()/permessiMai(): letto cosi', chi ha i permessi a null
     (persone di prima) si ritrovava la barra completamente vuota, perche'
     MIO.permessi diventa {} e nessuna spunta risultava accesa. */
  $("#nav-agenda").classList.toggle("hidden",!puo("lavori"));
  $("#nav-clienti").classList.toggle("hidden",!puo("clienti"));
  $("#nav-scadenze").classList.toggle("hidden",!puo("lavori"));
  $("#nav-fatture").classList.toggle("hidden",!puo("fatture"));
  $("#nav-agenda").classList.toggle("active",curView==="agenda");
  $("#nav-clienti").classList.toggle("active",curView==="clienti");
  $("#nav-scadenze").classList.toggle("active",curView==="scadenze");
  $("#nav-fatture").classList.toggle("active",curView==="fatture");
  applicaPermessi();
  /* 5 set 2026 — le parole del mestiere: adesso `MIO.tipoStudio` si sa, quindi
     si riscrivono le scritte gia' stampate nell'HTML (vedi PAROLE / _p()). */
  adattaParole();
}

