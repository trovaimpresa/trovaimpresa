// [SPOSTATO] op-rapportini.js: era dentro op-core.js, righe 1423-1764, spostato identico.
/* ===================================================================
   RAPPORTINO DI CANTIERE — 15 agosto 2026
   Le ore finiscono in gest_ore, dove sono sempre state: da li' il pannello
   del titolare calcola gia' il margine di ogni lavoro. Non c'e' una seconda
   tabella delle ore, se no prima o poi i due numeri litigano.
   =================================================================== */
let SQUADRA=null;          /* null = non ancora letta. [] = letta e vuota. */
let RAP_ORE={};            /* id operatore -> ore scelte con i pulsanti */

async function caricaSquadra(){
  if(!puo("rapportini")){SQUADRA=[];return;}
  /* ⚠️ 5 set 2026: `gest_squadra_nomi` sembra vuota se la si guarda da
     amministratore (→0← righe) — ma NON e' roba morta. E' una VISTA che
     filtra su `auth.uid()`: chi la interroga senza essere loggato non vede
     niente per costruzione. Serve, ed e' usata qui sotto.
     gest_squadra_nomi e' una VISTA con dentro solo id, reparto e nome.
     Il costo orario e i documenti dei colleghi non escono da li'. */
  const {data,error}=await sb.from("gest_squadra_nomi")
    .select("id,nome,mestiere_id").eq("user_id",MIO.impresaId).order("nome");
  if(error){SQUADRA=[];console.warn("[rapportino] squadra non letta:",error.message);return;}
  SQUADRA=data||[];
}

function rapScrivi(op){
  const cella=document.getElementById("ore-"+op);
  if(!cella)return;
  const v=+RAP_ORE[op]||0;
  cella.textContent=(v===0)?"0":String(v).replace(".",",");
  cella.classList.toggle("zero",v===0);
  const tot=Object.keys(RAP_ORE).reduce((s,k)=>s+(+RAP_ORE[k]||0),0);
  const box=$("#rap-tot");
  if(box)box.textContent=tot>0?("In tutto: "+String(tot).replace(".",",")+(tot===1?" ora":" ore")):"";
  opGuardaRapportino();
}

/* ============================================================
   IL CONTROLLORE SUL TELEFONO — 19 agosto 2026

   Nel pannello del capo il controllore guarda i documenti che partono
   al cliente. Qui i moduli sono due — il rapportino e la spesa con la
   carta — e il danno e' un altro: non un documento brutto, ma un
   NUMERO SBAGLIATO che entra nel margine del lavoro e non lo vede
   piu' nessuno.

   ⚠️ SEGNA E BASTA, come di la'. Non spegne nessun pulsante, non
      cambia niente da solo, e quello che c'era prima (le ore
      obbligatorie, l'importo obbligatorio) e' rimasto com'era.
   ⚠️ QUI E' SEMPRE «DA GUARDARE», MAI «DA CORREGGERE». Le cose che
      fermano davvero il salvataggio le fermava gia' il codice di
      prima: se qui ci fosse anche del rosso, sarebbe rosso per cose
      che si possono salvare lo stesso.
   ⚠️ E' una SECONDA MACCHINA, non una seconda copia delle regole: le
      quattro regole di qui non esistono di la', e viceversa. Il
      giorno che i due pannelli dovessero condividerle davvero, si
      tira fuori un js/controllore.js — ma non oggi, che il pannello
      del capo funziona.
   ============================================================ */
const OP_ORE_TANTE=12;
/* i soldi finiti dove non vanno: il simbolo, la parola, oppure un
   numero con DUE decimali (8,50). «1,5 m di tubo» ha un decimale solo
   e non fa scattare niente: se no ogni misura diventerebbe un avviso. */
const OP_SOLDI=/€|\beuro\b|\d+[.,]\d{2}(?!\d)/i;

function opAvvTogli(el){
  if(!el)return;
  const d=el.nextElementSibling;
  if(d&&d.classList&&d.classList.contains("op-avv"))d.remove();
  if(el.classList)el.classList.remove("op-storto");
}
function opAvvMetti(el,testo){
  if(!el)return;
  opAvvTogli(el);
  if(el.classList)el.classList.add("op-storto");
  const d=document.createElement("div");
  d.className="op-avv";
  const m=document.createElement("span");
  m.className="op-avv-mk"; m.textContent="DA GUARDARE";
  const t=document.createElement("span");
  t.className="op-avv-t"; t.textContent=testo;      /* testo, mai HTML */
  d.appendChild(m); d.appendChild(t);
  el.parentNode.insertBefore(d,el.nextSibling);
}
function opGuardaRapportino(){
  const mat=document.getElementById("rap-materiali");
  if(mat){
    if(OP_SOLDI.test(mat.value||""))
      opAvvMetti(mat,"Qui dentro ci sono dei prezzi. Scrivi solo le cose: quanto sono costate lo sa già il gestionale dalle spese e dalle fatture, e scritte due volte contano doppio.");
    else opAvvTogli(mat);
  }
  const tot=document.getElementById("rap-tot");
  if(!tot)return;
  const chiavi=Object.keys(RAP_ORE||{});
  const ore=chiavi.reduce((s,k)=>s+(+RAP_ORE[k]||0),0);
  const troppe=chiavi.filter(k=>(+RAP_ORE[k]||0)>OP_ORE_TANTE);
  if(troppe.length){
    const chi=((SQUADRA||[]).find(p=>String(p.id)===String(troppe[0]))||{}).nome||"Qualcuno";
    opAvvMetti(tot,chi+" ha "+_oreTxt(RAP_ORE[troppe[0]])+" in un giorno solo: di solito è il dito rimasto sul «+».");
  }else if(!ore){
    opAvvMetti(tot,"Non hai messo le ore a nessuno: la manodopera di oggi su questo lavoro resta a zero, e il margine del cantiere esce più alto del vero.");
  }else opAvvTogli(tot);
}
function opGuardaCarta(){
  const cau=document.getElementById("carta-causale");
  if(!cau)return;
  const imp=document.getElementById("carta-imp");
  const scritto=!!(imp&&String(imp.value||"").trim());
  if(scritto&&!String(cau.value||"").trim())
    opAvvMetti(cau,"Senza «per cosa» il capo si ritrova un importo e basta — e fra un mese non te lo ricordi nemmeno tu.");
  else opAvvTogli(cau);
}
/* si guarda quando ESCI da una casella, mai mentre batti: un segno che
   si accende sotto le dita e' un fastidio, non un aiuto */
(function opAscolta(){
  const att=(id,fn)=>{ const e=document.getElementById(id); if(e)e.addEventListener("blur",fn); };
  att("rap-materiali",opGuardaRapportino);
  att("carta-causale",opGuardaCarta);
  att("carta-imp",opGuardaCarta);
})();

async function renderRapportino(){
  const box=$("#lv-rap-box");
  if(!box)return;
  const attivo=puo("rapportini");
  box.classList.toggle("hidden",!attivo);
  if(!attivo)return;

  $("#rap-data").textContent="Giornata di "+dataIt(ymd(new Date()));
  $("#rap-materiali").value="";
  $("#rap-note").value="";
  RAP_ORE={};

  if(SQUADRA===null)await caricaSquadra();

  /* solo la gente del reparto di questo lavoro: in un'impresa con piu' reparti
     un elenco con dentro tutti sarebbe lungo e pieno di gente che non c'entra */
  const mid=curLavoro&&curLavoro.mestiere_id;
  const gente=(SQUADRA||[]).filter(p=>!mid||!p.mestiere_id||String(p.mestiere_id)===String(mid));

  const cont=$("#rap-squadra");
  if(!gente.length){
    cont.innerHTML='<div class="rap-vuoto">Non riesco a leggere la squadra. Se sei appena stato aggiunto, chiudi e riapri l’app; se non passa, chiedi al capo il permesso «Rapportini».</div>';
    return;
  }
  cont.innerHTML=gente.map(p=>{
    RAP_ORE[p.id]=0;
    return '<div class="rap-riga" data-op="'+esc(p.id)+'">'
      +'<div class="rap-nome">'+esc(p.nome||"Senza nome")+'</div>'
      +'<button type="button" class="rap-pm" data-d="-0.5" aria-label="Togli mezz’ora a '+esc(p.nome||"")+'">−</button>'
      +'<div class="rap-ore zero" id="ore-'+esc(p.id)+'">0</div>'
      +'<button type="button" class="rap-pm" data-d="0.5" aria-label="Aggiungi mezz’ora a '+esc(p.nome||"")+'">+</button>'
      +'</div>';
  }).join("")+'<div class="rap-tot" id="rap-tot"></div>';

  renderMieiRapportini();
}

/* ============================================================
   I RAPPORTINI GIA' SCRITTI, E COME SI BUTTANO VIA — 15 agosto 2026

   Perche' serve qui e non solo nel pannello del capo: chi sbaglia il
   rapportino e' chi lo scrive, e se ne accorge sul momento (giorno sbagliato,
   salvato due volte, lavoro sbagliato). Aspettare che se ne accorga il
   titolare vuol dire tenersi in casa per giorni delle ore doppie che gonfiano
   la manodopera di quel cantiere.

   ⚠️ Si butta via con gest_rapportino_cestina, non con .delete():
   le ore di gest_ore il collaboratore NON le puo' toccare (e' giusto cosi',
   sono le paghe), quindi una cancellazione da qui lascerebbe il rapportino
   nel Cestino e le ore vive. La funzione del database le mette via tutte e
   due nello stesso istante.
   Si vedono SOLO i suoi: quelli dei colleghi non li puo' toccare, e un
   pulsante che non funziona e' peggio di un pulsante che non c'e'.
   ============================================================ */
function _oreTxt(n){
  const v=Math.round((+n||0)*100)/100;
  return String(v).replace(".",",")+" h";
}

async function renderMieiRapportini(){
  const box=document.getElementById("rap-vecchi");
  const lista=document.getElementById("rap-vecchi-list");
  if(!box||!lista)return;
  if(!sb||!curLavoro||!MIO.impresaId||!MIO.operatoreId){box.style.display="none";return;}

  const [r1,r2]=await Promise.all([
    sb.from("gest_rapportini").select("id,data,materiali,note")
      .eq("user_id",MIO.impresaId).eq("lavoro_id",curLavoro.id)
      .eq("creato_da",MIO.operatoreId)
      .order("data",{ascending:false}).limit(10),
    sb.from("gest_ore").select("ore,rapportino_id")
      .eq("user_id",MIO.impresaId).eq("lavoro_id",curLavoro.id)
  ]);

  /* se la lettura non riesce si sparisce in silenzio: e' un riquadro in piu',
     non deve rompere la schermata su cui si scrive il rapportino */
  if(r1.error||!r1.data||!r1.data.length){box.style.display="none";return;}

  const perRap={};
  if(!r2.error)(r2.data||[]).forEach(o=>{
    const k=String(o.rapportino_id||""); if(!k)return;
    perRap[k]=(perRap[k]||0)+(+o.ore||0);
  });

  box.style.display="";
  lista.innerHTML=r1.data.map(r=>{
    const pezzi=[];
    if(r.materiali)pezzi.push(esc(String(r.materiali).slice(0,60)));
    if(r.note)pezzi.push(esc(String(r.note).slice(0,60)));
    return '<div class="rap-v-riga">'
      +'<div class="rap-v-testo"><b>'+dataIt(r.data)+'</b>'
      +(pezzi.length?'<br>'+pezzi.join(" · "):"")+'</div>'
      +'<div class="rap-v-ore">'+(r2.error?"—":_oreTxt(perRap[String(r.id)]||0))+'</div>'
      +'<button type="button" class="rap-v-del" data-rap="'+esc(String(r.id))+'" '
      +'aria-label="Butta via il rapportino del '+dataIt(r.data)+'">&times;</button>'
      +'</div>';
  }).join("");
}

async function rapButtaVia(id,bottone){
  if(!id||!sb)return;
  if(bottone)bottone.disabled=true;
  try{
    const prova=await sb.rpc("gest_rapportino_cestina",{p_id:id,p_conferma:false});
    if(prova.error){
      const m=(prova.error.code||"")+" "+(prova.error.message||"");
      if(/PGRST202|Could not find the function|schema cache/i.test(m)){
        alert("Non ho buttato via niente.\n\nQuesta cosa non è ancora accesa sul server: "
             +"dillo al tuo capo, deve lanciare sql/gest-rapportini-cestino.sql su Supabase.");
        return;
      }
      toast("Errore: "+(prova.error.message||"il database non risponde"));
      return;
    }
    const p=prova.data||{};
    if(!p.ok){
      if(p.motivo==="gia"){toast("Era già nel cestino.");}
      else if(p.motivo==="permesso"){toast("Questo rapportino non lo puoi buttare via: non l'hai scritto tu.");}
      else{toast("Non l'ho trovato.");}
      await renderMieiRapportini();
      return;
    }

    const righe=+p.righe_ore||0, ore=+p.ore||0;
    let msg="Butti via il rapportino del "+dataIt(p.data)+"?\n\n";
    msg+= righe
      ? ("Vanno via anche le ore che ci hai messo: "+righe+(righe===1?" riga":" righe")
         +", "+_oreTxt(ore)+" in tutto.\n\n")
      : "Non ci sono ore attaccate.\n\n";
    msg+="Finisce nel Cestino: il tuo capo può rimetterlo a posto dal gestionale.";
    if(!confirm(msg))return;

    const fatto=await sb.rpc("gest_rapportino_cestina",{p_id:id,p_conferma:true});
    if(fatto.error){toast("Non buttato via: "+(fatto.error.message||"errore"));return;}
    const f=fatto.data||{};
    if(!f.ok||!f.fatto){
      toast(f.motivo==="gia"?"Era già nel cestino.":"Non buttato via: riprova.");
    }else{
      toast(righe?("Buttato via, con "+_oreTxt(ore)):"Buttato via");
    }
    await renderMieiRapportini();
  }finally{
    if(bottone)bottone.disabled=false;
  }
}

/* un ascolto solo sul contenitore: le righe si rifanno a ogni apertura */
document.getElementById("rap-vecchi-list").addEventListener("click",e=>{
  const b=e.target.closest(".rap-v-del"); if(!b)return;
  rapButtaVia(b.dataset.rap,b);
});

/* i pulsanti si ascoltano una volta sola, sul contenitore: le righe vengono
   rifatte a ogni apertura, e agganciare l'ascolto a ognuna le lascerebbe
   attaccate tutte quelle di prima */
$("#rap-squadra").addEventListener("click",e=>{
  const b=e.target.closest(".rap-pm"); if(!b)return;
  const riga=b.closest(".rap-riga"); if(!riga)return;
  const op=riga.dataset.op;
  let v=(+RAP_ORE[op]||0)+(parseFloat(b.dataset.d)||0);
  if(v<0)v=0;
  if(v>24)v=24;               /* piu' di 24 ore in un giorno non esistono */
  RAP_ORE[op]=Math.round(v*2)/2;
  rapScrivi(op);
});

$("#btn-rap-salva").onclick=async()=>{
  if(!curLavoro)return;
  if(!chiedoPermesso("rapportini","di scrivere il rapportino"))return;

  const righe=Object.keys(RAP_ORE).filter(k=>(+RAP_ORE[k])>0).map(k=>({op:k,ore:+RAP_ORE[k]}));
  const materiali=($("#rap-materiali").value||"").trim();
  const note=($("#rap-note").value||"").trim();
  if(!righe.length&&!materiali&&!note){toast("Metti almeno le ore di qualcuno.");return;}

  const b=$("#btn-rap-salva"), testo=b.textContent;
  b.disabled=true;b.textContent="Salvo…";
  const oggi=ymd(new Date());

  /* .select("id") NON e' un vezzo: una scrittura fermata dai permessi NON da'
     errore, torna riuscita a vuoto. Senza questo controllo l'app direbbe
     "Salvato" e nel database non ci sarebbe niente. */
  const {data:rap,error:e1}=await sb.from("gest_rapportini").insert({
    user_id:MIO.impresaId,
    mestiere_id:(curLavoro.mestiere_id||null),
    lavoro_id:curLavoro.id,
    creato_da:MIO.operatoreId,
    data:oggi,
    materiali:materiali||null,
    note:note||null
  }).select("id");

  if(e1||!rap||!rap.length){
    b.disabled=false;b.textContent=testo;
    toast("Non salvato: "+((e1&&e1.message)||"il database non ha scritto niente"));
    return;
  }
  const rid=rap[0].id;

  if(righe.length){
    const {data:ore,error:e2}=await sb.from("gest_ore").insert(righe.map(r=>({
      user_id:MIO.impresaId,
      mestiere_id:(curLavoro.mestiere_id||null),
      lavoro_id:curLavoro.id,
      operatore_id:r.op,
      data:oggi,
      ore:r.ore,
      rapportino_id:rid
    }))).select("id");
    /* se le ore non entrano tutte lo dico, invece di far finta: sono loro che
       tengono in piedi il margine del lavoro */
    if(e2||!ore||ore.length!==righe.length){
      b.disabled=false;b.textContent=testo;
      toast("Rapportino salvato, ma le ore NO: "+((e2&&e2.message)||("scritte "+((ore&&ore.length)||0)+" su "+righe.length))+" — dillo al capo");
      return;
    }
  }

  b.disabled=false;b.textContent=testo;
  await renderRapportino();
  toast("Rapportino salvato ✔");
};

