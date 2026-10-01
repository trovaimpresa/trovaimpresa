// [SPOSTATO] op-core.js: le righe 1-1764 del vecchio file ora stanno in: op-base.js (righe 1-268), op-agenda-giorno.js (righe 269-627), op-spese-foto.js (righe 628-853), op-rapido-voce.js (righe 854-1422), op-rapportini.js (righe 1423-1764). Qui resta il resto.
/* ============================================================
   ⛔ 22 agosto 2026 — «SALVATO ✔» CHE NON ERA SALVATO
   ============================================================
   Quando la regola del database rifiuta la riga, PostgREST NON risponde
   con un errore: risponde "va bene, ho cambiato zero righe". Qui sotto si
   guardava solo l'errore, quindi il collaboratore leggeva
   «Segnato come fatto ✔», tornava a casa convinto, e nel gestionale del
   titolare il lavoro restava aperto. Nessuno dei due lo sapeva.

   ⚠️ E la pagina non puo' saperlo da sola: il pulsante delle note chiede il
   permesso «note», ma la riga che scrive sta in gest_lavori, che il database
   protegge col permesso «lavori». Due parole diverse per la stessa cosa: il
   controllo della pagina NON e' il controllo del database.
   (Oggi chi non ha «lavori» non arriva nemmeno ad aprire un lavoro, quindi a
   schermo quel caso non si vede — controllato. Ma la risposta del database
   resta l'unica che conta, e va guardata.)

   Adesso si chiede indietro la riga scritta (.select("id")): se non torna
   niente, non e' stato scritto niente, e si dice.
   ⚠️ Questo funziona perche' chi puo' MODIFICARE un lavoro puo' anche
   LEGGERLO (lavori_update vuole il permesso «lavori», lavori_read si
   accontenta di «lavori» oppure «fatture»): se un giorno quelle due regole
   cambiassero, un salvataggio riuscito potrebbe tornare vuoto e questa
   scritta direbbe una bugia al contrario.
   ============================================================ */
const NIENTE_PERMESSO="Non l'ho segnato: il capo non ti ha dato il permesso sui Lavori. Chiediglielo e riprova.";
async function scriviLavoro(patch){
  const r=await sb.from("gest_lavori").update(patch).eq("id",curLavoro.id).select("id");
  if(r&&r.error)return {ok:false,msg:"Non salvato: "+(r.error.message||"errore")};
  if(!r||!r.data||!r.data.length)return {ok:false,msg:NIENTE_PERMESSO};
  return {ok:true};
}

/* salva note */
$("#btn-salva").onclick=async()=>{
  if(!curLavoro)return;
  if(!chiedoPermesso("note","di scrivere le note"))return;
  const txt=$("#lv-note").value;
  $("#btn-salva").disabled=true;
  const r=await scriviLavoro({lavoro_svolto:txt});
  $("#btn-salva").disabled=false;
  if(!r.ok){toast(r.msg);return;}
  curLavoro.lavoro_svolto=txt;const l=LAVORI.find(x=>x.id===curLavoro.id);if(l)l.lavoro_svolto=txt;
  toast("Salvato ✔");
};

/* segna fatto */
$("#btn-fatto").onclick=async()=>{
  if(!curLavoro)return;
  $("#btn-fatto").disabled=true;
  const r=await scriviLavoro({stato:"fatto",data_fatto:ymd(new Date())});
  $("#btn-fatto").disabled=false;
  if(!r.ok){toast(r.msg);return;}
  curLavoro.stato="fatto";const l=LAVORI.find(x=>x.id===curLavoro.id);if(l){l.stato="fatto";l.data_fatto=ymd(new Date());}
  toast("Segnato come fatto ✔");
  openLavoro(curLavoro.id);
};

/* esci */
$("#btn-esci").onclick=async()=>{await sb.auth.signOut();gate("Sei uscito. Per rientrare apri il tuo link di invito.");};
$("#nav-agenda").onclick=()=>{renderCal();renderDay();show("agenda");};
$("#nav-clienti").onclick=async()=>{await loadClienti();show("clienti");};
$("#nav-scadenze").onclick=async()=>{await loadScadenze();show("scadenze");};
$("#nav-fatture").onclick=async()=>{await loadFatture();show("fatture");};
$("#fatt-pdf-file").onchange=e=>{uploadFatturaPdf(e.target.files[0]);e.target.value="";};

/* ============================================================
   ===== TIMBRATURA (6 settembre 2026) =====
   Perche' esiste: negli altri gestionali da cantiere (Fluida, Connecteam)
   l'operaio la mattina fa UNA cosa sola: preme «Entrata». Le ore poi si
   sommano da sole. Qui invece l'unico modo di segnare le ore era «Segna la
   giornata», che si compila a fine turno, a memoria, e infatti spesso non si
   compilava affatto.

   ⚠️ LA REGOLA DEL CANTIERE: SENZA CAMPO DEVE FUNZIONARE LO STESSO.
   In cantiere la rete non c'e' quasi mai (scale, seminterrati, campagna).
   Quindi la timbratura NON aspetta il database: si scrive subito sul
   telefono (localStorage), si vede subito sullo schermo, e parte da sola
   appena torna la rete. L'operaio puo' chiudere l'app: la coda resta.

   ⚠️ PERCHE' C'E' client_id: e' un codice che genera IL TELEFONO, non il
   database. Se la spedizione va a meta' (rete che va e viene) il telefono
   riprova con lo STESSO codice, e Postgres — che ha un indice unico su
   (user_id, client_id) — risponde 23505 «esiste gia'». Quel 23505 per noi
   NON e' un errore: vuol dire «era gia' arrivata», e la togliamo dalla coda.
   Senza questo, una timbratura riprovata →3← volte diventava →3← entrate.

   ⚠️ COSA NON FA: non scrive NIENTE dentro gest_ore. Se lo facesse, le ore
   della timbratura si sommerebbero a quelle scritte a mano in «Segna la
   giornata» e la busta paga verrebbe doppia. La timbratura per adesso e' un
   registro a parte, che si guarda; il travaso nelle ore, se lo vorremo, e'
   una decisione separata da prendere con calma.

   ⚠️ creato_da NON e' auth.uid(): le regole del database controllano
   `m.operatore_id = creato_da`, quindi ci va MIO.operatoreId. Con l'uid la
   riga verrebbe rifiutata e la coda non si svuoterebbe mai.
   ============================================================ */
const TMB_CODA_KEY = "tmb_coda_v1";
const TMB = { oggi: [], mandando: false, orologio: null };

function tmbCodice(){
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}
function tmbCodaLeggi(){
  try{ const a = JSON.parse(localStorage.getItem(TMB_CODA_KEY) || "[]"); return Array.isArray(a) ? a : []; }
  catch(e){ return []; }
}
function tmbCodaScrivi(a){
  try{ localStorage.setItem(TMB_CODA_KEY, JSON.stringify(a)); }catch(e){}
}
function tmbOraHM(iso){
  const d = new Date(iso);
  return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}
function tmbDurata(ms){
  if(ms < 0) ms = 0;
  const m = Math.floor(ms/60000);
  return Math.floor(m/60) + "h " + String(m%60).padStart(2,"0") + "m";
}

/* le timbrature di OGGI gia' arrivate al database */
async function tmbCaricaOggi(){
  if(!sb || !MIO.impresaId || !MIO.operatoreId){ TMB.oggi = []; return; }
  const g = ymd(new Date());
  const r = await sb.from("gest_timbrature")
    .select("id,tipo,quando,ora_telefono,client_id,lavoro_id")
    .eq("user_id", MIO.impresaId)
    .eq("creato_da", MIO.operatoreId)
    .is("eliminato_il", null)
    .gte("quando", g + "T00:00:00")
    .lte("quando", g + "T23:59:59.999")
    .order("quando", { ascending: true });
  /* se la rete non c'e' NON si svuota quello che avevamo: si tiene l'ultimo
     elenco buono, se no la schermata si azzera proprio dove il campo manca */
  if(!r || r.error) return;
  TMB.oggi = r.data || [];
}

/* svuota la coda: una alla volta, in ordine, e si ferma al primo intoppo vero */
async function tmbManda(){
  if(TMB.mandando || !sb || !MIO.impresaId || !MIO.operatoreId) return;
  if(typeof navigator !== "undefined" && navigator.onLine === false) return;
  let coda = tmbCodaLeggi();
  if(!coda.length) return;
  TMB.mandando = true;
  try{
    while(coda.length){
      const t = coda[0];
      const r = await sb.from("gest_timbrature").insert({
        user_id:      MIO.impresaId,
        creato_da:    MIO.operatoreId,
        tipo:         t.tipo,
        quando:       t.quando,
        ora_telefono: t.quando,
        lavoro_id:    t.lavoro_id || null,
        client_id:    t.client_id
      });
      const err = r && r.error;
      /* 23505 = «questo client_id c'e' gia'»: era arrivata, e' fatta */
      const gia = err && (err.code === "23505" || /duplicate key/i.test(err.message || ""));
      if(err && !gia) break;          /* rete o permessi: si riprova dopo */
      coda.shift();
      tmbCodaScrivi(coda);
    }
  }finally{
    TMB.mandando = false;
  }
  await tmbCaricaOggi();
  tmbDisegna();
}

/* l'elenco di oggi = quelle del database + quelle ancora in coda */
function tmbTutte(){
  const arrivate = TMB.oggi.map(x => ({
    quando: x.ora_telefono || x.quando,
    tipo: x.tipo, client_id: x.client_id, attesa: false
  }));
  const visti = {};
  arrivate.forEach(x => { if(x.client_id) visti[x.client_id] = 1; });
  const g = ymd(new Date());
  const incoda = tmbCodaLeggi()
    .filter(x => !visti[x.client_id] && ymd(new Date(x.quando)) === g)
    .map(x => ({ quando: x.quando, tipo: x.tipo, client_id: x.client_id, attesa: true }));
  return arrivate.concat(incoda).sort((a,b) => new Date(a.quando) - new Date(b.quando));
}

/* le ore di oggi: si accoppiano entrata/uscita in ordine.
   Un'entrata ancora aperta conta fino ad adesso. */
function tmbTotaleMs(righe){
  let tot = 0, aperta = null;
  righe.forEach(r => {
    if(r.tipo === "entrata"){ if(aperta === null) aperta = new Date(r.quando).getTime(); }
    else if(aperta !== null){ tot += new Date(r.quando).getTime() - aperta; aperta = null; }
  });
  if(aperta !== null) tot += Date.now() - aperta;
  return tot;
}

function tmbDisegna(){
  const card = $("#tmb-card");
  if(!card || card.classList.contains("hidden")) return;
  const righe  = tmbTutte();
  const coda   = tmbCodaLeggi();
  const ultima = righe.length ? righe[righe.length-1] : null;
  const dentro = !!(ultima && ultima.tipo === "entrata");

  /* la striscia arancione della coda */
  const cd = $("#tmb-coda");
  if(coda.length){
    cd.classList.remove("hidden");
    const una = coda.length === 1;
    $("#tmb-coda-n").textContent = una ? "1 timbratura da mandare"
                                       : coda.length + " timbrature da mandare";
    /* singolare/plurale: «Parte da sola» con →2← in coda faceva sembrare che
       ne partisse una sola e le altre restassero indietro */
    $("#tmb-coda-t").textContent = "Nessun campo. "
      + (una ? "Parte da sola" : "Partono da sole")
      + " appena torna la rete: puoi chiudere l'app.";
  }else cd.classList.add("hidden");

  /* la striscia verde «sei entrato» */
  const st = $("#tmb-stato");
  if(dentro){
    st.classList.remove("hidden");
    $("#tmb-stato-t").textContent = "Sei entrato alle " + tmbOraHM(ultima.quando);
    $("#tmb-stato-s").textContent = ultima.attesa ? "segnata sul telefono" : "";
    $("#tmb-ore").textContent = tmbDurata(tmbTotaleMs(righe));
  }else st.classList.add("hidden");

  $("#tmb-vuoto").classList.toggle("hidden", righe.length > 0);

  /* il pulsante grosso */
  const b = $("#tmb-btn");
  b.classList.toggle("esci",  dentro);
  b.classList.toggle("entra", !dentro);
  const adesso = tmbOraHM(new Date().toISOString());
  b.innerHTML = (dentro ? "⏹️ Uscita" : "▶️ Entrata")
    + '<small id="tmb-btn-sub">' + (righe.length ? "sono le " + adesso : "segna adesso, ore " + adesso) + "</small>";

  /* l'elenco della giornata */
  const box = $("#tmb-lista");
  if(!righe.length){ box.innerHTML = ""; return; }
  box.innerHTML = righe.map(r =>
    '<div class="tmb-riga' + (r.attesa ? " attesa" : "") + '">'
    + '<span class="ic ' + (r.tipo === "entrata" ? "e" : "u") + '">'
    + (r.tipo === "entrata" ? "▶️" : "⏹️") + "</span> "
    + (r.tipo === "entrata" ? "Entrata" : "Uscita")
    + (r.attesa
        ? " " + tmbOraHM(r.quando) + '<span class="att">⏳ da mandare</span>'
        : '<span class="h">' + tmbOraHM(r.quando) + "</span>")
    + "</div>"
  ).join("")
  + '<div class="tmb-tot"><span>Oggi</span><span>' + tmbDurata(tmbTotaleMs(righe)) + "</span></div>";
}

/* preme il pulsante: si scrive PRIMA sul telefono, poi si prova a mandarla */
function tmbTimbra(){
  if(!MIO.operatoreId) return;
  const righe  = tmbTutte();
  const ultima = righe.length ? righe[righe.length-1] : null;
  const tipo   = (ultima && ultima.tipo === "entrata") ? "uscita" : "entrata";
  /* se oggi c'e' UN SOLO lavoro, la timbratura si attacca a quello: se sono
     due o piu' non si indovina, resta senza cantiere (la riga vale lo stesso) */
  let lav = null;
  try{
    const g = ymd(new Date());
    const doggi = (LAVORI || []).filter(l => String(l.data_prevista || l.data || "").slice(0,10) === g);
    if(doggi.length === 1) lav = doggi[0].id;
  }catch(e){}
  const coda = tmbCodaLeggi();
  coda.push({ client_id: tmbCodice(), tipo: tipo, quando: new Date().toISOString(), lavoro_id: lav });
  tmbCodaScrivi(coda);
  tmbDisegna();                                   /* si vede SUBITO, senza rete */
  toast(tipo === "entrata" ? "Entrata segnata ✔" : "Uscita segnata ✔");
  tmbManda();
}

async function tmbAvvia(){
  const card = $("#tmb-card");
  if(!card || card.classList.contains("hidden")) return;
  const b = $("#tmb-btn");
  if(b && !b.dataset.tmbLegato){ b.dataset.tmbLegato = "1"; b.onclick = tmbTimbra; }
  await tmbCaricaOggi();
  await tmbManda();
  tmbDisegna();
  /* l'orologio della striscia verde: le ore salgono da sole, senza ricaricare */
  if(TMB.orologio) clearInterval(TMB.orologio);
  TMB.orologio = setInterval(tmbDisegna, 30000);
}

/* appena torna la rete la coda parte da sola, anche se l'operaio non tocca niente */
window.addEventListener("online", () => { tmbManda(); });
document.addEventListener("visibilitychange", () => { if(!document.hidden) tmbManda(); });

/* ===== RESTYLING PRO: emoji dell'interfaccia → icone SVG ===== */
const _ICONS={
  "📍":'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  "👤":'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "📞":'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z"/>',
  "📄":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  "📅":'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  "📝":'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
  "💶":'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  "📷":'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  "📎":'<path d="m21.4 11.1-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 1 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8"/>',
  "🔒":'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
};
const _EMO_KEYS=Object.keys(_ICONS).join("|");
const _EMO_RE=new RegExp("("+_EMO_KEYS+")️?","g");
const _EMO_TEST=new RegExp("("+_EMO_KEYS+")");
const _svgIcon=e=>'<svg class="emic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+_ICONS[e]+'</svg>';
let _icoObs=null;
function _iconizza(){
  if(_icoObs)_icoObs.disconnect();
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(t){
    if(!t.nodeValue||!_EMO_TEST.test(t.nodeValue))return NodeFilter.FILTER_REJECT;
    return t.parentElement&&t.parentElement.closest("textarea,script,style")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
  const nodi=[];let n;while(n=w.nextNode())nodi.push(n);
  nodi.forEach(t=>{
    const span=document.createElement("span");
    span.innerHTML=t.nodeValue.replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])).replace(_EMO_RE,(m,e)=>_svgIcon(e));
    t.parentNode.replaceChild(span,t);
  });
  _icoObs.observe(document.body,{childList:true,subtree:true,characterData:true});
}
_icoObs=new MutationObserver(()=>_iconizza());
_iconizza();

/* ===== avvio ===== */
if(!sb){
  /* niente libreria = niente app: si dice, e non si prova nemmeno a
     partire (se no il primo sb.auth spacca tutto un'altra volta) */
  gate("Non riesco a caricare l'app: la linea non basta. Spostati dove prende meglio e riapri la pagina.");
}else{
  sb.auth.getSession().then(({data})=>boot(data.session));
  sb.auth.onAuthStateChange((_e,s)=>setTimeout(()=>boot(s),0));
}
