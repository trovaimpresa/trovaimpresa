// [SPOSTATO] gest-ore-spese.js: era dentro gest-core.js, righe 8085-9228, spostato identico.
  /* ============================================================
     ===== ORE E TIMBRATURE (6 settembre 2026) =====
     La seconda linguetta di «Agenda operatore». Prima le timbrature si
     vedevano SOLO dal database: servivano all'operaio e non al titolare.

     ⚠️ DUE CONTI SEPARATI, MAI SOMMATI.
     · «Ore timbrate» = le coppie entrata/uscita di gest_timbrature
     · «Ore scritte»  = gest_ore, quelle di «Segna la giornata»
     Sono due misure della stessa giornata, non due pezzi da sommare: se si
     sommassero, la busta paga verrebbe doppia. Si mostrano affiancate
     apposta, cosi' una differenza si vede PRIMA di pagare (scelta di
     Alessio, 6 set).

     ⚠️ NIENTE FILTRO PER REPARTO. gest_ore ha mestiere_id, gest_timbrature
     no (il telefono non chiede in che reparto sei). Filtrare una sola delle
     due darebbe due numeri non confrontabili, in silenzio. Quindi qui si
     contano le ore di TUTTA l'azienda, e la scritta in cima lo dice.

     ⚠️ LA GIORNATA APERTA. Chi entra e non timbra l'uscita lascia una
     giornata che non conta ore. Il titolare puo' metterla lui: si aggiunge
     una riga uscita con corretta_da = il suo uid, e resta scritto che l'ha
     messa lui. La riga dell'operaio non si tocca mai.
     ============================================================ */
  let oreMese = null;                    /* {a, m} — si riempie al primo giro */
  let oreAperte = {};                    /* id persona -> true se il dettaglio e' aperto */
  let ORE_ULTIMO = null;                 /* l'ultimo calcolo, per il file Excel */

  const _oreHM = ms => {
    if(!(ms > 0)) return "0h 00m";
    const m = Math.round(ms / 60000);
    return Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m";
  };
  const _oreDec = ms => (ms > 0 ? Math.round(ms / 36000) / 100 : 0);   /* 9,42 per Excel */
  const _oreHHMM = iso => { const d = new Date(iso);
    return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0"); };
  const _oreGiorno = iso => { const d = new Date(iso);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
  const _oreGiornoIt = g => { const [a,m,gg] = g.split("-");
    const d = new Date(+a, +m-1, +gg);
    return ["dom","lun","mar","mer","gio","ven","sab"][d.getDay()] + " " + (+gg) + " "
         + ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"][+m-1]; };
  const _oreIniz = n => (n||"?").trim().slice(0,2).toUpperCase();

  function _oreMeseOra(){
    if(!oreMese){ const n = new Date(); oreMese = { a:n.getFullYear(), m:n.getMonth() }; }
    return oreMese;
  }
  function _oreSpostaMese(passo){
    const q = _oreMeseOra();
    let m = q.m + passo, a = q.a;
    if(m < 0){ m = 11; a--; } else if(m > 11){ m = 0; a++; }
    oreMese = { a:a, m:m };
    oreAperte = {};
    renderOre();
  }

  /* le coppie entrata/uscita di UNA persona in UN giorno.
     Se l'ultima entrata non ha uscita, la giornata resta APERTA e vale 0. */
  function _oreCoppie(righe){
    const ord = righe.slice().sort((x,y) => new Date(x.quando) - new Date(y.quando));
    let ms = 0, aperta = null, buchi = [], pezzi = [];
    ord.forEach(r => {
      if(r.tipo === "entrata"){
        if(aperta === null) aperta = r;
      }else if(aperta !== null){
        ms += new Date(r.quando) - new Date(aperta.quando);
        pezzi.push(_oreHHMM(aperta.quando) + " → " + _oreHHMM(r.quando));
        aperta = null;
      }
    });
    if(aperta !== null) buchi.push(aperta);      /* entrato e mai uscito */
    return { ms:ms, pezzi:pezzi, buchi:buchi };
  }

  async function renderOre(){
    const body = $("#ore-body");
    if(!body) return;
    if(!sb || !sbUid){ body.innerHTML = tabVuoto("Ore non disponibili","Serve il collegamento al database.",AG_VUOTO); return; }

    const q = _oreMeseOra();
    const MESI_L = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
    const dal = q.a + "-" + String(q.m+1).padStart(2,"0") + "-01";
    const ultimo = new Date(q.a, q.m+1, 0).getDate();
    const al  = q.a + "-" + String(q.m+1).padStart(2,"0") + "-" + String(ultimo).padStart(2,"0");
    const lab = $("#ore-mese-lab"); if(lab) lab.textContent = MESI_L[q.m].charAt(0).toUpperCase()+MESI_L[q.m].slice(1) + " " + q.a;

    body.innerHTML = '<p class="fatt-empty">Conto le ore…</p>';

    /* tutta la squadra dell'azienda, non del solo reparto: vedi la nota in cima */
    const [rOps, rTmb, rOre] = await Promise.all([
      sb.from("gest_operatori").select("id,nome").eq("user_id", sbUid),
      sb.from("gest_timbrature").select("id,tipo,quando,ora_telefono,creato_da,corretta_da")
        .eq("user_id", sbUid).is("eliminato_il", null)
        .gte("quando", dal + "T00:00:00").lte("quando", al + "T23:59:59.999"),
      sb.from("gest_ore").select("ore,operatore_id,data")
        .eq("user_id", sbUid).is("eliminato_il", null)
        .gte("data", dal).lte("data", al)
    ]);

    if(rTmb && rTmb.error){
      body.innerHTML = '<p class="fatt-empty">Le timbrature non riesco a leggerle: '+esc(rTmb.error.message||"errore")+'</p>';
      return;
    }
    const OPS = rOps && rOps.data ? rOps.data : [];
    const NOMI = Object.fromEntries(OPS.map(o => [o.id, o.nome || "senza nome"]));
    const TMB = (rTmb && rTmb.data) || [];
    const ORE = (rOre && !rOre.error && rOre.data) ? rOre.data : [];

    /* timbrature: persona -> giorno -> righe */
    const perPersona = {};
    TMB.forEach(r => {
      const p = r.creato_da; if(!p) return;
      const g = _oreGiorno(r.ora_telefono || r.quando);
      (perPersona[p] = perPersona[p] || {});
      (perPersona[p][g] = perPersona[p][g] || []).push({ id:r.id, tipo:r.tipo, quando:r.ora_telefono || r.quando, capo:!!r.corretta_da });
    });
    /* ore scritte a mano: persona -> minuti */
    const scritte = {};
    ORE.forEach(r => { if(r.operatore_id) scritte[r.operatore_id] = (scritte[r.operatore_id]||0) + (+r.ore||0); });

    /* chi far vedere: chi ha timbrato, chi ha ore scritte, e tutta la squadra */
    const ids = Array.from(new Set(OPS.map(o=>o.id).concat(Object.keys(perPersona)).concat(Object.keys(scritte))));
    const PERS = ids.map(id => {
      const giorni = perPersona[id] || {};
      let ms = 0, nGiorni = 0, buchi = [], det = [];
      Object.keys(giorni).sort().forEach(g => {
        const c = _oreCoppie(giorni[g]);
        if(c.ms > 0) nGiorni++;
        ms += c.ms;
        c.buchi.forEach(b => buchi.push({ giorno:g, riga:b }));
        det.push({ giorno:g, ms:c.ms, pezzi:c.pezzi, buco:c.buchi[0] || null });
      });
      const scrMs = (scritte[id] || 0) * 3600000;
      return { id:id, nome:NOMI[id] || "Persona non in elenco", ms:ms, giorni:nGiorni,
               scrMs:scrMs, det:det, buchi:buchi, niente:(ms === 0 && scrMs === 0 && buchi.length === 0) };
    }).sort((a,b) => b.ms - a.ms || a.nome.localeCompare(b.nome));

    ORE_ULTIMO = { mese: MESI_L[q.m] + " " + q.a, pers: PERS };

    const totMs   = PERS.reduce((s,p) => s + p.ms, 0);
    const totScr  = PERS.reduce((s,p) => s + p.scrMs, 0);
    const totBuchi= PERS.reduce((s,p) => s + p.buchi.length, 0);
    const quanti  = PERS.filter(p => p.ms > 0).length;

    if(!TMB.length && !ORE.length){
      body.innerHTML = tabVuoto("Nessuna ora in " + MESI_L[q.m],
        "Qui arrivano le ore che la squadra timbra dal telefono e quelle scritte in «Segna la giornata». Se il mese è appena iniziato, è normale.", AG_VUOTO);
      return;
    }

    /* ---- l'avviso delle giornate aperte ---- */
    let H = "";
    if(totBuchi){
      const primo = PERS.find(p => p.buchi.length);
      const b = primo.buchi[0];
      H += '<div class="ore-avviso"><span class="ore-av-ic">⚠️</span><div>'
        + '<span class="ore-av-t">' + totBuchi + (totBuchi===1 ? " giornata rimasta aperta" : " giornate rimaste aperte") + '</span>'
        + '<p>' + esc(primo.nome) + ' è entrato <b>' + _oreGiornoIt(b.giorno) + '</b> alle ' + _oreHHMM(b.riga.quando)
        + ' e non ha mai timbrato l\'uscita. Finché resta aperta, quella giornata non conta ore.'
        + (totBuchi > 1 ? ' Le altre le trovi aprendo le persone qui sotto.' : '')
        + ' Aprila e mettici tu l\'orario di uscita.</p></div></div>';
    }

    /* ---- le quattro caselle ---- */
    H += '<div class="ore-stat">'
      + '<div class="ore-st ok"><div class="n">'  + _oreHM(totMs)  + '</div><div class="l">Ore timbrate</div></div>'
      + '<div class="ore-st"><div class="n">'     + _oreHM(totScr) + '</div><div class="l">Ore scritte a mano</div></div>'
      + '<div class="ore-st' + (totBuchi ? ' att' : '') + '"><div class="n">' + totBuchi + '</div><div class="l">Giornate aperte</div></div>'
      + '<div class="ore-st"><div class="n">' + quanti + ' / ' + PERS.length + '</div><div class="l">Chi ha timbrato</div></div>'
      + '</div>';

    /* ---- la tabella, persona per persona ---- */
    H += '<div class="ore-tab">'
      + '<div class="ore-cap"><span class="c1">Persona</span><span class="c2">Giorni</span>'
      + '<span class="c3">Ore timbrate</span><span class="c4">Ore scritte</span><span class="c5">Differenza</span><span class="c6"></span></div>';

    PERS.forEach(p => {
      const aperto = !!oreAperte[p.id];
      const diffMs = p.ms - p.scrMs;
      let diff;
      if(p.ms === 0 && p.scrMs === 0)      diff = '<span class="ore-diff no">non ha timbrato</span>';
      else if(p.ms === 0)                  diff = '<span class="ore-diff no">solo scritte</span>';
      else if(p.scrMs === 0)               diff = '<span class="ore-diff no">solo timbrate</span>';
      else if(Math.abs(diffMs) < 900000)   diff = '<span class="ore-diff ok">uguali</span>';   /* meno di 15 minuti */
      else diff = '<span class="ore-diff att">' + (diffMs < 0 ? "−" : "+") + _oreHM(Math.abs(diffMs)) + '</span>';

      H += '<div class="ore-riga' + (p.niente ? ' spenta' : '') + '" data-action="ore-apri" data-id="' + esc(p.id) + '">'
        + '<span class="c1"><span class="ore-pall">' + esc(_oreIniz(p.nome)) + '</span>' + esc(p.nome) + '</span>'
        + '<span class="c2">' + (p.giorni || "0") + '</span>'
        + '<span class="c3 ore-forte">' + (p.ms ? _oreHM(p.ms) : "—") + '</span>'
        + '<span class="c4">' + (p.scrMs ? _oreHM(p.scrMs) : "—") + '</span>'
        + '<span class="c5">' + diff + '</span>'
        + '<span class="c6">' + (p.det.length ? (aperto ? "Chiudi ↑" : "Apri ↓") : "") + '</span>'
        + '</div>';

      if(aperto && p.det.length){
        H += '<div class="ore-giorni">';
        p.det.forEach(d => {
          if(d.buco){
            H += '<div class="ore-g buco"><span class="d">' + _oreGiornoIt(d.giorno) + '</span>'
              + '<span class="t">' + _oreHHMM(d.buco.quando) + ' → <b>manca l\'uscita</b></span>'
              + '<span class="fix" onclick="event.stopPropagation()">'
              + '<input type="time" class="ore-ora" id="fix-' + esc(d.buco.id) + '" value="17:00">'
              + '<button class="btn btn-sm" data-action="ore-fix" data-id="' + esc(d.buco.id) + '" data-op="' + esc(p.id) + '" data-g="' + d.giorno + '" data-e="' + _oreHHMM(d.buco.quando) + '">Metti l\'uscita</button>'
              + '</span></div>';
          }else{
            H += '<div class="ore-g"><span class="d">' + _oreGiornoIt(d.giorno) + '</span>'
              + '<span class="t">' + esc(d.pezzi.join(" · ")) + '</span>'
              + '<span class="h">' + _oreHM(d.ms) + '</span></div>';
          }
        });
        H += '</div>';
      }
    });

    let diffTot = totMs - totScr, dt;
    if(!totMs || !totScr) dt = '<span class="ore-diff no">—</span>';
    else if(Math.abs(diffTot) < 900000) dt = '<span class="ore-diff ok">uguali</span>';
    else dt = '<span class="ore-diff att">' + (diffTot < 0 ? "−" : "+") + _oreHM(Math.abs(diffTot)) + '</span>';

    H += '<div class="ore-riga tot"><span class="c1">Totale squadra</span>'
      + '<span class="c2">' + PERS.reduce((s,p)=>s+p.giorni,0) + '</span>'
      + '<span class="c3">' + _oreHM(totMs) + '</span>'
      + '<span class="c4">' + _oreHM(totScr) + '</span>'
      + '<span class="c5">' + dt + '</span><span class="c6"></span></div>';
    H += '</div>';

    body.innerHTML = H;
  }

  /* mette l'uscita che l'operaio ha dimenticato.
     ⚠️ NON si tocca la riga sua: si AGGIUNGE una riga uscita, firmata col
     proprio uid in corretta_da. Cosi' fra sei mesi si sa chi l'ha messa. */
  async function oreMettiUscita(t){
    const idEnt = t.dataset.id, opId = t.dataset.op, g = t.dataset.g, entrata = t.dataset.e;
    const inp = document.getElementById("fix-" + idEnt);
    const ora = inp ? inp.value : "";
    if(!/^\d{2}:\d{2}$/.test(ora)){ toast("Scrivi l'orario di uscita (per esempio 17:00)."); return; }
    if(ora <= entrata){ toast("L'uscita deve essere dopo l'entrata delle " + entrata + "."); return; }
    const quando = new Date(g + "T" + ora + ":00");
    t.disabled = true;
    const r = await sb.from("gest_timbrature").insert({
      user_id:    sbUid,
      creato_da:  opId,
      tipo:       "uscita",
      quando:     quando.toISOString(),
      ora_telefono: null,                       /* non l'ha premuta lui: non c'e' ora del telefono */
      client_id:  "capo-" + Date.now().toString(36) + Math.random().toString(36).slice(2,7),
      corretta_da:  sbUid,
      corretta_il:  new Date().toISOString(),
      nota:       "uscita messa dal titolare (mancava)"
    });
    t.disabled = false;
    if(r && r.error){ toast("Non salvata: " + (r.error.message || "errore")); return; }
    toast("Uscita messa alle " + ora + " ✔");
    renderOre();
  }

  /* il file per Excel: una riga per persona, ore in numero (9,42) e in ore e minuti */
  function oreScaricaCsv(){
    if(!ORE_ULTIMO || !ORE_ULTIMO.pers.length){ toast("Non c'è ancora niente da scaricare."); return; }
    const righe = [["Persona","Giorni timbrati","Ore timbrate","Ore timbrate (numero)","Ore scritte a mano","Ore scritte (numero)","Giornate aperte"]];
    ORE_ULTIMO.pers.forEach(p => righe.push([
      p.nome, p.giorni, _oreHM(p.ms), String(_oreDec(p.ms)).replace(".", ","),
      _oreHM(p.scrMs), String(_oreDec(p.scrMs)).replace(".", ","), p.buchi.length
    ]));
    /* ";" e BOM: cosi' Excel italiano apre le colonne giuste e legge gli accenti */
    const testo = "﻿" + righe.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([testo], { type:"text/csv;charset=utf-8" }));
    a.download = "ore-" + ORE_ULTIMO.mese.replace(" ", "-") + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ============================================================
     UPGRADE 2026 — Spese/margine, Preventivi, Report
     ============================================================ */
  const eur2=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",minimumFractionDigits:2,useGrouping:true}).format(_cent2(n));

  /* ---- SPESE / MARGINE per lavoro ---- */
  let speseLavoroId=null;
  async function renderSpeseBlock(lavoroId,importo){
    speseLavoroId=lavoroId;
    const wrap=$("#spese-wrap");if(!wrap||!sb||!sbUid)return;
    wrap.style.display="block";
    /* created_at serve al grafico: la colonna "data" è nullable (l'inserimento non la passa
       e arriva dal default del DB), quindi se manca la data della spesa si usa quella. */
    /* fornitore_id è arrivato con la Fase 2 dei Fornitori: se la colonna
       manca (migrazione non eseguita) si rilegge senza, niente si rompe */
    let conForn=true;
    let r=await sb.from("gest_spese").select("id,descrizione,importo,data,created_at,fornitore_id").eq("user_id",sbUid).eq("lavoro_id",lavoroId).order("created_at");
    if(r.error&&/fornitore_id/i.test(r.error.message||"")&&/column|schema cache/i.test(r.error.message||"")){
      conForn=false;
      r=await sb.from("gest_spese").select("id,descrizione,importo,data,created_at").eq("user_id",sbUid).eq("lavoro_id",lavoroId).order("created_at");
    }
    const sp=r.data||[];
    /* la tendina del fornitore, riempita dall'anagrafica (facoltativa) */
    const selF=$("#sp-forn");let fMap={};
    if(conForn){
      if(!fornCache.length){const {data:fo}=await sb.from("gest_fornitori").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("nome");fornCache=fo||fornCache;}
      fMap=Object.fromEntries(fornCache.map(x=>[String(x.id),x.nome]));
      if(selF){const curV=selF.value;selF.style.display=fornCache.length?"":"none";selF.innerHTML='<option value="">— fornitore —</option>'+fornCache.map(x=>'<option value="'+x.id+'">'+esc(x.nome)+'</option>').join("");if(curV)selF.value=curV;}
    }else if(selF){selF.style.display="none";}
    const tot=sp.reduce((s,x)=>s+(+x.importo||0),0);
    $("#spese-list").innerHTML=sp.length?sp.map(x=>{
      const nf=x.fornitore_id&&fMap[String(x.fornitore_id)];
      return `<div class="spesa-row"><span>${esc(x.descrizione)}${nf?`<small class="sp-forn">da ${esc(nf)}</small>`:""}</span><b>${eur2(x.importo)}</b><button type="button" class="sdel" data-action="spesa-del" data-id="${x.id}">🗑</button></div>`;
    }).join(""):`<p class="fatt-empty">Nessuna spesa registrata.</p>`;
    /* ===== 9 agosto 2026 — anche le fatture dei fornitori nel margine =====
       Erano collegate al lavoro e non le leggeva nessuno. Stanno su una RIGA
       LORO, non sommate alle Spese: se qualcuno segna la stessa cosa due volte
       (una come Spesa e una come fattura fornitore) si vede subito. */
    let totFF=0;
    try{
      const {data:ff}=await sb.from("gest_fatture_fornitori").select("importo")
        .eq("user_id",sbUid).eq("lavoro_id",lavoroId);
      totFF=(ff||[]).reduce((a,x)=>a+(+x.importo||0),0);
    }catch(e){}
    /* 12 agosto 2026 — la manodopera entra nel margine: ore x costo orario
       della persona che le ha fatte, media della squadra per le ore senza
       nome. Prima il costo orario si compilava e non serviva a niente. */
    let md=0, oreSenzaNome=0, mediaSquadra=0, oreLette=true;
    try{
      const _l=[{id:lavoroId, ore:_numIt("#j-ore")||0}];
      const _m=await caricaManodopera(curMestiere(),_l);
      md=_m.per[String(lavoroId)]||0;
      oreSenzaNome=_m.senzaNome[String(lavoroId)]||0;
      mediaSquadra=(_m.tariffe&&+_m.tariffe.media)||0;
      oreLette=(_m.oreLette!==false);
    }catch(e){ oreLette=false; }
    const imp=($("#j-imp")?(_numIt("#j-imp")||0):(+importo||0));
    const marg=margineLavoro(imp,tot,totFF,md);
    /* ⚠️ 18 agosto 2026 — «Spese: −0,00 €». Il meno era scritto a mano
       davanti al numero, sempre, anche quando di spese non ce n'erano.
       Un meno davanti a zero non vuol dire niente e si legge male: adesso
       il meno compare solo quando c'e' davvero qualcosa da togliere. */
    const _meno=n=>(n>0?"−":"")+eur2(n);
    $("#margine-box").innerHTML=`<span>Lavoro: ${eur2(imp)}</span>`
      +`<span>Spese: <span class="sp">${_meno(tot)}</span></span>`
      +(totFF?`<span>Fatture fornitori: <span class="sp">${_meno(totFF)}</span></span>`:"")
      +(md?`<span>Manodopera: <span class="sp">${_meno(md)}</span></span>`:"")
      +`<span>Margine: <span class="${marg>=0?'pos':'neg'}">${eur2(marg)}</span></span>`
      /* 12 agosto 2026 (sera) — la riga sotto diceva "contate al costo medio della
         squadra" anche quando la media era ZERO, cioe' quando non le stava contando
         affatto. Adesso il caso "nessun costo orario" ha la sua frase e dice cosa fare. */
      +(oreSenzaNome
          ? (mediaSquadra>0
              ? `<span class="sp-forn" style="flex-basis:100%">${oreSenzaNome} ore senza il nome di chi le ha fatte: contate al costo medio della squadra (${eur2(mediaSquadra)} l'ora)</span>`
              /* 12 agosto 2026 (notte) — questa frase diceva "la manodopera non
                 entra nel margine", e da quando la media si fa sui soli vivi
                 poteva stare sotto una manodopera che invece c'era eccome (le
                 ore INTESTATE a qualcuno si contano lo stesso, anche se quel
                 qualcuno e' nel Cestino). Adesso parla solo delle ore che
                 riguarda davvero, cioe' quelle senza nome. */
              : `<span class="sp-forn" style="flex-basis:100%">${oreSenzaNome} ore senza il nome di chi le ha fatte: queste non entrano nel margine, perché nessuno di chi c'è adesso in squadra ha il costo orario. Scrivilo nella scheda della persona, in Squadra.</span>`)
          : "")
      /* ⛔ 22 agosto 2026 — se le ore non si sono potute leggere il margine
         qui sopra e' scritto SENZA la manodopera, e senza questa riga
         sembrerebbe un margine vero. Meglio saperlo che crederci. */
      +(oreLette?"":`<span class="sp-forn" style="flex-basis:100%">⚠️ Non sono riuscito a leggere le ore di questo lavoro: nel margine qui sopra <b>la manodopera non c'è</b>. Ricarica la pagina.</span>`);
    renderAndamentoSpese(sp,imp);
  }

  /* ============================================================
     12 agosto 2026 — IL MARGINE DI UN LAVORO, IN UN POSTO SOLO

     Due difetti in uno.

     1) LA MANODOPERA NON ENTRAVA IN NIENTE. Il modulo Squadra dice, testuale:
        "Il costo orario serve per calcolare la manodopera sui lavori". Lo
        compilavi per ogni operaio e in tutto il progetto quel numero veniva
        letto in due sole righe: quella che lo salva e quella che lo rimette
        nel modulo. Nessun conto lo usava. Un lavoro da 3.000 € con 80 ore a
        22 €/h (1.760 € di manodopera vera) risultava in guadagno di 3.000
        invece che di 1.240.

     2) LO STESSO MARGINE USCIVA CON QUATTRO NUMERI DIVERSI: la scheda del
        lavoro toglieva anche le fatture dei fornitori, il Report no, il CSV
        nemmeno, e il Riepilogo non segnalava mai quel lavoro fra quelli in
        perdita. Quattro schermate, quattro risposte alla stessa domanda.

     Adesso il conto e' uno solo:
        margine = importo − spese − fatture dei fornitori − manodopera
     e lo fanno tutte e quattro chiamando queste funzioni.

     Le ore registrate SENZA dire chi le ha fatte si contano con la media dei
     costi orari della squadra: se non lo facessimo, dimenticare un nome
     farebbe risultare il lavoro piu' redditizio di quello che e'.
     ============================================================ */
  /* 12 agosto 2026 (notte) — DUE ELENCHI, NON UNO.
     "per" (la tariffa di ognuno) si costruisce su TUTTI, anche su chi sta nel
     Cestino: le sue ore sono il costo di lavori gia' chiusi e quel conto non
     deve muoversi piu'.
     "media" invece si fa solo sui VIVI, perche' e' il prezzo con cui si contano
     le ore registrate senza nome: quelle di oggi le fa la squadra di oggi. Se
     si mettesse tutto insieme, dopo tre anni e dieci ex operai un'ora anonima
     verrebbe pagata al costo medio di undici persone di cui una in ditta — e
     l'avviso "nessuno in squadra ha il costo orario" non comparirebbe piu'
     nemmeno quando e' vero. */
  function costiOrari(tutti,vivi){
    const per={}; let somma=0, n=0;
    (tutti||[]).forEach(function(o){
      if(!o||o.id==null)return;
      per[String(o.id)]=+o.costo_orario||0;
    });
    (vivi||tutti||[]).forEach(function(o){
      if(!o)return;
      const c=+o.costo_orario||0;
      if(c>0){somma+=c;n++;}
    });
    return {per:per, media:n?somma/n:0};
  }
  /* Costo della manodopera per ogni lavoro.
     righeOre = le righe di gest_ore (lavoro_id, operatore_id, ore).
     lavori   = serve per il ripiego: un lavoro che non ha righe ore ma ha il
                totale scritto su gest_lavori.ore (le versioni vecchie facevano
                cosi') non deve valere zero. */
  function costoManodopera(righeOre, lavori, tariffe){
    const perLav={}, conRighe={}, senzaNome={};
    (righeOre||[]).forEach(function(o){
      const h=+o.ore||0; if(!h)return;
      const k=String(o.lavoro_id||"");
      if(!k)return;
      conRighe[k]=true;
      const chi=(o.operatore_id!=null)?String(o.operatore_id):"";
      let c;
      if(chi&&tariffe.per[chi]!=null&&tariffe.per[chi]>0){ c=tariffe.per[chi]; }
      else { c=tariffe.media; senzaNome[k]=(senzaNome[k]||0)+h; }
      perLav[k]=(perLav[k]||0)+h*(+c||0);
    });
    (lavori||[]).forEach(function(l){
      const k=String(l.id);
      if(conRighe[k])return;
      const h=+l.ore||0;
      if(h>0){ perLav[k]=h*tariffe.media; senzaNome[k]=h; }
    });
    return {per:perLav, senzaNome:senzaNome};
  }
  function margineLavoro(importo,spese,fattForn,manodopera){
    return (+importo||0)-(+spese||0)-(+fattForn||0)-(+manodopera||0);
  }
  /* legge in un colpo solo quello che serve alla manodopera di un reparto.
     Se la tabella delle ore non c'e' ancora, torna tutto a zero senza rompere
     niente: il margine resta quello di prima.

     12 agosto 2026 (notte) — LE TARIFFE SI LEGGONO DALLA PORTA DI SERVIZIO.
     Qui c'era sb.from("gest_operatori"), che passa dal Cestino e quindi salta
     le persone eliminate. Le loro ore pero' restano — e devono restare, sono il
     costo della manodopera di lavori gia' chiusi — cosi' cadevano nel ripiego
     "media della squadra" e il margine di lavori FINITI cambiava da solo:
     un lavoro da 3.000 € con 10 ore di una persona a 22 €/h passava da 2.780 €
     di margine a 2.900 €, e se quella persona era l'unica in squadra a 3.000 €.
     Un lavoro che era in perdita smetteva di esserlo.
     Il messaggio di conferma dell'eliminazione promette il contrario, testuale:
     "le ore registrate servono al margine dei lavori".
     sb.raw vede anche chi sta nel Cestino, quindi la tariffa resta al suo posto
     e i conti di ieri non si muovono. Qui escono solo numeri (la tariffa e la
     media): nessun nome di persona eliminata finisce sullo schermo.
     Resta un caso che non si puo' chiudere da qui: con "Elimina per sempre" la
     riga sparisce davvero e il database mette a NULL gest_ore.operatore_id —
     li' il ripiego sulla media e' l'unica cosa che rimane. */
  async function caricaManodopera(mid,lavori){
    /* ⛔ 22 agosto 2026 — «oreLette» dice se le ore si sono POTUTE leggere.
       Prima non c'era: se la lettura andava storta il conto proseguiva come
       se le ore fossero ZERO, in silenzio, e il lavoro sembrava piu' in
       guadagno di quello che era. «Nessuna ora» e «non ho potuto leggerle»
       sono due cose diverse — la stessa lezione della squadra, dieci righe
       piu' sotto, che qui non era stata applicata. */
    const vuoto={per:{},senzaNome:{},tariffe:{per:{},media:0},oreLette:false};
    if(!sb||!sbUid)return vuoto;
    try{
      /* .bind(sb) NON si tocca: sb.from staccato dall'oggetto perde il "this" e
         dentro supabase-js fa "this.rest.from(...)" su undefined. Il try qui
         sotto se lo mangiava in silenzio e la manodopera spariva da TUTTI i
         margini — peggio del difetto che questa riga chiude. Con lo stub delle
         prove non si vedeva: il suo from e' una arrow e il this non gli serve. */
      const leggiTutti=(typeof sb.raw==="function")?sb.raw:sb.from.bind(sb);
      const ids=(lavori||[]).map(l=>l.id).filter(Boolean);
      const [{data:ops},rVivi,ore]=await Promise.all([
        leggiTutti("gest_operatori").select("id,costo_orario").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_operatori").select("id,costo_orario").eq("user_id",sbUid).eq("mestiere_id",mid),
        ids.length
          ? sb.from("gest_ore").select("lavoro_id,operatore_id,ore").eq("user_id",sbUid).in("lavoro_id",ids)
          : Promise.resolve({data:[]})
      ]);
      /* "squadra vuota" e "non ho potuto leggere la squadra" sono due cose
         diverse e vanno tenute separate: la prima e' un'informazione vera (media
         zero, e l'avviso deve comparire), la seconda no. Scrivendo opsVivi||[]
         diventavano la stessa cosa — l'array vuoto e' truthy — e se cadeva solo
         questa lettura la media andava a zero in silenzio: le ore senza nome
         sparivano dal margine e il gestionale diceva di scrivere un costo orario
         che era gia' scritto. */
      const opsVivi=(rVivi&&!rVivi.error&&rVivi.data)?rVivi.data:(ops||[]);
      const tariffe=costiOrari(ops||[],opsVivi);
      /* ⚠️ senza lavori da guardare la lettura non parte nemmeno e al suo
         posto arriva {data:[]}: nessun errore, elenco vuoto, quindi conta
         come «lette» senza bisogno di scriverlo a parte. (Il caso a parte
         l'avevo scritto, e il sabotaggio che lo toglieva restava muto: era
         una riga che non serviva a niente.) */
      const oreLette=!!(ore && !ore.error && ore.data);
      const md=costoManodopera((ore&&ore.data)||[],lavori,tariffe);
      return {per:md.per, senzaNome:md.senzaNome, tariffe:tariffe, oreLette:oreLette};
    }catch(e){ return vuoto; }
  }

  /* ---- ANDAMENTO SPESE / PREVENTIVO (dentro il lavoro) ----
     Il Report racconta com'e' andata a cose fatte; qui serve capire se il cantiere
     sta sforando MENTRE è ancora aperto. Si disegna solo dove c'e' davvero un
     andamento da leggere: almeno 3 spese e almeno 15 giorni fra la prima e l'ultima.
     Su un lavoro di mezza giornata sarebbe soltanto rumore.
     SVG scritto a mano di proposito: una libreria di grafici peserebbe più di
     tutto il resto della pagina per una linea e un tratteggio. */
  const AND_MIN_SPESE=3, AND_MIN_GIORNI=15;
  /* la data buona della spesa: "data" se c'e', altrimenti il giorno in cui è stata registrata */
  const _spData=x=>(x.data||String(x.created_at||"").slice(0,10)||"");
  const _diffGG=(a,b)=>Math.round((Date.parse(b+"T00:00:00")-Date.parse(a+"T00:00:00"))/86400000);
  /* sotto l'80% si è larghi, fino al 100% si sta stretti, oltre si è sforato.
     Senza preventivo non c'e' niente da giudicare: colore neutro. */
  const _colSpesa=p=>p===null?"var(--blu)":p<80?"var(--ok)":p<=100?"var(--attesa)":"var(--err)";
  function renderAndamentoSpese(sp,imp){
    const wrap=$("#andamento-wrap");if(!wrap)return;
    const S=(sp||[]).filter(x=>_spData(x)).sort((a,b)=>_spData(a).localeCompare(_spData(b)));
    const oggi=todayStr();
    if(S.length<AND_MIN_SPESE||_diffGG(_spData(S[0]),_spData(S[S.length-1]))<AND_MIN_GIORNI){
      wrap.style.display="none";wrap.innerHTML="";return;
    }
    wrap.style.display="block";
    /* un punto per data, col totale speso fino a li' (non la singola spesa) */
    const punti=[];let acc=0;
    S.forEach(x=>{
      acc+=+x.importo||0;
      const d=_spData(x);
      if(punti.length&&punti[punti.length-1].d===d)punti[punti.length-1].v=acc;
      else punti.push({d:d,v:acc});
    });
    const tot=acc, t0=punti[0].d, ultima=punti[punti.length-1].d;
    const t1=ultima>oggi?ultima:oggi;                 /* l'asse arriva a oggi */
    if(ultima!==t1)punti.push({d:t1,v:tot});          /* dall'ultima spesa a oggi la somma non cresce */
    const span=Math.max(_diffGG(t0,t1),1);
    const W=Math.max(280,Math.min(900,wrap.clientWidth||600)), H=180;
    const PL=46,PR=12,PT=14,PB=22;                    /* spazio per le etichette */
    const x0=PL,x1=W-PR,y0=PT,y1=H-PB;
    const yMax=Math.max(tot,imp||0)*1.08||1;          /* un po' d'aria sopra la linea più alta */
    const X=d=>x0+(x1-x0)*(_diffGG(t0,d)/span);
    const Y=v=>y1-(y1-y0)*(v/yMax);
    /* ⛔ 25 agosto 2026 — 11 px anche qui dentro: le etichette del grafico
   sono testo come tutto il resto, e la regola dei 13 px non fa
   eccezioni per i disegni. */
  const LAB='style="fill:var(--testo-3);font-size:13px"';
    let griglia="";
    [0,.5,1].forEach(f=>{
      const y=y1-(y1-y0)*f;
      griglia+=`<line x1="${x0}" y1="${y.toFixed(1)}" x2="${x1}" y2="${y.toFixed(1)}" style="stroke:var(--bordo)" stroke-width="1"/>`
             +`<text x="${x0-6}" y="${(y+3.5).toFixed(1)}" text-anchor="end" ${LAB}>${eurTondo(yMax*f)}</text>`;
    });
    let prev="";
    if(imp>0){
      const y=Y(imp), stretto=(y-y0)<14;              /* riga alta: l'etichetta va sotto, non fuori */
      prev=`<line x1="${x0}" y1="${y.toFixed(1)}" x2="${x1}" y2="${y.toFixed(1)}" style="stroke:var(--testo-2)" stroke-width="1" stroke-dasharray="5 4"/>`
         +`<text x="${x1}" y="${(stretto?y+13:y-5).toFixed(1)}" text-anchor="end" ${LAB}>Preventivo ${eur(imp)}</text>`;
    }
    const perc=imp>0?Math.round(tot/imp*100):null;
    const col=_colSpesa(perc);
    const linea=`<polyline points="${punti.map(p=>X(p.d).toFixed(1)+","+Y(p.v).toFixed(1)).join(" ")}" fill="none" style="stroke:${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const assex=`<text x="${x0}" y="${H-6}" ${LAB}>${fdate(t0)}</text>`
               +`<text x="${x1}" y="${H-6}" text-anchor="end" ${LAB}>${t1===oggi?"oggi":fdate(t1)}</text>`;
    const nota=perc===null
      ? "Nessun preventivo impostato per il confronto"
      : `Speso ${eur(tot)} su ${eur(imp)} (<b style="color:${col}">${perc}%</b>)`;
    wrap.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:180px;display:block" role="img" aria-label="Spese accumulate rispetto al preventivo">
      ${griglia}${prev}${linea}${assex}</svg>
      <p class="and-nota">${nota}</p>`;
  }
  async function spesaAdd(){
    if(!sbUid||!speseLavoroId)return;
    /* 13 agosto 2026 — era type="number": scrivendo "12,50" la casella non
       restituiva niente e la spesa entrava a ZERO con il messaggio "Spesa
       aggiunta ✔". Zero euro nel margine del lavoro e nel Report, in silenzio. */
    const descrizione=$("#sp-desc").value.trim();
    /* 13 agosto 2026 — qui non c'era nessun controllo: vuoto, "abc" o un dito
       scivolato entravano come 0 € con il messaggio "Spesa aggiunta ✔", e il
       margine del lavoro se ne accorgeva soltanto a fine mese. */
    const _spTesto=($("#sp-imp")&&$("#sp-imp").value||"").trim();
    const importo=_numIt("#sp-imp");
    if(_spTesto&&importo==null){toast("Non ho capito l'importo: scrivilo come 12,50");return;}
    if(importo==null||importo<=0){toast("Scrivi quanto hai speso, per esempio 12,50");return;}
    if(!descrizione){toast("Scrivi la descrizione della spesa");return;}
    const fornitore_id=($("#sp-forn")&&$("#sp-forn").value)||null;
    const obj={user_id:sbUid,lavoro_id:speseLavoroId,descrizione,importo};
    if(fornitore_id)obj.fornitore_id=fornitore_id;
    let {error}=await sb.from("gest_spese").insert(obj);
    let avvisoForn=false;
    if(error&&fornitore_id&&/fornitore_id/i.test(error.message||"")&&/column|schema cache/i.test(error.message||"")){
      delete obj.fornitore_id;
      ({error}=await sb.from("gest_spese").insert(obj));
      if(!error)avvisoForn=true;
    }
    if(error){toast("Errore: "+error.message);return;}
    $("#sp-desc").value="";$("#sp-imp").value="";if($("#sp-forn"))$("#sp-forn").value="";
    renderSpeseBlock(speseLavoroId);
    toast(avvisoForn?"Spesa salvata, ma senza fornitore: manca la migrazione SQL (gest-spese-fornitore)":"Spesa aggiunta ✔");
  }

  /* ===== 9 agosto 2026 — IL REGISTRO DELLE ORE =====
     Il campo "Ore lavorate" da solo è un numero che nessuno aggiorna: te lo
     ricordi a fine lavoro e tiri a indovinare. Qui si segna ogni volta che ci
     si mette mano (data, ore, chi, cosa) e il totale si fa da solo.
     Il totale viene riscritto anche in gest_lavori.ore, così tutto quello che
     c'era prima (Report, riepiloghi, esportazioni) continua a funzionare
     senza sapere niente di questa tabella.
     La riga che conta è l'ultima: **quanto rende un'ora su questo lavoro**.
     Tabella: sql/gest-ore-e-crediti.sql. Se manca, il riquadro lo dice. */
  let oreLavoroId=null, oreTabellaOk=true;
  /* le righe del registro delle ore del lavoro aperto: le tiene renderOreBlock
     e le rilegge orePortaInParcella, senza tornare al database */
  let oreCache=[];
  function _oreManca(err){
    const m=(err&&err.message)||"";
    return /gest_ore/i.test(m)||/schema cache|does not exist|relation/i.test(m);
  }
  async function renderOreBlock(lavoroId){
    oreLavoroId=lavoroId;
    const wrap=$("#ore-wrap");if(!wrap||!sb||!sbUid)return;
    wrap.style.display="block";
    const pro=ruoloUtente==='professionista';
    const {data,error}=await sb.from("gest_ore")
      .select("id,data,ore,nota,operatore_id").eq("user_id",sbUid).eq("lavoro_id",lavoroId)
      .order("data",{ascending:false});
    if(error){
      oreTabellaOk=false;
      $("#ore-list").innerHTML='<p class="fatt-empty">Per tenere il registro delle ore serve l\'aggiornamento del database (sql/gest-ore-e-crediti.sql). Intanto puoi scrivere il totale nel campo "Ore lavorate" qui sopra.</p>';
      const add=wrap.querySelector(".spesa-add"); if(add)add.style.display="none";
      const nt=$("#or-nota"); if(nt)nt.style.display="none";
      $("#ora-box").innerHTML="";
      return;
    }
    oreTabellaOk=true;
    const righe=data||[];
    /* la tendina di chi ci ha lavorato: gli stessi nomi della squadra */
    const selChi=$("#or-chi");
    if(selChi){
      const nomi=(dipCache||[]);
      selChi.style.display=nomi.length?"":"none";
      const v=selChi.value;
      selChi.innerHTML='<option value="">— chi —</option>'+nomi.map(d=>'<option value="'+d.id+'">'+esc(d.nome)+'</option>').join("");
      selChi.value=v;
    }
    const nomeDi=id=>{const d=(dipCache||[]).find(x=>String(x.id)===String(id));return d?d.nome:"";};
    const tot=righe.reduce((s,x)=>s+(+x.ore||0),0);
    $("#ore-list").innerHTML=righe.length?righe.map(x=>{
      const chi=nomeDi(x.operatore_id);
      return '<div class="spesa-row"><span>'+fdate(x.data)
        +(x.nota?' — '+esc(x.nota):'')
        +(chi?'<small class="sp-forn">'+esc(chi)+'</small>':'')
        +'</span><b>'+_oreTesto(x.ore)+'</b>'
        +'<button type="button" class="rdel" data-action="ore-del" data-id="'+esc(String(x.id))+'" title="Elimina">×</button></div>';
    }).join(""):'<p class="fatt-empty">Nessuna ora registrata.</p>';

    /* 22 agosto 2026 — il pulsante che porta le ore nella parcella: si accende
       solo se delle ore ci sono. Le righe restano qui in memoria, cosi' non si
       rilegge il database quando lo si preme. */
    oreCache=righe;
    const btnPar=$("#ore-in-parcella");
    if(btnPar){
      btnPar.style.display=righe.length?"":"none";
      btnPar.textContent=pro?"💶 Porta le ore nella parcella":"💶 Porta le ore nel preventivo";
    }

    /* il campo "Ore lavorate" diventa lo specchio del registro: si scrive da
       solo e non si tocca più a mano, se no i due numeri litigano */
    const campo=$("#j-ore");
    if(campo){
      /* 13 agosto 2026 — qui finiva il numero grezzo dentro una casella che dal
         12 agosto e' di testo: si leggeva "7.5" invece di "7,5", e con piu'
         righe usciva anche "3.8000000000000003". _numTesto scrive il numero
         come lo scriverebbe una persona. */
      if(righe.length){campo.value=_numTesto(tot);campo.readOnly=true;campo.title="Somma del registro qui sotto";campo.style.background="var(--sfondo,#f5f6f8)";}
      else{
        /* cancellata l'ultima riga il campo si azzera DAVVERO: se restasse il
           totale di prima, il registro direbbe "nessuna ora" e il Report
           continuerebbe a contare le ore vecchie */
        campo.value="";campo.readOnly=false;campo.title="";campo.style.background="";
      }
    }
    /* quanto rende un'ora */
    const imp=_numIt("#j-imp")||0;
    const box=$("#ora-box");
    if(!box)return;
    if(!tot){box.innerHTML='<span>Segna le ore qui sopra: ti dico quanto rende un\'ora.</span>';return;}
    if(!imp){box.innerHTML='<span>Ore totali: <b>'+_oreTesto(tot)+'</b></span><span>Metti l\'importo per sapere quanto rendono.</span>';return;}
    const perOra=imp/tot;
    box.innerHTML='<span>'+(pro?'Compenso':'Lavoro')+': '+eur2(imp)+'</span>'
      +'<span>Ore: <b>'+_oreTesto(tot)+'</b></span>'
      +'<span>Rende <b>'+eur2(perOra)+' l\'ora</b></span>';
  }
  function _oreTesto(n){
    const v=Math.round((+n||0)*100)/100;
    return String(v).replace(".",",")+" h";
  }

  /* ============================================================
     RAPPORTINI DAL CANTIERE — 15 agosto 2026
     Il rapportino lo scrive chi sta in cantiere, dal telefono
     (gestionale-operatore.html). Qui il titolare lo LEGGE: che giorno,
     chi l'ha scritto, chi c'era e quante ore, cosa hanno usato,
     com'e' andata.
     ⚠️ Perche' e' stato fatto subito: da quando la schermata del
     telefono e' online, "Cosa avete usato" e "Com'e' andata" finivano
     nel database e non li leggeva NESSUNO. Una casella che chiede di
     scrivere promette un lettore: senza questo riquadro la promessa
     era falsa.
     Le ore sbagliate si correggono nel registro qui sopra, che c'e' da
     giorni.

     15 agosto 2026 (10) — ADESSO IL RAPPORTINO SI PUO' BUTTARE VIA.
     Prima il pulsante non c'era apposta, perche' gest_rapportini non stava
     nell'elenco di js/cestino.js e una cancellazione da qui sarebbe stata
     vera e definitiva mentre il messaggio prometteva il Cestino.
     ⚠️ Il pulsante NON chiama .delete(): chiama gest_rapportino_cestina
     (sql/gest-rapportini-cestino.sql), che mette via il rapportino E LE SUE
     ORE nello stesso istante. Un rapportino buttato via con le ore ancora
     vive e' manodopera che non si vede piu' da nessuna schermata e che
     continua a mangiare il margine di quel lavoro.
     ============================================================ */
  async function renderRapportiniBlock(lavoroId){
    const wrap=$("#rap-wrap"); if(!wrap||!sb||!sbUid)return;
    const lista=$("#rap-list"); if(!lista)return;
    wrap.style.display="block";
    lista.innerHTML='<p class="fatt-empty">Leggo…</p>';

    const [r1,r2]=await Promise.all([
      sb.from("gest_rapportini").select("id,data,materiali,note,creato_da")
        .eq("user_id",sbUid).eq("lavoro_id",lavoroId).order("data",{ascending:false}),
      sb.from("gest_ore").select("ore,operatore_id,rapportino_id")
        .eq("user_id",sbUid).eq("lavoro_id",lavoroId)
    ]);

    if(r1.error){
      /* la tabella non c'e' ancora: lo dico e nomino il file, come fanno gli
         altri riquadri. Mai lasciare un vuoto che sembra "non c'e' niente". */
      lista.innerHTML='<p class="fatt-empty">Per leggere i rapportini serve l\'aggiornamento del database (sql/gest-rapportini.sql).</p>';
      return;
    }
    const raps=r1.data||[];
    /* se le ore non si leggono NON si finge che siano zero: un rapportino che
       dice "0 h" quando le ore ci sono e' una bugia peggiore del non sapere */
    const oreOk=!r2.error;
    const ore=oreOk?(r2.data||[]):[];

    if(!raps.length){
      lista.innerHTML='<p class="fatt-empty">Nessun rapportino dal cantiere. Li scrive chi ha il permesso <b>Rapportini</b>, dal telefono, dentro il lavoro.</p>';
      return;
    }

    const nomeDi=id=>{const d=(dipCache||[]).find(x=>String(x.id)===String(id));return d?d.nome:"";};
    /* ore raggruppate per rapportino, e per persona dentro ognuno */
    const perRap={}, perRapChi={};
    ore.forEach(o=>{
      const k=String(o.rapportino_id||"");
      if(!k)return;                       /* le ore messe a mano dal pannello */
      perRap[k]=(perRap[k]||0)+(+o.ore||0);
      (perRapChi[k]=perRapChi[k]||[]).push({chi:o.operatore_id,ore:+o.ore||0});
    });
    const oreSciolte=ore.filter(o=>!o.rapportino_id).reduce((s,o)=>s+(+o.ore||0),0);
    const totRap=Object.keys(perRap).reduce((s,k)=>s+perRap[k],0);

    lista.innerHTML=raps.map(r=>{
      const k=String(r.id);
      const q=quando(r.data,{neutro:true});      /* colore = stato, come ovunque */
      const chi=nomeDi(r.creato_da);
      const dettaglio=(perRapChi[k]||[])
        .sort((a,b)=>b.ore-a.ore)
        .map(x=>{const n=nomeDi(x.chi); return (n||"chi non è più in squadra")+" "+_oreTesto(x.ore);})
        .join(" · ");
      const bits=[];
      if(chi)        bits.push('<small class="sp-forn">Scritto da '+esc(chi)+'</small>');
      if(dettaglio)  bits.push('<small class="sp-forn">'+esc(dettaglio)+'</small>');
      if(r.materiali)bits.push('<small class="sp-forn">Usato: '+esc(r.materiali)+'</small>');
      if(r.note)     bits.push('<small class="sp-forn">'+esc(r.note)+'</small>');
      if(!bits.length)bits.push('<small class="sp-forn">Nessun dettaglio scritto.</small>');
      const oreTxt=oreOk?_oreTesto(perRap[k]||0):"—";
      return '<div class="spesa-row"><span><b class="'+q.classe+'">'+esc(q.testo)+'</b> · '
        +esc(fdate(r.data))+bits.join("")+'</span><b>'+oreTxt+'</b>'
        +'<button type="button" class="rdel" data-action="rap-del" data-id="'+esc(String(r.id))+'" title="Butta via questo rapportino">×</button></div>';
    }).join("");

    const coda=[];
    coda.push(raps.length===1?"1 rapportino":raps.length+" rapportini");
    if(oreOk)coda.push(_oreTesto(totRap)+" dal cantiere");
    if(oreOk&&oreSciolte>0)coda.push(_oreTesto(oreSciolte)+" aggiunte da te qui sopra");
    lista.insertAdjacentHTML("beforeend",'<div class="margine-box"><span>'+esc(coda.join(" · "))+'</span></div>');
    if(!oreOk){
      lista.insertAdjacentHTML("beforeend",'<p class="fatt-empty">Le ore di questi rapportini non riesco a leggerle: manca la colonna che li collega (sql/gest-rapportini.sql). I rapportini qui sopra sono giusti, le ore no.</p>');
    }
  }
  /* ============================================================
     BUTTA VIA UN RAPPORTINO — 15 agosto 2026 (10)

     Due giri, come "Elimina per sempre" del Cestino:
       1) si chiede al database COSA succederebbe (non tocca niente)
       2) si fa vedere il conto vero all'utente
       3) solo dopo il suo si', si butta via
     Il numero delle ore lo dice il DATABASE, non la schermata: se la
     schermata avesse letto male (o non avesse letto affatto le ore, cosa che
     succede quando manca la colonna rapportino_id) il messaggio direbbe "0
     ore" mentre ne butta via otto.
     ============================================================ */
  async function rapCestina(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    if(!id)return;

    const prova=await sb.rpc("gest_rapportino_cestina",{p_id:id,p_conferma:false});
    if(prova.error){
      const m=(prova.error.code||"")+" "+(prova.error.message||"");
      if(/PGRST202|Could not find the function|schema cache/i.test(m)){
        alert("Non ho buttato via niente.\n\nPer poter buttare via un rapportino serve un aggiornamento del database: "
             +"esegui sql/gest-rapportini-cestino.sql su Supabase (SQL Editor → Run) e ricarica questa pagina.");
        return;
      }
      toast("Errore: "+(prova.error.message||"il database non risponde"));
      return;
    }
    const p=prova.data||{};
    if(!p.ok){
      if(p.motivo==="gia"){toast("Era già nel cestino.");renderRapportiniBlock(oreLavoroId);return;}
      if(p.motivo==="permesso"){toast("Questo rapportino non lo puoi buttare via.");return;}
      toast("Non l'ho trovato: forse l'ha già buttato via qualcun altro.");
      renderRapportiniBlock(oreLavoroId);
      return;
    }

    const righe=+p.righe_ore||0, ore=+p.ore||0;
    let msg="Butto via il rapportino del "+fdate(p.data)+"?\n\n";
    msg+= righe
      ? ("Vanno nel cestino anche le sue ore: "+righe+(righe===1?" riga":" righe")
         +", "+_oreTesto(ore)+" in tutto.\nIl margine di questo lavoro cambia.\n\n")
      : "Non ci sono ore attaccate a questo rapportino.\n\n";
    msg+="Se sbagli lo rimetti a posto dal Cestino, e le ore tornano su insieme a lui.";
    if(!gconfirm(msg))return;

    const fatto=await sb.rpc("gest_rapportino_cestina",{p_id:id,p_conferma:true});
    if(fatto.error){toast("Non buttato via: "+(fatto.error.message||"errore"));return;}
    const f=fatto.data||{};
    if(!f.ok||!f.fatto){
      /* fra l'anteprima e l'ok puo' essere cambiato qualcosa in un'altra
         scheda: non si finge che sia andata bene */
      toast(f.motivo==="gia"?"Era già nel cestino.":"Non buttato via: riprova.");
      renderRapportiniBlock(oreLavoroId);
      return;
    }

    /* le ore sono cambiate: il registro, il campo "Ore lavorate" e il totale
       scritto su gest_lavori devono dire tutti lo stesso numero, se no Report
       ed Excel continuano a contare le ore buttate via */
    if(oreLavoroId){
      await renderOreBlock(oreLavoroId);
      await _oreSalvaTotale();
      await renderRapportiniBlock(oreLavoroId);
    }
    /* lo stesso punto unico che usa js/cestino.js dopo ogni eliminazione: il
       pallino del menu e la sezione Cestino si aggiornano da soli. Si passa
       null apposta — qui le righe sono due tabelle diverse (il rapportino e le
       sue ore), quindi si rifa' il conto vero invece di indovinare. */
    try{ if(typeof window.segnaCestinoDaRifare==="function")window.segnaCestinoDaRifare(null); }catch(e){}
    rinfresca("riepilogo");
    toast(righe?("Nel cestino: rapportino e "+_oreTesto(ore)):"Rapportino nel cestino");
  }

  async function oreAdd(){
    if(!sbUid||!oreLavoroId)return;
    if(!oreTabellaOk){toast("Prima serve l'aggiornamento del database (sql/gest-ore-e-crediti.sql)");return;}
    /* mezz'ora si scrive "2,5": con type="number" non si poteva proprio */
    const ore=_numIt("#or-ore")||0;
    if(!(ore>0)){toast("Scrivi quante ore, per esempio 2,5");return;}
    /* una riga sola di 1.250 ore e' un dito scivolato, non una giornata */
    if(ore>24){toast("Sono tante: una riga sola non può avere più di 24 ore");return;}
    const obj={user_id:sbUid,mestiere_id:curMestiere(),lavoro_id:oreLavoroId,
      data:$("#or-data").value||todayStr(), ore,
      nota:$("#or-nota").value.trim()||null,
      operatore_id:($("#or-chi")&&$("#or-chi").value)||null};
    const {error}=await sb.from("gest_ore").insert(obj);
    if(error){toast("Errore: "+error.message);return;}
    $("#or-ore").value="";$("#or-nota").value="";
    await renderOreBlock(oreLavoroId);
    renderRapportiniBlock(oreLavoroId);   /* la riga «aggiunte da te» deve restare vera */
    await _oreSalvaTotale();
    toast("Ore aggiunte ✔");
  }
  async function oreDel(id){
    if(!sbUid)return;
    const {error}=await sb.from("gest_ore").delete().eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    await renderOreBlock(oreLavoroId);
    renderRapportiniBlock(oreLavoroId);   /* la riga «aggiunte da te» deve restare vera */
    await _oreSalvaTotale();
    toast("Riga eliminata");
  }
  /* il totale finisce anche in gest_lavori.ore: è li' che lo cercano il
     Report e le esportazioni, che di gest_ore non sanno niente */
  async function _oreSalvaTotale(){
    if(!sbUid||!oreLavoroId)return;
    const campo=$("#j-ore");
    if(!campo)return;                       /* modulo chiuso: non tocco niente */
    const v=String(campo.value||"").trim();
    const tot=v===""?null:(_numeroIt(v)||0);  /* vuoto = nessuna ora, non zero finto */
    try{ await sb.from("gest_lavori").update({ore:tot}).eq("id",oreLavoroId).eq("user_id",sbUid); }catch(e){}
  }

  /* ============================================================
     ⛔ 22 agosto 2026 — LE ORE DIVENTANO UNA PARCELLA
     ============================================================
     Le ore si segnavano bene (giorno, chi, quante, cosa) e poi finivano li':
     per fare la parcella il conto si rifaceva a mano, su un foglio. Per uno
     studio la parcella spesso NASCE dalle ore — tre sopralluoghi, sei ore di
     disegno, due al Comune.

     ⛔ IL PREZZO NON SI INVENTA. L'unico numero orario che il gestionale ha
     sempre avuto e' `gest_operatori.costo_orario`, che e' quanto ti COSTA un
     collaboratore: serve al Report per dirti se un lavoro ci ha guadagnato.
     Usarlo come prezzo vorrebbe dire fatturare al cliente il proprio costo.
     Il prezzo viene dalla TARIFFA scritta nei Dati azienda
     (`gest_azienda.tariffa_oraria`, sql/gest-azienda-tariffa-oraria.sql), e
     se quella manca la riga arriva SENZA PREZZO: uno zero sembrerebbe un
     prezzo, il vuoto si vede che manca.

     ⚠️ Una riga per persona, non una riga per giorno. Un cliente non vuole
     leggere quaranta righe da mezz'ora: vuole sapere quante ore e a quanto.
     Le ore senza un nome (segnate dal titolare) finiscono in una riga sola.
     ============================================================ */
  async function orePortaInParcella(){
    if(!oreLavoroId){toast("Apri prima una pratica");return;}
    const righeOre=(oreCache||[]).filter(x=>(+x.ore||0)>0);
    if(!righeOre.length){toast("Non ci sono ore da portare");return;}
    const pro=(ruoloUtente==='professionista');

    /* la tariffa: dai Dati azienda, gia' letti dal modulo del preventivo.
       Se la colonna non c'e' ancora nel database, `tariffa_oraria` e'
       semplicemente undefined e il prezzo resta vuoto. */
    if(!fattAzienda&&sb&&sbUid){
      try{
        const {data:_az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
        fattAzienda=_az||null;
      }catch(e){}
    }
    const tariffa=(fattAzienda&&fattAzienda.tariffa_oraria!=null&&fattAzienda.tariffa_oraria!=="")
                    ? (+fattAzienda.tariffa_oraria||0) : null;

    /* si somma per persona, tenendo l'ordine in cui compaiono */
    const perChi=[], visto={};
    righeOre.forEach(function(x){
      const k=String(x.operatore_id||"");
      if(!visto[k]){visto[k]={chi:k,ore:0};visto[k]._i=perChi.push(visto[k])-1;}
      visto[k].ore+=(+x.ore||0);
    });
    const nomeDi=function(id){const d=(dipCache||[]).find(y=>String(y.id)===String(id));return d?d.nome:"";};
    const voce=pro?"Ore di studio":"Ore di lavoro";
    const _righe=perChi.map(function(g,i){
      const chi=nomeDi(g.chi);
      return {descrizione: chi?(voce+" — "+chi):voce,
              qta: Math.round(g.ore*100)/100,
              prezzo: (tariffa===null?"":tariffa),
              sezione:false, ordine:i};
    });

    /* cliente e titolo si prendono da quello che e' aperto sullo schermo, non
       da una seconda lettura: cosi' valgono anche le modifiche non salvate */
    const cliSel=$("#j-cli"), descEl=$("#j-desc");
    const cliente_id=(cliSel&&cliSel.value)||null;
    const desc=(descEl&&String(descEl.value||"").trim())||"";
    const totOre=_righe.reduce(function(t,r){return t+(+r.qta||0);},0);

    closeSheet();
    await prevForm(null,{
      cliente_id:cliente_id,
      titolo:desc||(pro?"Parcella":"Preventivo"),
      _righe:_righe,
      _noteOre:(tariffa===null
        ? "Le ore sono arrivate dal registro della pratica ("+_numTesto(totOre)+" in tutto). "
          +"Il prezzo dell'ora non c'è: scrivilo qui, oppure mettilo una volta sola nei Dati azienda, alla voce «Quanto chiedi all'ora»."
        : "Le ore sono arrivate dal registro della pratica ("+_numTesto(totOre)+" in tutto), al prezzo scritto nei Dati azienda. Cambialo pure riga per riga.")
    });
    toast(_righe.length===1?"Una riga portata dalle ore":(_righe.length+" righe portate dalle ore"));
  }

  /* ---- PREVENTIVI ---- */
  let prevCache=[], prevFilter="tutti", prevRigheCount=0;
  async function renderPreventivi(){
    filoMetti("preventivi","preventivi");
    const box=$("#prev-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML=`<div class="empty"><div class="ic">📑</div><p>Nessun preventivo</p><small>Accedi per creare i preventivi</small></div>`;return;}
    const [{data:pv},{data:cl}]=await Promise.all([
      sb.from("gest_preventivi").select("*").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("created_at",{ascending:false}),
      /* 9 agosto 2026 — si leggono ANCHE i clienti nel cestino: prima il
         preventivo di un cliente cestinato mostrava un trattino e non si
         capiva piu' di chi fosse. */
      ((window.cestinoAttivo&&window.cestinoAttivo())
        ? sb.raw("gest_clienti").select("id,nome,eliminato_il")
        : sb.from("gest_clienti").select("id,nome")
      ).eq("user_id",sbUid).or(_cliOr(curMestiere()))
    ]);
    prevCache=pv||[];
    const cliMap=Object.fromEntries((cl||[]).map(c=>[c.id,(c.nome||"")+(c.eliminato_il?" (nel cestino)":"")]));
    let tot={};
    if(prevCache.length){
      const {data:rr}=await sb.from("gest_preventivo_righe").select("preventivo_id,qta,prezzo").in("preventivo_id",prevCache.map(p=>p.id));
      (rr||[]).forEach(r=>{tot[r.preventivo_id]=(tot[r.preventivo_id]||0)+impRiga(r.qta,r.prezzo);});
    }
    /* ===== 9 agosto 2026 — a schermo lo STESSO numero del PDF =====
       Prima la colonna "Importo" mostrava l'imponibile (10.000) mentre il PDF
       in mano al cliente diceva 11.000: al telefono si diceva la cifra
       sbagliata. Ora si mostra il totale finito, quello che il cliente legge.
       Per gli studi resta il "da incassare" della parcella (compenso + cassa
       + spese + IVA - ritenuta): anche li' è la cifra del documento. */
    const totCli={};
    prevCache.forEach(function(p){
      const base=tot[p.id]||0;
      if(ruoloUtente==='professionista'){
        const c=calcolaParcella(base,p.cassa_perc,p.iva_perc,!!p.ritenuta,p.ritenuta_perc||20,p.spese_forfait);
        totCli[p.id]=c.totale;
      }else if(p.iva_perc!=null&&p.iva_perc!==""){
        const iva=_centPerc(base,+p.iva_perc||0);
        totCli[p.id]=_cent2(base+iva);
      }else{
        totCli[p.id]=base;   /* aliquota non indicata: resta com'era */
      }
    });
    const _conIva=p=>ruoloUtente==='professionista'
      ? true
      : (p.iva_perc!=null&&p.iva_perc!=="");
    const L=prevCache.filter(p=>prevFilter==="tutti"||p.stato===prevFilter);
    const conta={};PREV_VISTE.forEach(v=>conta[v.k]=prevCache.filter(p=>v.k==="tutti"||p.stato===v.k).length);
    const somma=L.reduce((s,p)=>s+(totCli[p.id]||0),0);
    renderTabella({
      id:"prev", box:"#prev-list",
      viste:"#prev-viste", visteDef:PREV_VISTE, vista:prevFilter, conta:conta, azioneVista:"prev-filtro",
      vuoto:tabVuoto(
        prevCache.length?"Nessun preventivo con questo filtro":"Ancora nessun preventivo",
        prevCache.length?"Prova a cambiare vista qui sopra.":"Righe con quantità e prezzo, totale con l’IVA e il PDF pronto da mandare al cliente. Quando il cliente accetta, il preventivo diventa un lavoro con un clic.",
        _SVGV+'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
        prevCache.length?null:{t:"+ Crea il primo preventivo",a:"new-prev"}),
      colonne:[{lab:"N.",w:"6%"},{lab:"Preventivo",w:"32%"},{lab:"Cliente",w:"24%",cls:"c-cli"},
               {lab:"Quando",w:"18%"},{lab:"Importo",w:"20%",cls:"c-imp"}],
      righe:L.map(p=>{
        const q=quando(p.data,{neutro:true});
        return {
          id:p.id,
          click:{action:"edit-prev",data:{id:p.id}},
          celle:[
            esc(String(p.numero||"—")),
            `<span class="lav-bar ${PREV_BAR[p.stato]||"da_fare"}" title="${PREV_LAB[p.stato]||p.stato}"></span><span class="c-nome">${esc(p.titolo||"—")}</span>`,
            esc(cliMap[p.cliente_id]||"—"),
            {h:PREV_VERBO[p.stato]+" "+q.testo,cls:q.classe},
            eur(totCli[p.id]||0)+(_conIva(p)?'<small class="prev-iva">'+(ruoloUtente==='professionista'?'da incassare':'IVA inclusa')+'</small>':"")
          ],
          menu:prevVoci(p)
        };
      }),
      numeri:prevNumeri(prevCache,totCli),
      totale:{testo:L.length+" "+(L.length===1?"preventivo":"preventivi"),valore:eur(somma)},
      cards:()=>L.map(p=>prevCard(p,cliMap,totCli)).join("")
    });
  }

  /* ⚠️ «senza risposta» = bozza OPPURE inviato, la stessa identica scelta
     che fa il Riepilogo. Se qui contassi solo gli inviati, le due schermate
     direbbero due numeri diversi sulla stessa domanda, e chi le guarda non
     saprebbe a quale credere. */
  function prevNumeri(TUTTI,totCli){
    const attesa=(TUTTI||[]).filter(p=>p.stato==="bozza"||p.stato==="inviato");
    const valore=attesa.reduce((s,p)=>s+(+totCli[p.id]||0),0);
    const vecchio=attesa.slice()
      .sort((a,b)=>String(a.data||"9999").localeCompare(String(b.data||"9999")))[0];
    const gg=vecchio?_ggDa(vecchio.data):null;
    /* quanti ne accetti: si guardano SOLO quelli che una risposta l'hanno
       avuta (accettato o rifiutato). Contare dentro anche quelli ancora in
       attesa farebbe scendere la percentuale ogni volta che ne scrivi uno
       nuovo, che non vuol dire niente. */
    const daQuando=_daMesi(12);
    const esiti=(TUTTI||[]).filter(p=>(p.stato==="accettato"||p.stato==="rifiutato")
                                    && String(p.data||"")>=daQuando);
    const acc=esiti.filter(p=>p.stato==="accettato").length;
    return numFila([
      attesa.length?numCard({
        domanda:"In attesa di risposta",
        numero:String(attesa.length),
        sotto:eur(valore)+" fermi",
        tono:"attesa"}):null,
      vecchio?numCard({
        domanda:"Il più vecchio senza risposta",
        numero:_ggCorto(gg),
        sotto:(vecchio.titolo||"Senza titolo"),
        tono:(gg!=null&&gg>=14)?"err":"attesa",
        action:"edit-prev", id:vecchio.id}):null,
      (esiti.length>=NUM_MIN_ESITI)?numCard({
        domanda:"Su 10 che mandi, quanti te ne accettano",
        numero:String(Math.round(acc/esiti.length*10)),
        sotto:acc+" su "+esiti.length+" negli ultimi 12 mesi"}):null
    ]);
  }
  /* sotto 880px: la card di prima, con le stesse azioni del menu */
  function prevCard(p,cliMap,tot){
    return `<div class="job">
      <div class="job-top"><div class="job-cli">N. ${esc(String(p.numero||"—"))} — ${esc(p.titolo||"")}</div><span class="stato ${p.stato}">${PREV_LAB[p.stato]||p.stato}</span></div>
      <div class="job-meta">
        ${p.cliente_id?`<span>👤 ${esc(cliMap[p.cliente_id]||"—")}</span>`:""}
        <span>📅 ${fdate(p.data)}</span>
        <span class="prev-tot">${eur2(tot[p.id]||0)}</span></div>
      ${/* 16 agosto 2026 — la nota non si mostra piu' in anteprima: era un
            muro di testo giallo che faceva la scheda alta il doppio delle
            vicine, e tagliato a meta' non si leggeva comunque. Si legge
            aprendo il preventivo. */""}
      <div class="job-actions">${schedaUnPulsante(prevVoci(p))||schedaAzioni(prevVoci(p))}</div></div>`;
  }
  /* Preventivi: viste, colore della barretta e verbo della colonna "Quando".
     Il verbo cambia con lo stato ("inviato 3 giorni fa", "creato 3 giorni fa"):
     la data è sempre p.data, quello che cambia è cosa è successo in quel giorno. */
  const PREV_VISTE=[
    {k:"tutti",lab:"Tutti"},{k:"bozza",lab:"Bozze"},{k:"inviato",lab:"Inviati"},
    {k:"accettato",lab:"Accettati"},{k:"rifiutato",lab:"Rifiutati"}
  ];
  const PREV_LAB={bozza:"Bozza",inviato:"Inviato",accettato:"Accettato",rifiutato:"Rifiutato"};
  const PREV_BAR={bozza:"da_fare",inviato:"in_corso",accettato:"fatto",rifiutato:"ritardo"};
  const PREV_VERBO={bozza:"creato",inviato:"inviato",accettato:"accettato",rifiutato:"rifiutato"};
  function prevVoci(p){
    const v=[{lab:"📄 Scarica PDF",action:"prev-pdf",data:{id:p.id}}];
    /* la lettera d'incarico è un obbligo di legge per i tecnici: sta accanto al PDF */
    if(ruoloUtente==='professionista')v.push({lab:"📝 Lettera d'incarico",action:"prev-incarico",data:{id:p.id}});
    /* per chi lavora in cantiere il gemello è la conferma d'ordine */
    else v.push({lab:"📝 Conferma d'ordine",action:"prev-ordine",data:{id:p.id}});
    if(p.stato==="bozza")v.push({lab:"📤 Segna inviato",action:"prev-stato",data:{id:p.id,v:"inviato"}});
    if(p.stato==="bozza"||p.stato==="inviato"){
      v.push({lab:"✔ Accettato → crea lavoro",action:"prev-to-lavoro",data:{id:p.id}});
      v.push({lab:"✕ Rifiutato",action:"prev-stato",data:{id:p.id,v:"rifiutato"}});
    }
    /* 12 agosto 2026 (sera) — la scorciatoia che mancava: dal preventivo alla
       fattura, senza rifare la strada lunga da "Fatture -> + Nuova". */
    v.push({lab:"\ud83e\uddfe Crea la fattura da qui",action:"prev-to-fatt",data:{id:p.id}});
    if(p.stato==="rifiutato")v.push({lab:"↩ Riapri",action:"prev-stato",data:{id:p.id,v:"bozza"}});
    v.push({sep:true});
    v.push({lab:"✏ Modifica",action:"edit-prev",data:{id:p.id}});
    v.push({lab:"🗑 Elimina",action:"del-prev",data:{id:p.id},del:true});
    return v;
  }
