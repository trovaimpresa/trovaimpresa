// [SPOSTATO] op-core.js: le righe 1-1422 del vecchio file ora stanno in: op-base.js (righe 1-268), op-agenda-giorno.js (righe 269-627), op-spese-foto.js (righe 628-853), op-rapido-voce.js (righe 854-1422). Qui resta il resto.
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
