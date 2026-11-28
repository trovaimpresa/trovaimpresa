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
    /* 20 nov 2026 (collaudo Agenda dello studio) — «tutta l'azienda» allo studio */
    const _oc = $("#ore-chi"); if(_oc) _oc.textContent = ruoloUtente==='professionista' ? "tutto lo studio" : "tutta l'azienda";

    /* tutta la squadra dell'azienda, non del solo reparto: vedi la nota in cima */
    const [rOps, rTmb, rOre] = await Promise.all([
      sb.from("gest_operatori").select("id,nome").eq("user_id", sbUid),
      sb.from("gest_timbrature").select("id,tipo,quando,ora_telefono,creato_da,corretta_da")
        .eq("user_id", sbUid).is("eliminato_il", null)
        /* 18 nov 2026 — collaudo: il mese si tagliava sull'ora di Greenwich.
           Chi timbrava fra mezzanotte e l'una (le due, d'estate) del primo
           del mese finiva nel mese PRIMA, come giornata rimasta aperta. Il
           mese adesso e' quello dell'orologio di qui. */
        .gte("quando", new Date(q.a, q.m, 1).toISOString()).lt("quando", new Date(q.a, q.m+1, 1).toISOString()),
      sb.from("gest_ore").select("ore,operatore_id,data,lavoro_id,nota")
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
    /* 18 nov 2026 — collaudo: chi e' nel Cestino usciva come «Persona non in
       elenco». Il nome si legge dalla porta di servizio: «… (nel cestino)». */
    const _oreFuori = Array.from(new Set(TMB.map(r => r.creato_da).concat(ORE.map(r => r.operatore_id)).filter(x => x && !(x in NOMI))));
    if(_oreFuori.length && typeof sb.raw === "function"){
      try{
        const rF = await sb.raw("gest_operatori").select("id,nome,eliminato_il").eq("user_id", sbUid).in("id", _oreFuori);
        ((rF && rF.data) || []).forEach(o => { NOMI[o.id] = (o.nome || "senza nome") + (o.eliminato_il ? " (nel cestino)" : ""); });
      }catch(e){}
    }
    const SENZA = "_senza_nome";
    NOMI[SENZA] = "Ore senza nome";

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
    /* 18 nov 2026 — collaudo: le ore scritte senza il nome di una persona si
       buttavano via, e il totale «Ore scritte a mano» veniva piu' basso di
       quello vero. Adesso hanno la loro riga, «Ore senza nome». */
    ORE.forEach(r => { const k = r.operatore_id || SENZA; scritte[k] = (scritte[k]||0) + (+r.ore||0); });
    /* 20 nov 2026 (collaudo Agenda dello studio, si' di Alex) — le ore scritte
       si aprono giorno per giorno, col nome della pratica (o del lavoro) e
       «cosa ha fatto». Prima «Apri ↓» c'era solo per le timbrature. */
    const scrRighe = {};
    ORE.forEach(r => { const k = r.operatore_id || SENZA; (scrRighe[k] = scrRighe[k] || []).push(r); });
    const LAVN = {};
    const _lavIds = Array.from(new Set(ORE.map(r => r.lavoro_id).filter(Boolean)));
    if(_lavIds.length){
      try{
        const rL = await (typeof sb.raw === "function" ? sb.raw("gest_lavori") : sb.from("gest_lavori")).select("id,descrizione,eliminato_il").eq("user_id", sbUid).in("id", _lavIds);
        ((rL && rL.data) || []).forEach(l => { LAVN[l.id] = (l.descrizione || "—") + (l.eliminato_il ? " (nel cestino)" : ""); });
      }catch(e){}
    }

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
      const scr = (scrRighe[id] || []).slice().sort((a,b) => String(b.data||"").localeCompare(String(a.data||"")));
      /* 28 nov 2026 (sessione 9): «Giorni 0» per chi ha solo ore scritte a mano.
         Un giorno conta se c'e' una timbratura OPPURE un'ora scritta (una volta sola). */
      const _gSet = new Set(Object.keys(giorni).filter(g => _oreCoppie(giorni[g]).ms > 0));
      (scrRighe[id] || []).forEach(r => { if(r.data && (+r.ore||0) > 0) _gSet.add(String(r.data).slice(0,10)); });
      nGiorni = _gSet.size;
      return { id:id, nome:NOMI[id] || "Persona non in elenco", ms:ms, giorni:nGiorni,
               scrMs:scrMs, scr:scr, det:det, buchi:buchi, niente:(ms === 0 && scrMs === 0 && buchi.length === 0) };
    }).sort((a,b) => b.ms - a.ms || a.nome.localeCompare(b.nome));

    ORE_ULTIMO = { mese: MESI_L[q.m] + " " + q.a, pers: PERS };

    const totMs   = PERS.reduce((s,p) => s + p.ms, 0);
    const totScr  = PERS.reduce((s,p) => s + p.scrMs, 0);
    const totBuchi= PERS.reduce((s,p) => s + p.buchi.length, 0);
    const quanti  = PERS.filter(p => p.ms > 0).length;
    const quantePers = PERS.filter(p => p.id !== SENZA).length;

    if(!TMB.length && !ORE.length && !(rOre && rOre.error)){
      body.innerHTML = tabVuoto("Nessuna ora in " + MESI_L[q.m],
        ruoloUtente==='professionista'
          ? "Qui arrivano le ore che i collaboratori timbrano dal telefono e quelle scritte nel «Registro delle ore» della pratica. Se il mese è appena iniziato, è normale."
          : "Qui arrivano le ore che la squadra timbra dal telefono e quelle scritte in «Segna la giornata». Se il mese è appena iniziato, è normale.", AG_VUOTO);
      return;
    }

    /* ---- l'avviso delle giornate aperte ---- */
    let H = "";
    /* 18 nov 2026 — regola 20: se le ore scritte non si leggono, si dice (prima: 0 in silenzio) */
    if(rOre && rOre.error){
      H += '<div class="ore-avviso"><span class="ore-av-ic">⚠️</span><div><span class="ore-av-t">Le ore scritte a mano non riesco a leggerle</span>'
        + '<p>Qui sotto vedi solo quelle timbrate. Controlla la connessione e riapri «Ore fatte».</p></div></div>';
    }
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
      + '<div class="ore-st"><div class="n">' + quanti + ' / ' + quantePers + '</div><div class="l">Chi ha timbrato</div></div>'
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
        + '<span class="c6">' + (p.det.length || p.scr.length ? (aperto ? "Chiudi ↑" : "Apri ↓") : "") + '</span>'
        + '</div>';

      if(aperto && p.scr.length){
        const _pro = ruoloUtente === 'professionista';
        H += '<div class="ore-giorni">';
        p.scr.forEach(r => {
          const cosa = [r.lavoro_id ? (LAVN[r.lavoro_id] || (_pro ? "pratica nel cestino" : "lavoro nel cestino")) : "", String(r.nota || "").trim()].filter(Boolean).join(" · ");
          H += '<div class="ore-g"><span class="d">' + _oreGiornoIt(r.data) + '</span>'
            + '<span class="t">' + esc(cosa || "Ore scritte a mano") + '</span>'
            + '<span class="h">' + _oreHM((+r.ore || 0) * 3600000) + '</span></div>';
        });
        if(p.id !== SENZA && !String(p.nome).includes("(nel cestino)"))
          H += '<div class="ore-g"><span class="d"></span><span class="t"><button type="button" class="ore-link" data-sqg="apri" data-id="' + esc(p.id) + '" data-nome="' + esc(p.nome) + '">Apri le Giornate di ' + esc(p.nome) + ' →</button></span><span class="h"></span></div>';
        H += '</div>';
      }
      if(aperto && p.det.length){
        H += '<div class="ore-giorni">';
        p.det.forEach(d => {
          if(d.buco){
            H += '<div class="ore-g buco"><span class="d">' + _oreGiornoIt(d.giorno) + '</span>'
              + '<span class="t">' + _oreHHMM(d.buco.quando) + ' → <b>manca l\'uscita</b></span>'
              /* 18 nov 2026 — collaudo: qui c'era onclick="event.stopPropagation()".
                 Fermava il clic PRIMA dell'ascoltatore della pagina: «Metti
                 l'uscita» non faceva niente. La riga del giorno non sta dentro
                 la riga della persona, quindi non c'e' niente da fermare. */
              + '<span class="fix">'
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

    /* 20 nov 2026 (collaudo Agenda) — la differenza del totale mescolava le
       persone: david solo timbrate (1 min) e Giulia solo scritte (2h 30m)
       davano «−2h 29m» in arancio, un allarme falso. Si confrontano solo le
       persone che hanno TUTTE E DUE le misure, come fa ogni riga. */
    const _due = PERS.filter(p => p.ms > 0 && p.scrMs > 0);
    let diffTot = _due.reduce((s,p) => s + p.ms - p.scrMs, 0), dt;
    if(!_due.length) dt = '<span class="ore-diff no">—</span>';
    else if(Math.abs(diffTot) < 900000) dt = '<span class="ore-diff ok">uguali</span>';
    else dt = '<span class="ore-diff att">' + (diffTot < 0 ? "−" : "+") + _oreHM(Math.abs(diffTot)) + '</span>';

    H += '<div class="ore-riga tot"><span class="c1">' + (ruoloUtente==='professionista' ? "Totale dello studio" : "Totale squadra") + '</span>'
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
    const righe = [["Persona","Giorni","Ore timbrate","Ore timbrate (numero)","Ore scritte a mano","Ore scritte (numero)","Giornate aperte"]];
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

  /* 14 nov 2026 (quinto giro, n. 2) — le righe sotto il margine che spiegano le
     ore contate alla media: prima quelle senza nome, poi una riga per ogni
     persona senza costo orario, col pulsante che apre la sua scheda. */
  /* 15 nov 2026 (sesto giro, DIFFICILE 6) — una persona aggiunta da un altro
     telefono o computer: qui la squadra in memoria (dipCache) e' quella di
     quando hai aperto la pagina, e le sue ore diventavano «di una persona che
     non è più in squadra». Prima di scriverlo si rilegge la squadra, UNA volta
     per persona: se c'e', esce col suo nome e col pulsante; se davvero non
     c'e' (e' nel Cestino) la frase resta quella. Il conto non cambia. */
  const _margGiaCercati={};
  async function margineSquadraFresca(senzaCosto){
    const ignoti=Object.keys(senzaCosto||{}).filter(k=>!_margGiaCercati[k]&&!(dipCache||[]).some(d=>String(d.id)===String(k)));
    if(!ignoti.length||typeof renderDip!=="function")return false;
    ignoti.forEach(k=>{_margGiaCercati[k]=true;});
    try{ await renderDip(); }catch(e){}
    return true;
  }
  function margineRigheOre(oreSenzaNome,senzaCosto,mediaSquadra){
    const _h=n=>String(Math.round((+n||0)*100)/100).replace(".",",")+((+n===1)?" ora":" ore");
    const _una=n=>(+n===1);   /* 15 nov 2026 (sesto giro, n. 6): con una sola ora «la conto», «non entra» */
    const ids=Object.keys(senzaCosto||{});
    const diPersone=ids.reduce((s,k)=>s+(+senzaCosto[k]||0),0);
    const anonime=Math.round(((+oreSenzaNome||0)-diPersone)*100)/100;
    let out="";
    if(anonime>0){
      out+=(mediaSquadra>0
        ? `<span class="sp-forn" style="flex-basis:100%">${_h(anonime)} senza il nome di chi le ha fatte: ${_una(anonime)?"contata":"contate"} al costo medio della squadra (${eur2(mediaSquadra)} l'ora)</span>`
        : `<span class="sp-forn" style="flex-basis:100%">${_h(anonime)} senza il nome di chi le ha fatte: ${_una(anonime)?"questa non entra":"queste non entrano"} nel margine, perché nessuno di chi c'è adesso in squadra ha il costo orario. Scrivilo nella scheda della persona, in Squadra.</span>`);
    }
    ids.forEach(function(k){
      const p=(dipCache||[]).find(d=>String(d.id)===String(k));
      const nome=p&&p.nome?String(p.nome):"";
      const chi=nome?esc(nome):"una persona che non è più in squadra";
      out+=`<span class="sp-forn marg-senza-costo" style="flex-basis:100%">`
        +(mediaSquadra>0
          ? `${_h(senzaCosto[k])} di ${chi}: non ha il costo orario, ${_una(senzaCosto[k])?"la":"le"} conto al costo medio della squadra (${eur2(mediaSquadra)} l'ora).`
          : `${_h(senzaCosto[k])} di ${chi} non ${_una(senzaCosto[k])?"entra":"entrano"} nel margine: non ha il costo orario.`)
        +(nome?` <button type="button" class="btn marg-scheda" data-action="sq-edit" data-id="${esc(String(k))}">Scrivi il costo orario di ${chi}</button>`:"")
        +`</span>`;
    });
    return out;
  }

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
    /* 14 nov 2026 (quinto giro, n. 8) — le ultime salvate in cima (regola del
       10 nov): erano lette dalla piu' vecchia. Il grafico si ordina da se'. */
    let conForn=true;
    let r=await sb.from("gest_spese").select("id,descrizione,importo,data,created_at,fornitore_id").eq("user_id",sbUid).eq("lavoro_id",lavoroId).order("created_at",{ascending:false});
    if(r.error&&/fornitore_id/i.test(r.error.message||"")&&/column|schema cache/i.test(r.error.message||"")){
      conForn=false;
      r=await sb.from("gest_spese").select("id,descrizione,importo,data,created_at").eq("user_id",sbUid).eq("lavoro_id",lavoroId).order("created_at",{ascending:false});
    }
    const sp=r.data||[];
    /* la tendina del fornitore, riempita dall'anagrafica (facoltativa) */
    const selF=$("#sp-forn");let fMap={};
    if(conForn){
      if(!fornCache.length){const {data:fo}=await sb.from("gest_fornitori").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("nome");fornCache=fo||fornCache;}
      fMap=Object.fromEntries(fornCache.map(x=>[String(x.id),x.nome]));
      if(selF){const curV=selF.value;selF.style.display=fornCache.length?"":"none";selF.innerHTML='<option value="">— fornitore —</option>'+fornCache.map(x=>'<option value="'+x.id+'">'+esc(x.nome)+'</option>').join("");if(curV)selF.value=curV;}
    }else if(selF){selF.style.display="none";}
    /* 25 nov 2026 — le spese fatte con la carta aziendale per questo lavoro:
       stanno nella carta (si tolgono da lì), qui si vedono e contano */
    let cm=[];
    try{cm=(await cartePerLavoro([lavoroId]))[String(lavoroId)]||[];}catch(e){}
    if(String(speseLavoroId||"")!==String(lavoroId))return;
    let cNomi={};
    if(cm.length){try{const _sbC=(sb.raw||sb.from.bind(sb));const {data:cc}=await _sbC("gest_carte").select("id,nome").eq("user_id",sbUid);(cc||[]).forEach(c=>{cNomi[String(c.id)]=c.nome;});}catch(e){}}
    cm.sort((a,b)=>String(b.data||"").localeCompare(String(a.data||""))||String(b.created_at||"").localeCompare(String(a.created_at||"")));
    const tot=sp.reduce((s,x)=>s+(+x.importo||0),0)+cm.reduce((s,x)=>s+(+x.importo||0),0);
    const righeCarta=cm.map(x=>`<div class="spesa-row sp-carta"><span>${esc(x.causale||"Spesa con la carta")}<small class="sp-forn">con la carta ${esc(cNomi[String(x.carta_id)]||"aziendale")}${x.data?" · "+esc(fdate(x.data)):""}</small></span><b>${eur2(x.importo)}</b><button type="button" class="sdel" data-action="sp-carta-apri" data-id="${x.carta_id}" title="Si cambia dalla carta">💳</button></div>`).join("");
    $("#spese-list").innerHTML=(sp.length||cm.length)?righeCarta+sp.map(x=>{
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
    let md=0, oreSenzaNome=0, mediaSquadra=0, oreLette=true, senzaCosto={};
    try{
      const _l=[{id:lavoroId, ore:_numIt("#j-ore")||0}];
      const _m=await caricaManodopera(curMestiere(),_l);
      md=_m.per[String(lavoroId)]||0;
      oreSenzaNome=_m.senzaNome[String(lavoroId)]||0;
      senzaCosto=(_m.senzaCosto&&_m.senzaCosto[String(lavoroId)])||{};
      mediaSquadra=(_m.tariffe&&+_m.tariffe.media)||0;
      oreLette=(_m.oreLette!==false);
    }catch(e){ oreLette=false; }
    await margineSquadraFresca(senzaCosto);   /* DIFFICILE 6: persona aggiunta da un altro telefono */
    const imp=($("#j-imp")?(_numIt("#j-imp")||0):(+importo||0));
    let rim=0;try{rim=(await rimborsiInFattura([lavoroId]))[String(lavoroId)]||0;}catch(e){}
    const marg=margineLavoro(imp,tot,totFF,md,rim);
    /* ⚠️ 18 agosto 2026 — «Spese: −0,00 €». Il meno era scritto a mano
       davanti al numero, sempre, anche quando di spese non ce n'erano.
       Un meno davanti a zero non vuol dire niente e si legge male: adesso
       il meno compare solo quando c'e' davvero qualcosa da togliere. */
    const _meno=n=>(n>0?"−":"")+eur2(n);
    $("#margine-box").innerHTML=`<span>Lavoro: ${eur2(imp)}</span>`
      +`<span>Spese: <span class="sp">${_meno(tot)}</span></span>`
      +(totFF?`<span>Fatture fornitori: <span class="sp">${_meno(totFF)}</span></span>`:"")
      +(rim?`<span>Rimborso spese in fattura: <span class="pos">+${eur2(rim)}</span></span>`:"")
      +(md?`<span>Manodopera: <span class="sp">${_meno(md)}</span></span>`:"")
      +`<span>Margine: <span class="${marg>=0?'pos':'neg'}">${eur2(marg)}</span></span>`
      /* 12 agosto 2026 (sera) — la riga sotto diceva "contate al costo medio della
         squadra" anche quando la media era ZERO, cioe' quando non le stava contando
         affatto. Adesso il caso "nessun costo orario" ha la sua frase e dice cosa fare. */
      /* 14 nov 2026 (quinto giro, n. 2) — DUE CASI, DUE FRASI. Diceva «7,5 ore
         senza il nome di chi le ha fatte» anche quando il nome c'era e mancava
         il costo orario della persona (succede sempre con «＋ Un'altra
         persona…», che nasce senza costo): mandava a cercare la cosa
         sbagliata. Adesso le ore davvero senza nome hanno la frase di prima;
         quelle di una persona senza costo dicono CHI e' e portano alla sua
         scheda. Il conto e' lo stesso di prima. */
      +margineRigheOre(oreSenzaNome,senzaCosto,mediaSquadra)
      /* ⛔ 22 agosto 2026 — se le ore non si sono potute leggere il margine
         qui sopra e' scritto SENZA la manodopera, e senza questa riga
         sembrerebbe un margine vero. Meglio saperlo che crederci. */
      +(oreLette?"":`<span class="sp-forn" style="flex-basis:100%">⚠️ Non sono riuscito a leggere le ore di questo lavoro: nel margine qui sopra <b>la manodopera non c'è</b>. Ricarica la pagina.</span>`);
    /* 20 nov 2026 (si' di Alex) — sotto il margine, QUALI fatture di fornitori (js/gest-fornitori.js) */
    if(typeof lavFattForn==="function")lavFattForn(lavoroId);
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
    /* 14 nov 2026 (quinto giro, n. 2) — «senzaCosto» dice DI CHI sono le ore
       contate alla media perche' la PERSONA non ha il costo orario (il nome
       c'e'). Serve solo alla frase sotto il margine: il conto non cambia. */
    const perLav={}, conRighe={}, senzaNome={}, senzaCosto={};
    (righeOre||[]).forEach(function(o){
      const h=+o.ore||0; if(!h)return;
      const k=String(o.lavoro_id||"");
      if(!k)return;
      conRighe[k]=true;
      const chi=(o.operatore_id!=null)?String(o.operatore_id):"";
      let c;
      if(chi&&tariffe.per[chi]!=null&&tariffe.per[chi]>0){ c=tariffe.per[chi]; }
      else { c=tariffe.media; senzaNome[k]=(senzaNome[k]||0)+h;
             if(chi&&tariffe.per[chi]!=null){ const m=(senzaCosto[k]=senzaCosto[k]||{}); m[chi]=(m[chi]||0)+h; } }
      perLav[k]=(perLav[k]||0)+h*(+c||0);
    });
    (lavori||[]).forEach(function(l){
      const k=String(l.id);
      if(conRighe[k])return;
      const h=+l.ore||0;
      if(h>0){ perLav[k]=h*tariffe.media; senzaNome[k]=h; }
    });
    return {per:perLav, senzaNome:senzaNome, senzaCosto:senzaCosto};
  }
  function margineLavoro(importo,spese,fattForn,manodopera,rimborsi){
    return (+importo||0)+(+rimborsi||0)-(+spese||0)-(+fattForn||0)-(+manodopera||0);
  }
  /* 24 nov 2026 (giro della pratica, studio) — IL RIMBORSO SPESE IN FATTURA.
     La fattura del geologo (300) entrava nei costi della pratica, ma la
     fattura al cliente la riaddebitava nel «Rimborso spese» (300): la pratica
     diceva «guadagno 1.647,50» quando i 300 tornavano indietro. Adesso il
     rimborso delle fatture collegate alla pratica (gest_fattura_lavori) entra
     nel margine. Una fattura con più pratiche: diviso in parti uguali.
     Contano bozze, emesse e pagate; no annullate, no note di credito. */
  /* 25 nov 2026 (sì di Alex) — LE SPESE FATTE CON LA CARTA PER UN LAVORO.
     Il movimento della carta che dice «per quale lavoro» entra nel guadagno
     di quel lavoro. Quelli che pagano una fattura di un fornitore no: la
     fattura c'e' gia' (contano una volta sola). Torna {lavoro: [righe]}. */
  async function cartePerLavoro(lavoroIds){
    const per={};
    try{
      const ids=(lavoroIds||[]).map(String).filter(Boolean);
      if(!ids.length||!sb||!sbUid)return per;
      const {data,error}=await sb.from("gest_carte_movimenti").select("id,carta_id,importo,causale,data,created_at,lavoro_id,fattura_forn_id,tipo")
        .eq("user_id",sbUid).eq("tipo","spesa").in("lavoro_id",ids);
      if(error)return per;
      (data||[]).forEach(function(m){ if(m.fattura_forn_id)return; const k=String(m.lavoro_id);(per[k]=per[k]||[]).push(m); });
    }catch(e){}
    return per;
  }
  function cartePerLavoroTot(per){const t={};Object.keys(per||{}).forEach(k=>{t[k]=per[k].reduce((a,m)=>a+(+m.importo||0),0);});return t;}
  async function rimborsiInFattura(lavoroIds){
    const per={};
    try{
      const ids=(lavoroIds||[]).map(String).filter(Boolean);
      if(!ids.length||!sb||!sbUid)return per;
      const {data:fl}=await sb.from("gest_fattura_lavori").select("fattura_id,lavoro_id").eq("user_id",sbUid).in("lavoro_id",ids);
      const fids=[...new Set((fl||[]).map(x=>String(x.fattura_id)))];
      if(!fids.length)return per;
      const [{data:ft},{data:tutti}]=await Promise.all([
        sb.from("gest_fatture").select("id,spese_iva,stato,tipo").eq("user_id",sbUid).in("id",fids),
        sb.from("gest_fattura_lavori").select("fattura_id,lavoro_id").eq("user_id",sbUid).in("fattura_id",fids)
      ]);
      (ft||[]).forEach(function(f){
        const r=+f.spese_iva||0;
        if(r<=0||f.stato==="annullata"||/nota/.test(String(f.tipo||"")))return;
        const suoi=(tutti||[]).filter(x=>String(x.fattura_id)===String(f.id)).map(x=>String(x.lavoro_id));
        if(!suoi.length)return;
        const parte=r/suoi.length;
        suoi.forEach(function(l){ if(ids.indexOf(l)>=0)per[l]=(per[l]||0)+parte; });
      });
    }catch(e){}
    return per;
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
      /* 12 nov 2026 — «righe»: le ore lette, per chi deve contarle per persona (Report) */
      return {per:md.per, senzaNome:md.senzaNome, senzaCosto:md.senzaCosto||{}, tariffe:tariffe, oreLette:oreLette, righe:(ore&&ore.data)||[]};
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
    /* la tendina di chi ci ha lavorato: gli stessi nomi della squadra.
       13 nov 2026 (lista «MANCA», n. 7) — si vede SEMPRE. Con la squadra vuota
       prima spariva, e le ore restavano «senza nome». Adesso ci sono anche
       «io» (il titolare, se non e' gia' in squadra) e «un'altra persona»:
       al «+ Aggiungi» entrano in Squadra, come fa Giornate. */
    await oreRiempiChi();
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
    /* 14 nov 2026 (quinto giro, lista «DIFFICILE» n. 1) — «Rende 182,11 € l'ora»
       sembrava il GUADAGNO, ma e' l'importo diviso le ore: le spese non sono
       tolte (il guadagno vero e' il Margine, piu' su). Il conto e' lo stesso,
       cambia la parola: «Incassi … per ogni ora». */
    if(!tot){box.innerHTML='<span>Segna le ore qui sopra: ti dico quanto incassi per ogni ora.</span>';return;}
    if(!imp){box.innerHTML='<span>Ore totali: <b>'+_oreTesto(tot)+'</b></span><span>Metti l\'importo per sapere quanto incassi per ogni ora.</span>';return;}
    const perOra=imp/tot;
    box.innerHTML='<span>'+(pro?'Compenso':'Lavoro')+': '+eur2(imp)+'</span>'
      +'<span>Ore: <b>'+_oreTesto(tot)+'</b></span>'
      +'<span>Incassi <b>'+eur2(perOra)+'</b> per ogni ora</span>';
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
      sb.from("gest_rapportini").select("*")
        .eq("user_id",sbUid).eq("lavoro_id",lavoroId).order("data",{ascending:false}),
      sb.from("gest_ore").select("ore,operatore_id,rapportino_id,data")
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
      lista.innerHTML='<p class="fatt-empty">Nessun rapportino. '+(ruoloUtente==='professionista'?'Li scrivono i collaboratori dalla loro app':'Li scrive la squadra dal telefono')+', oppure lo scrivi tu qui sotto e lo fai firmare al cliente.</p>';
      return;
    }

    /* 13 nov 2026 (lista «MANCA», n. 6) — i nomi anche di chi non e' nella
       squadra di questo reparto: servono a dire se la firma vale ancora */
    const _nomi={};(dipCache||[]).forEach(d=>{_nomi[d.id]=d.nome;});
    /* 15 nov 2026 — anche chi ha SCRITTO il rapportino: una persona aggiunta da un
       altro telefono non e' nella squadra in memoria, e «Scritto da …» spariva */
    const _ignoti=[...new Set(ore.map(o=>o.operatore_id).concat(raps.map(r=>r.creato_da)).filter(i=>i&&!_nomi[i]))];
    if(_ignoti.length){ try{ const ro=await sb.from("gest_operatori").select("id,nome").in("id",_ignoti); ((ro&&ro.data)||[]).forEach(o=>{_nomi[o.id]=o.nome;}); }catch(_){} }
    const nomeDi=id=>_nomi[id]||"";
    const oreDelGiorno=d=>{ const per={}; ore.forEach(o=>{ if(String(o.data)!==String(d))return; const n=nomeDi(o.operatore_id)||"Senza nome"; per[n]=(per[n]||0)+(+o.ore||0); });
      return Object.keys(per).map(n=>({nome:n,ore:Math.round(per[n]*100)/100})); };
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
      /* 13 nov 2026 (lista «MANCA», n. 6) — la firma del cliente */
      const fc=r.firma_cliente;
      if(fc&&fc.img){
        const ok=oreOk&&typeof rapfFirmaValida==="function"&&rapfFirmaValida(r,oreDelGiorno(r.data));
        bits.push(ok?'<span class="rapf-riga-st rapf-riga-st--ok">✓ Firmato da '+esc(fc.nome||"il cliente")+'</span>'
                    :'<span class="rapf-riga-st rapf-riga-st--err">Cambiato dopo la firma: va firmato di nuovo</span>');
      }
      bits.push('<span class="rapf-az"><button type="button" class="btn quick-add" data-action="rapf-apri" data-id="'+esc(k)+'">'
        +(fc&&fc.img?'Apri e scarica il PDF':'Fai firmare al cliente')+'</button></span>');
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
        tiAvviso("Non ho buttato via niente.\n\nPer poter buttare via un rapportino serve un aggiornamento del database: "
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
    if(!(await gconfirm(msg)))return;

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

  /* «Chi le ha fatte»: la squadra, poi io, poi un'altra persona */
  async function oreRiempiChi(){
    const sel=$("#or-chi"); if(!sel)return;
    const nomi=(dipCache||[]);
    let tit="";
    try{ if(typeof giorLeggiTitolare==="function") tit=await giorLeggiTitolare(); }catch(_){}
    const io=(typeof _gIo==="function")?_gIo():"";
    const norm=x=>String(x||"").toLowerCase().trim();
    const ioInSquadra=nomi.some(d=>String(d.id)===String(io)||(tit&&norm(d.nome)===norm(tit)));
    let v=sel.value||"";
    if(!v){ try{ v=localStorage.getItem("ore_chi_"+sbUid)||""; }catch(_){} }
    if(!v&&!nomi.length) v="__io__";
    const d=$("#or-data"); if(d&&!d.value) d.value=todayStr();
    sel.innerHTML='<option value="">Scegli chi</option>'
      +nomi.map(d=>'<option value="'+esc(String(d.id))+'">'+esc(d.nome)+(String(d.id)===String(io)?' (io)':'')+'</option>').join("")
      +(ioInSquadra?'':'<option value="__io__">'+esc(tit?tit+' (io)':'Io')+'</option>')
      +'<option value="__nuovo__">＋ Un\'altra persona…</option>';
    if([...sel.options].some(o=>o.value===v)&&v!=="__nuovo__") sel.value=v;
    oreChiCambia();
  }
  function oreChiCambia(){
    const sel=$("#or-chi"), box=$("#or-chi-nuovo-box"); if(!sel||!box)return;
    box.style.display=sel.value==="__nuovo__"?"":"none";
    const boxC=$("#or-chi-costo-box"); if(boxC) boxC.style.display=sel.value==="__nuovo__"?"":"none";
  }
  document.addEventListener("change",e=>{ if(e.target&&e.target.id==="or-chi"){ oreChiCambia(); if(e.target.value==="__nuovo__"){ const n=$("#or-chi-nuovo"); if(n)n.focus(); } } });
  /* la persona scelta, come id di gest_operatori: la crea se serve */
  async function oreChiId(){
    const sel=$("#or-chi"); if(!sel)return {id:null};
    const v=sel.value;
    if(!v) return {manca:true};
    if(v!=="__io__"&&v!=="__nuovo__") return {id:v};
    let nome="", costo=null, costoScritto=false;
    if(v==="__nuovo__"){
      nome=String(($("#or-chi-nuovo")||{}).value||"").trim();
      if(!nome){ campoManca("#or-chi-nuovo","Manca il nome della persona: scrivilo qui."); return {stop:true}; }
      /* 14 nov 2026 (lista «MANCA», n. 3) — il costo orario, se l'ha scritto. Vuoto va
         bene (nessun costo); scritto male o sotto zero si ferma, come nella scheda
         della persona (dipCostoStorto): un refuso non deve diventare un costo. */
      const tc=String(($("#or-chi-costo")||{}).value||"").trim();
      if(tc!==""){
        costoScritto=true;
        costo=_numIt("#or-chi-costo");
        if(costo==null){ campoManca("#or-chi-costo","Non ho capito il costo orario: scrivilo come 22,50."); return {stop:true}; }
        if(costo<0){ campoManca("#or-chi-costo","Il costo orario non può essere negativo."); return {stop:true}; }
        if(typeof costoOrarioTondo==="function") costo=costoOrarioTondo(costo);   /* DIFFICILE 7: due decimali */
      }
    }else{
      try{ if(typeof giorLeggiTitolare==="function") nome=await giorLeggiTitolare(); }catch(_){}
      nome=nome||"Io";
    }
    nome=nome.charAt(0).toUpperCase()+nome.slice(1);
    const gia=(dipCache||[]).find(d=>String(d.nome||"").toLowerCase().trim()===nome.toLowerCase());
    if(gia){
      /* 15 nov 2026 (sesto giro, DIFFICILE n. 1) — la persona C'E' GIA': le ore
         vanno a lei e la sua scheda non si tocca. Prima il costo scritto spariva
         senza dirlo, e nome e costo restavano nelle due caselle nascoste (te li
         ritrovavi la volta dopo). Adesso le caselle si svuotano e, se avevi
         scritto un costo, oreAdd lo dice sotto «Chi le ha fatte». */
      if(v==="__nuovo__"){
        const n0=$("#or-chi-nuovo"); if(n0) n0.value="";
        const c0=$("#or-chi-costo"); if(c0) c0.value="";
        return {id:gia.id, gia:String(gia.nome||nome), costoIgnorato:costoScritto};
      }
      return {id:gia.id};
    }
    /* DIFFICILE 7: sopra i 200 EUR l'ora prima si chiede (solo se la persona nasce adesso) */
    if(costo!=null&&typeof costoOrarioSicuro==="function"&&!(await costoOrarioSicuro(costo))){ const _ec=$("#or-chi-costo"); if(_ec){ try{_ec.focus();_ec.select();}catch(_){} } return {stop:true}; }
    const {data,error}=await sb.from("gest_operatori").insert(Object.assign({user_id:sbUid,mestiere_id:curMestiere(),nome:nome.slice(0,60)},costo!=null?{costo_orario:costo}:{})).select("id,nome");
    if(error||!data||!data.length){ toast("Non riesco ad aggiungere "+nome+" alla squadra: "+((error&&error.message)||"nessuna riga")); return {stop:true}; }
    if(Array.isArray(dipCache)) dipCache.push({id:data[0].id,nome:data[0].nome,costo_orario:costo,ruolo:"operaio",permessi:{},docs:[]});
    if(v==="__io__"&&typeof _gSetIo==="function") _gSetIo(data[0].id);
    const n=$("#or-chi-nuovo"); if(n) n.value="";
    const nc=$("#or-chi-costo"); if(nc) nc.value="";
    return {id:data[0].id,nuovo:nome};
  }

  async function oreAdd(){
    if(!sbUid||!oreLavoroId)return;
    if(!oreTabellaOk){toast("Prima serve l'aggiornamento del database (sql/gest-ore-e-crediti.sql)");return;}
    /* mezz'ora si scrive "2,5": con type="number" non si poteva proprio */
    const ore=_numIt("#or-ore")||0;
    if(!(ore>0)){toast("Scrivi quante ore, per esempio 2,5");return;}
    /* una riga sola di 1.250 ore e' un dito scivolato, non una giornata */
    if(ore>24){toast("Sono tante: una riga sola non può avere più di 24 ore");return;}
    oreGiaAvviso("");
    const chi=await oreChiId();
    if(chi.manca){ campoManca("#or-chi","Manca chi le ha fatte: sceglilo qui."); return; }
    if(chi.stop) return;
    const obj={user_id:sbUid,mestiere_id:curMestiere(),lavoro_id:oreLavoroId,
      data:$("#or-data").value||todayStr(), ore,
      nota:$("#or-nota").value.trim()||null,
      operatore_id:chi.id||null};
    const {error}=await sb.from("gest_ore").insert(obj);
    if(error){toast("Errore: "+error.message);return;}
    try{ localStorage.setItem("ore_chi_"+sbUid,String(chi.id||"")); }catch(_){}
    $("#or-ore").value="";$("#or-nota").value="";
    const _sel=$("#or-chi"); if(_sel) _sel.value=String(chi.id||"");
    await renderOreBlock(oreLavoroId);
    renderRapportiniBlock(oreLavoroId);   /* la riga «aggiunte da te» deve restare vera */
    await _oreSalvaTotale();
    if(typeof oreChiCambia==="function") oreChiCambia();   /* le due caselle di «Un'altra persona» tornano nascoste */
    if(chi.costoIgnorato) oreGiaAvviso(chi.gia+" c'è già in squadra: le ore sono andate a "+chi.gia+". Il costo orario si scrive nella sua scheda.");
    toast("Ore aggiunte ✔");
  }
  /* 15 nov 2026 (DIFFICILE n. 1) — la riga ambra sotto «Chi le ha fatte»: resta
     finche' non cambi persona o non aggiungi altre ore (un toast spariva in 2,6 s).
     Vuota = si toglie. Stesso stile dell'avviso «Manca l'IBAN». */
  function oreGiaAvviso(testo){
    const vecchio=document.getElementById("or-chi-gia"); if(vecchio) vecchio.remove();
    if(!testo) return;
    const sel=$("#or-chi"); if(!sel) return;
    const d=document.createElement("div");
    /* subito sotto la tendina, largo quanto il modulo (ore-c--tutta: la griglia delle ore) */
    d.id="or-chi-gia"; d.className="campo-aiuto fa-iban-manca ore-c--tutta"; d.textContent=testo;
    const riga=sel.closest("label.ore-c");
    if(riga) riga.insertAdjacentElement("afterend",d); else sel.parentNode.appendChild(d);
  }
  document.addEventListener("change",e=>{ if(e.target&&e.target.id==="or-chi") oreGiaAvviso(""); });
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
    /* 15 nov 2026 — le ore sono cambiate: la Squadra («3 giorni questo mese») e
       l'Assistente («Il tuo mese») vanno riletti. Prima restavano quelli di quando
       avevi aperto la pagina. Di qui passano aggiungi, togli e rapportino nel cestino. */
    try{ if(typeof rinfresca==="function") rinfresca("squadra","riepilogo"); }catch(e){}
    if(!sbUid||!oreLavoroId)return;
    const campo=$("#j-ore");
    if(!campo)return;                       /* modulo chiuso: non tocco niente */
    const v=String(campo.value||"").trim();
    const tot=v===""?null:(_numeroIt(v)||0);  /* vuoto = nessuna ora, non zero finto */
    try{ await sb.from("gest_lavori").update({ore:tot}).eq("id",oreLavoroId).eq("user_id",sbUid); }catch(e){}
    /* 14 nov 2026 (quinto giro, n. 2) — il margine si rifa' a ogni cambio di ore:
       aggiunte 2 ore, la riga sotto diceva ancora 7,5. Di qui passano tutte le
       strade che cambiano le ore (aggiungi, togli, rapportino nel cestino). */
    try{ if(speseLavoroId&&String(speseLavoroId)===String(oreLavoroId)&&$("#margine-box")) await renderSpeseBlock(oreLavoroId); }catch(e){}
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
    /* 20 nov 2026 (si' di Alex, foto prima) — LA TARIFFA DI OGNI PERSONA.
       Prima tutte le righe prendevano la tariffa dei Dati azienda: l'ora del
       praticante costava al cliente quanto quella del titolare. Adesso se la
       persona ha la sua tariffa (gest_operatori.tariffa_oraria, scheda della
       persona) vale quella; se e' vuota, quella dei Dati azienda come prima. */
    const tariffaDi=function(id){
      const d=(dipCache||[]).find(y=>String(y.id)===String(id));
      if(d&&d.tariffa_oraria!=null&&d.tariffa_oraria!=="")return +d.tariffa_oraria||0;
      return tariffa;
    };
    const voce=pro?"Ore di studio":"Ore di lavoro";
    let _sueTariffe=0;
    const _righe=perChi.map(function(g,i){
      const chi=nomeDi(g.chi), tp=tariffaDi(g.chi);
      if(tp!==tariffa)_sueTariffe++;
      return {descrizione: chi?(voce+" — "+chi):voce,
              qta: Math.round(g.ore*100)/100,
              prezzo: (tp===null?"":tp),
              unita:"ora",
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
      _noteOre:(_righe.some(r=>r.prezzo==="")
        ? "Le ore sono arrivate dal registro della pratica ("+_numTesto(totOre)+" in tutto). "
          +"Dove il prezzo dell'ora manca scrivilo qui, oppure mettilo una volta sola: nella scheda della persona («Tariffa al cliente») o nei Dati azienda («Quanto chiedi all'ora»)."
        : (_sueTariffe
          ? "Le ore sono arrivate dal registro della pratica ("+_numTesto(totOre)+" in tutto), ognuna al prezzo della sua persona (scheda della persona, se no Dati azienda). Cambialo pure riga per riga."
          : "Le ore sono arrivate dal registro della pratica ("+_numTesto(totOre)+" in tutto), al prezzo scritto nei Dati azienda. Cambialo pure riga per riga."))
    });
    toast(_righe.length===1?"Una riga portata dalle ore":(_righe.length+" righe portate dalle ore"));
  }

  /* ---- PREVENTIVI ---- */
  let prevCache=[], prevFilter="tutti", prevRigheCount=0;
  async function renderPreventivi(){
    filoMetti("preventivi","preventivi");
    const box=$("#prev-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML=`<div class="empty"><div class="ic">📑</div><p>Nessun preventivo</p><small>Accedi per creare i preventivi</small></div>`;return;}
    listaCarica(box,"i preventivi");   /* 17 nov 2026 — la scritta mentre si legge (gest-schede-clienti.js) */
    let _rPv,_rCl;
    try{ [_rPv,_rCl]=await Promise.all([
      sb.from("gest_preventivi").select("*").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("created_at",{ascending:false}),
      /* 9 agosto 2026 — si leggono ANCHE i clienti nel cestino: prima il
         preventivo di un cliente cestinato mostrava un trattino e non si
         capiva piu' di chi fosse. */
      ((window.cestinoAttivo&&window.cestinoAttivo())
        ? sb.raw("gest_clienti").select("id,nome,eliminato_il")
        : sb.from("gest_clienti").select("id,nome")
      ).eq("user_id",sbUid).or(_cliOr(curMestiere()))
    ]); }catch(e){}
    /* 11 nov 2026 — senza rete non si dice «Ancora nessun preventivo» (listaNonLetta) */
    if(letturaKo(_rPv)){listaNonLetta(box,"i preventivi","preventivi","#prev-viste");return;}
    const pv=_rPv.data, cl=_rCl&&_rCl.data;
    prevCache=pv||[];
    /* 24 nov 2026 — studio: numero della linguetta (js/gest-studio-unite.js) */
    try{if(typeof stSegnaLetto==="function")stSegnaLetto("preventivi");}catch(e){}
    const cliMap=Object.fromEntries((cl||[]).map(c=>[c.id,(c.nome||"")+(c.eliminato_il?" (nel cestino)":"")]));
    let tot={};
    if(prevCache.length){
      let _rRr=null; try{ _rRr=await sb.from("gest_preventivo_righe").select("preventivo_id,qta,prezzo").in("preventivo_id",prevCache.map(p=>p.id)); }catch(e){}
      /* senza le voci i totali uscirebbero a 0,00 €: meglio dire che non si leggono */
      if(letturaKo(_rRr)){listaNonLetta(box,"i preventivi","preventivi","#prev-viste");return;}
      const rr=_rRr.data;
      (rr||[]).forEach(r=>{tot[r.preventivo_id]=(tot[r.preventivo_id]||0)+impRiga(r.qta,r.prezzo);});
    }
    /* ===== 9 agosto 2026 — a schermo lo STESSO numero del PDF =====
       Prima la colonna "Importo" mostrava l'imponibile (10.000) mentre il PDF
       in mano al cliente diceva 11.000: al telefono si diceva la cifra
       sbagliata. Ora si mostra il totale finito, quello che il cliente legge.
       Per gli studi resta il "da incassare" della parcella (compenso + cassa
       + spese + IVA - ritenuta): anche li' è la cifra del documento. */
    /* 13 nov 2026 (quarto giro) — «IVA esclusa» E' SENZA IVA MA CON LO SCONTO.
       L'elenco mostrava la somma delle voci (467,97 €) come «IVA esclusa»,
       mentre il preventivo aperto e il PDF dicono 444,57 € (meno lo sconto).
       `impNetto` e' l'imponibile dopo lo sconto, dalla stessa formula del
       preventivo (prevContiImpresa): vale per la riga, per la scheda sul
       telefono e per il totale in cima. Senza sconto e' uguale a prima. */
    const impNetto={};
    const totCli={};
    prevCache.forEach(function(p){
      const base=tot[p.id]||0;
      impNetto[p.id]=ruoloUtente==='professionista'?base:prevContiImpresa(base,p.iva_perc,prevSconto(base,p)).imponibile;
      if(ruoloUtente==='professionista'){
        const c=calcolaParcella(base,p.cassa_perc,p.iva_perc,!!p.ritenuta,p.ritenuta_perc||20,p.spese_forfait);
        totCli[p.id]=c.totale;
      }else{
        /* 10 nov 2026 — meno lo sconto, piu' l'IVA se c'e' (senza aliquota e
           senza sconto resta la somma delle voci, com'era) */
        totCli[p.id]=prevTotaleCliente(base,p);
      }
    });
    const _conIva=p=>ruoloUtente==='professionista'
      ? true
      : (p.iva_perc!=null&&p.iva_perc!=="");
    const L=prevCache.filter(p=>prevFilter==="tutti"||p.stato===prevFilter);
    const conta={};PREV_VISTE.forEach(v=>conta[v.k]=prevCache.filter(p=>v.k==="tutti"||p.stato===v.k).length);
    /* 7 nov 2026 — IL TOTALE IN CIMA MISCHIAVA MELE E PERE. Sommava il totale
       con l'IVA dei preventivi che hanno l'aliquota e l'imponibile di quelli
       che non ce l'hanno: 982,10 (IVA inclusa) + 2.800 (IVA esclusa) =
       3.782,10, un numero che non e' ne' l'uno ne' l'altro. Per le imprese
       adesso si sommano gli imponibili, e lo si scrive. Lo studio tecnico
       resta sul «da incassare» della parcella, che e' sempre lo stesso conto. */
    const somma=ruoloUtente==='professionista'
      ? L.reduce((s,p)=>s+(totCli[p.id]||0),0)
      : L.reduce((s,p)=>s+(impNetto[p.id]||0),0);
    const sommaEt=ruoloUtente==='professionista'?'':' <small class="prev-iva-tot">IVA esclusa</small>';
    renderTabella({
      id:"prev", box:"#prev-list",
      viste:"#prev-viste", visteDef:PREV_VISTE, vista:prevFilter, conta:conta, azioneVista:"prev-filtro",
      vuoto:tabVuoto(
        prevCache.length?"Nessun preventivo con questo filtro":"Ancora nessun preventivo",
        prevCache.length?"Prova a cambiare vista qui sopra.":"Righe con quantità e prezzo, totale con l’IVA e il PDF pronto da mandare al cliente. Quando il cliente accetta, il preventivo diventa "+(ruoloUtente==='professionista'?"una pratica":"un lavoro")+" con un clic.",
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
            /* 7 nov 2026 — collaudo della semplicita': nella riga il numero grande e'
               SEMPRE senza IVA, come il totale in cima; se l'IVA e' indicata, sotto
               piccolo «con IVA …» (la cifra del PDF). Prima si mischiavano. */
            (ruoloUtente==='professionista'
              ? eur(totCli[p.id]||0)+'<small class="prev-iva">da incassare</small>'
              : eur(impNetto[p.id]||0)+'<small class="prev-iva">IVA esclusa</small>'
                +(_conIva(p)?'<small class="prev-iva prev-coniva">con IVA '+eur2(totCli[p.id]||0)+'</small>':''))
          ],
          menu:prevVoci(p)
        };
      }),
      numeri:prevNumeri(prevCache,totCli),
      totale:{testo:L.length+" "+(L.length===1?"preventivo":"preventivi"),valore:eur(somma)+sommaEt},
      cards:()=>L.map(p=>prevCard(p,cliMap,totCli,_conIva(p),impNetto)).join("")
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
    /* 6 nov 2026 — via «In attesa di risposta» e «Il più vecchio senza
       risposta» (ok di Alex): li dicono gia' i filtri «Bozze»/«Inviati» e il
       Riepilogo («preventivi fermi da più di una settimana»). */
    return numFila([
      false?numCard({
        domanda:"In attesa di risposta",
        numero:String(attesa.length),
        sotto:eur(valore)+" fermi",
        tono:"attesa"}):null,
      false?numCard({
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
  function prevCard(p,cliMap,tot,conIva,imp){
    /* 7 nov 2026 — sotto l'importo si dice SEMPRE se l'IVA c'e' o no: nella
       stessa lista stavano 982,10 con l'IVA e 2.800 senza, uguali a vedersi */
    const et=ruoloUtente==='professionista'?'da incassare':(conIva?'IVA inclusa':'IVA esclusa');
    return `<div class="job">
      <div class="job-top"><div class="job-cli">N. ${esc(String(p.numero||"—"))} — ${esc(p.titolo||"")}</div><span class="stato ${p.stato}">${PREV_LAB[p.stato]||p.stato}</span></div>
      <div class="job-meta">
        ${p.cliente_id?`<span>👤 ${esc(cliMap[p.cliente_id]||"—")}</span>`:""}
        <span>📅 ${fdate(p.data)}</span>
        ${(ruoloUtente!=='professionista'&&imp)
          ? `<span class="prev-tot">${eur2(imp[p.id]||0)}</span><span class="prev-iva-card">IVA esclusa${conIva?` · con IVA ${eur2(tot[p.id]||0)}`:""}</span>`
          : `<span class="prev-tot">${eur2(tot[p.id]||0)}</span><span class="prev-iva-card">${et}</span>`}</div>
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
    /* 1 novembre 2026 — «Invia al cliente»: link, WhatsApp, email, QR e firma col dito.
       Sta in js/gest-invia-cliente.js. E' il primo: e' quello che si fa piu' spesso. */
    /* 7 nov 2026 — «top:true» = sta in vista in alto nella finestra (le 3 cose
       di tutti i giorni); le altre vanno in «Altro ▾» (gest-schede-clienti.js) */
    const v=[{lab:"📤 Invia al cliente",action:"prev-invia",data:{id:p.id},top:true},{lab:"📄 Scarica PDF",action:"prev-pdf",data:{id:p.id}}];
    /* la lettera d'incarico è un obbligo di legge per i tecnici: sta accanto al PDF */
    if(ruoloUtente==='professionista')v.push({lab:"📝 Lettera d'incarico",action:"prev-incarico",data:{id:p.id}});
    /* per chi lavora in cantiere il gemello è la conferma d'ordine */
    else v.push({lab:"📝 Conferma d'ordine",action:"prev-ordine",data:{id:p.id}});
    /* 16 ottobre 2026 — il capitolato: cosa si fa, con quali materiali, cosa e' compreso e cosa no.
       Sta in js/gest-capitolato.js e vale per tutti i profili. */
    v.push({lab:"📋 Capitolato",action:"prev-capitolato",data:{id:p.id}});
    if(p.stato==="bozza")v.push({lab:"📤 Segna inviato",action:"prev-stato",data:{id:p.id,v:"inviato"}});
    if(p.stato==="bozza"||p.stato==="inviato"){
      v.push({lab:"✔ Accettato → crea lavoro",action:"prev-to-lavoro",data:{id:p.id},top:true});
      v.push({lab:"✕ Rifiutato",action:"prev-stato",data:{id:p.id,v:"rifiutato"}});
    }
    /* 12 agosto 2026 (sera) — la scorciatoia che mancava: dal preventivo alla
       fattura, senza rifare la strada lunga da "Fatture -> + Nuova". */
    /* 27 nov 2026 — in alto solo quando il cliente ha accettato: prima stava
       in alto anche su una bozza (fattura prima del sì). Resta in «Altro». */
    v.push({lab:"\ud83e\uddfe Crea la fattura da qui",action:"prev-to-fatt",data:{id:p.id},top:p.stato==="accettato"});
    if(p.stato==="rifiutato")v.push({lab:"↩ Riapri",action:"prev-stato",data:{id:p.id,v:"bozza"}});
    v.push({sep:true});
    v.push({lab:"✏ Modifica",action:"edit-prev",data:{id:p.id}});
    v.push({lab:"🗑 Elimina",action:"del-prev",data:{id:p.id},del:true});
    return v;
  }
