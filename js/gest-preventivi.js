// [SPOSTATO] gest-preventivi.js: era dentro gest-core.js, righe 9229-10132, spostato identico.
  /* ============================================================
     16 agosto 2026 — LE NOTE DEL PREVENTIVO, UNA PER RIGA
     Prima era una casella sola con dentro tutto: per togliere una
     condizione bisognava cercarla in mezzo al testo e cancellarla a mano,
     stando attenti a non portarsi via la riga di sopra.
     Adesso ogni nota ha la sua riga, con la × per buttarla via e il «+»
     per aggiungerne una.
     NON cambia niente nel database: sulla colonna «note» si continua a
     scrivere il solito testo, con un a capo fra una nota e l'altra. Cosi'
     i preventivi gia' fatti si riaprono senza perdere niente e il PDF
     resta identico.
     ============================================================ */
  function prevNotaRigaHtml(txt){
    return '<div class="nota-riga" data-nota>'
      +'<textarea class="nt-txt" rows="2" placeholder="Es. Prezzi validi 30 giorni">'+esc(txt||"")+'</textarea>'
      +'<button type="button" class="rdel" data-action="prev-nota-del" title="Togli questa nota">&times;</button></div>';
  }
  function prevNoteRighe(note){
    const righe=String(note||"").split("\n").map(function(x){return x.trim();}).filter(Boolean);
    if(!righe.length)return prevNotaRigaHtml("");
    return righe.map(prevNotaRigaHtml).join("");
  }
  function prevNoteLette(){
    const out=[];
    $$("#pv-note-lista [data-nota] .nt-txt").forEach(function(t){
      const v=(t.value||"").trim(); if(v)out.push(v);
    });
    return out.length?out.join("\n"):null;
  }
  /* ============================================================
     19 agosto 2026 — I CAPITOLI DENTRO IL PREVENTIVO
     ============================================================
     Un computo si legge per capitoli: «1 Demolizioni», «2 Opere murarie», e
     dentro ognuno le sue lavorazioni. Il preventivo che ne nasceva era un
     elenco piatto: gli 87 righi di un computo vero arrivavano al cliente
     tutti attaccati, senza un titolo che dicesse dove finisce una parte e
     dove comincia l'altra.

     Una RIGA DI CAPITOLO è una riga di preventivo come le altre, con
     sezione = true. Regola che non si tocca: una riga di capitolo ha
     SEMPRE qta 0 e prezzo 0.

     Non è pignoleria, è la rete di sicurezza. In sette posti diversi il
     totale del preventivo si fa con impRiga(r.qta,r.prezzo) — il ||1
     serve alle righe scritte a mano, dove quantità vuota vuol dire "una".
     Con qta 0 e prezzo 0 quel conto fa 1 × 0 = 0: anche il punto del
     gestionale che non sa niente dei capitoli somma zero e non sbaglia
     un centesimo. Se un domani una riga di capitolo nascesse con un
     prezzo dentro, quel prezzo finirebbe nel totale che firma il cliente.

     LA COLONNA POTREBBE NON ESSERCI: chi non ha ancora eseguito
     sql/gest-preventivo-sezioni.sql non deve ritrovarsi il preventivo
     rotto. _scriviRighePrev riprova senza i capitoli e lo dice. */
  function _rigaSezione(r){ return !!(r&&r.sezione); }
  /* la colonna «sezione» manca: PostgREST risponde 42703 (undefined column) */
  function _eSezioneMancante(e){
    if(!e)return false;
    const t=(String(e.message||"")+" "+String(e.code||"")+" "+String(e.details||"")).toLowerCase();
    /* ⛔ 4 settembre 2026 — un 23502 («null value in column sezione») NON e'
       la colonna che manca: e' una riga scritta senza la chiave (il difetto
       del ribasso). Se il ripiego lo inghiotte, i capitoli spariscono in
       silenzio e la colpa va a una migrazione gia' fatta. Si lascia uscire
       l'errore vero. */
    if(t.indexOf("23502")>=0 || t.indexOf("null value")>=0) return false;
    return t.indexOf("sezione")>=0 || t.indexOf("42703")>=0;
  }
  /* ⚠️⚠️ 19 agosto 2026 — LE CHIAVI DEVONO COMBACIARE. Difetto vero, visto
     sul sito con Alessio davanti: il computo aveva il suo capitolo, il
     preventivo nasceva senza, e il banco era VERDE.

     Il perché sta dentro supabase-js. Quando gli si passa un ELENCO di
     righe, lui mette in fondo all'indirizzo ?columns=<unione di TUTTE le
     chiavi che trova> (PostgrestQueryBuilder.insert). PostgREST poi scrive
     OGNI riga con quell'elenco di colonne, e le righe a cui una chiave
     manca se la prendono a NULL: il DEFAULT della colonna NON entra in
     gioco. Su «sezione boolean NOT NULL default false» quel NULL fa saltare
     tutta la scrittura con il 23502 — e il messaggio del 23502 nomina
     «sezione», quindi finiva dritto nel ripiego qui sotto, che toglie i
     capitoli e li dà per persi. Risultato: 88 righe, zero titoli, e un
     avviso che diceva «manca l'aggiornamento del database» mentre la
     colonna c'era eccome.

     LA REGOLA, in una riga: chi scrive righe di preventivo mette «sezione»
     su TUTTE, mai su alcune sì e altre no.

     Il banco adesso lo prova: il finto Supabase rifiuta le righe con le
     chiavi diverse esattamente come quello vero.

     Scrive le voci di un preventivo. Torna {error, persi}: «persi» sono i
     capitoli lasciati fuori perché la colonna non c'è ancora — le
     lavorazioni si salvano lo stesso, che è la cosa che conta. */
  async function _scriviRighePrev(righe){
    if(!righe||!righe.length)return {error:null,persi:0};
    const {error}=await sb.from("gest_preventivo_righe").insert(righe);
    if(!error)return {error:null,persi:0};
    if(!_eSezioneMancante(error))return {error:error,persi:0};
    const senza=righe.filter(r=>!_rigaSezione(r))
                     .map(r=>{const x=Object.assign({},r);delete x.sezione;return x;});
    if(!senza.length)return {error:error,persi:0};
    const r2=await sb.from("gest_preventivo_righe").insert(senza);
    return {error:r2.error, persi:r2.error?0:(righe.length-senza.length)};
  }
  const AVVISO_SEZIONI="I capitoli non sono stati salvati: manca l'aggiornamento del database "
    +"(esegui sql/gest-preventivo-sezioni.sql su Supabase). Le lavorazioni ci sono tutte.";

  function prevRigaHtml(r){
    r=r||{};prevRigheCount++;
    /* la riga di capitolo si scrive e si cancella come tutte le altre: una
       casella sola, larga, e la × dove sta sempre. Non ha né quantità né
       prezzo, e quello che non c'è non si può sbagliare. */
    if(_rigaSezione(r)){
      return `<div class="prev-riga prev-riga-cap" data-riga data-sezione>
      <input class="pr-desc" placeholder="Es. Opere murarie" value="${esc(r.descrizione||"")}">
      <button type="button" class="rdel" data-action="prev-riga-del">×</button></div>`;
    }
    return `<div class="prev-riga" data-riga>
      <input class="pr-desc" placeholder="Es. Demolizione tramezzo" value="${esc(r.descrizione||"")}">
      <input class="pr-qta" type="text" inputmode="decimal" placeholder="Es. 12" value="${_numTesto(r.qta!=null?r.qta:1)}">
      <input class="pr-prezzo" type="text" inputmode="decimal" placeholder="Es. 24,00" value="${_prezzoCasella(r.prezzo)}" data-euro>
      <button type="button" class="rdel" data-action="prev-riga-del">×</button></div>`;
  }
  /* ============================================================
     ⛔ 22 agosto 2026 — IL TOTALE E' LA SOMMA DI QUELLO CHE SI STAMPA
     ============================================================
     Segnalato da Alessio: su un preventivo vero il totale in fondo non era
     la somma delle righe stampate — ballavano tre centesimi, e poi la
     fattura non tornava.

     Il motivo: ogni riga si STAMPA arrotondata al centesimo, ma nel totale
     entrava il numero intero, con tutti i decimali.
     Esempio: 2,5 x 12,345 = 30,8625. Sul foglio si legge «30,86», nel totale
     entrava 30,8625. Con dieci righe cosi' il cliente somma con la
     calcolatrice e non trova lo stesso numero.

     ⛔ La regola: l'importo di una riga si arrotonda PRIMA di sommarlo. E'
     la stessa cosa gia' fatta il 20 agosto sul computo («l'importo si fa con
     LO STESSO prezzo di sopra, non con un altro»).

     ⚠️ E STA IN UN POSTO SOLO. Prima quel conto era scritto a mano in
     QUATTORDICI punti: l'elenco, il Riepilogo, il modulo, il PDF, la
     parcella, l'IVA, il verbale, l'esportazione. Quattordici occasioni per
     dimenticarsene una. Adesso chi somma chiede a `impRiga()`.

     ⚠️ `qta` vuota vale 1 (una voce «a corpo» non ha una quantita'), e il
     prezzo vuoto vale 0: erano gia' cosi', non si cambia. */
  function impRiga(qta,prezzo){
    return _centMult((+qta||1),(+prezzo||0));
  }

  function prevTotaleLive(){
    /* le righe di capitolo si saltano apposta. Senza il salto il conto
       tornerebbe comunque (non hanno .pr-qta né .pr-prezzo, quindi 1 × 0),
       ma è meglio che qui si legga la regola invece di fidarsi di un caso. */
    let t=0;$$("#prev-righe [data-riga]").forEach(d=>{
      if(d.hasAttribute("data-sezione"))return;
      t+=impRiga(_numRiga(d,".pr-qta",1),_numRiga(d,".pr-prezzo",0));});
    const el=$("#prev-somma");if(el)el.textContent="Totale: "+eur2(t);
    return t;
  }
  /* ===== 6 agosto 2026 — LA PARCELLA (solo studi professionali) =====
     Il preventivo di un'impresa è la somma delle voci e basta. La parcella no:
       compenso  ->  + cassa (sul compenso)  ->  IVA su (compenso+cassa+spese)
       ->  - ritenuta 20% (SOLO sul compenso)  =  da incassare
     La cassa è il "contributo integrativo": 4% Inarcassa (architetti e ingegneri),
     5% Cassa Geometri e Periti. La ritenuta si applica SOLO se il cliente è
     sostituto d'imposta (azienda, professionista, condominio): con un privato no.
     Le spese (bolli, diritti) entrano nell'IVA ma NON nella base della ritenuta.
     Colonne DB: sql/gest-parcella-professionisti.sql
     Riferimento del calcolo: Fiscozen, "Calcolo fattura con cassa professionale". */
  function calcolaParcella(compenso, cassaPerc, ivaPerc, conRitenuta, ritPerc, spese){
    compenso=+compenso||0; spese=+spese||0;
    cassaPerc=+cassaPerc||0; ivaPerc=+ivaPerc||0; ritPerc=+ritPerc||0;
    /* ===== 16 agosto 2026 — IL PREVENTIVO E LA FATTURA DICEVANO DUE NUMERI =====
       Su una parcella su quattro (26,78% misurato su 200.000 casi) il totale
       del preventivo e quello della fattura nata da lui differivano di uno o
       due centesimi. Il cliente firma 12.757,18 e riceve una fattura da
       12.757,19: sembra una sciocchezza, ma e' il numero su cui si discute.

       La causa: la FATTURA arrotonda al centesimo mano a mano (glielo impone
       il file per lo SDI, dove ogni voce e' scritta a due decimali), il
       preventivo arrotondava solo alla fine.

       Si e' portato il preventivo a seguire la fattura, mai il contrario: la
       fattura non si puo' toccare, e' quella che va all'Agenzia. L'ordine qui
       sotto e' lo STESSO di `fattBasi`, riga per riga.
       ⚠️ Se un giorno si tocca fattBasi, va toccata anche questa: c'e' la
       prova `prove/banco_conti.js` che le confronta su 200.000 parcelle. */
    const r2=n=>_cent2(n);
    const cassa      = _centPerc(compenso,cassaPerc);
    /* ===== 13 agosto 2026 — ANCHE QUI LE SPESE ESCONO DALL'IVA =====
       La casella del preventivo dice "Spese (bolli, diritti, copie)": sono le
       spese anticipate in nome e per conto del cliente, escluse dalla base
       imponibile per l'art. 15 del DPR 633/72. L'IVA non ci va.
       Prima ce la metteva, e da quando la FATTURA ha imparato la regola giusta
       i due documenti si erano scollati: il cliente firmava un preventivo da
       5.527 € e si vedeva arrivare una fattura da 5.494. Adesso tornano.
       Attenzione: "imponibile" qui resta la somma di tutto quello che si
       addebita, perche' e' il numero che si legge sul preventivo; l'IVA pero'
       si calcola su baseIva, che le spese non le contiene. */
    const baseIva    = r2(r2(compenso) + cassa);
    const imponibile = r2(baseIva + spese);
    const iva        = _centPerc(baseIva,ivaPerc);
    const ritenuta   = conRitenuta ? r2(compenso)*ritPerc/100 : 0;  /* solo sul compenso */
    const totale     = imponibile + iva - ritenuta;
    return {compenso:r2(compenso),cassa:r2(cassa),spese:r2(spese),baseIva:r2(baseIva),
            imponibile:r2(imponibile),
            iva:r2(iva),ritenuta:r2(ritenuta),totale:r2(totale)};
  }
  function bloccoParcella(p){
    if(ruoloUtente!=='professionista')return "";
    p=p||{};
    const cassa=p.cassa_perc!=null?p.cassa_perc:4;
    const iva=p.iva_perc!=null?p.iva_perc:22;
    const rit=!!p.ritenuta;
    const spese=p.spese_forfait!=null?p.spese_forfait:"";
    /* ===== 12 agosto 2026 (sera) — LA CASSA AL 2% SPARIVA IN FATTURA =====
       Qui c'erano quattro percentuali fisse (0, 2, 4, 5%) e in fattura ce
       n'erano altre: il 2% non esisteva di la', quindi passando il preventivo
       in fattura la tendina non trovava la sua voce, ripartiva da «Nessuna
       cassa» e quei soldi sparivano dal documento senza dire niente. Su una
       parcella da 10.000 € sono 200 €.
       Adesso qui si scrive la PERCENTUALE, come in fattura: qualunque numero
       passa di la' intero, e non ci sono piu' due elenchi da tenere allineati.
       Quale cassa sia lo si dice in fattura, che e' l'unico posto dove serve
       (lo vuole il file elettronico). */
    /* ===== 12 agosto 2026 (sera) — IL FORFETTARIO =====
       In regime forfettario (RF19) non si applica l'IVA e non si subisce la
       ritenuta d'acconto: la fattura lo sapeva gia' e metteva tutto a zero, il
       preventivo no. Risultato: il cliente riceveva un preventivo con l'IVA al
       22% e poi una fattura piu' bassa, per lo stesso lavoro. Adesso i due
       documenti dicono lo stesso numero, e il perche' e' scritto sotto. */
    const forf=fattForfettario();
    const ivaVera=forf?0:iva;
    const opzIva=(forf
        ? [[0,"0% — sei in regime forfettario, l'IVA non si applica"]]
        : [[22,"22% — ordinaria"],[10,"10% — agevolata"],[0,"0% — esente / forfettario"]])
      .map(o=>`<option value="${o[0]}" ${(+ivaVera===o[0])?"selected":""}>${o[1]}</option>`).join("");
    return `
      <div class="field" style="border-top:1px solid var(--linea,#e5e7eb);padding-top:14px;margin-top:14px">
        <label style="font-size:15px;font-weight:800;color:var(--blu,#0066ff)">🧾 Parcella</label>
      </div>
      <div class="row2">
        <div class="field"><label>Contributo cassa (%)</label><input type="text" inputmode="decimal" id="pv-cassa" value="${_numTesto(cassa)}" placeholder="Es. 4" autocomplete="off"></div>
        <div class="field"><label>IVA</label><select id="pv-iva">${opzIva}</select></div>
      </div>
      <div class="field"><label>Spese (bolli, diritti, copie)</label><input type="text" id="pv-spese" inputmode="decimal" value="${_numTesto(spese)}" placeholder="0" data-euro></div>
      <div class="field">
        <label style="display:flex;align-items:flex-start;gap:10px;font-weight:600;cursor:pointer">
          <input type="checkbox" id="pv-rit" ${(!forf&&rit)?"checked":""} ${forf?"disabled":""} style="width:18px;height:18px;margin-top:2px;flex-shrink:0">
          <span>Applica la ritenuta d'acconto del 20%</span>
        </label>
        <p style="font-size:13px;color:var(--testo-3,#7a8896);line-height:1.55;margin:8px 0 0">
          ${forf
            ? "In regime forfettario la ritenuta d'acconto <strong>non si applica</strong>: sulla fattura va scritto che il compenso non &egrave; soggetto a ritenuta."
            : "Va messa solo se il cliente &egrave; <strong>azienda, professionista o condominio</strong>. Se il cliente &egrave; un privato, lasciala vuota."}
        </p>
      </div>
      ${forf?`<p class="sh-nota" style="border-left:4px solid var(--blu,#0066ff);padding-left:10px;margin-top:12px">
        <b>Sei in regime forfettario.</b> Niente IVA e niente ritenuta: il preventivo dice
        gi&agrave; lo stesso numero della fattura. Ricorda il <b>bollo da 2 &euro;</b> quando
        il totale supera i 77,47 &euro; &mdash; si aggiunge al momento della fattura.</p>`:""}
      <div id="pv-riepilogo" class="prev-somma" style="text-align:left;line-height:1.9"></div>`;
  }
  /* Riscrive il riepilogo della parcella ogni volta che si tocca qualcosa */
  function aggiornaRiepilogoParcella(){
    if(ruoloUtente!=='professionista')return;
    const box=$("#pv-riepilogo"); if(!box)return;
    let compenso=0;
    $$("#prev-righe [data-riga]").forEach(d=>{
      compenso += impRiga(_numRiga(d,".pr-qta",1),_numRiga(d,".pr-prezzo",0));
    });
    const c=calcolaParcella(compenso, _numIt("#pv-cassa")||0, $("#pv-iva")?$("#pv-iva").value:0,
      $("#pv-rit")?$("#pv-rit").checked:false, 20, _numIt("#pv-spese")||0);
    const riga=(et,val,neg)=>`<div style="display:flex;justify-content:space-between;gap:12px"><span>${et}</span><strong>${neg?"− ":""}${eur2(val)}</strong></div>`;
    box.innerHTML =
      riga("Compenso", c.compenso) +
      (c.spese?riga("Spese", c.spese):"") +
      (c.cassa?riga("Cassa previdenziale", c.cassa):"") +
      `<div style="border-top:1px solid var(--linea,#e5e7eb);margin:6px 0"></div>` +
      /* 13 agosto 2026 — non e' piu' "Imponibile IVA": le spese anticipate
         stanno dentro questo numero ma l'IVA non ce l'hanno (art. 15), quindi
         chi provasse a farci sopra il 22% non tornerebbe. */
      riga(c.spese?"Totale imponibile":"Imponibile IVA", c.imponibile) +
      (c.iva?riga("IVA", c.iva):"") +
      (c.ritenuta?riga("Ritenuta d'acconto", c.ritenuta, true):"") +
      `<div style="border-top:2px solid var(--blu,#0066ff);margin:6px 0"></div>` +
      `<div style="display:flex;justify-content:space-between;gap:12px;font-size:17px"><span><strong>Da incassare</strong></span><strong>${eur2(c.totale)}</strong></div>`;
  }
  function leggiCampiParcella(){
    if(ruoloUtente!=='professionista')return {};
    /* rete di sicurezza: in forfettario si salva zero comunque, anche se il
       modulo fosse rimasto aperto da prima del cambio di regime */
    const forf=fattForfettario();
    return {
      cassa_perc:_numIt("#pv-cassa")||0,
      iva_perc:forf?0:(+($("#pv-iva")?$("#pv-iva").value:0)||0),
      ritenuta:forf?false:($("#pv-rit")?$("#pv-rit").checked:false),
      ritenuta_perc:20,
      spese_forfait:_numIt("#pv-spese")||0
    };
  }
  function eColonnaParcellaMancante(err){
    const m=(err&&err.message)||"";
    return /cassa_perc|iva_perc|ritenuta|spese_forfait/i.test(m) && /column|schema cache/i.test(m);
  }
  function senzaCampiParcella(obj){
    const o=Object.assign({},obj);
    ["cassa_perc","iva_perc","ritenuta","ritenuta_perc","spese_forfait"].forEach(k=>delete o[k]);
    return o;
  }

  /* ===== 9 agosto 2026 — L'IVA nel preventivo di imprese e artigiani =====
     La FATTURA dell'impresa aveva già l'IVA riga per riga; il PREVENTIVO no:
     mostrava solo la somma delle voci e il PDF se la cavava con "prezzi IVA
     esclusa". Ma un cliente privato ragiona sul totale finito: un preventivo
     di 10.000 che in fattura diventa 11.000 è una lite sicura.
     Riusa la colonna `iva_perc` che c'e' gia' (la usa la parcella): nessun SQL.
     Retrocompatibile: sui preventivi vecchi iva_perc è vuota e allora tutto
     resta esattamente come prima, "IVA esclusa".
     In edilizia il 10% è il caso più comune (ristrutturazione), il 4% la
     prima casa: le stesse aliquote già usate dalle fatture (IVA_SCELTE). */
  function bloccoIvaImpresa(p){
    if(ruoloUtente==='professionista')return "";   /* loro hanno la parcella */
    p=p||{};
    const val=(p.iva_perc==null||p.iva_perc==="")?"":String(+p.iva_perc);
    const opz=[["","— non indicata (prezzi IVA esclusa)"],["22","22% — ordinaria"],
               ["10","10% — ristrutturazione"],["4","4% — prima casa"],["0","0% — non applicata"]]
      .map(o=>'<option value="'+o[0]+'" '+(o[0]===val?'selected':'')+'>'+o[1]+'</option>').join("");
    return '<div class="field" style="border-top:1px solid var(--linea,#e5e7eb);padding-top:14px;margin-top:14px">'
      +'<label style="font-size:15px;font-weight:800;color:var(--blu,#0066ff)">\ud83d\udcb6 IVA e totale</label>'
      +'</div>'
      +'<div class="field"><label>Aliquota IVA</label><select id="pv-iva-imp">'+opz+'</select>'
      +'<div class="campo-aiuto">Scegliendo un\'aliquota, sul PDF il cliente vede anche il <b>totale finito</b>. Lasciandola su "non indicata" il preventivo resta come prima.</div></div>'
      +'<div id="pv-riep-imp" class="prev-somma" style="text-align:left;line-height:1.9"></div>';
  }
  function aggiornaRiepilogoIvaImpresa(){
    if(ruoloUtente==='professionista')return;
    const box=$("#pv-riep-imp"); if(!box)return;
    const sel=$("#pv-iva-imp");
    if(!sel||sel.value===""){box.innerHTML="";return;}
    let imponibile=0;
    $$("#prev-righe [data-riga]").forEach(d=>{
      imponibile += impRiga(_numRiga(d,".pr-qta",1),_numRiga(d,".pr-prezzo",0));
    });
    /* il totale si somma sull'IVA GIA' arrotondata ai centesimi, se no le due
       righe non tornano: imponibile 1.000,05 + IVA 100,01 fa 1.100,06, non
       1.100,05. Il cliente che rifa' la somma a mano trova l'errore. */
    const perc=+sel.value||0;
    const iva=_centPerc(imponibile,perc);
    const tot=_cent2(imponibile+iva);
    const riga=(et,v)=>'<div style="display:flex;justify-content:space-between;gap:12px"><span>'+et+'</span><strong>'+eur2(v)+'</strong></div>';
    box.innerHTML = riga("Imponibile",imponibile)
      + riga("IVA "+_pct(perc)+"%",iva)
      + '<div style="border-top:2px solid var(--blu,#0066ff);margin:6px 0"></div>'
      + '<div style="display:flex;justify-content:space-between;gap:12px;font-size:17px"><span><strong>Totale per il cliente</strong></span><strong>'+eur2(tot)+'</strong></div>';
  }
  function leggiCampiIvaImpresa(){
    if(ruoloUtente==='professionista')return {};
    const sel=$("#pv-iva-imp");
    if(!sel)return {};
    return {iva_perc: sel.value===""?null:(+sel.value||0)};
  }

  async function prevForm(p,preset,aiApri){
    const isNew=!p;p=p||{};
    /* precompilato: stessa idea di fattForm(f,preset). Vale solo sui nuovi. */
    if(isNew&&preset)p=Object.assign({},preset);
    let cl=[],righe=[];
    if(sb&&sbUid){
      const {data}=await sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).or(_cliOr(curMestiere())).order("nome");cl=data||[];
      /* 12 agosto 2026 (sera) — serve sapere il REGIME FISCALE: un forfettario
         non mette l'IVA e non subisce la ritenuta. Prima il preventivo non
         guardava i dati dell'azienda, proponeva il 22% a tutti, e chi e' in
         forfettario mandava al cliente un preventivo con l'IVA che poi in
         fattura spariva: due numeri diversi per lo stesso lavoro. */
      if(!fattAzienda){
        const {data:_az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
        fattAzienda=_az||null;
      }
      /* stessa rete di sicurezza della fattura: savePrev cancella le voci e le
         riscrive, quindi un modulo aperto vuoto per colpa della rete
         svuoterebbe il preventivo con un bel "Salvato" verde. */
      /* 22 agosto 2026 — una parcella NUOVA puo' nascere gia' con le sue
         righe: e' il pulsante «Porta le ore nella parcella». Prima le righe
         si leggevano solo da un preventivo che esisteva gia', quindi un
         precompilato poteva portare il cliente e il titolo ma non le voci. */
      if(isNew&&preset&&preset._righe&&preset._righe.length){
        righe=preset._righe;
      }
      if(p.id){
        const {data:rr,error:erP}=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",p.id).order("ordine");
        if(erP){
          toast("Non riesco a leggere le voci del preventivo: "+(erP.message||"il database non risponde")
                +". Non apro il modulo, se no rischi di svuotarlo. Riprova fra un attimo.");
          return;
        }
        righe=rr||[];
      }
    }
    const cliOpts=cl.map(c=>`<option value="${c.id}" ${c.id===p.cliente_id?"selected":""}>${esc(c.nome)}</option>`).join("");
    /* Modulo lungo -> modale grande: a sinistra l'intestazione del preventivo,
       a destra le voci di costo, che sono la parte che ha bisogno di spazio. */
    openSheetGrande(isNew?"Nuovo preventivo":"Preventivo N. "+p.numero,
      /* 16 agosto 2026 — questa finestra non aveva le zone (le schede bianche
         con la riga blu) perche' dentro aveva campi sciolti invece dei
         blocchi .sh-b, che le altre finestre hanno gia'. Ora ce li ha:
         «Che preventivo e'», «Le voci di costo» e il conto. */
      `<div class="sh-cols"><div class="sh-col">
      <div class="sh-b">
      <div class="sh-tit">Che preventivo è</div>
      ${isNew?aiRigaHTML('preventivo'):''}
      <div class="field"><label>Titolo</label><input id="pv-tit" value="${esc(p.titolo||"")}" placeholder="Es. Rifacimento bagno completo"></div>
      <div class="row2">
        <!-- ⛔ 22 agosto 2026 — IL CLIENTE NUOVO SENZA USCIRE DAL PREVENTIVO.
             Segnalato da Alessio con la pagina davanti: nella scheda del
             LAVORO c'e' «+ Aggiungi nuovo cliente», nel preventivo no. Ti
             toccava uscire, creare il cliente e ricominciare.
             ⛔ NIENTE APICI ROVESCI QUI DENTRO: questo commento sta dentro
             una stringa a template di JavaScript, e un apice rovescio la
             chiude — il file smette di funzionare tutto insieme, in
             silenzio. E' la SECONDA volta oggi.
             ⚠️ Il pulsante del lavoro (quick-cli) apre il modulo del
             cliente AL POSTO di questo e avvisa che quello che hai scritto
             va perso: su un lavoro sono tre caselle, su un preventivo sono
             dieci voci. Qui non si puo' fare cosi'.
             ⛔ E niente finestre sopra: si scrive il NOME e basta, nella
             riga dove stava la tendina. Il resto della scheda cliente
             (telefono, indirizzo) si completa dopo, dai Clienti. -->
        <div class="field"><label>Cliente</label>
          <select id="pv-cli"><option value="">— nessuno —</option>${cliOpts}</select>
          <div id="pv-cli-nuovo" style="display:none;margin-top:8px">
            <div class="spesa-add" style="margin:0">
              <input id="pv-cli-nome" placeholder="Nome del cliente (es. Rossi Mario)" autocomplete="off">
              <button type="button" class="btn" data-action="pv-cli-salva">Aggiungi</button>
              <button type="button" class="btn b-cancel" data-action="pv-cli-annulla">Annulla</button>
            </div>
            <div class="campo-aiuto">Basta il nome: telefono e indirizzo li metti dopo, dai Clienti.</div>
          </div>
          <button type="button" class="btn-ghost quick-add" id="pv-cli-apri" data-action="pv-cli-nuovo">+ Nuovo cliente</button></div>
        <div class="field"><label>Data</label><input type="date" id="pv-data" value="${p.data||todayStr()}"></div></div>
      <div class="field"><label>Note (compaiono sul PDF)</label>
        <div id="pv-note-lista">${prevNoteRighe(p.note)}</div>
        <button type="button" class="btn-ghost quick-add" data-action="prev-nota-add">+ Aggiungi nota</button>
        <div class="campo-aiuto">Una nota per riga. Sul PDF escono una sotto l'altra, nell'ordine in cui stanno qui.</div></div>
      </div>
      </div><div class="sh-col">
      <div class="sh-b">
      <div class="sh-tit">Le voci di costo</div>
      ${p._noteOre?`<div class="sh-nota" style="margin-top:0">⏱ ${esc(p._noteOre)}</div>`:""}
      <div class="field">
        <div id="prev-righe">${(righe.length?righe:[{}]).map(r=>prevRigaHtml(r)).join("")}</div>
        <button type="button" class="btn-ghost quick-add" data-action="prev-riga-add">+ Aggiungi voce</button>
        <button type="button" class="btn-ghost quick-add" data-action="prev-cap-add">+ Aggiungi capitolo</button>
        ${bloccoDecreto()}
        <div class="prev-somma" id="prev-somma">Totale: ${eur2(righe.reduce((s,r)=>s+impRiga(r.qta,r.prezzo),0))}</div></div>
      </div>
      <div class="sh-b">
      ${bloccoParcella(p)}
      ${bloccoIvaImpresa(p)}
      </div>
      </div></div>`,
      `${ctrTastoHTML('preventivo')}
       <button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-prev" data-id="${p.id||""}">${isNew?"Crea preventivo":"Salva"}</button>`);
    $("#prev-righe").addEventListener("input",prevTotaleLive);
    /* parcella: il riepilogo si ricalcola sia cambiando le voci sia le percentuali */
    if(ruoloUtente==='professionista'){
      $("#prev-righe").addEventListener("input",aggiornaRiepilogoParcella);
      ["pv-cassa","pv-iva","pv-spese","pv-rit"].forEach(function(id){
        const el=$("#"+id); if(el)el.addEventListener("change",aggiornaRiepilogoParcella);
        if(el&&el.tagName==="INPUT"&&el.type!=="checkbox")el.addEventListener("input",aggiornaRiepilogoParcella);
      });
      aggiornaRiepilogoParcella();
      dpAscolta();
    }else{
      /* imprese e artigiani: il totale con l'IVA si aggiorna mentre si scrive */
      $("#prev-righe").addEventListener("input",aggiornaRiepilogoIvaImpresa);
      const selIva=$("#pv-iva-imp");
      if(selIva)selIva.addEventListener("change",aggiornaRiepilogoIvaImpresa);
      aggiornaRiepilogoIvaImpresa();
    }
    /* la riga dell'AI si accende per ultima, quando le caselle ci sono gia' */
    if(isNew)aiRigaVia('preventivo',!!aiApri);
    /* il controllore vale sui preventivi NUOVI e su quelli GIA' FATTI:
       il momento in cui serve davvero e' un attimo prima di «Scarica PDF» */
    ctrAscolta('preventivo');
  }
  /* ⛔ 22 agosto 2026 — crea il cliente col solo NOME e lo sceglie subito.
     Niente finestre, niente uscita dal preventivo, niente perdita di quello
     che hai gia' scritto. */
  async function pvCliSalva(){
    const campo=$("#pv-cli-nome"), sel=$("#pv-cli");
    if(!campo||!sel)return;
    const nome=String(campo.value||"").trim();
    if(!nome){toast("Scrivi il nome del cliente");campo.focus();return;}
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    /* ⚠️ se un cliente con quello stesso nome c'e' gia', NON se ne crea un
       secondo: si sceglie quello. Due «Rossi Mario» in rubrica sono un
       guaio che si scopre mesi dopo, sulle fatture. */
    const uguale=(cliCache||[]).find(c=>_aiNorm(c.nome)===_aiNorm(nome));
    if(uguale){
      sel.value=uguale.id;
      sel.dispatchEvent(new Event("change",{bubbles:true}));
      $("#pv-cli-nuovo").style.display="none";
      const ap0=$("#pv-cli-apri"); if(ap0)ap0.style.display="";
      toast("Quel cliente c'era già: l'ho scelto");
      return;
    }
    const {data,error}=await sb.from("gest_clienti")
      .insert({user_id:sbUid,mestiere_id:curMestiere(),nome:nome,tipo:"privato"})
      .select("id,nome");
    if(error){toast("Non sono riuscito a creare il cliente: "+error.message);return;}
    if(!data||!data.length){toast("Cliente non creato: nessuna riga scritta. Riprova.");return;}
    const c=data[0];
    cliCache.push({id:c.id,nome:c.nome||nome});
    /* la nuova opzione si mette in ordine alfabetico, come l'elenco */
    const opt=document.createElement("option");
    opt.value=c.id; opt.textContent=c.nome||nome;
    let messo=false;
    for(let i=1;i<sel.options.length;i++){
      if(_aiNorm(sel.options[i].textContent)>_aiNorm(opt.textContent)){sel.insertBefore(opt,sel.options[i]);messo=true;break;}
    }
    if(!messo)sel.appendChild(opt);
    sel.value=c.id;
    sel.dispatchEvent(new Event("change",{bubbles:true}));
    $("#pv-cli-nuovo").style.display="none";
    const ap=$("#pv-cli-apri"); if(ap)ap.style.display="";
    rinfresca("clienti");
    toast("Cliente aggiunto ✔");
  }

  async function savePrev(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const titolo=$("#pv-tit").value.trim();if(!titolo){toast("Scrivi il titolo del preventivo");return;}
    const righe=[];
    $$("#prev-righe [data-riga]").forEach((d,i)=>{
      const el=d.querySelector(".pr-desc");
      const descrizione=el?el.value.trim():"";
      if(!descrizione)return;
      /* «sezione» si scrive su TUTTE le righe, non solo sui capitoli: in una
         scrittura di piu' righe insieme le chiavi devono combaciare (vedi
         _scriviRighePrev). Se la colonna non c'è ancora, _scriviRighePrev
         riscrive senza e lo dice. */
      if(d.hasAttribute("data-sezione")){
        righe.push({descrizione,qta:0,prezzo:0,sezione:true,ordine:i});
        return;
      }
      righe.push({descrizione,qta:_numRiga(d,".pr-qta",1),prezzo:_numRiga(d,".pr-prezzo",0),sezione:false,ordine:i});
    });
    /* un preventivo fatto di soli titoli non è un preventivo */
    if(!righe.filter(r=>!_rigaSezione(r)).length){toast("Aggiungi almeno una voce");return;}
    const cliente_id=$("#pv-cli").value||null, data=$("#pv-data").value||todayStr(), note=prevNoteLette();
    let pid=id, vecchieVoci=[];
    const parcella=Object.assign({},leggiCampiParcella(),leggiCampiIvaImpresa());
    let avvisoParcella=false;
    if(id){
      const mod=Object.assign({titolo,cliente_id,data,note},parcella);
      let {data:okPrev,error}=await sb.from("gest_preventivi").update(mod).eq("id",id).eq("user_id",sbUid).select("id");
      if(error&&eColonnaParcellaMancante(error)){
        const rip=await sb.from("gest_preventivi").update(senzaCampiParcella(mod)).eq("id",id).eq("user_id",sbUid).select("id");
        okPrev=rip.data;error=rip.error;
        if(!error)avvisoParcella=true;
      }
      if(error){toast("Errore: "+error.message);return;}
      if(!okPrev||!okPrev.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
      /* come per le fatture: prima si scrivono le nuove voci, poi si tolgono le
         vecchie. Al contrario, un inserimento andato male lasciava il
         preventivo COMPLETAMENTE VUOTO e non c'era modo di recuperarlo. */
      const {data:veccP,error:eVecP}=await sb.from("gest_preventivo_righe").select("id").eq("preventivo_id",id).eq("user_id",sbUid);
      if(eVecP){toast("Non riesco a leggere le voci di prima: "+eVecP.message);return;}
      vecchieVoci=(veccP||[]).map(r=>r.id);
    }else{
      /* ===== 13 agosto 2026 — IL NUMERO NON GUARDAVA NE' L'ANNO NE' IL REPARTO
         Era un contatore unico che cresceva e basta: a gennaio non ripartiva da
         1, e due reparti si passavano la stessa serie (il giardiniere faceva il
         n.40 perche' l'edile era arrivato al 39). Le fatture ripartono da 1 ogni
         anno; i preventivi adesso ripartono da 1 ogni anno DENTRO OGNI REPARTO,
         che e' la promessa scritta sulla pagina di scelta: «ogni reparto e'
         separato». Si continua a guardare anche nel Cestino, se no eliminato
         l'ultimo il prossimo riprende lo stesso numero. */
      const _annoPrev=String(data||todayStr()).slice(0,4);
      const _midPrev=curMestiere();
      let numero=prevCache.filter(p=>String(p.data||"").slice(0,4)===_annoPrev)
                          .reduce((m,p)=>Math.max(m,+p.numero||0),0)+1;
      try{
        const _sbP=(sb.raw||sb.from.bind(sb));
        const {data:maxP,error:eP}=await _sbP("gest_preventivi").select("numero")
          .eq("user_id",sbUid).eq("mestiere_id",_midPrev)
          .gte("data",_annoPrev+"-01-01").lte("data",_annoPrev+"-12-31")
          .order("numero",{ascending:false}).limit(1);
        /* se la lettura non riesce non si tira a indovinare: dare per buono
           «0+1» vorrebbe dire un preventivo n.1 a dicembre, sopra uno che c'e' gia' */
        if(eP){toast("Numero non assegnato: "+eP.message);return;}
        const nMax=(maxP&&maxP[0]&&+maxP[0].numero)||0;
        if(nMax+1>numero)numero=nMax+1;
      }catch(e){toast("Numero non assegnato: riprova");return;}
      const nuovo=Object.assign({user_id:sbUid,mestiere_id:curMestiere(),titolo,cliente_id,data,note,numero,stato:"bozza"},parcella);
      let {data:np,error}=await sb.from("gest_preventivi").insert(nuovo).select().single();
      if(error&&eColonnaParcellaMancante(error)){
        const rip=await sb.from("gest_preventivi").insert(senzaCampiParcella(nuovo)).select().single();
        np=rip.data;error=rip.error;
        if(!error)avvisoParcella=true;
      }
      if(error){toast("Errore: "+error.message);return;}
      pid=np.id;
    }
    const {error:e2,persi:persiSez}=await _scriviRighePrev(righe.map(r=>({...r,user_id:sbUid,preventivo_id:pid})));
    if(e2){toast("Errore voci: "+e2.message+" — quelle di prima sono ancora al loro posto.");return;}
    if(vecchieVoci.length){
      const {error:eDelP}=await sb.from("gest_preventivo_righe").delete().in("id",vecchieVoci).eq("user_id",sbUid);
      if(eDelP){toast("Le voci nuove sono salvate, ma le vecchie non si sono cancellate: adesso sono doppie. Riapri e salva di nuovo.");return;}
    }
    closeSheet();rinfresca("preventivi","riepilogo");
    toast(persiSez?AVVISO_SEZIONI:(avvisoParcella?(ruoloUtente==='professionista'
            ?"Salvato, ma i dati della parcella NON ci sono: manca la migrazione SQL"
            :"Salvato, ma l'aliquota IVA NON è stata registrata: manca un aggiornamento del database"):(id?"Preventivo aggiornato ✔":"Preventivo creato ✔")));
  }
  /* Ponte per js/ai-integrazione.js: salva un preventivo generato dall'AI.
     Riusa curMestiere() e la stessa formula del numero progressivo di savePrev. */
  window.gestSalvaPreventivoAI = async function(titolo, voci, note){
    try{
      if(!sbUid) return {ok:false, error:"Non sei loggato"};
      titolo=(titolo||"").trim();
      if(!titolo) return {ok:false, error:"Titolo mancante"};
      const righe=(Array.isArray(voci)?voci:[]).map((v,i)=>{
        let desc=(v.descrizione||"").trim();
        if(v.unita) desc+=" ("+String(v.unita).trim()+")";
        return {user_id:sbUid, descrizione:desc, qta:+v.quantita||1, prezzo:+v.prezzo_unitario||0, ordine:i};
      }).filter(r=>r.descrizione);
      if(!righe.length) return {ok:false, error:"Nessuna voce valida"};
      /* ===== 13 agosto 2026 — IL NUMERO NON GUARDAVA NE' L'ANNO NE' IL REPARTO
         Era un contatore unico che cresceva e basta: a gennaio non ripartiva da
         1, e due reparti si passavano la stessa serie (il giardiniere faceva il
         n.40 perche' l'edile era arrivato al 39). Le fatture ripartono da 1 ogni
         anno; i preventivi adesso ripartono da 1 ogni anno DENTRO OGNI REPARTO,
         che e' la promessa scritta sulla pagina di scelta: «ogni reparto e'
         separato». Si continua a guardare anche nel Cestino, se no eliminato
         l'ultimo il prossimo riprende lo stesso numero. */
      const _annoPrev=todayStr().slice(0,4);
      const _midPrev=curMestiere();
      let numero=prevCache.filter(p=>String(p.data||"").slice(0,4)===_annoPrev)
                          .reduce((m,p)=>Math.max(m,+p.numero||0),0)+1;
      try{
        const _sbP=(sb.raw||sb.from.bind(sb));
        const {data:maxP,error:eP}=await _sbP("gest_preventivi").select("numero")
          .eq("user_id",sbUid).eq("mestiere_id",_midPrev)
          .gte("data",_annoPrev+"-01-01").lte("data",_annoPrev+"-12-31")
          .order("numero",{ascending:false}).limit(1);
        if(eP) return {ok:false, error:"Numero non assegnato: "+eP.message};
        const nMax=(maxP&&maxP[0]&&+maxP[0].numero)||0;
        if(nMax+1>numero)numero=nMax+1;
      }catch(e){ return {ok:false, error:"Numero non assegnato: riprova"}; }
      const {data:np,error}=await sb.from("gest_preventivi").insert({user_id:sbUid,mestiere_id:curMestiere(),titolo,note:note||null,data:todayStr(),stato:"bozza",numero}).select().single();
      if(error) return {ok:false, error:error.message};
      const {error:e2}=await sb.from("gest_preventivo_righe").insert(righe.map(r=>({...r,preventivo_id:np.id})));
      if(e2) return {ok:false, error:e2.message};
      rinfresca("preventivi","riepilogo");
      return {ok:true, id:np.id};
    }catch(e){ return {ok:false, error:(e&&e.message)||String(e)}; }
  };
  window.gestToast = function(m){ toast(m); };
  /* ===== 9 agosto 2026 — il preventivo accettato non deve fare doppioni =====
     Prima creava SEMPRE una riga nuova. Il percorso normale di un tecnico è:
     apre la pratica (con Comune, protocollo, catastali) -> fa la parcella ->
     il cliente accetta. Risultato: due pratiche per lo stesso incarico, quella
     buona coi dati e una vuota, che era poi l'unica agganciata alla fattura.
     Adesso, se c'e' già una pratica aperta per quel cliente, chiede. */
  async function prevToLavoro(id){
    const p=prevCache.find(x=>x.id===id);if(!p||!sbUid)return;
    const pro=ruoloUtente==='professionista';
    const PAR=pro?"pratica":"lavoro";

    /* le pratiche non chiuse dello stesso cliente: sono le candidate */
    let candidate=[];
    if(p.cliente_id){
      const {data:cand}=await sb.from("gest_lavori").select("id,descrizione,data_prevista,importo")
        .eq("user_id",sbUid).eq("mestiere_id",curMestiere())
        .eq("cliente_id",p.cliente_id).neq("stato","fatto")
        .order("data_prevista",{ascending:false}).limit(20);
      candidate=cand||[];
    }
    const {data:rr}=await sb.from("gest_preventivo_righe").select("descrizione,qta,prezzo").eq("preventivo_id",id).order("ordine");
    const tot=(rr||[]).reduce((s,r)=>s+impRiga(r.qta,r.prezzo),0);

    if(!candidate.length){
      if(!gconfirm("Il cliente ha accettato? Creo "+(pro?"la pratica":"il lavoro")+" dal preventivo N. "+p.numero+"."))return;
      return _prevCreaLavoro(id,p,tot);
    }
    /* c'e' già qualcosa aperto per quel cliente: si sceglie */
    openSheetGrande("Preventivo N. "+p.numero+" accettato",
      '<div class="sh-b">'
      +'<div class="sh-tit">A quale '+PAR+' lo collego?</div>'
      +'<p class="sh-nota" style="margin-top:0">Per questo cliente hai gi&agrave; '+(candidate.length===1?('una '+PAR+' aperta'):(candidate.length+' '+(pro?'pratiche aperte':'lavori aperti')))+'. Collegando il preventivo a '+(pro?'quella giusta':'quello giusto')+' non nascono doppioni.</p>'
      +'<div class="field"><label>'+(pro?'Pratica':'Lavoro')+'</label><select id="ptl-sel">'
      +  candidate.map(function(l){return '<option value="'+l.id+'">'+esc(l.descrizione||"(senza nome)")+(l.data_prevista?" — "+fdate(l.data_prevista):"")+'</option>';}).join("")
      +  '<option value="">— creane '+(pro?'una nuova':'uno nuovo')+' —</option>'
      +'</select></div>'
      +'<p class="sh-nota" style="margin-bottom:0">'+(pro
          ?'Il compenso del preventivo ('+eur2(tot)+') — senza cassa, spese e IVA — diventa l\'importo della pratica.'
          :'Il totale delle voci del preventivo ('+eur2(tot)+'), IVA esclusa, diventa l\'importo del lavoro.')+'</p>'
      +'</div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="ptl-conferma" data-id="'+esc(String(id))+'" data-tot="'+tot+'">Collega</button>');
  }
  async function prevToLavoroConferma(id,tot){
    const p=prevCache.find(x=>x.id===id);if(!p)return;
    const scelto=$("#ptl-sel")?$("#ptl-sel").value:"";
    closeSheet();
    if(!scelto)return _prevCreaLavoro(id,p,tot);
    /* si aggancia a quella che esiste, senza toccarne i dati della pratica */
    const {error:eUp}=await sb.from("gest_lavori").update({importo:tot}).eq("id",scelto).eq("user_id",sbUid);
    if(eUp){toast("Errore: "+eUp.message);return;}
    const {data:okAcc,error:eAcc}=await sb.from("gest_preventivi").update({stato:"accettato",lavoro_id:scelto}).eq("id",id).eq("user_id",sbUid).select("id");
    rinfresca("preventivi","lavori","riepilogo");
    if(eAcc||!okAcc||!okAcc.length){toast("Collegato, ma il preventivo non risulta accettato: aggiornagli lo stato a mano");return;}
    toast("Preventivo collegato ✔");
  }
  async function _prevCreaLavoro(id,p,tot){
    const {data:lav,error}=await sb.from("gest_lavori").insert({user_id:sbUid,mestiere_id:curMestiere(),stato:"da_fare",
      descrizione:p.titolo,dove:"",data_prevista:todayStr(),cliente_id:p.cliente_id,importo:tot}).select("id").single();
    if(error){toast("Errore: "+error.message);return;}
    const {data:okAcc,error:eAcc}=await sb.from("gest_preventivi").update({stato:"accettato",lavoro_id:lav.id}).eq("id",id).eq("user_id",sbUid).select("id");
    rinfresca("preventivi","lavori","riepilogo");
    if(eAcc||!okAcc||!okAcc.length){toast("Creato, ma il preventivo non risulta accettato: aggiornagli lo stato a mano");return;}
    toast(ruoloUtente==='professionista'?"Pratica creata dal preventivo ✔":"Lavoro creato dal preventivo ✔");
  }

  /* ===== 9 agosto 2026 — CREDITI FORMATIVI (CFP) =====
     Ingegneri, architetti, geometri e periti sono OBBLIGATI a fare corsi ogni
     anno per restare iscritti all'albo. Quasi tutti perdono il conto e a
     dicembre si trovano scoperti. Qui si segna un corso alla volta e il
     gestionale dice a che punto sei e quanti te ne mancano.
     Nessun mestiere_id: l'obbligo è della PERSONA iscritta all'albo, non del
     reparto, quindi i corsi si vedono uguali da tutti i reparti.
     Tabella: sql/gest-ore-e-crediti.sql. Se manca, la sezione lo dice. */
  const CRED_TIPI=["Aggiornamento professionale","Deontologia","Sicurezza",
                   "Corso abilitante","Seminario / convegno","Altro"];
  let credCache=[], credAnno=null, credObiettivo=30;

  async function renderCrediti(){
    const box=$("#cred-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML="";return;}
    const {data,error}=await sb.from("gest_crediti")
      .select("id,titolo,ente,data,crediti,tipo,note").eq("user_id",sbUid)
      .order("data",{ascending:false});
    if(error){
      $("#cred-riass").innerHTML="";
      box.innerHTML=tabVuoto("Serve un aggiornamento del database",
        "Per tenere il registro dei crediti formativi esegui sql/gest-ore-e-crediti.sql su Supabase (SQL Editor → Run). Poi ricarica la pagina.",
        _SVGV+'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>');
      return;
    }
    credCache=data||[];
    /* l'obiettivo annuo sta nei Dati azienda: 30 per ingegneri e architetti,
       20 per i geometri. Ognuno mette il suo. */
    credObiettivo=30;   /* si riparte sempre dal default, se no resta quello di prima */
    try{
      const {data:az}=await sb.from("gest_azienda").select("cfp_obiettivo").eq("user_id",sbUid).maybeSingle();
      if(az&&az.cfp_obiettivo!=null&&+az.cfp_obiettivo>0)credObiettivo=+az.cfp_obiettivo;
    }catch(e){}

    const anni=[...new Set(credCache.map(c=>String(c.data||"").slice(0,4)).filter(Boolean))].sort().reverse();
    const annoOggi=todayStr().slice(0,4);
    if(!credAnno)credAnno=anni.includes(annoOggi)?annoOggi:(anni[0]||annoOggi);
    const L=credCache.filter(c=>String(c.data||"").slice(0,4)===credAnno);
    const fatti=L.reduce((s,c)=>s+(+c.crediti||0),0);
    const mancano=Math.max(0,credObiettivo-fatti);
    const perc=credObiettivo?Math.min(100,Math.round(fatti/credObiettivo*100)):0;

    /* ===== 12 agosto 2026 (sera) — I CREDITI PER TIPO =====
       Il campo "Tipo" si compilava a ogni corso e non veniva contato da
       nessuna parte. Cosi' il riquadro poteva dire "Obiettivo raggiunto: sei a
       posto" a chi ha 30 crediti tutti di aggiornamento e ZERO di deontologia,
       che quasi tutti gli Ordini chiedono a parte. Adesso il conto per tipo si
       vede, e se manca la deontologia il riquadro lo dice invece di rassicurare
       e basta. Non invento la quota: ogni Ordine ha la sua, quindi si avvisa e
       si rimanda al regolamento. */
    const perTipo={};
    L.forEach(function(c){const t=(c.tipo||"Altro");perTipo[t]=(perTipo[t]||0)+(+c.crediti||0);});
    const _n2=v=>String(Math.round(v*100)/100).replace(".",",");
    const deont=perTipo["Deontologia"]||0;
    const rigaTipi=Object.keys(perTipo).filter(t=>perTipo[t]>0).sort((a,b)=>perTipo[b]-perTipo[a])
      .map(t=>'<span class="cred-tipo">'+esc(t)+': <b>'+_n2(perTipo[t])+'</b></span>').join("");
    /* il riquadro in cima: è l'unica cosa che uno vuole sapere davvero */
    const tono=(mancano===0&&deont>0)?"ok":((mancano===0||perc>=60)?"attesa":"err");
    $("#cred-riass").innerHTML=
      '<div class="cred-box cred-'+tono+'">'
      +'<div class="cred-num">'+String(Math.round(fatti*100)/100).replace(".",",")+' <small>di '+credObiettivo+' CFP</small></div>'
      +'<div class="cred-barra"><span style="width:'+perc+'%"></span></div>'
      +'<div class="cred-msg">'+(mancano===0
          ? "Obiettivo "+credAnno+" raggiunto: sei a posto."
          : "Ti mancano <b>"+String(Math.round(mancano*100)/100).replace(".",",")+" crediti</b> per chiudere il "+credAnno+".")
      +(deont===0&&fatti>0
          ? '<br>Attenzione: nel '+credAnno+' non hai <b>nessun credito di Deontologia</b>. Quasi tutti gli Ordini ne chiedono una quota a parte: controlla il regolamento del tuo.'
          : '')
      +'</div>'
      +(rigaTipi?'<div class="cred-tipi">'+rigaTipi+'</div>':'')
      +'<div class="cred-anni">'+(anni.length?anni:[annoOggi]).map(function(a){
          return '<button type="button" class="chip'+(a===credAnno?' on':'')+'" data-action="cred-anno" data-v="'+a+'">'+a+'</button>';
        }).join("")+'</div>'
      +'</div>';

    renderTabella({
      id:"cred", box:"#cred-list",
      viste:"#cred-viste", visteDef:[], vista:"", conta:{}, azioneVista:"",
      vuoto:tabVuoto("Nessun corso segnato nel "+credAnno,
        "Ogni volta che fai un corso segnalo qui con la data e i crediti: a dicembre sai già se sei a posto, senza rincorrere gli attestati.",
        _SVGV+'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
        {t:"+ Segna il primo corso",a:"new-cred"}),
      colonne:[{lab:"Corso",w:"38%"},{lab:"Ente",w:"24%",cls:"c-chi"},
               {lab:"Tipo",w:"18%",cls:"c-cli"},{lab:"Crediti",w:"10%"},{lab:"Quando",w:"10%"}],
      righe:L.map(function(c){
        return {
          id:c.id,
          click:{action:"edit-cred",data:{id:c.id}},
          celle:[
            '<span class="lav-bar fatto"></span><span class="c-nome">'+esc(c.titolo||"Corso")+'</span>',
            esc(c.ente||"—"),
            esc(c.tipo||"—"),
            '<b>'+String(+c.crediti||0).replace(".",",")+'</b>',
            fdate(c.data)
          ],
          menu:[
            {lab:"✏ Modifica",action:"edit-cred",data:{id:c.id}},
            {lab:"🗑 Elimina",action:"del-cred",data:{id:c.id},del:true}
          ]
        };
      }),
      cards:()=>L.map(function(c){
        return schedaJob({
          tono:"t-ok", titolo:esc(c.titolo||"Corso"),
          destra:'<span class="stato" style="background:var(--ok-bg);color:var(--ok)">'+String(+c.crediti||0).replace(".",",")+' CFP</span>',
          meta:[c.ente?"🏛 "+esc(c.ente):"", c.tipo?"📚 "+esc(c.tipo):"", "📅 "+fdate(c.data)],
          nota:c.note?"📝 "+esc(c.note):"",
          azioni:[
            {lab:"✏ Modifica",action:"edit-cred",data:{id:c.id}},
            {lab:"🗑 Elimina",action:"del-cred",data:{id:c.id},del:true}
          ]});
      }).join("")
    });
  }

  function credForm(c){
    const isNew=!c;c=c||{};
    const tipoOpts=CRED_TIPI.map(t=>'<option value="'+esc(t)+'" '+(t===c.tipo?'selected':'')+'>'+esc(t)+'</option>').join("");
    openSheetGrande(isNew?"Nuovo corso":"Modifica corso",
      '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Il corso</div>'
      +'<div class="field"><label>Titolo</label><input id="cr-tit" value="'+esc(c.titolo||"")+'" placeholder="Es. Aggiornamento sicurezza 40 ore"></div>'
      +'<div class="field"><label>Ente che lo ha organizzato</label><input id="cr-ente" value="'+esc(c.ente||"")+'" placeholder="Es. Ordine Ingegneri di Rieti"></div>'
      +'<div class="field"><label>Tipo</label><select id="cr-tipo">'+tipoOpts+'</select></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Quando e quanto</div>'
      +'<div class="row2">'
      +'<div class="field"><label>Data</label><input type="date" id="cr-data" value="'+(c.data||todayStr())+'"></div>'
      /* 12 agosto 2026 (sera) — era type="number". Su tastiera italiana si
         scrive "2,5", e una casella type=number con la virgola dentro NON
         restituisce niente: il credito veniva salvato come ZERO. Mezzo credito
         perso a ogni corso, e il gestionale poteva dirti "sei a posto" con i
         CFP che non tornavano. Adesso e' una casella di testo letta da
         _numIt, come i prezzi del computo: 2,5 e 2.5 vanno bene tutti e due. */
      +'<div class="field"><label>Crediti (CFP)</label><input type="text" inputmode="decimal" id="cr-cfp"'+_noAuto()+' value="'+(c.crediti!=null?String(c.crediti).replace(".",","):"")+'" placeholder="Es. 2,5"></div></div>'
      +'<div class="field"><label>Note</label><textarea id="cr-note" placeholder="Numero attestato, dove l\'hai salvato...">'+esc(c.note||"")+'</textarea></div>'
      +'<p class="sh-nota" style="margin-bottom:0">L\'obiettivo annuo (di norma 30 CFP, 20 per i geometri) si imposta nei <b>Dati azienda</b>.</p>'
      +'</div>'
      +'</div></div>',
      ctrTastoHTML('corso')
      +'<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="save-cred" data-id="'+(c.id||"")+'">'+(isNew?"Aggiungi":"Salva")+'</button>');
    ctrAscolta('corso');
  }

  async function saveCred(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const titolo=$("#cr-tit").value.trim();
    if(!titolo){toast("Scrivi il titolo del corso");return;}
    const row={titolo, ente:$("#cr-ente").value.trim()||null,
      tipo:$("#cr-tipo")?$("#cr-tipo").value:null,
      data:$("#cr-data").value||todayStr(),
      crediti:_numIt("#cr-cfp")||0,
      note:$("#cr-note").value.trim()||null};
    const {data,error}=id
      ?await sb.from("gest_crediti").update(row).eq("id",id).eq("user_id",sbUid).select("id")
      :await sb.from("gest_crediti").insert(Object.assign({user_id:sbUid},row)).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non salvato: nessuna riga modificata");return;}
    /* l'anno mostrato segue il corso appena segnato, se no sembra sparito */
    credAnno=String(row.data).slice(0,4);
    closeSheet();renderCrediti();toast(id?"Aggiornato ✔":"Corso segnato ✔");
  }
  /* funzione a parte: il gestore dei clic di questo blocco NON è async,
     quindi l'await deve stare qui dentro */
  async function delCred(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    if(!gconfirm("Eliminare questo corso dal registro?"))return;
    const {data,error}=await sb.from("gest_crediti").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non eliminato: nessuna riga rimossa");return;}
    renderCrediti();toast("Corso eliminato");
  }

