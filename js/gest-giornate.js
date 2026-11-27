/* =====================================================================
   TrovaImpresa — LE GIORNATE — 3 novembre 2026

   Idea di Alessio, nata dalla sua pagina «Giornate di cantiere»: il capo
   detta la giornata di tutti («oggi io, Wahid e Luis a Campoloniano,
   rifatto il tetto») e il gestionale la mette in ordine. A fine mese:
   giorni per persona, giorni per cantiere e il PDF per il consulente.

   ⛔ NIENTE TABELLE NUOVE. Una giornata e' un RAPPORTINO (gest_rapportini:
      cantiere, data, «cosa avete fatto» nella nota) con sotto le ORE di
      chi c'era (gest_ore). Sono le stesse righe che scrive l'operaio dal
      telefono: un posto solo dove stanno le ore, il margine del lavoro le
      vede come tutte le altre.
   ⛔ La giornata intera vale 8 ore. Se una persona sta in due cantieri lo
      stesso giorno, le 8 ore si dividono (4 + 4): se no il costo della
      manodopera raddoppia.
   ⛔ Il cantiere e' un LAVORO (gest_rapportini.lavoro_id non puo' essere
      vuoto). Se il posto detto non e' fra i lavori, al Salva nasce un
      lavoro nuovo «in corso» con quel nome.
   ⛔ L'AI NON SCRIVE NEL DATABASE: capisce il racconto (funzione
      ai-correggi, modo «giornata», GRATIS) e riempie le schede; salva il capo.
   ⛔ Si contano le giornate di TUTTA l'azienda, non del solo reparto
      (come le ore in «Ore e spese»): la squadra e' una.

   File non in un IIFE, come gli altri js/ del gestionale: vede sb, sbUid,
   esc, toast, $, todayStr, caricaJsPDF solo DENTRO le funzioni.
   Le azioni hanno un ascoltatore suo su [data-gior].
   ===================================================================== */

const GIOR_URL_AI = "https://nacvrsgkyfavykxjxszu.supabase.co/functions/v1/ai-correggi";
const GIOR_MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
const GIOR_GG = ["dom","lun","mar","mer","gio","ven","sab"];
const GIOR_ORE_GIORNO = 8;

let giorMese = null;       /* "AAAA-MM" */
let giorOps = [];          /* operatori {id,nome,mestiere_id} */
let giorLav = [];          /* lavori {id,descrizione,dove,stato,mestiere_id} */
let giorRighe = [];        /* le giornate del mese, gia' raggruppate */
let giorProp = null;       /* le schede da controllare [{data,chi:Set(nomi),dove,cosa}] */
let giorUltima = null;   /* «Come ieri»: l'ultima giornata prima di oggi */
let giorNuovi = [];        /* nomi detti che non sono in squadra */
let giorOccupato = false;
let giorConferma = null;   /* chiave della riga da cancellare */
let giorModK = null;       /* 18 nov 2026: la giornata che si sta modificando PER INTERO nella scheda (giorno, cantiere, persone, testo) */
let giorModifica = null;   /* chiave della riga di cui si cambia il testo */
let giorVoce = "";
let giorAggiungi = null;
let giorIoNuovo = false;   /* il capo non e' ancora in Squadra: sta scrivendo il suo nome */
let giorIoNome = "";
let giorTariffe = {per:{},media:0};  /* costo orario: stessa costiOrari() del margine dei lavori */
let giorProposte = [];
let giorAvanz = {};         /* lavoro_id -> {importo, speso}: quanto ha gia' speso del suo valore */     /* le giornate mandate dagli operai, da approvare */
let giorCdl = null;
let giorDidaManca = false;   /* 20 nov 2026: la colonna gest_rapportini.didascalia non c'e' ancora */
let giorSera = null;        /* {si:true|false, ora, perche} la domanda della sera su QUESTO telefono */
let giorDallaSera = /[?&]sera=1/.test(location.search);  /* arrivato toccando la notifica */        /* {email,invio,ultimo} il consulente del lavoro */       /* il suo nome: al Salva entra in Squadra e diventa «io» */   /* indice della scheda in cui si sta scrivendo un nome nuovo */

function _gYmd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function _gOggi(){ return _gYmd(new Date()); }
function _gMeseNome(ym){ const [y,m]=ym.split("-"); return GIOR_MESI[+m-1].charAt(0).toUpperCase()+GIOR_MESI[+m-1].slice(1)+" "+y; }
function _gData(iso){ const d=new Date(iso+"T12:00"); return GIOR_GG[d.getDay()]+" "+d.getDate()+" "+GIOR_MESI[d.getMonth()]; }
function _gSposta(ym,n){ let [y,m]=ym.split("-").map(Number); m+=n; if(m<1){m=12;y--;} if(m>12){m=1;y++;} return y+"-"+String(m).padStart(2,"0"); }
function _gNorm(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim(); }
/* 24 nov 2026 (collaudo Giornate dello studio tecnico) — LE PAROLE DELLO
   STUDIO alla fonte. Il traduttore della pagina sbagliava («I pratiche del
   mese», «degli collaboratori») e i PDF non li vede. Il testo dell'UTENTE
   (nomi delle pratiche, «cosa avete fatto», lavoro svolto, spese) sta in
   .gior-u, che e' in _SKIP_UTENTE (js/gest-ingresso.js): prima «misure in
   cantiere con l'impresa» diventava «misure in pratica con l'impresa». */
/* 24 nov 2026 (deciso da Alex: «si», reparti separati) — GIORNATE PER
   REPARTO. Prima Giornate contava persone, pratiche e giornate di TUTTI i
   reparti («la squadra e' una», 3 nov): nel reparto «ferramenta» uscivano
   le persone e le potature del giardiniere. Adesso come la schermata dei
   reparti promette («pratiche, clienti, collaboratori e calendario non si
   mischiano») e come Report e Assistente: solo il reparto aperto. Le
   persone senza reparto si vedono dappertutto. Senza reparto aperto non si
   filtra niente. ⚠️ «Ore fatte» dell'Agenda resta di tutta l'azienda
   (scelta del 6 set, lo dice la sua riga). */
function _gNelReparto(righe,persone){
  const mid=_gMest(); if(!mid) return righe||[];
  return (righe||[]).filter(x=>String(x.mestiere_id||"")===String(mid)||(persone&&!x.mestiere_id));
}
/* 24 nov 2026 (sì di Alex, foto approvata) — LE SPESE DETTE NEL RACCONTO.
   «Pagati 16 € di diritti di segreteria», «spesi 45 euro di sabbia»: sotto
   la scheda una riga con la spunta; al «Salva» va fra le spese di quella
   pratica/lavoro (gest_spese, come «Spesa» della giornata). Si leggono dal
   «cosa» scritto dall'AI: solo importi con «€/euro» dopo pagato/speso/
   comprato/versato. Niente AI in piu', niente crediti. */
function giorSpeseDa(testo){
  const out=[]; const t=String(testo||"");
  const rx=/(?:pagat[oiae]|spes[oiae]|comprat[oiae]|versat[oiae])\s+(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:€|euro)\s+(?:(?:di|per|in|del|dei|della|delle|al|alla)\s+)?/gi;
  let m; while((m=rx.exec(t))){
    let n=m[1]; n=/,\d{1,2}$/.test(n)?n.replace(/\./g,"").replace(",","."):(/^\d{1,3}(\.\d{3})+$/.test(n)?n.replace(/\./g,""):n);
    const imp=Math.round(parseFloat(n)*100)/100; if(!(imp>0)) continue;
    let d=t.slice(m.index+m[0].length).split(/[.;\n]|\s+(?:e|ed)\s+(?:poi\s+)?(?:pagat|spes|comprat|versat|anche)|,\s+(?:poi\s+)?(?:pagat|spes|comprat|versat)/i)[0].trim().slice(0,80);
    d=d.replace(/^(?:il|lo|la|i|gli|le|l')\s*/i,"");
    if(d.length<2) continue;
    d=d.charAt(0).toUpperCase()+d.slice(1);
    out.push({desc:d,imp,on:true});
  }
  return out;
}
function giorSpeseHTML(c,i){
  if(!c.spese||!c.spese.length) return "";
  return `<div><div class="glab">Spese dette nel racconto</div>${c.spese.map((x,j)=>`<label class="gspe"><input type="checkbox" data-gior-spe="${i}:${j}" ${x.on?"checked":""}><span class="gior-u">${esc(x.desc)}</span><b>${esc(_gEuro(x.imp))}</b></label>`).join("")}
    <div class="gnota" style="margin-top:6px">${_gP("Al «Salva» va fra le spese di questo lavoro, come «Spesa». Togli la spunta se non la vuoi.","Al «Salva» va fra le spese di questa pratica, come «Spesa». Togli la spunta se non la vuoi.")}</div></div>`;
}
document.addEventListener("change",e=>{
  const x=e.target&&e.target.closest&&e.target.closest("[data-gior-spe]"); if(!x||!giorProp) return;
  const [i,j]=x.dataset.giorSpe.split(":").map(Number); const c=giorProp[i];
  if(c&&c.spese&&c.spese[j]) c.spese[j].on=x.checked;
});
async function giorScriviSpese(schede){
  let n=0,ko=0;
  for(const c of schede){
    if(!c._lavId||!Array.isArray(c.spese)) continue;
    for(const x of c.spese){
      if(!x.on) continue;
      const r=await sb.from("gest_spese").insert({user_id:sbUid,lavoro_id:c._lavId,descrizione:x.desc,importo:x.imp,data:c.data}).select("id");
      if(r.error||!r.data||!r.data.length) ko++; else n++;
    }
  }
  return {n,ko};
}
function _gPro(){ try{ return typeof ruoloUtente!=="undefined"&&ruoloUtente==="professionista"; }catch(e){ return false; } }
function _gP(impresa,studio){ return _gPro()?studio:impresa; }
/* 24 nov 2026 — ALLO STUDIO «Catasto», «Comune», «ufficio tecnico» sono POSTI,
   non pratiche. L'AI scriveva «Catasto» come pratica e al Salva nasceva una
   pratica vuota «Catasto» (senza tipo, senza cliente). Qui si cerca la
   pratica vera fra quelle che ci sono, con le parole del posto e di «cosa»
   («visure per l'accatastamento Bianchi» -> «Accatastamento Bianchi»).
   Se non e' sicura (nessuna, o due a pari merito) resta quello che ha
   detto l'AI, e ci pensa giorFermaPraticaNuova al Salva. */
const GIOR_PAROLE_VUOTE=new Set(["della","delle","dello","degli","dalla","nella","sulla","pratica","lavoro","lavori","presso","sopralluogo","casa","appartamento"]);
function giorPraticaDa(dove,cosa){
  const k=_gNorm(dove);
  if(k&&giorLav.some(l=>_gNorm(_gNomeLav(l))===k)) return dove;
  const testo=" "+_gNorm(dove+" "+(cosa||""))+" ";
  const mid=String(_gMest()||"");
  let best=null,bp=0,pari=false;
  giorLav.forEach(l=>{
    const parole=[...new Set(_gNorm(_gNomeLav(l)).split(" ").filter(p=>p.length>=4&&!GIOR_PAROLE_VUOTE.has(p)))];
    if(!parole.length) return;
    const n=parole.filter(p=>testo.indexOf(" "+p+" ")>=0).length;
    if(!n) return;
    const punti=n/parole.length+(String(l.mestiere_id||"")===mid?0.001:0);
    if(punti>bp+1e-9){ best=l; bp=punti; pari=false; } else if(Math.abs(punti-bp)<1e-9) pari=true;
  });
  return (best&&!pari&&bp>=0.5)?_gNomeLav(best):dove;
}
/* 24 nov 2026 — allo studio una pratica che non c'e' NON nasce zitta: al
   primo «Salva» lo si dice; se la vuole davvero, ripreme «Salva». */
let giorNuovaSi=new Set();
function giorFermaPraticaNuova(schede){
  if(!_gPro()) return false;
  for(const c of schede){
    if(c.lavoro_id) continue;
    const k=_gNorm(c.dove); if(!k) continue;
    if(giorLav.some(l=>_gNorm(_gNomeLav(l))===k)||giorNuovaSi.has(k)) continue;
    giorNuovaSi.add(k);
    giorDisegna({t:"Non trovo la pratica «"+String(c.dove).trim()+"». Sceglila dall'elenco (tocca la casella «Pratica»). Se è davvero una pratica nuova, premi di nuovo «Salva» e la creo.",k:"err"});
    return true;
  }
  return false;
}
function _gNomeLav(l){ return (l && (l.descrizione || l.dove)) || "Cantiere"; }
function _gIoKey(){ return "gior_io_"+(typeof sbUid!=="undefined"?sbUid:""); }
function _gIo(){ try{ return localStorage.getItem(_gIoKey())||""; }catch(e){ return ""; } }
function _gSetIo(v){ try{ localStorage.setItem(_gIoKey(),v||""); }catch(e){} }
/* ---------------------------------------------------------------------
   10 nov 2026 — GIORNATE DA SOLI. Chi lavora da solo non deve sentirsi
   chiedere «tu chi sei nella squadra?». giorIoAuto() decide da sola:
   · Squadra vuota      -> mette il titolare in Squadra col suo nome
                           (imprese.nome) e lo segna come «io»;
   · una persona sola, che si chiama come il titolare -> e' lui.
   Negli altri casi (ci sono dipendenti) la domanda resta.
   La usano anche la finestra di «Parla» (gest-parla.js) e le schede scritte a mano.
   --------------------------------------------------------------------- */
let giorNomeTitolare = null;
let giorIoProvato = false;
async function giorLeggiTitolare(){
  if(giorNomeTitolare!==null) return giorNomeTitolare;
  giorNomeTitolare="";
  try{
    const r=await sb.from("imprese").select("nome").eq("user_id",sbUid).limit(1).maybeSingle();
    giorNomeTitolare=String((r&&r.data&&r.data.nome)||"").trim();
  }catch(e){}
  return giorNomeTitolare;
}
async function giorIoAuto(subito){
  if(_gIo()) return false;
  const nome=await giorLeggiTitolare();
  if(giorOps.length===1&&nome&&(_gNorm(giorOps[0].nome)===_gNorm(nome)||_gNorm(giorOps[0].nome).split(" ")[0]===_gNorm(nome).split(" ")[0])){
    _gSetIo(giorOps[0].id); return true;
  }
  if(giorOps.length===0){
    const N=(nome||"Io").replace(/^./,c=>c.toUpperCase()).slice(0,60);
    /* dalle schede: entra in Squadra solo al «Salva» (giorScrivi), cosi' «Annulla» non lascia niente */
    if(!subito){
      if(!giorProp) return false;
      giorIoNome=N; if(!giorNuovi.includes(N)) giorNuovi.push(N);
      giorProp.forEach(c=>{ if(!c.chi.size||c.chi.has("IO")){ c.chi.delete("IO"); c.chi.add(N); } });
      return true;
    }
    const {data,error}=await sb.from("gest_operatori").insert({user_id:sbUid,mestiere_id:_gMest(),nome:N}).select("id,nome,mestiere_id");
    if(error||!data||!data.length) return false;
    giorOps.push(data[0]); _gSetIo(data[0].id); return true;
  }
  return false;
}
window.giorIoAuto=giorIoAuto;
/* la stessa decisione, senza attese (il nome del titolare e' gia' letto) */
function giorIoSubito(){
  const nome=giorNomeTitolare||"";
  if(giorOps.length===1&&nome&&(_gNorm(giorOps[0].nome)===_gNorm(nome)||_gNorm(giorOps[0].nome).split(" ")[0]===_gNorm(nome).split(" ")[0])){ _gSetIo(giorOps[0].id); return; }
  if(giorOps.length===0){
    const N=(nome||"Io").replace(/^./,c=>c.toUpperCase()).slice(0,60);
    giorIoNome=N; if(!giorNuovi.includes(N)) giorNuovi.push(N);
    giorProp.forEach(c=>{ if(!c.chi.size||c.chi.has("IO")){ c.chi.delete("IO"); c.chi.add(N); } });
  }
}
function _gMest(){ try{ return (typeof window.curMestiere==="function")?window.curMestiere():null; }catch(e){ return null; } }
const _gIc = {
  pdf:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'
};

(function giorStile(){
  const css=`
#giornate .gm{display:flex;align-items:center;gap:12px;margin:4px 0 16px}
#giornate .gm h3{flex:1;margin:0;font-size:24px;color:var(--testo,#0f172a)}
#giornate .gm button{width:44px;height:44px;border-radius:10px;border:1px solid var(--bordo,#e2e8f0);background:#fff;font-size:22px;cursor:pointer;color:var(--testo,#0f172a)}
#giornate .gt{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:18px}
#giornate .gt div{background:#fff;border:1px solid var(--bordo,#e2e8f0);border-radius:12px;padding:14px 16px}
#giornate .gt span{display:block;font-size:15px;color:var(--testo-2,#475569)}
#giornate .gt b{display:block;font-size:32px;line-height:1.15;font-variant-numeric:tabular-nums;color:var(--testo,#0f172a)}
#giornate .gb{background:#fff;border:1px solid var(--bordo,#e2e8f0);border-radius:14px;padding:18px;margin-bottom:18px;display:flex;flex-direction:column;gap:12px}
#giornate details.gimp{display:block}
#giornate .gimp-t{cursor:pointer;font-size:19px;font-weight:700;list-style:revert;padding:4px 0}
#giornate .gimp-t span{display:block;font-size:15px;font-weight:400;color:var(--testo-2,#475569);margin-top:2px}
#giornate .gimp>.gb{border:0;border-top:1px solid var(--bordo,#e2e8f0);border-radius:0;padding:16px 0 0;margin:16px 0 0}
#giornate .gb h4{margin:0;font-size:18px;color:var(--testo,#0f172a)}
#giornate textarea,#giornate input[type=text],#giornate input[type=date],#giornate select{font:inherit;font-size:17px;border:1.5px solid var(--bordo-forte,#cbd5e1);border-radius:10px;padding:12px;width:100%;box-sizing:border-box;background:#fff;color:var(--testo,#0f172a)}
#giornate textarea{min-height:90px;resize:vertical}
#giornate .gbig{background:#ff8800;color:#fff;border:0;border-radius:12px;font-size:19px;font-weight:700;padding:14px;cursor:pointer;width:100%}
#giornate .gbig.blu{background:var(--blu,#0066ff)}
#giornate .gbig:disabled{opacity:.6;cursor:default}
#giornate .glab{font-size:14px;font-weight:700;color:var(--testo-2,#475569);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
#giornate .gchips{display:flex;flex-wrap:wrap;gap:8px}
#giornate .gchip{border:1.5px solid var(--bordo-forte,#cbd5e1);background:#fff;border-radius:999px;padding:8px 14px;font-size:16px;font-weight:600;cursor:pointer;color:var(--testo,#0f172a)}
#giornate .gchip.on{background:var(--blu,#0066ff);border-color:var(--blu,#0066ff);color:#fff}
#giornate .gchip.nuovo{border-style:dashed}
#giornate .gprop{border:2px solid #ff8800;background:#fff8f0}
#giornate .gcard{border-top:1px solid var(--bordo,#e2e8f0);padding-top:12px;display:flex;flex-direction:column;gap:12px}
#giornate .gcard:first-of-type{border-top:0;padding-top:0}
#giornate .grow{display:flex;gap:10px;flex-wrap:wrap}#giornate .grow>*{flex:1;min-width:150px}
#giornate .gday{border-top:1px solid var(--bordo,#e2e8f0);padding:12px 0;display:flex;flex-direction:column;gap:8px}
#giornate .gday:first-of-type{border-top:0;padding-top:0}
#giornate .gd{font-size:15px;font-weight:700;color:var(--testo-2,#475569);text-transform:capitalize}
#giornate .gv{display:flex;gap:10px;align-items:flex-start}
#giornate .gv .t{flex:1;min-width:0}#giornate .gv .w{font-weight:700;font-size:16px;color:var(--testo,#0f172a)}#giornate .gv .c{font-size:15px;color:var(--testo-2,#475569);overflow-wrap:anywhere}
#giornate .gv .az{display:flex;gap:4px;flex:none}
#giornate .gieri{display:flex;flex-direction:column;align-items:flex-start;gap:3px;width:100%;box-sizing:border-box;background:#fff;color:#0a2a4d;border:2px solid #0a2a4d;border-radius:12px;padding:12px 16px;cursor:pointer;text-align:left;font:inherit}
#giornate .gieri b{font-size:19px;font-weight:800}
#giornate .gieri span{font-size:16px;color:#334155;line-height:1.35}
#giornate .glink{background:none;border:0;color:var(--blu,#0066ff);text-decoration:underline;font-size:17px;cursor:pointer;padding:6px 4px}
#giornate .glink.rosso{color:var(--err,#dc2626)}
#giornate .gnota{font-size:14px;color:var(--testo-2,#475569)}
#giornate .gmsg{font-size:15px}#giornate .gmsg:empty{display:none}
#giornate .gmsg.ok{color:var(--ok,#16a34a)}#giornate .gmsg.err{color:var(--err,#dc2626)}
#giornate .gconf{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:15px}
#giornate .gconf .si{background:var(--err,#dc2626);color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}
#giornate .gcan{display:flex;gap:12px;align-items:baseline;border-top:1px solid var(--bordo,#e2e8f0);padding:10px 0;font-size:17px}
#giornate .gcan:first-of-type{border-top:0}
#giornate .gcan .n{flex:1;min-width:0;font-weight:700;color:var(--testo,#0f172a);overflow-wrap:anywhere}
#giornate .gcan .g{color:var(--testo-2,#475569);font-size:15px}
#giornate .gcan .e{font-weight:700;font-variant-numeric:tabular-nums;color:var(--testo,#0f172a);min-width:96px;text-align:right}
#giornate .gcan.tot{border-top:2px solid var(--testo,#0f172a);font-size:18px}
#giornate .gav{padding:0 0 10px;display:flex;flex-direction:column;gap:6px}
#giornate .gbar{height:10px;border-radius:6px;background:var(--bordo,#e2e8f0);overflow:hidden}
#giornate .gbar i{display:block;height:100%;background:var(--ok,#16a34a)}
#giornate .gav.giallo .gbar i{background:#d97706}#giornate .gav.rosso .gbar i{background:var(--err,#dc2626)}
#giornate .gavt{font-size:15px;color:var(--testo-2,#475569)}
#giornate .gav.giallo .gavt b{color:#b45309}#giornate .gav.rosso .gavt b{color:var(--err,#dc2626)}
#giornate .gpro{border:2px solid var(--blu,#0066ff)}
#giornate .gpr{border-top:1px solid var(--bordo,#e2e8f0);padding-top:12px;display:flex;flex-direction:column;gap:8px}
#giornate .gpr:first-of-type{border-top:0;padding-top:0}
#giornate .gpr .w{font-weight:700;font-size:17px;color:var(--testo,#0f172a)}
#giornate .gpr .c{font-size:16px;color:var(--testo-2,#475569);overflow-wrap:anywhere}
#giornate .gpr .grow button{flex:0 0 auto;min-width:0}
#giornate .gsi{background:var(--ok,#16a34a);color:#fff;border:0;border-radius:10px;padding:10px 18px;font-size:16px;font-weight:700;cursor:pointer}
#giornate .gno{background:#fff;color:var(--err,#dc2626);border:1.5px solid var(--bordo-forte,#cbd5e1);border-radius:10px;padding:10px 18px;font-size:16px;font-weight:700;cursor:pointer}
#giornate .gspunta{display:flex;gap:10px;align-items:center;font-size:17px;cursor:pointer}
#giornate .gspunta input{width:22px;height:22px;flex:none}
#giornate .gsera{background:#0a2a4d;color:#fff;border:0}
#giornate .gsera h4{color:#fff;font-size:24px}
#giornate .gsera .gnota{color:#cbd5e1;font-size:16px}
#giornate .gsera .gbig{font-size:21px}
#giornate .gora{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:17px}
#giornate .gora select{width:auto;min-width:120px}
#giornate .gmz{display:flex;flex-direction:column;gap:8px;margin-top:12px}
#giornate .gmzr{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:17px}
#giornate .gmzr b{min-width:110px;color:var(--testo,#0f172a);overflow-wrap:anywhere}
#giornate .gspe{display:flex;align-items:center;gap:10px;border:1.5px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:16px;background:#fff;margin-top:6px;cursor:pointer}
#giornate .gspe input{width:22px;height:22px;flex:0 0 auto}
#giornate .gspe span{flex:1;min-width:0;overflow-wrap:anywhere}
#giornate .gspe b{white-space:nowrap}
@media(max-width:560px){#giornate .gmzr b{flex-basis:100%}}
#giornate .gvuoto{color:var(--testo-2,#475569);text-align:center;padding:8px 0}
`;
  const st=document.createElement("style"); st.id="gior-stile"; st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
})();

/* ---------------------------------------------------------------------
   LETTURA
   --------------------------------------------------------------------- */
/* 11 nov 2026 — COSA E' UNA GIORNATA, scritto in un posto solo: un
   rapportino, oppure le ore sciolte di un cantiere in un giorno. La usa
   questa sezione e la usa «Il tuo mese» in cima all'Assistente: cosi' i due
   numeri non possono dire cose diverse. */
function giorGruppi(ore,rap){
  const gruppi={};
  (ore||[]).forEach(o=>{
    if(o.rapportino_id){ const r=rap[o.rapportino_id]; if(!r||r.eliminato_il) return; }
    const k=o.rapportino_id||("L"+o.lavoro_id+"|"+o.data);
    if(!gruppi[k]) gruppi[k]={k,data:o.data,lavoro_id:o.lavoro_id,rapportino_id:o.rapportino_id||null,ore:[],cosa:""};
    gruppi[k].ore.push(o);
  });
  return gruppi;
}
async function giorCarica(){
  const a=giorMese+"-01", b=_gSposta(giorMese,1)+"-01";
  const [ro,rl,rh]=await Promise.all([
    sb.from("gest_operatori").select("id,nome,mestiere_id,costo_orario").eq("user_id",sbUid).is("eliminato_il",null).order("nome"),
    sb.from("gest_lavori").select("id,descrizione,dove,stato,mestiere_id,created_at").eq("user_id",sbUid).is("eliminato_il",null).order("created_at",{ascending:false}).limit(200),
    sb.from("gest_ore").select("id,data,ore,operatore_id,lavoro_id,rapportino_id,mestiere_id").eq("user_id",sbUid).is("eliminato_il",null).gte("data",a).lt("data",b)
  ]);
  if(ro.error||rl.error||rh.error){ throw new Error((ro.error||rl.error||rh.error).message); }
  giorOps=_gNelReparto(ro.data,true); giorLav=_gNelReparto(rl.data);
  const ore=_gNelReparto(rh.data);
  const ids=[...new Set(ore.map(o=>o.rapportino_id).filter(Boolean))];
  let rap={};
  if(ids.length){
    /* 20 nov 2026 — anche la DIDASCALIA (il lavoro svolto, per il cliente).
       Paracadute: se la colonna non c'e' ancora (migrazione non lanciata) si
       rilegge senza, e le giornate si vedono lo stesso. */
    let rr=await sb.from("gest_rapportini").select("id,note,materiali,data,lavoro_id,eliminato_il,didascalia").in("id",ids);
    giorDidaManca=!!(rr.error&&/didascalia/i.test(rr.error.message||""));
    if(giorDidaManca) rr=await sb.from("gest_rapportini").select("id,note,materiali,data,lavoro_id,eliminato_il").in("id",ids);
    if(rr.error) throw new Error(rr.error.message);
    (rr.data||[]).forEach(r=>{ rap[r.id]=r; });
  }
  const gruppi=giorGruppi(ore,rap);
  Object.values(gruppi).forEach(g=>{
    const r=g.rapportino_id&&rap[g.rapportino_id];
    g.cosa=r?[r.note,r.materiali?("Materiali: "+r.materiali):""].filter(Boolean).join(" · "):"";
    g.nota=r?(r.note||""):"";
    g.didascalia=r?(r.didascalia||""):"";   /* 20 nov 2026: il lavoro svolto, per il cliente */   /* 18 nov 2026: «modifica» cambia solo la nota (i materiali restano nella loro casella, se no si scrivevano due volte) */
  });
  giorRighe=Object.values(gruppi).sort((x,y)=>x.data.localeCompare(y.data));
  /* 13 nov 2026 (quarto giro) — UN LAVORO NEL CESTINO NON SI CONTA. Le sue
     ore restavano in Giornate (le ore non vanno nel Cestino col lavoro).
     Si chiede al database quali lavori del mese sono ancora vivi (sb.from
     salta il Cestino) e di che reparto sono: le giornate dei lavori buttati
     escono dall'elenco e dai conti. Se la lettura cade non si toglie niente. */
  /* 14 nov 2026 (quinto giro, n. 4) — la regola sta in giorLavoriVivi(), qui
     sotto: la usa anche la Squadra (js/gest-squadra-giornate.js). */
  giorLavVivi=await giorLavoriVivi(giorRighe.map(g=>g.lavoro_id));
  if(giorLavVivi) giorRighe=giorRighe.filter(g=>!g.lavoro_id||(String(g.lavoro_id) in giorLavVivi));
  /* il costo orario: le tariffe di TUTTI (anche chi sta nel Cestino, le sue ore
     restano) e la media dei vivi — la stessa costiOrari() del margine dei
     lavori (gest-ore-spese.js). Se la lettura cade, niente costi: meglio
     nessun numero che un numero sbagliato. */
  giorTariffe={per:{},media:0,letto:false};
  try{
    const leggi=(typeof sb.raw==="function")?sb.raw:sb.from.bind(sb);
    const rt=await leggi("gest_operatori").select("id,costo_orario").eq("user_id",sbUid);
    if(!rt.error&&typeof costiOrari==="function"){ giorTariffe=costiOrari(rt.data||[],giorOps); giorTariffe.letto=true; }
  }catch(e){}
  /* 3 nov 2026 — «stai andando in perdita»: per i cantieri del mese, quanto
     hanno gia' speso DA SEMPRE (spese + fornitori + manodopera) rispetto a
     quanto valgono. Lo stesso conto della scheda del lavoro: margineLavoro. */
  giorAvanz={};
  try{
    const ids=[...new Set(giorRighe.map(g=>g.lavoro_id).filter(Boolean))];
    if(ids.length&&typeof margineLavoro==="function"&&typeof costoManodopera==="function"&&giorTariffe.letto){
      const [rl2,rs,rf,rh2]=await Promise.all([
        sb.from("gest_lavori").select("id,importo,stato").in("id",ids),
        sb.from("gest_spese").select("lavoro_id,importo").in("lavoro_id",ids),
        sb.from("gest_fatture_fornitori").select("lavoro_id,importo").in("lavoro_id",ids),
        sb.from("gest_ore").select("lavoro_id,operatore_id,ore").eq("user_id",sbUid).in("lavoro_id",ids)
      ]);
      if(!rl2.error&&!rs.error&&!rf.error&&!rh2.error){
        const sp={},ff={};
        (rs.data||[]).forEach(x=>{sp[x.lavoro_id]=(sp[x.lavoro_id]||0)+(+x.importo||0);});
        (rf.data||[]).forEach(x=>{ff[x.lavoro_id]=(ff[x.lavoro_id]||0)+(+x.importo||0);});
        /* 25 nov 2026 — anche le spese fatte con la carta per quel lavoro */
        try{if(typeof cartePerLavoro==="function"){const ct=cartePerLavoroTot(await cartePerLavoro(ids));Object.keys(ct).forEach(k=>{sp[k]=(sp[k]||0)+ct[k];});}}catch(_){}
        const md=giorManodopera(rh2.data||[]).per;
        (rl2.data||[]).forEach(l=>{
          const imp=+l.importo||0; if(imp<=0) return;
          const speso=imp-margineLavoro(imp,sp[l.id],ff[l.id],md[String(l.id)]);
          giorAvanz[String(l.id)]={importo:imp,speso,fatto:l.stato==="fatto"};
        });
      }
    }
  }catch(e){}
  /* le giornate mandate dagli operai senza il permesso «Rapportini» */
  /* 11 nov 2026 — «COME IERI»: chi c'era e dove, l'ultima volta che hai
     scritto una giornata prima di oggi (anche se era il mese scorso). Si
     ripropone uguale con la data di oggi; il cosa-si-e'-fatto resta vuoto. */
  giorUltima=null;
  try{
    const oggi=_gOggi();
    let qU=sb.from("gest_ore").select("data").eq("user_id",sbUid).is("eliminato_il",null).lt("data",oggi);
    if(_gMest()) qU=qU.eq("mestiere_id",_gMest());   /* 24 nov 2026: «Come ieri» del reparto */
    const ru=await qU.order("data",{ascending:false}).limit(1);
    let dU=!ru.error&&ru.data&&ru.data[0]&&ru.data[0].data;
    /* piu' vecchia di una settimana non e' «come ieri»: non si propone */
    if(dU&&(new Date(oggi+"T12:00")-new Date(dU+"T12:00"))/864e5>7) dU=null;
    if(dU){
      const rg=await sb.from("gest_ore").select("operatore_id,lavoro_id,rapportino_id,mestiere_id").eq("user_id",sbUid).is("eliminato_il",null).eq("data",dU);
      if(!rg.error&&rg.data) rg.data=_gNelReparto(rg.data);
      if(!rg.error&&rg.data&&rg.data.length){
        const per={};
        rg.data.forEach(o=>{ const k=String(o.lavoro_id||""); (per[k]||(per[k]=new Set())).add(String(o.operatore_id||"")); });
        const schede=Object.keys(per).map(k=>{
          const l=giorLavoro(k);
          const chi=new Set([...per[k]].map(id=>giorOps.find(x=>String(x.id)===id)).filter(Boolean).map(o=>o.nome));
          return {dove:l?_gNomeLav(l):"",chi};
        }).filter(c=>c.dove&&c.chi.size);
        if(schede.length) giorUltima={data:dU,schede};
      }
    }
  }catch(e){ giorUltima=null; }
  giorProposte=[];
  try{
    const rp=await sb.from("gest_giornate_proposte").select("*").eq("user_id",sbUid).eq("stato","da_vedere").order("data",{ascending:false}).limit(50);
    if(!rp.error) giorProposte=rp.data||[];
  }catch(e){}
  /* il consulente del lavoro */
  try{
    const rc=await sb.from("gest_azienda").select("cdl_email,cdl_invio,cdl_ultimo").eq("user_id",sbUid).maybeSingle();
    if(!rc.error) giorCdl={email:(rc.data&&rc.data.cdl_email)||"",invio:!!(rc.data&&rc.data.cdl_invio),ultimo:(rc.data&&rc.data.cdl_ultimo)||""};
  }catch(e){}
  /* 10 nov 2026 — foto, spese, benzina e fatture del mese (js/gest-giornate-extra.js) */
  if(typeof gxCarica==="function"){ try{ await gxCarica(); }catch(e){} }
  giorContatore();
}
/* il numero accanto a «Giornate» nel menu: quante ne aspettano il capo */
function giorContatore(){
  const b=document.getElementById("tab-giornate"); if(!b) return;
  let c=b.querySelector(".gior-cnt");
  if(!giorProposte.length){ if(c) c.remove(); return; }
  if(!c){ c=document.createElement("span"); c.className="tab-cnt gior-cnt"; b.appendChild(c); }
  c.textContent=giorProposte.length;
}
/* 13 nov 2026 (quarto giro) — LA MANODOPERA SI CONTA COME NEL LAVORO.
   Le ore «senza nome» (o di chi non ha il costo orario) valgono la media del
   REPARTO di quel lavoro, la stessa di caricaManodopera() in
   gest-ore-spese.js. Prima qui si usava la media di TUTTO l'account: in un
   reparto senza costi orari Giornate diceva 168,75 € e la scheda del lavoro
   diceva «non entrano nel margine». Adesso dicono lo stesso numero. */
let giorLavVivi=null;
/* UN LAVORO NEL CESTINO NON SI CONTA — la regola, in UN posto solo.
   Dati gli id dei lavori, torna {id: reparto} dei soli lavori ancora VIVI
   (sb.from salta il Cestino). Torna null se la lettura cade: chi chiama in
   quel caso non toglie niente. La usano Giornate e Squadra. */
async function giorLavoriVivi(ids){
  try{
    const _idsL=[...new Set((ids||[]).filter(Boolean).map(String))];
    if(!_idsL.length) return {};
    const _rv=await sb.from("gest_lavori").select("id,mestiere_id").in("id",_idsL);
    if(_rv.error) return null;
    const vivi={}; (_rv.data||[]).forEach(l=>{ vivi[String(l.id)]=String(l.mestiere_id||""); });
    return vivi;
  }catch(e){ return null; }
}
function giorManodopera(righe){
  const out={per:{},senzaNome:{}};
  if(!(typeof costoManodopera==="function"&&giorTariffe.letto)) return out;
  if(!giorLavVivi) return costoManodopera(righe,[],giorTariffe);   /* reparti non letti: come prima */
  const perRep={};
  (righe||[]).forEach(r=>{ const mid=giorLavVivi[String(r.lavoro_id)]; if(mid===undefined) return; (perRep[mid]=perRep[mid]||[]).push(r); });
  Object.keys(perRep).forEach(mid=>{
    let somma=0,n=0;
    giorOps.forEach(o=>{ if(String(o.mestiere_id||"")===mid){ const c=+o.costo_orario||0; if(c>0){somma+=c;n++;} } });
    const m=costoManodopera(perRep[mid],[],{per:giorTariffe.per,media:n?somma/n:0});
    Object.assign(out.per,m.per); Object.assign(out.senzaNome,m.senzaNome);
  });
  return out;
}
/* quanto e' costata la manodopera, cantiere per cantiere, nel mese */
function giorCostiCantieri(){
  const righe=[]; giorRighe.forEach(g=>g.ore.forEach(o=>righe.push({lavoro_id:g.lavoro_id,operatore_id:o.operatore_id,ore:o.ore})));
  const m=giorManodopera(righe);
  const can={};
  giorRighe.forEach(g=>{
    const k=String(g.lavoro_id);
    if(!can[k]) can[k]={id:k,nome:_gNomeLav(giorLavoro(g.lavoro_id)),giorni:new Set(),euro:0};
    can[k].giorni.add(g.data);
  });
  Object.keys(can).forEach(k=>{ can[k].euro=+m.per[k]||0; });
  return Object.values(can).sort((a,b)=>b.euro-a.euro||b.giorni.size-a.giorni.size);
}
function _gEuro(n){ return (+n||0).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true})+"\u00a0€"; }
function giorNomeOp(id){ const o=giorOps.find(x=>String(x.id)===String(id)); return o?o.nome:"Senza nome"; }
function giorLavoro(id){ return giorLav.find(x=>String(x.id)===String(id)); }

/* giorni per persona: una persona conta UN giorno per data, anche se e' in
   due cantieri. Le ore servono solo per chi ha fatto mezze giornate. */
function giorTotali(righe){
  const per={}, luo={}, visti=new Set();
  righe.forEach(g=>{
    g.ore.forEach(o=>{
      const n=giorNomeOp(o.operatore_id);
      per[n]=per[n]||{g:0,o:0};
      const k=o.operatore_id+"|"+g.data;
      if(!visti.has(k)){ visti.add(k); per[n].g++; }
      per[n].o+= +o.ore||0;
    });
    const L=_gNomeLav(giorLavoro(g.lavoro_id));
    luo[L]=luo[L]||new Set(); luo[L].add(g.data);
  });
  const luoghi={}; Object.keys(luo).forEach(k=>{ luoghi[k]=luo[k].size; });
  return {per,luoghi};
}

/* ---------------------------------------------------------------------
   DISEGNO
   --------------------------------------------------------------------- */
async function renderGiornate(){
  const box=document.getElementById("gior-box"); if(!box) return;
  /* 27 nov 2026 — dopo una giornata salvata, cambiata o cancellata Squadra
     diceva ancora «0 giorni» finché non si ricaricava: le sezioni che contano
     le giornate si ridisegnano alla prossima apertura. */
  try{ if(typeof _tabSporchi!=="undefined") ["squadra","riepilogo","report","calendario"].forEach(t=>_tabSporchi.add(t)); }catch(_){}
  /* 24 nov 2026 — allo studio niente «Acquisti del mese» (merce letta da
     fatture e bolle): tolto in Fornitori il 20 nov, restava qui. */
  { const ab=document.querySelector('#giornate [data-acq="mese"]'); if(ab) ab.style.display=_gPro()?"none":""; }
  if(!giorMese) giorMese=_gOggi().slice(0,7);
  if(typeof sb==="undefined"||!sb||!sbUid){ box.innerHTML='<div class="gb"><div class="gvuoto">Accedi per segnare le giornate.</div></div>'; return; }
  if(!giorSera) giorSeraLeggi().then(()=>{ if(document.getElementById("gior-box")&&!giorProp) giorDisegna(); }).catch(()=>{});
  try{ await giorCarica(); }
  catch(e){ box.innerHTML='<div class="gb">'+nonLettaHTML("le giornate","giornate")+'</div>'; return; }   /* 12 nov 2026 — regola 20 */
  giorDisegna();
}

let giorImpAperto=false;   /* 6 nov 2026: le Impostazioni di Giornate restano aperte se le hai aperte tu */
let giorMsgSchede=null;     /* 18 nov 2026: l'ultimo messaggio scritto sopra le schede (se si ridisegna da solo non deve sparire) */
function giorDisegna(msg){
  const box=document.getElementById("gior-box"); if(!box) return;
  giorMsgSchede=giorProp?(msg||null):null;
  const ta=document.getElementById("gior-voce"); if(ta) giorVoce=ta.value;
  const {per}=giorTotali(giorRighe);
  const date=[...new Set(giorRighe.map(g=>g.data))].sort().reverse();
  const tot=Object.entries(per).sort((a,b)=>b[1].g-a[1].g);
  let h=`<div class="gm"><button type="button" data-gior="prev" aria-label="Mese prima">‹</button><h3>${esc(_gMeseNome(giorMese))}</h3><button type="button" data-gior="next" aria-label="Mese dopo">›</button></div>`;
  if(tot.length) h+=`<div class="gt">${tot.map(([n,t])=>`<div><span>${esc(n)}</span><b>${t.g}</b><span>${t.g===1?"giorno":"giorni"}</span></div>`).join("")}</div>`;

  if(giorProposte.length){
    h+=`<div class="gb gpro"><h4>Da approvare (${giorProposte.length})</h4><div class="gnota">${_gP("Le hanno mandate i tuoi operai. «Approva» le mette nel mese con 8 ore, insieme a foto, spese e bolle.","Le hanno mandate i tuoi collaboratori. «Approva» le mette nel mese con 8 ore, insieme a foto e spese.")}</div>`;
    giorProposte.forEach(p=>{
      h+=`<div class="gpr"><div class="w gior-u">${esc(giorNomeOp(p.operatore_id))} · ${esc(_gData(p.data))}</div>
        <div class="c gior-u"><b>${esc(p.dove)}</b>${p.cosa?" — "+esc(p.cosa):""}</div>
        ${typeof gpcExtraHTML==="function"?gpcExtraHTML(p):""}
        <div class="grow"><button type="button" class="gsi" data-gior="pro-si" data-id="${esc(p.id)}">Approva</button><button type="button" class="gno" data-gior="pro-no" data-id="${esc(p.id)}">Scarta</button></div></div>`;
    });
    h+=`</div>`;
  }

  if(giorDallaSera){
    h+=`<div class="gb gsera"><h4>Com'è andata oggi?</h4><div class="gnota">Premi e racconta: chi c'era, dove, cosa avete fatto, cosa avete speso.</div>
      <button type="button" class="gbig" data-gior="sera-parla">Parla</button></div>`;
  }

  h+=`<div class="gb"><h4>Racconta la giornata</h4>
    <textarea id="gior-voce" placeholder="${_gP("«Oggi io, Wahid e Luis a Campoloniano, rifatto il tetto»","«Oggi io e Giulia sopralluogo per la CILA Rossi, poi visure al catasto»")}">${esc(giorVoce)}</textarea>
    <button type="button" class="gbig" data-gior="compila" ${giorOccupato?"disabled":""}>${giorOccupato?"Ci penso…":"Compila la giornata"}</button>
    <div class="gmsg ${msg&&msg.k||""}" id="gior-msg">${esc(msg&&msg.t||"")}</div>
    ${!giorProp&&giorUltima?giorIeriHTML():""}
    ${giorProp?"":'<button type="button" class="glink" data-gior="mano" style="align-self:flex-start">Oppure scrivila a mano</button>'}
  </div>`;

  if(giorProp) h+=giorDisegnaProp();

  h+=`<div class="gb"><h4>Il mese</h4>`;
  /* 7 nov 2026: il PDF del mese si offre solo se nel mese c'e' qualcosa */
  document.querySelectorAll('[data-gior="pdf"],[data-gior="riep"]').forEach(bp=>{ bp.style.display=date.length?"":"none"; });
  if(!date.length) h+=`<div class="gvuoto">Nessuna giornata in ${esc(_gMeseNome(giorMese))}.</div>`;
  if(date.length&&typeof gxHtmlTotali==="function") h+=gxHtmlTotali();
  date.forEach(d=>{
    h+=`<div class="gday"><div class="gd">${esc(_gData(d))}</div>`;
    giorRighe.filter(g=>g.data===d).forEach((g,gi)=>{
      const chi=[...new Set(g.ore.map(o=>giorNomeOp(o.operatore_id)))];
      const mezze=g.ore.filter(o=>(+o.ore||0)<GIOR_ORE_GIORNO).map(o=>giorNomeOp(o.operatore_id)+" "+String(+o.ore).replace(".",",")+" ore");
      const L=_gNomeLav(giorLavoro(g.lavoro_id));
      h+=`<div class="gv"><div class="t"><div class="w gior-u">${esc(chi.join(", "))}</div>
        <div class="c gior-u">${esc(L)}${g.cosa?" — "+esc(g.cosa):""}${mezze.length?" ("+esc(mezze.join(", "))+")":""}</div></div>
        <div class="az">${g.rapportino_id?`<button type="button" class="glink" data-gior="mod" data-k="${esc(g.k)}">modifica</button>`:""}<button type="button" class="glink rosso" data-gior="del" data-k="${esc(g.k)}">cancella</button></div></div>`;
      if(giorModifica===g.k){
        h+=`<div class="gcard"><textarea id="gior-mod-t">${esc(g.nota!=null?g.nota:g.cosa)}</textarea><div class="grow"><button type="button" class="gbig blu" data-gior="mod-salva" data-k="${esc(g.k)}">Salva</button><button type="button" class="btn" data-gior="mod-no" style="flex:0 0 auto">Annulla</button></div></div>`;
      }
      if(giorConferma===g.k){
        h+=`<div class="gconf">Mettere nel cestino la giornata di ${esc(_gData(g.data).toLowerCase())} (${esc(chi.join(", "))})? La riprendi dal Cestino. <button type="button" class="si" data-gior="del-si" data-k="${esc(g.k)}">Sì, nel cestino</button><button type="button" class="btn" data-gior="del-no">No</button></div>`;
      }
      /* 10 nov 2026 — cosa c'e' in questa giornata e i quattro pulsanti */
      if(typeof gxHtmlGiorno==="function") h+=gxHtmlGiorno(g,gi===0);
    });
    h+=`</div>`;
  });
  h+=`</div>`;

  /* i cantieri del mese, con il costo della manodopera */
  const can=giorCostiCantieri();
  if(can.length){
    const conCosto=can.some(c=>c.euro>0);
    h+=`<div class="gb"><h4>${_gP("I cantieri del mese","Le pratiche del mese")}</h4>`;
    can.forEach(c=>{
      /* 24 nov 2026 (giro dello studio) — dalla giornata si apre la pratica/il lavoro */
      h+=`<div class="gcan"><span class="n gior-u">${c.id?`<button type="button" class="aic-link" style="padding:2px 0;text-align:left;font-size:inherit;min-height:44px;display:inline-flex;align-items:center" data-action="edit-job" data-id="${esc(String(c.id))}">${esc(c.nome)} ›</button>`:esc(c.nome)}</span><span class="g">${c.giorni.size} ${c.giorni.size===1?"giorno":"giorni"}</span>${conCosto?`<span class="e">${esc(_gEuro(c.euro))}</span>`:""}</div>`;
      const a=giorAvanz[c.id];
      if(a&&!a.fatto){
        const pc=Math.round(a.speso/a.importo*100), w=Math.max(0,Math.min(100,pc));
        const cl=pc>=100?"rosso":pc>=80?"giallo":"";
        h+=`<div class="gav ${cl}"><div class="gbar"><i style="width:${w}%"></i></div>
          <div class="gavt">${pc>=100?"<b>In perdita:</b> ":pc>=80?"<b>Attenzione:</b> ":""}speso finora il ${pc}% di ${esc(_gEuro(a.importo))}${pc>=100?" — esce più di quello che entra":pc>=80?" — stai per andare in perdita":""}</div></div>`;
      }
    });
    if(conCosto){
      const tot=can.reduce((a,c)=>a+c.euro,0);
      h+=`<div class="gcan tot"><span class="n">${_gP("Manodopera del mese","Tempo speso nel mese")}</span><span class="e">${esc(_gEuro(tot))}</span></div>
        <div class="gnota">${_gP("Ore segnate × costo orario di ognuno (lo scrivi in Squadra).","Ore segnate × costo orario di ognuno (lo scrivi in Collaboratori).")}</div>`;
    } else {
      h+=_gPro()?`<div class="gnota">Scrivi il costo orario dei tuoi collaboratori in <button type="button" class="glink" data-gior="squadra">Collaboratori</button> e qui vedi quanto ti costa ogni pratica.</div>`
        :`<div class="gnota">Scrivi il costo orario dei tuoi operai in <button type="button" class="glink" data-gior="squadra">Squadra</button> e qui vedi quanto ti costa ogni cantiere.</div>`;
    }
    h+=`</div>`;
  }

  /* 6 nov 2026 — LE IMPOSTAZIONI SI CHIUDONO (ok di Alex). La domanda della
     sera e il consulente del lavoro si impostano una volta e poi non si
     toccano piu': stavano sempre aperti in fondo alla pagina. Adesso stanno
     dentro «Impostazioni», chiuso. Resta aperto se l'avevi aperto tu
     (giorImpAperto), cosi' premendo Salva la pagina non si richiude. */
  h+=`<details class="gb gimp" id="gior-imp"${giorImpAperto?" open":""}><summary class="gimp-t">Impostazioni <span>notifica della sera e consulente del lavoro</span></summary>`;

  /* la domanda della sera, su questo telefono */
  h+=giorSeraBox();

  /* il consulente del lavoro */
  if(giorCdl){
    h+=`<div class="gb"><h4>Consulente del lavoro</h4>
      <div class="gnota">Il primo di ogni mese gli mando le giornate del mese finito: giorni e ore di ognuno, ${_gP("cantiere per cantiere","pratica per pratica")}, e il file per Excel.</div>
      <input type="text" id="gior-cdl-email" inputmode="email" autocomplete="email" placeholder="Email del consulente" value="${esc(giorCdl.email)}">
      <label class="gspunta"><input type="checkbox" id="gior-cdl-invio" ${giorCdl.invio?"checked":""}> Mandagliele ogni mese</label>
      <div class="grow"><button type="button" class="gbig blu" data-gior="cdl-salva">Salva</button><button type="button" class="btn" data-gior="cdl-prova" style="flex:0 0 auto">Mandale a me per prova</button></div>
      ${giorCdl.ultimo?`<div class="gnota">Ultimo mese mandato: ${esc(_gMeseNome(giorCdl.ultimo).toLowerCase())}.</div>`:""}
      <div class="gmsg" id="gior-cdl-msg"></div>
    </div>`;
  }
  h+=`</details>`;
  box.innerHTML=h;
  const imp=document.getElementById("gior-imp");
  if(imp) imp.addEventListener("toggle",function(){ giorImpAperto=imp.open; });
}

function giorDisegnaProp(){
  if(!_gIo()&&giorOps.length<=1&&giorProp){
    if(giorNomeTitolare===null){
      if(!giorIoProvato){ giorIoProvato=true; giorLeggiTitolare().then(()=>{ if(giorProp){ giorLeggiProp(); giorDisegna(giorMsgSchede); } }).catch(()=>{}); }
    } else giorIoSubito();
  }
  const io=_gIo();
  /* da soli: nelle schede vuote c'e' gia' lui */
  if(io&&io!=="-"&&giorOps.length===1&&giorProp){
    const o1=giorOps.find(x=>String(x.id)===String(io)), n=o1&&o1.nome; if(n) giorProp.forEach(c=>{ if(!c.chi.size||c.chi.has("IO")){ c.chi.delete("IO"); c.chi.add(n); } });
  }
  const serveIo=giorProp.some(c=>c.chi.has("IO"))&&!io;
  let h=`<div class="gb gprop"><h4>${giorModK?"Modifica la giornata":"Controlla e salva"}</h4>`;
  if(serveIo){
    h+=`<div><div class="glab">${_gP("Hai detto «io»: tu chi sei nella squadra?","Hai detto «io»: tu chi sei fra i collaboratori?")}</div><select data-gior-io>
      <option value="">Scegli…</option>${giorOps.map(o=>`<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join("")}
      <option value="+">Non ci sono ancora: aggiungimi</option>
      <option value="-">${_gP("Non lavoro in cantiere (non contare me)","Non contare le mie ore")}</option></select>
      ${giorIoNuovo?`<div class="grow" style="margin-top:8px"><input type="text" id="gior-io-nome" placeholder="Il tuo nome"><button type="button" class="btn" data-gior="io-ok" style="flex:0 0 auto">Aggiungi</button></div>`:""}</div>`;
  }
  const lavNomi=[...new Set(giorLav.map(_gNomeLav))];
  h+=`<datalist id="gior-lavori">${lavNomi.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>`;
  giorProp.forEach((c,i)=>{
    const nomi=giorOps.map(o=>o.nome).concat(giorNuovi);
    h+=`<div class="gcard" data-card="${i}">
      <div class="grow"><div><div class="glab">Giorno</div><input type="date" data-f="data" value="${esc(c.data)}"></div>
      <div><div class="glab">Cantiere</div><input type="text" data-f="dove" list="gior-lavori" value="${esc(c.dove)}" placeholder="${_gP("Es. Campoloniano","Es. CILA Rossi")}"></div></div>
      <div><div class="glab">Chi ha lavorato</div><div class="gchips">${nomi.map(n=>{
        const on=c.chi.has(n)||(c.chi.has("IO")&&io&&io!=="-"&&giorNomeOp(io)===n);
        const nuovo=giorNuovi.includes(n);
        return `<button type="button" class="gchip ${on?"on":""} ${nuovo?"nuovo":""}" data-gior="chip" data-i="${i}" data-n="${esc(n)}">${nuovo?"+ ":""}${esc(n)}</button>`;}).join("")}
        <button type="button" class="gchip nuovo" data-gior="piu" data-i="${i}">+ nuovo</button></div>
        ${giorAggiungi===i?`<div class="grow" style="margin-top:8px"><input type="text" id="gior-nuovo" placeholder="Nome"><button type="button" class="btn" data-gior="piu-ok" data-i="${i}" style="flex:0 0 auto">Aggiungi</button></div>`:""}
        ${giorNuovi.length?'<div class="gnota" style="margin-top:6px">I nomi col «+» non sono ancora in Squadra: se li lasci accesi, al Salva li aggiungo io.</div>':""}
        ${giorMezzeHTML(c,i,nomi,io)}</div>
      <div><div class="glab">Cosa avete fatto</div><textarea data-f="cosa" id="gior-cosa-${i}" data-cg-gia="${esc(c.daAI||"")}" placeholder="${_gP("Spese e note qui","Cosa avete fatto, note")}">${esc(c.cosa)}</textarea></div>
      ${giorModK?"":giorSpeseHTML(c,i)}
      ${giorProp.length>1?`<button type="button" class="glink rosso" data-gior="togli" data-i="${i}" style="align-self:flex-start">Togli questa</button>`:""}
    </div>`;
  });
  h+=`<div class="grow"><button type="button" class="gbig blu" data-gior="salva">Salva</button><button type="button" class="btn" data-gior="annulla" style="flex:0 0 auto">Annulla</button></div>
    <div class="gnota">Una giornata intera vale ${GIOR_ORE_GIORNO} ore, mezza giornata ${GIOR_ORE_GIORNO/2}. Se una persona sta in due cantieri lo stesso giorno, le ore si dividono.</div></div>`;
  return h;
}
/* 18 nov 2026 — GIORNATA INTERA O MEZZA (ok di Alex). Sotto i nomi, una riga
   per ogni persona accesa: «Giornata intera» / «Mezza giornata». Prima il
   capo non poteva segnare mezza giornata (e se la dettava, l'AI la scriveva
   nel testo ma le ore restavano 8). c.mezza e' l'insieme dei nomi a mezza. */
function _gMezza(c,n,io){ const m=c.mezza; if(!m) return false; return m.has(n)||(m.has("IO")&&io&&io!=="-"&&giorNomeOp(io)===n); }
function giorMezzeHTML(c,i,nomi,io){
  const accesi=nomi.filter(n=>c.chi.has(n)||(c.chi.has("IO")&&io&&io!=="-"&&giorNomeOp(io)===n));
  if(!accesi.length) return "";
  return `<div class="gmz">${accesi.map(n=>{ const mz=_gMezza(c,n,io);
    return `<div class="gmzr"><b>${esc(n)}</b><button type="button" class="gchip ${mz?"":"on"}" data-gior="mz" data-i="${i}" data-n="${esc(n)}" data-v="0">Giornata intera</button><button type="button" class="gchip ${mz?"on":""}" data-gior="mz" data-i="${i}" data-n="${esc(n)}" data-v="1">Mezza giornata</button></div>`; }).join("")}</div>`;
}

/* le caselle delle schede si rileggono prima di ridisegnare */
function giorLeggiProp(){
  if(!giorProp) return;
  document.querySelectorAll("#giornate [data-card]").forEach(el=>{
    const c=giorProp[+el.dataset.card]; if(!c) return;
    const v=f=>{ const x=el.querySelector('[data-f="'+f+'"]'); return x?x.value:""; };
    c.data=v("data")||c.data; c.dove=v("dove"); c.cosa=v("cosa");
  });
}

/* ---------------------------------------------------------------------
   L'AI: dal racconto alle schede
   --------------------------------------------------------------------- */
async function giorToken(){
  try{ const r=await sb.auth.getSession(); return r&&r.data&&r.data.session&&r.data.session.access_token; }catch(e){ return null; }
}
function giorIeriHTML(){
  const ieri=new Date(); ieri.setDate(ieri.getDate()-1);
  const tit=giorUltima.data===_gYmd(ieri)?"Come ieri":"Come "+_gData(giorUltima.data);
  const det=giorUltima.schede.map(c=>[...c.chi].join(", ")+" · "+c.dove).join(" — ");
  return `<button type="button" class="gieri" data-gior="ieri"><b>${esc(tit)}</b><span class="gior-u">${esc(det)}</span></button>`;
}
function giorDaNome(n){
  const k=_gNorm(n); if(!k) return null;
  if(n==="IO") return "IO";
  const o=giorOps.find(x=>_gNorm(x.nome)===k) || giorOps.find(x=>_gNorm(x.nome).split(" ")[0]===k.split(" ")[0]);
  if(o) return o.nome;
  /* 27 nov 2026: detto solo il cognome («Rossi») o un nome che non sta per primo:
     se in Squadra c'è UNA sola persona con quella parola nel nome, è lei (niente doppione) */
  if(!k.includes(" ")&&k.length>=3){
    const tanti=giorOps.filter(x=>_gNorm(x.nome).split(" ").includes(k));
    if(tanti.length===1) return tanti[0].nome;
  }
  return null;
}
async function giorCompila(){
  const ta=document.getElementById("gior-voce"); const t=(ta&&ta.value||"").trim(); giorVoce=t;
  if(t.length<5){ giorDisegna({t:"Detta o scrivi prima com'è andata la giornata.",k:"err"}); return; }
  const tk=await giorToken(); if(!tk){ giorDisegna({t:"Sessione scaduta: esci e rientra.",k:"err"}); return; }
  giorLeggiProp(); giorOccupato=true; giorNuovaSi=new Set(); giorDisegna();
  let j=null, err="";
  try{
    const r=await fetch(GIOR_URL_AI,{method:"POST",headers:{Authorization:"Bearer "+tk,"Content-Type":"application/json"},
      body:JSON.stringify({modo:"giornata",testo:t.slice(0,3000),oggi:_gOggi(),squadra:giorOps.map(o=>o.nome),cantieri:[...new Set(giorLav.map(_gNomeLav))].slice(0,80)})});
    const b=await r.json().catch(()=>({}));
    if(r.ok&&b.result) j=b.result; else err=b.error||"Il servizio non ha risposto.";
  }catch(e){ err="Niente rete. Riprova, oppure scrivila a mano."; }
  giorOccupato=false;
  const lista=(j&&Array.isArray(j.giornate))?j.giornate:[];
  if(!lista.length){ giorDisegna({t:err||"Non ho capito chi ha lavorato e dove. Riprova con parole diverse, oppure scrivila a mano.",k:"err"}); return; }
  giorNuovi=[];
  giorProp=lista.slice(0,10).map(g=>{
    const chi=new Set();
    (Array.isArray(g.chi)?g.chi:[]).forEach(n=>{
      n=String(n||"").trim(); if(!n) return;
      const x=giorDaNome(n);
      if(x){ chi.add(x); return; }
      const N=n.charAt(0).toUpperCase()+n.slice(1);
      if(!giorNuovi.includes(N)) giorNuovi.push(N);
      chi.add(N);
    });
    const d=/^\d{4}-\d\d-\d\d$/.test(g.data||"")?g.data:_gOggi();
    /* l'AI a volte lascia tutto minuscolo: la maiuscola la mettiamo noi */
    let dove=String(g.dove||"").trim().slice(0,120);
    if(dove===dove.toLowerCase()) dove=dove.replace(/(^|\s)(\S)/g,(m,a,b)=>a+b.toUpperCase());
    let cosa=String(g.cosa||"").trim().slice(0,2000);
    cosa=cosa.charAt(0).toUpperCase()+cosa.slice(1);
    /* 18 nov 2026: «mezza giornata» detta nel racconto accende «Mezza giornata» per chi sta in quella scheda (si vede e si cambia prima del Salva) */
    const mezza=/mezza\s+giornata/i.test(cosa)?new Set(chi):new Set();
    if(_gPro()) dove=giorPraticaDa(dove,cosa);
    /* 27 nov 2026: daAI = il testo l'ha gia' scritto l'AI; il correttore non lo rigira (prima «Salva» andava premuto due volte) */
    return {data:d,chi,dove,cosa,daAI:cosa,mezza,spese:giorSpeseDa(cosa)};
  });
  giorDisegna({t:"Controlla qui sotto e premi «Salva».",k:"ok"});
}

/* ---------------------------------------------------------------------
   IL SALVATAGGIO
   --------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   giorScrivi(schede) — scrive le giornate: [{data,nomi[],dove,cosa}].
   La usano «Salva» qui sotto e la finestra di «Parla» (gest-parla.js):
   un posto solo per le 8 ore divise, il cantiere trovato o creato, il
   rapportino e le ore. Lancia un Error col messaggio da far vedere.
   --------------------------------------------------------------------- */
async function giorAssicura(){
  const [ro,rl]=await Promise.all([
    sb.from("gest_operatori").select("id,nome,mestiere_id,costo_orario").eq("user_id",sbUid).is("eliminato_il",null).order("nome"),
    sb.from("gest_lavori").select("id,descrizione,dove,stato,mestiere_id,created_at").eq("user_id",sbUid).is("eliminato_il",null).order("created_at",{ascending:false}).limit(200)
  ]);
  if(ro.error||rl.error) throw new Error((ro.error||rl.error).message);
  giorOps=_gNelReparto(ro.data,true); giorLav=_gNelReparto(rl.data);
}
async function giorTrovaLavoro(dove,data,nomi){
  const mest=_gMest();
  let lav=giorLav.find(l=>_gNorm(_gNomeLav(l))===_gNorm(dove));
  if(lav) return lav;
  /* 27 nov 2026 (giro nuovo, sessione 6) — il cantiere nato da una giornata
     va alla prima persona che c'era: prima nasceva «nessuno assegnato» e in
     Agenda non stava sotto nessun nome. */
  const op=(Array.isArray(nomi)?nomi:[]).map(n=>giorOps.find(o=>o.nome===n)).find(Boolean)||null;
  const riga={user_id:sbUid,mestiere_id:mest,descrizione:dove.trim(),dove:dove.trim(),stato:"in_corso",data_prevista:data||_gOggi()};
  if(op) riga.operatore_id=op.id;
  const {data:d,error}=await sb.from("gest_lavori").insert(riga).select("id,descrizione,dove,stato,mestiere_id");
  if(error||!d||!d.length) throw new Error("Non riesco a creare il cantiere «"+dove+"»: "+((error&&error.message)||"nessuna riga")+".");
  giorLav.unshift(d[0]); giorCantNuovi.push(String(dove).trim()); if(op) giorCantChi.push(op.nome); return d[0];
}
/* 27 nov 2026 — il cantiere nato da una giornata lo si dice nel messaggio verde (prima nasceva zitto in Lavori) */
let giorCantNuovi=[], giorCantChi=[];
async function giorScrivi(schede){
  const mest=_gMest();
  let fatte=0;
  /* 1. i nomi nuovi entrano in Squadra */
  for(const n of [...new Set(schede.flatMap(c=>c.nomi))]){
    if(giorOps.some(o=>o.nome===n)) continue;
    const {data,error}=await sb.from("gest_operatori").insert({user_id:sbUid,mestiere_id:mest,nome:n}).select("id,nome,mestiere_id");
    if(error||!data||!data.length){ throw new Error("Non riesco ad aggiungere "+n+" alla squadra: "+((error&&error.message)||"nessuna riga")+"."); }
    giorOps.push(data[0]);
  }
  if(giorIoNome){ const o=giorOps.find(x=>x.nome===giorIoNome); if(o) _gSetIo(o.id); giorIoNome=""; }
  /* 2. quante schede ha ogni persona per ogni giorno: le 8 ore si dividono */
  const quante={};
  schede.forEach(c=>c.nomi.forEach(n=>{ const k=n+"|"+c.data; quante[k]=(quante[k]||0)+1; }));
  /* 18 nov 2026 (collaudo di Giornate) — LE 8 ORE SI DIVIDONO ANCHE CON LE
     GIORNATE GIA' SALVATE. Prima si guardavano solo le schede di QUESTO
     salvataggio: la stessa persona segnata la mattina in un cantiere e la
     sera in un altro prendeva 8 + 8 ore, e la manodopera del giorno
     raddoppiava. Adesso si leggono le ore che quella persona ha gia' in quel
     giorno:
     · stesso cantiere -> la giornata c'e' gia': ci si ferma e lo si dice;
     · altro cantiere, ore «da giornata intera» (8, o 8 divise in parti
       uguali) -> si ridividono fra tutte, vecchie e nuove;
     · ore scritte a mano dall'operaio (5, 3…) -> non si toccano: alla
       giornata nuova va quello che manca per arrivare a 8.
     Se la lettura cade si salva come prima (8 diviso le schede di adesso). */
  const quota={};
  try{
    const date=[...new Set(schede.map(c=>c.data))];
    const idOp=n=>{ const o=giorOps.find(x=>x.nome===n); return o?o.id:null; };
    const opIds=[...new Set(schede.flatMap(c=>c.nomi).map(idOp).filter(Boolean))];
    let gia=[];
    if(date.length&&opIds.length){
      const rg=await sb.from("gest_ore").select("id,ore,operatore_id,data,lavoro_id").eq("user_id",sbUid).is("eliminato_il",null).in("data",date).in("operatore_id",opIds);
      if(!rg.error) gia=rg.data||[];
    }
    if(gia.length){
      /* i lavori nel Cestino non contano (le loro ore restano vive) */
      const vivi=await giorLavoriVivi(gia.map(o=>o.lavoro_id));
      if(vivi) gia=gia.filter(o=>String(o.lavoro_id) in vivi);
      for(const c of schede){
        const lav=(c.lavoro_id&&giorLav.find(l=>String(l.id)===String(c.lavoro_id)))||giorLav.find(l=>_gNorm(_gNomeLav(l))===_gNorm(c.dove));
        if(!lav) continue;
        for(const n of c.nomi){
          if(gia.some(o=>String(o.operatore_id)===String(idOp(n))&&o.data===c.data&&String(o.lavoro_id)===String(lav.id))){
            const x=new Error(n+" ha già la giornata di "+_gData(c.data)+" a «"+_gNomeLav(lav)+"». Togli il suo nome da questa scheda, oppure cancella prima quella vecchia.");
            x.doppione=true; throw x;
          }
        }
      }
      const cambia=[];
      Object.keys(quante).forEach(k=>{
        const [n,data]=[k.slice(0,k.lastIndexOf("|")),k.slice(k.lastIndexOf("|")+1)];
        const v=gia.filter(o=>String(o.operatore_id)===String(idOp(n))&&o.data===data);
        if(!v.length) return;
        const mezzi=x=>Math.max(.5,Math.round(x*2)/2);
        const somma=v.reduce((a,o)=>a+(+o.ore||0),0);
        const uguali=mezzi(GIOR_ORE_GIORNO/v.length);
        if(v.every(o=>(+o.ore||0)===uguali)){
          const q=mezzi(GIOR_ORE_GIORNO/(v.length+quante[k]));
          quota[k]=q; v.forEach(o=>{ if((+o.ore||0)!==q) cambia.push({id:o.id,ore:q}); });
        } else if(somma<GIOR_ORE_GIORNO){
          quota[k]=mezzi((GIOR_ORE_GIORNO-somma)/quante[k]);
        } else {
          quota[k]=.5;   /* ha gia' 8 ore o piu' scritte a mano: c'era, ma il costo non sale */
        }
      });
      for(const u of cambia){
        const ru=await sb.from("gest_ore").update({ore:u.ore}).eq("id",u.id).eq("user_id",sbUid).select("id");
        if(ru.error||!ru.data||!ru.data.length) throw new Error("Non riesco a dividere le ore con la giornata già salvata: "+((ru.error&&ru.error.message)||"nessuna riga")+". Non ho salvato niente di nuovo.");
      }
    }
  }catch(e){ if(e&&(e.doppione||/^Non riesco a dividere/.test(e.message||""))) throw e; }
  for(const c of schede){
    /* 3. il cantiere: un lavoro che c'e' gia', o uno nuovo */
    /* 10 nov 2026: se la scheda porta gia' il lavoro (giornata mandata dal telefono), si usa quello */
    const lav=(c.lavoro_id&&giorLav.find(l=>String(l.id)===String(c.lavoro_id)))||await giorTrovaLavoro(c.dove,c.data,c.nomi);
    const mid=lav.mestiere_id||mest;
    c._lavId=lav.id;   /* 24 nov 2026: per le spese dette nel racconto */
    /* 4. il rapportino */
    const rr=await sb.from("gest_rapportini").insert({user_id:sbUid,mestiere_id:mid,lavoro_id:lav.id,data:c.data,note:c.cosa.trim()||null}).select("id");
    if(rr.error||!rr.data||!rr.data.length){ throw new Error("Non salvato: "+((rr.error&&rr.error.message)||"nessuna riga")+"."); }
    const rid=rr.data[0].id;
    /* 5. le ore di chi c'era */
    const righe=c.nomi.map(n=>{
      const o=giorOps.find(x=>x.nome===n);
      let ore=quota[n+"|"+c.data]||Math.round((GIOR_ORE_GIORNO/(quante[n+"|"+c.data]||1))*2)/2;
      if(Array.isArray(c.mezze)&&c.mezze.includes(n)) ore=Math.min(ore,GIOR_ORE_GIORNO/2);   /* mezza giornata */
      return {user_id:sbUid,mestiere_id:mid,lavoro_id:lav.id,operatore_id:o.id,data:c.data,ore,rapportino_id:rid};
    });
    const ro=await sb.from("gest_ore").insert(righe).select("id");
    if(ro.error||!ro.data||ro.data.length!==righe.length){ { const x=new Error("La giornata di «"+c.dove+"» è salvata, ma le ore non tutte: "+((ro.error&&ro.error.message)||"")+". Controlla in «Il mese»."); x.parziale=true; throw x; } }
    fatte++;
  }
  return fatte;
}

async function giorSalva(){
  if(giorModK) return giorModTutto();
  giorLeggiProp();
  const io=_gIo();
  const schede=giorProp.map(c=>{
    const nomi=[...c.chi].map(n=>n==="IO"?(io&&io!=="-"?giorNomeOp(io):null):n).filter(Boolean);
    const mezze=[...(c.mezza||[])].map(n=>n==="IO"?(io&&io!=="-"?giorNomeOp(io):null):n).filter(Boolean);
    return {...c,nomi:[...new Set(nomi)],mezze};
  });
  if(giorProp.some(c=>c.chi.has("IO"))&&!io){ giorDisegna({t:_gP("Dimmi chi sei tu nella squadra (la tendina in alto), poi premi «Salva».","Dimmi chi sei tu fra i collaboratori (la tendina in alto), poi premi «Salva»."),k:"err"}); return; }
  for(const c of schede){
    if(!c.nomi.length){ giorDisegna({t:"In una scheda non c'è nessuno: tocca almeno un nome.",k:"err"}); return; }
    if(!c.dove.trim()){ giorDisegna({t:"In una scheda manca il cantiere.",k:"err"}); return; }
  }
  if(giorFermaPraticaNuova(schede)) return;
  let fatte=0, sp={n:0,ko:0}; giorCantNuovi=[]; giorCantChi=[];
  try{ fatte=await giorScrivi(schede); }
  catch(e){ giorDisegna({t:e.message,k:"err"}); if(e.parziale) await renderGiornate(); return; }
  try{ sp=await giorScriviSpese(schede); }catch(e){ sp={n:0,ko:1}; }
  giorProp=null; giorNuovi=[]; giorVoce="";
  { const tv=document.getElementById("gior-voce"); if(tv) tv.value=""; }   /* 18 nov 2026: se no giorDisegna lo rileggeva dalla casella e il racconto restava li', pronto per un doppione */
  giorMese=schede[0].data.slice(0,7);
  await renderGiornate();
  giorDisegna({t:(fatte===1?"Giornata salvata ✔":fatte+" giornate salvate ✔")+(sp.n?(sp.n===1?" · 1 spesa aggiunta":" · "+sp.n+" spese aggiunte"):"")+(sp.ko?" · "+sp.ko+(sp.ko===1?" spesa non salvata: aggiungila da «Spesa»":" spese non salvate: aggiungile da «Spesa»"):"")+(giorCantNuovi.length?" · "+_gP("cantiere nuovo","pratica nuova")+" «"+[...new Set(giorCantNuovi)].join("», «")+"» "+_gP("messo in Lavori","messa in Pratiche")+(giorCantChi.length?_gP(", assegnato a ",", assegnata a ")+[...new Set(giorCantChi)].join(", "):""):""),k:sp.ko?"err":"ok"});
  if(fatte>0&&typeof window.tiSpunta==="function") window.tiSpunta(fatte===1?"Giornata salvata":fatte+" giornate salvate");
}

/* ---------------------------------------------------------------------
   LE GIORNATE MANDATE DAGLI OPERAI — «Approva» le scrive con giorScrivi
   (8 ore, il cantiere trovato o creato), «Scarta» le mette da parte.
   --------------------------------------------------------------------- */
async function giorProApprova(id){
  const p=giorProposte.find(x=>String(x.id)===String(id)); if(!p) return;
  const nome=giorOps.find(o=>String(o.id)===String(p.operatore_id));
  if(!nome){ giorDisegna({t:"Questa persona non è più in Squadra: scarta la giornata.",k:"err"}); return; }
  try{
    await giorAssicura();
    await giorScrivi([{data:p.data,nomi:[nome.nome],dove:p.dove,cosa:p.cosa||"",lavoro_id:p.lavoro_id||null}]);
  }catch(e){ giorDisegna({t:e.message,k:"err"}); return; }
  /* 10 nov 2026 — la giornata completa: foto, spese e bolle mandate dal telefono */
  let extraMsg="";
  if(typeof gpcApprovaExtra==="function"){
    try{ extraMsg=await gpcApprovaExtra(p,nome.nome); }catch(e){ extraMsg=" Attenzione: "+e.message; }
  }
  const r=await sb.from("gest_giornate_proposte").update({stato:"approvata",visto_il:new Date().toISOString()}).eq("id",p.id).eq("user_id",sbUid).select("id");
  await renderGiornate();
  giorDisegna(r.error||!r.data||!r.data.length
    ?{t:"Giornata scritta, ma non riesco a toglierla da «Da approvare»: non approvarla di nuovo.",k:"err"}
    :{t:"Approvata ✔ "+nome.nome+", "+_gData(p.data)+extraMsg,k:extraMsg.indexOf("Attenzione")>=0?"err":"ok"});
}
async function giorProScarta(id){
  const r=await sb.from("gest_giornate_proposte").update({stato:"scartata",visto_il:new Date().toISOString()}).eq("id",id).eq("user_id",sbUid).select("id");
  if(r.error||!r.data||!r.data.length){ giorDisegna({t:"Non scartata: "+((r.error&&r.error.message)||"nessuna riga")+".",k:"err"}); return; }
  await renderGiornate();
  giorDisegna({t:"Scartata.",k:"ok"});
}

/* ---------------------------------------------------------------------
   IL CONSULENTE DEL LAVORO
   --------------------------------------------------------------------- */
function _gCdlMsg(t,k){ const m=document.getElementById("gior-cdl-msg"); if(m){ m.className="gmsg "+(k||""); m.textContent=t; } }
async function giorCdlSalva(){
  const email=((document.getElementById("gior-cdl-email")||{}).value||"").trim();
  const invio=!!(document.getElementById("gior-cdl-invio")||{}).checked;
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ _gCdlMsg("Controlla l'email: così non è giusta.","err"); return false; }
  if(invio&&!email){ _gCdlMsg("Scrivi l'email del consulente.","err"); return false; }
  const r=await sb.from("gest_azienda").upsert({user_id:sbUid,cdl_email:email||null,cdl_invio:invio},{onConflict:"user_id"}).select("user_id");
  if(r.error||!r.data||!r.data.length){ _gCdlMsg("Non salvato: "+((r.error&&r.error.message)||"nessuna riga")+".","err"); return false; }
  giorCdl={...(giorCdl||{}),email,invio};
  _gCdlMsg(invio?"Salvato ✔ Il primo del mese gli mando le giornate.":"Salvato ✔","ok");
  return true;
}
async function giorCdlProva(){
  if(!(await giorCdlSalva())) return;
  const tk=await giorToken(); if(!tk){ _gCdlMsg("Sessione scaduta: esci e rientra.","err"); return; }
  _gCdlMsg("Mando…","");
  try{
    const r=await fetch("/.netlify/functions/giornate-consulente",{method:"POST",headers:{Authorization:"Bearer "+tk,"Content-Type":"application/json"},body:JSON.stringify({prova:true,mese:giorMese})});
    const b=await r.json().catch(()=>({}));
    if(r.ok&&b.ok) _gCdlMsg("Mandata ✔ Guarda la tua email ("+(b.a||"")+"): è quella che riceverà il consulente.","ok");
    else _gCdlMsg(b.error||"Non è partita. Riprova fra qualche minuto.","err");
  }catch(e){ _gCdlMsg("Niente rete. Riprova.","err"); }
}

/* ---------------------------------------------------------------------
   LA DOMANDA DELLA SERA — notifiche del telefono (sw-gestionale.js +
   netlify/functions/avviso-sera.js). Ogni telefono si accende da solo:
   il capo puo' averla sul telefono e non sul computer dell'ufficio.
   --------------------------------------------------------------------- */
const GIOR_SERA_URL="/.netlify/functions/avviso-sera";
function _gSeraPuo(){ return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }
function _gSeraMsg(t,k){ const m=document.getElementById("gior-sera-msg"); if(m){ m.className="gmsg "+(k||""); m.textContent=t; } }
function _gIphone(){ return /iphone|ipad|ipod/i.test(navigator.userAgent); }
async function giorSeraIscrizione(){
  try{ const r=await navigator.serviceWorker.getRegistration("/"); return r?await r.pushManager.getSubscription():null; }catch(e){ return null; }
}
async function giorSeraChiama(corpo){
  const tk=await giorToken(); if(!tk) return {error:"Sessione scaduta: esci e rientra."};
  const s=await giorSeraIscrizione(); if(s&&!corpo.endpoint&&!corpo.sub) corpo.endpoint=s.endpoint;
  try{
    const r=await fetch(GIOR_SERA_URL,{method:"POST",headers:{Authorization:"Bearer "+tk,"Content-Type":"application/json"},body:JSON.stringify(corpo)});
    const b=await r.json().catch(()=>({})); return r.ok?Object.assign({ok:true},b):{error:b.error||"Il servizio non ha risposto."};
  }catch(e){ return {error:"Niente rete. Riprova."}; }
}
async function giorSeraLeggi(){
  if(!_gSeraPuo()){ giorSera={si:false,perche:"no"}; return; }
  if(Notification.permission==="denied"){ giorSera={si:false,perche:"negato"}; return; }
  const s=await giorSeraIscrizione();
  if(!s){ giorSera={si:false,ora:"18:30"}; return; }
  const r=await giorSeraChiama({azione:"stato",endpoint:s.endpoint});
  giorSera={si:!!r.acceso&&r.sera!==false,ora:r.ora||"18:30"};  /* 8 nov 2026: acceso = la SERA accesa (il telefono puo' avere solo gli altri avvisi) */
}
function _gB64(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); const b=atob(s+"===".slice((s.length+3)%4)); return Uint8Array.from(b,c=>c.charCodeAt(0)); }
async function giorSeraAccendi(){
  if(!_gSeraPuo()){ giorDisegna({t:"Su questo browser le notifiche non si possono accendere.",k:"err"}); return; }
  const ora=((document.getElementById("gior-sera-ora")||{}).value)||"18:30";
  try{
    const perm=await Notification.requestPermission();
    if(perm!=="granted"){ giorSera={si:false,perche:"negato"}; giorDisegna(); return; }
    const reg=await navigator.serviceWorker.register("/sw-gestionale.js",{scope:"/"});
    await navigator.serviceWorker.ready;
    const kr=await fetch(GIOR_SERA_URL); const kb=await kr.json();
    if(!kb.chiave) throw new Error("chiave");
    let sub=await reg.pushManager.getSubscription();
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:_gB64(kb.chiave)});
    const r=await giorSeraChiama({azione:"iscrivi",sub:sub.toJSON(),ora,sera:true});
    if(!r.ok){ giorDisegna({t:r.error,k:"err"}); return; }
    giorSera={si:true,ora:r.ora||ora};
    giorDisegna({t:"Accesa: ogni sera alle "+giorSera.ora+" il telefono ti chiede com'è andata.",k:"ok"});
  }catch(e){ giorDisegna({t:"Non riesco ad accendere le notifiche su questo telefono. Riprova.",k:"err"}); }
}
function giorSeraBox(){
  if(!giorSera) return "";
  const ore=[]; for(let h=17;h<=21;h++){ ore.push(String(h).padStart(2,"0")+":00"); if(h<21) ore.push(String(h).padStart(2,"0")+":30"); }
  const sel=`<select id="gior-sera-ora">${ore.map(o=>`<option${o===(giorSera.ora||"18:30")?" selected":""}>${o}</option>`).join("")}</select>`;
  let c=`<div class="gb"><h4>La domanda della sera</h4>`;
  if(giorSera.perche==="no"){
    c+=_gIphone()
      ?`<div class="gnota">Su iPhone le notifiche arrivano solo se il gestionale è sulla schermata Home: in Safari tocca il tasto Condividi, poi «Aggiungi alla schermata Home», e aprilo da lì.</div>`
      :`<div class="gnota">Su questo browser le notifiche non ci sono. Prova da Chrome sul telefono.</div>`;
  } else if(giorSera.perche==="negato"){
    c+=`<div class="gnota">Su questo telefono le notifiche di trovaimpresa.com sono bloccate. Sbloccale dalle impostazioni del browser (il lucchetto accanto all'indirizzo) e torna qui.</div>`;
  } else if(giorSera.si){
    c+=`<div class="gnota">Accesa su questo telefono. Se la giornata è già segnata, non suona. Domenica mai.</div>
      <div class="gora">Alle ${sel}</div>
      <div class="grow"><button type="button" class="btn" data-gior="sera-prova" style="flex:0 0 auto">Fallo suonare adesso</button><button type="button" class="btn" data-gior="sera-spegni" style="flex:0 0 auto">Spegni</button></div>`;
  } else {
    c+=`<div class="gnota">Ogni sera il telefono ti chiede «Com'è andata oggi?». Tocchi, racconti a voce, ed è segnata. Se l'hai già fatto, non suona.</div>
      <div class="gora">Alle ${sel}</div>
      <button type="button" class="gbig blu" data-gior="sera-accendi">Accendi su questo telefono</button>`;
  }
  return c+`<div class="gmsg" id="gior-sera-msg"></div></div>`;
}

/* una persona esce da un giorno (giornata cancellata o spostata): se le sue
   ore erano la parte uguale di una divisione, a quelle che restano tornano */
async function giorRidaiOre(opId,data,ore){
  try{
    const mezzi=x=>Math.max(.5,Math.round(x*2)/2);
    const q=+ore||0; if(!opId||q>=GIOR_ORE_GIORNO) return;
    const rr=await sb.from("gest_ore").select("id,ore,lavoro_id").eq("user_id",sbUid).is("eliminato_il",null).eq("operatore_id",opId).eq("data",data);
    let v=(!rr.error&&rr.data)||[]; if(!v.length) return;
    const vivi=await giorLavoriVivi(v.map(x=>x.lavoro_id)); if(vivi) v=v.filter(x=>String(x.lavoro_id) in vivi);
    if(!v.length||q!==mezzi(GIOR_ORE_GIORNO/(v.length+1))||!v.every(x=>(+x.ore||0)===q)) return;
    await sb.from("gest_ore").update({ore:mezzi(GIOR_ORE_GIORNO/v.length)}).in("id",v.map(x=>x.id)).eq("user_id",sbUid).select("id");
  }catch(e){}
}

/* 26 nov 2026 — IL ROVESCIO DI giorRidaiOre: UNA GIORNATA TORNA DAL CESTINO.
   4 + 4 in due cantieri, ne butti una → l'altra torna 8. Rimetti a posto la
   prima: tornava con le sue 4 e l'altra restava 8 → 12 ore. Adesso si
   ridividono. Solo se TUTTE le righe del giorno sono «parti uguali» messe dal
   gestionale (8, 4, 2,5…) e insieme passano le 8: le ore scritte a mano
   dall'operaio (5 + 3) non si toccano. Se non riesce non si ferma niente. */
async function giorRidividi(opId,data){
  try{
    if(!opId||!data) return;
    const mezzi=x=>Math.max(.5,Math.round(x*2)/2);
    const rr=await sb.from("gest_ore").select("id,ore,lavoro_id").eq("user_id",sbUid).is("eliminato_il",null).eq("operatore_id",opId).eq("data",data);
    let v=(!rr.error&&rr.data)||[];
    const vivi=await giorLavoriVivi(v.map(x=>x.lavoro_id)); if(vivi) v=v.filter(x=>String(x.lavoro_id) in vivi);
    if(v.length<2) return;
    const somma=v.reduce((a,x)=>a+(+x.ore||0),0);
    if(somma<=GIOR_ORE_GIORNO) return;
    const parti=[]; for(let n=1;n<=v.length;n++) parti.push(mezzi(GIOR_ORE_GIORNO/n));
    if(!v.every(x=>parti.indexOf(+x.ore||0)>=0)) return;
    const q=mezzi(GIOR_ORE_GIORNO/v.length);
    /* una mezza giornata (4) resta al massimo 4: si tocca solo chi e' sopra la parte */
    const daCambiare=v.filter(x=>(+x.ore||0)>q).map(x=>x.id);
    if(daCambiare.length) await sb.from("gest_ore").update({ore:q}).in("id",daCambiare).eq("user_id",sbUid).select("id");
  }catch(e){}
}
window.giorRidividi=giorRidividi;

/* ---------------------------------------------------------------------
   18 nov 2026 — «MODIFICA» COMPLETA (ok di Alex). Prima si cambiava solo il
   testo: per un giorno, un cantiere o un nome sbagliato bisognava cancellare
   e rifare. Adesso «modifica» apre la stessa scheda di «scrivila a mano»,
   gia' piena. Al Salva NON nasce una giornata nuova: si aggiorna il
   rapportino (resta lo stesso, con i suoi materiali) e le sue ore.
   · chi resta: la sua riga di ore cambia giorno, cantiere e ore;
   · chi entra: una riga nuova; chi esce: la sua riga va nel Cestino;
   · le ore si dividono con gli altri cantieri di quel giorno come al Salva.
   ⚠️ Foto, spese e fatture stanno sul cantiere e sul giorno: se cambi
      giorno o cantiere NON si spostano con la giornata.
   --------------------------------------------------------------------- */
async function giorModTutto(){
  giorLeggiProp();
  const g=giorRighe.find(x=>x.k===giorModK), c=giorProp&&giorProp[0];
  if(!g||!g.rapportino_id||!c){ giorModK=null; giorProp=null; giorDisegna({t:"Questa giornata non c'è più: ricarica la pagina.",k:"err"}); return; }
  const io=_gIo();
  const pulisci=a=>[...new Set([...a].map(n=>n==="IO"?(io&&io!=="-"?giorNomeOp(io):null):n).filter(Boolean))];
  const nomi=pulisci(c.chi), mezze=pulisci(c.mezza||[]);
  if(!nomi.length){ giorDisegna({t:"Non c'è nessuno: tocca almeno un nome.",k:"err"}); return; }
  if(!c.dove.trim()){ giorDisegna({t:"Manca il cantiere.",k:"err"}); return; }
  const mezzi=x=>Math.max(.5,Math.round(x*2)/2);
  try{
    for(const n of nomi){
      if(giorOps.some(o=>o.nome===n)) continue;
      const {data,error}=await sb.from("gest_operatori").insert({user_id:sbUid,mestiere_id:_gMest(),nome:n}).select("id,nome,mestiere_id");
      if(error||!data||!data.length) throw new Error("Non riesco ad aggiungere "+n+" alla squadra: "+((error&&error.message)||"nessuna riga")+".");
      giorOps.push(data[0]);
    }
    const vecchio=giorLavoro(g.lavoro_id);
    const stesso=!!(vecchio&&_gNorm(_gNomeLav(vecchio))===_gNorm(c.dove));
    if(!stesso&&giorFermaPraticaNuova([c])) return;
    const lav=stesso?vecchio:await giorTrovaLavoro(c.dove,c.data,c.nomi);
    const mid=lav.mestiere_id||_gMest();
    const idOp=n=>giorOps.find(x=>x.nome===n).id;
    const mieId=new Set(g.ore.map(o=>String(o.id)));
    const rg=await sb.from("gest_ore").select("id,ore,operatore_id,data,lavoro_id").eq("user_id",sbUid).is("eliminato_il",null).eq("data",c.data).in("operatore_id",nomi.map(idOp));
    if(rg.error) throw new Error("Non riesco a leggere le altre giornate di quel giorno: "+rg.error.message+". Non ho cambiato niente.");
    let altre=(rg.data||[]).filter(o=>!mieId.has(String(o.id)));
    const vivi=await giorLavoriVivi(altre.map(o=>o.lavoro_id)); if(vivi) altre=altre.filter(o=>String(o.lavoro_id) in vivi);
    for(const n of nomi){
      if(altre.some(o=>String(o.operatore_id)===String(idOp(n))&&String(o.lavoro_id)===String(lav.id)))
        throw new Error(n+" ha già un'altra giornata di "+_gData(c.data)+" a «"+_gNomeLav(lav)+"». Togli il suo nome, oppure cancella prima quella.");
    }
    /* quante ore a testa, e le altre giornate del giorno che si ridividono */
    const oreDi={}, cambia=[];
    nomi.forEach(n=>{
      const v=altre.filter(o=>String(o.operatore_id)===String(idOp(n)));
      let q=GIOR_ORE_GIORNO;
      if(v.length){
        const somma=v.reduce((a,o)=>a+(+o.ore||0),0), uguali=mezzi(GIOR_ORE_GIORNO/v.length);
        const eraDivisa=mezzi(GIOR_ORE_GIORNO/(v.length+1));
        if(v.every(o=>(+o.ore||0)===uguali)||v.every(o=>(+o.ore||0)===eraDivisa)){ q=eraDivisa; v.forEach(o=>{ if((+o.ore||0)!==q) cambia.push({id:o.id,ore:q}); }); }
        else q=somma<GIOR_ORE_GIORNO?mezzi(GIOR_ORE_GIORNO-somma):.5;
      }
      oreDi[n]=mezze.includes(n)?Math.min(q,GIOR_ORE_GIORNO/2):q;
    });
    for(const u of cambia){
      const ru=await sb.from("gest_ore").update({ore:u.ore}).eq("id",u.id).eq("user_id",sbUid).select("id");
      if(ru.error||!ru.data||!ru.data.length) throw new Error("Non riesco a dividere le ore con l'altra giornata: "+((ru.error&&ru.error.message)||"nessuna riga")+".");
    }
    const rr=await sb.from("gest_rapportini").update({data:c.data,lavoro_id:lav.id,mestiere_id:mid,note:c.cosa.trim()||null}).eq("id",g.rapportino_id).eq("user_id",sbUid).select("id");
    if(rr.error||!rr.data||!rr.data.length) throw new Error("Non salvato: "+((rr.error&&rr.error.message)||"nessuna riga")+".");
    const nuove=[];
    for(const n of nomi){
      const mia=g.ore.find(o=>String(o.operatore_id)===String(idOp(n)));
      if(mia){
        const ru=await sb.from("gest_ore").update({data:c.data,lavoro_id:lav.id,mestiere_id:mid,ore:oreDi[n]}).eq("id",mia.id).eq("user_id",sbUid).select("id");
        if(ru.error||!ru.data||!ru.data.length) throw new Error("Le ore di "+n+" non sono cambiate: "+((ru.error&&ru.error.message)||"nessuna riga")+". Controlla in «Il mese».");
      } else nuove.push({user_id:sbUid,mestiere_id:mid,lavoro_id:lav.id,operatore_id:idOp(n),data:c.data,ore:oreDi[n],rapportino_id:g.rapportino_id});
    }
    if(nuove.length){
      const ri=await sb.from("gest_ore").insert(nuove).select("id");
      if(ri.error||!ri.data||ri.data.length!==nuove.length) throw new Error("Non tutte le persone nuove sono entrate: "+((ri.error&&ri.error.message)||"")+". Controlla in «Il mese».");
    }
    const tenuti=new Set(nomi.map(n=>String(idOp(n))));
    const usciti=g.ore.filter(o=>!tenuti.has(String(o.operatore_id)));
    if(usciti.length){
      const rd=await sb.from("gest_ore").update({eliminato_il:new Date().toISOString()}).in("id",usciti.map(o=>o.id)).eq("user_id",sbUid).select("id");
      if(rd.error) throw new Error("Chi hai tolto è ancora segnato: "+rd.error.message+". Controlla in «Il mese».");
    }
    /* chi non e' piu' in quel giorno: alle sue altre giornate di allora tornano le ore */
    for(const o of g.ore){ if(g.data!==c.data||!tenuti.has(String(o.operatore_id))) await giorRidaiOre(o.operatore_id,g.data,o.ore); }
  }catch(e){ giorDisegna({t:e.message,k:"err"}); return; }
  giorProp=null; giorNuovi=[]; giorModK=null;
  giorMese=c.data.slice(0,7);
  await renderGiornate();
  giorDisegna({t:"Giornata modificata ✔",k:"ok"});
  if(typeof window.tiSpunta==="function") window.tiSpunta("Giornata modificata");
}

async function giorCancella(k){
  const g=giorRighe.find(x=>x.k===k); if(!g) return;
  const ora=new Date().toISOString();
  const ids=g.ore.map(o=>o.id);
  const ro=await sb.from("gest_ore").update({eliminato_il:ora}).in("id",ids).eq("user_id",sbUid).select("id");
  if(ro.error||!ro.data||!ro.data.length){ giorDisegna({t:"Non cancellata: "+((ro.error&&ro.error.message)||"nessuna riga")+".",k:"err"}); return; }
  if(g.rapportino_id){
    await sb.from("gest_rapportini").update({eliminato_il:ora}).eq("id",g.rapportino_id).eq("user_id",sbUid).select("id");
  }
  /* 18 nov 2026 — se le ore erano state divise con un altro cantiere dello
     stesso giorno, a chi resta tornano: 4 + 4, ne cancelli una, l'altra
     torna 8. Solo se le ore rimaste sono proprio la parte uguale (se le ha
     scritte a mano l'operaio non si toccano). Se non riesce, non si ferma. */
  for(const o of g.ore) await giorRidaiOre(o.operatore_id,g.data,o.ore);
  giorConferma=null;
  await renderGiornate();
  giorDisegna({t:"Cancellata. La ritrovi nel Cestino.",k:"ok"});
}

async function giorModSalva(k){
  const g=giorRighe.find(x=>x.k===k); if(!g||!g.rapportino_id) return;
  const t=(document.getElementById("gior-mod-t")||{}).value||"";
  const r=await sb.from("gest_rapportini").update({note:t.trim()||null}).eq("id",g.rapportino_id).eq("user_id",sbUid).select("id");
  if(r.error||!r.data||!r.data.length){ giorDisegna({t:"Non salvato: "+((r.error&&r.error.message)||"nessuna riga")+".",k:"err"}); return; }
  giorModifica=null;
  await renderGiornate();
  giorDisegna({t:"Salvato ✔",k:"ok"});
}

/* ---------------------------------------------------------------------
   IL PDF DEL MESE — per il consulente del lavoro
   --------------------------------------------------------------------- */
async function giorPdf(){
  if(!(await caricaJsPDF())){ toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova"); return; }
  const J=window.jspdf&&window.jspdf.jsPDF; if(!J) return;
  const {per,luoghi}=giorTotali(giorRighe);
  const doc=new J({unit:"mm",format:"a4"}); const W=210,M=15; let y=18;
  if(typeof window.gestLogoPdf==="function"){ try{ y=await window.gestLogoPdf(doc,M,y)||y; }catch(e){} }
  const T=s=>String(s==null?"":s).replace(/[^\x00-\xFF€]/g,"");
  const pagina=hh=>{ if(y+hh>282){ doc.addPage(); y=20; } };
  /* 13 nov 2026 (lista «MANCA», n. 9) — i dati dell'azienda in testa, come
     negli altri fogli: il consulente del lavoro deve sapere di chi e' */
  try{
    const ra=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    const az=ra&&ra.data;
    if(az&&az.nome){
      doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.text(T(az.nome),M,y); y+=5.5;
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90);
      [az.piva?"P.IVA "+az.piva:"",(typeof azIndirizzo==="function"?azIndirizzo(az):az.indirizzo)||"",[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
        .filter(Boolean).forEach(t=>{ doc.text(T(t),M,y); y+=4.5; });
      doc.setTextColor(0); y+=6;
    }
  }catch(e){}
  doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text(T("Giornate di lavoro - "+_gMeseNome(giorMese)),M,y); y+=6;
  doc.setDrawColor(255,136,0); doc.setLineWidth(.8); doc.line(M,y,W-M,y); y+=10;
  function tabella(titolo,cols,righe,larg){
    pagina(20); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(T(titolo),M,y); y+=7;
    doc.setFontSize(10); doc.setFillColor(236,240,245); doc.rect(M,y-5,W-2*M,7,"F");
    let x=M; cols.forEach((c,i)=>{ doc.text(T(c),x+2,y); x+=larg[i]; }); y+=6;
    doc.setFont("helvetica","normal");
    righe.forEach(r=>{
      const linee=r.map((c,i)=>doc.splitTextToSize(T(c),larg[i]-4));
      const hh=Math.max(...linee.map(l=>l.length))*4.6+2;
      pagina(hh); x=M; linee.forEach((l,i)=>{ doc.text(l,x+2,y); x+=larg[i]; });
      y+=hh; doc.setDrawColor(226,232,240); doc.setLineWidth(.2); doc.line(M,y-3.5,W-M,y-3.5);
    });
    y+=8;
  }
  const oreTxt=t=>t.g+(t.g===1?" giorno":" giorni")+(t.o&&t.o!==t.g*GIOR_ORE_GIORNO?" ("+String(Math.round(t.o*10)/10).replace(".",",")+" ore)":"");
  tabella(_gP("1. Giorni per lavoratore","1. Giorni per collaboratore"),[_gP("Lavoratore","Collaboratore"),"Lavorato"],Object.entries(per).sort((a,b)=>a[0].localeCompare(b[0])).map(([n,t])=>[n,oreTxt(t)]),[90,90]);
  tabella(_gP("2. Giorni per cantiere","2. Giorni per pratica"),[_gP("Cantiere","Pratica"),"Giorni"],Object.entries(luoghi).map(([l,n])=>[l,String(n)]),[140,40]);
  tabella("3. Giorno per giorno",["Giorno",_gP("Cantiere / lavoro","Pratica"),"Chi ha lavorato"],
    giorRighe.map(g=>[_gData(g.data),_gNomeLav(giorLavoro(g.lavoro_id))+(g.cosa?" - "+g.cosa:""),[...new Set(g.ore.map(o=>giorNomeOp(o.operatore_id)))].join(", ")]),[32,88,60]);
  /* 20 nov 2026 (chiesto da Alex): spese, benzina, fatture e bolle anche nel PDF, coi totali — come nel Riepilogo */
  const q=giorQuarta();
  if(q.righe.length){
    const E=n=>_gEuro(n).replace(/\u00a0/g," ");
    tabella(_gP("4. Spese, benzina, fatture e bolle","4. Spese, benzina e fatture"),["Giorno","Tipo","Cosa","Euro"],q.righe.map(r=>[r.giorno,r.tipo,r.cosa,r.euro?E(r.euro):""]),[30,40,82,28]);
    const t=q.tot, tr=[];
    if(t.spese) tr.push(["Spese",E(t.spese)]); if(t.benz) tr.push(["Benzina",E(t.benz)]);
    if(t.km) tr.push(["Chilometri",Math.round(t.km).toLocaleString("it-IT")+" km"]); if(t.fatt) tr.push([_gP("Fatture e bolle","Fatture dei fornitori"),E(t.fatt)]);
    if(tr.length) tabella("Totali del mese",["Voce","Totale"],tr,[90,90]);
  }
  /* 20 nov 2026 (chiesto da Alex): in fondo le foto prima e dopo di ogni giornata */
  if(typeof gxFotoMesePdf==="function"){ try{ toast("Metto le foto nel PDF…"); y=await gxFotoMesePdf(doc,y,M,W); }catch(e){} }
  doc.save("Giornate di lavoro - "+_gMeseNome(giorMese)+".pdf");
}

/* ---------------------------------------------------------------------
   20 nov 2026 — LA PARTE 4: spese, benzina, fatture e bolle del mese.
   Le righe sono quelle che legge gest-giornate-extra.js (gxDati): un posto
   solo. La usano tutti e due, il PDF e il Riepilogo a schermo.
   --------------------------------------------------------------------- */
function giorQuarta(){
  const D=(typeof gxDati!=="undefined"&&gxDati)||{spese:[],rif:[],fatt:[]};
  const giorno=r=>(typeof gxGiorno==="function"?gxGiorno(r):r.data)||"";
  const lav=id=>{ const l=giorLavoro(id); return l?_gNomeLav(l):""; };
  const righe=[];
  (D.spese||[]).forEach(r=>righe.push({d:giorno(r),tipo:"Spesa",cosa:[r.descrizione||"Spesa",lav(r.lavoro_id)].filter(Boolean).join(" - "),euro:+r.importo||0}));
  (D.rif||[]).forEach(r=>righe.push({d:r.data||"",tipo:"Benzina e km",cosa:[typeof gxNomeMezzo==="function"?gxNomeMezzo(r.mezzo_id):"",r.km?Math.round(+r.km).toLocaleString("it-IT")+" km":"",r.distributore||""].filter(Boolean).join(" - ")||"Benzina",euro:+r.importo||0}));
  const _tf=_gP("Fattura o bolla","Fattura del fornitore");
  (D.fatt||[]).forEach(r=>righe.push({d:r.data||"",tipo:_tf,cosa:[r.numero?"n. "+r.numero:"",lav(r.lavoro_id)].filter(Boolean).join(" - ")||_tf,euro:+r.importo||0}));
  righe.sort((a,b)=>a.d.localeCompare(b.d));
  righe.forEach(r=>{ r.giorno=r.d?_gData(r.d):""; });
  const somma=a=>(a||[]).reduce((s,x)=>s+(+x.importo||0),0);
  return {righe,tot:{spese:somma(D.spese),benz:somma(D.rif),km:(D.rif||[]).reduce((s,x)=>s+(+x.km||0),0),fatt:somma(D.fatt)}};
}

/* ---------------------------------------------------------------------
   20 nov 2026 — IL RIEPILOGO DEL MESE A SCHERMO (chiesto da Alex).
   «Vedere le giornate senza dover scaricare il PDF»: le stesse parti del
   PDF, nella finestra grande, e in fondo «Scarica il PDF» se serve.
   --------------------------------------------------------------------- */
function giorRiepilogo(){
  const {per,luoghi}=giorTotali(giorRighe);
  const riga=(a,b)=>'<div class="gx-riga"><span class="t gior-u">'+esc(a)+'</span><b>'+esc(b)+'</b></div>';
  const sez=(t,c)=>'<div class="sh-b sh-centro"><div class="sh-tit">'+esc(t)+'</div>'+c+'</div>';
  const oreTxt=t=>t.g+(t.g===1?" giorno":" giorni")+(t.o&&t.o!==t.g*GIOR_ORE_GIORNO?" ("+String(Math.round(t.o*10)/10).replace(".",",")+" ore)":"");
  const ord=[...giorRighe].sort((a,b)=>a.data.localeCompare(b.data));
  const date=[...new Set(ord.map(g=>g.data))];
  let h=sez(_gP("1. Giorni per lavoratore","1. Giorni per collaboratore"),'<div class="gx-lista">'+Object.entries(per).sort((a,b)=>b[1].g-a[1].g||a[0].localeCompare(b[0])).map(([n,t])=>riga(n,oreTxt(t))).join("")+'</div>')
    +sez(_gP("2. Giorni per cantiere","2. Giorni per pratica"),'<div class="gx-lista">'+Object.entries(luoghi).sort((a,b)=>b[1]-a[1]).map(([l,n])=>riga(l,n+(n===1?" giorno":" giorni"))).join("")+'</div>')
    +sez("3. Giorno per giorno",'<div class="gx-lista">'+date.map(d=>'<div class="gx-riga grp-g"><div class="t"><div class="grp-d">'+esc(_gData(d))+'</div>'
      +ord.filter(g=>g.data===d).map(g=>'<div class="grp-w gior-u">'+esc([...new Set(g.ore.map(o=>giorNomeOp(o.operatore_id)))].join(", "))+'</div><div class="grp-c gior-u">'+esc(_gNomeLav(giorLavoro(g.lavoro_id))+(g.cosa?" — "+g.cosa:""))+'</div>').join("")
      +'</div></div>').join("")+'</div>');
  const q=giorQuarta();
  if(q.righe.length){
    h+=sez(_gP("4. Spese, benzina, fatture e bolle","4. Spese, benzina e fatture"),(typeof gxHtmlTotali==="function"?gxHtmlTotali():"")
      +'<div class="gx-lista">'+q.righe.map(r=>'<div class="gx-riga"><div class="t"><div class="grp-w gior-u">'+esc(r.cosa)+'</div><div class="grp-c">'+esc(r.giorno+" · "+r.tipo)+'</div></div>'+(r.euro?'<b>'+esc(_gEuro(r.euro))+'</b>':'')+'</div>').join("")+'</div>');
  }
  openSheetGrande("Riepilogo di "+esc(_gMeseNome(giorMese)),'<div class="grp-riep">'+h+'</div>',
    '<button class="btn b-cancel" data-action="close">Chiudi</button><button class="btn-primary b-save" data-gior-riep="pdf">Scarica il PDF</button>');
}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest('[data-gior-riep="pdf"]'); if(!b) return;
  giorPdf();
});

/* ---------------------------------------------------------------------
   I CLIC
   --------------------------------------------------------------------- */
document.addEventListener("change",e=>{
  const s=e.target.closest&&e.target.closest("[data-gior-io]"); if(!s) return;
  giorLeggiProp();
  if(s.value==="+"){ giorIoNuovo=true; giorDisegna(); const x=document.getElementById("gior-io-nome"); if(x) x.focus(); return; }
  giorIoNuovo=false; _gSetIo(s.value); giorDisegna();
});
document.addEventListener("change",async e=>{
  if(e.target&&e.target.id==="gior-sera-ora"&&giorSera&&giorSera.si){
    const r=await giorSeraChiama({azione:"ora",ora:e.target.value});
    if(r.ok){ giorSera.ora=e.target.value; _gSeraMsg("Fatto: ti chiedo alle "+e.target.value+".","ok"); } else _gSeraMsg(r.error||"Non salvato.","err");
  }
});
document.addEventListener("click",async e=>{
  const b=e.target.closest&&e.target.closest("#giornate [data-gior]"); if(!b) return;
  const a=b.dataset.gior;
  if(a==="prev"||a==="next"){ giorProp=null; giorModK=null; giorConferma=null; giorModifica=null; giorMese=_gSposta(giorMese,a==="next"?1:-1); renderGiornate(); return; }
  if(a==="compila"){ giorModK=null; return giorCompila(); }
  if(a==="ieri"&&giorUltima){ giorLeggiProp(); giorNuovi=[]; giorModK=null; giorProp=giorUltima.schede.map(c=>({data:_gOggi(),chi:new Set(c.chi),dove:c.dove,cosa:"",mezza:new Set()})); giorDisegna({t:"Stessa squadra e stesso cantiere, con la data di oggi. Controlla e premi «Salva».",k:"ok"}); return; }
  if(a==="mano"){ giorLeggiProp(); giorNuovi=[]; giorModK=null; giorProp=[{data:_gOggi(),chi:new Set(),dove:"",cosa:"",mezza:new Set()}]; giorDisegna(); return; }
  if(a==="annulla"){ giorProp=null; giorModK=null; giorNuovi=[]; giorAggiungi=null; giorDisegna(); return; }
  if(a==="mz"){
    giorLeggiProp(); const c=giorProp[+b.dataset.i]; const n=b.dataset.n; if(!c) return;
    if(!c.mezza) c.mezza=new Set();
    const io=_gIo(); if(io&&io!=="-"&&giorNomeOp(io)===n) c.mezza.delete("IO");
    if(b.dataset.v==="1") c.mezza.add(n); else c.mezza.delete(n);
    giorDisegna(giorMsgSchede); return;
  }
  if(a==="togli"){ giorLeggiProp(); giorProp.splice(+b.dataset.i,1); giorDisegna(); return; }
  if(a==="chip"){
    giorLeggiProp(); const c=giorProp[+b.dataset.i]; const n=b.dataset.n; if(!c) return;
    const io=_gIo(); const ioNome=io&&io!=="-"?giorNomeOp(io):"";
    if(c.chi.has(n)) c.chi.delete(n);
    else if(n===ioNome&&c.chi.has("IO")) c.chi.delete("IO");
    else c.chi.add(n);
    giorDisegna(); return;
  }
  if(a==="piu"){ giorLeggiProp(); giorAggiungi=+b.dataset.i; giorDisegna(); const x=document.getElementById("gior-nuovo"); if(x) x.focus(); return; }
  if(a==="piu-ok"){
    const n=((document.getElementById("gior-nuovo")||{}).value||"").trim();
    giorLeggiProp(); giorAggiungi=null;
    if(n){
      /* 18 nov 2026: «DAVID» o «prova controllore» scritti diversi sono la persona che c'e' gia' (prima nasceva un doppione in Squadra) */
      const k=_gNorm(n);
      const cE=giorOps.find(o=>_gNorm(o.nome)===k), cN=giorNuovi.find(x=>_gNorm(x)===k);
      const N=cE?cE.nome:(cN||n.charAt(0).toUpperCase()+n.slice(1));
      if(!cE&&!cN) giorNuovi.push(N);
      const c=giorProp[+b.dataset.i]; if(c) c.chi.add(N);
    }
    giorDisegna(); return;
  }
  if(a==="io-ok"){
    const n=((document.getElementById("gior-io-nome")||{}).value||"").trim(); if(!n) return;
    giorLeggiProp();
    const kIo=_gNorm(n), eIo=giorOps.find(o=>_gNorm(o.nome)===kIo), nIo=giorNuovi.find(x=>_gNorm(x)===kIo);
    const N=eIo?eIo.nome:(nIo||n.charAt(0).toUpperCase()+n.slice(1));
    giorIoNome=N; giorIoNuovo=false;
    if(!eIo&&!nIo) giorNuovi.push(N);
    giorProp.forEach(c=>{ if(c.chi.has("IO")){ c.chi.delete("IO"); c.chi.add(N); } });
    giorDisegna(); return;
  }
  if(a==="salva"){ b.disabled=true; await giorSalva(); return; }
  if(a==="pro-si"){ b.disabled=true; await giorProApprova(b.dataset.id); return; }
  if(a==="pro-no"){ b.disabled=true; await giorProScarta(b.dataset.id); return; }
  if(a==="squadra"){ const t=document.querySelector('nav.tabs button[data-tab="squadra"]'); if(t) t.click(); return; }
  if(a==="sera-parla"){ giorDallaSera=false; const v=document.getElementById("gv-btn"); if(v) v.click(); else { const t=document.getElementById("gior-voce"); if(t) t.focus(); } giorDisegna(); return; }
  if(a==="sera-accendi"){ b.disabled=true; await giorSeraAccendi(); return; }
  if(a==="sera-spegni"){ b.disabled=true; const rs=await giorSeraChiama({azione:"spegni",solo:"sera"}); if(!(rs&&rs.resta)){ try{ const r=await navigator.serviceWorker.getRegistration("/"); const x=r&&await r.pushManager.getSubscription(); if(x) await x.unsubscribe(); }catch(e){} } giorSera={si:false,ora:"18:30"}; giorDisegna({t:"Domanda della sera spenta su questo telefono.",k:"ok"}); return; }
  if(a==="sera-prova"){ b.disabled=true; const r=await giorSeraChiama({azione:"prova"}); _gSeraMsg(r.ok?"Mandata: fra qualche secondo il telefono suona.":(r.error||"Non è partita."),r.ok?"ok":"err"); b.disabled=false; return; }
  if(a==="cdl-salva"){ b.disabled=true; await giorCdlSalva(); b.disabled=false; return; }
  if(a==="cdl-prova"){ b.disabled=true; await giorCdlProva(); b.disabled=false; return; }
  if(a==="pdf") return giorPdf();
  if(a==="riep") return giorRiepilogo();
  if(a==="del"){ giorConferma=b.dataset.k; giorModifica=null; giorDisegna(); return; }
  if(a==="del-no"){ giorConferma=null; giorDisegna(); return; }
  if(a==="del-si"){ b.disabled=true; await giorCancella(b.dataset.k); return; }
  if(a==="mod"){
    /* 18 nov 2026: «modifica» apre la scheda piena (giorno, cantiere, persone, testo), non piu' solo il testo */
    const g=giorRighe.find(x=>x.k===b.dataset.k); if(!g) return;
    const nomi=[...new Set(g.ore.map(o=>giorNomeOp(o.operatore_id)))];
    giorNuovi=[]; giorConferma=null; giorModifica=null; giorAggiungi=null; giorModK=g.k;
    giorProp=[{data:g.data,chi:new Set(nomi),dove:_gNomeLav(giorLavoro(g.lavoro_id)),cosa:g.nota||"",
      /* mezza = 4 ore e nessun altro cantiere quel giorno (4 ore con un altro cantiere sono una giornata DIVISA, non mezza) */
      mezza:new Set(g.ore.filter(o=>(+o.ore||0)===GIOR_ORE_GIORNO/2&&!giorRighe.some(x=>x.k!==g.k&&x.data===g.data&&x.ore.some(y=>String(y.operatore_id)===String(o.operatore_id)))).map(o=>giorNomeOp(o.operatore_id)))}];
    giorDisegna();
    const sc=document.querySelector("#giornate .gprop"); if(sc&&sc.scrollIntoView) sc.scrollIntoView({block:"start",behavior:"smooth"});
    return;
  }
  if(a==="mod-no"){ giorModifica=null; giorDisegna(); return; }
  if(a==="mod-salva"){ b.disabled=true; await giorModSalva(b.dataset.k); return; }
});
