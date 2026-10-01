// [SPOSTATO] gest-core.js: le righe 1-8084 del vecchio file ora stanno in: gest-base.js (righe 1-421), gest-reparti.js (righe 422-1251), gest-ingresso.js (righe 1252-1842), gest-ai-moduli.js (righe 1843-3411), gest-riepilogo-schede.js (righe 3412-3986), gest-schede-clienti.js (righe 3987-4805), gest-carte-documenti.js (righe 4806-5415), gest-richieste-chat.js (righe 5416-6041), gest-scadenze-pratiche.js (righe 6042-6983), gest-commercialista.js (righe 6984-7418), gest-elimina-reparto.js (righe 7419-8084). Qui resta il resto.
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

  /* ===== 9 agosto 2026 — LA SEZIONE CESTINO =====
     Il motore (js/cestino.js) fa sparire le righe eliminate da tutto il
     gestionale. Qui si vedono e si rimettono a posto.
     Si legge con sb.raw(), la porta di servizio che salta il filtro. */
  const CEST_COSE=[
    {t:"gest_lavori",      lab:"Pratiche e lavori", labImp:"Lavori",        campo:"descrizione", ic:"🧰"},
    {t:"gest_clienti",     lab:"Clienti",           campo:"nome",           ic:"👤"},
    {t:"gest_preventivi",  lab:"Preventivi",        campo:"titolo",         ic:"📄"},
    {t:"gest_fatture",     lab:"Fatture",           campo:"numero",         ic:"🧾"},
    {t:"gest_scadenze",    lab:"Scadenze",          campo:"titolo",         ic:"⏰", foglia:true},
    {t:"gest_mestieri",    lab:"Reparti",           campo:"nome",           ic:"🗂"},
    {t:"gest_mezzi",       lab:"Mezzi e strumenti", campo:"nome",           ic:"🚚"},
    {t:"gest_operatori",   lab:"Persone",           campo:"nome",           ic:"👷"},
    {t:"gest_carte",       lab:"Carte aziendali",   campo:"nome",           ic:"💳"},
    {t:"gest_fornitori",   lab:"Fornitori",         campo:"nome",           ic:"🏪"},
    {t:"gest_fatture_fornitori", lab:"Fatture fornitori", campo:"numero",   ic:"🧾", foglia:true},
    {t:"gest_spese",       lab:"Spese",             campo:"descrizione",    ic:"💶", foglia:true},
    {t:"gest_ore",         lab:"Ore lavorate",      campo:"nota",           ic:"⏱", foglia:true},
    /* 15 agosto 2026 — il rapportino di cantiere.
       ⚠️ "campo" non basta e per questo c'e' "nome": un rapportino non ha ne'
       nome ne' titolo ne' descrizione, e il ripiego del Cestino avrebbe
       scritto «del 14/08/2026» e basta. Con dieci rapportini dentro sarebbero
       dieci righe quasi uguali e nessuno saprebbe cosa sta rimettendo a posto.
       Il nome del lavoro lo va a prendere cestNomiLavori(), qui sotto.
       NIENTE "foglia": sotto al rapportino ci sono le ore, quindi "Elimina per
       sempre" deve passare dalla funzione del database che guarda la catena. */
    {t:"gest_rapportini",  lab:"Rapportini di cantiere", campo:"materiali", ic:"📋",
     nome:function(r){
       const q=CEST_LAV[String(r.lavoro_id||"")];
       return "Rapportino del "+fdate(r.data)+(q?(" — "+q):"");
     }},
    /* 14 settembre 2026 — i promemoria. Senza questa riga, buttarne uno lo
       faceva sparire e basta: la riga restava nel database con eliminato_il
       scritto, ma nel Cestino non la vedeva nessuno e non si poteva rimettere
       a posto. ⚠️ `promemoria` non ha mestiere_id: il Cestino se ne accorge da
       solo dall'errore del database e la mostra senza filtro di reparto. */
    {t:"promemoria",       lab:"Promemoria",        campo:"testo",          ic:"🔔", foglia:true},
    {t:"gest_crediti",     lab:"Crediti formativi", campo:"titolo",         ic:"🎓", foglia:true},
    /* ⚠️ 20 agosto 2026 — «get lab», non «lab». Questa lista e' un const e si
       costruisce all'AVVIO, quando il ruolo dell'utente non si sa ancora:
       scritta come lab:_cm('nome') restava congelata sulla parola sbagliata
       per sempre. Col getter la parola si chiede quando si disegna. */
    {t:"gest_computi",     get lab(){return _cm('nome');}, campo:"titolo",   ic:"📐"},
    /* Il SAL non ha ne' nome ne' titolo: senza "nome" il Cestino scriverebbe
       dieci righe uguali e non si saprebbe quale si sta rimettendo a posto.
       NIENTE "foglia": sotto al SAL ci sono le sue righe. */
    {t:"gest_sal",         lab:"Stati di avanzamento", campo:"numero",       ic:"📈",
     nome:function(r){ return "SAL n. "+(r.numero||"?")+" del "+fdate(r.data); }},
    {t:"gest_prezzi_propri", lab:"Voci del tuo elenco prezzi", campo:"descrizione", ic:"🏷", foglia:true},
    {t:"gest_foto",        lab:"Foto e documenti",  campo:"nome_file",      ic:"📷", foglia:true},
    {t:"gest_video",       lab:"Video",             campo:"nome_file",      ic:"🎬", foglia:true}
    /* gest_note NON c'e': e' stata tolta dal cestino il 9/8/2026 (vedi
       js/cestino.js). Lasciarla qui voleva dire una richiesta in piu' a ogni
       apertura, per una categoria che non si riempie mai. */
  ];
  /* "foglia" = non ha figli nel database, quindi si può cancellare davvero
     senza portarsi dietro altro. Le altre NO: eliminare per sempre un reparto
     o un cliente farebbe scattare le cancellazioni a catena e si porterebbe
     via anche roba viva che nel cestino non c'era mai entrata. */

  /* 12 agosto 2026 — il Prezzario prometteva "va nel cestino" senza mai
     controllare che il cestino fosse acceso. Se non lo e' (migrazione non
     eseguita), la voce spariva per sempre mentre il messaggio diceva il
     contrario. Una funzione sola, usata da tutti i messaggi che parlano di
     cestino, cosi' non se ne puo' dimenticare uno. */
  function _cestOn(){ return !!(window.cestinoAttivo&&window.cestinoAttivo()); }
  function fraseCestino(){
    return _cestOn()
      ? "Va nel cestino: se sbagli la rimetti a posto da lì."
      : "ATTENZIONE: il cestino non è attivo, quindi sparisce per sempre e non si può tornare indietro.";
  }

  /* ============================================================
     12 agosto 2026 — CHI STA DENTRO A CHI

     Il ripristino toccava UNA riga sola. Ma ci sono due punti del gestionale
     che mettono via padre e figli insieme:
       - "elimina reparto"   -> il reparto E tutti i suoi lavori
       - "elimina fornitore" -> il fornitore E tutte le sue fatture
     Rimettendo a posto il padre tornava su solo lui, e i figli restavano nel
     cestino uno per uno, da ripescare a mano. Nel frattempo i conti erano
     sbagliati.

     CEST_FIGLI dice cosa tirare su insieme al padre.
     CEST_PADRE serve al contrario: se rimetti a posto un lavoro ma il suo
     reparto e' ancora nel cestino, il lavoro torna e NON si vede da nessuna
     parte, perche' il gestionale mostra solo la roba dei reparti vivi.
     ============================================================ */
  const CEST_FIGLI={
    /* 12 agosto 2026 (sera) — qui c'era solo gest_lavori, perche' "elimina
       reparto" metteva via solo quelli. Adesso mette via tutte e 11 le tabelle
       del reparto, quindi il ripristino le deve tirare su tutte: se no il
       reparto tornava su VUOTO e clienti, fatture e persone restavano nel
       cestino uno per uno, da ripescare a mano.
       L'elenco e' lo stesso di REPARTO_CONTENUTO, scritto in un posto solo,
       cosi' cancellazione e ripristino non possono piu' scollarsi. */
    gest_mestieri : REPARTO_CONTENUTO.map(function(v){return [v[0],"mestiere_id",v[1],v[2]];}),
    gest_fornitori:[["gest_fatture_fornitori","fornitore_id","fattura","fatture"]],
    /* 15 agosto 2026 — le ore del rapportino tornano su con lui.
       Se ne vanno insieme (gest_rapportino_cestina le mette via nello stesso
       istante), quindi devono anche tornare insieme: rimettere a posto il
       rapportino e lasciare le ore nel Cestino vorrebbe dire un margine che
       resta sbagliato dopo che l'utente ha gia' rimediato all'errore. */
    gest_rapportini:[["gest_ore","rapportino_id","ora lavorata","ore lavorate"]],
    /* 14 agosto 2026 — le scadenze del mezzo (revisione, assicurazione,
       bollo) vanno via con lui e tornano su con lui. Prima restavano vive
       ad avvisare per un furgone gia' venduto. */
    gest_mezzi    :[["gest_scadenze","mezzo_id","scadenza","scadenze"]]
  };
  const CEST_PADRE={
    gest_lavori           :["gest_mestieri","mestiere_id","reparto"],
    gest_clienti          :["gest_mestieri","mestiere_id","reparto"],
    gest_preventivi       :["gest_mestieri","mestiere_id","reparto"],
    gest_fatture          :["gest_mestieri","mestiere_id","reparto"],
    gest_mezzi            :["gest_mestieri","mestiere_id","reparto"],
    gest_operatori        :["gest_mestieri","mestiere_id","reparto"],
    gest_carte            :["gest_mestieri","mestiere_id","reparto"],
    gest_scadenze         :["gest_mestieri","mestiere_id","reparto"],
    gest_computi          :["gest_mestieri","mestiere_id","reparto"],
    gest_fornitori        :["gest_mestieri","mestiere_id","reparto"],
    gest_rapportini       :["gest_mestieri","mestiere_id","reparto"],
    gest_fatture_fornitori:["gest_fornitori","fornitore_id","fornitore"]
  };
  /* Quanto largo e' "nello stesso momento". I figli vengono messi via qualche
     istante PRIMA del padre, ma con la rete lenta puo' passare piu' tempo: due
     minuti stanno larghi senza rischiare niente. Il vincolo vero e' l'altro,
     cioe' che il figlio punti proprio a quel padre: serve a non far resuscitare
     un lavoro che era stato buttato via il mese scorso di proposito.
     E comunque, nel dubbio, qui si sbaglia dalla parte giusta: al massimo torna
     su una cosa in piu', che si puo' rieliminare. */
  const CEST_FINESTRA=120000;

  let cestCache=[], cestQ="", cestTotale=null;
  /* 12 agosto 2026 (sera) — IL CESTINO NON GUARDAVA IL REPARTO.
     Chiedeva tutto quello che e' eliminato per QUESTO ACCOUNT, senza badare a
     dove stava: se hai due reparti — poniamo "Edilizia" e "Impianti" — dentro
     "Edilizia" ti trovavi i clienti e le fatture eliminate di "Impianti", con
     lo stesso nome delle tue, e potevi rimetterle a posto o cancellarle per
     sempre senza accorgerti che erano di un altro pannello.
     Adesso si parte da questo reparto e c'e' la vista "Tutti i reparti" per
     vedere il resto: niente diventa irraggiungibile, ma non si mescola piu'. */
  let cestVista="reparto";
  let cestQui=null;                /* quante ce ne sono in QUESTO reparto */
  const CEST_MAX=200;   /* quante se ne mostrano per tipo */

  /* ============================================================
     15 agosto 2026 — DI CHE LAVORO ERA?

     Un rapportino non ha un nome: ha una data e il lavoro a cui appartiene.
     Nel Cestino «del 14/08/2026» ripetuto dieci volte non dice niente, e chi
     preme "Rimetti a posto" non sa cosa sta ripescando.
     Qui si vanno a prendere i nomi dei lavori, UNA volta sola per apertura del
     Cestino, e solo se ci sono davvero righe che ne hanno bisogno.

     sb.raw e non sb.from: il lavoro puo' essere finito nel Cestino anche lui
     (per esempio eliminando tutto il reparto). Con sb.from tornerebbe niente,
     e la riga tornerebbe a dire solo la data proprio nel caso in cui serve di
     piu' capire cosa si sta rimettendo a posto.
     ============================================================ */
  let CEST_LAV={};
  async function cestNomiLavori(risposte){
    CEST_LAV={};
    const ids={};
    (risposte||[]).forEach(function(x){
      if(x.c.t!=="gest_rapportini")return;
      (x.righe||[]).forEach(function(r){ if(r.lavoro_id)ids[String(r.lavoro_id)]=true; });
    });
    const elenco=Object.keys(ids);
    if(!elenco.length||!sb||!sbUid)return;
    try{
      const {data,error}=await sb.raw("gest_lavori")
        .select("id,descrizione").eq("user_id",sbUid).in("id",elenco);
      /* se la lettura non riesce non si inventa niente: la riga dira' solo la
         data, che e' meno ma e' vero */
      if(error||!data)return;
      data.forEach(function(l){
        const d=String(l.descrizione||"").trim();
        if(d)CEST_LAV[String(l.id)]=d.slice(0,45);
      });
    }catch(e){}
  }

  /* ⛔ 19 settembre 2026 — LA TRACCIA DI UN'ELIMINAZIONE FERMATA A META'.
     Se ne occupano insieme il pannello qui sotto e la fascia rossa in cima
     al Cestino: l'elenco si scrive una volta e resta li' finche' non e'
     stato sistemato davvero. Non si cancella da solo dopo tot giorni: e'
     roba persa o da rimettere a posto, e sparisce solo quando lo dice lui. */
  const CEST_GUASTO="gest_cestino_guasto";
  function cestGuastoSalva(testo){
    try{ localStorage.setItem(CEST_GUASTO,
      JSON.stringify({quando:Date.now(),testo:String(testo||"")})); }catch(e){}
  }
  function cestGuastoLeggi(){
    try{ const v=JSON.parse(localStorage.getItem(CEST_GUASTO)||"null");
         return (v&&v.testo)?v:null; }catch(e){ return null; }
  }
  function cestGuastoHTML(){
    const g=cestGuastoLeggi(); if(!g) return "";
    let quando="";
    try{ quando=new Date(g.quando||Date.now()).toLocaleDateString("it-IT"); }catch(e){}
    return '<div class="cest-testa" style="border-left:4px solid var(--err);background:var(--err-bg)">'
      + '<div><b>Un\u2019eliminazione si è fermata a metà</b>'
      +   (quando?' <small>— '+esc(quando)+'</small>':'')+'</div>'
      + '<div class="cest-nota" style="white-space:pre-wrap">'+esc(g.testo)+'</div>'
      + '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">'
      +   '<button type="button" class="btn" data-action="cest-guasto-copia">Copia l\u2019elenco</button>'
      +   '<button type="button" class="btn b-cancel" data-action="cest-guasto-via">L\u2019ho sistemato, togli l\u2019avviso</button>'
      + '</div></div>';
  }
  function cestGuastoPannello(testo){
    openSheetGrande("L\u2019eliminazione si è fermata a metà",
        '<div class="sh-b"><div class="sh-nota" style="white-space:pre-wrap">'+esc(testo)+'</div></div>'
      + '<div class="sh-b"><div class="sh-tit">Questo elenco non lo perdi</div>'
      +   '<div class="sh-nota">Resta scritto in cima al <b>Cestino</b> finché non premi '
      +   '«L\u2019ho sistemato». Qui sotto puoi anche copiartelo.</div>'
      +   '<button type="button" class="btn btn-primary" data-action="cest-guasto-copia" '
      +     'style="margin-top:9px">Copia l\u2019elenco</button></div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>');
  }

  async function renderCestino(soloDisegno){
    const box=$("#cest-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML="";return;}
    /* 12 agosto 2026 — tre stati, non piu' due. Nei primi secondi il cestino
       sta ancora facendo la sua prova di accensione: prima qui compariva
       "Il cestino non è ancora acceso", che è una bugia e spaventa. */
    const cst=(window.cestinoStato&&window.cestinoStato())||null;
    if(cst&&cst.attesa>0){
      $("#cest-riass").innerHTML=cestGuastoHTML();
      box.innerHTML=tabVuoto("Sto controllando il cestino",
        "Ci vuole un attimo. Finché non ho una risposta chiara dal database non lascio eliminare niente, così non si perde nulla per colpa della connessione. Riprova fra qualche secondo.",
        _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>');
      return;
    }
    if(!(window.cestinoAttivo&&window.cestinoAttivo())){
      $("#cest-riass").innerHTML=cestGuastoHTML();
      box.innerHTML=tabVuoto("Il cestino non è ancora acceso",
        "Esegui sql/gest-cestino.sql su Supabase (SQL Editor → Run) e ricarica la pagina. Da quel momento tutto quello che elimini finisce qui e si può rimettere a posto.",
        _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>');
      return;
    }
    if(cst&&cst.motivo==="migrazione-parziale"){
      /* la migrazione e' passata a meta': su alcune tabelle l'eliminazione e'
         bloccata, e l'utente deve sapere perche' invece di pensare a un guasto */
      $("#cest-riass").innerHTML=cestGuastoHTML()+'<div class="cest-testa"><div><b>Manca un pezzo di migrazione</b></div>'
        +'<div class="cest-nota">Su alcune parti del gestionale il cestino non è installato, quindi lì l\'eliminazione è bloccata per non perdere niente. '
        +'Esegui sql/gest-cestino.sql su Supabase e ricarica la pagina. Il dettaglio è in F12 → Console, riga [cestino].</div></div>';
    }
    /* soloDisegno = la ricerca: filtra quello che c'e' gia' in memoria, senza
       ridomandare niente al database. Cosi' puo' girare a ogni lettera. */
    if(!soloDisegno){
    /* si chiede a tutte le tabelle insieme: sono piccole richieste in parallelo.
       count:"exact" costa niente in piu' e serve a dire QUANTE ce ne sono
       davvero: prima si mostravano le prime 200 per tipo e le altre sparivano
       senza che nessuno lo dicesse. */
    const _mid=curMestiere();
    /* «gest_mestieri» non si filtra mai per reparto: un reparto eliminato non
       sta dentro nessun reparto, e filtrandolo non lo si potrebbe piu'
       rimettere a posto. Le tabelle che il reparto non ce l'hanno proprio
       (elenco prezzi, crediti formativi: sono della PERSONA, non del pannello)
       si riconoscono dall'errore del database e si mostrano sempre. */
    async function cestChiedi(c){
      const q=function(conReparto){
        let b=sb.raw(c.t).select("*",{count:"exact"}).eq("user_id",sbUid)
          .not("eliminato_il","is",null);
        if(conReparto)b=b.eq("mestiere_id",_mid);
        return b.order("eliminato_il",{ascending:false}).limit(CEST_MAX);
      };
      const filtra=(cestVista!=="tutti")&&!!_mid&&c.t!=="gest_mestieri";
      let r=null;
      try{ r=await q(filtra); }catch(e){ r=null; }
      if(filtra&&r&&r.error&&/mestiere_id|42703|column/i.test((r.error.message||"")+(r.error.code||""))){
        try{ r=await q(false); }catch(e){ r=null; }
      }
      const righe=(r&&!r.error&&r.data)||[];
      /* ko: questa tabella non ha risposto. "Non lo so" non e' "zero" — vedi
         sotto, dove decide se il pallino si puo' scrivere. */
      return {c:c, righe:righe, ko:!!(!r||r.error),
              n:(r&&!r.error&&typeof r.count==="number")?r.count:righe.length};
    }
    const risposte=await Promise.all(CEST_COSE.map(cestChiedi));
    cestQui=risposte.reduce((s,x)=>s+(x.n||0),0);
    /* il pallino del menu conta TUTTO il cestino, non solo questo reparto:
       e' un "hai roba buttata via", non un conteggio di sezione. Quindi si
       aggiorna solo quando si sta guardando davvero tutto. */
    /* 13 agosto 2026 — la stessa guardia che sta in contaCestinoUnaVolta.
       Senza, una tabella che non rispondeva valeva zero, il totale finiva nel
       pallino sottostimato e cestContato=true lo bloccava li' per tutta la
       sessione: il menu diceva 10 con 12 cose nel Cestino, cioe' MENO del vero,
       che e' il verso sbagliato in cui sbagliare. */
    const _incerto=risposte.some(x=>x.ko);
    if(cestVista==="tutti"&&!_incerto){
      cestTotale=cestQui;
      cestContato=true;
      setCnt("#cnt-cestino",cestTotale,"attesa");
    }else if(cestVista==="tutti"){
      cestContato=false;                        /* si riprova al giro dopo */
    }else if(cestTotale!=null&&cestTotale<cestQui){
      cestTotale=cestQui;                       /* non puo' essercene meno del pezzo */
      setCnt("#cnt-cestino",cestTotale,"attesa");
    }
    /* 15 agosto 2026 — i nomi dei lavori, per le righe che da sole non
       direbbero niente (oggi: i rapportini). Si chiede sb.raw perche' il
       lavoro puo' essere nel Cestino anche lui: con sb.from tornerebbe vuoto
       e la riga direbbe solo la data.
       Una domanda sola, e solo se davvero c'e' qualcosa da nominare. */
    await cestNomiLavori(risposte);
    cestCache=[];
    risposte.forEach(function(x){
      x.righe.forEach(function(r){
        /* il nome si cerca su più colonne: non tutte le tabelle hanno lo
           stesso campo, e "(senza nome)" ovunque renderebbe il cestino inutile.
           Se la tabella ha una sua regola ("nome" in CEST_COSE) vince quella:
           certe righe non hanno nessuna colonna che le descriva. */
        const nome=(x.c.nome?String(x.c.nome(r)||"").trim():"")
          || [r[x.c.campo],r.nome,r.titolo,r.descrizione,r.nome_file,r.causale,r.testo,r.numero]
          .map(v=>String(v==null?"":v).trim()).find(v=>v!=="")
          || (r.data?("del "+fdate(r.data)):"")
          || "(senza nome)";
        /* chi e' il "padre" di questa riga, se ce l'ha: serve al ripristino */
        const _p=CEST_PADRE[x.c.t];
        cestCache.push({tab:x.c.t, ic:x.c.ic, foglia:!!x.c.foglia,
          tipo:(ruoloUtente!=='professionista'&&x.c.labImp)?(x.c.t==='gest_lavori'?_lav():x.c.labImp):x.c.lab,
          nome:nome.slice(0,80),
          quando:r.eliminato_il, id:r.id, path:r.storage_path||null,
          padre:(_p&&r[_p[1]])?{tab:_p[0], col:_p[1], id:r[_p[1]], lab:_p[2]}:null});
      });
    });
    cestCache.sort((a,b)=>String(b.quando||"").localeCompare(String(a.quando||"")));
    }

    /* la ricerca: cerca nel nome e nel tipo. Le posizioni restano quelle di
       cestCache, se no "Rimetti a posto" ripescherebbe la riga sbagliata. */
    const q=(cestQ||"").trim().toLowerCase();
    const vis=cestCache.map((x,i)=>({x:x,i:i}))
      .filter(v=>!q||(v.x.nome+" "+v.x.tipo).toLowerCase().includes(q));

    const totVero=(cestQui==null?cestCache.length:cestQui);
    const nascoste=Math.max(0,totVero-cestCache.length);
    /* quante ce ne sono negli ALTRI reparti: si dice, se no uno crede che il
       cestino sia vuoto e invece sta solo guardando un pannello */
    const altrove=(cestVista!=="tutti"&&cestTotale!=null)?Math.max(0,cestTotale-totVero):0;
    if($("#cest-riass"))$("#cest-riass").innerHTML=cestGuastoHTML()+((totVero||q||altrove)
      ? '<div class="cest-testa"><div><b>'+totVero+'</b> '
        +(totVero===1?'cosa eliminata':'cose eliminate')
        +(cestVista!=="tutti"?' in questo reparto':'')
        +(nascoste?(' <small>— ne mostro '+cestCache.length+', le più recenti</small>'):'')
        +(q?(' <small>· trovate '+vis.length+' con «'+esc(cestQ)+'»</small>'):'')
        +'</div><div class="cest-nota">Restano qui finché non le rimetti a posto, e non si vedono da nessun\'altra parte del gestionale. '
        +'Foto, video e documenti però continuano a occupare spazio finché non li elimini per sempre.'
        +(altrove?(' <b>Altre '+altrove+' stanno in altri reparti:</b> per vederle scegli «Tutti i reparti» qui sopra.'):'')
        +'</div></div>'
      : "");

    renderTabella({
      id:"cest", box:"#cest-list",
      viste:"#cest-viste",
      visteDef:[{k:"reparto",lab:"Questo reparto"},{k:"tutti",lab:"Tutti i reparti"}],
      vista:cestVista, conta:{}, azioneVista:"cest-vista",
      vuoto:q
        ? tabVuoto("Nessuna corrispondenza",
            "Nel cestino non c'è niente che si chiami «"+esc(cestQ)+"». Svuota la casella per rivedere tutto.",
            _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
            {t:"Mostra tutto",a:"cerca-azzera"})
        : (altrove
          ? tabVuoto("In questo reparto non hai eliminato niente",
              "Ci sono però "+altrove+" cose eliminate in altri reparti: scegli «Tutti i reparti» qui sopra per vederle.",
              _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>')
          : tabVuoto("Il cestino è vuoto",
            "Qui finisce tutto quello che elimini dal gestionale. Finché è qui non è perso: si rimette a posto con un clic.",
            _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>')),
      colonne:[{lab:"Che cos'era",w:"42%"},{lab:"Tipo",w:"26%",cls:"c-chi"},{lab:"Eliminato",w:"32%"}],
      righe:vis.map(function(v){
        const x=v.x, i=v.i;
        const q=quando(String(x.quando||"").slice(0,10),{neutro:true});
        return {
          id:String(i),
          click:{action:"cest-ripristina",data:{id:String(i)}},
          celle:[
            '<span class="lav-bar in_corso"></span><span class="c-nome">'+x.ic+' '+esc(x.nome)+'</span>',
            esc(x.tipo),
            {h:q.testo,cls:q.classe}
          ],
          menu:[{lab:"↩ Rimetti a posto",action:"cest-ripristina",data:{id:String(i)}}]
            .concat([{lab:"🗑 Elimina per sempre",action:"cest-definitivo",data:{id:String(i)},del:true}])
        };
      }),
      cards:()=>vis.map(function(v){
        const x=v.x, i=v.i;
        return schedaJob({
          tono:"t-neutro", titolo:x.ic+" "+esc(x.nome),
          destra:'<span class="stato" style="background:var(--sfondo);color:var(--testo-2)">'+esc(x.tipo)+'</span>',
          meta:["🗑 eliminato "+quando(String(x.quando||"").slice(0,10),{neutro:true}).testo],
          azioni:[{lab:"↩ Rimetti a posto",action:"cest-ripristina",data:{id:String(i)}}]
            .concat([{lab:"🗑 Elimina per sempre",action:"cest-definitivo",data:{id:String(i)},del:true}])
        });
      }).join("")
    });
  }

  /* rimette a posto UNA riga */
  function cestRiga(tab,id){
    return sb.raw(tab).update({eliminato_il:null}).eq("id",id).eq("user_id",sbUid).select("id");
  }
  /* rimette a posto i figli buttati via nello stesso momento del padre.
     Torna quanti ne ha tirati su. Non fa rumore se qualcosa va storto: il
     padre e' gia' tornato, e un figlio in meno si ripesca a mano. */
  async function cestFigli(tab,id,quando){
    const regole=CEST_FIGLI[tab];
    if(!regole||!quando)return 0;
    const t=new Date(quando).getTime();
    if(!isFinite(t))return 0;
    const da=new Date(t-CEST_FINESTRA).toISOString(), a=new Date(t+CEST_FINESTRA).toISOString();
    let n=0;
    for(const r of regole){
      try{
        const {data}=await sb.raw(r[0]).update({eliminato_il:null})
          .eq("user_id",sbUid).eq(r[1],id)
          .gte("eliminato_il",da).lte("eliminato_il",a)
          .select("id");
        n+=(data||[]).length;
      }catch(e){}
    }
    return n;
  }
  async function cestRipristina(i){
    const x=cestCache[+i];if(!x)return;
    if(!sbUid){toast("Devi essere loggato");return;}

    /* Il padre e' ancora nel cestino? Allora rimettere a posto solo questo non
       serve a niente: torna su ma non si vede da nessuna parte, perche' il
       gestionale mostra solo la roba dei reparti (e dei fornitori) vivi. */
    let padreDaTirareSu=null;
    if(x.padre&&x.padre.id){
      try{
        const {data:pd}=await sb.raw(x.padre.tab).select("id,nome,eliminato_il")
          .eq("id",x.padre.id).eq("user_id",sbUid).limit(1);
        const p=(pd||[])[0];
        if(p&&p.eliminato_il){
          const q=p.nome?(" «"+p.nome+"»"):"";
          if(gconfirm("Questa cosa sta dentro il "+x.padre.lab+q+", che è ancora nel cestino.\n\n"
            +"Se rimetto a posto solo questa, non la vedrai da nessuna parte.\n\n"
            +"Rimetto a posto anche il "+x.padre.lab+"?")) padreDaTirareSu=p;
        }
      }catch(e){}
    }

    let extra=0;
    if(padreDaTirareSu){
      /* la data si legge PRIMA di rimettere a posto il padre: e' quella che dice
         "questi figli sono stati buttati via insieme a lui". Leggendola dopo,
         il padre e' gia' tornato su e la data non c'e' piu': i figli
         resterebbero tutti nel cestino, da ripescare a mano uno per uno. */
      const quandoPadre=padreDaTirareSu.eliminato_il;
      const rp=await cestRiga(x.padre.tab,padreDaTirareSu.id);
      if(rp&&rp.error){toast("Errore: "+rp.error.message);return;}
      extra+=1+await cestFigli(x.padre.tab,padreDaTirareSu.id,quandoPadre);
    }

    const {data,error}=await cestRiga(x.tab,x.id);
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non ripristinato: nessuna riga trovata");return;}
    extra+=await cestFigli(x.tab,x.id,x.quando);

    /* ⚠️ RIMETTERE A POSTO UNA PERSONA NON LE RIDAVA IL TELEFONO — 14/8/2026.
       Eliminando una persona il gestionale le toglie l'accesso
       (gest_membri.stato = 'revocato'): giusto, se no continuerebbe a entrare
       da un elenco dove non compare più.
       Ma «Rimetti a posto» rimetteva solo eliminato_il a null. Lo stato
       restava 'revocato': la persona tornava in elenco, sembrava tutto a
       posto, e la mattina dopo dal telefono non entrava. Il messaggio diceva
       «Rimesso a posto ✔» e basta.
       Riprodotto: nessuna scrittura su gest_membri, nessun avviso.
       L'accesso NON si riaccende da soli — chi è stato eliminato può non
       doverci più entrare — ma adesso si dice, con scritto cosa fare. */
    let _avvisoAccesso="";
    if(x.tab==="gest_operatori"){
      try{
        const rm=await sb.from("gest_membri").select("stato")
          .eq("operatore_id",x.id).eq("impresa_id",sbUid).maybeSingle();
        const st=rm&&rm.data&&rm.data.stato;
        if(st==="revocato"){
          _avvisoAccesso=" — ma dal telefono NON entra: quando l'hai eliminata "
            +"le è stato tolto l'accesso. Apri la sua scheda e rimandale il link d'invito.";
        }
      }catch(e){}
    }

    /* rimesso a posto un reparto o una pratica cambia mezzo gestionale:
       si ridisegna tutto invece di indovinare cosa è cambiato */
    _cestRicontaPallino();
    renderCestino();
    rinfresca("riepilogo","lavori","clienti","preventivi","fatture","scadenzario","mezzi","squadra","fornitori","galleria","report","carte","crediti","calendario");
    if(x.tab==="gest_mestieri"||(padreDaTirareSu&&x.padre.tab==="gest_mestieri"))renderLanding();
    toast((!extra?"Rimesso a posto ✔"
      :extra===1?"Rimesso a posto ✔ — e con lui anche 1 cosa che ci stava dentro"
      :"Rimesso a posto ✔ — e con lui anche altre "+extra+" cose che ci stavano dentro")
      +_avvisoAccesso);
  }

  /* ===== 9 agosto 2026 — ELIMINA PER SEMPRE, VERSIONE SICURA =====
     Prima il pulsante c'era solo sulle cose senza figli, perche' cancellare
     davvero una pratica o un reparto fa scattare le cancellazioni a catena del
     database e si porta via anche roba VIVA, mai finita nel cestino.
     Adesso c'e' su tutto, ma non decide il gestionale: decide Postgres.
     La funzione gest_cestino_elimina (sql/gest-cestino-elimina.sql) legge dal
     catalogo del database chi dipende da chi — quindi non le sfugge nemmeno una
     tabella aggiunta domani — scende lungo tutta la catena e si RIFIUTA di
     cancellare se trova anche una sola riga non ancora nel cestino.
     Il controllo lo rifa' anche al momento della conferma: fra l'anteprima e
     l'ok l'utente potrebbe aver ripristinato qualcosa in un'altra scheda. */
  const CEST_NOMI={
    gest_lavori:"pratiche/lavori", gest_clienti:"clienti", gest_preventivi:"preventivi",
    gest_fatture:"fatture", gest_scadenze:"scadenze", gest_mestieri:"reparti",
    gest_mezzi:"mezzi e strumenti", gest_operatori:"persone", gest_carte:"carte aziendali",
    gest_fornitori:"fornitori", gest_fatture_fornitori:"fatture fornitori",
    gest_spese:"spese", gest_ore:"ore lavorate", gest_crediti:"crediti formativi",
    gest_computi:"computi", gest_computo_capitoli:"capitoli del computo",
    gest_computo_voci:"voci del computo", gest_computo_misure:"misure del computo",
    gest_prezzi_propri:"voci del tuo elenco prezzi",
    gest_rapportini:"rapportini di cantiere",
    gest_foto:"foto e documenti", gest_video:"video", gest_note:"note",
    gest_fattura_righe:"righe della fattura", gest_preventivo_righe:"righe del preventivo",
    gest_fattura_lavori:"collegamenti fattura-lavoro", gest_lavoro_mezzi:"mezzi usati",
    gest_carte_movimenti:"movimenti della carta", gest_rifornimenti:"rifornimenti"
  };
  function cestElenco(v){
    return (v||[]).map(function(x){return "\u2022 "+x.n+" "+(CEST_NOMI[x.tabella]||x.tabella);}).join("\n");
  }

  async function cestDefinitivo(i){
    const x=cestCache[+i];if(!x)return;
    if(!sbUid){toast("Devi essere loggato");return;}

    /* primo giro: non cancella niente, chiede solo cosa succederebbe */
    const {data:prova,error:eProva}=await sb.rpc("gest_cestino_elimina",
      {p_tabella:x.tab,p_id:x.id,p_conferma:false});

    if(eProva||!prova){
      /* Si ripiega sulla vecchia strada SOLO se la funzione non esiste ancora
         (PGRST202 = "function not found"). Se invece il database ha risposto
         con un errore vero, ripiegare vorrebbe dire cancellare aggirando il
         controllo: meglio fermarsi e far vedere l'errore. */
      const m=(eProva&&(eProva.code||"")+" "+(eProva.message||""))||"";
      const nonEsiste=/PGRST202|Could not find the function|schema cache/i.test(m);
      if(!nonEsiste&&eProva){toast("Errore: "+(eProva.message||"il database non risponde"));return;}
      if(x.foglia)return cestDefinitivoFoglia(x);
      toast("Per eliminare per sempre questa scheda esegui sql/gest-cestino-elimina.sql su Supabase");
      return;
    }

    /* una fattura gia' emessa e' un documento fiscale: nel cestino ci resta,
       cancellata per sempre no. Il rifiuto arriva dal database.
       10 agosto 2026 \u2014 il rifiuto arriva anche quando la fattura non e' quella
       cliccata ma sta PIU' SOTTO nella catena (svuotando un reparto se ne
       andrebbe con lui). In quel caso "Questa e' la fattura numero 7" non si
       capisce: si dice quale scheda si stava svuotando e cosa c'e' dentro.
       Il campo "fiscali" (elenco) arriva dalla versione corretta della funzione;
       se il database ha ancora quella vecchia c'e' solo "fiscale" e si usa quello. */
    if(prova.ok===false && prova.fiscale){
      const _num=(prova.fiscali&&prova.fiscali.length?prova.fiscali:[prova.fiscale]);
      const _elenco=_num.map(function(n){return "n. "+n;}).join(", ");
      const _diretta=(x.tab==="gest_fatture");
      alert((_diretta
          ? "Questa \u00e8 la fattura "+_elenco+": \u00e8 un documento fiscale.\n\n"
          : "Dentro \u00ab"+x.nome+"\u00bb c'\u00e8 una fattura gi\u00e0 emessa ("+_elenco+"), "
            +"che \u00e8 un documento fiscale.\n\n")
        +"Pu\u00f2 restare nel cestino quanto vuoi, ma non la cancello per sempre: "
        +"resterebbe un buco nella numerazione senza pi\u00f9 il documento a spiegare cos'era, "
        +"e i buchi il commercialista li vede.\n\n"
        +"Se \u00e8 sbagliata, la strada giusta \u00e8 la nota di credito.");
      return;
    }
    if(prova.ok===false){
      alert("Non posso eliminare \u00ab"+x.nome+"\u00bb per sempre.\n\n"
        +"Ci sono ancora collegate delle cose che NON sono nel cestino:\n"
        +cestElenco(prova.vivi)
        +"\n\nSe la cancellassi adesso sparirebbero anche loro. Mettile prima nel cestino, poi riprova.");
      return;
    }

    const insieme=(prova.anteprima||[]).length
      ? "\n\nInsieme a lei se ne va (\u00e8 gi\u00e0 tutto nel cestino):\n"+cestElenco(prova.anteprima)
      : "";
    /* le righe che sopravvivono ma perdono il riferimento: non bloccano, ma
       l'utente deve saperlo prima, non scoprirlo dopo su una fattura senza cliente */
    const scoll=(prova.scollegate||[]).length
      ? "\n\nQueste restano ma perdono il collegamento:\n"+cestElenco(prova.scollegate)
      : "";
    if(!gconfirm("Eliminare \u00ab"+x.nome+"\u00bb per sempre?"+insieme+scoll
        +"\n\nQuesta volta sparisce davvero e non si recupera pi\u00f9."))return;

    const {data:fatto,error}=await sb.rpc("gest_cestino_elimina",
      {p_tabella:x.tab,p_id:x.id,p_conferma:true});
    if(error){toast("Errore: "+error.message);return;}
    if(!fatto||fatto.ok===false){
      toast("Non eliminato: nel frattempo qualcosa \u00e8 tornato attivo");
      _cestRicontaPallino();
      renderCestino();return;
    }
    await cestPulisciFile(x, fatto.file);
    _cestRicontaPallino();
    renderCestino();
    rinfresca("riepilogo","lavori","clienti","preventivi","fatture","scadenzario","mezzi","squadra","fornitori","galleria","report","carte","crediti","calendario");
    toast("Eliminato per sempre");
  }

  /* il file nello storage se ne va solo adesso, non prima: e' l'unico momento
     in cui siamo sicuri che nessuno lo vuole piu' indietro */
  async function cestPulisciFile(x, elenco){
    /* 9 agosto 2026 — prima si cancellava solo il file della riga cliccata.
       Eliminando un padre, le foto dei figli sparivano dal database ma i file
       restavano nel bucket per sempre, senza piu' nessuna riga che li nominasse:
       spazio occupato e foto di cantiere non piu' cancellabili da nessuna
       schermata. Adesso la funzione del database restituisce anche i percorsi. */
    const perBucket={};
    const metti=(tab,path)=>{
      if(!path)return;
      const b=(tab==="gest_video")?"gestionale-video":"gestionale-foto";
      (perBucket[b]=perBucket[b]||[]).push(path);
    };
    metti(x.tab,x.path);
    (elenco||[]).forEach(r=>metti(r.tabella,r.path));
    for(const b in perBucket){
      try{ await sb.storage.from(b).remove(perBucket[b]); }catch(e){}
    }
  }

  /* via di riserva: vale solo finche' non e' stato eseguito
     sql/gest-cestino-elimina.sql, e solo sulle cose senza figli */
  async function cestDefinitivoFoglia(x){
    if(!gconfirm("Eliminare \u00ab"+x.nome+"\u00bb per sempre?\n\nQuesta volta sparisce davvero e non si recupera pi\u00f9."))return;
    const {data,error}=await sb.raw(x.tab).delete().eq("id",x.id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non eliminato: nessuna riga trovata");return;}
    await cestPulisciFile(x);
    _cestRicontaPallino();
    renderCestino();
    rinfresca("riepilogo","lavori","clienti","preventivi","fatture","scadenzario","mezzi","squadra","fornitori","galleria","report","carte","crediti","calendario");
    toast("Eliminato per sempre");
  }



  /* ---- REPORT & STATISTICHE ---- */

  async function saveComputo(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const titolo=($("#co-tit")&&$("#co-tit").value||"").trim();
    if(!titolo){toast("Scrivi almeno il titolo del computo");return;}
    /* rete di sicurezza: qualunque numero di questo modulo si legge con la
       regola italiana (12,5 = 12.5) e non finisce MAI nel database come NaN */
    const num=(x)=>{const v=String(($(x)&&$(x).value)||"").trim();
      if(v==="")return null;const n=_numeroIt(v);return (n==null||!isFinite(n))?null:n;};
    const txt=(x)=>{const v=String(($(x)&&$(x).value)||"").trim();return v===""?null:v;};
    /* ⚠️ LO SCONTO FUORI SCALA — 14 agosto 2026.
       Il campo accettava qualsiasi numero. Provato: 150 dava un totale di
       −500 € (i soldi glieli daresti tu al cliente), −10 faceva SALIRE il
       conto del 10% chiamandolo «ribasso». Nessun avviso, e sul PDF usciva
       stampato «Ribasso -10,00%».
       Qui si dice e si ferma, prima che finisca nel database. Nel conto c'e'
       anche il paracadute (compRiepilogoDa), per i numeri gia' scritti. */
    const _rib=num("#co-rib");
    if(_rib!=null&&(_rib<0||_rib>100)){
      toast(_rib<0
        ? "Il ribasso non può essere negativo: sarebbe un aumento, non uno sconto. Scrivi un numero fra 0 e 100."
        : "Il ribasso non può superare il 100%: il totale verrebbe negativo. Scrivi un numero fra 0 e 100.");
      const _e=$("#co-rib"); if(_e){_e.focus();_e.select&&_e.select();}
      return;
    }
    const row={
      user_id:sbUid, mestiere_id:curMestiere(),
      titolo:titolo,
      numero:txt("#co-num"),
      oggetto:txt("#co-ogg"),
      luogo:txt("#co-luogo"),
      data:($("#co-data")&&$("#co-data").value)||todayStr(),
      cliente_id:($("#co-cli")&&$("#co-cli").value)||null,
      lavoro_id:($("#co-lav")&&$("#co-lav").value)||null,
      tipo:segVal("co-tipo")||"privato",
      stato:segVal("co-stato")||"bozza",
      /* dalla tendina esce il nome esatto della tariffa; con «lo scrivo io»
         valgono i due campi di testo, come prima */
      prezzario:(function(){const e=$("#co-prz-sel");
        if(e&&e.value&&e.value!=="__mio__")return e.value;
        if(e&&e.value==="")return null;
        return txt("#co-prz");})(),
      /* l'anno vale SOLO con «lo scrivo io»: scegliendo una tariffa dalla
         tendina l'anno sta gia' nel suo nome, e con «non lo dico» non c'e'
         niente da datare. Senza questo, dicendo "non lo dico" restava
         appiccicato l'anno di prima. */
      prezzario_anno:(function(){const e=$("#co-prz-sel");
        if(e&&e.value!=="__mio__")return null;
        return num("#co-prz-anno");})(),
      ribasso_perc:_rib,
      note:txt("#co-note"),
      /* la data di partenza del cantiere: il resto del cronoprogramma
         (le durate) sta sui capitoli e si salva dalla pagina 6 */
      data_inizio:($("#co-inizio")?(($("#co-inizio").value||"")||null):undefined),
      /* il quadro economico si scrive ANCHE se adesso il computo è privato:
         chi passa da pubblico a privato per due minuti non deve ritrovarsi il
         lavoro di mezz'ora buttato via. È la stessa scelta degli oneri della
         sicurezza, che restano scritti nelle voci e semplicemente non contano. */
      quadro_economico:($("#co-qe-righe")?qeLetto():undefined)
    };
    if(row.quadro_economico===undefined)delete row.quadro_economico;
    if(row.data_inizio===undefined)delete row.data_inizio;
    let res;
    const _scrivi=async function(r){
      return id ? await sb.from("gest_computi").update(r).eq("id",id).eq("user_id",sbUid).select("id")
                : await sb.from("gest_computi").insert(r).select("id");
    };
    res=await _scrivi(row);
    /* ⚠️ la colonna può non esserci ancora (sql/gest-computo-quadro.sql): il
       computo si salva lo stesso, senza il quadro economico, e si dice. Senza
       questo ripiego un aggiornamento non eseguito bloccava il Salva di TUTTI
       i computi, anche di chi il quadro economico non lo usa. */
    let qePerso=false;
    if(res.error&&"quadro_economico" in row
       &&/quadro_economico/i.test(String(res.error.message||"")+" "+String(res.error.code||""))){
      const senza=Object.assign({},row); delete senza.quadro_economico;
      res=await _scrivi(senza);
      if(!res.error)qePerso=true;
    }
    /* ⚠️ stesso ripiego per la data di inizio del cronoprogramma
       (sql/gest-computo-cronoprogramma.sql): finche' quell'aggiornamento
       non e' stato eseguito, il computo si salva lo stesso. Senza questo,
       un solo file SQL non eseguito bloccherebbe il Salva di TUTTI i
       computi — anche di chi il cronoprogramma non lo usa. */
    let crPerso=false;
    if(res.error&&"data_inizio" in row
       &&/data_inizio/i.test(String(res.error.message||"")+" "+String(res.error.code||""))){
      const senza=Object.assign({},row); delete senza.data_inizio;
      res=await _scrivi(senza);
      if(!res.error)crPerso=true;
    }
    if(res.error){
      toast(_compManca(res.error)
        ? ("Prima serve l'aggiornamento del database: "+COMP_SQL_TESTO)
        : "Errore: "+res.error.message);
      return;
    }
    if(!res.data||!res.data.length){toast("Non salvato: nessuna riga scritta. Riprova.");return;}
    /* ⚠️ 20 agosto 2026 — DOPO «Crea computo» LA FINESTRA SI RIAPRE.
       Prima si chiudeva: restavi davanti all'elenco con una riga nuova e
       nessuna idea di cosa fare adesso. Il computo appena creato e' VUOTO —
       il passo successivo e' sempre lo stesso, mettergli dentro le
       lavorazioni — quindi ce lo si porta dentro noi, sulla pagina 1.
       Solo alla CREAZIONE (!id): su un Salva normale chiudere e' giusto. */
    if(!id&&!qePerso&&res.data[0]&&res.data[0].id){
      await renderComputi();
      rinfresca("riepilogo");
      const nuovo=(compCache||[]).find(x=>String(x.id)===String(res.data[0].id));
      if(nuovo){
        toast("Computo creato ✔ — adesso mettici le lavorazioni");
        await computoForm(nuovo);
        return;
      }
    }
    closeSheet();
    await renderComputi();
    rinfresca("riepilogo");
    toast(qePerso
      ? "Computo salvato, ma il quadro economico NO: manca l'aggiornamento del database (esegui sql/gest-computo-quadro.sql su Supabase)."
      : (crPerso
        ? "Computo salvato, ma la data di inizio NO: manca l'aggiornamento del database (esegui sql/gest-computo-cronoprogramma.sql su Supabase)."
        : (id?"Computo salvato ✔":"Computo creato ✔")));
  }

  /* ===== 11 agosto 2026 — DUPLICARE UN COMPUTO =====
     Due appartamenti uguali, la stessa palazzina con tre scale, lo stesso tipo
     di intervento su un altro edificio: senza questo si ribatte tutto da capo,
     capitolo per capitolo, lavorazione per lavorazione, misura per misura. È
     la funzione che fa la differenza fra "carino" e "me lo tengo".

     COSA SI PORTA DIETRO
     - il computo: titolo con «(copia)», oggetto, luogo, prezzario, ribasso,
       tipo (privato/pubblico) e note
     - il CLIENTE sì, la PRATICA no. Due appartamenti dello stesso condominio
       hanno lo stesso cliente ma non lo stesso lavoro: agganciare due computi
       alla stessa pratica farebbe contare due volte nel Riepilogo.
     - tutti i capitoli, con numero, titolo e ordine
     - tutte le lavorazioni, riattaccate al capitolo GIUSTO della copia (non a
       quello dell'originale: è il punto dove è più facile sbagliare)
     - le misure solo se lo chiedi

     LA COPIA NASCE SEMPRE IN BOZZA e con la data di oggi, anche se
     l'originale era definitivo: una copia appena fatta non è un documento
     chiuso, e datarla come l'originale sarebbe una bugia sul foglio.

     SE QUALCOSA VA STORTO A METÀ, la copia mezza fatta si butta via da sola:
     restare con un computo con i capitoli e senza le lavorazioni sarebbe
     peggio che non averlo copiato. */
  /* ============================================================
     20 agosto 2026 — DUPLICA, E LA VARIANTE
     ============================================================
     Sono la stessa cosa con due differenze:

     - la COPIA e' un computo che non c'entra piu' niente con l'originale
       (il secondo appartamento uguale). Chiede se copiare le misure.
     - la VARIANTE si RICORDA da dove viene (variante_di) e ogni sua riga
       si ricorda da quale riga (origine_id): e' quello che le permette di
       dire cosa e' cambiato. Le misure si copiano SEMPRE, senza chiedere:
       una variante nasce dal lavoro vero, e partire dalle quantita' a zero
       vorrebbe dire riscriverle tutte per poterne cambiare due.
     ============================================================ */
  async function compDuplica(id,variante){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const c=compCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Computo non trovato");return;}

    /* quante misure ci sono davvero: se non ce n'è nessuna non ha senso
       chiedere se copiarle */
    const {data:vv,error:eV}=await sb.from("gest_computo_voci")
      .select("*").eq("computo_id",id).eq("user_id",sbUid).order("ordine");
    if(eV){toast("Errore: "+eV.message);return;}
    const voci=vv||[];
    const idVoci=voci.map(v=>v.id);
    let mis=[];
    if(idVoci.length){
      const {data:mm,error:eM}=await sb.from("gest_computo_misure")
        .select("*").eq("user_id",sbUid).in("voce_id",idVoci).order("ordine");
      if(eM){toast("Errore: "+eM.message);return;}
      mis=mm||[];
    }

    let conMisure=false;
    if(variante){
      /* le misure ci sono sempre: sono il punto di partenza di quello che
         cambierai. E si chiede una volta sola, con parole chiare. */
      conMisure=true;
      if(!gconfirm("Faccio la variante del computo «"+(c.titolo||"")+"»?\n\n"
        +"Nasce una COPIA con dentro tutto: capitoli, lavorazioni, prezzi e misure. "
        +"Li cambi come sono andati davvero i lavori.\n\n"
        +"Il computo di partenza NON si tocca, e nella variante trovi la pagina "
        +"«Cosa è cambiato» con le differenze e quanto costa in più o in meno."))return;
    }else if(mis.length){
      conMisure=gconfirm("Copio anche le misure?\n\n"
        +"SÌ  → il computo nuovo arriva identico, con tutte le "+mis.length+" misure già dentro. "
        +"Serve quando il lavoro è lo stesso (il secondo appartamento uguale) e devi solo correggere quello che cambia.\n\n"
        +"NO  → arrivano capitoli, lavorazioni, prezzi e unità di misura, ma le quantità partono da zero. "
        +"Serve quando è lo stesso tipo di lavoro su un edificio diverso.");
    }else{
      if(!gconfirm("Faccio una copia del computo «"+(c.titolo||"")+"»?"))return;
    }

    const {data:cap,error:eC}=await sb.from("gest_computo_capitoli")
      .select("*").eq("computo_id",id).eq("user_id",sbUid).order("ordine");
    if(eC){toast("Errore: "+eC.message);return;}
    const capitoli=cap||[];

    /* 1) il computo nuovo */
    const {data:nuovo,error:e1}=await sb.from("gest_computi").insert(Object.assign({
      user_id:sbUid, mestiere_id:curMestiere(),
      cliente_id:c.cliente_id||null,
      lavoro_id:null, preventivo_id:null,   /* la pratica NON si eredita */
      numero:null,                          /* lo metti tu: non invento un numero doppio */
      data:todayStr(), stato:"bozza",
      titolo:((c.titolo||"Computo")+(variante?" (variante)":" (copia)")).slice(0,200),
      oggetto:c.oggetto||null, luogo:c.luogo||null, note:c.note||null,
      tipo:c.tipo||"privato",
      prezzario:c.prezzario||null, prezzario_anno:c.prezzario_anno||null,
      ribasso_perc:c.ribasso_perc!=null?c.ribasso_perc:null
    },
    /* la colonna si nomina SOLO quando serve davvero: su un database senza
       l'aggiornamento (sql/gest-computo-variante.sql) una copia normale
       continua a funzionare come prima */
    variante?{variante_di:id}:{},
    /* il quadro economico si porta dietro come il ribasso: due appartamenti
       uguali hanno le stesse spese tecniche e la stessa IVA, e riscriverle
       undici righe alla volta è esattamente quello che «Duplica» evita.
       Si nomina la colonna SOLO se c'è: su un database senza l'aggiornamento
       la riga di partenza quella chiave non ce l'ha, e la copia non si rompe. */
    ("quadro_economico" in c)?{quadro_economico:c.quadro_economico||null}:{}
    )).select("id").single();
    if(e1||!nuovo){
      toast(_compManca(e1)
        ? ("Prima serve l'aggiornamento del database: "+COMP_SQL_TESTO)
        : "Copia non riuscita: "+((e1&&e1.message)||"nessuna riga scritta"));
      return;
    }
    const nid=nuovo.id;

    /* Da qui in poi, se salta qualcosa si butta via la copia a metà.
       ⚠️ SI PASSA DALLA PORTA DI SERVIZIO (sb.raw), NON DA sb.from.
       Su gest_computi il Cestino trasforma ogni cancellazione in una data:
       con sb.from la copia mezza fatta non sparirebbe, finirebbe NEL CESTINO,
       e Alessio se la ritroverebbe lì come se l'avesse buttata lui. Qui invece
       la riga è nata due secondi fa da noi ed è incompleta: va tolta davvero,
       e i capitoli già scritti se ne vanno con lei a catena.
       Trovato provando a far guastare il database a metà copia. */
    const rinuncia=async(msg)=>{
      try{
        await (sb.raw?sb.raw("gest_computi"):sb.from("gest_computi"))
          .delete().eq("id",nid).eq("user_id",sbUid);
      }catch(_){}
      toast("Copia non riuscita: "+msg+". Non è rimasto niente a metà.");
    };

    try{
      /* 2) i capitoli, tenendo la mappa vecchio -> nuovo */
      const mappaCap={};
      if(capitoli.length){
        const {data:nc,error:e2}=await sb.from("gest_computo_capitoli").insert(
          capitoli.map(k=>({user_id:sbUid,computo_id:nid,ordine:k.ordine,
                            numero:k.numero,titolo:k.titolo,note:k.note}))
        ).select("id,ordine,titolo");
        if(e2)throw e2;
        /* si riappaiano per ordine+titolo: l'insert di piu' righe restituisce
           le righe nell'ordine in cui gliele hai date, ma non c'e' scritto da
           nessuna parte che sia garantito, e sbagliare qui vorrebbe dire
           lavorazioni finite nel capitolo sbagliato */
        (nc||[]).forEach(n=>{
          const orig=capitoli.find(k=>k.ordine===n.ordine&&String(k.titolo||"")===String(n.titolo||"")
                                      &&!mappaCap[k.id]);
          if(orig)mappaCap[orig.id]=n.id;
        });
        capitoli.forEach((k,i)=>{ if(!mappaCap[k.id]&&nc&&nc[i])mappaCap[k.id]=nc[i].id; });
      }

      /* 3) le lavorazioni */
      const mappaVoci={};
      if(voci.length){
        const {data:nv,error:e3}=await sb.from("gest_computo_voci").insert(
          voci.map(v=>Object.assign({user_id:sbUid,computo_id:nid,
            capitolo_id:v.capitolo_id?(mappaCap[v.capitolo_id]||null):null,
            ordine:v.ordine,codice:v.codice,descrizione:v.descrizione,unita:v.unita,
            prezzo_unitario:v.prezzo_unitario,
            quantita_manuale:!!v.quantita_manuale,
            /* la quantità a mano si porta solo se è scritta a mano: quella
               che viene dalle misure la ricalcola il database */
            quantita:(conMisure||v.quantita_manuale)?(v.quantita||0):0,
            incidenza_manodopera:v.incidenza_manodopera,
            /* ⚠️ da quale riga viene questa riga. Serve SOLO alla variante,
               e serve a lei per non dire bugie: due lavorazioni possono
               avere lo stesso codice in due capitoli diversi, e una
               descrizione si puo' correggere. Confrontando per codice o
               per descrizione, una riga corretta risulterebbe «tolta» e
               «nuova» insieme. */
            oneri_sicurezza:v.oneri_sicurezza,note:v.note},
            variante?{origine_id:v.id}:{}))
        ).select("id,ordine,descrizione");
        if(e3)throw e3;
        (nv||[]).forEach(n=>{
          const orig=voci.find(v=>v.ordine===n.ordine&&String(v.descrizione||"")===String(n.descrizione||"")
                                  &&!mappaVoci[v.id]);
          if(orig)mappaVoci[orig.id]=n.id;
        });
        voci.forEach((v,i)=>{ if(!mappaVoci[v.id]&&nv&&nv[i])mappaVoci[v.id]=nv[i].id; });
      }

      /* 4) le misure, solo se le hai volute */
      if(conMisure&&mis.length){
        const righe=mis.map(m=>({user_id:sbUid,voce_id:mappaVoci[m.voce_id],
          ordine:m.ordine,descrizione:m.descrizione,parti:m.parti,
          lunghezza:m.lunghezza,larghezza:m.larghezza,altezza:m.altezza,
          detrai:!!m.detrai})).filter(r=>r.voce_id);
        /* a blocchi di 200, come fa l'importazione del prezzario: un computo
           grosso puo' avere migliaia di misure e in una volta sola non passa */
        for(let i=0;i<righe.length;i+=200){
          const {error:e4}=await sb.from("gest_computo_misure").insert(righe.slice(i,i+200));
          if(e4)throw e4;
        }
      }
    }catch(err){
      await rinuncia((err&&err.message)||"errore del database");
      return;
    }

    await renderComputi();
    rinfresca("riepilogo");
    toast("Computo duplicato ✔  "+(conMisure?"misure comprese":"senza le misure"));
    /* si apre subito la copia: la prima cosa che si fa è cambiarle il titolo */
    const copia=compCache.find(x=>String(x.id)===String(nid));
    if(copia)computoForm(copia);
  }

  async function delComputo(id){
    if(!sbUid)return;
    const c=compCache.find(x=>String(x.id)===String(id))||{};
    const conCestino=(window.cestinoAttivo&&window.cestinoAttivo());
    if(!gconfirm(conCestino
      ? "Mettere il computo «"+(c.titolo||"")+"» nel cestino?\n\nLo ritrovi nel Cestino e lo puoi rimettere a posto quando vuoi."
      : "Eliminare il computo «"+(c.titolo||"")+"»?\n\nSe ne vanno anche i suoi capitoli, le lavorazioni e le misure, e non si recupera."))return;
    const {data,error}=await sb.from("gest_computi").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
    closeSheet();
    await renderComputi();
    rinfresca("riepilogo","cestino");
    toast(conCestino?"Messo nel cestino ✔":"Eliminato");
  }

  /* ---- REPORT & STATISTICHE ---- */
  async function _fetchAllExport(){
    if(!sb||!sbUid){toast("Devi essere loggato");return null;}
    toast("Preparo l'esportazione…");
    /* 9 agosto 2026 — un file che si chiama "backup" e non contiene le FATTURE
       non è un backup. Mancavano anche ore, crediti formativi e fornitori.
       Le tabelle nuove si leggono con .catch: se una migrazione non è stata
       fatta, il backup esce lo stesso con tutto il resto invece di fallire. */
    const vuoto={data:[]};
    const _opz=q=>q.then(r=>r&&!r.error?r:vuoto).catch(()=>vuoto);
    /* 9 agosto 2026 — il backup legge con sb.raw, cioe' SENZA il filtro del
       cestino. Da quando si puo' eliminare per sempre, un file chiamato
       "backup" che non contiene le cose nel cestino sarebbe una trappola:
       uno lo scarica, poi svuota il cestino convinto di essere coperto.
       La colonna eliminato_il resta nel file, quindi si distingue cos'era cosa. */
    const _tab=t=>((window.cestinoAttivo&&window.cestinoAttivo())?sb.raw(t):sb.from(t));
    const [mest,lav,cli,ops,scad,prev,righe,spese,mezzi,lavMezzi,az,
           fatt,fattRig,fattLav,ore,cred,forn,fattForn,
           comp,compCap,compVoci,compMis,prezzi,carte,carteMov,rifor,note,foto,video]=await Promise.all([
      _tab("gest_mestieri").select("*").eq("user_id",sbUid),
      _tab("gest_lavori").select("*").eq("user_id",sbUid),
      _tab("gest_clienti").select("*").eq("user_id",sbUid),
      _tab("gest_operatori").select("*").eq("user_id",sbUid),
      _tab("gest_scadenze").select("*").eq("user_id",sbUid),
      _tab("gest_preventivi").select("*").eq("user_id",sbUid),
      _tab("gest_preventivo_righe").select("*").eq("user_id",sbUid),
      _tab("gest_spese").select("*").eq("user_id",sbUid),
      _tab("gest_mezzi").select("*").eq("user_id",sbUid),
      _tab("gest_lavoro_mezzi").select("*").eq("user_id",sbUid),
      _tab("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
      _opz(_tab("gest_fatture").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_fattura_righe").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_fattura_lavori").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_ore").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_crediti").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_fornitori").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_fatture_fornitori").select("*").eq("user_id",sbUid)),
      /* ===== 12 agosto 2026 (sera) — MANCAVA ANCORA UN PEZZO =====
         Il backup non conteneva i COMPUTI METRICI (con capitoli, voci e
         misure), il PREZZARIO personale, le CARTE aziendali coi loro
         movimenti, i RIFORNIMENTI, le NOTE del calendario e l'elenco di FOTO e
         VIDEO. Un computo da sessanta voci con tutte le misure e' settimane di
         lavoro: se un giorno serve davvero ripartire da questo file, non ci
         sarebbe stato. (Le foto e i video sono l'ELENCO, non i file: quelli
         stanno nello storage e vanno scaricati a parte, ma senza l'elenco non
         si saprebbe nemmeno cosa cercare.) */
      _opz(_tab("gest_computi").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_computo_capitoli").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_computo_voci").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_computo_misure").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_prezzi_propri").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_carte").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_carte_movimenti").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_rifornimenti").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_note").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_foto").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_video").select("*").eq("user_id",sbUid))
    ]);
    return {mest:mest.data||[],lav:lav.data||[],cli:cli.data||[],ops:ops.data||[],scad:scad.data||[],
            prev:prev.data||[],righe:righe.data||[],spese:spese.data||[],mezzi:mezzi.data||[],
            lavMezzi:lavMezzi.data||[],az:az.data||null,
            fatt:fatt.data||[],fattRig:fattRig.data||[],fattLav:fattLav.data||[],
            ore:ore.data||[],cred:cred.data||[],forn:forn.data||[],fattForn:fattForn.data||[],
            comp:comp.data||[],compCap:compCap.data||[],compVoci:compVoci.data||[],
            compMis:compMis.data||[],prezzi:prezzi.data||[],carte:carte.data||[],
            carteMov:carteMov.data||[],rifor:rifor.data||[],note:note.data||[],
            foto:foto.data||[],video:video.data||[]};
  }
  async function esportaExcel(){
    if(!(await caricaXLSX())){toast("Non riesco a scaricare il modulo Excel: controlla la connessione e riprova");return;}
    const D=await _fetchAllExport();if(!D)return;
    const mN=Object.fromEntries(D.mest.map(m=>[m.id,m.nome]));
    const cN=Object.fromEntries(D.cli.map(c=>[c.id,c.nome]));
    const oN=Object.fromEntries(D.ops.map(o=>[o.id,o.nome]));
    const lN=Object.fromEntries(D.lav.map(l=>[l.id,l.descrizione||""]));
    const pN=Object.fromEntries(D.prev.map(p=>[p.id,p.numero]));
    const wb=XLSX.utils.book_new();
    const add=(nome,rows)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{Vuoto:"—"}]),nome);
    /* 9 agosto 2026 — il foglio prende il nome giusto per chi lo apre, e per gli
       studi ci sono anche i dati della pratica: prima si salvavano nel database
       e non uscivano da nessuna parte, nemmeno qui. */
    const _pro=(ruoloUtente==='professionista');
    add(_lav(),D.lav.map(l=>{
      const r={Reparto:mN[l.mestiere_id]||"",Descrizione:l.descrizione||"",Dove:l.dove||"",
        Cliente:cN[l.cliente_id]||"",[_pro?"Collaboratore":"Operatore"]:oN[l.operatore_id]||"",
        Stato:statoLabel[l.stato]||l.stato||"","Data prevista":l.data_prevista||"",
        "Data fatto":l.data_fatto||"",Ore:+l.ore||0,"Importo €":+l.importo||0,
        "Stato fattura":l.fatt_stato||"none",Consuntivo:l.lavoro_svolto||"",Note:l.note||""};
      if(_pro){
        r["Tipo pratica"]=l.pratica_tipo||"";
        r["A che punto"]=(PRATICA_STATI.find(x=>x[0]===l.pratica_stato)||[])[1]||"";
        r["Comune"]=l.pratica_comune||"";
        r["N. protocollo"]=l.pratica_protocollo||"";
        r["Deposito"]=l.pratica_data_dep||"";
        r["Foglio"]=l.catasto_foglio||"";
        r["Particella"]=l.catasto_particella||"";
        r["Sub"]=l.catasto_sub||"";
      }
      return r;
    }));
    /* le fatture mancavano del tutto dall'esportazione */
    if((D.fatt||[]).length){
      const rPerF={};(D.fattRig||[]).forEach(r=>{(rPerF[r.fattura_id]=rPerF[r.fattura_id]||[]).push(r);});
      const impF={};(D.fatt||[]).forEach(f=>{impF[f.id]=fattImponibile(f,rPerF[f.id]);});
      /* la colonna Tipo mancava: nel foglio una nota di credito era
         indistinguibile da una fattura, e l'imponibile col meno sembrava un
         errore invece che una nota di credito */
      add("Fatture",D.fatt.map(f=>({Numero:f.numero||"",Anno:f.anno||"",Data:f.data||"",
        Tipo:FATT_TIPO_LAB[f.tipo]||"Fattura",
        Cliente:f.cli_nome||cN[f.cliente_id]||"",Stato:f.stato||"","Imponibile €":_cent2(impF[f.id]||0),
        "Cassa %":+f.cassa_perc||0,"Spese €":+f.spese||0,"Ritenuta %":+f.ritenuta_perc||0,
        "Sconto €":+f.sconto||0,"Bollo €":+f.bollo||0,Note:f.note||""})));
    }
    if((D.ore||[]).length)add(_pro?"Ore per pratica":"Ore per lavoro",
      D.ore.map(o=>({[_pro?"Pratica":"Lavoro"]:lN[o.lavoro_id]||"",Data:o.data||"",Ore:+o.ore||0,
        Chi:oN[o.operatore_id]||"",Nota:o.nota||""})));
    if((D.cred||[]).length)add("Crediti formativi",
      D.cred.map(c=>({Titolo:c.titolo||"",Ente:c.ente||"",Data:c.data||"",CFP:+c.crediti||0,Tipo:c.tipo||"",Note:c.note||""})));
    /* i soldi in USCITA: erano scaricati dal database e poi buttati via */
    if((D.forn||[]).length){
      const fN=Object.fromEntries(D.forn.map(f=>[f.id,f.nome]));
      add("Fornitori",D.forn.map(f=>({Nome:f.nome||"",Categoria:f.categoria||"",Telefono:f.telefono||"",
        Email:f.email||"","P.IVA":f.piva||"",Indirizzo:f.indirizzo||"",Note:f.note||""})));
      if((D.fattForn||[]).length)add("Fatture fornitori",D.fattForn.map(x=>({
        Fornitore:fN[x.fornitore_id]||"",Numero:x.numero||"",Data:x.data||"",
        "Importo €":+x.importo||0,Scadenza:x.scadenza||"",Stato:x.stato||"",
        [_pro?"Pratica":"Lavoro"]:lN[x.lavoro_id]||"",Note:x.note||""})));
    }
    add("Clienti",D.cli.map(c=>({Reparto:mN[c.mestiere_id]||"",Nome:c.nome||"",Indirizzo:c.indirizzo||"",Referente:c.referente||"",Telefono:c.telefono||""})));
    add(_pro?"Collaboratori":"Squadra",D.ops.map(o=>({Reparto:mN[o.mestiere_id]||"",Nome:o.nome||"",Telefono:o.telefono||""})));
    const tot={};D.righe.forEach(r=>{tot[r.preventivo_id]=(tot[r.preventivo_id]||0)+impRiga(r.qta,r.prezzo);});
    add("Preventivi",D.prev.map(p=>({Numero:p.numero,Titolo:p.titolo||"",Reparto:mN[p.mestiere_id]||"",Cliente:cN[p.cliente_id]||"",Data:p.data||"",Stato:p.stato||"","Totale €":tot[p.id]||0,Note:p.note||""})));
    add("Voci preventivi",D.righe.map(r=>({"N. preventivo":pN[r.preventivo_id]||"",Descrizione:r.descrizione||"","Q.tà":+r.qta||1,"Prezzo €":+r.prezzo||0,"Totale €":impRiga(r.qta,r.prezzo)})));
    add("Spese",D.spese.map(s=>({Lavoro:lN[s.lavoro_id]||"",Descrizione:s.descrizione||"","Importo €":+s.importo||0,Data:s.data||""})));
    const zN=Object.fromEntries(D.mezzi.map(m=>[m.id,m.nome||""]));
    const zCat={mezzo:"Mezzo",attrezzatura:"Attrezzatura"};
    const zStato={disponibile:"Disponibile",in_uso:"In uso",manutenzione:"In manutenzione",fuori_uso:"Fuori uso"};
    add("Scadenze",D.scad.map(s=>({Reparto:mN[s.mestiere_id]||"",Titolo:s.titolo||"",Tipo:s.tipo_pratica||"",Cliente:cN[s.cliente_id]||"",Mezzo:zN[s.mezzo_id]||"","Data scadenza":s.data_scadenza||"",Stato:s.stato||"",Note:s.note||""})));
    add("Mezzi",D.mezzi.map(m=>({Reparto:mN[m.mestiere_id]||"",Nome:m.nome||"",Categoria:zCat[m.categoria]||m.categoria||"","Targa / matricola":m.targa||"",Stato:zStato[m.stato]||m.stato||"",Note:m.note||""})));
    add("Mezzi per lavoro",D.lavMezzi.map(x=>({Lavoro:lN[x.lavoro_id]||"",Mezzo:zN[x.mezzo_id]||""})));
    if(D.az)add("Dati azienda",[{Nome:D.az.nome||"","P.IVA":D.az.piva||"","Codice fiscale":D.az.cod_fiscale||"",Indirizzo:azIndirizzo(D.az),Telefono:D.az.tel||"",Email:D.az.email||"",IBAN:D.az.iban||"","Regime fiscale":D.az.regime_fiscale||"","Codice destinatario":D.az.sdi_codice||"",PEC:D.az.sdi_pec||"","Patente a crediti":D.az.pat_crediti!=null?String(D.az.pat_crediti):""}]);
    XLSX.writeFile(wb,"gestionale-trovaimpresa-"+todayStr()+".xlsx");
    toast("Dati esportati in Excel ✅");
  }
  async function esportaJson(){
    const D=await _fetchAllExport();if(!D)return;
    /* 9 agosto 2026 — mancavano fatture, righe fattura, collegamenti
       fattura-lavoro, ore, crediti formativi, fornitori e fatture fornitori.
       Un file che si chiama "backup" e non contiene le fatture non è un backup. */
    const out={esportato_il:new Date().toISOString(),formato:"trovaimpresa-gestionale-v2",
      azienda:D.az,mestieri:D.mest,clienti:D.cli,operatori:D.ops,lavori:D.lav,spese:D.spese,
      preventivi:D.prev,preventivo_righe:D.righe,scadenze:D.scad,mezzi:D.mezzi,lavoro_mezzi:D.lavMezzi,
      fatture:D.fatt,fattura_righe:D.fattRig,fattura_lavori:D.fattLav,
      ore:D.ore,crediti:D.cred,fornitori:D.forn,fatture_fornitori:D.fattForn,
      computi:D.comp,computo_capitoli:D.compCap,computo_voci:D.compVoci,computo_misure:D.compMis,
      prezzario:D.prezzi,carte:D.carte,carte_movimenti:D.carteMov,rifornimenti:D.rifor,
      note_calendario:D.note,
      /* elenco dei file, non i file: quelli stanno nello storage */
      foto:D.foto,video:D.video};
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:"application/json"}));
    a.download="backup-gestionale-trovaimpresa-"+todayStr()+".json";a.click();URL.revokeObjectURL(a.href);
    toast("Backup JSON scaricato ✅");
  }

  /* click handler dei nuovi strumenti (separato: non tocca quello esistente) */
  /* ============================================================
     LA RICERCA UNICA — 19 agosto 2026

     Il gestionale aveva una ricerca per sezione: quella dei lavori
     cercava solo nei lavori, quella dei clienti solo nei clienti. Per
     sapere tutto di «Verdi» bisognava aprire quattro sezioni e scrivere
     quattro volte la stessa parola. Qui si scrive una volta sola.

     ⚠️ CERCANDO UN CLIENTE DEVONO USCIRE ANCHE LE SUE COSE. Un lavoro
        di Verdi dentro non ha scritto «Verdi» da nessuna parte: ha solo
        il suo cliente_id. Per questo i clienti si cercano per primi, e
        i loro id fanno da secondo setaccio su lavori, preventivi e
        fatture. Senza questo passaggio la ricerca sembrerebbe funzionare
        (il cliente esce) ma darebbe zero lavori a chi ne ha venti.
     ⚠️ SI CERCA DENTRO IL REPARTO in cui si sta (mestiere_id), come fa
        ogni altra lettura del gestionale: se no da «Idraulica» uscirebbero
        i clienti di «Giardinaggio».
     ⚠️ LE RIGHE NEL CESTINO NON ESCONO: ci pensa js/cestino.js, che si
        mette in mezzo a ogni sb.from(). Qui non si fa niente di speciale
        proprio per non avere la regola in due posti.
     ⚠️ I DATI SI LEGGONO QUANDO SI ENTRA NELLA CASELLA, non a ogni
        lettera: se no ogni tasto sarebbero quattro interrogazioni al
        database. Si rileggono ogni volta che ci si rientra, cosi' una
        fattura appena creata c'e' gia'.
     ⚠️ PREVENTIVI E FATTURE NON SI APRONO DALLA CACHE della loro
        sezione: se non ci sei mai entrato quella cache e' vuota e il
        clic non farebbe niente, in silenzio. Si rileggono dal database
        riga per riga.
     ============================================================ */
  const CT_TETTO=2000;   /* righe per tabella al massimo */
  const CT_QUANTE=6;     /* quante se ne mostrano per gruppo */
  let ctDati=null, ctTimer=null, ctCaricando=false, ctTroncato=false, ctMancanti=[];

  const CT_CAMPI={
    clienti:["nome","referente","telefono","email","citta","indirizzo","piva","cf","note"],
    lavori:["descrizione","dove","note","lavoro_svolto","pratica_tipo","pratica_protocollo"],
    preventivi:["titolo","numero","oggetto","note"],
    fatture:["numero","oggetto","cli_nome","note"]
  };
  const CT_ST_PREV={bozza:"Bozza",inviato:"Inviato",accettato:"Accettato",rifiutato:"Rifiutato"};
  const CT_ST_FATT={bozza:"Bozza",emessa:"Emessa",pagata:"Pagata",insoluta:"Insoluta",annullata:"Annullata"};

  function ctPiatto(t){
    return String(t==null?"":t).toLowerCase()
      .replace(/[àáâä]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i")
      .replace(/[òóôö]/g,"o").replace(/[ùúûü]/g,"u");
  }
  /* si mettono insieme solo i campi che la riga ha davvero: pratica_tipo
     esiste per gli studi tecnici e non per l'impresa edile, e chiedere un
     campo che non c'e' non deve far saltare niente */
  function ctTesto(riga,campi){
    let s="";
    for(let i=0;i<campi.length;i++){
      const v=riga[campi[i]];
      if(v!=null&&v!=="")s+=" "+v;
    }
    return ctPiatto(s);
  }
  async function ctCarica(){
    if(!sb||!sbUid)return "Non risulti collegato.";
    const mid=curMestiere();
    if(mid==null)return "Entra prima in un reparto.";
    const leggi=t=>sb.from(t).select("*").eq("user_id",sbUid).eq("mestiere_id",mid).limit(CT_TETTO);
    const [rc,rl,rp,rf]=await Promise.all([
      leggi("gest_clienti"),leggi("gest_lavori"),leggi("gest_preventivi"),leggi("gest_fatture")
    ]);
    /* ⚠️ UNA TABELLA CHE NON SI APRE NON DEVE SPEGNERE TUTTA LA RICERCA.
       Un collaboratore puo' avere il permesso sui lavori e non sulle fatture:
       col controllo unico («se c'e' un errore, mi fermo») a lui la ricerca non
       avrebbe funzionato mai, nemmeno sui clienti. Adesso esce quello che si
       riesce a leggere, e quello che manca SI DICE. */
    ctMancanti=[];
    const prendi=(r,come)=>{ if(r.error){ctMancanti.push(come);return [];} return r.data||[]; };
    ctDati={
      clienti:prendi(rc,"clienti"), lavori:prendi(rl,"lavori"),
      preventivi:prendi(rp,"preventivi"), fatture:prendi(rf,"fatture")
    };
    ctTroncato=[rc,rl,rp,rf].some(r=>(r.data||[]).length>=CT_TETTO);
    if(ctMancanti.length===4)return "Non riesco a leggere i dati: "+(rc.error||rl.error||rp.error||rf.error).message;
    return null;
  }
  /* ⚠️ 19 agosto 2026 — PERCHE' IL CLIENTE SI ATTACCA ALLA RIGA, e non si
     fa «o il cliente o il testo».
     Il primo tentativo diceva: esce se la riga contiene le parole OPPURE se
     e' di un cliente trovato. Con una parola sola sembrava giusto. Con due
     no: scrivendo «verdi bagno» uscivano TUTTI i lavori di Verdi — la
     tinteggiatura delle scale compresa — perche' bastava che il cliente
     fosse quello, e «bagno» non lo guardava piu' nessuno.
     Adesso il nome (e i dati) del cliente si ATTACCANO al testo della riga,
     e poi si chiede che ci siano TUTTE le parole. «Verdi» da solo tira
     fuori tutto di Verdi; «verdi bagno» solo il bagno di Verdi. */
  function ctTrova(q){
    if(!ctDati)return null;
    const parole=ctPiatto(q).split(/\s+/).filter(Boolean);
    if(!parole.length)return null;
    const dentro=testo=>parole.every(w=>testo.indexOf(w)>=0);
    const nomeCli={}, testoCli={};
    ctDati.clienti.forEach(c=>{
      nomeCli[String(c.id)]=c.nome||"";
      testoCli[String(c.id)]=ctTesto(c,CT_CAMPI.clienti);
    });
    /* la riga senza cliente non deve pescare il testo di nessuno: con
       cliente_id nullo si cerca solo dentro la riga */
    const suo=r=>(r.cliente_id!=null&&testoCli[String(r.cliente_id)])?(" "+testoCli[String(r.cliente_id)]):"";
    return {
      clienti:ctDati.clienti.filter(c=>dentro(ctTesto(c,CT_CAMPI.clienti))),
      lavori:ctDati.lavori.filter(l=>dentro(ctTesto(l,CT_CAMPI.lavori)+suo(l))),
      preventivi:ctDati.preventivi.filter(p=>dentro(ctTesto(p,CT_CAMPI.preventivi)+suo(p))),
      fatture:ctDati.fatture.filter(f=>dentro(ctTesto(f,CT_CAMPI.fatture)+suo(f))),
      nomeCli:nomeCli
    };
  }
  function ctMeta(){
    const v=[];
    for(let i=0;i<arguments.length;i++){ const x=arguments[i]; if(x)v.push('<span>'+esc(x)+'</span>'); }
    return v.join("");
  }
  /* ⚠️ CLIENTE E LAVORO NON LI APRE QUESTA RICERCA: la riga porta con se'
     lo stesso data-action dei pulsanti che ci sono gia' («apri-cli»,
     «edit-job»), e li apre il gestore di sempre. Riscrivere qui come si
     apre un lavoro vorrebbe dire avere la stessa cosa in due posti, e il
     giorno che cambia una la si aggiorna in uno solo.
     Preventivo e fattura no: i loro pulsanti pescano dalla lista gia' a
     schermo, che e' vuota se in quella sezione non ci sei mai entrato. */
  function ctRiga(tipo,id,titolo,sotto){
    const AZ={cli:"apri-cli",lav:"edit-job"};
    return '<button type="button" class="ct-riga" data-ct="'+esc(tipo)+'" data-id="'+esc(String(id))+'"'
      +(AZ[tipo]?' data-action="'+AZ[tipo]+'"':'')+'>'
      +'<span class="ct-t">'+esc(titolo)+'</span>'
      +(sotto?'<span class="ct-s">'+sotto+'</span>':'')+'</button>';
  }
  function ctBlocco(titolo,righe){
    if(!righe.length)return "";
    const piu=(righe.length>CT_QUANTE)
      ? '<div class="ct-piu">Ce ne sono '+righe.length+': scrivi una parola in più per restringere.</div>' : "";
    return '<div class="ct-gruppo"><div class="ct-cap">'+esc(titolo)+' <b>'+righe.length+'</b></div>'
      +righe.slice(0,CT_QUANTE).join("")+piu+'</div>';
  }
  function ctDisegna(q){
    const box=$("#ct-pop"); if(!box)return;
    const r=ctTrova(q);
    if(!r){box.innerHTML="";return;}
    const pro=(ruoloUtente==='professionista');
    const nome=id=>(id!=null&&r.nomeCli[String(id)])?r.nomeCli[String(id)]:"";
    let h="";
    h+=ctBlocco("Clienti", r.clienti.map(c=>
        ctRiga("cli",c.id,c.nome||"(cliente senza nome)",ctMeta(c.citta||"",c.telefono||""))));
    h+=ctBlocco(_lav(), r.lavori.map(l=>
        ctRiga("lav",l.id,l.descrizione||(pro?"Pratica":"Lavoro"),
          ctMeta(nome(l.cliente_id),l.dove||"",l.data_prevista?fdate(l.data_prevista):"",statoLabel[l.stato]||""))));
    h+=ctBlocco("Preventivi", r.preventivi.map(p=>
        ctRiga("prev",p.id,p.titolo||"Preventivo",
          ctMeta(nome(p.cliente_id),CT_ST_PREV[p.stato]||p.stato||""))));
    /* «Fattura bozza senza numero» si leggeva male: una bozza si chiama
       «Bozza di fattura», come nel titolo del suo modulo */
    h+=ctBlocco("Fatture", r.fatture.map(f=>
        ctRiga("fatt",f.id,(f.numero?("Fattura "+fattNum(f)):"Bozza di fattura"),
          ctMeta(nome(f.cliente_id),CT_ST_FATT[f.stato]||f.stato||""))));
    if(!h)h='<div class="ct-vuoto">Nessun risultato per «'+esc(q)+'».</div>';
    /* niente tagli silenziosi: se il conto e' arrivato al tetto, si dice */
    if(ctTroncato)h+='<div class="ct-piu">Hai più di '+CT_TETTO+' righe in una sezione: cerco dentro le prime '+CT_TETTO+'.</div>';
    /* e se una sezione non si è aperta, si dice pure: se no la ricerca
       direbbe «non c'è niente» di una cosa che non ha nemmeno guardato */
    if(ctMancanti.length)h+='<div class="ct-piu">Non riesco a leggere: '+esc(ctMancanti.join(", "))+'. Quello che c\'è lì dentro non esce.</div>';
    box.innerHTML=h;
  }
  /* ============================================================
     ⛔ 29 agosto 2026 — APRIRE UNA COSA DA FUORI (gradino 2 della chat)
     ============================================================
     La Chat con AI, quando nomina un lavoro o una fattura, mette sotto un
     pulsante «Aprilo». Ma la chat sta fuori da questa closure e da li'
     dentro non si vede niente.
     ⛔ E NON SI RISCRIVE COME SI APRE UNA COSA. E' la stessa regola gia'
     scritta venti righe piu' su per la ricerca in alto: cliente e lavoro
     si aprono col loro `data-action` di sempre («apri-cli», «edit-job»),
     preventivo e fattura con le due funzioni che la ricerca usa gia'.
     Riscrivere qui come si apre un lavoro vorrebbe dire avere la stessa
     cosa in tre posti.
     ⚠️ Il pulsante finto si attacca al body prima di premerlo: un
     elemento staccato non fa arrivare il clic al gestore che sta sul
     document, e non succederebbe niente.
     ⚠️ L'id arriva dalla chat, cioe' da una lettura gia' filtrata per
     utente e reparto — e ctApriPrev/ctApriFatt lo rileggono comunque con
     `.eq("user_id", sbUid)`. Due serrature, come sempre. */
  window.apriCosa=function(tipo,id){
    try{
      if(!id)return false;
      if(tipo==="prev"){ ctApriPrev(id); return true; }
      if(tipo==="fatt"){ ctApriFatt(id); return true; }
      const AZ={cli:"apri-cli",lav:"edit-job"};
      const a=AZ[tipo]; if(!a)return false;
      const b=document.createElement("button");
      b.type="button"; b.setAttribute("data-action",a); b.setAttribute("data-id",String(id));
      b.style.display="none";
      document.body.appendChild(b);
      b.click();
      b.remove();
      return true;
    }catch(_){ return false; }
  };
  function ctApri(){ const b=$("#ct-pop"); if(b)b.classList.add("aperta"); }
  function ctChiudi(){ const b=$("#ct-pop"); if(b){b.classList.remove("aperta");b.innerHTML="";} }
  function ctAzzera(){ const i=$("#ct-q"); if(i)i.value=""; ctChiudi(); }
  async function ctApriPrev(id){
    ctChiudi();
    const {data,error}=await sb.from("gest_preventivi").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(error){toast("Non riesco ad aprire il preventivo: "+error.message);return;}
    if(!data){toast("Questo preventivo non c'è più: forse è nel Cestino, o l'ha eliminato qualcun altro");return;}
    prevForm(data);
  }
  async function ctApriFatt(id){
    ctChiudi();
    const {data,error}=await sb.from("gest_fatture").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(error){toast("Non riesco ad aprire la fattura: "+error.message);return;}
    if(!data){toast("Questa fattura non c'è più: forse è nel Cestino, o l'ha eliminata qualcun altro");return;}
    fattForm(data);
  }
  async function ctRicarica(){
    if(ctCaricando)return null;
    ctCaricando=true;
    const err=await ctCarica();
    ctCaricando=false;
    if(err)ctDati=null;
    return err;
  }
  function ctMostraErrore(msg){
    const b=$("#ct-pop"); if(!b)return;
    b.innerHTML='<div class="ct-vuoto">'+esc(msg)+'</div>';
    ctApri();
  }
  function ctInit(){
    const inp=$("#ct-q"); if(!inp)return;
    /* entrando nella casella i dati si rileggono: una fattura fatta due
       minuti fa deve uscire, se no la ricerca dice il falso */
    inp.addEventListener("focus",async function(){
      const err=await ctRicarica();
      const v=inp.value.trim();
      if(err){ if(v.length>=2)ctMostraErrore(err); return; }
      if(v.length>=2){ ctDisegna(v); ctApri(); }
    });
    inp.addEventListener("input",function(){
      clearTimeout(ctTimer);
      const v=inp.value.trim();
      if(v.length<2){ ctChiudi(); return; }
      ctTimer=setTimeout(async function(){
        if(!ctDati){ const err=await ctRicarica(); if(err){ctMostraErrore(err);return;} }
        const q=inp.value.trim();
        if(q.length<2){ ctChiudi(); return; }
        ctDisegna(q); ctApri();
      },220);
    });
    inp.addEventListener("keydown",function(e){
      if(e.key==="Escape"){ ctAzzera(); inp.blur(); }
    });
    const x=$("#ct-x"); if(x)x.addEventListener("click",function(){ ctAzzera(); inp.focus(); });
    /* fuori dalla casella si chiude; dentro no, se no il clic sul risultato
       lo chiuderebbe prima di arrivarci */
    document.addEventListener("click",function(e){
      if(!e.target.closest("#ct-barra"))ctChiudi();
    });
    document.addEventListener("click",function(e){
      const r=e.target.closest(".ct-riga"); if(!r)return;
      const tipo=r.dataset.ct, id=r.dataset.id;
      if(tipo==="prev"){ ctApriPrev(id); return; }
      if(tipo==="fatt"){ ctApriFatt(id); return; }
      /* cliente e lavoro: li apre il data-action che la riga porta con se',
         qui si chiude soltanto la tendina */
      ctChiudi();
    });
  }
  ctInit();

  /* ⛔ 21 agosto 2026 — SE UN PEZZO NON ARRIVA, IL GESTIONALE LO DICE.
     Da quando le sezioni pesanti stanno in quattro file esterni
     (js/gest-fatture.js · js/gest-computo.js · js/gest-sal-prezzario.js ·
     js/gest-computo-pdf.js, caricati alle righe 502-505), questa tabella era
     l'UNICO punto del blocco che li nominava subito, appena letta la pagina.
     Se uno dei quattro non arrivava — rete di cantiere, un 503 di Netlify —
     la riga lanciava ReferenceError e da li' in giu' NON veniva eseguito piu'
     niente: la pagina iniziale si disegnava lo stesso (load e' altrove) e poi
     nessuna scheda si apriva piu'. Nessun messaggio, nessun errore visibile.
     Provato davvero, con un 503 finto su js/gest-computo.js.
     ⚠️ Adesso il nome si cerca a runtime: se manca, la pagina lo dice in cima
     e quella singola scheda spiega cosa fare, invece di restare muta.
     ⚠️ Chi sposta una funzione di sezione in un altro file non deve fare
     niente qui: basta che resti una funzione di primo livello. */
  var _pezziMancanti=[];
  function _rt(nome){
    var f=window[nome];
    if(typeof f==="function")return f;
    _pezziMancanti.push(nome);
    return function(){
      if(typeof toast==="function")
        toast("⚠️ Questa parte non si è caricata. Ricarica la pagina (F5).");
    };
  }
  const RENDER_TAB={
    riepilogo:_rt("renderRiepilogo"), lavori:_rt("renderJobs"), preventivi:_rt("renderPreventivi"), computi:_rt("renderComputi"),
    prezzario:_rt("renderPrezzario"), sal:_rt("renderSalTutti"),
    fatture:_rt("renderFatture"), calendario:_rt("renderCal"), agenda:_rt("renderAgenda"),
    mezzi:_rt("renderMezzi"), attrezzature:_rt("renderAttrezzature"), squadra:_rt("renderDip"),
    carte:_rt("renderCarte"), clienti:_rt("renderClienti"), scadenzario:_rt("renderScadenze"), crediti:_rt("renderCrediti"), cestino:_rt("renderCestino"),
    report:_rt("renderReport"), galleria:_rt("renderGalleria"), mappa:_rt("renderMappa"),
    richieste:_rt("renderRichieste"), dalsito:_rt("renderDalSito"), fornitori:_rt("renderFornitori"),
    assistenza:_rt("renderAssistenza"),
    promemoria:_rt("renderPromemoria"), fisco:_rt("renderFisco")
  };
  /* l'avviso in cima: si vede subito, senza aspettare che clicchi la scheda
     rotta. Scritto con il DOM nudo apposta — se manca un pezzo non e' il
     momento di dipendere da altre funzioni del gestionale. */
  if(_pezziMancanti.length){
    try{
      var _av=document.createElement("div");
      _av.setAttribute("role","alert");
      _av.style.cssText="position:fixed;left:0;right:0;top:0;z-index:99999;background:#8a1c1c;color:#fff;"
        +"font:600 15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:12px 16px;text-align:center";
      _av.textContent="Una parte del gestionale non si è caricata. Ricarica la pagina (F5). "
        +"Se il problema resta, controlla la connessione.";
      document.body.appendChild(_av);
      console.error("[gestionale] pezzi non caricati:",_pezziMancanti.join(", "));
    }catch(e){}
  }
  /* ============================================================
     INVIO E BARRA SPAZIATRICE — 6 settembre 2026
     ============================================================
     Tutto il gestionale si comanda con data-action e un ascoltatore del
     CLIC. Un <button> o un <a> risponde al tasto Invio da solo, perche' il
     browser gli manda un clic finto: un <div> no, mai. Percio' una scheda
     scritta come <div data-action=...> si puo' guardare ma non aprire.
     Questo ascoltatore fa la stessa cosa che fa il browser coi bottoni:
     su Invio o barra spaziatrice manda un clic vero all'elemento.
     ⚠️ Salta i comandi VERI (button, a, input, select, textarea): li' ci
     pensa gia' il browser, e chiamare click() li' vorrebbe dire farlo due
     volte. E salta chi non e' raggiungibile da tastiera, che senza
     tabindex non prende mai il fuoco: percio' accendere una scheda vuol
     dire aggiungerle tabindex="0" e role="button", come per .panel-card.
     ⛔ preventDefault sulla barra spaziatrice: se no la pagina scorre
     mentre apri, e sembra che sia successo altro. */
  document.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.key!==" "&&e.key!=="Spacebar")return;
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    const t=e.target&&e.target.closest?e.target.closest("[data-action]"):null;
    if(!t)return;
    if(/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(t.tagName))return;
    e.preventDefault();
    t.click();
  });

  document.addEventListener("click",e=>{
    const t=e.target.closest("[data-action]");if(!t)return;
    const a=t.dataset.action,id=t.dataset.id;
    /* i pulsanti in fondo alla finestra: prima si chiude, poi si fa.
       Se no si cambia lo stato e si resta davanti al modulo vecchio. */
    if(t.dataset.chiudi){ const _ov=$("#overlay"); if(_ov)_ov.classList.remove("open"); }
    /* «Apri» su una scheda: le altre azioni di quella scheda aspettano qui,
       e se le prende la finestra appena si apre (vedi openSheetGrande). */
    if(AZ_APERTURA.test(String(a))) _azPendenti=AZ_APRI[String(a)+":"+String(id==null?"":id)]||null;
    if(a==="spesa-add")return spesaAdd();
    /* "Mostra tutti": svuota la casella di ricerca della sezione in cui si sta */
    if(a==="cerca-azzera"){
      const sez=t.closest("section");
      const campi=sez?sez.querySelectorAll(".lav-search"):[];
      let fatto=false;
      campi.forEach(function(el){ if(el.value){ el.value=""; el.dispatchEvent(new Event("input",{bubbles:true})); fatto=true; } });
      if(!fatto&&sez){ /* la ricerca poteva stare nella barra in alto */
        const g=$("#f-search"); if(g&&g.value){ g.value=""; g.dispatchEvent(new Event("input",{bubbles:true})); }
      }
      return;
    }
    if(a==="ptl-conferma")return prevToLavoroConferma(id,+t.dataset.tot||0);
    if(a==="cest-vista"){cestVista=t.dataset.v||"reparto";renderCestino();return;}
    if(a==="cest-ripristina")return cestRipristina(id);
    if(a==="cest-definitivo")return cestDefinitivo(id);
    if(a==="new-cred")return credForm(null);
    if(a==="edit-cred")return credForm(credCache.find(c=>String(c.id)===String(id)));
    if(a==="save-cred")return saveCred(id);
    if(a==="cred-anno"){credAnno=t.dataset.v;renderCrediti();return;}
    if(a==="del-cred")return delCred(id);
    if(a==="verbale")return verbaleForm(id);
    if(a==="verbale-pdf")return verbalePdf(id);
    if(a==="ore-add")return oreAdd();
    if(a==="ore-del"){if(gconfirm("Eliminare questa riga di ore?"))return oreDel(id);return;}
    if(a==="rap-del")return rapCestina(id);   /* la domanda la fa lui: gli serve il numero delle ore */
    if(a==="asst-invia")return asstInvia();
    if(a==="asst-allega")return asstScegliFile();
    if(a==="asst-togli-file")return asstTogliFile();
    if(a==="spesa-del"){if(confirm("Eliminare questa spesa?"))sb.from("gest_spese").delete().eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non eliminata: "+(res.error?res.error.message:"nessuna riga trovata. Riprova."));return;}renderSpeseBlock(speseLavoroId);});return;}
    if(a==="scegli-tipo")return _salvaTipo(id);   /* 14 agosto: chi non ha mai detto che lavoro fa */
    if(a==="landing-riprova")return renderLanding();
    if(a==="new-computo")return computoForm(null);
    if(a==="edit-computo")return computoForm(compCache.find(c=>String(c.id)===String(id)));
    if(a==="save-computo")return saveComputo(id);
    if(a==="comp-dup")return compDuplica(id);
    if(a==="comp-variante")return compDuplica(id,true);
    if(a==="del-computo")return delComputo(id);
    if(a==="comp-pdf")return computoPdf(id);
    if(a==="comp-gara")return computoListaGara(id);
    if(a==="comp-analisi")return analisiPdf(id);
    if(a==="co-pag")return compPag(+t.dataset.p);
    if(a==="crono-salva")return cronoSalva();
    /* i due pulsanti stanno DENTRO la scheda del computo aperto: l'id e'
       quello, non serve leggerlo dal pulsante */
    if(a==="crono-pdf")return cronoPdf(ctrComputoId);
    if(a==="var-pdf")return variantePdf(ctrComputoId);
    if(a==="comp-importa")return compApriFile();
    if(a==="cp-metti")return compPdfMetti();
    if(a==="cp-tutte"){$$("#cp-lista .cp-ck").forEach(x=>{x.checked=true;});return;}
    if(a==="cp-nessuna"){$$("#cp-lista .cp-ck").forEach(x=>{x.checked=false;});return;}
    if(a==="comp-prezzi")return compPrezziDaPrezzario();
    if(a==="comp-prz-chiudi"){compPrzEsito="";compPrzEsitoId=null;return renderCompVoci(compVociCompId);}
    if(a==="pp-usa")return ppUsa(id);
    if(a==="pp-del")return ppDel(id);
    if(a==="pp-salva")return ppSalva();
    if(a==="pp-tutte"){ppFonteScelta="";return ppCerca();}
    if(a==="pp-solo"){const b=$("#pp-fonte-box");ppFonteScelta=(b&&b.dataset.sua)||"";return ppCerca();}
    if(a==="comp-prev")return computoAPreventivo(id);
    if(a==="sal-nuovo")return salForm(null);
    if(a==="sal-el-apri")return salApriDaElenco(id);
    if(a==="sal-torna")return salTorna();
    if(a==="sal-filtro"){salFiltro=t.dataset.v||"tutti";renderSalTutti();return;}
    if(a==="sal-comp-apri")return salApriComputo(id);
    if(a==="sal-vai-computi"){const b=document.querySelector('nav.tabs button[data-tab="computi"]');if(b){b.click();window.scrollTo(0,0);}return;}
    if(a==="sal-apri")return salForm(id);
    if(a==="sal-salva")return salSalva(id);
    if(a==="sal-pdf")return salPdf(id);
    if(a==="sal-fattura")return salAFattura(id);
    if(a==="sal-fatt-intero")return salFatturaCon("intero");
    if(a==="sal-fatt-netto")return salFatturaCon("netto");
    if(a==="sal-del")return salElimina(id);
    if(a==="new-prezzo")return prezzoForm(null);
    if(a==="edit-prezzo")return prezzoForm(id);
    if(a==="save-prezzo")return savePrezzo(id);
    if(a==="del-prezzo")return delPrezzo(id);
    if(a==="pz-importa")return pzApriFile();
    if(a==="pz-vai")return pzEsegui();
    if(a==="pz-annulla")return pzAnnullaImport();
    if(a==="comp-filtro"){compFiltro=t.dataset.v;renderComputi();return;}
    if(a==="comp-cap-apri"){compCapNuovo=true;compCapEdit=null;renderCompVoci(compVociCompId);return;}
    if(a==="comp-cap-annulla"){compCapNuovo=false;renderCompVoci(compVociCompId);return;}
    if(a==="comp-cap-edit"){compCapEdit=id;compCapNuovo=false;renderCompVoci(compVociCompId);return;}
    if(a==="comp-cap-edit-annulla"){compCapEdit=null;renderCompVoci(compVociCompId);return;}
    if(a==="comp-cap-rinomina")return compCapRinomina(id);
    if(a==="comp-cap-salva")return compCapSalva();
    if(a==="comp-cap-del")return compCapDel(id);
    if(a==="comp-voce-new")return compVoceForm(null);
    if(a==="comp-voce")return compVoceForm(id);
    if(a==="comp-voce-del")return compVoceDel(id);
    if(a==="comp-voce-su")return compVoceSposta(id,-1);
    if(a==="comp-voce-giu")return compVoceSposta(id,1);
    if(a==="comp-voce-salva")return compVoceSalva(id);
    if(a==="comp-torna")return compTornaAlComputo();
    if(a==="an-add")return anAdd(id);
    if(a==="an-edit")return anEdit(id);
    if(a==="an-del")return anDel(id);
    if(a==="an-annulla")return anAnnulla();
    if(a==="comp-mis-add")return compMisAdd(id);
    if(a==="comp-mis-edit")return compMisEdit(id);
    if(a==="comp-mis-annulla")return compMisAnnulla();
    if(a==="comp-mis-del")return compMisDel(id);
    if(a==="new-prev")return prevForm(null);
    /* «✨ Genera con AI»: stesso modulo, con la riga dell'AI gia' aperta */
    if(a==="new-prev-ai")return prevForm(null,null,true);
    /* «Controlla prima di mandarlo»: vale per qualunque sezione, il tipo
       di documento se lo porta scritto addosso il pulsante */
    if(a==="ctr-guarda"){ctrGuardaTutto(t.dataset.ctr||"preventivo");return;}
    /* la rilettura dell'AI: costa un credito, quindi parte solo da qui */
    if(a==="ctr-ai"){ctrAiGuarda(t.dataset.ctr||"preventivo");return;}
    if(a==="ds-filtro"){dsFilter=t.dataset.v||"da_fare";renderDalSito();return;}
    if(a==="ds-apri")return dsApri(id);
    if(a==="ds-contatti")return dsContatti(id);
    if(a==="ds-prev")return dsCreaPreventivo(id);
    if(a==="ds-chiudi")return dsChiudi(id,false);
    if(a==="ds-riapri")return dsChiudi(id,true);
    if(a==="edit-prev")return prevForm(prevCache.find(p=>p.id===id));
    /* dal Riepilogo: prevCache può essere ancora vuota (scheda Preventivi mai aperta),
       quindi il preventivo si prende dalla lista già caricata per il blocco. */
    if(a==="rie-prev"){const p=rieprevCache.find(x=>String(x.id)===String(id));if(p)prevForm(p);return;}
    if(a==="save-prev")return savePrev(id||null);
    if(a==="prev-nota-add"){const b=$("#pv-note-lista");if(b){b.insertAdjacentHTML("beforeend",prevNotaRigaHtml(""));const ult=b.querySelector("[data-nota]:last-child .nt-txt");if(ult)ult.focus();}return;}
    if(a==="prev-nota-del"){const d=t.closest("[data-nota]");if(d){const b=$("#pv-note-lista");d.remove();
      /* se le togli tutte resta una riga vuota: se no non hai piu' dove scrivere */
      if(b&&!b.querySelector("[data-nota]"))b.insertAdjacentHTML("beforeend",prevNotaRigaHtml(""));}
      return;}
    if(a==="ore-parcella")return orePortaInParcella();
    if(a==="pv-cli-nuovo"){
      const box=$("#pv-cli-nuovo"), apri=$("#pv-cli-apri");
      if(box){box.style.display="";const n=$("#pv-cli-nome");if(n){n.value="";n.focus();}}
      if(apri)apri.style.display="none";
      return;
    }
    if(a==="pv-cli-annulla"){
      const box=$("#pv-cli-nuovo"), apri=$("#pv-cli-apri");
      if(box)box.style.display="none";
      if(apri)apri.style.display="";
      return;
    }
    if(a==="pv-cli-salva")return pvCliSalva();
    if(a==="dp-apri"){
      const box=$("#dp-box"), apri=$("#dp-apri");
      if(box){box.style.display="";const c=$("#dp-cat");if(c)c.focus();}
      if(apri)apri.style.display="none";
      return;
    }
    if(a==="dp-chiudi"){
      const box=$("#dp-box"), apri=$("#dp-apri");
      if(box)box.style.display="none";
      if(apri)apri.style.display="";
      return;
    }
    if(a==="dp-metti")return dpMetti();
    if(a==="prev-riga-add"){$("#prev-righe").insertAdjacentHTML("beforeend",prevRigaHtml());return;}
    /* un capitolo si può aggiungere anche a mano, non solo arrivando da un
       computo: chi scrive il preventivo a mano ha lo stesso bisogno di
       dividere «Demolizioni» da «Opere murarie». */
    if(a==="prev-cap-add"){$("#prev-righe").insertAdjacentHTML("beforeend",prevRigaHtml({sezione:true}));return;}
    if(a==="qe-riga-add"){$("#co-qe-righe").insertAdjacentHTML("beforeend",qeRigaHtml());qeAggiorna();return;}
    if(a==="qe-riga-del"){const d=t.closest("[data-qe]");if(d){d.remove();qeAggiorna();}return;}
    if(a==="prev-riga-del"){const d=t.closest("[data-riga]");if(d){d.remove();prevTotaleLive();
      /* anche i riepiloghi sotto: prima restavano col numero vecchio e sullo
         schermo comparivano due totali diversi */
      aggiornaRiepilogoParcella();aggiornaRiepilogoIvaImpresa();}return;}
    if(a==="prev-filtro"){prevFilter=t.dataset.v;renderPreventivi();return;}
    if(a==="prev-stato"){sb.from("gest_preventivi").update({stato:t.dataset.v}).eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non salvato: "+(res.error?res.error.message:"nessuna riga modificata. Riprova."));return;}rinfresca("preventivi","riepilogo");toast("Preventivo aggiornato ✔");});return;}
    if(a==="prev-to-lavoro")return prevToLavoro(id);
    if(a==="prev-to-fatt")return fattDaPreventivoId(id);
    if(a==="del-prev"){if(gconfirm("Eliminare questo preventivo?"))sb.from("gest_preventivi").delete().eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non eliminato: "+(res.error?res.error.message:"nessuna riga trovata. Riprova."));return;}rinfresca("preventivi","riepilogo");toast("Preventivo eliminato");});return;}
    if(a==="prev-pdf")return prevPdf(id);
    if(a==="prev-incarico")return incaricoForm(id);
    if(a==="incarico-pdf")return incaricoPdf(id);
    if(a==="prev-ordine")return ordineForm(id);
    if(a==="ordine-pdf")return ordinePdf(id);
    if(a==="report-csv")return reportCsv();
    if(a==="lav-vista"){filter.vista=t.dataset.v;renderJobs();return;}
    /* un solo menu "..." per tutte le sezioni: le voci le ha già preparate
       renderTabella, qui si legge solo il registro. */
    if(a==="tab-menu"){
      /* il menu vive in una cella <td> nella tabella, in .job-menu nelle schede */
      const cella=t.closest("td")||t.closest(".job-menu")||t.parentElement;
      const aperto=cella&&cella.querySelector(".lav-pop");
      tabChiudiPop();
      if(aperto)return;                                   /* secondo clic: chiude */
      const voci=(TAB_MENU[t.dataset.tab]||{})[String(id)];
      if(voci&&voci.length&&cella)cella.insertAdjacentHTML("beforeend",tabPop(voci));
      return;
    }
    /* stesso menu, ma per le schede che si preparano le voci da sole
       (Preventivi, Fatture, Clienti, Squadra, Mezzi, Scadenzario...) */
    if(a==="scheda-menu"){
      const cella=t.closest(".job-menu")||t.parentElement;
      const aperto=cella&&cella.querySelector(".lav-pop");
      tabChiudiPop();
      if(aperto)return;
      const voci=SCHEDA_MENU[t.dataset.k];
      if(voci&&voci.length&&cella)cella.insertAdjacentHTML("beforeend",tabPop(voci));
      return;
    }
    if(a==="fatt-vista"){fattVista=t.dataset.v;renderFatture();return;}
    if(a==="burger"){const s=document.querySelector(".side");if(s)s.classList.toggle("open");return;}
    if(a==="export-excel")return esportaExcel();
    if(a==="export-json")return esportaJson();
    if(a==="vai-report"){const b=document.querySelector('nav.tabs button[data-tab="report"]');if(b)b.click();return;}
    /* click su una scheda del Riepilogo: entra nella sezione corrispondente,
       come se avessi cliccato la voce nel menu di sinistra. */
    if(a==="rie-go"){const b=document.querySelector('nav.tabs button[data-tab="'+t.dataset.go+'"]');if(b){b.click();window.scrollTo(0,0);}return;}
    if(a==="rie-riprova"){const g=$("#rie-grid");if(g)g.innerHTML='<div class="rc-caricamento">Caricamento del riepilogo…</div>';renderRiepilogo();renderContatori();return;}
    /* dal Riepilogo: la patente a crediti sta nella finestra Dati azienda,
       che non è una scheda del menu — quindi apro direttamente quella. */
    if(a==="rie-azienda")return aziendaForm();
    if(a==="rie-piu"){
      $$('#rie-alert [data-ro-piu]').forEach(function(x){x.style.display="";});
      const tt=$("#ro-piu-tasto"); if(tt)tt.remove();
      return;
    }
    /* ⛔ 19 settembre 2026 — IL TASTO CHE NON PORTAVA DA NESSUNA PARTE.
       «rie-go» qui sopra fa esattamente questo, ma si chiama come il
       Riepilogo e negli altri file nessuno lo sapeva. Cosi' il 18 settembre
       sono nati dei tasti con data-action="vai-sezione" (il resoconto del
       prezzario, il riquadro delle fatture emesse) che NON avevano nessuno
       che li ascoltava: si cliccava e non succedeva niente.
       Adesso il nome generico c'e' davvero, e vale per tutti i file.
       Si usa cosi': data-action="vai-sezione" data-go="<nome della sezione>". */
    if(a==="cest-guasto-copia"){
      const g=cestGuastoLeggi();
      if(!g){ toast("Non c’è niente da copiare"); return; }
      /* ⛔ 19 settembre 2026, provato dal vivo — navigator.clipboard NON
         basta: nel browser dentro l’app il permesso «clipboard-write»
         risulta negato e il tasto diceva solo «selezionalo a mano».
         Quindi prima si prova la strada vecchia (una casella nascosta piu'
         execCommand), che funziona dappertutto e non chiede permessi, e
         solo se fallisce si prova quella nuova. */
      let fatto=false;
      try{
        const c=document.createElement("textarea");
        c.value=g.testo;
        c.setAttribute("readonly","");
        c.style.cssText="position:fixed;top:0;left:-9999px;opacity:0";
        document.body.appendChild(c);
        c.select(); c.setSelectionRange(0,c.value.length);
        fatto=document.execCommand("copy");
        c.remove();
      }catch(e){}
      if(fatto){ toast("Elenco copiato ✔ — incollalo dove vuoi tenerlo"); return; }
      try{
        navigator.clipboard.writeText(g.testo).then(
          function(){ toast("Elenco copiato ✔ — incollalo dove vuoi tenerlo"); },
          function(){ toast("Non sono riuscito a copiarlo: selezionalo con il dito e copia"); });
      }catch(e){ toast("Non sono riuscito a copiarlo: selezionalo con il dito e copia"); }
      return;
    }
    if(a==="cest-guasto-via"){
      try{ localStorage.removeItem(CEST_GUASTO); }catch(e){}
      closeSheet();
      /* ⛔ 19 settembre 2026, provato dal vivo — renderCestino() rifa'
         tutte le domande al database e ci mette qualche secondo: premevi
         il tasto e l’avviso restava li', come se non avesse funzionato.
         Quindi prima si toglie dallo schermo, poi si rifa' il conto. */
      const _f=t.closest?t.closest(".cest-testa"):null; if(_f)_f.remove();
      renderCestino();
      toast("Avviso tolto");
      return;
    }
    if(a==="vai-sezione"){
      const dove=t.dataset.go||"";
      closeSheet();
      const b=document.querySelector('nav.tabs button[data-tab="'+dove+'"]');
      if(b){b.click();window.scrollTo(0,0);}
      return;
    }
    /* ⛔ 19 settembre 2026 — DAL PANNELLO «IL SAL NON SI E' COLLEGATO»
       ALLO STATO DI AVANZAMENTO GIUSTO.
       Non basta portare nella sezione: con dieci SAL in elenco quello da
       controllare e' ancora da cercare. Quindi si entra nella sezione e poi
       si aspetta che l'elenco si sia riempito (e' asincrono) per aprire
       proprio quello. Qualche tentativo e poi si lascia perdere, restando
       comunque nella sezione giusta: mai un'attesa infinita. */
    if(a==="fatt-vai-sal"){
      closeSheet();
      const b=document.querySelector('nav.tabs button[data-tab="sal"]');
      if(b){b.click();window.scrollTo(0,0);}
      if(id){
        let giri=0;
        (function apri(){
          giri++;
          const pronto = (typeof salTuttiCache!=="undefined") && salTuttiCache
            && salTuttiCache.some(function(x){return String(x.id)===String(id);});
          if(pronto && typeof salApriDaElenco==="function"){ salApriDaElenco(id); return; }
          if(giri<12){ setTimeout(apri,400); return; }
          /* ⛔ 19 settembre 2026, provato dal vivo — se il SAL non si trova
             (il suo computo sta in un altro reparto, o e’ finito nel
             Cestino) prima non succedeva NIENTE: restavi nell’elenco senza
             sapere perche'. E il silenzio e' proprio il difetto che stiamo
             togliendo. */
          toast("Non trovo quello stato di avanzamento in questo reparto: prova a cercarlo negli altri, o nel Cestino");
        })();
      }
      return;
    }
    /* ⛔ 18 settembre 2026 — LA RIGA DELLA FATTURA SI APRIVA SULL'ELENCO.
       Il Riepilogo la scrive per nome e numero e si porta dietro il suo id
       (gest-riepilogo.js, riga della scheda Fatture), ma qui l'id si buttava
       via: si finiva in cima alla sezione, e con trenta fatture in elenco
       quella che avevi cliccato era da ritrovare a mano. Le altre due righe
       del Riepilogo aprono davvero la loro scheda — questa no.
       ⚠️ fattCache si riempie con renderFatture, che è asincrona: si prova
          qualche volta e poi si lascia perdere, restando comunque nella
          sezione giusta. Mai un'attesa infinita. */
    if(a==="rie-go-fatture"){
      const b=document.querySelector('nav.tabs button[data-tab="fatture"]');
      if(b){b.click();window.scrollTo(0,0);}
      if(id){
        let giri=0;
        (function apri(){
          const f=(typeof fattCache!=="undefined"&&fattCache)?fattCache.find(x=>String(x.id)===String(id)):null;
          if(f){ try{ fattForm(f); }catch(e){} return; }
          if(++giri<12) setTimeout(apri,400);
        })();
      }
      return;
    }
  });
  /* al cambio desktop/mobile ridisegna liste (tabella ↔ card).
     Come sopra: su iOS vecchi esiste solo addListener. */
  try{
    const _mqLis=window.matchMedia("(min-width:881px)");
    const _mqLisCambio=()=>{if(cur){renderJobs();renderFatture();}};
    if(_mqLis.addEventListener)_mqLis.addEventListener("change",_mqLisCambio);
    else if(_mqLis.addListener)_mqLis.addListener(_mqLisCambio);
  }catch(e){}

  function openSheet(html){_azPendenti=null;const s=$("#sheet");s.className="sheet";
    /* stessa freccia della finestra grande: si esce sempre uguale */
    s.innerHTML='<div class="sh-back-riga">'+_BTN_INDIETRO+'</div>'+html;
    $("#overlay").classList.add("open");}
  /* Variante grande: SOLO i moduli lunghi (lavoro e preventivo). Intestazione e
     piede restano fermi, scorre solo il corpo — prima per salvare bisognava
     arrivare in fondo a una colonna di dieci campi.
     corpo = due <div class="sh-col"> dentro <div class="sh-cols">: sopra i 900px
     diventano due colonne, sotto tornano una sola.
     Il modulo lavoro aggiunge .sh-cols--3 e divide i due contenitori in quattro
     blocchi .sh-b-a/b/c/d: sopra i 1500px la griglia passa a tre colonne. */
  const _ICO_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  /* 16 agosto 2026 (5) — SI ESCE SEMPRE ALLO STESSO MODO.
     Prima da una finestra si usciva in tre modi diversi a seconda di dove
     eri: la × in alto a destra, «Annulla» in fondo, oppure una freccia.
     Tre gesti per la stessa cosa. Adesso in cima a sinistra c'e' una
     freccia grande, uguale in tutte le finestre, e la × non c'e' piu'. */
  const _ICO_INDIETRO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';
  const _BTN_INDIETRO='<button class="sh-back" data-action="close" title="Torna indietro" aria-label="Torna indietro">'+_ICO_INDIETRO+'<span>Indietro</span></button>';
  function openSheetGrande(titolo,corpo,azioni,azioniSue){
    /* le azioni della scheda da cui si e' arrivati: entrano dopo il primo
       pulsante (che e' sempre «Annulla»), cosi' «Salva» resta l'ultimo. */
    let _sopra="";
    /* azioni che la finestra si porta da sola (non arrivano da una scheda):
       vanno anche loro in alto, cosi' la regola e' una sola per tutti. */
    if(azioniSue&&azioniSue.length){
      _azPendenti=(_azPendenti||[]).concat(azioniSue);
    }
    if(_azPendenti&&_azPendenti.length){
      /* 16 agosto 2026 — I DOPPIONI DEL COMPUTO.
         Qualche finestra i suoi pulsanti in fondo li aveva gia' (il Computo
         ha PDF, «Crea il preventivo» ed Elimina). Aggiungendoci sopra quelli
         della scheda uscivano due «PDF» e due «Elimina» nella stessa
         finestra: uno chiude e l'altro no, e non si capisce quale premere.
         Quindi: se un'azione c'e' gia' in fondo, non la si rimette. */
      const _gia=String(azioni||"");
      const _nuove=_azPendenti.filter(x=>x&&x.action&&_gia.indexOf('data-action="'+x.action+'"')<0);
      _sopra=azioniSopra(_nuove);
      azioni=azioniElimina(_nuove)+(azioni||"");
    }
    _azPendenti=null;
    const s=$("#sheet");
    s.className="sheet sheet--grande";
    s.innerHTML=`<div class="sh-head">${_BTN_INDIETRO}<h3>${titolo}</h3>${_sopra}</div>
      <div class="sh-body">${corpo}</div>
      <div class="sh-foot">${azioni}</div>`;
    $("#overlay").classList.add("open");
    /* Il corpo scorre: senza questo il modulo si apre già scorso di qualche
       riga (resta la posizione della volta prima) e la prima etichetta sparisce. */
    /* ⚠️ 20 agosto 2026 — «RICORDA A PAGINA PIENA» (detto da Alessio).
       Le finestre lunghe (lavoro, preventivo, fattura, computo...) prendono
       tutto lo schermo; quelle corte restano una finestrella centrata.
       Prima il CSS lo capiva guardando se dentro c'era «.sh-cols», le due
       colonne. Il computo le colonne non ce le ha piu' — ha le pagine
       «.copag» — e da un momento all'altro si e' rimpicciolito a 880 px in
       mezzo allo schermo: ERRORE MIO, e non l'ha visto nessun banco.
       ⛔ Adesso il nome da guardare e' UNO SOLO: la classe «sh-lunga», messa
          qui. Chi domani inventa una terza forma di finestra la aggiunge in
          questa riga, non in dieci regole del CSS sparse per il file. */
    /* ⚠️ 20 agosto 2026 (2) — visto da Alessio: «perché queste finestre
       piccole?». La conferma del computo letto dal PDF (.cp-riga) e' lunga
       88 righe e si apriva in una finestrella da 880 px con dentro una
       barretta di scorrimento lunga un dito. Le finestre qui sotto sono
       TUTTE quelle lunghe del gestionale: le altre (scegli un lavoro, scegli
       un preventivo, il tipo di fattura) sono tre righe in croce e a tutto
       schermo diventerebbero un lenzuolo bianco. */
    if(s.querySelector(".sh-cols,.copag,.cp-riga")) s.classList.add("sh-lunga");
    const _b=s.querySelector(".sh-body");
    if(_b){
      /* Le emoji diventano icone SVG subito dopo l'apertura: il contenuto cambia
         altezza e il browser "insegue" la posizione (scroll anchoring), lasciando
         il modulo scorso di qualche riga. Riportiamo l'inizio anche dopo. */
      _b.scrollTop=0;
      requestAnimationFrame(function(){_b.scrollTop=0;});
      setTimeout(function(){_b.scrollTop=0;},80);
      setTimeout(function(){_b.scrollTop=0;},250);
    }
  }
  function closeSheet(){$("#overlay").classList.remove("open");}
  $("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay")closeSheet();});

  document.addEventListener("click",async e=>{
    const t=e.target.closest("[data-action]");if(!t)return;
    const a=t.dataset.action,id=t.dataset.id;
    /* se il clic arriva dalla striscia di una scheda, il modulo che sta per
       aprirsi deve accendersi da solo: se no lo apri e non sai dove guardare */
    if(t.classList&&t.classList.contains("ctr-str-vai")) ctrAccendiSubito=t.dataset.ctr||null;
    if(a==="enter")return enterPanel(t.dataset.p);
    if(a==="new-panel")return panelForm();
    if(a==="save-panel")return savePanel();
    if(a==="del-panel")return delPanel(t.dataset.id);
    if(a==="home")return goHome();
    if(a==="azienda")return aziendaForm();
    /* 24 agosto 2026 — il Noleggio e' di tutta l'azienda, non di un reparto:
       da qui si esce dritti verso la sua pagina, come "Dati azienda". */
    if(a==="noleggio"){location.href="/gestionale-noleggio";return;}
    /* 5 set 2026 — si lascia il bigliettino del rientro, come fa il Noleggio
       quando esce: tornando indietro si rientra nel reparto dov'eri. */
    if(a==="appoperaio"){
      try{sessionStorage.setItem("gest_rientro",String(Date.now()));}catch(e){}
      location.href="/gestionale-operatore.html";return;}
    if(a==="abbonamento")return apriAbbonamento(t);
    if(a==="save-azienda")return saveAzienda();
    if(a==="pdf")return generaPdf(id);
    if(a==="map"){window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(t.dataset.q),"_blank");return;}
    if(a==="new-job")return jobForm(null,"",null,true);
    if(a==="lf-open")return showLavoroFoto(t.dataset.id,t.dataset.desc);
    if(a==="lf-back"){$$("nav.tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="lavori"));$$("section").forEach(s=>s.classList.toggle("active",s.id==="lavori"));renderJobs();window.scrollTo(0,0);return;}
    /* ---- fatture ---- */
    if(a==="new-fattura")return fattNuovaScegli();
    if(a==="fatt-vuota"){closeSheet();return fattForm(null);}
    if(a==="fatt-da-lavori")return fattDaLavoriScegli();
    if(a==="fatt-da-lavori-ok")return fattDaLavoriConferma();
    if(a==="fatt-da-prev")return fattDaPreventivoScegli();
    if(a==="fatt-da-prev-ok")return fattDaPreventivoConferma();
    if(a==="edit-fatt"){const f=fattCache.find(x=>String(x.id)===String(id));if(f)fattForm(f);return;}
    if(a==="save-fatt")return saveFattura(id||null);
    if(a==="fatt-riga-add"){$("#fatt-righe").insertAdjacentHTML("beforeend",fattRigaHtml());fattTotaleLive();return;}
    if(a==="fatt-riga-del"){const d=t.closest("[data-riga]");if(d){d.remove();fattTotaleLive();}return;}
    if(a==="fatt-stato")return fattCambiaStato(id,t.dataset.v);
    if(a==="del-fatt")return eliminaFattura(id);
    if(a==="fatt-pdf")return fatturaPdf(id);
    if(a==="fatt-xml")return fatturaXml(id);
    if(a==="fatt-sdi")return fattSdi(id);   /* 29/09/2026 — js/gest-sdi.js */
    if(a==="new-job-date"){closeSheet();return jobForm(null,t.dataset.d,null,true);}
    if(a==="edit-job"){
      closeSheet();
      /* 12 agosto 2026 — maybeSingle + il controllo. Prima era .single(): se la
         riga non c'era piu' (eliminata da un altro dispositivo, o finita nel
         Cestino mentre l'elenco a schermo era vecchio) data restava null, e la
         riga dopo leggeva data.data_prevista su null. Risultato: la finestra si
         chiudeva e NON SUCCEDEVA NIENTE, senza un messaggio. Mancava anche il
         filtro sull'utente, che c'e' in tutte le altre letture puntuali. */
      const{data}=await sb.from('gest_lavori').select('*').eq('id',id).eq('user_id',sbUid).maybeSingle();
      if(!data){toast("Questo lavoro non c'è più: forse è nel Cestino, o l'ha eliminato qualcun altro");return;}
      jobForm({...data, dataPrevista:data.data_prevista, clienteId:data.cliente_id, assegnatoId:data.operatore_id, fattStato:data.fatt_stato, /* 9/8/2026: mancava la traduzione di questi due, e la casella 'Cosa è stato fatto' si apriva VUOTA: al primo Salva il consuntivo scritto la volta prima veniva cancellato. */ lavoroSvolto:data.lavoro_svolto, note:data.note});if(editing){editing.realId = data.id;renderSpeseBlock(data.id,+data.importo||0);renderMezziBlock(data.id);renderLavMedia();renderLavScadenze();renderOreBlock(data.id);renderRapportiniBlock(data.id);renderDocLavoro(data.id);}return;}
    /* renderFotoBlocks va richiamato QUI: jobForm lo chiama alla fine, ma realId
       viene assegnato solo dopo, e senza quello non sa quale lavoro interrogare. */
    if(a==="save-job")return saveJob();
    if(a==="view-foto"){const src=fotoCache[t.dataset.id];if(src){$("#lb-img").src=src;$("#lightbox").classList.add("open");}return;}
    if(a==="close-lb"){$("#lightbox").classList.remove("open");return;}
    if(a==="del-foto"){if(confirm("Eliminare questa foto?"))deleteFoto(t.dataset.id);return;}
    if(a==="gal-tipo"){galFilter.tipo=t.dataset.v;segmOn("#gal-tipo",t.dataset.v);renderGalleria();return;}
    if(a==="gal-media"){galFilter.media=t.dataset.v;segmOn("#gal-media",t.dataset.v);renderGalleria();return;}
    if(a==="gal-nuovo"){galCaricaLavori().then(galUploadForm);return;}
    if(a==="mp-vista"){mpVista=t.dataset.v;segmOn("#mp-vista",t.dataset.v);renderMappa();return;}
    if(a==="mp-ricalcola"){toast("Ricalcolo le distanze…");renderMappa(true);return;}
    if(a==="vai-galleria"){
      galFilter.lav=t.dataset.id;galFilter.media="";galFilter.tipo="";galFilter.op="";
      closeSheet();
      const b=document.querySelector('nav.tabs button[data-tab="galleria"]');
      if(b)b.click();
      segmOn("#gal-media","");segmOn("#gal-tipo","");
      renderGalleria();window.scrollTo(0,0);
      return;
    }
    if(a==="gal-carica")return galCarica();
    if(a==="gal-del-foto"){if(confirm("Eliminare questa foto?"))galDelFoto(t.dataset.id);return;}
    if(a==="gal-del-video"){if(confirm("Eliminare questo video?"))galDelVideo(t.dataset.id);return;}
    if(a==="gal-play"){const u=galVideoCache[t.dataset.id];if(u)window.open(u,"_blank");else toast("Video non ancora pronto, riprova tra un attimo");return;}
    if(a==="ag-stato"){agFilter.stato=t.dataset.v;segmOn("#ag-stato",t.dataset.v);renderAgenda();return;}
    /* 6 set 2026 — le due linguette di Agenda operatore: «Da fare» e «Ore fatte» */
    if(a==="ag-vista"){
      const v=t.dataset.v; segmOn("#ag-vista",v);
      $("#ag-parte-lavori").style.display = v==="ore" ? "none" : "";
      $("#ag-parte-ore").style.display    = v==="ore" ? "" : "none";
      if(v==="ore") renderOre();
      return;
    }
    if(a==="ore-mese"){_oreSpostaMese(+t.dataset.v);return;}
    if(a==="ore-csv"){oreScaricaCsv();return;}
    if(a==="ore-fix"){oreMettiUscita(t);return;}
    if(a==="ore-apri"){
      const id=t.dataset.id;
      oreAperte[id]=!oreAperte[id];
      renderOre();
      return;
    }
    /* 12 agosto 2026 (sera) — "del-job" tolto: era l'eliminazione dell'archivio
       LOCALE, e l'unico pulsante che la chiamava stava dentro jobCard, che non
       si disegna piu' da mesi. Se per sbaglio fosse tornata raggiungibile
       avrebbe tolto il lavoro dallo schermo lasciandolo su Supabase. Quella
       vera e' "del-job-supa". */
    if(a==="del-job-supa"){
      if(!gconfirm(window.cestinoAttivo&&window.cestinoAttivo()
          ? "Eliminare questo lavoro? Finisce nel Cestino: da lì puoi rimetterlo a posto."
          : "Eliminare questo lavoro? L'azione non si può annullare."))return;
      const {data:foto}=await sb.from("gest_foto").select("storage_path").eq("lavoro_id",id).eq("user_id",sbUid);
      /* col cestino il file NON si tocca: se no il ripristino darebbe un'immagine rotta */
      if(foto&&foto.length&&!(window.cestinoAttivo&&window.cestinoAttivo())){
        const paths=foto.map(f=>f.storage_path).filter(Boolean);
        if(paths.length)await sb.storage.from("gestionale-foto").remove(paths);
        await sb.from("gest_foto").delete().eq("lavoro_id",id).eq("user_id",sbUid);
      }
      const {data:okDel,error}=await sb.from("gest_lavori").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okDel||!okDel.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
      renderAll();toast("Lavoro eliminato ✔");return;
    }
    if(a==="stato"){const l=db().lavori.find(x=>x.id===id);l.stato=t.dataset.v;if(l.stato==="fatto"&&!l.dataFatto)l.dataFatto=l.dataPrevista||todayStr();await save();renderAll();toast("Stato: "+statoLabel[l.stato]);return;}
    if(a==="stato-supa"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v, dp=t.dataset.dp||"";
      const {data:okSt2,error}=await sb.from("gest_lavori").update({stato:v,data_fatto:v==="fatto"?(dp||todayStr()):null}).eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okSt2||!okSt2.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
      /* 12 agosto 2026 — mancavano "agenda" e "calendario". Nell'Agenda
         premevi "✔ Segna fatto", compariva il messaggio, e la riga restava
         li' com'era: sembrava che non avesse funzionato e si ripremeva. Sul
         calendario il pallino restava del colore vecchio. */
      rinfresca("lavori","riepilogo","agenda","calendario");toast("Stato: "+(statoLabel[v]||v));return;
    }
    /* Dal lavoro: prima questo pulsante scriveva a mano "fatturato" sul lavoro,
       e la fattura non esisteva da nessuna parte. Ora apre la fattura vera, con
       il lavoro già dentro come voce. Lo stato del lavoro lo scrive la fattura. */
    if(a==="fatt")return fattDaUnLavoro(id);
    if(a==="upload-fattura")return chiediFatturaPdf(id);
    if(a==="open-fattura")return apriFatturaPdf(id);
    if(a==="open-day")return openDay(t.dataset.d);
    if(a==="save-note"){
      const ds=t.dataset.d,v=$("#day-note").value.trim();
      const midN=curMestiere();
      if(!sb||!sbUid||!noteSupaOk||!midN){
        /* vecchio modo: solo su questo dispositivo */
        if(v)db().note[ds]=v;else delete db().note[ds];
        await save();closeSheet();renderCal();
        toast(noteSupaOk?"Nota salvata 📌":"Nota salvata solo su questo dispositivo (manca la migrazione SQL)");return;
      }
      if(v){
        /* ⛔ 30 agosto 2026 — QUI LA NOTA NON SI SALVAVA MAI.
           C'era `eliminato_il:null`, ma in `gest_note` quella colonna NON
           ESISTE: e' l'avanzo del cestino delle note, tolto il 9/8/2026
           poche ore dopo averlo messo (sta scritto in js/cestino.js).
           Postgres rifiutava tutto l'upsert e a schermo usciva «Nota non
           salvata». Le note del calendario non arrivavano al database.
           Il cestino delle note non c'e': il ramo qui sotto cancella davvero. */
        const {data:okN,error}=await sb.from("gest_note").upsert({user_id:sbUid,mestiere_id:midN,data:ds,testo:v},{onConflict:"user_id,mestiere_id,data"}).select("id");
        if(error){toast("Nota non salvata: "+error.message);return;}
        if(!okN||!okN.length){toast("Nota non salvata: nessuna riga modificata. Riprova.");return;}
        noteCache[ds]=v;
      }else{
        const {error}=await sb.from("gest_note").delete().eq("user_id",sbUid).eq("mestiere_id",midN).eq("data",ds).select("id");
        if(error){toast("Nota non eliminata: "+error.message);return;}
        delete noteCache[ds];
      }
      closeSheet();renderCal();toast(v?"Nota salvata 📌":"Nota eliminata");return;
    }
    /* 11 agosto 2026 — IL MESE CHE NON CAMBIAVA.
       Prima: cal.setMonth(cal.getMonth()-1). Se oggi è il 31 marzo, chiedere
       "il 31 del mese prima" vuol dire chiedere il 31 FEBBRAIO: febbraio non
       ce l'ha, e il calendario ti sbatteva al 3 marzo. Premevi la freccia e
       restavi nello stesso mese. Stessa cosa in avanti: dal 31 gennaio
       saltavi febbraio di netto.
       Adesso ci si sposta sempre al PRIMO del mese, che tutti i mesi hanno.
       Il giorno non serve: il calendario usa solo l'anno e il mese, e
       l'anno cambia da solo (mese -1 da gennaio = dicembre dell'anno prima).
       Si vede solo nei giorni 29, 30 e 31: per questo sembrava capitare a caso. */
    if(a==="cal-prev"){cal=new Date(cal.getFullYear(),cal.getMonth()-1,1);renderCal();return;}
    if(a==="cal-next"){cal=new Date(cal.getFullYear(),cal.getMonth()+1,1);renderCal();return;}
    if(a==="cal-today"){cal=new Date();renderCal();return;}
    if(a==="new-cli")return cliForm(null,t.dataset.tipo||"privato");
    if(a==="commercialista")return commForm();
    if(a==="save-comm")return saveComm();
    if(a==="comm-doc")return docCommApri();
    if(a==="apri-cli")return cliScheda(id);
    if(a==="doc-cli")return docCliApri(id);
    if(a==="doc-cli-apri")return docCliScarica(id);
    if(a==="doc-cli-del")return docCliElimina(id);
    if(a==="doc-cli-mail")return docCliMailForm(id);
    if(a==="doc-cli-invia")return docCliInvia(id);
    if(a==="doc-cli-scegli"){const i=$("#cli-doc-file");if(i)i.click();return;}
    if(a==="edit-cli"){
      let pieno=null;
      if(sb&&sbUid){
        const {data:r}=await sb.from("gest_clienti").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
        pieno=r||null;
      }
      return cliForm(pieno||cliCache.find(c=>c.id===id));
    }
    if(a==="save-cli")return saveCli(id);
    if(a==="del-cli")return delCli(id);
    if(a==="new-mezzo")return mezzoForm(null,"mezzo");
    if(a==="edit-mezzo")return mezzoForm(mezziCache.find(m=>String(m.id)===String(id)));
    if(a==="save-mezzo")return saveMezzo(id||null);
    if(a==="mezzo-filtro"){mezziFilter=t.dataset.v;renderMezzi();return;}
    if(a==="attrezzo-filtro"){attrezzFilter=t.dataset.v;renderAttrezzature();return;}
    if(a==="new-attrezzatura")return mezzoForm(null,"attrezzatura");
    if(a==="mezzo-scad")return scadForm(null,{mezzo_id:id});
    if(a==="del-mezzo"){
      if(!sbUid){toast("Devi essere loggato");return;}
      const {count:usi}=await sb.from("gest_lavoro_mezzi").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("mezzo_id",id);
      /* ⚠️ LE SCADENZE DEL MEZZO BUTTATO — 14 agosto 2026.
         gest_scadenze.mezzo_id ha «on delete cascade» nel database, ma col
         Cestino quella catena NON scatta mai: eliminare scrive una data, non
         cancella la riga. Risultato riprodotto: vendi il furgone, e il
         gestionale continua a dirti «Revisione del furgone in scadenza» —
         col nome del mezzo e tutto, come se niente fosse.
         Si mettono via anche loro, come si fa già con le fatture del
         fornitore. E tornano su insieme al mezzo, perché CEST_FIGLI adesso
         sa che sono figlie sue. */
      const {count:nSc}=await sb.from("gest_scadenze").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("mezzo_id",id);
      if(!gconfirm(
          (usi?`Questo mezzo è collegato a ${usi} lavori. `:"")
          +(nSc?`Ha ${nSc} ${nSc===1?"scadenza":"scadenze"} (revisione, assicurazione, bollo…): ${nSc===1?"va":"vanno"} nel Cestino insieme a lui e ${nSc===1?"torna":"tornano"} se lo rimetti a posto.\n\n`:"")
          +"Eliminare questo mezzo?"))return;
      const {data,error}=await sb.from("gest_mezzi").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!data||!data.length){toast("Non eliminato: nessuna riga rimossa");return;}
      try{ await sb.from("gest_scadenze").delete().eq("mezzo_id",id).eq("user_id",sbUid); }catch(e){}
      renderMezzi();renderAttrezzature();renderScadenze();
      toast(nSc?("Eliminato — con "+nSc+(nSc===1?" scadenza":" scadenze")):"Eliminato");return;
    }
    if(a==="new-carta")return cartaForm(null);
    if(a==="edit-carta")return cartaForm(carteCache.find(c=>String(c.id)===String(id)));
    if(a==="save-carta")return saveCarta(id||null);
    if(a==="del-carta")return delCarta(id);
    if(a==="carta-dettaglio")return apriDettaglioCarta(id);
    if(a==="save-movimento")return salvaMovimentoCarta();
    if(a==="del-movimento")return eliminaMovimentoCarta(id);
    if(a==="mezzo-rifornimenti")return apriRifornimenti(id);
    if(a==="save-rifornimento")return salvaRifornimento();
    if(a==="del-rifornimento")return eliminaRifornimento(id);
    if(a==="save-richiesta")return salvaRichiesta();
    if(a==="lm-add")return mezzoLavoroAdd();
    if(a==="lm-del"){
      if(!sbUid){toast("Devi essere loggato");return;}
      if(!confirm("Togliere questo mezzo dal lavoro?"))return;
      const {data,error}=await sb.from("gest_lavoro_mezzi").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!data||!data.length){toast("Non rimosso: nessuna riga eliminata");return;}
      renderMezziBlock(mezziLavoroId);return;
    }
    if(a==="new-scad")return scadForm(null);
    /* "+ Aggiungi una scadenza" dalla scheda della pratica: nasce già collegata.
       Il modulo della scadenza si apre SOPRA quello della pratica: chiudendolo
       si torna alla pratica, quindi qui non chiudo niente. */
    if(a==="scad-da-pratica"){
      /* 9 agosto 2026 — la finestra è UNA sola (#sheet): aprendo il modulo
         della scadenza si riscrive quello della pratica, e quello che c'era
         scritto e non ancora salvato va perso. Prima non lo diceva nessuno
         (il commento qui sopra sosteneva pure il contrario). Ora si avvisa. */
      if(!gconfirm("Apro il modulo della scadenza al posto di questo.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?"))return;
      const lavId=id;
      const l=(lavCache||[]).find(x=>String(x.id)===String(lavId));
      return scadForm(null,{lavoro_id:lavId,cliente_id:(l&&l.cliente_id)||null});
    }
    if(a==="scad-vista"){scadVista=t.dataset.v;renderScadenze();return;}
    if(a==="scad-persona"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      /* 14 agosto notte: passa dalla stessa porta di «sq-edit», che rilegge.
         Prima, se la persona era in cache, si apriva con i dati vecchi: e' la
         stessa scheda e lo stesso rischio di riscrivere sopra. */
      return squadraApri(id);
    }
    if(a==="edit-scad"){
      const inCache=scadCache.find(s=>String(s.id)===String(id));
      if(inCache)return scadForm(inCache);
      /* 12 agosto 2026 (sera) — dal calendario si puo' aprire una scadenza senza
         aver mai aperto lo Scadenzario: la memoria e' vuota e prima si apriva un
         modulo NUOVO e vuoto, che salvando creava un DOPPIONE invece di
         modificare quella. Adesso la scadenza si va a prendere. */
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const {data:s1,error:e1}=await sb.from("gest_scadenze").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
      if(e1){toast("Non riesco ad aprire la scadenza: "+e1.message);return;}
      if(!s1){toast("Questa scadenza non c'è più");rinfresca("calendario","scadenzario");return;}
      return scadForm(s1);
    }
    if(a==="save-scad")return saveScad(id);
    if(a==="scad-stato"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v;
      /* 12 agosto 2026 (sera) — .neq("stato",v) e' la rete di sicurezza contro i
         DOPPIONI: qui sotto, se la scadenza si ripete, "fatta" ne crea un'altra.
         Senza questo controllo bastava premere "Segna fatta" due volte (o
         cliccare due volte, o riaprire la scheda) per ritrovarsi due, tre
         scadenze future identiche. Cosi' invece il database non tocca niente e
         non nasce niente. */
      const {data:okSc,error}=await sb.from("gest_scadenze").update({stato:v}).eq("id",id).eq("user_id",sbUid).neq("stato",v).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okSc||!okSc.length){
        const _g=scadCache.find(x=>String(x.id)===String(id));
        if(_g&&String(_g.stato||"")===v){
          toast(v==="fatta"?"Era già segnata fatta":"Era già aperta");
          renderScadenze();return;
        }
        toast("Non salvato: nessuna riga modificata. Riprova.");return;
      }
      /* ===== 12 agosto 2026 — la prossima nasce da sola =====
         Se questa scadenza si ripete, appena la segni fatta ne creo un'altra
         con la stessa roba e la data spostata avanti. Prima segnavi fatta la
         revisione e non ti avvisava mai piu'. */
      let _rip="";
      if(v==="fatta"){
        try{
          const vecchia=scadCache.find(x=>String(x.id)===String(id));
          const n=vecchia?(+vecchia.ripeti_mesi||0):0;
          if(n>0&&vecchia.data_scadenza){
            const nuovaData=_mesiDopo(vecchia.data_scadenza,n);
            const {error:e2}=await sb.from("gest_scadenze").insert({
              user_id:sbUid, mestiere_id:vecchia.mestiere_id||curMestiere(),
              titolo:vecchia.titolo, tipo_pratica:vecchia.tipo_pratica||null,
              cliente_id:vecchia.cliente_id||null, mezzo_id:vecchia.mezzo_id||null,
              lavoro_id:vecchia.lavoro_id||null, note:vecchia.note||null,
              avvisa:vecchia.avvisa!==false, ripeti_mesi:n,
              data_scadenza:nuovaData, stato:"aperta"});
            if(e2)_rip=" — ma la prossima non è stata creata: "+e2.message;
            else  _rip=" — la prossima è il "+fdate(nuovaData);
          }
        }catch(e){}
      }
      renderScadenze();rinfresca("riepilogo","calendario");
      toast(v==="fatta"?("Scadenza completata ✔"+_rip):"Riaperta");return;
    }
    if(a==="del-scad"){if(!sbUid){toast("Devi essere loggato");return;}if(gconfirm("Eliminare questa scadenza?")){const {data:okDs,error}=await sb.from("gest_scadenze").delete().eq("id",id).eq("user_id",sbUid).select("id");if(error){toast("Errore: "+error.message);return;}if(!okDs||!okDs.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}renderScadenze();rinfresca("calendario","riepilogo");toast("Scadenza eliminata");}return;}
    if(a==="new-dip")return squadraForm();
    if(a==="sq-add")return squadraAdd();
    if(a==="sq-edit")return squadraApri(id);
    if(a==="sq-save")return squadraSave(id);
    if(a==="sq-copy"){copyLink(t.dataset.link);return;}
    if(a==="sq-qr"){mostraQrInvito(t.dataset.link,t.dataset.nome||"");return;}
    if(a==="sq-wa"){window.open(t.dataset.wa,"_blank");return;}
    if(a==="sq-revoca"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      if(!gconfirm("Rimuovere l'accesso a "+t.dataset.nome+"? Non potrà più entrare nel gestionale."))return;
      const {data:okRev,error}=await sb.from("gest_membri").update({stato:"revocato"}).eq("operatore_id",id).eq("impresa_id",sbUid).select("operatore_id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okRev||!okRev.length){toast("Non rimosso: nessuna riga modificata. Riprova.");return;}
      renderDip();toast("Accesso rimosso");return;
    }
    if(a==="sq-del")return dipElimina(id);
    if(a==="save-dip")return saveDip(id);
    /* 12 agosto 2026 (sera) — "edit-dip" e "del-dip" tolti: lavoravano sullo
       stesso archivio locale morto (db().dipendenti, sempre vuoto). La squadra
       vera si modifica con "sq-edit" e sta su gest_operatori. */
    /* ---- Fornitori ---- */
    if(a==="new-forn")return fornForm(null);
    if(a==="forn-scheda")return fornScheda(id);
    if(a==="edit-forn")return fornForm(fornCache.find(x=>String(x.id)===String(id)));
    if(a==="edit-forn-full"){
      const {data:rf}=await sb.from("gest_fornitori").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
      return fornForm(rf||fornCache.find(x=>String(x.id)===String(id)));
    }
    if(a==="forn-ti-cerca")return fornTiCerca();
    if(a==="forn-ti-scegli")return fornTiScegli(t.dataset.i);
    if(a==="forn-ti-scollega"){
      if($("#fo-tid"))$("#fo-tid").value="";
      const st=$("#fo-ti-stato");if(st)st.innerHTML="";
      toast("Collegamento rimosso: ricordati di salvare");return;
    }
    if(a==="new-fattf-forn")return fattfForm({fornitore_id:id});
    if(a==="forn-doc")return fornDocApri(id);
    if(a==="forn-doc-scegli"){const i=$("#forn-doc-file");if(i)i.click();return;}
    if(a==="lav-doc-scegli"){const i=$("#lav-doc-file");if(i)i.click();return;}
    if(a==="lav-doc-del")return lavDocElimina(id);
    if(a==="forn-doc-del")return fornDocElimina(id);
    if(a==="save-forn")return saveForn(id||null);
    if(a==="del-forn"){
      if(!sbUid){toast("Devi essere loggato");return;}
      const nf=fattfCache.filter(x=>String(x.fornitore_id)===String(id)).length;
      if(!gconfirm(nf?`Eliminare questo fornitore? Verranno eliminate anche le sue ${nf} fatture registrate.`:"Eliminare questo fornitore?"))return;
      const {data:okDf2,error}=await sb.from("gest_fornitori").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okDf2||!okDf2.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
      /* col cestino la catena del database non scatta più: le sue fatture le
         mettiamo via a mano, se no restavano vive e continuavano a contare
         nel "da pagare" agganciate a un fornitore che non c'e' più. */
      try{ await sb.from("gest_fatture_fornitori").delete().eq("fornitore_id",id).eq("user_id",sbUid); }catch(e){}
      closeSheet();renderFornitori();rinfresca("riepilogo");toast("Fornitore eliminato");return;
    }
    if(a==="new-fattf")return fattfForm(null);
    if(a==="edit-fattf")return fattfForm(fattfCache.find(x=>String(x.id)===String(id)));
    if(a==="save-fattf")return saveFattf(id||null);
    if(a==="del-fattf"){
      if(!sbUid){toast("Devi essere loggato");return;}
      if(!gconfirm("Eliminare questa fattura?"))return;
      const {data:okDff,error}=await sb.from("gest_fatture_fornitori").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okDff||!okDff.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}
      renderFornitori();rinfresca("riepilogo");toast("Fattura eliminata");return;
    }
    if(a==="fattf-stato"){
      if(!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v;
      const patch={stato:v,data_pagata:v==="pagata"?todayStr():null};
      const {data:okFs,error}=await sb.from("gest_fatture_fornitori").update(patch).eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okFs||!okFs.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
      renderFornitori();rinfresca("riepilogo");
      if(t.dataset.forn)fornScheda(t.dataset.forn);   /* dalla scheda: si riapre aggiornata */
      toast(v==="pagata"?"Segnata pagata ✔":"Riaperta");return;
    }
    if(a==="quick-cli"){
      /* stesso motivo di scad-da-pratica: la finestra è una sola e questa
         prende il posto di quella aperta (9/8/2026) */
      if(!gconfirm("Apro il modulo del cliente al posto di questo.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?"))return;
      return cliForm(null);
    }
    if(a==="close")return closeSheet();
  });

  /* ---- la barra in basso (solo telefono): preme la voce vera del menu ---- */
  (function barraBasso(){
    const bb=document.getElementById("barra-basso"); if(!bb)return;
    bb.querySelectorAll("button[data-vai]").forEach(function(b){
      b.addEventListener("click",function(){
        const v=document.querySelector('nav.tabs button[data-tab="'+b.dataset.vai+'"]');
        if(v)v.click();
      });
    });
    /* 29/09/2026 — le etichette della barra sono corte: «Lavori e interventi»
       non ci sta e usciva «Lavori e i…». Resta la prima parola (Lavori,
       Pratiche, Incarichi). Si rifa se un altro pezzo cambia il testo. */
    function corte(){
      bb.querySelectorAll("button[data-vai] span").forEach(function(s){
        const t=s.textContent.trim();
        if(t.indexOf(" ")>0&&t.length>9){ s.title=t; s.textContent=t.split(" ")[0]; }
      });
    }
    corte();
    try{ new MutationObserver(corte).observe(bb,{subtree:true,childList:true,characterData:true}); }catch(e){}
    function sincro(){
      const att=document.querySelector("nav.tabs button.active");
      const k=att?att.dataset.tab:"";
      bb.querySelectorAll("button[data-vai]").forEach(function(b){
        b.classList.toggle("on", b.dataset.vai===k);
      });
    }
    /* la sezione cambia anche da altre strade (deep link, schede del
       Riepilogo, «torna ai lavori»): invece di rincorrerle tutte, si guarda
       quale voce del menu e' accesa. */
    try{
      const nav=document.querySelector(".side nav.tabs");
      if(nav)new MutationObserver(sincro).observe(nav,{subtree:true,attributes:true,attributeFilter:["class"]});
    }catch(e){}
    sincro();
  })();

  $$("nav.tabs button").forEach(b=>{
    b.onclick=()=>{
      /* 22 agosto 2026 — i pulsanti che portano a un'ALTRA pagina (Noleggio).
         Vanno riconosciuti per primi: non hanno una sezione da accendere, e
         senza questa riga il menu andrebbe a cercare "#undefined" e morirebbe
         in silenzio, portandosi dietro tutti gli altri pulsanti. */
      if(b.dataset.vai){location.href=b.dataset.vai;return;}
      $$("nav.tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");
      $$("section").forEach(s=>s.classList.remove("active"));$("#"+b.dataset.tab).classList.add("active");
      /* Render pigro: la sezione si ridisegna all'apertura se è segnata "da
         rifare" (dopo un salvataggio o all'ingresso nel reparto). Alcune si
         ridisegnano sempre: lavori/agenda cambiano forma con la larghezza
         dello schermo, mappa e richieste si disegnano solo quando le apri. */
      const tb=b.dataset.tab;
      const SEMPRE=["lavori","agenda","mappa","richieste","dalsito","mezzi","attrezzature","assistenza","fisco"]; /* fisco: i soldi da incassare cambiano da Fatture, va sempre riletto */
      if(_tabSporchi.has(tb)||SEMPRE.includes(tb)){
        _tabSporchi.delete(tb);
        const fn=RENDER_TAB[tb];if(fn)fn();
      }
      const sd=document.querySelector(".side");if(sd)sd.classList.remove("open"); /* chiude il menu hamburger su mobile */
      window.scrollTo({top:0,behavior:"smooth"});
    };
  });
  /* chiude il menu "..." a ogni clic fuori dal pulsante che lo apre */
  document.addEventListener("click",e=>{if(!e.target.closest(".lav-dots"))tabChiudiPop();});
  /* la tabella si ridisegna al passaggio desktop/mobile: sotto 880px tornano le card.
     ATTENZIONE: su iPhone e iPad vecchi (iOS 13 e prima) matchMedia non ha
     addEventListener, ha solo il vecchio addListener. Senza questo controllo la riga
     lanciava un errore e tutto quello che viene dopo -- compreso l'avvio -- non
     partiva: schermata bianca. */
  try{
    const _mqTab=window.matchMedia("(min-width:881px)");
    const _mqCambio=()=>{if(cur){renderJobs();renderAgenda();}};
    if(_mqTab.addEventListener)_mqTab.addEventListener("change",_mqCambio);
    else if(_mqTab.addListener)_mqTab.addListener(_mqCambio);
  }catch(e){}
  /* i due filtri a tendina: l'elemento resta lo stesso a ogni render (cambiano solo
     le <option>), quindi il listener si aggancia una volta sola qui */
  if($("#ag-op-sel"))$("#ag-op-sel").onchange=e=>{agFilter.op=e.target.value;renderAgenda();};
  if($("#gal-op-sel"))$("#gal-op-sel").onchange=e=>{galFilter.op=e.target.value;renderGalleria();};
  if($("#gal-lav-sel"))$("#gal-lav-sel").onchange=e=>{galFilter.lav=e.target.value;renderGalleria();};
  $("#f-search").oninput=e=>{filter.q=e.target.value;renderJobs();};
  if($("#cli-search"))$("#cli-search").oninput=e=>{cliQ=e.target.value;renderClienti();};
  /* la ricerca del Cestino non rilegge il database: filtra quello che c'e' gia'
     in memoria, quindi puo' girare a ogni lettera senza pesare */
  if($("#cest-search"))$("#cest-search").oninput=e=>{cestQ=e.target.value;renderCestino(true);};
  if($("#dip-search"))$("#dip-search").oninput=e=>{dipQ=e.target.value;renderDip();};
  if($("#lf-file"))$("#lf-file").onchange=e=>{uploadLavoroFoto(e.target.files);e.target.value="";};
  if($("#lf-video-file"))$("#lf-video-file").onchange=e=>{uploadLavoroVideo(e.target.files);e.target.value="";};
  if($("#fatt-pdf-file"))$("#fatt-pdf-file").onchange=e=>{uploadFatturaPdf(e.target.files[0]);e.target.value="";};
  if($("#cli-doc-file"))$("#cli-doc-file").onchange=e=>{uploadDocCliente(e.target.files);e.target.value="";};
  if($("#forn-doc-file"))$("#forn-doc-file").onchange=e=>{uploadDocFornitore(e.target.files);e.target.value="";};
  if($("#lav-doc-file"))$("#lav-doc-file").onchange=e=>{uploadDocLavoro(e.target.files);e.target.value="";};

  /* ============================================================
     ⛔ 5 SETTEMBRE 2026 — APRENDO IL GESTIONALE SI VEDE LA SCHERMATA
        DEI REPARTI, NON L'ULTIMO REPARTO DI IERI
     ============================================================
     Alessio, con due fotografie: «ogni volta che apro il gestionale si apre
     questa finestra (dentro il reparto «progetto casa», sezione Assistenza
     diretta), invece si deve aprire quella dei reparti».
     ⚠️ NON si toglie la memoria dell'ultimo reparto: il →23← agosto era
     stata messa apposta, perche' uscendo dal NOLEGGIO si finiva sulla
     schermata dei reparti e Alessio disse «mi fa uscire completamente».
     Le due cose non litigano se si distingue COME si e' arrivati qui:
       · si ARRIVA DA UN'ALTRA PAGINA DEL GESTIONALE (noleggio, negozio,
         config, operatore) -> si rientra dritti dov'era: e' un rientro.
       · si APRE il gestionale (dal pannello, da un preferito, scrivendo
         l'indirizzo, dalla barra FONDATORE) -> schermata dei reparti.
       · c'e' un link diretto con il cancelletto (#preventivi) -> comanda
         quello, come prima, se no il link non aprirebbe piu' niente.
     Cosi' l'ultimo reparto resta scritto (`gest_ultimo_reparto`) e la
     freccia «Indietro» continua a funzionare come sempre. */
  /* ⚠️ IL BIGLIETTINO HA UNA SCADENZA (→10← secondi), e non e' un vezzo.
     Chi torna dal Noleggio ci arriva con `history.back()`: se il browser
     ripesca la pagina dalla memoria (bfcache) questo codice non gira
     nemmeno, e il bigliettino resterebbe scritto. Mezz'ora dopo, aprendo
     il gestionale da zero nella stessa scheda, quel bigliettino vecchio lo
     rispedirebbe dentro al reparto — cioe' esattamente il difetto che
     stiamo togliendo. Con la scadenza un bigliettino vecchio non vale. */
  function _rientroDaGestionale(){
    try{
      const t=parseInt(sessionStorage.getItem("gest_rientro")||"0",10);
      sessionStorage.removeItem("gest_rientro");
      if(t && (Date.now()-t) < 10000) return true;
    }catch(e){}
    try{
      if(!document.referrer) return false;
      const u=new URL(document.referrer);
      if(u.origin!==location.origin) return false;
      return /gestionale-(noleggio|negozio|config|operatore)/.test(u.pathname);
    }catch(e){ return false; }
  }

  /* ⛔ 20 settembre 2026 — IL PROMEMORIA AL RITORNO DALL'ABBONAMENTO.
     Scelta di Alessio: quando uno disdice NON lo si obbliga a esportare —
     «non deve essere obbligato a esportare ma un consiglio». Chi ha gia'
     scaricato si troverebbe un passaggio in piu' proprio mentre se ne va, e
     chi non scarica puo' tornare a farlo quando vuole (anche dal muro del
     pagamento, da oggi). Quindi: una riga, un tasto, e si chiude.
     ⚠️ NON sappiamo se ha davvero disdetto: dal portale di Stripe si torna
     indietro uguale che uno abbia cambiato la carta, cambiato piano o
     disdetto. Per questo la frase dice «se hai disdetto», e non da' per
     scontato niente.
     ⚠️ Il bigliettino scade dopo 30 minuti e si cancella appena letto: uno
     che riapre il gestionale domani non se lo ritrova addosso. */
  function _rientroAbbonamento(){
    var t=0;
    try{ t=parseInt(sessionStorage.getItem("gest_da_abbonamento")||"0",10);
         sessionStorage.removeItem("gest_da_abbonamento"); }catch(e){}
    if(!t || (Date.now()-t) > 1800000) return;
    var land=document.querySelector("#landing .landing-top");
    if(!land) return;
    var d=document.createElement("div");
    d.className="rientro-abb";
    d.innerHTML='<div class="rientro-abb-txt"><b>Bentornato.</b> Se hai disdetto, '
      + 'i tuoi dati restano tuoi: puoi portarteli via quando vuoi.</div>';
    var b=document.createElement("button");
    b.type="button"; b.className="rientro-abb-btn"; b.textContent="Scarica i tuoi dati";
    b.onclick=function(){ esportaExcel(); };
    var x=document.createElement("button");
    x.type="button"; x.className="rientro-abb-x"; x.setAttribute("aria-label","Chiudi"); x.textContent="\u00d7";
    x.onclick=function(){ d.remove(); };
    d.appendChild(b); d.appendChild(x);
    land.insertAdjacentElement("afterend", d);
  }

  load().then(()=>{
    _rientroAbbonamento();
    if(cur) return;
    renderLanding();
    /* e poi, se si sa dove si era, si entra dritti: la landing resta
       disegnata sotto, cosi' la freccia trova gia' tutto pronto. */
    const ps=state.panels||[];
    let id=null; try{id=localStorage.getItem(GEST_ULTIMO);}catch(e){}
    if(id&&ps.some(p=>p.id===id&&!p.cestinato)&&(_deepTab||_rientroDaGestionale())) enterPanel(id);
    /* il secondo dei due punti: adesso i reparti del browser ci sono. Se
       l'utente non si sa ancora, questa non fa niente e ci pensa _authRefresh. */
    pulisciRepartiSpariti();
  });
