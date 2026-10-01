// [SPOSTATO] op-rapido-voce.js: era dentro op-core.js, righe 854-1422, spostato identico.
/* ===================================================================
   + RAPIDO — 15 agosto 2026
   Tre tocchi: cosa, quale lavoro, conferma. Niente AI, niente crediti,
   e funziona anche con poco campo: sono tre scritture normali.
   ⚠️ Le ore NON prendono una strada nuova: creano un rapportino con dentro
   solo chi lo scrive. Cosi' resta un posto solo da cui passano le ore, e il
   margine del lavoro le vede come tutte le altre.
   =================================================================== */
const RV={passo:0,tipo:null,lavoro:null,ore:8,testo:"",importo:"",
          /* la voce: quello che ha detto, quello che l'AI ha capito,
             le ore per persona e i nomi che ho buttato via */
          detto:"",capito:null,vOre:{},vScarti:[]};
const RV_TIPI=[
  {k:"voce",      lab:"🎙 Racconta la giornata",
                                   sub:"Parla e basta: ore, materiali e spese insieme", perm:"rapportini"},
  {k:"ore",       lab:"Ore",       sub:null,                                       perm:"rapportini"},
  /* ⚠️ 5 set 2026: le sub di «Materiale» e «Spesa» le decide il mestiere, e si
     leggono al momento di disegnare (il ruolo si sa solo dopo il database). */
  {k:"materiale", lab:"Materiale", sub:null,                                       perm:"rapportini"},
  {k:"nota",      lab:"Nota",      sub:"Un appunto sulla giornata",                perm:"rapportini"},
  {k:"spesa",     lab:"Spesa",     sub:null,                                       perm:"pagamenti"}
];
function _rvSub(t){
  if(t.k==="ore")return _p('subOre');
  if(t.k==="materiale")return _p('subMateriale');
  if(t.k==="spesa")return _p('subSpesa');
  return t.sub;
}

function rvChiudi(){ $("#rv-ov").classList.add("hidden"); RV.passo=0; }
function rvApri(){
  RV.passo=1; RV.tipo=null; RV.lavoro=null; RV.ore=8; RV.testo=""; RV.importo=""; RV.autoLavoro=false;
  RV.detto=""; RV.capito=null; RV.vOre={}; RV.vScarti=[];
  $("#rv-ov").classList.remove("hidden");
  rvDisegna();
}
/* i lavori piu' recenti, i finiti in fondo: in cantiere si segna quasi sempre
   su quello di oggi o di ieri */
function rvLavori(){
  return (LAVORI||[]).slice()
    .sort((a,b)=>{
      const fa=(a.stato==="fatto")?1:0, fb=(b.stato==="fatto")?1:0;
      if(fa!==fb)return fa-fb;
      return String(b.data_prevista||"").localeCompare(String(a.data_prevista||""));
    })
    .slice(0,8);
}
/* ============================================================
   ⛔ 5 SETTEMBRE 2026 — IL LAVORO DI OGGI IN CIMA, E GIA' SCELTO
   ============================================================
   La scelta del lavoro era una lista sola: con →3← lavori va bene, con →40←
   diventa un elenco da scorrere col guanto. Fluida il cantiere lo indovina col
   GPS; noi non abbiamo il GPS, ma sappiamo una cosa che basta quasi sempre:
   QUALE LAVORO E' SEGNATO PER OGGI.
   Deciso da Alessio il 5 settembre: «oggi in cima e preselezionato».
     · un solo lavoro oggi  -> e' gia' scelto, un tocco in meno
     · piu' d'uno           -> quelli di oggi in cima, sotto il titolino «Oggi»
     · nessuno              -> la lista di prima, tale e quale
   ⚠️ Preselezionato NON vuol dire obbligato: dal passo dopo si torna
   indietro con la freccia e si sceglie un altro lavoro, come prima.
   ============================================================ */
function rvLavoriOggi(){
  const oggi=ymd(new Date());
  return (LAVORI||[]).filter(l=>l.data_prevista===oggi && l.stato!=="fatto");
}
function rvUnicoDiOggi(){
  const o=rvLavoriOggi();
  return (o.length===1)?o[0]:null;
}
function rvNomeLavoro(l){
  const c=CLIENTI[l.cliente_id];
  return (c&&c.nome) || (l.descrizione?l.descrizione.slice(0,40):"Lavoro senza nome");
}
function rvDisegna(){
  const corpo=$("#rv-corpo"), tit=$("#rv-tit"), back=$("#rv-indietro");
  back.classList.toggle("hidden", RV.passo<=1);

  if(RV.passo===1){
    tit.textContent="Cosa vuoi segnare?";
    const usabili=RV_TIPI.filter(t=>puo(t.perm));
    if(!usabili.length){
      corpo.innerHTML='<div class="rv-nota">Il capo non ti ha dato nessun permesso per segnare le cose da qui. Servono «Rapportini» oppure «Pagamenti».</div>';
      return;
    }
    corpo.innerHTML=usabili.map(t=>'<button type="button" class="rv-scelta" data-tipo="'+t.k+'">'+esc(t.lab)+'<small>'+esc(_rvSub(t))+'</small></button>').join("");
    return;
  }

  if(RV.passo===2){
    tit.textContent="Su quale lavoro?";
    const lv=rvLavori();
    if(!lv.length){
      corpo.innerHTML='<div class="rv-nota">'+esc(_p('nessunLavoro'))+'</div>';
      return;
    }
    const bottone=function(l){
      const dove=l.dove?" — "+l.dove:"";
      return '<button type="button" class="rv-scelta" data-lav="'+esc(l.id)+'">'+esc(rvNomeLavoro(l))
        +'<small>'+esc((l.data_prevista?dataIt(l.data_prevista):"senza data")+dove)+'</small></button>';
    };
    /* 5 set 2026 — quelli di oggi in cima, con il loro titolino. Gli altri
       restano sotto nell'ordine di prima: nessun lavoro sparisce. */
    const oggi=rvLavoriOggi();
    const idOggi={}; oggi.forEach(l=>{idOggi[String(l.id)]=1;});
    const altri=lv.filter(l=>!idOggi[String(l.id)]);
    corpo.innerHTML=(oggi.length
        ? '<div class="rv-gruppo">Oggi</div>'+oggi.map(bottone).join("")
          +(altri.length?'<div class="rv-gruppo">Gli altri</div>':"")
        : "")
      +altri.map(bottone).join("");
    return;
  }

  /* passo 3: la conferma, diversa per ogni cosa */
  const nome=RV.lavoro?rvNomeLavoro(RV.lavoro):"";

  /* passo 4: quello che l'AI ha capito, da controllare prima di salvare */
  if(RV.passo===4){ voceDisegnaControllo(nome); return; }

  if(RV.tipo==="voce"){
    tit.textContent="Racconta la giornata";
    corpo.innerHTML='<div class="rv-nota">'+esc(nome)+' · oggi</div>'
      /* il testo si ritrova tornando indietro: chi ha appena dettato tre righe
         in piedi su un ponteggio non le ridetta perche' ha premuto la freccia */
      +'<textarea class="rv-in" id="rv-detto" rows="5" placeholder="'+esc(_p('esDettato'))+'">'+esc(RV.detto||"")+'</textarea>'
      +'<div class="rv-mic">🎙 <b>Non scrivere: parla.</b> Tocca qui sopra, poi sulla tastiera del telefono tieni premuto il tasto del <b>microfono</b> e racconta com’è andata. Le parole compaiono da sole.</div>'
      +'<button type="button" class="rv-ok" id="rv-pensa">Fammi vedere cosa hai capito</button>'
      +'<div class="rv-nota">Costa 1 credito AI dell’impresa. Dopo puoi correggere tutto: niente viene salvato finché non confermi tu.</div>';
    return;
  }

  if(RV.tipo==="ore"){
    tit.textContent="Quante ore?";
    corpo.innerHTML='<div class="rv-nota">'+esc(nome)+' · oggi</div>'
      +'<div class="rv-riga"><button type="button" class="rv-pm" data-d="-0.5" aria-label="Togli mezz\u2019ora">\u2212</button>'
      +'<div class="rv-num" id="rv-ore">'+String(RV.ore).replace(".",",")+'</div>'
      +'<button type="button" class="rv-pm" data-d="0.5" aria-label="Aggiungi mezz\u2019ora">+</button></div>'
      +'<button type="button" class="rv-ok" id="rv-ok">Conferma</button>'
      +'<div class="rv-nota">Sono le TUE ore. Per quelle di tutta la squadra c\u2019\u00e8 il rapportino, dentro il lavoro.</div>';
    return;
  }
  if(RV.tipo==="materiale"||RV.tipo==="nota"){
    const m=RV.tipo==="materiale";
    tit.textContent=m?(_p('cosaUsato')+"?"):"Cosa scrivi?";
    corpo.innerHTML='<div class="rv-nota">'+esc(nome)+' \u00b7 oggi</div>'
      +'<textarea class="rv-in" id="rv-testo" rows="3" placeholder="'+esc(m?_p('esUsatoCorto'):"Es. pioggia, fermi due ore")+'"></textarea>'
      +'<button type="button" class="rv-ok" id="rv-ok">Conferma</button>'
      +(m?'<div class="rv-nota">Scrivi le cose, non i prezzi: quelli stanno nelle spese, se no vengono contati due volte.</div>':'');
    return;
  }
  if(RV.tipo==="spesa"){
    tit.textContent="Quanto hai speso?";
    corpo.innerHTML='<div class="rv-nota">'+esc(nome)+' \u00b7 oggi</div>'
      +'<input class="rv-in" id="rv-imp" type="text" inputmode="decimal" placeholder="Importo (es. 24,50)" data-euro>'
      +'<input class="rv-in" id="rv-testo" type="text" placeholder="Per cosa? (es. viti e tasselli)">'
      +'<button type="button" class="rv-ok" id="rv-ok">Conferma</button>'
      +'<div class="rv-nota">Questi soldi entrano nel conto di questo cantiere. La carta aziendale \u00e8 un\u2019altra cosa e resta dov\u2019\u00e8.</div>';
    return;
  }
}
/* un ascolto solo sul contenitore: il contenuto viene rifatto a ogni passo */
$("#rv-corpo").addEventListener("click",async e=>{
  const t=e.target.closest("[data-tipo]");
  if(t){
    RV.tipo=t.dataset.tipo;
    /* 5 set 2026 — un solo lavoro segnato per oggi: e' gia' scelto, si salta
       la schermata della lista. Con la freccia «‹» si torna alla lista e si
       cambia, quindi non si resta chiusi dentro una scelta sbagliata. */
    const solo=rvUnicoDiOggi();
    if(solo){ RV.lavoro=solo; RV.passo=3; RV.autoLavoro=true; }
    else { RV.lavoro=null; RV.passo=2; RV.autoLavoro=false; }
    rvDisegna(); return;
  }
  const l=e.target.closest("[data-lav]");
  if(l){ RV.lavoro=(LAVORI||[]).find(x=>String(x.id)===String(l.dataset.lav))||null; RV.passo=3; RV.autoLavoro=false; rvDisegna(); return; }
  const pm=e.target.closest(".rv-pm");
  if(pm){
    let v=(+RV.ore||0)+(parseFloat(pm.dataset.d)||0);
    if(v<0.5)v=0.5; if(v>24)v=24;
    RV.ore=Math.round(v*2)/2;
    const c=$("#rv-ore"); if(c)c.textContent=String(RV.ore).replace(".",",");
    return;
  }
  /* le ore della schermata di controllo: stessi pulsanti del rapportino grande */
  const vp=e.target.closest(".rap-pm");
  if(vp){
    const riga=vp.closest(".rap-riga"); if(!riga)return;
    const op=riga.dataset.op;
    let v=(+RV.vOre[op]||0)+(parseFloat(vp.dataset.d)||0);
    if(v<0)v=0; if(v>24)v=24;
    RV.vOre[op]=Math.round(v*2)/2;
    const cella=document.getElementById("vore-"+op);
    if(cella){
      cella.textContent=(RV.vOre[op]===0)?"0":String(RV.vOre[op]).replace(".",",");
      cella.classList.toggle("zero",RV.vOre[op]===0);
    }
    return;
  }
  if(e.target.closest("#rv-pensa")){ await vocePensa(); return; }
  if(e.target.closest("#rv-salva-voce")){ await voceSalva(); return; }
  if(e.target.closest("#rv-ok")) await rvSalva();
});
$("#btn-rapido").onclick=rvApri;
$("#rv-x").onclick=rvChiudi;
$("#rv-indietro").onclick=()=>{
  /* ⚠️ 5 set 2026: quando il lavoro e' stato scelto DA SOLO, il passo →2←
     non e' mai stato disegnato — ma tornando indietro ci si deve arrivare
     lo stesso, se no dal passo →3← si finirebbe dritti al passo →1← e non
     si potrebbe cambiare cantiere. */
  RV.passo=Math.max(1,RV.passo-1);
  if(RV.autoLavoro){ RV.autoLavoro=false; }
  rvDisegna();
};
$("#rv-ov").onclick=e=>{ if(e.target===$("#rv-ov"))rvChiudi(); };

/* ===================================================================
   LA VOCE — 15 agosto 2026
   L'operaio detta con il microfono della sua tastiera, il server capisce,
   e QUI si controlla riga per riga prima di far vedere qualcosa.

   ⚠️ QUELLO CHE TIENE NON E' IL PROMPT, E' QUESTO FILTRO.
   Al server e' scritto "non inventare nomi". Ma un prompt e' un desiderio,
   non una garanzia: prima o poi un modello ci mette dentro un Marco che non
   c'e'. Un'ora sulla persona sbagliata e' una busta paga sbagliata, e salta
   fuori a fine mese quando nessuno si ricorda piu' niente.
   Quindi: i nomi che non sono nella squadra di questo lavoro NON entrano, e
   quelli buttati via si vedono scritti, non spariscono in silenzio.
   =================================================================== */

/* la gente di questo lavoro: la stessa regola del rapportino grande */
function voceGente(){
  const mid=RV.lavoro&&RV.lavoro.mestiere_id;
  return (SQUADRA||[]).filter(p=>!mid||!p.mestiere_id||String(p.mestiere_id)===String(mid));
}

/* due nomi sono la stessa persona? Il parlato non ha accenti ne' maiuscole:
   "DE LUCA", "de luca" e "De Lucà" devono cadere sulla stessa riga. */
function voceStessoNome(a,b){
  /* \u0300-\u036f sono gli accenti staccati da normalize("NFD"). Scritti con
     il codice e non con il carattere vero: un accento invisibile dentro una
     regola e' il tipo di riga che si rompe al primo salvataggio storto. */
  const p=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
              .replace(/[^a-z0-9]+/g," ").trim();
  return p(a)!==""&&p(a)===p(b);
}

async function vocePensa(){
  const b=$("#rv-pensa");
  const detto=(($("#rv-detto")||{}).value||"").trim();
  RV.detto=detto;
  if(detto.length<10){toast("Racconta qualcosa di piu’: almeno una frase intera.");return;}
  if(detto.length>4000){toast("Troppo lungo. Racconta la giornata, non il mese.");return;}
  if(!RV.lavoro){toast("Scegli il lavoro");return;}
  if(!chiedoPermesso("rapportini","di scrivere il rapportino"))return;

  if(SQUADRA===null)await caricaSquadra();
  const gente=voceGente();
  if(!gente.length){toast("Non riesco a leggere la squadra di questo lavoro. Segna a mano con «Ore».");return;}

  if(b){b.disabled=true;b.textContent="Sto ascoltando…";}
  const rimetti=()=>{const x=$("#rv-pensa"); if(x){x.disabled=false;x.textContent="Fammi vedere cosa hai capito";}};

  let sess=null;
  try{ sess=(await sb.auth.getSession()).data.session; }catch(_){}
  const token=sess&&sess.access_token;
  if(!token){rimetti();toast("Sessione scaduta: esci e rientra.");return;}

  /* la lista vera va DENTRO il messaggio: il server non sa chi c'e' in
     squadra, e senza lista i nomi se li inventerebbe per forza */
  const messaggio="SQUADRA: "+gente.map(p=>p.nome).join("; ")
    +"\nIO SONO: "+(MIO.nome||"")
    +"\nDETTO: "+detto;

  let risp=null;
  try{
    const r=await fetch(SUPA_URL+"/functions/v1/ai-generate",{
      method:"POST",
      headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
      body:JSON.stringify({feature:"dati_rapportino",input:messaggio})
    });
    risp=await r.json();
    if(!r.ok){
      rimetti();
      /* 402 = crediti. Da oggi sono quelli dell'IMPRESA, non suoi: il
         messaggio deve mandarlo dal capo, non farlo sentire in difetto. */
      if(r.status===402){
        toast(risp&&risp.reason==="plan_without_ai"
          ? "L’impresa non ha le funzioni AI. Segna a mano con «Ore»."
          : "L’impresa ha finito i crediti AI del mese. Dillo al capo, intanto segna a mano.");
      }else if(r.status===400&&/non riconosciuta/i.test((risp&&risp.error)||"")){
        /* l'app e' piu' avanti del server: succede se il telefono ha gia' la
           pagina nuova e la funzione online e' ancora quella vecchia. Dirlo
           in modo che si capisca, invece di sputare l'errore del server. */
        toast("Questa cosa non è ancora accesa sul server. Segna a mano con «Ore», e dillo al capo.");
      }else{
        toast((risp&&risp.error)||"Il servizio non ha risposto. Riprova, oppure segna a mano.");
      }
      return;
    }
  }catch(err){
    rimetti();
    toast("Niente rete. Segna a mano con «Ore»: quello funziona anche senza campo.");
    return;
  }

  const pulito=voceRipulisci(risp&&risp.result, gente);
  if(!pulito){
    rimetti();
    toast("Non ho capito quello che hai detto. Riprova con parole piu’ semplici, o segna a mano.");
    return;
  }
  RV.capito=pulito;
  RV.vOre={};
  gente.forEach(p=>{RV.vOre[p.id]=0;});
  pulito.ore.forEach(o=>{RV.vOre[o.id]=o.ore;});
  RV.vScarti=pulito.scarti;
  RV.passo=4;
  rvDisegna();
}

/* Prende quello che ha detto il server e lo riduce a cose vere.
   Torna null se non c'e' niente di leggibile. */
function voceRipulisci(grezzo, gente){
  let j=null;
  try{ j=JSON.parse(String(grezzo||"")); }catch(_){ return null; }
  if(!j||typeof j!=="object")return null;

  const ore=[], scarti=[];
  if(Array.isArray(j.ore)){
    j.ore.forEach(r=>{
      if(!r||typeof r!=="object")return;
      const p=gente.find(g=>voceStessoNome(g.nome,r.nome));
      if(!p){
        const n=String(r.nome||"").trim();
        if(n&&scarti.indexOf(n)<0)scarti.push(n);
        return;
      }
      let v=Number(r.ore);
      if(!isFinite(v)||v<=0)return;
      if(v>24)v=24;                       /* in un giorno non ce ne stanno di piu' */
      v=Math.round(v*2)/2;                /* mezz'ora e' il passo dei pulsanti */
      const gia=ore.find(x=>x.id===p.id); /* nominato due volte: si somma, non si raddoppia */
      if(gia){ gia.ore=Math.min(24,Math.round((gia.ore+v)*2)/2); }
      else   { ore.push({id:p.id,nome:p.nome,ore:v}); }
    });
  }

  const testo=(v,max)=>String(v==null?"":v).replace(/\s+/g," ").trim().slice(0,max);
  const materiali=testo(j.materiali,600);
  const note=testo(j.note,1000);

  let spesaImp=null, spesaDes="";
  if(j.spesa&&typeof j.spesa==="object"){
    const n=(typeof j.spesa.importo==="string")?_numIt(j.spesa.importo):Number(j.spesa.importo);
    if(isFinite(n)&&n>0&&n<=1000000){
      spesaImp=Math.round(n*100)/100;
      spesaDes=testo(j.spesa.descrizione,200);
    }
  }

  if(!ore.length&&!materiali&&!note&&spesaImp===null)return null;
  return {ore:ore,materiali:materiali,note:note,spesaImp:spesaImp,spesaDes:spesaDes,scarti:scarti};
}

function voceDisegnaControllo(nomeLavoro){
  const corpo=$("#rv-corpo"), tit=$("#rv-tit");
  tit.textContent="Controlla, poi salva";
  const c=RV.capito||{ore:[],materiali:"",note:"",spesaImp:null,spesaDes:"",scarti:[]};
  const gente=voceGente();
  const puoSpesa=puo("pagamenti");

  let h='<div class="rv-nota">'+esc(nomeLavoro)+' · oggi</div>';

  if(c.scarti&&c.scarti.length){
    h+='<div class="rv-scarti"><b>Non ho messo le ore di: '+esc(c.scarti.join(", "))+'.</b><br>'
      +'Queste persone non sono nella squadra di questo lavoro. Se ci hanno lavorato davvero, dillo al capo: le ore le mette lui.</div>';
  }

  h+='<div class="rv-sez">Ore</div>';
  if(!gente.length){
    h+='<div class="rv-vuoto">Squadra non leggibile.</div>';
  }else{
    h+=gente.map(p=>{
      const v=+RV.vOre[p.id]||0;
      return '<div class="rap-riga" data-op="'+esc(p.id)+'">'
        +'<div class="rap-nome">'+esc(p.nome||"Senza nome")+'</div>'
        +'<button type="button" class="rap-pm" data-d="-0.5" aria-label="Togli mezz’ora a '+esc(p.nome||"")+'">−</button>'
        +'<div class="rap-ore'+(v===0?" zero":"")+'" id="vore-'+esc(p.id)+'">'+(v===0?"0":String(v).replace(".",","))+'</div>'
        +'<button type="button" class="rap-pm" data-d="0.5" aria-label="Aggiungi mezz’ora a '+esc(p.nome||"")+'">+</button>'
        +'</div>';
    }).join("");
  }

  h+='<div class="rv-sez">Materiali</div>'
    +'<textarea class="rv-in" id="rv-v-mat" rows="2" placeholder="Vuoto: non hai parlato di materiali">'+esc(c.materiali)+'</textarea>'
    +'<div class="rv-sez">Note</div>'
    +'<textarea class="rv-in" id="rv-v-note" rows="3" placeholder="Vuoto: non c’era niente da segnare">'+esc(c.note)+'</textarea>';

  if(puoSpesa){
    h+='<div class="rv-sez">Spesa</div>'
      +'<input class="rv-in" id="rv-v-imp" type="text" inputmode="decimal" placeholder="Importo (es. 24,50)" value="'
        +esc(c.spesaImp===null?"":String(c.spesaImp).replace(".",","))+'" data-euro>'
      +'<input class="rv-in" id="rv-v-des" type="text" placeholder="Per cosa?" value="'+esc(c.spesaDes)+'">';
  }else if(c.spesaImp!==null){
    /* ha parlato di soldi ma non ha il permesso: dirglielo, non ingoiarlo */
    h+='<div class="rv-sez">Spesa</div>'
      +'<div class="rv-scarti">Hai parlato di una spesa di '+esc(String(c.spesaImp).replace(".",","))
      +' €, ma il capo non ti ha dato il permesso «Pagamenti»: non la salvo. Diglielo tu.</div>';
  }

  h+='<button type="button" class="rv-ok" id="rv-salva-voce">Salva tutto</button>'
    +'<div class="rv-nota">Fino a qui non è stato salvato niente. Il credito AI è già stato usato per capire quello che hai detto.</div>';

  corpo.innerHTML=h;
}

async function voceSalva(){
  if(!RV.lavoro){toast("Scegli il lavoro");return;}
  if(!chiedoPermesso("rapportini","di scrivere il rapportino"))return;
  const b=$("#rv-salva-voce");
  const rimetti=()=>{const x=$("#rv-salva-voce"); if(x){x.disabled=false;x.textContent="Salva tutto";}};
  if(b){b.disabled=true;b.textContent="Salvo…";}

  const materiali=(($("#rv-v-mat")||{}).value||"").trim();
  const note=(($("#rv-v-note")||{}).value||"").trim();
  const righe=Object.keys(RV.vOre).filter(k=>(+RV.vOre[k])>0).map(k=>({op:k,ore:+RV.vOre[k]}));

  /* la spesa passa da due porte, non da una: le caselle non ci sono nemmeno
     se manca il permesso, e comunque qui si ricontrolla. Nascondere un
     pulsante non e' una difesa: una pagina rimasta aperta da prima, o un
     permesso tolto nel frattempo, e la casella e' ancora li'. */
  const puoSpesa=puo("pagamenti");
  const imp=puoSpesa?_numIt((($("#rv-v-imp")||{}).value||"")):null;
  const des=puoSpesa?(($("#rv-v-des")||{}).value||"").trim():"";
  const vuoleSpesa=puo("pagamenti")&&puoSpesa&&imp!==null&&imp>0;
  if(vuoleSpesa&&imp>1000000){rimetti();toast("Importo troppo alto: controlla quello che hai scritto.");return;}
  if(vuoleSpesa&&!des){rimetti();toast("Scrivi per cosa hai speso.");return;}

  if(!righe.length&&!materiali&&!note&&!vuoleSpesa){
    rimetti();toast("Non c’è niente da salvare: metti almeno le ore di qualcuno.");return;
  }

  /* un rapportino solo, come quello grande: le ore ci si appendono sotto */
  const rid=await rvNuovoRapportino({materiali:materiali||null,note:note||null});
  if(!rid){rimetti();return;}

  const oggi=ymd(new Date());
  let oreScritte=0, oreFallite=[];
  for(const r of righe){
    const {data,error}=await sb.from("gest_ore").insert({
      user_id:MIO.impresaId, mestiere_id:(RV.lavoro.mestiere_id||null),
      lavoro_id:RV.lavoro.id, operatore_id:r.op,
      data:oggi, ore:r.ore, rapportino_id:rid
    }).select("id");
    if(error||!data||!data.length){
      const p=(SQUADRA||[]).find(x=>String(x.id)===String(r.op));
      oreFallite.push((p&&p.nome)||"qualcuno");
    }else oreScritte++;
  }

  let spesaOk=null;
  if(vuoleSpesa){
    const {data,error}=await sb.from("gest_spese").insert({
      user_id:MIO.impresaId, lavoro_id:RV.lavoro.id,
      descrizione:des, importo:imp, inserito_da:MIO.nome,
      /* ⛔ 5 set 2026 — LA FIRMA. `inserito_da` e' solo un nome scritto a mano:
         non vale come firma. `creato_da` punta alla riga di gest_operatori ed
         e' quello su cui girano le regole del database. Senza, dal 5 settembre
         la spesa NON viene scritta (regola gest_spese_team_insert). */
      creato_da:MIO.operatoreId
    }).select("id");
    spesaOk=!(error||!data||!data.length);
  }

  /* ⚠️ Si dice "salvato" SOLO di quello che e' stato scritto davvero.
     Un permesso che blocca non da' errore: senza questo conto l'app direbbe
     "tutto a posto" con il database vuoto. */
  if(oreFallite.length||spesaOk===false){
    rimetti();
    let m="Salvato solo in parte.";
    if(oreFallite.length)m+=" Ore non scritte: "+oreFallite.join(", ")+".";
    if(spesaOk===false)m+=" La spesa non è entrata.";
    toast(m+" Dillo al capo.");
    return;
  }

  rvChiudi();
  const pezzi=[];
  if(oreScritte)pezzi.push(oreScritte===1?"1 persona":oreScritte+" persone");
  if(materiali)pezzi.push("materiali");
  if(note)pezzi.push("note");
  if(spesaOk)pezzi.push("spesa");
  toast("Rapportino salvato ✔ "+(pezzi.length?"("+pezzi.join(", ")+")":""));
}

/* crea il rapportino e restituisce il suo id, oppure null. Stessa strada del
   rapportino grande: .select("id") perche' un permesso che blocca NON da'
   errore, torna riuscito a vuoto. */
async function rvNuovoRapportino(campi){
  const {data,error}=await sb.from("gest_rapportini").insert(Object.assign({
    user_id:MIO.impresaId,
    mestiere_id:(RV.lavoro&&RV.lavoro.mestiere_id)||null,
    lavoro_id:RV.lavoro.id,
    creato_da:MIO.operatoreId,
    data:ymd(new Date())
  },campi)).select("id");
  if(error||!data||!data.length){
    toast("Non salvato: "+((error&&error.message)||"il database non ha scritto niente"));
    return null;
  }
  return data[0].id;
}

async function rvSalva(){
  if(!RV.lavoro){toast("Scegli il lavoro");return;}
  const b=$("#rv-ok"); if(b){b.disabled=true;b.textContent="Salvo\u2026";}
  const rimetti=()=>{ if(b){b.disabled=false;b.textContent="Conferma";} };

  if(RV.tipo==="ore"){
    if(!chiedoPermesso("rapportini","di segnare le ore")){rimetti();return;}
    const rid=await rvNuovoRapportino({});
    if(!rid){rimetti();return;}
    const {data,error}=await sb.from("gest_ore").insert({
      user_id:MIO.impresaId, mestiere_id:(RV.lavoro.mestiere_id||null),
      lavoro_id:RV.lavoro.id, operatore_id:MIO.operatoreId,
      data:ymd(new Date()), ore:RV.ore, rapportino_id:rid
    }).select("id");
    if(error||!data||!data.length){
      rimetti();
      toast("Rapportino salvato, ma le ore NO: "+((error&&error.message)||"il database non ha scritto niente")+" \u2014 dillo al capo");
      return;
    }
    rimetti(); rvChiudi(); toast(String(RV.ore).replace(".",",")+" ore segnate \u2714");
    return;
  }

  if(RV.tipo==="materiale"||RV.tipo==="nota"){
    if(!chiedoPermesso("rapportini","di scrivere il rapportino")){rimetti();return;}
    const txt=(($("#rv-testo")||{}).value||"").trim();
    if(!txt){toast("Scrivi qualcosa, poi conferma");rimetti();return;}
    const rid=await rvNuovoRapportino(RV.tipo==="materiale"?{materiali:txt}:{note:txt});
    if(!rid){rimetti();return;}
    rimetti(); rvChiudi(); toast(RV.tipo==="materiale"?"Materiale segnato \u2714":"Nota segnata \u2714");
    return;
  }

  if(RV.tipo==="spesa"){
    if(!chiedoPermesso("pagamenti","di registrare le spese")){rimetti();return;}
    const imp=_numIt(($("#rv-imp")||{}).value||"");
    const txt=(($("#rv-testo")||{}).value||"").trim();
    if(!(imp>0)){toast("Scrivi quanto hai speso, per esempio 24,50");rimetti();return;}
    if(imp>1000000){toast("Importo troppo alto: controlla quello che hai scritto");rimetti();return;}
    if(!txt){toast("Scrivi per cosa hai speso");rimetti();return;}
    const {data,error}=await sb.from("gest_spese").insert({
      user_id:MIO.impresaId, lavoro_id:RV.lavoro.id,
      descrizione:txt, importo:imp, inserito_da:MIO.nome,
      creato_da:MIO.operatoreId /* la firma: vedi l'altro insert qui sopra */
    }).select("id");
    if(error||!data||!data.length){
      rimetti();
      toast("Non salvata: "+((error&&error.message)||"il database non ha scritto niente"));
      return;
    }
    rimetti(); rvChiudi(); toast("Spesa segnata \u2714");
    return;
  }
  rimetti();
}

