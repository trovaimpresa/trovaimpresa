// [SPOSTATO] nol-schede.js: era dentro nol-core.js, righe 1466-2107, spostato identico.


  /* ── PRODOTTI · FORNITORI · MOVIMENTI — 22 agosto 2026 ──
     Stesso stampo di Mezzi, Clienti e Noleggi: elenco con «Apri», scheda a
     tutta pagina, le funzioni dentro. */
  function schedaProdotto(p){
    const isNew=!p; p=p||{};
    const v=(k)=>esc(p[k]==null?"":p[k]);
    openSheet(`<h3>${isNew?"Nuovo prodotto":"Modifica prodotto"}</h3>${nolPulsantiScheda("prodotto",p.id||"")}
      <div class="field"><label>Nome del prodotto *</label><input id="np-nome" value="${v('nome')}" placeholder="Es. Cemento 32,5 R"></div>
      <div class="row2">
        <div class="field"><label>Codice</label><input id="np-codice" value="${v('codice')}" placeholder="Es. CEM-325"></div>
        <div class="field"><label>Categoria</label><input id="np-categoria" value="${v('categoria')}" placeholder="Es. leganti"></div>
      </div>
      <div class="nol-riq nol-cam">
        <h4>Magazzino</h4>
        <div class="nol-due">
          <div><label>Unità di misura</label><input id="np-unita" value="${p.unita||"pz"}" placeholder="pz, mq, kg"></div>
          <div><label>Quantità in magazzino</label><input id="np-quantita" inputmode="decimal" value="${v('quantita')}" placeholder="0" data-num></div>
          <div><label>Scorta minima</label><input id="np-soglia" inputmode="decimal" value="${v('soglia_minima')}" placeholder="0" data-num></div>
          <div><label>&nbsp;</label><p style="margin:0;font-size:13px;color:#666;padding-top:9px">Sotto la scorta minima il prodotto compare nel Riepilogo.</p></div>
        </div>
      </div>
      <div class="nol-riq nol-cam">
        <h4>Prezzi</h4>
        <div class="nol-due">
          <div><label>Prezzo di acquisto €</label><input id="np-acquisto" inputmode="decimal" value="${v('prezzo_acquisto')}" placeholder="0,00" data-eu></div>
          <div><label>Prezzo di vendita €</label><input id="np-prezzo" inputmode="decimal" value="${v('prezzo')}" placeholder="0,00" data-eu></div>
          <div><label>IVA %</label><input id="np-iva" inputmode="decimal" value="${p.iva_perc==null?22:p.iva_perc}" placeholder="22" data-num></div>
          <div><label>&nbsp;</label><div id="np-margine" style="padding-top:9px;font-size:14px;color:#0066ff;font-weight:700"></div></div>
        </div>
      </div>
      <div class="field"><label>Note</label><input id="np-note" value="${v('note')}" placeholder="Quello che serve ricordare"></div>
      ${nolDocBlocco("prodotto",p.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-prod" data-id="${p.id||""}">${isNew?"Crea":"Salva"}</button></div>`);
    if(typeof mostraMargine==="function") mostraMargine();
  }

  async function salvaProdotto(id){
    const nome=$("#np-nome").value.trim();
    if(!nome){toast("Scrivi il nome del prodotto");return;}
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const dati={nome,
      prezzo:_numIt($("#np-prezzo").value),
      quantita:_numIt($("#np-quantita").value),
      categoria:$("#np-categoria").value.trim()||null,
      soglia_minima:_numIt($("#np-soglia").value),
      codice:$("#np-codice").value.trim()||null,
      note:$("#np-note").value.trim()||null,
      unita:$("#np-unita").value.trim()||"pz",
      prezzo_acquisto:$("#np-acquisto").value===""?null:_numIt($("#np-acquisto").value),
      iva_perc:_numIt($("#np-iva").value)};
    /* se le colonne nuove non ci sono ancora su Supabase, il prodotto si salva
       lo stesso senza di esse invece di andare perso */
    const senzaNuovi=o=>{const c={...o};["unita","prezzo_acquisto","iva_perc"].forEach(k=>delete c[k]);return c;};
    const eColonnaNuova=e=>/unita|prezzo_acquisto|iva_perc/i.test((e&&e.message)||"")&&/column|schema cache/i.test((e&&e.message)||"");
    const scrivi=(d)=>id?sb.from("neg_prodotti").update(d).eq("id",id).eq("user_id",sbUid)
                        :sb.from("neg_prodotti").insert({user_id:sbUid,...d});
    let {error}=await scrivi(dati);
    if(error&&eColonnaNuova(error)){
      ({error}=await scrivi(senzaNuovi(dati)));
      if(!error) toast("Salvato, ma unità, acquisto e IVA no: manca sql/neg-prodotti-campi.sql");
    }
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); loadProdotti(); renderRiepilogoNegozio(); toast(id?"Prodotto aggiornato ✔":"Prodotto aggiunto ✔");
  }

  /* ── MAGAZZINO — la scheda della giacenza ──
     Non e' la scheda del prodotto: qui si guarda una cosa sola, quanto ce
     n'e' in magazzino e quando bisogna riordinare. Il meno e il piu' stanno
     DENTRO la scheda, non sulla riga dell'elenco: sulla riga c'e' «Apri». */
  function schedaMagazzino(p){
    p=p||{};
    const v=(k)=>esc(p[k]==null?"":p[k]);
    const q=+(p.quantita||0), s=+(p.soglia_minima||0), sotto=q<=s;
    const pz=+(p.prezzo||0);
    openSheet(`<h3>Magazzino — ${esc(p.nome||"prodotto")}</h3>${nolPulsantiScheda("magazzino",p.id||"")}
      ${sotto?'<div class="nol-avviso">Sotto la scorta minima: da riordinare.</div>':''}
      <div class="nol-riq nol-cam">
        <h4>Quanto ce n'&egrave;</h4>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <button type="button" class="mag-btn" data-action="mag-meno" title="Uno in meno">&minus;</button>
          <input id="ng-quantita" inputmode="decimal" value="${v('quantita')}" placeholder="0"
                 style="width:130px;font-size:26px;font-weight:700;text-align:center" data-num>
          <button type="button" class="mag-btn mag-piu" data-action="mag-piu" title="Uno in pi&ugrave;">+</button>
          <span style="font-size:15px;color:#666">${esc(p.unita||"pz")}</span>
        </div>
      </div>
      <div class="nol-riq nol-cam">
        <h4>Quando riordinare</h4>
        <div class="nol-due">
          <div><label>Scorta minima</label><input id="ng-soglia" inputmode="decimal" value="${v('soglia_minima')}" placeholder="0" data-num></div>
          <div><label>Unit&agrave; di misura</label><input id="ng-unita" value="${esc(p.unita||"pz")}" placeholder="pz, mq, kg"></div>
        </div>
        <p style="margin:10px 0 0;font-size:14px;color:#666">Sotto questa quantit&agrave; il prodotto compare nel Riepilogo fra quelli da riordinare.</p>
      </div>
      <div class="nol-riq nol-cam">
        <h4>Valore</h4>
        <p style="margin:0;font-size:15px">${pz?esc(_eur(q*pz))+' &nbsp;<span style="color:#666">('+esc(String(q).replace(".",","))+' &times; '+esc(_eur(pz))+')</span>':'<span style="color:#666">Nessun prezzo di vendita sul prodotto.</span>'}</p>
      </div>
      ${nolDocBlocco("magazzino",p.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-mag" data-id="${p.id||""}">Salva</button></div>`);
  }

  async function salvaMagazzino(id){
    if(!id){toast("Questa giacenza non si trova più");return;}
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const dati={quantita:_numIt($("#ng-quantita").value),
                soglia_minima:_numIt($("#ng-soglia").value)};
    const unita=$("#ng-unita").value.trim();
    let {error}=await sb.from("neg_prodotti").update({...dati,unita:unita||"pz"}).eq("id",id).eq("user_id",sbUid);
    /* se la colonna «unita» non c'e' ancora su Supabase, la giacenza si salva
       lo stesso invece di andare persa (stessa rete di salvataggio dei Prodotti) */
    if(error&&/unita/i.test(error.message||"")&&/column|schema cache/i.test(error.message||"")){
      ({error}=await sb.from("neg_prodotti").update(dati).eq("id",id).eq("user_id",sbUid));
    }
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); loadMagazzino(); loadProdotti(); renderRiepilogoNegozio(); toast("Magazzino aggiornato ✔");
  }

  function schedaFornitore(f){
    const isNew=!f; f=f||{};
    const v=(k)=>esc(f[k]==null?"":f[k]);
    openSheet(`<h3>${isNew?"Nuovo fornitore":"Modifica fornitore"}</h3>${nolPulsantiScheda("fornitore",f.id||"")}
      <div class="field"><label>Nome / Ragione sociale *</label><input id="nf-nome" value="${v('nome')}" placeholder="Es. Edilcentro srl"></div>
      <div class="row2">
        <div class="field"><label>Telefono</label><input id="nf-telefono" value="${v('telefono')}" placeholder="Numero"></div>
        <div class="field"><label>Email</label><input id="nf-email" value="${v('email')}" placeholder="Indirizzo email"></div>
      </div>
      <div class="field"><label>Indirizzo</label><input id="nf-indirizzo" value="${v('indirizzo')}" placeholder="Via, numero, città"></div>
      <div class="field"><label>P.IVA</label><input id="nf-piva" value="${v('piva')}" placeholder="Per la fattura"></div>
      <div class="field"><label>Note</label><input id="nf-note" value="${v('note')}" placeholder="Quello che serve ricordare"></div>
      ${nolDocBlocco("fornitore",f.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-forn" data-id="${f.id||""}">${isNew?"Crea":"Salva"}</button></div>`);
  }

  async function salvaFornitore(id){
    const nome=$("#nf-nome").value.trim();
    if(!nome){toast("Scrivi il nome");return;}
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const dati={nome,
      telefono:$("#nf-telefono").value.trim()||null,
      email:$("#nf-email").value.trim()||null,
      indirizzo:$("#nf-indirizzo").value.trim()||null,
      piva:$("#nf-piva").value.trim()||null,
      note:$("#nf-note").value.trim()||null};
    const {error}=id
      ? await sb.from("neg_fornitori").update(dati).eq("id",id).eq("user_id",sbUid)
      : await sb.from("neg_fornitori").insert({user_id:sbUid,...dati});
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); loadFornitori(); toast(id?"Fornitore aggiornato ✔":"Fornitore aggiunto ✔");
  }

  function schedaMovimento(m){
    const isNew=!m; m=m||{};
    const v=(k)=>esc(m[k]==null?"":m[k]);
    openSheet(`<h3>${isNew?"Nuovo movimento":"Modifica movimento"}</h3>${nolPulsantiScheda("movimento",m.id||"")}
      <div class="field"><label>Tipo di movimento</label><select id="nm-tipo">
        <option value="vendita">Vendita (merce che esce)</option>
        <option value="acquisto">Acquisto (merce che entra)</option>
        <option value="reso">Reso</option>
        <option value="rettifica">Rettifica di magazzino</option></select></div>
      <div class="field"><label>Prodotto *</label><input id="nm-prodotto" value="${v('prodotto')}" placeholder="Nome del prodotto"></div>
      <div class="row2">
        <div class="field"><label>Quantità</label><input id="nm-quantita" inputmode="decimal" value="${v('quantita')}" placeholder="Anche con la virgola" data-num></div>
        <div class="field"><label>Importo €</label><input id="nm-importo" inputmode="decimal" value="${v('importo')}" placeholder="0,00" data-eu></div>
      </div>
      <div class="row2">
        <div class="field"><label>Cliente o fornitore</label><input id="nm-controparte" value="${v('controparte')}" placeholder="Chi ha comprato o venduto"></div>
        <div class="field"><label>Data</label><input id="nm-data" type="date" value="${v('data_mov')}"></div>
      </div>
      <div class="field"><label>Note</label><input id="nm-note" value="${v('note')}" placeholder="Quello che serve ricordare"></div>
      ${nolDocBlocco("movimento",m.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-mov" data-id="${m.id||""}">${isNew?"Crea":"Salva"}</button></div>`);
    if(m.tipo) $("#nm-tipo").value=m.tipo;
  }

  async function salvaMovimento(id){
    const prodotto=$("#nm-prodotto").value.trim();
    if(!prodotto){toast("Scrivi il prodotto");return;}
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const dati={tipo:$("#nm-tipo").value, prodotto,
      quantita:_numIt($("#nm-quantita").value),
      importo:_numIt($("#nm-importo").value),
      controparte:$("#nm-controparte").value.trim()||null,
      data_mov:$("#nm-data").value||null,
      note:$("#nm-note").value.trim()||null};
    const {error}=id
      ? await sb.from("neg_movimenti").update(dati).eq("id",id).eq("user_id",sbUid)
      : await sb.from("neg_movimenti").insert({user_id:sbUid,...dati});
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); loadMovimenti(); renderRiepilogoNegozio(); toast(id?"Movimento aggiornato ✔":"Movimento aggiunto ✔");
  }

  function schedaMezzo(m){
    const isNew=!m; m=m||{};
    const v=(k)=>esc(m[k]==null?"":m[k]);
    openSheet(`<h3>${isNew?"Nuovo mezzo":"Modifica mezzo"}</h3>${nolPulsantiScheda("mezzo",m.id||"")}
      <div class="field"><label>Nome del mezzo *</label><input id="nz-nome" value="${v('nome')}" placeholder="Es. Escavatore 3t"></div>
      <div class="row2">
        <div class="field"><label>Codice / matricola</label><input id="nz-codice" value="${v('codice')}" placeholder="Es. E-01"></div>
        <div class="field"><label>Tipo</label><input id="nz-categoria" value="${v('tipo')}" placeholder="Es. movimento terra"></div>
      </div>
      <div class="field"><label>Stato</label><select id="nz-stato">
        <option value="disponibile">Disponibile</option>
        <option value="in_uso">Noleggiato / in uso</option>
        <option value="manutenzione">In manutenzione</option></select></div>

      <div class="nol-riq nol-cam">
        <h4>Quanto costa a tempo</h4>
        <div class="nol-due">
          <div><label>A ora €</label><input id="nz-tora" inputmode="decimal" value="${v('tariffa_ora')}" placeholder="0,00" data-eu></div>
          <div><label>Al giorno €</label><input id="nz-tgiorno" inputmode="decimal" value="${v('tariffa_giorno')}" placeholder="0,00" data-eu></div>
          <div><label>A settimana €</label><input id="nz-tsett" inputmode="decimal" value="${v('tariffa_settimana')}" placeholder="0,00" data-eu></div>
          <div><label>Al mese €</label><input id="nz-tmese" inputmode="decimal" value="${v('tariffa_mese')}" placeholder="0,00" data-eu></div>
        </div>
        <p style="margin:8px 0 0;font-size:13px;color:#666">Quella che lasci a zero non viene usata. Il conto sceglie da solo la combinazione che costa meno al cliente.</p>
      </div>

      <div class="nol-riq nol-cam">
        <h4>Quanto costa a consumo</h4>
        <label class="nol-spunta"><input type="checkbox" id="nz-contaore" ${m.ha_contaore?"checked":""}> Questo mezzo ha il contaore</label>
        <div id="nz-box-ore" style="display:${m.ha_contaore?"":"none"}">
          <div class="nol-due">
            <div><label>Ore comprese in una giornata</label><input id="nz-oreincl" inputmode="decimal" value="${v('ore_incluse_giorno')}" placeholder="8" data-num></div>
            <div><label>Ogni ora in più €</label><input id="nz-toraextra" inputmode="decimal" value="${v('tariffa_ora_extra')}" placeholder="0,00" data-eu></div>
          </div>
        </div>
        <label class="nol-spunta"><input type="checkbox" id="nz-contakm" ${m.ha_contakm?"checked":""}> Questo mezzo ha il contachilometri</label>
        <div id="nz-box-km" style="display:${m.ha_contakm?"":"none"}">
          <div class="nol-due">
            <div><label>Km compresi in una giornata</label><input id="nz-kmincl" inputmode="decimal" value="${v('km_inclusi_giorno')}" placeholder="100" data-num></div>
            <div><label>Ogni km in più €</label><input id="nz-tkm" inputmode="decimal" value="${v('tariffa_km')}" placeholder="0,00" data-eu></div>
          </div>
        </div>
        <div class="nol-due" style="margin-top:8px">
          <div><label>Usura, quota fissa €</label><input id="nz-usurafissa" inputmode="decimal" value="${v('usura_fissa')}" placeholder="0,00" data-eu></div>
          <div><label>Usura, % sul tempo</label><input id="nz-usuraperc" inputmode="decimal" value="${v('usura_percento')}" placeholder="0" data-num></div>
        </div>
      </div>

      <div class="nol-riq nol-cam">
        <h4>Cauzione</h4>
        <div><label>Quanto si lascia in deposito €</label><input id="nz-cauzione" inputmode="decimal" value="${v('cauzione')}" placeholder="0,00" data-eu></div>
        <p style="margin:8px 0 0;font-size:13px;color:#666">La cauzione non entra nel totale del noleggio: è un deposito che torna indietro.</p>
      </div>

      <div class="nol-riq nol-cam">
        <h4>⛔ Scadenze di legge</h4>
        <p style="margin:0 0 10px;font-size:14px;color:#666">Un mezzo con la <b>verifica periodica scaduta</b> o l'<b>assicurazione scaduta</b> il gestionale non te lo fa noleggiare. Le altre scadenze avvisano e basta.</p>
        <div class="nol-due">
          <div><label>Ultima verifica periodica</label><input id="nz-vdata" type="date" value="${v('verifica_ultima')}"></div>
          <div><label>Ogni quanti mesi</label><input id="nz-vmesi" inputmode="numeric" value="${m.verifica_mesi==null?12:esc(m.verifica_mesi)}" placeholder="12"></div>
        </div>
        <p style="margin:8px 0 0;font-size:13px;color:#666">12, 24 o 36 mesi secondo il tipo di macchina, l'età e quanto si usa. <b>Metti 0</b> se questo mezzo non è soggetto a verifica (art. 71 c.11 e allegato VII del D.Lgs 81/08).</p>
        <div class="field" style="margin-top:10px"><label>Chi l'ha fatta</label><input id="nz-vente" value="${v('verifica_ente')}" placeholder="INAIL, ASL, oppure il nome del soggetto abilitato"></div>
        <div class="nol-due">
          <div><label>Assicurazione, scade il</label><input id="nz-assic" type="date" value="${v('assicurazione_scad')}"></div>
          <div><label>Revisione, scade il</label><input id="nz-revis" type="date" value="${v('revisione_scad')}"></div>
        </div>
        <div class="field"><label>Collaudo, scade il</label><input id="nz-collaudo" type="date" value="${v('collaudo_scad')}"></div>
        <div id="nz-scad-avviso" style="margin-top:10px"></div>
      </div>

      <div class="nol-riq nol-cam">
        <h4>Manutenzione</h4>
        <div class="nol-due">
          <div><label>Tagliando ogni quante ore</label><input id="nz-tagogni" inputmode="decimal" value="${v('tagliando_ogni_ore')}" placeholder="0 = non si usa" data-num></div>
          <div><label>Ultimo tagliando, a che ora</label><input id="nz-tagultimo" inputmode="decimal" value="${v('tagliando_ultimo_ore')}" placeholder="0" data-num></div>
        </div>
        <div class="field"><label>Contaore adesso</label><input id="nz-oreora" inputmode="decimal" value="${v('contaore_attuale')}" placeholder="0" data-num></div>
        <label class="nol-spunta"><input type="checkbox" id="nz-fuori" ${m.fuori_servizio?"checked":""}> ⛔ Fuori servizio: questo mezzo non si può dare</label>
        <div class="field"><label>Perché è fuori servizio</label><input id="nz-fuoriperche" value="${v('fuori_servizio_perche')}" placeholder="Es. in officina per la pompa idraulica"></div>
        <div class="field"><label>Note di manutenzione</label><input id="nz-manut" value="${v('manutenzione_note')}" placeholder="Quello che serve ricordare"></div>
      </div>

      <div class="field"><label>Note</label><input id="nz-note" value="${v('note')}" placeholder="Quello che serve ricordare"></div>
      ${nolDocBlocco("mezzo",m.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-mezzo" data-id="${m.id||""}">${isNew?"Crea":"Salva"}</button></div>`);
    if(m.stato) $("#nz-stato").value=m.stato;
    mezzoDisegnaAvviso(m);
  }

  /* l'avviso dentro la scheda: dice quando scade la prossima verifica,
     e se il mezzo in questo momento non si puo' dare */
  function mezzoDisegnaAvviso(m){
    const box=$("#nz-scad-avviso"); if(!box) return;
    const bl=mezzoBloccato(m);
    const s=mezzoScadenze(m).filter(x=>x.data);
    let h="";
    if(bl) h+='<div class="nol-avviso" style="border-color:#c62828;color:#b3261e"><b>Questo mezzo non si può noleggiare:</b> '+esc(bl)+'.</div>';
    s.forEach(x=>{
      if(x.gg==null) return;
      const col=x.gg<0?"#c62828":(x.gg<=SCAD_AVVISO_GG?"#e65100":"#2e7d32");
      const q=x.gg<0?("scaduta da "+Math.abs(x.gg)+" giorni"):(x.gg===0?"scade oggi":"fra "+x.gg+" giorni");
      h+='<div style="font-size:14px;color:'+col+';font-weight:600;margin-top:4px">'
        + esc(x.cosa)+': '+esc(fdate(x.data))+' — '+esc(q)+'</div>';
    });
    box.innerHTML=h;
  }

  async function salvaMezzo(id){
    const nome=$("#nz-nome").value.trim();
    if(!nome){toast("Scrivi il nome del mezzo");return;}
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const dati={nome,
      codice:$("#nz-codice").value.trim()||null,
      /* ⛔ 4 settembre 2026 — nel gestionale «categoria» vale solo
         'mezzo' o 'attrezzatura' (lo impone il database): la parola
         scritta a mano ("movimento terra") e' il «tipo». */
      tipo:$("#nz-categoria").value.trim()||null,
      categoria:"mezzo",
      stato:$("#nz-stato").value,
      /* ⚠️ _numIt e non parseFloat: parseFloat("1250,50") risponde 1250 e i
         centesimi spariscono senza dire niente. */
      tariffa_ora:_numIt($("#nz-tora").value),
      tariffa_giorno:_numIt($("#nz-tgiorno").value),
      tariffa_settimana:_numIt($("#nz-tsett").value),
      tariffa_mese:_numIt($("#nz-tmese").value),
      ha_contaore:$("#nz-contaore").checked,
      ore_incluse_giorno:_numIt($("#nz-oreincl").value),
      tariffa_ora_extra:_numIt($("#nz-toraextra").value),
      ha_contakm:$("#nz-contakm").checked,
      km_inclusi_giorno:_numIt($("#nz-kmincl").value),
      tariffa_km:_numIt($("#nz-tkm").value),
      usura_fissa:_numIt($("#nz-usurafissa").value),
      usura_percento:_numIt($("#nz-usuraperc").value),
      cauzione:_numIt($("#nz-cauzione").value),
      note:$("#nz-note").value.trim()||null,
      /* le scadenze di legge e la manutenzione */
      verifica_ultima:$("#nz-vdata")?($("#nz-vdata").value||null):null,
      verifica_mesi:$("#nz-vmesi")?Math.max(0,Math.round(_numIt($("#nz-vmesi").value))):12,
      verifica_ente:$("#nz-vente")?($("#nz-vente").value.trim()||null):null,
      assicurazione_scad:$("#nz-assic")?($("#nz-assic").value||null):null,
      revisione_scad:$("#nz-revis")?($("#nz-revis").value||null):null,
      collaudo_scad:$("#nz-collaudo")?($("#nz-collaudo").value||null):null,
      tagliando_ogni_ore:$("#nz-tagogni")?_numIt($("#nz-tagogni").value):0,
      tagliando_ultimo_ore:($("#nz-tagultimo")&&$("#nz-tagultimo").value!=="")?_numIt($("#nz-tagultimo").value):null,
      contaore_attuale:($("#nz-oreora")&&$("#nz-oreora").value!=="")?_numIt($("#nz-oreora").value):null,
      fuori_servizio:$("#nz-fuori")?$("#nz-fuori").checked:false,
      fuori_servizio_perche:$("#nz-fuoriperche")?($("#nz-fuoriperche").value.trim()||null):null,
      manutenzione_note:$("#nz-manut")?($("#nz-manut").value.trim()||null):null};
    const scrivi=(d)=>id
      ? sb.from("gest_mezzi").update(d).eq("id",id).eq("user_id",sbUid)
      : sb.from("gest_mezzi").insert({user_id:sbUid,mestiere_id:null,noleggiabile:true,...d});
    let {error}=await scrivi(dati);
    /* ⛔ 4 settembre 2026 — la lista dei mezzi e' una sola (gest_mezzi).
       Se sql/mezzi-una-lista-sola.sql non e' ancora passato, alla tabella
       mancano le colonne del noleggio: NON si prova a salvare a meta', si
       dice cosa fare, se no il mezzo finirebbe in lista senza tariffe e
       senza spunta «lo noleggio», cioe' invisibile. */
    if(error&&/noleggiabile|tariffa_|ore_incluse|km_inclusi|usura_|ha_conta|cauzione|codice/i.test(error.message||"")
            &&/column|schema cache/i.test(error.message||"")){
      toast("Manca un pezzo del database: fai passare sql/mezzi-una-lista-sola.sql");
      return;
    }
    /* rete di salvataggio piu' vecchia: le sole scadenze */
    if(error&&/verifica_|assicurazione_scad|revisione_scad|collaudo_scad|tagliando_|contaore_attuale|fuori_servizio|manutenzione_note/i.test(error.message||"")
            &&/column|schema cache/i.test(error.message||"")){
      const senza={...dati};
      ["verifica_ultima","verifica_mesi","verifica_ente","assicurazione_scad","revisione_scad",
       "collaudo_scad","tagliando_ogni_ore","tagliando_ultimo_ore","contaore_attuale",
       "fuori_servizio","fuori_servizio_perche","manutenzione_note"].forEach(k=>delete senza[k]);
      ({error}=await scrivi(senza));
      if(!error) toast("Salvato, ma le scadenze no: manca sql/noleggio-scadenze-mezzo.sql");
    }
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); loadMezzi(); renderRiepilogoNegozio(); toast(id?"Mezzo aggiornato ✔":"Mezzo aggiunto ✔");
  }

  function schedaClienteNol(c){
    const isNew=!c; c=c||{};
    const v=(k)=>esc(c[k]==null?"":c[k]);
    openSheet(`<h3>${isNew?"Nuovo cliente":"Modifica cliente"}</h3>${nolPulsantiScheda("cliente",c.id||"")}
      <div class="field"><label>Nome / Ragione sociale *</label><input id="ncl-nome" value="${v('nome')}" placeholder="Es. Rossi Costruzioni srl"></div>
      <div class="row2">
        <div class="field"><label>Telefono</label><input id="ncl-telefono" value="${v('telefono')}" placeholder="Numero"></div>
        <div class="field"><label>Email</label><input id="ncl-email" value="${v('email')}" placeholder="Indirizzo email"></div>
      </div>
      <div class="field"><label>Indirizzo</label><input id="ncl-indirizzo" value="${v('indirizzo')}" placeholder="Via, numero, città"></div>
      <div class="field"><label>P.IVA / Codice Fiscale</label><input id="ncl-piva" value="${v('piva')}" placeholder="Per la fattura"></div>
      <div class="field"><label>Note</label><input id="ncl-note" value="${v('note')}" placeholder="Quello che serve ricordare"></div>
      ${nolDocBlocco("cliente",c.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-clinol" data-id="${c.id||""}">${isNew?"Crea":"Salva"}</button></div>`);
  }

  async function salvaClienteNol(id){
    const nome=$("#ncl-nome").value.trim();
    if(!nome){toast("Scrivi il nome");return;}
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const dati={nome,
      telefono:$("#ncl-telefono").value.trim()||null,
      email:$("#ncl-email").value.trim()||null,
      indirizzo:$("#ncl-indirizzo").value.trim()||null,
      piva:$("#ncl-piva").value.trim()||null,
      note:$("#ncl-note").value.trim()||null};
    /* 24 agosto 2026 — prima un cliente nuovo nasceva "nel reparto in cui
       stai", cosi' lo vedeva anche il gestionale imprese. Il Noleggio non
       ha piu' un reparto: nasce senza, e lo vede comunque tutta l'azienda,
       in ogni reparto del gestionale imprese. */
    const {error}=id
      ? await sb.from("gest_clienti").update(dati).eq("id",id).eq("user_id",sbUid)
      : await sb.from("gest_clienti").insert({user_id:sbUid,...dati});
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); loadClientiNol(); toast(id?"Cliente aggiornato ✔":"Cliente aggiunto ✔");
  }

  let nolIdApertoNoleggio=null;
  async function schedaNoleggio(n){
    const isNew=!n; n=n||{};
    nolIdApertoNoleggio=n.id||null;
    /* 28 agosto 2026: si riparte puliti anche sulla cauzione, se no la
       seconda scheda che apri non se la propone piu'. */
    nolCauzioneProposta=false; nolCauzioneMessa=null;
    /* ⚠️ PRIMA di disegnare la scheda: firmaBlocco legge le firme mentre
       costruisce l'HTML, e se si caricassero dopo resterebbero quelle
       della scheda di prima. */
    firmeDa(n,[["contr","firma_contr_img"],["contr2","firma_contr2_img"]]);
    const v=(k)=>esc(n[k]==null?"":n[k]);
    openSheet(`<h3>${isNew?"Nuovo noleggio":"Modifica noleggio"}</h3>${nolPulsantiScheda("noleggio",n.id||"")}
      <div class="row2">
        <div class="field"><label>Mezzo *</label><select id="nn-mezzo"></select>
          <div id="nn-mezzo-avviso"></div></div>
        <div class="field"><label>Cliente</label><select id="nn-cliente"></select></div>
      </div>

      <div class="nol-riq nol-cam">
        <h4>A che punto &egrave;</h4>
        <div class="seg" id="nn-fase">
          <button type="button" data-v="prenotato">Prenotato</button>
          <button type="button" data-v="fuori">Fuori, dal cliente</button>
          <button type="button" data-v="rientrato">Rientrato</button>
        </div>
        <div class="field" style="margin-top:10px"><label>Nota sulla prenotazione</label>
          <input id="nn-prenota-nota" value="${v('prenotazione_nota')}" placeholder="Es. da confermare, il cliente richiama venerd&igrave;"></div>
        <!-- ⛔ 24 agosto 2026 — DOVE VA IL MEZZO.
             Il DDT lo chiedeva gia' (nolDdtDati legge n.luogo) e la colonna
             c'era gia' nel database dal 23 agosto, ma la casella per
             scriverlo non esisteva: cosi' come «indirizzo di destinazione»
             finiva la SEDE del cliente, non il cantiere. Su un DDT il luogo
             di consegna e' quello vero. -->
        <div class="field" style="margin-top:10px"><label>Dove va il mezzo (va sul DDT)</label>
          <input id="nn-luogo" value="${v('luogo')}" placeholder="Cantiere di via Roma 12, Rieti &mdash; se vuoto va la sede del cliente"></div>
        <!-- ⛔ 24 agosto 2026 — QUANDO IL CLIENTE SEI TU.
             Facoltativa: serve solo quando il mezzo lo dai a un tuo reparto
             (es. lo usi in un cantiere di "progetto casa") invece che a un
             cliente vero. In quel caso l'importo del noleggio compare come
             SPESA nel riepilogo di quel reparto, come se l'avessi noleggiato
             da un fornitore esterno — perche' e' proprio quello che e'. -->
        <div class="field" style="margin-top:10px"><label>Per un tuo reparto (facoltativo)</label>
          <select id="nn-reparto"><option value="">— nessuno: è un cliente esterno —</option></select>
          <p style="margin:6px 0 0;font-size:13px;color:#666">Scegli un reparto solo se il mezzo lo usi tu, in un tuo cantiere: l'importo comparir&agrave; come spesa nel riepilogo di quel reparto.</p></div>
        <div id="nn-conflitto"></div>
      </div>

      <div class="nol-riq nol-cam">
        <h4>Quando</h4>
        <div class="nol-due">
          <div><label>Data uscita</label><input id="nn-uscita" type="date" value="${v('data_uscita')}"></div>
          <div><label>Rientro previsto</label><input id="nn-prevista" type="date" value="${v('data_rientro_prevista')}"></div>
          <div><label>Rientro effettivo</label><input id="nn-effettivo" type="date" value="${v('data_rientro_effettivo')}"></div>
          <div><label>&nbsp;</label><p style="margin:0;font-size:13px;color:#666;padding-top:9px">Lascia vuoto se il mezzo è ancora fuori.</p></div>
        </div>
        <div class="nol-due" style="margin-top:8px">
          <div><label>Ora di uscita</label><input id="nn-ora-uscita" type="time" value="${String(n.ora_uscita||"").slice(0,5)}"></div>
          <div><label>Ora di rientro</label><input id="nn-ora-rientro" type="time" value="${String(n.ora_rientro||"").slice(0,5)}"></div>
        </div>
        <p style="margin:8px 0 0;font-size:13px;color:#666">Le ore contano solo quando il mezzo esce e rientra <b>lo stesso giorno</b>.</p>
      </div>

      <div class="nol-riq nol-cam" id="nn-box-contaore" style="display:none">
        <h4>Contaore</h4>
        <div class="nol-due">
          <div><label>Lettura all'uscita</label><input id="nn-contaore-usc" inputmode="decimal" value="${v('contaore_uscita')}" placeholder="0" data-num></div>
          <div><label>Lettura al rientro</label><input id="nn-contaore-rie" inputmode="decimal" value="${v('contaore_rientro')}" placeholder="0" data-num></div>
        </div>
      </div>

      <div class="nol-riq nol-cam" id="nn-box-km" style="display:none">
        <h4>Chilometri</h4>
        <div class="nol-due">
          <div><label>Contakm all'uscita</label><input id="nn-km-usc" inputmode="decimal" value="${v('km_uscita')}" placeholder="0" data-num></div>
          <div><label>Contakm al rientro</label><input id="nn-km-rie" inputmode="decimal" value="${v('km_rientro')}" placeholder="0" data-num></div>
        </div>
      </div>

      <div class="nol-riq nol-cam">
        <h4>Materiale consumato</h4>
        <div id="nn-consumi"></div>
        <button type="button" class="nol-agg" id="nn-cons-add">+ Aggiungi una riga</button>
        <p style="margin:8px 0 0;font-size:13px;color:#666">Gasolio, dischi, catene: quello che si addebita a parte.</p>
      </div>

      <div class="nol-riq nol-cam">
        <h4>Il contratto</h4>
        <div style="margin-bottom:12px"><label style="display:block;font-size:14px;color:#666;margin-bottom:5px">Che tipo di noleggio &egrave;</label><div class="seg" id="nn-nolo">
          <button type="button" data-v="freddo">A freddo — senza operatore</button>
          <button type="button" data-v="caldo">A caldo — con un nostro operatore</button></div></div>
        <div class="nol-due">
          <div><label>Numero del contratto</label><input id="nn-cnum" value="${v('contratto_num')}" placeholder="Si assegna da solo alla prima stampa"></div>
          <div><label>Data del contratto</label><input id="nn-cdata" type="date" value="${v('contratto_data')}"></div>
        </div>
        <div id="nn-op-box" style="margin-top:14px">
          <label style="display:block;font-size:14px;color:#26415f;font-weight:600;margin-bottom:4px">⛔ Chi user&agrave; la macchina</label>
          <p style="margin:0 0 10px;font-size:14px;color:#666">Per legge (D.Lgs 81/08, art. 72 comma 2) devi <b>farti dare e conservare</b> i nominativi di chi user&agrave; il mezzo, con la conferma che sono formati e — dove serve il patentino — abilitati. Nel noleggio <b>a caldo</b> non serve: l'operatore &egrave; tuo.</p>
          <div id="nn-operatori"></div>
          <button type="button" class="nol-agg" id="nn-op-add">+ Aggiungi una persona</button>
        </div>
        <div class="nol-due" style="margin-top:14px">
          <div><label>Com'era alla consegna</label><input id="nn-stato-cons" value="${v('stato_consegna')}" placeholder="Es. carrozzeria integra, pieno di gasolio"></div>
          <div><label>Com'&egrave; tornato</label><input id="nn-stato-rie" value="${v('stato_rientro')}" placeholder="Si compila al rientro"></div>
        </div>
        <div class="nol-due" style="margin-top:14px">
          <div><label>Chi firma per il cliente</label>
            <input id="nn-firma-nome" value="${v('firma_contr_nome')}" placeholder="Cognome e nome di chi firma"></div>
          <div><label>&nbsp;</label><p style="margin:0;font-size:13px;color:#666;padding-top:9px">Le firme qui sotto finiscono dentro il contratto stampato e in PDF.</p></div>
        </div>
        ${firmaBlocco("contr","Firma del Conduttore",
          "Dai il telefono al cliente e fallo firmare qui.")}
        ${/* ⛔ 24 agosto 2026: qui c'era scritto «&#9888;» e si leggeva cosi'
              com'e', codice compreso: firmaBlocco passa l'etichetta dentro
              esc(), che trasforma la & in &amp;. Il segnale di pericolo si
              scrive con il carattere vero. */
          firmaBlocco("contr2","⚠ Seconda firma — clausole 6 e 8 (artt. 1341-1342 c.c.)",
          "Senza questa seconda firma le clausole sui danni e sul ritardo NON valgono.")}
        <div class="nol-azioni" style="margin-top:16px">
          <button type="button" class="nol-az nol-az-apri" data-action="nol-contr-stampa" data-id="${n.id||""}">Stampa il contratto</button>
          <button type="button" class="nol-az" data-action="nol-contr-pdf" data-id="${n.id||""}">Contratto in PDF</button>
          ${/* ⛔ 24 agosto 2026: al collaudo il verbale e il DDT si sono
                cercati QUI per dieci minuti, e stanno in un'altra sezione.
                Chi ha appena compilato il noleggio li cerca dove sta
                lavorando: adesso da qui ci si arriva. */
            n.id?`<button type="button" class="nol-az" data-action="nol-mod" data-t="documenti" data-id="${n.id}">Verbale, DDT e foto &rarr;</button>`:""}
        </div>
        <p style="margin:10px 0 0;font-size:13px;color:#666">Il contratto si stampa da quello che hai scritto qui sopra: salva prima, poi stampa.</p>
      </div>

      <div class="nol-conto" id="nn-conto"><h4>Il conto</h4>
        <p style="margin:0;color:#666;font-size:14px">Scegli il mezzo e le date: il conto si fa da solo.</p></div>

      <div class="nol-riq nol-cam">
        <h4>Quanto si fa pagare</h4>
        <div class="nol-due">
          <div><label>Importo €</label><input id="nn-importo" inputmode="decimal" value="${v('importo')}" placeholder="0,00" data-eu></div>
          <div><label>&nbsp;</label><p style="margin:0;font-size:13px;color:#666;padding-top:9px">La cauzione sta nel riquadro qui sotto: &egrave; un deposito, non un incasso.</p></div>
        </div>
        <p style="margin:8px 0 0;font-size:13px;color:#666">L'importo lo puoi sempre correggere a mano: quello che scrivi qui è quello che si fa pagare.</p>
      </div>

      <!-- ⛔ LA CAUZIONE — 23 agosto 2026.
           Non e' un incasso: sono soldi del cliente fermi da te. Percio' qui
           si scrive anche IN CHE FORMA li hai presi e QUANDO, e al rientro si
           chiude la partita davanti a un foglio firmato. -->
      <div class="nol-riq nol-cam" id="nn-box-cauzione">
        <h4>La cauzione</h4>
        <div class="nol-due">
          <div><label>Cauzione €</label><input id="nn-cauzione" inputmode="decimal" value="${v('cauzione')}" placeholder="0,00" data-eu></div>
          <div><label>In che forma l'hai presa</label>
            <select id="nn-cau-forma">
              <option value="">— non indicata —</option>
              <option value="contanti">Contanti</option>
              <option value="assegno">Assegno</option>
              <option value="bonifico">Bonifico</option>
              <option value="carta">Preautorizzazione su carta</option>
              <option value="fideiussione">Fideiussione</option>
            </select></div>
        </div>
        <div class="nol-due" style="margin-top:8px">
          <div><label>Riferimento</label><input id="nn-cau-rif" value="${v('cauzione_rif')}" placeholder="N. assegno, CRO del bonifico, ultime 4 cifre"></div>
          <div><label>Ricevuta il</label><input id="nn-cau-data" type="date" value="${v('cauzione_ricevuta_il')}"></div>
        </div>
        <div id="nn-cau-riga" style="margin-top:10px"></div>

        <div class="nol-riq" id="nn-cau-svin" style="background:#fff;border-color:#cfd9e6;margin:12px 0 0;display:none">
          <h4>Lo svincolo</h4>
          <div id="nn-cau-danni"></div>
          <div class="nol-due">
            <div><label>Trattenuto per danni €</label><input id="nn-cau-tratt" inputmode="decimal" value="${v('cauzione_trattenuta')}" placeholder="0,00"></div>
            <div><label>Restituito al cliente €</label><input id="nn-cau-rest" inputmode="decimal" value="${v('cauzione_restituita')}" placeholder="0,00"></div>
          </div>
          <div class="nol-due" style="margin-top:8px">
            <div><label>Perch&eacute; hai trattenuto</label><input id="nn-cau-motivo" value="${v('cauzione_motivo')}" placeholder="Es. vetro laterale da sostituire"></div>
            <div><label>Svincolata il</label><input id="nn-cau-svin-data" type="date" value="${v('cauzione_svincolata_il')}"></div>
          </div>
          <label class="nol-spunta" style="margin-top:10px"><input type="checkbox" id="nn-cau-chiusa"${cauStatoDi(n)==="svincolata"?" checked":""}> Cauzione chiusa: al cliente non devo pi&ugrave; niente</label>
          <p style="margin:6px 0 0;font-size:13px;color:#666">Scrivi quanto trattieni: il resto da restituire si calcola da solo. La quietanza qui sotto &egrave; la carta che chiude la discussione.</p>
        </div>

        <div class="nol-azioni">
          <button type="button" class="nol-az nol-az-apri" data-action="nol-cauz-stampa" data-m="ricevuta" data-id="${n.id||""}">Stampa la ricevuta</button>
          <button type="button" class="nol-az" data-action="nol-cauz-pdf" data-m="ricevuta" data-id="${n.id||""}">Ricevuta in PDF</button>
          <button type="button" class="nol-az" data-action="nol-cauz-stampa" data-m="svincolo" data-id="${n.id||""}">Stampa la quietanza</button>
          <button type="button" class="nol-az" data-action="nol-cauz-pdf" data-m="svincolo" data-id="${n.id||""}">Quietanza in PDF</button>
        </div>
        <p style="margin:10px 0 0;font-size:13px;color:#666">La ricevuta si d&agrave; al cliente quando prendi i soldi; la quietanza quando glieli rendi. Salva prima, poi stampa.</p>
      </div>

      <div class="field"><label>Pagamento</label><select id="nn-pagamento">
        <option value="da_pagare">Da pagare</option>
        <option value="pagato">Pagato</option></select></div>
      <div class="field"><label>Danni al rientro</label><input id="nn-danni" value="${v('danni')}" placeholder="Se il mezzo è tornato con qualcosa di rotto"></div>
      <div class="field"><label>Note</label><input id="nn-note" value="${v('note')}" placeholder="Quello che serve ricordare"></div>
      ${nolDocBlocco("noleggio",n.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-noleggio" data-id="${n.id||""}">${isNew?"Crea":"Salva"}</button></div>`);

    await popolaSelectNoleggi();
    /* prima si prova col collegamento vero; se quel noleggio e' vecchio e non
       ce l'ha, si ripiega sul nome scritto */
    $("#nn-mezzo").value   = n.mezzo_id   || nolIdDaNome("#nn-mezzo",   n.mezzo)   || "";
    $("#nn-cliente").value = n.cliente_id || nolIdDaNome("#nn-cliente", n.cliente) || "";
    if($("#nn-reparto")) $("#nn-reparto").value = n.mestiere_id || "";
    if(n.stato_pagamento) $("#nn-pagamento").value=n.stato_pagamento;
    nolConsumi = Array.isArray(n.consumi) ? n.consumi.slice() : [];
    nolDisegnaConsumi();
    nolOperatori = Array.isArray(n.operatori) ? n.operatori.slice() : [];
    bindSeg("nn-nolo"); bindSeg("nn-fase");
    /* la fase di partenza: quella salvata, o quella che dicono le date */
    const faseIniziale = n.fase || (n.data_rientro_effettivo ? "rientrato"
      : (n.data_uscita && n.data_uscita > todayStr() ? "prenotato" : "fuori"));
    const segF=$('#nn-fase button[data-v="'+faseIniziale+'"]');
    if(segF){$$("#nn-fase button").forEach(x=>x.classList.remove("on"));segF.classList.add("on");}
    const segNolo=$('#nn-nolo button[data-v="'+(n.tipo_nolo||"freddo")+'"]');
    if(segNolo){$$("#nn-nolo button").forEach(x=>x.classList.remove("on"));segNolo.classList.add("on");}
    nolDisegnaOperatori();
    nolMostraOperatori();
    nolCauApert=n;
    /* 24 agosto 2026: si riparte puliti. L'importo torna «agganciato» solo
       se all'ultimo salvataggio era uguale al conto di allora. */
    nolImportoAMano=false;
    nolImportoSalvato=(n.importo_calcolato==null?null:Number(n.importo_calcolato));
    firmaSveglia(["contr","contr2"]);
    if(n.cauzione_forma&&$("#nn-cau-forma")) $("#nn-cau-forma").value=n.cauzione_forma;
    nolMostraCauzione();
    nolAggiornaConto();
  }
