/* ═══ FETTA C1 · IL COMPENSO COL DECRETO PARAMETRI ════════════════════
   Staccata da gestionale-app.html il 6 settembre 2026 (righe 9737-9972).

   COSA C'E' DENTRO — il riquadro che calcola il compenso del professionista
   sui lavori pubblici col DM 17 giugno 2016: dpDisponibile, dpCorto, dpPerc,
   bloccoDecreto (la schermata), dpRicalcola, dpTotale, dpMetti e dpAscolta.
   Taglio puro: dentro non e' cambiato un carattere.

   ⛔ I NUMERI DEL DECRETO NON STANNO QUI (non stavano nemmeno prima):
   stanno in js/decreto-parametri.js, letti dal PDF della Gazzetta. Qui c'e'
   solo la schermata. Quando il decreto cambia si sostituisce quel file.

   ⚠️ CHI CHIAMA QUESTA ROBA DA FUORI
   - `bloccoDecreto()` e `dpAscolta()` le chiama prevForm, che RESTA nella
     pagina. `dpMetti()` la chiama il gestore dei clic in fondo alla pagina.
     Tutte chiamate DENTRO una funzione: quando girano, questo file e' gia'
     nato.
   - Questo file chiama `aggiornaRiepilogoParcella()`, che resta nella
     pagina. Stessa ragione, al contrario.

   COSA NON C'E' — il resto dei Preventivi
   Il grosso dei preventivi (prevCache, renderPreventivi, prevForm, savePrev,
   prevToLavoro, la parcella) e' rimasto nella pagina di proposito. Dentro
   quel blocco ci sono SEI aiuti che li usano anche altri file gia' staccati:
   `prevCache`, `impRiga` e `calcolaParcella` (js/gest-documenti-pdf.js,
   js/gest-fatture.js, js/gest-riepilogo.js), `_rigaSezione`,
   `_scriviRighePrev` e `AVVISO_SEZIONI` (js/gest-sal-prezzario.js).
   Staccare quel blocco vuol dire tagliarci intorno in sei punti: si fa, ma
   non di fretta e non a fine giornata.

   ⛔ LE DUE REGOLE DI QUESTO FILE
   1. Non e' chiuso dentro niente (niente IIFE): vive nello stesso spazio
      della pagina. Un nome dichiarato anche nella pagina spegnerebbe TUTTO
      il gestionale al caricamento.
   2. Al primo livello qui non si puo' USARE niente che stia nella pagina:
      questo file parte PRIMA. Qui dentro ci sono solo funzioni, nessun
      valore calcolato in cima: per questo e' a posto.

   Il banco che protegge tutto questo:
   prove-claude/banchi-fissi/smontaggio/banco-fette.js
   ═══════════════════════════════════════════════════════════════════════ */

  /* ============================================================
     IL COMPENSO COL DECRETO PARAMETRI — DM 17 giugno 2016
     ============================================================
     A cosa serve: sui lavori PUBBLICI il compenso del professionista non se
     lo inventa lui, lo dice il decreto. La formula e':

         CP = somma di ( V x G x Q x P )

     V = importo dei lavori di quella categoria · G = quanto e' complessa
     (tavola Z-1) · Q = quanto pesa quella prestazione (tavola Z-2) ·
     P = 0,03 + 10/V^0,4 (art. 3 del decreto).

     ⛔ I NUMERI NON STANNO QUI. Stanno in js/decreto-parametri.js, letti dal
     PDF ufficiale della Gazzetta. Qui c'e' solo la schermata. Cosi' quando il
     decreto cambia si sostituisce quel file e basta, come il prezzario.

     ⛔ NIENTE FINESTRA SOPRA IL MODULO. La scheda del preventivo ha dentro
     dieci voci gia' scritte: aprire una seconda finestra le butterebbe via
     (e' la stessa ragione per cui il cliente nuovo si crea con una riga qui
     dentro, non con una finestra). Percio' questo e' un riquadro che si apre
     DENTRO il modulo, sotto le voci di costo.

     ⚠️ Se il file delle tavole non c'e' (non ancora pubblicato, oppure
     bloccato dalla rete), il pulsante non compare proprio: meglio niente
     pulsante che un pulsante che non fa niente. */
  function dpDisponibile(){
    return ruoloUtente==='professionista' && !!window.DecretoParametri;
  }
  function dpCorto(t,n){
    t=String(t||"").trim();
    return t.length>(n||70) ? t.slice(0,(n||70)).replace(/[\s,;.-]+$/,"")+"…" : t;
  }
  function dpPerc(fraz){ return Math.round((+fraz||0)*10000)/100; }

  /* ⚠️ Il punto delle migliaia nella casella dell'importo NON si scrive qui:
     lo mette js/euro-casella.js a chiunque abbia `data-euro`. La regola sta in
     un posto solo apposta — due copie si disallineano, ed e' li' che si
     nascondono i difetti. */
  function bloccoDecreto(){
    if(!dpDisponibile())return "";
    const D=window.DecretoParametri;
    const ordine=[], perGruppo={};
    D.Z1.forEach(function(c){
      if(!perGruppo[c.gruppo]){perGruppo[c.gruppo]=[];ordine.push(c.gruppo);}
      perGruppo[c.gruppo].push(c);
    });
    const opts=ordine.map(function(g){
      return '<optgroup label="'+esc(g)+'">'+perGruppo[g].map(function(c){
        return '<option value="'+esc(c.cod)+'">'+esc(c.cod+" — "+dpCorto(c.opere))+'</option>';
      }).join("")+'</optgroup>';
    }).join("");
    return `
      <button type="button" class="btn-ghost quick-add" id="dp-apri" data-action="dp-apri">📐 Calcola col decreto parametri</button>
      <div id="dp-box" class="dp-box" style="display:none">
        <div class="sh-tit" style="margin-top:0">📐 Compenso col decreto parametri</div>
        <p class="campo-aiuto" style="margin-top:0">
          Scegli la categoria dell'opera, scrivi l'importo dei lavori e spunta cosa fai.
          Le voci finiscono qui sopra, nelle voci di costo, e da lì la parcella va avanti
          come sempre: cassa, IVA e ritenuta le fa lei.</p>
        <div class="row2">
          <div class="field"><label>Categoria dell'opera (tavola Z-1)</label>
            <select id="dp-cat"><option value="">— scegli —</option>${opts}</select></div>
          <div class="field"><label>Importo dei lavori (€)</label>
            <input type="text" id="dp-v" inputmode="decimal" placeholder="Es. 250.000" autocomplete="off" data-euro></div>
        </div>
        <div id="dp-info" class="dp-info"></div>
        <div class="field"><label>Cosa fai su questo lavoro</label>
          <div id="dp-prest"></div></div>
        <div class="field">
          <label style="display:flex;align-items:flex-start;gap:10px;font-weight:600;cursor:pointer">
            <input type="checkbox" id="dp-spese" style="width:18px;height:18px;margin-top:2px;flex-shrink:0">
            <span>Aggiungi anche le spese e oneri accessori (art. 5 del decreto)</span></label>
          <div class="row2" style="margin-top:8px">
            <div class="field"><label>Percentuale sul compenso</label>
              <input type="text" id="dp-spese-perc" inputmode="decimal" autocomplete="off"></div>
            <div class="field"><label>Il tetto di legge</label>
              <div id="dp-spese-nota" class="campo-aiuto" style="margin-top:0"></div></div>
          </div>
          <p class="campo-aiuto">Sono un'altra cosa dalle «Spese (bolli, diritti, copie)» qui sotto:
            quelle sono anticipate per conto del cliente e restano fuori dall'IVA (art. 15),
            queste fanno parte del compenso e l'IVA ce l'hanno.</p>
        </div>
        <div class="prev-somma" id="dp-tot" style="text-align:left"></div>
        <div class="dp-azioni">
          <button type="button" class="btn-primary" data-action="dp-metti">Metti le voci nella parcella</button>
          <button type="button" class="btn b-cancel" data-action="dp-chiudi">Chiudi</button>
        </div>
      </div>`;
  }

  /* Rifà l'elenco delle prestazioni: cambia con la categoria (le colonne del
     decreto non sono uguali per tutti) e con l'importo (13 prestazioni hanno
     un valore diverso per fascia d'importo, a scaglioni come l'IRPEF). */
  function dpRicalcola(){
    if(!dpDisponibile())return;
    const D=window.DecretoParametri, box=$("#dp-prest"), info=$("#dp-info");
    if(!box)return;
    const cod=$("#dp-cat")?$("#dp-cat").value:"";
    const V=_numIt("#dp-v")||0;
    const c=D.categoria(cod);
    /* quello che era gia' spuntato resta spuntato */
    const scelte={};
    $$("#dp-prest input[type=checkbox]").forEach(function(x){ if(x.checked)scelte[x.getAttribute("data-cod")]=1; });
    if(!c||!(V>0)){
      if(info)info.innerHTML="Scegli la categoria e scrivi l'importo dei lavori: qui sotto compare cosa puoi mettere in conto.";
      box.innerHTML=""; dpTotale(); return;
    }
    const P=D.parametroP(V);
    if(info)info.innerHTML="Grado di complessità <b>G = "+_numTesto(c.G)+"</b> &nbsp;·&nbsp; parametro base <b>P = "
      +String(P).replace(".",",")+"</b> &nbsp;·&nbsp; <span class=\"dp-cat-nome\">"+esc(dpCorto(c.opere,130))+"</span>";
    const fasi=[], perFase={};
    D.Z2.forEach(function(p){
      const q=D.valoreQ(p.cod,cod,V);
      if(q===null||q===undefined)return;
      if(!perFase[p.fase]){perFase[p.fase]=[];fasi.push(p.fase);}
      perFase[p.fase].push({p:p,q:q,imp:_cent2(V*c.G*q*P)});
    });
    box.innerHTML=fasi.map(function(f){
      const voci=perFase[f], aperta=voci.some(function(x){return scelte[x.p.cod];});
      return '<details class="dp-fase"'+(aperta?" open":"")+'>'
        +'<summary>'+esc(f)+' <span class="dp-conta">'+voci.length+'</span></summary>'
        +voci.map(function(x){
          return '<label class="dp-voce"><input type="checkbox" data-cod="'+esc(x.p.cod)+'" data-imp="'+x.imp+'"'
            +(scelte[x.p.cod]?" checked":"")+'>'
            +'<span class="dp-nome">'+esc(x.p.nome)+'<span class="dp-q"> Q '+String(x.q).replace(".",",")+'</span></span>'
            +'<span class="dp-imp">'+eur2(x.imp)+'</span></label>';
        }).join("")
        +'</details>';
    }).join("");
    dpTotale();
  }

  /* Il totale del riquadro. Le spese sono un TETTO, non una cifra fissa:
     il decreto dice «in misura non superiore a». Se si scrive di piu', si
     riporta al massimo e si dice perché. */
  function dpTotale(){
    if(!dpDisponibile())return {compenso:0,spese:0,quante:0};
    const D=window.DecretoParametri;
    let tot=0, n=0;
    $$("#dp-prest input[type=checkbox]").forEach(function(x){
      if(x.checked){ tot+=(+x.getAttribute("data-imp")||0); n++; }
    });
    tot=_cent2(tot);
    const V=_numIt("#dp-v")||0, maxFraz=D.speseMaxPerc(V);
    const spunta=$("#dp-spese"), campo=$("#dp-spese-perc"), nota=$("#dp-spese-nota");
    let spese=0, avviso="";
    if(maxFraz!=null){
      const maxPerc=dpPerc(maxFraz);
      if(campo&&(campo.value===""||campo.getAttribute("data-auto")==="1")){
        campo.value=_numTesto(maxPerc); campo.setAttribute("data-auto","1");
      }
      if(spunta&&spunta.checked){
        let perc=_numIt("#dp-spese-perc");
        if(perc==null)perc=maxPerc;
        if(perc>maxPerc){ perc=maxPerc; if(campo)campo.value=_numTesto(maxPerc);
          avviso=" Il massimo qui è "+_numTesto(maxPerc)+"%: l'ho riportata lì."; }
        if(perc<0)perc=0;
        /* ⚠️ si arrotonda al centesimo NELLA STESSA MANIERA del resto del
           gestionale (_cent2, in js/centesimi.js, come impRiga e calcolaParcella).
           Su 4.270,98 al 25% il conto esatto fa 1.067,745: dal 29 agosto 2026
           qui esce 1.067,75 come sul database, e la fattura che nascera' da
           questa parcella dira' lo stesso numero.
           Se un giorno si cambia il modo di arrotondare, si cambia LI', non
           qui: due arrotondamenti diversi sono due totali diversi. */
        spese=_centPerc(tot,perc);
      }
      if(nota)nota.innerHTML="Non oltre il <b>"+_numTesto(maxPerc)+"%</b>."+(avviso?" ⚠️"+esc(avviso):"");
    }else if(nota)nota.innerHTML="Scrivi prima l'importo dei lavori.";
    const el=$("#dp-tot");
    if(el){
      el.innerHTML = n
        ? ("Compenso: <b>"+eur2(tot)+"</b>"
           +(spese>0?" &nbsp;·&nbsp; spese: <b>"+eur2(spese)+"</b> &nbsp;·&nbsp; in tutto: <b>"+eur2(Math.round((tot+spese)*100)/100)+"</b>":""))
        : "Spunta le prestazioni che fai: qui compare il compenso.";
    }
    return {compenso:tot, spese:spese, quante:n};
  }

  /* Porta le voci nella parcella. Una riga per prestazione, col codice
     davanti: su una gara il codice e' quello che il committente cerca. */
  function dpMetti(){
    if(!dpDisponibile())return;
    const D=window.DecretoParametri;
    const cod=$("#dp-cat")?$("#dp-cat").value:"";
    const V=_numIt("#dp-v")||0, c=D.categoria(cod);
    if(!c||!(V>0)){toast("Scegli la categoria e scrivi l'importo dei lavori");return;}
    const scelte=[];
    $$("#dp-prest input[type=checkbox]").forEach(function(x){
      if(x.checked)scelte.push({cod:x.getAttribute("data-cod"), imp:(+x.getAttribute("data-imp")||0)});
    });
    if(!scelte.length){toast("Spunta almeno una prestazione");return;}
    const r=dpTotale();
    const box=$("#prev-righe"); if(!box)return;
    /* le righe vuote del modulo appena aperto si tolgono, se no restano
       in mezzo alle voci vere e finiscono anche sul PDF */
    $$("#prev-righe [data-riga]").forEach(function(d){
      if(d.hasAttribute("data-sezione"))return;
      const de=d.querySelector(".pr-desc"), pr=d.querySelector(".pr-prezzo");
      if(de&&!String(de.value||"").trim()&&pr&&!String(pr.value||"").trim())d.remove();
    });
    box.insertAdjacentHTML("beforeend", prevRigaHtml({sezione:true,
      descrizione:"Decreto parametri — "+c.cod+" · lavori "+eur2(V)+" · G "+_numTesto(c.G)}));
    scelte.forEach(function(s){
      const p=D.prestazione(s.cod);
      box.insertAdjacentHTML("beforeend", prevRigaHtml({
        descrizione:s.cod+" — "+(p?p.nome:""), qta:1, prezzo:s.imp}));
    });
    if(r.spese>0){
      box.insertAdjacentHTML("beforeend", prevRigaHtml({
        descrizione:"Spese e oneri accessori (art. 5 del decreto)", qta:1, prezzo:r.spese}));
    }
    prevTotaleLive(); aggiornaRiepilogoParcella();
    const quante=scelte.length+(r.spese>0?1:0);
    toast(quante===1?"Una voce messa in parcella ✔":(quante+" voci messe in parcella ✔"));
    const bx=$("#dp-box"); if(bx)bx.style.display="none";
    const ap=$("#dp-apri"); if(ap)ap.style.display="";
  }

  /* Accende il riquadro quando il modulo del preventivo e' gia' sullo schermo */
  function dpAscolta(){
    if(!dpDisponibile())return;
    const cat=$("#dp-cat"); if(cat)cat.addEventListener("change",dpRicalcola);
    const v=$("#dp-v");
    if(v){
      v.addEventListener("input",dpRicalcola);
      /* il punto delle migliaia lo mette euro-casella.js in cattura, quindi
         quando arriva qui la casella e' gia' a posto; uscendo si raddrizza
         anche quello che era stato corretto in mezzo al numero */
      v.addEventListener("blur",dpRicalcola);
    }
    const pr=$("#dp-prest");if(pr)pr.addEventListener("change",dpTotale);
    const sp=$("#dp-spese");if(sp)sp.addEventListener("change",dpTotale);
    const spp=$("#dp-spese-perc");
    if(spp)spp.addEventListener("input",function(){ this.setAttribute("data-auto","0"); dpTotale(); });
    dpRicalcola();
  }
