// [SPOSTATO] op-timbratura.js: era dentro op-core.js, righe 1831-2058, spostato identico.
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

