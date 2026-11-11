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
let giorModifica = null;   /* chiave della riga di cui si cambia il testo */
let giorVoce = "";
let giorAggiungi = null;
let giorIoNuovo = false;   /* il capo non e' ancora in Squadra: sta scrivendo il suo nome */
let giorIoNome = "";
let giorTariffe = {per:{},media:0};  /* costo orario: stessa costiOrari() del margine dei lavori */
let giorProposte = [];
let giorAvanz = {};         /* lavoro_id -> {importo, speso}: quanto ha gia' speso del suo valore */     /* le giornate mandate dagli operai, da approvare */
let giorCdl = null;
let giorSera = null;        /* {si:true|false, ora, perche} la domanda della sera su QUESTO telefono */
let giorDallaSera = /[?&]sera=1/.test(location.search);  /* arrivato toccando la notifica */        /* {email,invio,ultimo} il consulente del lavoro */       /* il suo nome: al Salva entra in Squadra e diventa «io» */   /* indice della scheda in cui si sta scrivendo un nome nuovo */

function _gYmd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function _gOggi(){ return _gYmd(new Date()); }
function _gMeseNome(ym){ const [y,m]=ym.split("-"); return GIOR_MESI[+m-1].charAt(0).toUpperCase()+GIOR_MESI[+m-1].slice(1)+" "+y; }
function _gData(iso){ const d=new Date(iso+"T12:00"); return GIOR_GG[d.getDay()]+" "+d.getDate()+" "+GIOR_MESI[d.getMonth()]; }
function _gSposta(ym,n){ let [y,m]=ym.split("-").map(Number); m+=n; if(m<1){m=12;y--;} if(m>12){m=1;y++;} return y+"-"+String(m).padStart(2,"0"); }
function _gNorm(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim(); }
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
    sb.from("gest_ore").select("id,data,ore,operatore_id,lavoro_id,rapportino_id").eq("user_id",sbUid).is("eliminato_il",null).gte("data",a).lt("data",b)
  ]);
  if(ro.error||rl.error||rh.error){ throw new Error((ro.error||rl.error||rh.error).message); }
  giorOps=ro.data||[]; giorLav=rl.data||[];
  const ore=rh.data||[];
  const ids=[...new Set(ore.map(o=>o.rapportino_id).filter(Boolean))];
  let rap={};
  if(ids.length){
    const rr=await sb.from("gest_rapportini").select("id,note,materiali,data,lavoro_id,eliminato_il").in("id",ids);
    if(rr.error) throw new Error(rr.error.message);
    (rr.data||[]).forEach(r=>{ rap[r.id]=r; });
  }
  const gruppi=giorGruppi(ore,rap);
  Object.values(gruppi).forEach(g=>{
    const r=g.rapportino_id&&rap[g.rapportino_id];
    g.cosa=r?[r.note,r.materiali?("Materiali: "+r.materiali):""].filter(Boolean).join(" · "):"";
  });
  giorRighe=Object.values(gruppi).sort((x,y)=>x.data.localeCompare(y.data));
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
        const md=costoManodopera(rh2.data||[],[],giorTariffe).per;
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
    const ru=await sb.from("gest_ore").select("data").eq("user_id",sbUid).is("eliminato_il",null).lt("data",oggi).order("data",{ascending:false}).limit(1);
    const dU=!ru.error&&ru.data&&ru.data[0]&&ru.data[0].data;
    if(dU){
      const rg=await sb.from("gest_ore").select("operatore_id,lavoro_id,rapportino_id").eq("user_id",sbUid).is("eliminato_il",null).eq("data",dU);
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
/* quanto e' costata la manodopera, cantiere per cantiere, nel mese */
function giorCostiCantieri(){
  const righe=[]; giorRighe.forEach(g=>g.ore.forEach(o=>righe.push({lavoro_id:g.lavoro_id,operatore_id:o.operatore_id,ore:o.ore})));
  const m=(typeof costoManodopera==="function"&&giorTariffe.letto)?costoManodopera(righe,[],giorTariffe):{per:{},senzaNome:{}};
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
  if(!giorMese) giorMese=_gOggi().slice(0,7);
  if(typeof sb==="undefined"||!sb||!sbUid){ box.innerHTML='<div class="gb"><div class="gvuoto">Accedi per segnare le giornate.</div></div>'; return; }
  if(!giorSera) giorSeraLeggi().then(()=>{ if(document.getElementById("gior-box")&&!giorProp) giorDisegna(); }).catch(()=>{});
  try{ await giorCarica(); }
  catch(e){ box.innerHTML='<div class="gb"><div class="gmsg err">Non riesco a leggere le giornate: '+esc(e.message||"")+'. Riprova fra un attimo.</div></div>'; return; }
  giorDisegna();
}

let giorImpAperto=false;   /* 6 nov 2026: le Impostazioni di Giornate restano aperte se le hai aperte tu */
function giorDisegna(msg){
  const box=document.getElementById("gior-box"); if(!box) return;
  const ta=document.getElementById("gior-voce"); if(ta) giorVoce=ta.value;
  const {per}=giorTotali(giorRighe);
  const date=[...new Set(giorRighe.map(g=>g.data))].sort().reverse();
  const tot=Object.entries(per).sort((a,b)=>b[1].g-a[1].g);
  let h=`<div class="gm"><button type="button" data-gior="prev" aria-label="Mese prima">‹</button><h3>${esc(_gMeseNome(giorMese))}</h3><button type="button" data-gior="next" aria-label="Mese dopo">›</button></div>`;
  if(tot.length) h+=`<div class="gt">${tot.map(([n,t])=>`<div><span>${esc(n)}</span><b>${t.g}</b><span>${t.g===1?"giorno":"giorni"}</span></div>`).join("")}</div>`;

  if(giorProposte.length){
    h+=`<div class="gb gpro"><h4>Da approvare (${giorProposte.length})</h4><div class="gnota">Le hanno mandate i tuoi operai. «Approva» le mette nel mese con 8 ore, insieme a foto, spese e bolle.</div>`;
    giorProposte.forEach(p=>{
      h+=`<div class="gpr"><div class="w">${esc(giorNomeOp(p.operatore_id))} · ${esc(_gData(p.data))}</div>
        <div class="c"><b>${esc(p.dove)}</b>${p.cosa?" — "+esc(p.cosa):""}</div>
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
    <textarea id="gior-voce" placeholder="«Oggi io, Wahid e Luis a Campoloniano, rifatto il tetto»">${esc(giorVoce)}</textarea>
    <button type="button" class="gbig" data-gior="compila" ${giorOccupato?"disabled":""}>${giorOccupato?"Ci penso…":"Compila la giornata"}</button>
    <div class="gmsg ${msg&&msg.k||""}" id="gior-msg">${esc(msg&&msg.t||"")}</div>
    ${!giorProp&&giorUltima?giorIeriHTML():""}
    ${giorProp?"":'<button type="button" class="glink" data-gior="mano" style="align-self:flex-start">Oppure scrivila a mano</button>'}
  </div>`;

  if(giorProp) h+=giorDisegnaProp();

  h+=`<div class="gb"><h4>Il mese</h4>`;
  /* 7 nov 2026: il PDF del mese si offre solo se nel mese c'e' qualcosa */
  { const bp=document.querySelector('[data-gior="pdf"]'); if(bp) bp.style.display=date.length?"":"none"; }
  if(!date.length) h+=`<div class="gvuoto">Nessuna giornata in ${esc(_gMeseNome(giorMese))}.</div>`;
  if(date.length&&typeof gxHtmlTotali==="function") h+=gxHtmlTotali();
  date.forEach(d=>{
    h+=`<div class="gday"><div class="gd">${esc(_gData(d))}</div>`;
    giorRighe.filter(g=>g.data===d).forEach((g,gi)=>{
      const chi=[...new Set(g.ore.map(o=>giorNomeOp(o.operatore_id)))];
      const mezze=g.ore.filter(o=>(+o.ore||0)<GIOR_ORE_GIORNO).map(o=>giorNomeOp(o.operatore_id)+" "+String(+o.ore).replace(".",",")+" ore");
      const L=_gNomeLav(giorLavoro(g.lavoro_id));
      h+=`<div class="gv"><div class="t"><div class="w">${esc(chi.join(", "))}</div>
        <div class="c">${esc(L)}${g.cosa?" — "+esc(g.cosa):""}${mezze.length?" ("+esc(mezze.join(", "))+")":""}</div></div>
        <div class="az">${g.rapportino_id?`<button type="button" class="glink" data-gior="mod" data-k="${esc(g.k)}">modifica</button>`:""}<button type="button" class="glink rosso" data-gior="del" data-k="${esc(g.k)}">cancella</button></div></div>`;
      if(giorModifica===g.k){
        h+=`<div class="gcard"><textarea id="gior-mod-t">${esc(g.cosa)}</textarea><div class="grow"><button type="button" class="gbig blu" data-gior="mod-salva" data-k="${esc(g.k)}">Salva</button><button type="button" class="btn" data-gior="mod-no" style="flex:0 0 auto">Annulla</button></div></div>`;
      }
      if(giorConferma===g.k){
        h+=`<div class="gconf">Cancello questa giornata e le sue ore? <button type="button" class="si" data-gior="del-si" data-k="${esc(g.k)}">Sì, cancella</button><button type="button" class="btn" data-gior="del-no">No</button></div>`;
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
    h+=`<div class="gb"><h4>I cantieri del mese</h4>`;
    can.forEach(c=>{
      h+=`<div class="gcan"><span class="n">${esc(c.nome)}</span><span class="g">${c.giorni.size} ${c.giorni.size===1?"giorno":"giorni"}</span>${conCosto?`<span class="e">${esc(_gEuro(c.euro))}</span>`:""}</div>`;
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
      h+=`<div class="gcan tot"><span class="n">Manodopera del mese</span><span class="e">${esc(_gEuro(tot))}</span></div>
        <div class="gnota">Ore segnate × costo orario di ognuno (lo scrivi in Squadra).</div>`;
    } else {
      h+=`<div class="gnota">Scrivi il costo orario dei tuoi operai in <button type="button" class="glink" data-gior="squadra">Squadra</button> e qui vedi quanto ti costa ogni cantiere.</div>`;
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
      <div class="gnota">Il primo di ogni mese gli mando le giornate del mese finito: giorni e ore di ognuno, cantiere per cantiere, e il file per Excel.</div>
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
      if(!giorIoProvato){ giorIoProvato=true; giorLeggiTitolare().then(()=>{ if(giorProp){ giorLeggiProp(); giorDisegna(); } }).catch(()=>{}); }
    } else giorIoSubito();
  }
  const io=_gIo();
  /* da soli: nelle schede vuote c'e' gia' lui */
  if(io&&io!=="-"&&giorOps.length===1&&giorProp){
    const o1=giorOps.find(x=>String(x.id)===String(io)), n=o1&&o1.nome; if(n) giorProp.forEach(c=>{ if(!c.chi.size||c.chi.has("IO")){ c.chi.delete("IO"); c.chi.add(n); } });
  }
  const serveIo=giorProp.some(c=>c.chi.has("IO"))&&!io;
  let h=`<div class="gb gprop"><h4>Controlla e salva</h4>`;
  if(serveIo){
    h+=`<div><div class="glab">Hai detto «io»: tu chi sei nella squadra?</div><select data-gior-io>
      <option value="">Scegli…</option>${giorOps.map(o=>`<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join("")}
      <option value="+">Non ci sono ancora: aggiungimi</option>
      <option value="-">Non lavoro in cantiere (non contare me)</option></select>
      ${giorIoNuovo?`<div class="grow" style="margin-top:8px"><input type="text" id="gior-io-nome" placeholder="Il tuo nome"><button type="button" class="btn" data-gior="io-ok" style="flex:0 0 auto">Aggiungi</button></div>`:""}</div>`;
  }
  const lavNomi=[...new Set(giorLav.map(_gNomeLav))];
  h+=`<datalist id="gior-lavori">${lavNomi.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>`;
  giorProp.forEach((c,i)=>{
    const nomi=giorOps.map(o=>o.nome).concat(giorNuovi);
    h+=`<div class="gcard" data-card="${i}">
      <div class="grow"><div><div class="glab">Giorno</div><input type="date" data-f="data" value="${esc(c.data)}"></div>
      <div><div class="glab">Cantiere</div><input type="text" data-f="dove" list="gior-lavori" value="${esc(c.dove)}" placeholder="Es. Campoloniano"></div></div>
      <div><div class="glab">Chi ha lavorato</div><div class="gchips">${nomi.map(n=>{
        const on=c.chi.has(n)||(c.chi.has("IO")&&io&&io!=="-"&&giorNomeOp(io)===n);
        const nuovo=giorNuovi.includes(n);
        return `<button type="button" class="gchip ${on?"on":""} ${nuovo?"nuovo":""}" data-gior="chip" data-i="${i}" data-n="${esc(n)}">${nuovo?"+ ":""}${esc(n)}</button>`;}).join("")}
        <button type="button" class="gchip nuovo" data-gior="piu" data-i="${i}">+ nuovo</button></div>
        ${giorAggiungi===i?`<div class="grow" style="margin-top:8px"><input type="text" id="gior-nuovo" placeholder="Nome"><button type="button" class="btn" data-gior="piu-ok" data-i="${i}" style="flex:0 0 auto">Aggiungi</button></div>`:""}
        ${giorNuovi.length?'<div class="gnota" style="margin-top:6px">I nomi col «+» non sono ancora in Squadra: se li lasci accesi, al Salva li aggiungo io.</div>':""}</div>
      <div><div class="glab">Cosa avete fatto</div><textarea data-f="cosa" id="gior-cosa-${i}" placeholder="Spese e note qui">${esc(c.cosa)}</textarea></div>
      ${giorProp.length>1?`<button type="button" class="glink rosso" data-gior="togli" data-i="${i}" style="align-self:flex-start">Togli questa</button>`:""}
    </div>`;
  });
  h+=`<div class="grow"><button type="button" class="gbig blu" data-gior="salva">Salva</button><button type="button" class="btn" data-gior="annulla" style="flex:0 0 auto">Annulla</button></div>
    <div class="gnota">Una giornata intera vale ${GIOR_ORE_GIORNO} ore. Se una persona sta in due cantieri lo stesso giorno, le ore si dividono.</div></div>`;
  return h;
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
  return `<button type="button" class="gieri" data-gior="ieri"><b>${esc(tit)}</b><span>${esc(det)}</span></button>`;
}
function giorDaNome(n){
  const k=_gNorm(n); if(!k) return null;
  if(n==="IO") return "IO";
  const o=giorOps.find(x=>_gNorm(x.nome)===k) || giorOps.find(x=>_gNorm(x.nome).split(" ")[0]===k.split(" ")[0]);
  return o?o.nome:null;
}
async function giorCompila(){
  const ta=document.getElementById("gior-voce"); const t=(ta&&ta.value||"").trim(); giorVoce=t;
  if(t.length<5){ giorDisegna({t:"Detta o scrivi prima com'è andata la giornata.",k:"err"}); return; }
  const tk=await giorToken(); if(!tk){ giorDisegna({t:"Sessione scaduta: esci e rientra.",k:"err"}); return; }
  giorLeggiProp(); giorOccupato=true; giorDisegna();
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
    return {data:d,chi,dove,cosa};
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
  giorOps=ro.data||[]; giorLav=rl.data||[];
}
async function giorTrovaLavoro(dove,data){
  const mest=_gMest();
  let lav=giorLav.find(l=>_gNorm(_gNomeLav(l))===_gNorm(dove));
  if(lav) return lav;
  const {data:d,error}=await sb.from("gest_lavori").insert({user_id:sbUid,mestiere_id:mest,descrizione:dove.trim(),dove:dove.trim(),stato:"in_corso",data_prevista:data||_gOggi()}).select("id,descrizione,dove,stato,mestiere_id");
  if(error||!d||!d.length) throw new Error("Non riesco a creare il cantiere «"+dove+"»: "+((error&&error.message)||"nessuna riga")+".");
  giorLav.unshift(d[0]); return d[0];
}
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
  for(const c of schede){
    /* 3. il cantiere: un lavoro che c'e' gia', o uno nuovo */
    /* 10 nov 2026: se la scheda porta gia' il lavoro (giornata mandata dal telefono), si usa quello */
    const lav=(c.lavoro_id&&giorLav.find(l=>String(l.id)===String(c.lavoro_id)))||await giorTrovaLavoro(c.dove,c.data);
    const mid=lav.mestiere_id||mest;
    /* 4. il rapportino */
    const rr=await sb.from("gest_rapportini").insert({user_id:sbUid,mestiere_id:mid,lavoro_id:lav.id,data:c.data,note:c.cosa.trim()||null}).select("id");
    if(rr.error||!rr.data||!rr.data.length){ throw new Error("Non salvato: "+((rr.error&&rr.error.message)||"nessuna riga")+"."); }
    const rid=rr.data[0].id;
    /* 5. le ore di chi c'era */
    const righe=c.nomi.map(n=>{
      const o=giorOps.find(x=>x.nome===n);
      const ore=Math.round((GIOR_ORE_GIORNO/(quante[n+"|"+c.data]||1))*2)/2;
      return {user_id:sbUid,mestiere_id:mid,lavoro_id:lav.id,operatore_id:o.id,data:c.data,ore,rapportino_id:rid};
    });
    const ro=await sb.from("gest_ore").insert(righe).select("id");
    if(ro.error||!ro.data||ro.data.length!==righe.length){ { const x=new Error("La giornata di «"+c.dove+"» è salvata, ma le ore non tutte: "+((ro.error&&ro.error.message)||"")+". Controlla in «Il mese»."); x.parziale=true; throw x; } }
    fatte++;
  }
  return fatte;
}

async function giorSalva(){
  giorLeggiProp();
  const io=_gIo();
  const schede=giorProp.map(c=>{
    const nomi=[...c.chi].map(n=>n==="IO"?(io&&io!=="-"?giorNomeOp(io):null):n).filter(Boolean);
    return {...c,nomi:[...new Set(nomi)]};
  });
  if(giorProp.some(c=>c.chi.has("IO"))&&!io){ giorDisegna({t:"Dimmi chi sei tu nella squadra (la tendina in alto), poi premi «Salva».",k:"err"}); return; }
  for(const c of schede){
    if(!c.nomi.length){ giorDisegna({t:"In una scheda non c'è nessuno: tocca almeno un nome.",k:"err"}); return; }
    if(!c.dove.trim()){ giorDisegna({t:"In una scheda manca il cantiere.",k:"err"}); return; }
  }
  let fatte=0;
  try{ fatte=await giorScrivi(schede); }
  catch(e){ giorDisegna({t:e.message,k:"err"}); if(e.parziale) await renderGiornate(); return; }
  giorProp=null; giorNuovi=[]; giorVoce="";
  giorMese=schede[0].data.slice(0,7);
  await renderGiornate();
  giorDisegna({t:fatte===1?"Giornata salvata ✔":fatte+" giornate salvate ✔",k:"ok"});
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

async function giorCancella(k){
  const g=giorRighe.find(x=>x.k===k); if(!g) return;
  const ora=new Date().toISOString();
  const ids=g.ore.map(o=>o.id);
  const ro=await sb.from("gest_ore").update({eliminato_il:ora}).in("id",ids).eq("user_id",sbUid).select("id");
  if(ro.error||!ro.data||!ro.data.length){ giorDisegna({t:"Non cancellata: "+((ro.error&&ro.error.message)||"nessuna riga")+".",k:"err"}); return; }
  if(g.rapportino_id){
    await sb.from("gest_rapportini").update({eliminato_il:ora}).eq("id",g.rapportino_id).eq("user_id",sbUid).select("id");
  }
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
  tabella("1. Giorni per lavoratore",["Lavoratore","Lavorato"],Object.entries(per).sort((a,b)=>a[0].localeCompare(b[0])).map(([n,t])=>[n,oreTxt(t)]),[90,90]);
  tabella("2. Giorni per cantiere",["Cantiere","Giorni"],Object.entries(luoghi).map(([l,n])=>[l,String(n)]),[140,40]);
  tabella("3. Giorno per giorno",["Giorno","Cantiere / lavoro","Chi ha lavorato"],
    giorRighe.map(g=>[_gData(g.data),_gNomeLav(giorLavoro(g.lavoro_id))+(g.cosa?" - "+g.cosa:""),[...new Set(g.ore.map(o=>giorNomeOp(o.operatore_id)))].join(", ")]),[32,88,60]);
  doc.save("Giornate di lavoro - "+_gMeseNome(giorMese)+".pdf");
}

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
  if(a==="prev"||a==="next"){ giorProp=null; giorConferma=null; giorModifica=null; giorMese=_gSposta(giorMese,a==="next"?1:-1); renderGiornate(); return; }
  if(a==="compila") return giorCompila();
  if(a==="ieri"&&giorUltima){ giorLeggiProp(); giorNuovi=[]; giorProp=giorUltima.schede.map(c=>({data:_gOggi(),chi:new Set(c.chi),dove:c.dove,cosa:""})); giorDisegna({t:"Stessa squadra e stesso cantiere, con la data di oggi. Controlla e premi «Salva».",k:"ok"}); return; }
  if(a==="mano"){ giorLeggiProp(); giorNuovi=[]; giorProp=[{data:_gOggi(),chi:new Set(),dove:"",cosa:""}]; giorDisegna(); return; }
  if(a==="annulla"){ giorProp=null; giorNuovi=[]; giorAggiungi=null; giorDisegna(); return; }
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
      const N=n.charAt(0).toUpperCase()+n.slice(1);
      if(!giorOps.some(o=>o.nome===N)&&!giorNuovi.includes(N)) giorNuovi.push(N);
      const c=giorProp[+b.dataset.i]; if(c) c.chi.add(N);
    }
    giorDisegna(); return;
  }
  if(a==="io-ok"){
    const n=((document.getElementById("gior-io-nome")||{}).value||"").trim(); if(!n) return;
    giorLeggiProp();
    const N=n.charAt(0).toUpperCase()+n.slice(1);
    giorIoNome=N; giorIoNuovo=false;
    if(!giorOps.some(o=>o.nome===N)&&!giorNuovi.includes(N)) giorNuovi.push(N);
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
  if(a==="del"){ giorConferma=b.dataset.k; giorModifica=null; giorDisegna(); return; }
  if(a==="del-no"){ giorConferma=null; giorDisegna(); return; }
  if(a==="del-si"){ b.disabled=true; await giorCancella(b.dataset.k); return; }
  if(a==="mod"){ giorModifica=b.dataset.k; giorConferma=null; giorDisegna(); return; }
  if(a==="mod-no"){ giorModifica=null; giorDisegna(); return; }
  if(a==="mod-salva"){ b.disabled=true; await giorModSalva(b.dataset.k); return; }
});
