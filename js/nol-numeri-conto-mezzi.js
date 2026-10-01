// [SPOSTATO] nol-numeri-conto-mezzi.js: era dentro nol-core.js, righe 594-1051, spostato identico.

  /* ================================================================
     IL CONTO DEL NOLEGGIO — 22 agosto 2026
     Qui dentro NON c'e' nessuna formula: i conti li fa
     js/noleggio-prezzo.js, che sta fuori dalla pagina apposta ed e'
     provato sul banco. Questo pezzo si limita a leggere le caselle,
     passare i due oggetti al motore e disegnare quello che risponde.
     ================================================================ */
  const _numIt=v=>(window.NoleggioPrezzo
    ? window.NoleggioPrezzo.numIt(v)
    : (parseFloat(String(v==null?"":v).replace(/[€\s]/g,"").replace(/\./g,"").replace(",","."))||0));

  /* ================================================================
     ⛔ 29 agosto 2026 — LA VIRGOLA LA METTE IL GESTIONALE, NON LUI.
     Alessio, sul negozio: «la devo sempre mettere io?». No.
     Batti come ti viene — 35 · 35.5 · 35,5 — e appena ESCI dalla casella
     la scritta si mette in ordine da sola: 35,00 · 35,50 · 35,50.
     ⛔ Mentre scrivi non si tocca NIENTE: se la virgola comparisse a ogni
        tasto, «100» diventerebbe «1,00» invece di cento euro.
     · «data-eu»  = soldi: due cifre dopo la virgola e il punto delle
                    migliaia (1.250,00).
     · «data-num» = ore, km, contaore, quantita, percentuali: solo la
                    virgola. 12,5 ore resta 12,5, non diventa 12,50.
     Copiata riga per riga da gestionale-negozio.html.
     ================================================================ */
  function _numTestoNol(v){
    if(v==null||v==="")return "";
    const n=+v;
    if(!isFinite(n))return "";
    return String(Math.round(n*1e6)/1e6).replace(".",",");
  }
  function _sistemaCasella(el){
    if(!el||el.tagName!=="INPUT")return;
    /* ⛔ mai riscrivere la casella dove il dito sta scrivendo */
    if(el===document.activeElement)return;
    const soldi=el.hasAttribute("data-eu"), num=el.hasAttribute("data-num");
    if(!soldi&&!num)return;
    const t=String(el.value==null?"":el.value).trim();
    if(t===""){ el.value=""; return; }
    const n=_numIt(t);
    if(!isFinite(n)){ el.value=""; return; }
    el.value = soldi
      ? n.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})
      : _numTestoNol(n);
  }
  document.addEventListener("focusout",e=>_sistemaCasella(e.target));
  function _sistemaNumeri(root){
    (root||document).querySelectorAll("[data-eu],[data-num]").forEach(_sistemaCasella);
  }
  /* I moduli nascono dopo, con innerHTML: si sistemano appena compaiono.
     ⚠️ Col freno da 120 ms: il conto del noleggio ridisegna le righe a ogni
     tasto, e senza freno si rifarebbe il giro di tutta la pagina ogni volta. */
  let _tSist=null;
  new MutationObserver(function(m){
    for(const x of m) if(x.addedNodes.length){
      clearTimeout(_tSist);
      _tSist=setTimeout(function(){_sistemaNumeri(document);},120);
      return;
    }
  }).observe(document.body,{childList:true,subtree:true});
  /* ⚠️ 28 agosto 2026 — I SOLDI DI UN DOCUMENTO SI SCRIVONO COI CENTESIMI.
     _eur li scrive gia' cosi' e il noleggio lo usa dappertutto. Restava
     fuori solo la sotto-sezione «Lavori del gestionale imprese» dentro
     Fatture, che usava eur(): arrotonda all'euro, e 860,50 usciva «861 €».
     Adesso anche quella passa di qui. eur() resta per i riepiloghi. */
  /* ⛔ 29 agosto 2026 - IL PUNTO DELLE MIGLIAIA. Senza useGrouping certi
     browser scrivono "1050,50 €" invece di "1.050,50 €": sopra il migliaio
     il numero non si legge piu' a colpo d'occhio. Stessa riga delle imprese. */
  /* ⛔ 4 settembre 2026 — anche SCRIVERE un numero e' un arrotondamento.
     toLocaleString arrotonda in virgola mobile: 1,005 diventa «1,00»
     mentre il database dice 1,01. Prima si passa da _cent2, la stessa
     regola del gestionale imprese. */
  const _cent=n=>(typeof _cent2==="function")?_cent2(n):(Math.round((+n||0)*100)/100);
  const _eur=n=>Number(_cent(n)||0).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true})+" €";
  let nolMezzi=[], nolConsumi=[], nolMestieri=[];

  /* le caselle del contaore e dei km si vedono solo se quel mezzo li ha:
     una casella che per quel mezzo non vuol dire niente e' una casella che
     prima o poi qualcuno riempie */
  function nolMostraBox(){
    const o=$("#nz-box-ore"), k=$("#nz-box-km");
    if(o) o.style.display=($("#nz-contaore")&&$("#nz-contaore").checked)?"":"none";
    if(k) k.style.display=($("#nz-contakm")&&$("#nz-contakm").checked)?"":"none";
  }
  document.addEventListener("change",e=>{
    if(e.target.id==="nz-contaore"||e.target.id==="nz-contakm") nolMostraBox();
  });

  function nolIdDaNome(sel,nome){
    const s=$(sel); if(!s||!nome) return "";
    const o=Array.prototype.find.call(s.options,x=>x.dataset&&x.dataset.nome===nome);
    return o?o.value:"";
  }
  function nolMezzoScelto(){
    const s=$("#nn-mezzo"); if(!s||!s.value) return null;
    return nolMezzi.find(m=>String(m.id)===String(s.value))||null;
  }

  /* ---- il materiale consumato ---- */
  function nolDisegnaConsumi(){
    const box=$("#nn-consumi"); if(!box) return;
    box.innerHTML=nolConsumi.map((c,i)=>`<div class="nol-cons-riga">
      <input data-cons="descrizione" data-i="${i}" placeholder="Cosa" value="${esc(c.descrizione==null?"":c.descrizione)}">
      <input data-cons="quantita" data-i="${i}" inputmode="decimal" data-num placeholder="Quanto" value="${esc(c.quantita==null?"":c.quantita)}">
      <input data-cons="prezzo" data-i="${i}" inputmode="decimal" data-eu placeholder="€ l'uno" value="${esc(c.prezzo==null?"":c.prezzo)}">
      <button type="button" class="nol-cons-via" data-via="${i}" title="Togli questa riga">✕</button></div>`).join("");
  }
  function nolLeggiConsumi(){
    return nolConsumi
      .filter(c=>String(c.descrizione||"").trim()||_numIt(c.quantita)||_numIt(c.prezzo))
      .map(c=>({descrizione:String(c.descrizione||"").trim(),quantita:_numIt(c.quantita),prezzo:_numIt(c.prezzo)}));
  }
  /* ⚠️ ASCOLTATORI DELEGATI, non attaccati alle singole caselle.
     Le caselle adesso nascono dentro la SCHEDA, cioe' dopo che la pagina si e'
     aperta: un ascoltatore messo all'avvio su "#nn-mezzo" si attaccherebbe a
     un elemento che ancora non esiste, e non scatterebbe mai. Qui si ascolta
     il documento e si guarda chi ha fatto rumore. Trovato provandolo: il
     riquadro del contaore restava chiuso anche sul mezzo che ce l'ha. */
  document.addEventListener("click",e=>{
    if(e.target.closest("#nn-cons-add")){
      nolConsumi.push({descrizione:"",quantita:"",prezzo:""}); nolDisegnaConsumi(); return;
    }
    const via=e.target.closest("#nn-consumi [data-via]");
    if(via){ nolConsumi.splice(+via.dataset.via,1); nolDisegnaConsumi(); nolAggiornaConto(); }
  });
  const NOL_CASELLE="#nn-mezzo,#nn-uscita,#nn-prevista,#nn-effettivo,#nn-ora-uscita,"
                  + "#nn-ora-rientro,#nn-contaore-usc,#nn-contaore-rie,#nn-km-usc,#nn-km-rie,#nn-cauzione";
  function nolAscolta(e){
    const t=e.target;
    if(t.matches&&t.matches("[data-cons]")){
      nolConsumi[+t.dataset.i][t.dataset.cons]=t.value; nolAggiornaConto(); return;
    }
    if(t.matches&&t.matches(NOL_CASELLE)) nolAggiornaConto();
  }
  document.addEventListener("input",nolAscolta);
  document.addEventListener("change",nolAscolta);

  /* ---- il conto ---- */
  /* ⛔ 24 agosto 2026 — le due memorie che servono all'importo.
     nolImportoAMano: l'ha scritto lui adesso, non si tocca piu' da soli.
     nolImportoSalvato: quanto diceva il conto all'ultimo salvataggio. Se
     l'importo salvato e' uguale a quello, vuol dire che era agganciato al
     conto, e quando il conto cambia si puo' riallineare senza fare danni. */
  let nolImportoAMano=false, nolImportoSalvato=null;
  /* ⛔ 28 agosto 2026 — LA CAUZIONE SI PROPONE DA SOLA.
     Al collaudo del 28 agosto: fai un noleggio nuovo, il riquadro del conto
     dice «Cauzione 100,00 € — in deposito», l'importo si riempie da solo, e
     la casella Cauzione resta VUOTA. Premi Crea e il noleggio si salva con
     cauzione zero: non compare in Cauzioni, il Riepilogo conta 900 invece di
     1.000, e la ricevuta della cauzione esce a zero. Sono soldi veri del
     cliente che il gestionale non sa piu' di avere in mano.
     La cauzione si copiava dal mezzo SOLO premendo «Usa questo importo» —
     che ormai non preme piu' nessuno, perche' l'importo si mette da solo.
     Adesso si propone da sola, come l'importo, e lo scrive. Si propone una
     volta sola per apertura: se lui la cancella, resta cancellata. */
  /* nolCauzioneMessa: quanto ci abbiamo messo noi. Serve a tenere l'avviso
     sotto gli occhi finche' quel numero e' ancora quello proposto: il conto
     si rifa' a ogni tasto, e senza questo l'avviso compariva un istante e
     spariva — la cauzione sarebbe finita nella casella SENZA dirlo. */
  let nolCauzioneProposta=false, nolCauzioneMessa=null;
  document.addEventListener("input",e=>{
    if(e.target&&e.target.id==="nn-importo") nolImportoAMano=true;
    /* l'ha scritta lui: da qui in poi non si propone piu' e l'avviso va via */
    if(e.target&&e.target.id==="nn-cauzione"){ nolCauzioneProposta=true; nolCauzioneMessa=null; }
  });

  function nolCalcolaOra(){
    if(!window.NoleggioPrezzo) return null;
    const m=nolMezzoScelto(); if(!m) return null;
    const val=id=>{const e=$(id);return e?e.value:"";};
    return window.NoleggioPrezzo.calcola(m,{
      data_uscita:val("#nn-uscita"),
      data_rientro_prevista:val("#nn-prevista"),
      data_rientro_effettivo:val("#nn-effettivo"),
      ora_uscita:val("#nn-ora-uscita"),
      ora_rientro:val("#nn-ora-rientro"),
      contaore_uscita:val("#nn-contaore-usc")===""?null:_numIt(val("#nn-contaore-usc")),
      contaore_rientro:val("#nn-contaore-rie")===""?null:_numIt(val("#nn-contaore-rie")),
      km_uscita:val("#nn-km-usc")===""?null:_numIt(val("#nn-km-usc")),
      km_rientro:val("#nn-km-rie")===""?null:_numIt(val("#nn-km-rie")),
      consumi:nolLeggiConsumi(),
      cauzione:val("#nn-cauzione")===""?null:_numIt(val("#nn-cauzione"))
    });
  }


  /* ================================================================
     LO STESSO MEZZO PROMESSO DUE VOLTE — 23 agosto 2026
     ⛔ Fino a oggi due noleggi dello stesso mezzo sugli stessi giorni si
     salvavano tutti e due, in silenzio. Poi lunedi' mattina arrivano in
     due a prendere lo stesso escavatore.

     Due periodi si accavallano se ognuno comincia prima che l'altro
     finisca. Un noleggio senza data di rientro prevista si considera
     aperto: e' il caso peggiore, e nel dubbio si avvisa.
     ================================================================ */
  const FASE_ETI={prenotato:{t:"PRENOTATO",c:"#7C3AED"},
                  fuori:{t:"FUORI",c:"#e65100"},
                  rientrato:{t:"RIENTRATO",c:"#2e7d32"}};
  function nolFaseDi(x){
    if(x.fase) return x.fase;
    if(x.data_rientro_effettivo) return "rientrato";
    if(x.data_uscita&&x.data_uscita>todayStr()) return "prenotato";
    return "fuori";
  }
  function _siAccavallano(a1,a2,b1,b2){
    /* senza la fine, il periodo e' aperto: si guarda solo l'inizio */
    const fineA=a2||"9999-12-31", fineB=b2||"9999-12-31";
    if(!a1||!b1) return false;
    return a1<=fineB && b1<=fineA;
  }
  async function nolSovrapposti(mezzoId,dal,al,escludiId){
    if(!(sb&&sbUid)||!mezzoId||!dal) return [];
    const {data}=await sb.from("nol_noleggi")
      .select("id,mezzo,cliente,data_uscita,data_rientro_prevista,data_rientro_effettivo,fase")
      .eq("user_id",sbUid).eq("mezzo_id",mezzoId);
    return (data||[])
      .filter(x=>String(x.id)!==String(escludiId||""))
      .filter(x=>nolFaseDi(x)!=="rientrato")
      .filter(x=>_siAccavallano(dal,al,x.data_uscita,x.data_rientro_prevista));
  }
  /* l'avviso mentre si sceglie, non al momento di salvare */
  async function nolAvvisaConflitto(id){
    const box=$("#nn-conflitto"); if(!box) return;
    const sel=$("#nn-mezzo"), dal=$("#nn-uscita")?$("#nn-uscita").value:"";
    if(!sel||!sel.value||!dal){box.innerHTML="";return;}
    const al=$("#nn-prevista")?$("#nn-prevista").value:"";
    const altri=await nolSovrapposti(sel.value,dal,al,id);
    box.innerHTML=altri.length
      ? '<div class="nol-avviso" style="border-color:#c62828;color:#b3261e;margin-top:10px">'
        +'<b>Questo mezzo è già impegnato in quei giorni:</b> '
        + altri.map(x=>esc((x.cliente||"un altro cliente")+" dal "+fdate(x.data_uscita)+
            (x.data_rientro_prevista?" al "+fdate(x.data_rientro_prevista):" (senza rientro previsto)"))).join(" &middot; ")
        +'.</div>'
      : "";
  }

  /* ⛔ il mezzo che non si puo' dare lo si dice SUBITO, mentre si sceglie,
     non al momento di salvare: chi ha gia' scritto tutto e si sente dire di
     no alla fine, la seconda volta il controllo lo salta. */
  function nolAvvisaMezzo(){
    const box=$("#nn-mezzo-avviso"); if(!box) return;
    const m=nolMezzoScelto();
    if(!m){box.innerHTML="";return;}
    const bl=mezzoBloccato(m);
    if(bl){
      box.innerHTML='<div class="nol-avviso" style="border-color:#c62828;color:#b3261e;margin-top:8px">'
        +'<b>Questo mezzo non si può noleggiare:</b> '+esc(bl)+'. Sistemalo nella scheda del mezzo.</div>';
      return;
    }
    const s=mezzoScadenze(m).filter(x=>x.gg!=null&&x.gg>=0&&x.gg<=SCAD_AVVISO_GG&&x.data);
    box.innerHTML=s.length
      ? '<div class="nol-avviso" style="margin-top:8px">'+esc(s[0].cosa)+' scade fra '+s[0].gg
        +(s[0].gg===1?" giorno":" giorni")+' ('+esc(fdate(s[0].data))+').</div>'
      : "";
  }

  function nolAggiornaConto(){
    nolAvvisaMezzo();
    nolAvvisaConflitto(nolIdApertoNoleggio);
    const box=$("#nn-conto"); if(!box) return;
    const m=nolMezzoScelto();
    /* le letture si chiedono solo ai mezzi che le hanno */
    const bo=$("#nn-box-contaore"), bk=$("#nn-box-km");
    if(bo) bo.style.display=(m&&m.ha_contaore)?"":"none";
    if(bk) bk.style.display=(m&&m.ha_contakm)?"":"none";

    if(!m){
      box.innerHTML='<h4>Il conto</h4><p style="margin:0;color:#666;font-size:14px">Scegli il mezzo e le date: il conto si fa da solo.</p>';
      return;
    }
    const c=nolCalcolaOra();
    if(!c){box.innerHTML='<h4>Il conto</h4><p style="margin:0;color:#666;font-size:14px">Il conto non si riesce a fare.</p>';return;}

    let h='<h4>Il conto'+(c.giorni?' · '+c.giorni+(c.giorni===1?' giorno':' giorni'):'')+'</h4>';
    if(c.righe.length){
      h+='<table>';
      c.righe.forEach(r=>{
        h+='<tr><td>'+esc(r.voce)+'<div class="det">'+esc(r.dettaglio)+'</div></td>'
         + '<td class="n">'+_eur(r.importo)+'</td></tr>';
      });
      h+='<tr class="tot"><td>Totale</td><td class="n">'+_eur(c.totaleEuro)+'</td></tr></table>';
      if(c.cauzione>0) h+='<div class="cauz">Cauzione '+_eur(c.cauzione)+' — in deposito, non entra nel totale.</div>';
      h+='<button type="button" class="nol-agg" id="nn-usa" style="margin-top:10px">Usa questo importo</button>';
    }
    /* ⛔ 28 agosto 2026 — la cauzione del mezzo finisce nella sua casella.
       Solo se la casella e' vuota e solo la prima volta: quello che scrive
       lui non si tocca mai, e se la cancella resta cancellata. */
    let avvisoCauzione="";
    const cauIn=$("#nn-cauzione");
    if(cauIn&&c.cauzione>0&&!nolCauzioneProposta&&String(cauIn.value).trim()===""){
      cauIn.value=String(c.cauzione).replace(".",",");
      nolCauzioneProposta=true;
      nolCauzioneMessa=_cent(c.cauzione);
      if(typeof nolMostraCauzione==="function") nolMostraCauzione();
    }
    /* l'avviso RESTA finche' in casella c'e' ancora il numero che ci abbiamo
       messo noi: il conto si rifa' a ogni tasto, e un avviso che sparisce
       subito e' come non averlo mai scritto. */
    if(cauIn&&nolCauzioneMessa!=null&&
       Math.abs(_numIt(cauIn.value)-nolCauzioneMessa)<0.005){
      avvisoCauzione='<div class="nol-avviso" id="nn-cau-nota">La cauzione &egrave; stata messa a '
        +esc(_eur(nolCauzioneMessa))+', quella del mezzo. Se ne prendi un\'altra, scrivila a mano.</div>';
    }
    (c.avvisi||[]).forEach(a=>{h+='<div class="nol-avviso">'+esc(a)+'</div>';});
    h+=avvisoCauzione;

    /* ⛔ 24 agosto 2026 — L'IMPORTO SEGUE IL CONTO, MA NON DI NASCOSTO.
       Al collaudo del 24 agosto sono venute fuori due cose, tutte e due
       care: la casella «Importo» restava a 0 anche col conto pieno (e un
       noleggio a zero non finisce mai in fattura), e quando il mezzo
       rientrava prima il riquadro qui sopra si rifaceva sui giorni veri
       ma la casella no — 630 € fatturati al posto di 480.
       Adesso:
       · casella vuota o a zero -> si riempie da sola col totale;
       · importo agganciato al conto (uguale a quello dell'ultimo
         salvataggio) -> si riallinea da solo e lo scrive;
       · importo scritto a mano -> NON si tocca, ma si avvisa della
         differenza e si offre il bottone per allinearlo.
       I soldi che ha scritto lui non si cambiano mai in silenzio. */
    const totC=_cent(c.totaleEuro||0);
    const cIn=$("#nn-importo");
    const impOra=cIn?_numIt(cIn.value):0;
    const impVuoto=!cIn||String(cIn.value).trim()===""||impOra===0;
    const agganciato=!nolImportoAMano && nolImportoSalvato!=null &&
      Math.abs(impOra-_cent(nolImportoSalvato))<0.005;
    if(cIn&&totC>0&&(impVuoto||agganciato)&&Math.abs(impOra-totC)>=0.005){
      cIn.value=String(totC).replace(".",",");
      nolImportoSalvato=totC;
      h+='<div class="nol-avviso" id="nn-imp-nota">L\'importo da fare pagare &egrave; stato messo a '
        +esc(_eur(totC))+', come il conto qui sopra. Se vuoi un altro numero, scrivilo a mano.</div>';
    } else if(cIn&&totC>0&&Math.abs(impOra-totC)>=0.005){
      const d=_cent(impOra-totC);
      h+='<div class="nol-avviso nol-avviso-caro" id="nn-imp-nota"><b>Attenzione:</b> stai facendo pagare '
        +esc(_eur(impOra))+', ma il conto dice '+esc(_eur(totC))+' &mdash; '
        +esc(_eur(Math.abs(d)))+(d>0?' in pi&ugrave;.':' in meno.')
        +' <button type="button" class="nol-agg" id="nn-imp-fix" style="margin-top:8px">Metti '
        +esc(_eur(totC))+'</button></div>';
    }
    box.innerHTML=h;

    /* «Usa questo importo» e «Metti X» riagganciano l'importo al conto:
       da li' in poi torna a seguirlo da solo. */
    const aggancia=()=>{
      $("#nn-importo").value=String(c.totaleEuro).replace(".",",");
      nolImportoAMano=false; nolImportoSalvato=totC;
      nolAggiornaConto();
    };
    const b=$("#nn-usa");
    if(b) b.addEventListener("click",()=>{
      if(c.cauzione>0&&$("#nn-cauzione")&&!$("#nn-cauzione").value)
        $("#nn-cauzione").value=String(c.cauzione).replace(".",",");
      aggancia();
    });
    const bf=$("#nn-imp-fix");
    if(bf) bf.addEventListener("click",aggancia);
  }

  /* il conto si rifa' a ogni tasto: chi noleggia deve vedere il numero
     mentre parla al telefono, non dopo aver premuto Salva. Gli ascoltatori
     stanno qui sopra, delegati al documento. */


  /* ================================================================
     LE SCADENZE DEL MEZZO — 23 agosto 2026
     ⛔ Noleggiare un mezzo con la verifica periodica scaduta e' il rischio
     piu' grosso che corre un noleggiatore (art. 71 c.11 e allegato VII del
     D.Lgs 81/08), e finora il gestionale non lo sapeva nemmeno.

     ⚠️ LA PERIODICITA' NON STA NEL CODICE. Le due fonti ufficiali lette il
     23 agosto (BibLus e ARPA Veneto) si contraddicono su PLE e carrelli
     telescopici, e comunque dipende da tipo, eta' e severita' d'uso. E'
     una casella per mezzo, che parte da 12 mesi. Chi la sa la cambia.
     ================================================================ */
  const SCAD_AVVISO_GG=30;   /* da quanti giorni prima si diventa gialli */

  function _piuMesi(d,mesi){
    if(!d||!mesi) return null;
    const [y,m,g]=String(d).slice(0,10).split("-").map(Number);
    if(!y) return null;
    const dt=new Date(y,(m-1)+Number(mesi),g);
    const mm=String(dt.getMonth()+1).padStart(2,"0"), gg=String(dt.getDate()).padStart(2,"0");
    return dt.getFullYear()+"-"+mm+"-"+gg;
  }
  function _fraQuanti(d){
    if(!d) return null;
    return Math.round((new Date(String(d).slice(0,10))-new Date(todayStr()))/86400000);
  }
  function mezzoProssimaVerifica(m){
    if(!m||!+m.verifica_mesi) return null;      /* 0 = non soggetto */
    return _piuMesi(m.verifica_ultima,+m.verifica_mesi);
  }
  /* tutte le scadenze di un mezzo, gia' ordinate dalla piu' urgente */
  function mezzoScadenze(m){
    const r=[];
    const v=mezzoProssimaVerifica(m);
    if(+m.verifica_mesi){
      r.push({cosa:"Verifica periodica",data:v,gg:_fraQuanti(v),blocca:true,
              manca:!m.verifica_ultima});
    }
    if(m.assicurazione_scad) r.push({cosa:"Assicurazione",data:m.assicurazione_scad,gg:_fraQuanti(m.assicurazione_scad),blocca:true});
    if(m.revisione_scad)     r.push({cosa:"Revisione",     data:m.revisione_scad,    gg:_fraQuanti(m.revisione_scad),    blocca:false});
    if(m.collaudo_scad)      r.push({cosa:"Collaudo",      data:m.collaudo_scad,     gg:_fraQuanti(m.collaudo_scad),     blocca:false});
    /* il tagliando non ha una data: ha le ore */
    if(+m.tagliando_ogni_ore>0){
      const fatte=(+m.contaore_attuale||0)-(+m.tagliando_ultimo_ore||0);
      const restano=(+m.tagliando_ogni_ore)-fatte;
      r.push({cosa:"Tagliando",ore:Math.round(restano),blocca:false,
              gg:restano<=0?-1:(restano<=(+m.tagliando_ogni_ore)*0.1?0:999)});
    }
    return r.sort((a,b)=>(a.gg==null?9999:a.gg)-(b.gg==null?9999:b.gg));
  }
  /* ⛔ il mezzo si puo' dare o no? Una risposta sola, usata dall'elenco,
     dal Riepilogo e dal salvataggio del noleggio: se stessero in tre posti
     diversi, un giorno direbbero tre cose diverse. */
  function mezzoBloccato(m){
    if(!m) return null;
    if(m.fuori_servizio) return "è segnato FUORI SERVIZIO"+(m.fuori_servizio_perche?": "+m.fuori_servizio_perche:"");
    if(+m.verifica_mesi){
      if(!m.verifica_ultima) return "non ha la data dell'ultima verifica periodica";
      const gg=_fraQuanti(mezzoProssimaVerifica(m));
      if(gg!=null&&gg<0) return "ha la verifica periodica scaduta da "+Math.abs(gg)+(Math.abs(gg)===1?" giorno":" giorni");
    }
    if(m.assicurazione_scad){
      const gg=_fraQuanti(m.assicurazione_scad);
      if(gg!=null&&gg<0) return "ha l'assicurazione scaduta da "+Math.abs(gg)+(Math.abs(gg)===1?" giorno":" giorni");
    }
    return null;
  }
  /* l'etichetta rossa o gialla da mettere sulla card del mezzo */
  function mezzoEtichettaScad(m){
    const bl=mezzoBloccato(m);
    if(bl) return {col:"#c62828",testo:m.fuori_servizio?"FUORI SERVIZIO":"NON SI PUÒ DARE"};
    const s=mezzoScadenze(m).filter(x=>x.gg!=null&&x.gg>=0&&x.gg<=SCAD_AVVISO_GG);
    if(s.length) return {col:"#e65100",testo:s[0].cosa.toUpperCase()+" FRA "+s[0].gg+" GG"};
    return null;
  }

  async function loadMezzi(){
    if(!(sb&&sbUid)) return;
    const {data}=await sb.from("gest_mezzi")
      .select("*").eq("user_id",sbUid).eq("noleggiabile",true).order("nome");
    const m=data||[], box=$("#mezzi-body");
    if(!box) return;
    if(!m.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun mezzo. Aggiungine uno.</p>';return;}
    const col={disponibile:"#2e7d32",in_uso:"#e65100",noleggiato:"#e65100",manutenzione:"#757575",fuori_uso:"#757575"};
    box.innerHTML=m.map(x=>{
      const sc=mezzoEtichettaScad(x);
      const c=sc?sc.col:(col[x.stato]||"#757575");
      return nolCard({col:c,
        titolo:esc(x.nome||"—"),
        eti:[{t:esc(sc?sc.testo:(x.stato||"").toUpperCase())}],
        corpo:`${sc?`<div class="sub2" style="color:${sc.col};font-weight:600">${esc(mezzoBloccato(x)?("Non si può noleggiare: "+mezzoBloccato(x)):"")}</div>`:""}
        <div class="sub">${esc([x.tipo,x.codice?"cod. "+x.codice:""].filter(Boolean).join(" · "))||""}</div>
        <div class="sub2">${esc("Al giorno "+_eur(x.tariffa_giorno||0)+" · a settimana "+_eur(x.tariffa_settimana||0)+" · al mese "+_eur(x.tariffa_mese||0)+(x.cauzione?" · cauzione "+_eur(x.cauzione):""))}</div>`,
        pulsanti:nolPulsanti("mezzo",x.id)});
    }).join("");
  }
