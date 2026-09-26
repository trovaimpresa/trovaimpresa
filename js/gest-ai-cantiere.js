/* =====================================================================
   TrovaImpresa — «LE IDEE RUBATE» — 26 settembre 2026

   Cinque cose prese dai gestionali piu' usati fuori dall'Italia e scelte
   da Alessio, nell'ordine in cui le ha volute:

     1. LA FOTO DELLA FATTURA DEL FORNITORE (Plancraft, Germania)
        Fotografi la fattura o la bolla: l'AI legge fornitore, numero, data,
        importo e scadenza e riempie il modulo «Fattura da pagare».
     2. PARLA INVECE DI SCRIVERE (Plancraft)
        Il microfono accanto a «Riempi le caselle»: in cantiere si parla,
        non si scrive. Vale per lavoro, cliente e preventivo.
     3. AGGIORNA IL CLIENTE (Buildertrend, America)
        Dai rapportini della settimana l'AI scrive il messaggio per il
        cliente; si manda su WhatsApp con un tasto.
     4. «SCRIVILO MEGLIO» (Jobber, America)
        Un messaggio scritto di corsa diventa gentile e professionale.
     5. LE SCELTE DEL CLIENTE (Buildertrend)
        Piastrelle, sanitari, colori: l'impresa mette le opzioni, il cliente
        sceglie da una pagina sul telefono e conferma. Niente piu' «ma io
        avevo detto l'altro».

   ⚠️ COME STA IN PIEDI QUESTO FILE (vale per tutti i js/ del gestionale):
   non e' in un IIFE e parte PRIMA della pagina. Vede sb, sbUid, esc,
   toast, $, openSheetGrande, closeSheet, cliCache, fornCache... ma al primo
   livello non puo' USARE niente della pagina: solo dentro le funzioni.
   Le azioni si agganciano con un ascoltatore PROPRIO su [data-action]:
   quello della pagina e' una catena di if(a===...) e lascia passare quello
   che non conosce.

   ⛔ L'AI NON SCRIVE MAI NEL DATABASE. Riempie le caselle: chi lavora
   controlla e salva col codice che c'era gia'.
   ===================================================================== */

/* ---------------------------------------------------------------------
   UTILITA' IN COMUNE
   --------------------------------------------------------------------- */
function _aicBase64(blob){
  return new Promise(function(ok,ko){
    const r=new FileReader();
    r.onerror=ko;
    r.onload=function(){const s=String(r.result||"");ok(s.slice(s.indexOf(",")+1));};
    r.readAsDataURL(blob);
  });
}
function _aicNorm(s){
  return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/\b(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?|di|&|e)\b/g," ")
    .replace(/[^a-z0-9]+/g," ").trim();
}
function _aicSt(el,testo,tipo){
  if(!el)return;
  el.className="aic-st"+(tipo?" aic-st--"+tipo:"");
  el.textContent=testo||"";
}
function _aicPronta(){return !!(window.AI&&typeof window.AI.cantiere==="function");}

const _AIC_SVG={
  cam:'<svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  file:'<svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  mic:'<svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/></svg>',
  stop:'<svg class="aic-ico" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  penna:'<svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  wa:'<svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/></svg>',
  copia:'<svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};

/* Copia negli appunti: PRIMA la strada vecchia, che funziona sempre e non
   chiede permessi (navigator.clipboard e' negato in parecchi browser —
   trovato dal vivo il 19 settembre). */
function _aicCopia(testo){
  let ok=false;
  try{
    const ta=document.createElement("textarea");
    ta.value=testo;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.left="-9999px";
    document.body.appendChild(ta);ta.select();ok=document.execCommand("copy");ta.remove();
  }catch(e){ok=false;}
  if(!ok&&navigator.clipboard){navigator.clipboard.writeText(testo).then(()=>toast("Copiato ✔"),()=>toast("Non riesco a copiare: seleziona il testo e copialo a mano"));return;}
  toast(ok?"Copiato ✔":"Non riesco a copiare: seleziona il testo e copialo a mano");
}

/* =====================================================================
   2. IL MICROFONO — «PARLA INVECE DI SCRIVERE»

   Usa il riconoscimento vocale del browser (Chrome, Edge, Safari su
   iPhone, Chrome su Android). Non costa niente e non passa dai nostri
   server. Dove non c'e' (Firefox) il pulsante NON compare: resta il
   microfono della tastiera del telefono, che funziona ovunque.

   ⚠️ Il testo detto si AGGIUNGE a quello gia' scritto, non lo sostituisce:
   si puo' scrivere mezza frase e dire il resto.
   ===================================================================== */
function aiMicrofonoC(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
function aiMicrofono(btn,ta,st){
  if(!btn||!ta)return;
  const SR=aiMicrofonoC();
  if(!SR){btn.hidden=true;return;}
  btn.hidden=false;
  let rec=null, attivo=false, base="";
  const etichetta=()=>{
    btn.classList.toggle("aic-mic--on",attivo);
    btn.innerHTML=attivo?(_AIC_SVG.stop+"<span>Ho finito</span>"):(_AIC_SVG.mic+"<span>Parla</span>");
    btn.setAttribute("aria-pressed",attivo?"true":"false");
  };
  etichetta();
  function ferma(){if(rec){try{rec.stop();}catch(e){}}}
  btn.onclick=function(){
    if(attivo){ferma();return;}
    try{rec=new SR();}catch(e){_aicSt(st,"Il microfono non parte su questo browser. Usa il microfono della tastiera.","err");return;}
    rec.lang="it-IT";rec.continuous=true;rec.interimResults=true;
    base=ta.value.trim();
    let finale="";
    rec.onresult=function(ev){
      let provv="";
      for(let i=ev.resultIndex;i<ev.results.length;i++){
        const r=ev.results[i];
        if(r.isFinal)finale+=(finale?" ":"")+r[0].transcript.trim();
        else provv+=r[0].transcript;
      }
      const pezzi=[base,finale,provv.trim()].filter(Boolean);
      ta.value=pezzi.join(" ");
      ta.dispatchEvent(new Event("input",{bubbles:true}));
    };
    rec.onerror=function(ev){
      const m={"not-allowed":"Il browser non ha il permesso di usare il microfono. Premi il lucchetto accanto all'indirizzo e consenti il microfono.",
               "service-not-allowed":"Il browser non ha il permesso di usare il microfono.",
               "no-speech":"Non ho sentito niente. Riprova parlando un po' più vicino al telefono.",
               "audio-capture":"Non trovo il microfono su questo dispositivo.",
               "network":"Per capire la voce serve internet: controlla la connessione."};
      _aicSt(st,m[ev.error]||"Il microfono si è fermato. Riprova.","err");
    };
    rec.onend=function(){attivo=false;rec=null;etichetta();
      if(st&&st.textContent.indexOf("Ti ascolto")===0)_aicSt(st,ta.value.trim()?"Fatto. Controlla il testo e vai avanti.":"",ta.value.trim()?"ok":"");
    };
    try{rec.start();}catch(e){_aicSt(st,"Il microfono non parte. Riprova fra un attimo.","err");return;}
    attivo=true;etichetta();
    _aicSt(st,"Ti ascolto… parla pure come al telefono. Quando hai finito premi «Ho finito».","");
  };
}
/* il pulsante, uguale per tutti: nasce nascosto, lo accende aiMicrofono */
function aiMicHTML(id){
  return '<button type="button" class="aic-mic" id="'+id+'" hidden>'+_AIC_SVG.mic+'<span>Parla</span></button>';
}

/* =====================================================================
   1. LA FOTO DELLA FATTURA DEL FORNITORE
   ===================================================================== */
let _ffLetto=null;   /* il file fotografato: si attacca al fornitore quando si salva */

function ffFotoHTML(){
  _ffLetto=null;
  return '<div class="sh-b aic-box" id="ff-foto">'
    +'<div class="sh-tit">Fotografala e la riempio io</div>'
    +'<p class="sh-nota" style="margin-top:0">Fai la foto alla fattura o alla bolla, oppure scegli il PDF. '
    +'Leggo io fornitore, numero, data, importo e scadenza. Costa <b>1 credito</b>.</p>'
    +'<div class="aic-fila">'
    +  '<label class="aic-btn aic-btn--pieno">'+_AIC_SVG.cam+'<span>Fai la foto</span>'
    +    '<input type="file" id="ff-foto-cam" accept="image/*" capture="environment" hidden></label>'
    +  '<label class="aic-btn">'+_AIC_SVG.file+'<span>Scegli foto o PDF</span>'
    +    '<input type="file" id="ff-foto-file" accept="image/*,application/pdf" hidden></label>'
    +'</div>'
    +'<div class="aic-st" id="ff-foto-st" aria-live="polite"></div>'
    +'<div class="aic-nuovo" id="ff-foto-nuovo" hidden></div>'
    +'</div>';
}

function ffFotoVia(){
  const a=document.getElementById("ff-foto-cam"), b=document.getElementById("ff-foto-file");
  [a,b].forEach(function(inp){
    if(!inp)return;
    inp.onchange=function(){const f=inp.files&&inp.files[0];inp.value="";if(f)ffFotoLeggi(f);};
  });
}

async function ffFotoLeggi(file){
  const st=document.getElementById("ff-foto-st");
  const nuovo=document.getElementById("ff-foto-nuovo");
  if(nuovo){nuovo.hidden=true;nuovo.innerHTML="";}
  if(!_aicPronta()){_aicSt(st,"L'assistente non si è caricato. Ricarica la pagina e riprova.","err");return;}
  const isPdf=file.type==="application/pdf"||/\.pdf$/i.test(file.name||"");
  const isImg=/^image\//.test(file.type||"");
  if(!isPdf&&!isImg){_aicSt(st,"Questo file non è una foto e non è un PDF.","err");return;}
  let blob=file, tipo=isPdf?"application/pdf":"image/jpeg";
  if(isImg){
    /* la foto del telefono pesa 3-5 MB: la stessa cura del resto del
       gestionale, 1600 px sul lato lungo. Si legge benissimo. */
    const p=typeof preparaFileUpload==="function"?await preparaFileUpload(file,{lato:1600,qualita:0.82}):{file:file,nome:file.name};
    if(p.errore){_aicSt(st,p.errore,"err");return;}
    blob=p.file;
    tipo=(p.compressa||!file.type)?"image/jpeg":file.type;
    if(["image/jpeg","image/png","image/webp"].indexOf(tipo)<0)tipo="image/jpeg";
    /* HEIC dell'iPhone non compresso: il server non lo sa leggere */
    if(!p.compressa&&/heic|heif/i.test(file.type||file.name||"")){
      _aicSt(st,"Questa foto è in un formato che non riesco a leggere (HEIC). Scattala dal pulsante «Fai la foto».","err");return;}
  }
  if(blob.size>5*1024*1024){_aicSt(st,"Il file è troppo grande: massimo 5 MB. Se è un PDF di tante pagine, fotografa solo la prima.","err");return;}
  _aicSt(st,"Sto leggendo la fattura…","");
  document.getElementById("ff-foto").classList.add("aic-box--lavora");
  let d=null;
  try{
    const dati=await _aicBase64(blob);
    const nomi=(typeof fornCache!=="undefined"?fornCache:[]).map(x=>x.nome).filter(Boolean).slice(0,60);
    const testo="Leggi questa fattura di un fornitore."+(nomi.length?"\nFornitori gia' in rubrica (se e' uno di questi, scrivi il nome IDENTICO): "+nomi.join(" | "):"");
    d=await window.AI.cantiere("dati_fattura_fornitore",testo,{tipo:tipo,dati:dati},true);
  }catch(e){
    _aicSt(st,(e&&e.message)||"Non ci sono riuscito. Riprova fra un attimo.","err");
  }
  const box=document.getElementById("ff-foto");if(box)box.classList.remove("aic-box--lavora");
  if(!d)return;   /* null = crediti finiti: la finestra l'ha gia' mostrata l'AI */
  if(d.leggibile===false){_aicSt(st,"Non riesco a leggerla: la foto è sfocata o non è una fattura. Rifalla dritta, con più luce, e che si veda il totale.","err");return;}
  _ffLetto={blob:blob,nome:(file.name||"fattura")};
  ffRiempi(d,st);
}

function _ffImporto(n){
  const v=Math.round((+n||0)*100)/100;
  return v.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function _ffMetti(id,val){
  const el=document.getElementById(id);if(!el||val===undefined||val===null||String(val).trim()==="")return false;
  el.value=String(val);
  el.dispatchEvent(new Event("input",{bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
  el.classList.add("ai-pieno");setTimeout(()=>el.classList.remove("ai-pieno"),2600);
  return true;
}
function _ffTrovaFornitore(nome,piva){
  const lista=typeof fornCache!=="undefined"?fornCache:[];
  const p=String(piva||"").replace(/\D/g,"");
  if(p.length>=11){const x=lista.find(f=>String(f.piva||"").replace(/\D/g,"")===p);if(x)return x;}
  const n=_aicNorm(nome);if(!n)return null;
  return lista.find(f=>_aicNorm(f.nome)===n)
      || lista.find(f=>{const m=_aicNorm(f.nome);return m.length>3&&(n.indexOf(m)>=0||m.indexOf(n)>=0);})
      || null;
}

function ffRiempi(d,st){
  const messi=[];
  if(_ffMetti("ff-num",d.numero))messi.push("numero");
  if(/^\d{4}-\d{2}-\d{2}$/.test(d.data||"")&&_ffMetti("ff-data",d.data))messi.push("data");
  if(+d.totale>0&&_ffMetti("ff-imp",_ffImporto(d.totale)))messi.push("importo");
  if(/^\d{4}-\d{2}-\d{2}$/.test(d.scadenza||"")&&_ffMetti("ff-scad",d.scadenza))messi.push("scadenza");
  const note=document.getElementById("ff-note");
  if(note&&!note.value.trim()&&d.cosa){_ffMetti("ff-note",d.cosa);messi.push("note");}

  const sel=document.getElementById("ff-forn");
  const f=_ffTrovaFornitore(d.fornitore,d.partita_iva);
  const nuovo=document.getElementById("ff-foto-nuovo");
  if(f&&sel){
    sel.value=String(f.id);sel.dispatchEvent(new Event("change",{bubbles:true}));
    sel.classList.add("ai-pieno");setTimeout(()=>sel.classList.remove("ai-pieno"),2600);
    messi.unshift("fornitore");
  }else if(d.fornitore&&nuovo){
    /* ⛔ la tendina NON deve restare sul primo fornitore dell'elenco: si
       salverebbe la fattura sul fornitore sbagliato senza accorgersene.
       Si mette su «scegli», cosi' «Aggiungi» si ferma finche' non lo dici. */
    if(sel){
      let v=sel.querySelector('option[value=""]');
      if(!v){v=document.createElement("option");v.value="";sel.insertBefore(v,sel.firstChild);}
      v.textContent="— scegli il fornitore —";
      sel.value="";
    }
    /* ⛔ Il fornitore non si crea da solo: lo si PROPONE, e basta un tocco.
       Crearlo in silenzio vorrebbe dire riempire la rubrica di doppioni
       ogni volta che l'AI legge il nome un po' diverso. */
    nuovo.hidden=false;
    nuovo.innerHTML='<b>'+esc(d.fornitore)+'</b> non è nella tua rubrica dei fornitori.'
      +'<button type="button" class="aic-btn aic-btn--pieno" data-action="ff-foto-addforn"'
      +' data-nome="'+esc(d.fornitore)+'" data-piva="'+esc(String(d.partita_iva||"").replace(/\D/g,""))+'">+ Aggiungilo</button>';
  }

  /* la stessa fattura registrata due volte e' un pagamento doppio */
  let doppia=false;
  try{
    const lista=typeof fattfCache!=="undefined"?fattfCache:[];
    const num=String(d.numero||"").replace(/\s/g,"").toLowerCase();
    if(num&&f)doppia=lista.some(x=>String(x.fornitore_id)===String(f.id)&&String(x.numero||"").replace(/\s/g,"").toLowerCase()===num&&!x.eliminato_il);
  }catch(e){}

  if(!messi.length){_aicSt(st,"Non ho trovato niente da leggere. Rifai la foto più dritta e con più luce.","err");return;}
  let msg="Ho riempito: "+messi.join(", ")+". Controlla, poi premi «Aggiungi».";
  if(+d.imponibile>0&&+d.totale>0&&Math.abs(d.imponibile-d.totale)>0.009)msg+=" L'importo è il totale da pagare, IVA compresa ("+_ffImporto(d.imponibile)+" € senza IVA).";
  if(doppia){_aicSt(st,"Attenzione: una fattura con questo numero di questo fornitore è già registrata. Controlla di non segnarla due volte.","err");return;}
  _aicSt(st,msg,"ok");
}

async function ffFotoAggiungiForn(btn){
  const nome=(btn.dataset.nome||"").trim();if(!nome)return;
  if(!sb||!sbUid){toast("Devi essere loggato");return;}
  btn.disabled=true;btn.textContent="Aggiungo…";
  const riga={user_id:sbUid,mestiere_id:curMestiere(),nome:nome,piva:btn.dataset.piva||null};
  const {data,error}=await sb.from("gest_fornitori").insert(riga).select("id,nome,piva");
  if(error||!data||!data.length){btn.disabled=false;btn.textContent="+ Aggiungilo";toast("Non aggiunto: "+((error&&error.message)||"riprova"));return;}
  const f=data[0];
  try{if(typeof fornCache!=="undefined")fornCache.push(Object.assign({},riga,f));}catch(e){}
  const sel=document.getElementById("ff-forn");
  if(sel){
    const vuota=sel.querySelector('option[value=""]');if(vuota)vuota.remove();
    const o=document.createElement("option");o.value=f.id;o.textContent=f.nome;sel.appendChild(o);
    sel.value=String(f.id);sel.dispatchEvent(new Event("change",{bubbles:true}));
    sel.classList.add("ai-pieno");setTimeout(()=>sel.classList.remove("ai-pieno"),2600);
  }
  const box=document.getElementById("ff-foto-nuovo");
  if(box){box.innerHTML="<b>"+esc(f.nome)+"</b> aggiunto ai tuoi fornitori ✔";}
}

/* dopo il salvataggio: la foto resta attaccata al fornitore, fra i suoi
   documenti. Se non ci riesce la fattura resta salvata lo stesso. */
async function ffFotoAllega(fornitore_id){
  if(!_ffLetto||!fornitore_id||!sb||!sbUid)return;
  const f=_ffLetto;_ffLetto=null;
  try{
    const ext=f.blob.type==="application/pdf"?"pdf":"jpg";
    const nome=String(f.nome||"fattura").replace(/\.[^.]+$/,"").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,60)+"."+ext;
    const path=sbUid+"/fornitori/"+fornitore_id+"/"+Date.now()+"_"+nome;
    const {error:up}=await sb.storage.from("gestionale-foto").upload(path,f.blob,{contentType:f.blob.type||"image/jpeg"});
    if(up)return;
    const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,fornitore_id:fornitore_id,tipo:"doc_fornitore",operatore:"Capo",storage_path:path,nome_file:nome});
    if(ins&&typeof _fileOrfano==="function")await _fileOrfano("gestionale-foto",path);
  }catch(e){}
}

/* =====================================================================
   4. «SCRIVILO MEGLIO»

   Si attacca sotto qualunque casella dove si scrive a un cliente.
   Cambia la forma, MAI la sostanza (date, prezzi, promesse): lo dice la
   funzione sul server. E si puo' sempre tornare com'era.
   ===================================================================== */
function aiScriviMeglioHTML(pre){
  return '<div class="aic-fila aic-fila--sotto">'
    +'<button type="button" class="aic-btn" id="'+pre+'-meglio">'+_AIC_SVG.penna+'<span>Scrivilo meglio</span><small>1 credito</small></button>'
    +aiMicHTML(pre+'-mic')
    +'<button type="button" class="aic-link" id="'+pre+'-torna" hidden>↩ Torna com\'era</button>'
    +'</div><div class="aic-st" id="'+pre+'-st" aria-live="polite"></div>';
}
function aiScriviMeglioVia(pre,ta){
  const b=document.getElementById(pre+"-meglio"), torna=document.getElementById(pre+"-torna"),
        st=document.getElementById(pre+"-st");
  if(!b||!ta)return;
  aiMicrofono(document.getElementById(pre+"-mic"),ta,st);
  let prima=null;
  b.onclick=async function(){
    const testo=ta.value.trim();
    if(testo.length<8){_aicSt(st,"Scrivi prima il messaggio, anche di corsa: poi lo sistemo io.","err");ta.focus();return;}
    if(!_aicPronta()){_aicSt(st,"L'assistente non si è caricato. Ricarica la pagina e riprova.","err");return;}
    b.disabled=true;const lab=b.querySelector("span");const vecchia=lab.textContent;lab.textContent="Lo sistemo…";
    _aicSt(st,"","");
    try{
      const r=await window.AI.cantiere("scrivi_meglio",testo,null,false);
      if(r){
        prima=ta.value;ta.value=r.trim();
        ta.dispatchEvent(new Event("input",{bubbles:true}));
        ta.classList.add("ai-pieno");setTimeout(()=>ta.classList.remove("ai-pieno"),2600);
        if(torna)torna.hidden=false;
        _aicSt(st,"Fatto. Rileggilo: se qualcosa non va, correggilo o torna com'era.","ok");
      }
    }catch(e){_aicSt(st,(e&&e.message)||"Non ci sono riuscito. Riprova.","err");}
    b.disabled=false;lab.textContent=vecchia;
  };
  if(torna)torna.onclick=function(){
    if(prima===null)return;
    ta.value=prima;prima=null;torna.hidden=true;
    ta.dispatchEvent(new Event("input",{bubbles:true}));
    _aicSt(st,"Rimesso com'era.","");
  };
}
/* per le finestre che c'erano gia' (l'email del documento al cliente):
   si infila sotto la casella senza riscrivere la finestra. */
function aiScriviMeglioAggancia(sel,pre){
  const ta=document.querySelector(sel);if(!ta||document.getElementById(pre+"-meglio"))return;
  const w=document.createElement("div");w.innerHTML=aiScriviMeglioHTML(pre);
  const dopo=ta.closest(".field")||ta;
  while(w.firstChild)dopo.parentNode.insertBefore(w.lastChild,dopo.nextSibling);
  aiScriviMeglioVia(pre,ta);
}

/* =====================================================================
   3. AGGIORNA IL CLIENTE — il resoconto della settimana

   ⛔ All'AI NON arriva il nome del cliente ne' l'indirizzo: solo il lavoro,
   lo stato e quello che la squadra ha scritto nei rapportini. Il saluto col
   nome lo mette il gestionale DOPO. Ne' soldi: un resoconto che parla di
   soldi e' un sollecito.
   ⛔ 26 set 2026 — NIENTE riga «Lavori seguiti con TrovaImpresa» in fondo:
   l'aveva proposta Claude, Alessio l'ha fatta togliere. Il messaggio e'
   dell'impresa e porta solo la sua firma (il nome da Dati azienda).
   ===================================================================== */
let _rcLav=null, _rcGiorni=7, _rcCli=null, _rcAz=null, _rcFatti=null;

async function rcApri(id){
  if(!sb||!sbUid){toast("Devi essere loggato");return;}
  const {data:l,error}=await sb.from("gest_lavori").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
  if(error||!l){toast("Lavoro non trovato");return;}
  _rcLav=l;_rcGiorni=7;
  _rcCli=null;
  if(l.cliente_id){
    _rcCli=(typeof cliCache!=="undefined"?cliCache:[]).find(c=>String(c.id)===String(l.cliente_id))||null;
    if(!_rcCli){const r=await sb.from("gest_clienti").select("id,nome,referente,telefono").eq("id",l.cliente_id).maybeSingle();_rcCli=r.data||null;}
  }
  if(!_rcAz){const r=await sb.from("gest_azienda").select("nome").eq("user_id",sbUid).maybeSingle();_rcAz=r.data||{};}
  const tel=(_rcCli&&_rcCli.telefono)||"";
  const chi=(_rcCli&&(_rcCli.referente||_rcCli.nome))||"";
  const pro=typeof ruoloUtente!=="undefined"&&ruoloUtente==="professionista";
  openSheetGrande("Aggiorna il cliente",
    '<div class="sh-cols"><div class="sh-col">'
    +'<div class="sh-b">'
    +  '<div class="sh-tit">Cosa è successo</div>'
    +  '<div class="aic-lav"><b>'+esc(l.descrizione||(pro?"Pratica":"Lavoro"))+'</b></div>'
    +  '<div class="segm aic-segm" id="rc-periodo">'
    +    '<button type="button" data-action="rc-periodo" data-v="7" class="on">Ultimi 7 giorni</button>'
    +    '<button type="button" data-action="rc-periodo" data-v="14">Ultimi 14 giorni</button>'
    +    '<button type="button" data-action="rc-periodo" data-v="0">Dall\'inizio</button>'
    +  '</div>'
    +  '<div id="rc-fatti" class="aic-fatti"><div class="campo-aiuto">Leggo i rapportini…</div></div>'
    +'</div>'
    +'<div class="sh-b">'
    +  '<div class="sh-tit">Vuoi aggiungere qualcosa?</div>'
    +  '<div class="field"><label for="rc-agg">Due righe tue (facoltativo)</label>'
    +  '<textarea id="rc-agg" rows="3" placeholder="Es. la settimana prossima montiamo i sanitari, martedì serve che ci sia qualcuno in casa"></textarea></div>'
    +  '<div class="aic-fila">'
    +    '<button type="button" class="aic-btn aic-btn--pieno" id="rc-scrivi">'+_AIC_SVG.penna+'<span>Scrivi il messaggio</span><small>1 credito</small></button>'
    +    aiMicHTML("rc-agg-mic")
    +  '</div>'
    +  '<div class="aic-st" id="rc-agg-st" aria-live="polite"></div>'
    +'</div>'
    +'</div><div class="sh-col">'
    +'<div class="sh-b">'
    +  '<div class="sh-tit">Il messaggio</div>'
    +  '<div class="field"><label for="rc-tel">A chi lo mando (WhatsApp)</label>'
    +  '<input id="rc-tel" inputmode="tel" value="'+esc(tel)+'" placeholder="Numero del cliente"></div>'
    +  (_rcCli?'':'<div class="campo-aiuto" style="margin-top:-6px">Questo lavoro non ha un cliente collegato: scrivi il numero qui sopra.</div>')
    +  (tel||!_rcCli?'':'<div class="campo-aiuto" style="margin-top:-6px">'+esc(_rcCli.nome||"Il cliente")+' non ha un telefono salvato: scrivilo qui sopra.</div>')
    +  '<div class="field"><label for="rc-testo">Testo (lo puoi cambiare)</label>'
    +  '<textarea id="rc-testo" rows="10" placeholder="Premi «Scrivi il messaggio» qui a sinistra, oppure scrivilo tu."></textarea></div>'
    +  aiScriviMeglioHTML("rc")
    +'</div>'
    +'</div></div>',
    '<button class="btn b-cancel" data-action="close">Annulla</button>'
    +'<button class="btn" data-action="rc-copia">'+_AIC_SVG.copia+' Copia</button>'
    +'<button class="btn-primary" data-action="rc-wa">'+_AIC_SVG.wa+' Manda su WhatsApp</button>');
  const rcTesto=document.getElementById("rc-testo");
  aiScriviMeglioVia("rc",rcTesto);
  aiMicrofono(document.getElementById("rc-agg-mic"),document.getElementById("rc-agg"),document.getElementById("rc-agg-st"));
  document.getElementById("rc-scrivi").onclick=rcScrivi;
  rcChi=chi;
  await rcCaricaFatti();
}
let rcChi="";

async function rcCaricaFatti(){
  const box=document.getElementById("rc-fatti");if(!box||!_rcLav)return;
  const dal=_rcGiorni?new Date(Date.now()-_rcGiorni*86400000).toISOString().slice(0,10):null;
  let q1=sb.from("gest_rapportini").select("data,materiali,note").eq("user_id",sbUid).eq("lavoro_id",_rcLav.id);
  let q2=sb.from("gest_foto").select("id,created_at,tipo").eq("user_id",sbUid).eq("lavoro_id",_rcLav.id);
  if(dal){q1=q1.gte("data",dal);q2=q2.gte("created_at",dal);}
  const [r1,r2]=await Promise.all([q1.order("data",{ascending:true}),q2]);
  const rap=(r1.data||[]).filter(r=>(r.note||r.materiali));
  const foto=(r2.data||[]).filter(f=>!/^doc/.test(f.tipo||"")).length;
  _rcFatti={rap:rap,foto:foto};
  const stato={da_fare:"da iniziare",in_corso:"in corso",fatto:"finito"}[_rcLav.stato]||"";
  const righe=[];
  righe.push('<li><span>Stato</span><b>'+esc(stato||"—")+'</b></li>');
  righe.push('<li><span>Rapportini con qualcosa scritto</span><b>'+rap.length+'</b></li>');
  righe.push('<li><span>Foto fatte</span><b>'+foto+'</b></li>');
  let html='<ul class="aic-conta">'+righe.join("")+'</ul>';
  if(rap.length){
    html+='<div class="aic-rap">'+rap.slice(-6).map(r=>'<div><small>'+esc(fdate(r.data))+'</small>'
      +esc([r.note,r.materiali?("Materiali: "+r.materiali):""].filter(Boolean).join(" · ")).slice(0,220)+'</div>').join("")+'</div>';
  }else{
    html+='<div class="campo-aiuto">Nel periodo non ci sono rapportini scritti. Aggiungi tu due righe qui sotto: il messaggio lo scrivo da quelle.</div>';
  }
  box.innerHTML=html;
}

async function rcScrivi(){
  const st=document.getElementById("rc-agg-st"), b=document.getElementById("rc-scrivi");
  const agg=(document.getElementById("rc-agg")||{}).value||"";
  if(!_rcFatti||(!_rcFatti.rap.length&&agg.trim().length<5)){
    _rcSt(st,"Non ho niente da raccontare: scrivi due righe su cosa avete fatto, oppure scegli «Dall'inizio».");return;}
  if(!_aicPronta()){_rcSt(st,"L'assistente non si è caricato. Ricarica la pagina e riprova.");return;}
  const l=_rcLav, pro=typeof ruoloUtente!=="undefined"&&ruoloUtente==="professionista";
  const stato={da_fare:"da iniziare",in_corso:"in corso",fatto:"finito"}[l.stato]||"";
  let testo=(pro?"PRATICA: ":"LAVORO: ")+(l.descrizione||"")+"\nSTATO: "+stato
    +"\nPERIODO: "+(_rcGiorni?("ultimi "+_rcGiorni+" giorni"):"dall'inizio del lavoro")
    +"\nFOTO FATTE NEL PERIODO: "+_rcFatti.foto
    +"\nRAPPORTINI DELLA SQUADRA:\n"+(_rcFatti.rap.length?_rcFatti.rap.map(r=>"- "+r.data+": "+[r.note,r.materiali?("materiali: "+r.materiali):""].filter(Boolean).join("; ")).join("\n"):"(nessuno)")
    +(l.lavoro_svolto?"\nLAVORO SVOLTO (riassunto del titolare): "+l.lavoro_svolto:"")
    +(agg.trim()?"\nDUE RIGHE DEL TITOLARE: "+agg.trim():"");
  testo=testo.slice(0,7500);
  b.disabled=true;const lab=b.querySelector("span");const v=lab.textContent;lab.textContent="Scrivo…";
  _aicSt(st,"","");
  try{
    let r=await window.AI.cantiere("resoconto_cliente",testo,null,false);
    if(r){
      r=r.trim();
      /* il nome lo mettiamo noi: all'AI non e' mai arrivato */
      if(rcChi)r=r.replace(/^Buongiorno,?/i,"Buongiorno "+rcChi.split(" ")[0]+",");
      const ta=document.getElementById("rc-testo");
      ta.value=r;ta.dispatchEvent(new Event("input",{bubbles:true}));
      ta.classList.add("ai-pieno");setTimeout(()=>ta.classList.remove("ai-pieno"),2600);
      _aicSt(st,"Scritto. Rileggilo nel riquadro «Il messaggio», cambialo se serve, poi mandalo.","ok");
      /* sul telefono il messaggio sta sotto: ci si porta da soli */
      if(window.matchMedia&&window.matchMedia("(max-width:880px)").matches){try{ta.scrollIntoView({behavior:"smooth",block:"center"});}catch(e){}}
    }
  }catch(e){_rcSt(st,(e&&e.message)||"Non ci sono riuscito. Riprova.");}
  b.disabled=false;lab.textContent=v;
}
function _rcSt(st,t){_aicSt(st,t,"err");}

function rcTestoFinale(){
  let t=((document.getElementById("rc-testo")||{}).value||"").trim();
  if(!t)return "";
  const nomeAz=(_rcAz&&_rcAz.nome)||"";
  if(nomeAz&&t.indexOf(nomeAz)<0)t+="\n\n"+nomeAz;
  return t;
}
function rcWhatsApp(){
  const t=rcTestoFinale();
  if(!t){toast("Il messaggio è vuoto: scrivilo o premi «Scrivi il messaggio»");return;}
  const tel=typeof waCleanTel==="function"?waCleanTel((document.getElementById("rc-tel")||{}).value||""):"";
  const url=tel?("https://wa.me/"+tel+"?text="+encodeURIComponent(t)):("https://wa.me/?text="+encodeURIComponent(t));
  window.open(url,"_blank","noopener");
}

/* =====================================================================
   5. LE SCELTE DEL CLIENTE

   L'impresa mette per ogni cosa da scegliere (piastrelle bagno, sanitari,
   colore pareti...) due o piu' opzioni, con prezzo e foto. Il cliente apre
   un link sul telefono — senza account — sceglie e conferma. Da quel
   momento le scelte sono ferme: se vuole cambiare, l'impresa riapre.

   Tabelle: gest_scelte (una riga per cosa da scegliere) e
   gest_scelte_link (il link segreto del lavoro). sql/gest-scelte.sql.
   Il cliente NON entra nel database: passa da
   netlify/functions/scelte-cliente.js, che riconosce il link.
   ===================================================================== */
let _scLav=null, _scLink=null, _scRighe=[];

async function scApri(id){
  if(!sb||!sbUid){toast("Devi essere loggato");return;}
  const lid=id||(_scLav&&_scLav.id);
  const {data:l}=await sb.from("gest_lavori").select("id,descrizione,cliente_id").eq("id",lid).eq("user_id",sbUid).maybeSingle();
  if(!l){toast("Lavoro non trovato");return;}
  _scLav=l;
  const [r1,r2]=await Promise.all([
    sb.from("gest_scelte").select("*").eq("user_id",sbUid).eq("lavoro_id",l.id).order("ordine").order("created_at"),
    sb.from("gest_scelte_link").select("*").eq("user_id",sbUid).eq("lavoro_id",l.id).maybeSingle()
  ]);
  if(r1.error){
    const em=r1.error.message||"";
    toast(/gest_scelte|schema cache|does not exist/i.test(em)
      ?"Le Scelte del cliente hanno bisogno di un aggiornamento del database: esegui sql/gest-scelte.sql su Supabase."
      :"Non riesco a leggere le scelte: "+em);
    return;
  }
  _scRighe=r1.data||[];_scLink=r2.data||null;
  const fatte=_scRighe.filter(s=>s.scelta!==null&&s.scelta!==undefined).length;
  const conf=_scLink&&_scLink.confermato_il;

  let stato;
  if(!_scRighe.length)stato='<div class="campo-aiuto" style="margin-top:0">Aggiungi le cose che il cliente deve scegliere: per ognuna metti due o più possibilità, con il prezzo e una foto se ce l\'hai.</div>';
  else if(conf)stato='<div class="aic-banda aic-banda--ok"><b>Il cliente ha confermato le sue scelte</b> il '+esc(new Date(conf).toLocaleDateString("it-IT",{day:"numeric",month:"long"}))+'. Adesso sono ferme: se deve cambiare qualcosa, riaprile.'
    +'<button type="button" class="aic-btn" data-action="sc-riapri">Riapri le scelte</button></div>';
  else if(_scLink)stato='<div class="aic-banda aic-banda--attesa"><b>Il cliente ha scelto '+fatte+' su '+_scRighe.length+'.</b> Non ha ancora confermato.</div>';
  else stato='<div class="aic-banda">Quando le scelte sono pronte, manda il link al cliente: le vede sul telefono, sceglie e conferma. Non serve che si iscriva.</div>';

  const carte=_scRighe.map(function(s,i){
    const ops=Array.isArray(s.opzioni)?s.opzioni:[];
    const scelto=(s.scelta!==null&&s.scelta!==undefined)?ops[s.scelta]:null;
    return '<div class="aic-sc">'
      +'<div class="aic-sc-top"><b>'+esc(s.titolo)+'</b>'
      +(scelto?'<span class="aic-pill aic-pill--ok">Scelto: '+esc(scelto.nome||s.scelta_nome||"")+'</span>':'<span class="aic-pill aic-pill--attesa">Da scegliere</span>')
      +'</div>'
      +'<ul class="aic-sc-ops">'+ops.map(function(o,k){
          return '<li'+(s.scelta===k?' class="on"':'')+'>'+(o.foto?'<span class="aic-sc-foto" data-path="'+esc(o.foto)+'"></span>':'')
            +'<span>'+esc(o.nome||"")+'</span>'+(o.prezzo?'<small>'+esc(o.prezzo)+'</small>':'')+'</li>';
        }).join("")+'</ul>'
      +(s.nota_cliente?'<div class="aic-sc-nota">Il cliente ha scritto: «'+esc(s.nota_cliente)+'»</div>':'')
      +'<div class="aic-fila"><button type="button" class="aic-btn" data-action="sc-modifica" data-id="'+esc(s.id)+'">Modifica</button>'
      +'<button type="button" class="aic-link aic-link--del" data-action="sc-elimina" data-id="'+esc(s.id)+'">Elimina</button></div>'
      +'</div>';
  }).join("");

  openSheetGrande("Scelte del cliente",
    '<div class="sh-cols"><div class="sh-col">'
    +'<div class="sh-b"><div class="sh-tit">'+esc(l.descrizione||"Lavoro")+'</div>'+stato
    +(_scRighe.length?'<div class="aic-fila" style="margin-top:12px">'
      +'<button type="button" class="aic-btn aic-btn--pieno" data-action="sc-wa">'+_AIC_SVG.wa+'<span>Manda il link su WhatsApp</span></button>'
      +'<button type="button" class="aic-btn" data-action="sc-copia">'+_AIC_SVG.copia+'<span>Copia il link</span></button>'
      +'</div>':'')
    +'</div>'
    +'<div class="sh-b"><button type="button" class="aic-btn aic-btn--pieno" data-action="sc-nuova">+ Aggiungi una cosa da scegliere</button></div>'
    +'</div><div class="sh-col">'
    +'<div class="sh-b"><div class="sh-tit">Da scegliere ('+_scRighe.length+')</div>'
    +(carte||'<div class="campo-aiuto" style="margin-top:0">Ancora niente. Esempi: «Piastrelle del bagno», «Sanitari», «Colore delle pareti», «Porte interne».</div>')
    +'</div>'
    +'</div></div>',
    '<button class="btn b-cancel" data-action="close">Chiudi</button>');
  scFotoMiniature();
}

async function scFotoMiniature(){
  const els=[...document.querySelectorAll(".aic-sc-foto[data-path]")];
  if(!els.length)return;
  const paths=els.map(e=>e.dataset.path);
  try{
    const {data}=await sb.storage.from("gestionale-foto").createSignedUrls(paths,3600);
    (data||[]).forEach(function(d,i){if(d&&d.signedUrl&&els[i])els[i].style.backgroundImage="url('"+d.signedUrl+"')";});
  }catch(e){}
}

/* il modulo di UNA cosa da scegliere, con le sue possibilita' */
let _scOpz=[];
function scForm(s){
  s=s||{};
  _scOpz=(Array.isArray(s.opzioni)&&s.opzioni.length?s.opzioni:[{nome:"",prezzo:""},{nome:"",prezzo:""}]).map(o=>Object.assign({},o));
  openSheetGrande(s.id?"Modifica la scelta":"Nuova cosa da scegliere",
    '<div class="sh-cols"><div class="sh-col">'
    +'<div class="sh-b"><div class="sh-tit">Cosa deve scegliere</div>'
    +'<div class="field"><label for="sc-tit">Nome</label><input id="sc-tit" value="'+esc(s.titolo||"")+'" placeholder="Es. Piastrelle del bagno"></div>'
    +(s.scelta!==null&&s.scelta!==undefined?'<div class="campo-aiuto" style="color:var(--attesa)">Il cliente aveva già scelto: se cambi le possibilità, la sua scelta si azzera e deve rifarla.</div>':'')
    +'</div>'
    +'</div><div class="sh-col">'
    +'<div class="sh-b"><div class="sh-tit">Le possibilità</div>'
    +'<div class="campo-aiuto" style="margin-top:0">Almeno due. Nel prezzo scrivi quello che capisce il cliente: «compreso», «+ 12 €/mq», «+ 180 €».</div>'
    +'<div id="sc-opz"></div>'
    +'<button type="button" class="aic-btn" data-action="sc-opz-add" style="margin-top:10px">+ Un\'altra possibilità</button>'
    +'</div>'
    +'</div></div>',
    '<button class="btn b-cancel" data-action="sc-indietro">Indietro</button>'
    +'<button class="btn-primary b-save" data-action="sc-salva" data-id="'+esc(s.id||"")+'">'+(s.id?"Salva":"Aggiungi")+'</button>');
  scOpzDisegna();
}
function scOpzLeggi(){
  document.querySelectorAll("#sc-opz .aic-opz").forEach(function(r,i){
    if(!_scOpz[i])return;
    _scOpz[i].nome=(r.querySelector(".sc-o-nome")||{}).value||"";
    _scOpz[i].prezzo=(r.querySelector(".sc-o-prezzo")||{}).value||"";
  });
}
function scOpzDisegna(){
  const box=document.getElementById("sc-opz");if(!box)return;
  box.innerHTML=_scOpz.map(function(o,i){
    return '<div class="aic-opz">'
      +'<label class="aic-opz-foto" title="Foto (facoltativa)">'
      +  (o._anteprima||o.foto?'<span class="aic-sc-foto" '+(o._anteprima?'style="background-image:url(\''+o._anteprima+'\')"':'data-path="'+esc(o.foto)+'"')+'></span>':_AIC_SVG.cam)
      +  '<input type="file" accept="image/*" hidden data-i="'+i+'" class="sc-o-file"></label>'
      +'<div class="aic-opz-campi">'
      +  '<input class="sc-o-nome" value="'+esc(o.nome||"")+'" placeholder="Possibilità '+(i+1)+' — es. Gres effetto legno 20x120">'
      +  '<input class="sc-o-prezzo" value="'+esc(o.prezzo||"")+'" placeholder="Prezzo — es. compreso, + 12 €/mq">'
      +'</div>'
      +(_scOpz.length>2?'<button type="button" class="aic-link aic-link--del" data-action="sc-opz-del" data-i="'+i+'" title="Togli">✕</button>':'')
      +'</div>';
  }).join("");
  box.querySelectorAll(".sc-o-file").forEach(function(inp){
    inp.onchange=function(){
      const f=inp.files&&inp.files[0];if(!f)return;
      scOpzLeggi();
      const i=+inp.dataset.i;
      _scOpz[i]._file=f;
      try{_scOpz[i]._anteprima=URL.createObjectURL(f);}catch(e){}
      scOpzDisegna();
    };
  });
  const els=[...box.querySelectorAll(".aic-sc-foto[data-path]")];
  if(els.length)sb.storage.from("gestionale-foto").createSignedUrls(els.map(e=>e.dataset.path),3600).then(function(r){
    ((r&&r.data)||[]).forEach(function(d,i){if(d&&d.signedUrl&&els[i])els[i].style.backgroundImage="url('"+d.signedUrl+"')";});
  }).catch(function(){});
}

async function scSalva(id){
  scOpzLeggi();
  const titolo=((document.getElementById("sc-tit")||{}).value||"").trim();
  if(!titolo){toast("Scrivi cosa deve scegliere, per esempio «Piastrelle del bagno»");document.getElementById("sc-tit").focus();return;}
  const piene=_scOpz.filter(o=>String(o.nome||"").trim());
  if(piene.length<2){toast("Servono almeno due possibilità con il nome");return;}
  const b=document.querySelector('[data-action="sc-salva"]');if(b){b.disabled=true;b.textContent="Salvo…";}
  /* le foto: prima si caricano, poi si salva la riga col loro percorso */
  const opz=[];
  for(const o of piene){
    let foto=o.foto||null;
    if(o._file){
      const p=typeof preparaFileUpload==="function"?await preparaFileUpload(o._file):{file:o._file,nome:o._file.name};
      if(!p.errore){
        const path=sbUid+"/scelte/"+_scLav.id+"/"+Date.now()+"_"+String(p.nome||"foto.jpg").replace(/[^a-zA-Z0-9._-]/g,"_");
        const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
        if(!up)foto=path;
      }
    }
    opz.push({nome:String(o.nome).trim().slice(0,160),prezzo:String(o.prezzo||"").trim().slice(0,60),foto:foto});
  }
  const vecchia=id?_scRighe.find(x=>String(x.id)===String(id)):null;
  const riga={titolo:titolo.slice(0,120),opzioni:opz};
  /* se le possibilita' cambiano, la scelta vecchia non vale piu' */
  if(vecchia&&JSON.stringify((vecchia.opzioni||[]).map(o=>[o.nome,o.prezzo]))!==JSON.stringify(opz.map(o=>[o.nome,o.prezzo]))){
    riga.scelta=null;riga.scelta_nome=null;riga.scelto_il=null;
  }
  const res=id
    ?await sb.from("gest_scelte").update(riga).eq("id",id).eq("user_id",sbUid).select("id")
    :await sb.from("gest_scelte").insert(Object.assign({},riga,{user_id:sbUid,mestiere_id:curMestiere(),lavoro_id:_scLav.id,ordine:_scRighe.length})).select("id");
  if(b){b.disabled=false;b.textContent=id?"Salva":"Aggiungi";}
  if(res.error){toast("Non salvata: "+res.error.message);return;}
  if(!res.data||!res.data.length){toast("Non salvata: nessuna riga modificata. Riprova.");return;}
  toast(id?"Aggiornata ✔":"Aggiunta ✔");
  scApri(_scLav.id);
}

async function scElimina(id){
  const s=_scRighe.find(x=>String(x.id)===String(id));
  if(!gconfirm("Eliminare «"+((s&&s.titolo)||"questa scelta")+"»? Il cliente non la vedrà più."))return;
  const {data,error}=await sb.from("gest_scelte").delete().eq("id",id).eq("user_id",sbUid).select("id");
  if(error){toast("Errore: "+error.message);return;}
  if(!data||!data.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}
  toast("Eliminata");scApri(_scLav.id);
}

/* il link segreto: si crea la prima volta che serve, poi e' sempre quello */
async function scLinkUrl(){
  if(!_scLink){
    const a=new Uint8Array(18);crypto.getRandomValues(a);
    const token=Array.from(a,x=>"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x%57]).join("");
    const {data,error}=await sb.from("gest_scelte_link").insert({user_id:sbUid,lavoro_id:_scLav.id,token:token}).select("*");
    if(error||!data||!data.length){toast("Non riesco a creare il link: "+((error&&error.message)||"riprova"));return null;}
    _scLink=data[0];
  }
  return location.origin+"/scelte?t="+encodeURIComponent(_scLink.token);
}
async function scWhatsApp(){
  const url=await scLinkUrl();if(!url)return;
  let tel="";
  if(_scLav.cliente_id){
    const c=(typeof cliCache!=="undefined"?cliCache:[]).find(x=>String(x.id)===String(_scLav.cliente_id));
    tel=typeof waCleanTel==="function"?waCleanTel(c&&c.telefono):"";
  }
  const nomeAz=((_rcAz&&_rcAz.nome)||"");
  const t="Buongiorno, per il lavoro «"+(_scLav.descrizione||"")+"» ci sono da scegliere alcune cose (materiali e finiture). "
    +"Le trova tutte qui, con le foto e i prezzi: scelga con calma e alla fine prema «Confermo».\n"+url
    +(nomeAz?"\n\n"+nomeAz:"");
  window.open(tel?("https://wa.me/"+tel+"?text="+encodeURIComponent(t)):("https://wa.me/?text="+encodeURIComponent(t)),"_blank","noopener");
  setTimeout(function(){scApri(_scLav.id);},400);
}
async function scRiapri(){
  if(!_scLink)return;
  if(!gconfirm("Riaprire le scelte? Il cliente potrà cambiarle e dovrà confermarle di nuovo."))return;
  const {data,error}=await sb.from("gest_scelte_link").update({confermato_il:null}).eq("lavoro_id",_scLav.id).eq("user_id",sbUid).select("lavoro_id");
  if(error||!data||!data.length){toast("Non riaperte: "+((error&&error.message)||"riprova"));return;}
  toast("Riaperte ✔");scApri(_scLav.id);
}

/* =====================================================================
   GLI ASCOLTATORI — uno solo per tutto il file
   ===================================================================== */
document.addEventListener("click",function(e){
  const t=e.target.closest&&e.target.closest("[data-action]");if(!t)return;
  const a=t.dataset.action;
  if(a==="ff-foto-addforn"){ffFotoAggiungiForn(t);return;}
  if(a==="res-cliente"){rcApri(t.dataset.id);return;}
  if(a==="rc-periodo"){
    _rcGiorni=+t.dataset.v||0;
    document.querySelectorAll('#rc-periodo button').forEach(b=>b.classList.toggle("on",b===t));
    rcCaricaFatti();return;
  }
  if(a==="rc-wa"){rcWhatsApp();return;}
  if(a==="rc-copia"){const x=rcTestoFinale();if(!x){toast("Il messaggio è vuoto");return;}_aicCopia(x);return;}
  if(a==="scelte-cliente"){scApri(t.dataset.id);return;}
  if(a==="sc-nuova"){scForm(null);return;}
  if(a==="sc-modifica"){scForm(_scRighe.find(x=>String(x.id)===String(t.dataset.id)));return;}
  if(a==="sc-elimina"){scElimina(t.dataset.id);return;}
  if(a==="sc-indietro"){scApri(_scLav&&_scLav.id);return;}
  if(a==="sc-opz-add"){scOpzLeggi();_scOpz.push({nome:"",prezzo:""});scOpzDisegna();return;}
  if(a==="sc-opz-del"){scOpzLeggi();_scOpz.splice(+t.dataset.i,1);scOpzDisegna();return;}
  if(a==="sc-salva"){scSalva(t.dataset.id);return;}
  if(a==="sc-wa"){scWhatsApp();return;}
  if(a==="sc-copia"){scLinkUrl().then(u=>{if(u){_aicCopia(u);setTimeout(()=>scApri(_scLav.id),300);}});return;}
  if(a==="sc-riapri"){scRiapri();return;}
});
