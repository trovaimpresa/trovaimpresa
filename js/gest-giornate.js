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
let giorNuovi = [];        /* nomi detti che non sono in squadra */
let giorOccupato = false;
let giorConferma = null;   /* chiave della riga da cancellare */
let giorModifica = null;   /* chiave della riga di cui si cambia il testo */
let giorVoce = "";
let giorAggiungi = null;   /* indice della scheda in cui si sta scrivendo un nome nuovo */

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
#giornate .glink{background:none;border:0;color:var(--blu,#0066ff);text-decoration:underline;font-size:15px;cursor:pointer;padding:4px}
#giornate .glink.rosso{color:var(--err,#dc2626)}
#giornate .gnota{font-size:14px;color:var(--testo-2,#475569)}
#giornate .gmsg{font-size:15px}#giornate .gmsg:empty{display:none}
#giornate .gmsg.ok{color:var(--ok,#16a34a)}#giornate .gmsg.err{color:var(--err,#dc2626)}
#giornate .gconf{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:15px}
#giornate .gconf .si{background:var(--err,#dc2626);color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}
#giornate .gvuoto{color:var(--testo-2,#475569);text-align:center;padding:8px 0}
`;
  const st=document.createElement("style"); st.id="gior-stile"; st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
})();

/* ---------------------------------------------------------------------
   LETTURA
   --------------------------------------------------------------------- */
async function giorCarica(){
  const a=giorMese+"-01", b=_gSposta(giorMese,1)+"-01";
  const [ro,rl,rh]=await Promise.all([
    sb.from("gest_operatori").select("id,nome,mestiere_id").eq("user_id",sbUid).is("eliminato_il",null).order("nome"),
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
  const gruppi={};
  ore.forEach(o=>{
    if(o.rapportino_id){ const r=rap[o.rapportino_id]; if(!r||r.eliminato_il) return; }
    const k=o.rapportino_id||("L"+o.lavoro_id+"|"+o.data);
    if(!gruppi[k]) gruppi[k]={k,data:o.data,lavoro_id:o.lavoro_id,rapportino_id:o.rapportino_id||null,ore:[],cosa:""};
    gruppi[k].ore.push(o);
  });
  Object.values(gruppi).forEach(g=>{
    const r=g.rapportino_id&&rap[g.rapportino_id];
    g.cosa=r?[r.note,r.materiali?("Materiali: "+r.materiali):""].filter(Boolean).join(" · "):"";
  });
  giorRighe=Object.values(gruppi).sort((x,y)=>x.data.localeCompare(y.data));
}
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
  try{ await giorCarica(); }
  catch(e){ box.innerHTML='<div class="gb"><div class="gmsg err">Non riesco a leggere le giornate: '+esc(e.message||"")+'. Riprova fra un attimo.</div></div>'; return; }
  giorDisegna();
}

function giorDisegna(msg){
  const box=document.getElementById("gior-box"); if(!box) return;
  const ta=document.getElementById("gior-voce"); if(ta) giorVoce=ta.value;
  const {per}=giorTotali(giorRighe);
  const date=[...new Set(giorRighe.map(g=>g.data))].sort().reverse();
  const tot=Object.entries(per).sort((a,b)=>b[1].g-a[1].g);
  let h=`<div class="gm"><button type="button" data-gior="prev" aria-label="Mese prima">‹</button><h3>${esc(_gMeseNome(giorMese))}</h3><button type="button" data-gior="next" aria-label="Mese dopo">›</button></div>`;
  if(tot.length) h+=`<div class="gt">${tot.map(([n,t])=>`<div><span>${esc(n)}</span><b>${t.g}</b><span>${t.g===1?"giorno":"giorni"}</span></div>`).join("")}</div>`;

  h+=`<div class="gb"><h4>Racconta la giornata</h4>
    <textarea id="gior-voce" placeholder="«Oggi io, Wahid e Luis a Campoloniano, rifatto il tetto»">${esc(giorVoce)}</textarea>
    <button type="button" class="gbig" data-gior="compila" ${giorOccupato?"disabled":""}>${giorOccupato?"Ci penso…":"Compila la giornata"}</button>
    <div class="gmsg ${msg&&msg.k||""}" id="gior-msg">${esc(msg&&msg.t||"")}</div>
    ${giorProp?"":'<button type="button" class="glink" data-gior="mano" style="align-self:flex-start">Oppure scrivila a mano</button>'}
  </div>`;

  if(giorProp) h+=giorDisegnaProp();

  h+=`<div class="gb"><h4>Il mese</h4>`;
  if(!date.length) h+=`<div class="gvuoto">Nessuna giornata in ${esc(_gMeseNome(giorMese))}.</div>`;
  date.forEach(d=>{
    h+=`<div class="gday"><div class="gd">${esc(_gData(d))}</div>`;
    giorRighe.filter(g=>g.data===d).forEach(g=>{
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
    });
    h+=`</div>`;
  });
  h+=`</div>`;
  box.innerHTML=h;
}

function giorDisegnaProp(){
  const io=_gIo();
  const serveIo=giorProp.some(c=>c.chi.has("IO"))&&!io;
  let h=`<div class="gb gprop"><h4>Controlla e salva</h4>`;
  if(serveIo){
    h+=`<div><div class="glab">Hai detto «io»: tu chi sei nella squadra?</div><select data-gior-io>
      <option value="">Scegli…</option>${giorOps.map(o=>`<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join("")}
      <option value="-">Non sono in squadra (non contare me)</option></select></div>`;
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
      <div><div class="glab">Cosa avete fatto</div><textarea data-f="cosa" placeholder="Spese e note qui">${esc(c.cosa)}</textarea></div>
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
    return {data:d,chi,dove:String(g.dove||"").slice(0,120),cosa:String(g.cosa||"").slice(0,2000)};
  });
  giorDisegna({t:"Controlla qui sotto e premi «Salva».",k:"ok"});
}

/* ---------------------------------------------------------------------
   IL SALVATAGGIO
   --------------------------------------------------------------------- */
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
  const mest=_gMest();
  /* 1. i nomi nuovi entrano in Squadra */
  for(const n of [...new Set(schede.flatMap(c=>c.nomi))]){
    if(giorOps.some(o=>o.nome===n)) continue;
    const {data,error}=await sb.from("gest_operatori").insert({user_id:sbUid,mestiere_id:mest,nome:n}).select("id,nome,mestiere_id");
    if(error||!data||!data.length){ giorDisegna({t:"Non riesco ad aggiungere "+n+" alla squadra: "+((error&&error.message)||"nessuna riga")+".",k:"err"}); return; }
    giorOps.push(data[0]);
  }
  /* 2. quante schede ha ogni persona per ogni giorno: le 8 ore si dividono */
  const quante={};
  schede.forEach(c=>c.nomi.forEach(n=>{ const k=n+"|"+c.data; quante[k]=(quante[k]||0)+1; }));
  let fatte=0;
  for(const c of schede){
    /* 3. il cantiere: un lavoro che c'e' gia', o uno nuovo */
    let lav=giorLav.find(l=>_gNorm(_gNomeLav(l))===_gNorm(c.dove));
    if(!lav){
      const {data,error}=await sb.from("gest_lavori").insert({user_id:sbUid,mestiere_id:mest,descrizione:c.dove.trim(),dove:c.dove.trim(),stato:"in_corso",data_prevista:c.data}).select("id,descrizione,dove,stato,mestiere_id");
      if(error||!data||!data.length){ giorDisegna({t:"Non riesco a creare il cantiere «"+c.dove+"»: "+((error&&error.message)||"nessuna riga")+".",k:"err"}); return; }
      lav=data[0]; giorLav.unshift(lav);
    }
    const mid=lav.mestiere_id||mest;
    /* 4. il rapportino */
    const rr=await sb.from("gest_rapportini").insert({user_id:sbUid,mestiere_id:mid,lavoro_id:lav.id,data:c.data,note:c.cosa.trim()||null}).select("id");
    if(rr.error||!rr.data||!rr.data.length){ giorDisegna({t:"Non salvato: "+((rr.error&&rr.error.message)||"nessuna riga")+".",k:"err"}); return; }
    const rid=rr.data[0].id;
    /* 5. le ore di chi c'era */
    const righe=c.nomi.map(n=>{
      const o=giorOps.find(x=>x.nome===n);
      const ore=Math.round((GIOR_ORE_GIORNO/(quante[n+"|"+c.data]||1))*2)/2;
      return {user_id:sbUid,mestiere_id:mid,lavoro_id:lav.id,operatore_id:o.id,data:c.data,ore,rapportino_id:rid};
    });
    const ro=await sb.from("gest_ore").insert(righe).select("id");
    if(ro.error||!ro.data||ro.data.length!==righe.length){ giorDisegna({t:"La giornata di «"+c.dove+"» è salvata, ma le ore non tutte: "+((ro.error&&ro.error.message)||"")+". Controlla in «Il mese».",k:"err"}); await renderGiornate(); return; }
    fatte++;
  }
  giorProp=null; giorNuovi=[]; giorVoce="";
  giorMese=schede[0].data.slice(0,7);
  await renderGiornate();
  giorDisegna({t:fatte===1?"Giornata salvata ✔":fatte+" giornate salvate ✔",k:"ok"});
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
  giorLeggiProp(); _gSetIo(s.value); giorDisegna();
});
document.addEventListener("click",async e=>{
  const b=e.target.closest&&e.target.closest("#giornate [data-gior]"); if(!b) return;
  const a=b.dataset.gior;
  if(a==="prev"||a==="next"){ giorProp=null; giorConferma=null; giorModifica=null; giorMese=_gSposta(giorMese,a==="next"?1:-1); renderGiornate(); return; }
  if(a==="compila") return giorCompila();
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
  if(a==="salva"){ b.disabled=true; await giorSalva(); return; }
  if(a==="pdf") return giorPdf();
  if(a==="del"){ giorConferma=b.dataset.k; giorModifica=null; giorDisegna(); return; }
  if(a==="del-no"){ giorConferma=null; giorDisegna(); return; }
  if(a==="del-si"){ b.disabled=true; await giorCancella(b.dataset.k); return; }
  if(a==="mod"){ giorModifica=b.dataset.k; giorConferma=null; giorDisegna(); return; }
  if(a==="mod-no"){ giorModifica=null; giorDisegna(); return; }
  if(a==="mod-salva"){ b.disabled=true; await giorModSalva(b.dataset.k); return; }
});
