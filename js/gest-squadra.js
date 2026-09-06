/* ═══ FETTA D · LA SQUADRA ════════════════════════════════════════════
   Staccata da gestionale-app.html il 6 settembre 2026 (righe 5161-5795).

   COSA C'E' DENTRO — la sezione «Squadra» tutta intera, un blocco solo:
   renderDip (l'elenco), le tabelle SQ_RUOLO / MANSIONI / CONTRATTI, gli
   avvisi sui documenti scaduti (dipAvvisi, dipBadge), la lettura dei campi
   della scheda (dipCostoStorto, dipCampiExtra), le voci di menu e le card
   (dipVoci, dipCard), i permessi dell'operatore (PERMS, RUOLO_PRESET,
   applyRuoloPreset, permAvviso), e il modulo della persona da capo a fondo
   (squadraApri, squadraForm, ensureMestiere, squadraAdd, squadraSave,
   dipElimina). Taglio puro: dentro non e' cambiato un carattere.

   COSA NON C'E', E PERCHE'
   - ⛔ `dipCache` RESTA NELLA PAGINA (riga ~831). La leggono anche la
     Galleria e l'Agenda: portarla via qui l'avrebbe tolta a loro.
   - Lo Scadenzario (tipiScadenza, scadCache, scadenzePersone, renderScadenze,
     scadForm, saveScad) resta nella pagina: tiene INSIEME le scadenze delle
     persone e quelle dei mezzi, e il Riepilogo lo legge. E' un aiuto comune,
     non un pezzo della Squadra.
   - `dipForm`/`saveDip` (~riga 8800) sono un'altra cosa: la persona vista
     da dentro un lavoro. Restano dove sono.
   - `fillOperai`, `caricaManodopera`, `costoManodopera`: li usano i lavori
     e i rapportini. Restano nella pagina.

   ⛔ LE DUE REGOLE DI QUESTO FILE
   1. Non e' chiuso dentro niente (niente IIFE): vive nello stesso spazio
      della pagina e vede sb, sbUid, cur, dipCache, esc, toast, $ senza che
      nessuno glieli passi. Per la stessa ragione, un nome dichiarato anche
      nella pagina spegnerebbe TUTTO il gestionale al caricamento (schermo
      bianco).
   2. Al primo livello qui non si puo' USARE niente che stia nella pagina:
      questo file parte PRIMA. SQ_RUOLO, MANSIONI, CONTRATTI, PERMS e
      RUOLO_PRESET sono elenchi scritti a mano, non chiamano niente: per
      questo possono stare al primo livello.

   Il banco che protegge tutto questo:
   prove-claude/banchi-fissi/smontaggio/banco-fette.js
   ═══════════════════════════════════════════════════════════════════════ */

  async function renderDip(){
    const box=$("#dip-list");if(!box)return;
    if(!sb){box.style.display="block";box.innerHTML=tabVuoto("Squadra non disponibile","Connessione non riuscita.");return;}
    if(!sbUid){box.style.display="block";box.innerHTML=tabVuoto("Accedi per gestire la squadra","Entra nel pannello per invitare le persone.");return;}
    const [{data:ops},{data:membri}]=await Promise.all([
      sb.from("gest_operatori").select("*").eq("mestiere_id",curMestiere()),
      sb.from("gest_membri").select("operatore_id,codice,stato,ruolo,permessi")
    ]);
    const mB=Object.fromEntries((membri||[]).map(x=>[x.operatore_id,x]));
    /* dipCache alimenta il modulo di modifica: deve contenere tutti i campi della persona */
    dipCache=(ops||[]).map(o=>{const inv=mB[o.id]||{};return Object.assign({},o,{ruolo:inv.ruolo||"operaio",permessi:inv.permessi||{}});});
    let L=(ops||[]).map(o=>{
      const inv=mB[o.id]||{}, dc=dipCache.find(d=>d.id===o.id)||{};
      const link=inviteLink(inv.codice||"");
      return Object.assign({},o,{ruolo:dc.ruolo||"operaio",
        attivo:inv.stato==="attivo",codice:inv.codice||"",link:link,
        wa:"https://wa.me/?text="+encodeURIComponent("Ciao! Ti ho aggiunto alla squadra. Apri questo link per collegarti: "+link)});
    });
    if(dipQ){const q=dipQ.toLowerCase();
      L=L.filter(o=>[o.nome,o.telefono,o.mansione,SQ_RUOLO[o.ruolo]].some(x=>(x||"").toLowerCase().includes(q)));}
    renderTabella({
      id:"dip", box:"#dip-list",
      vuoto:dipQ?tabVuotoCerca(dipQ):tabVuoto("Chi lavora con te",
        "Nome, mansione in cantiere e costo orario. Qui metti anche visita medica, formazione sicurezza e documenti: quando una data si avvicina te lo dice il Riepilogo, senza che tu debba ricordartelo.",
        _SVGV+'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        {t:"+ Aggiungi la prima persona",a:"new-dip"}),
      colonne:[{lab:"Nome",w:"24%"},{lab:"Mansione",w:"18%",cls:"c-chi"},{lab:"Telefono",w:"18%",cls:"c-chi"},
               {lab:"Documenti",w:"16%"},{lab:"Stato",w:"14%"},{lab:"",w:"10%"}],
      righe:L.map(o=>({
        id:o.id,
        click:{action:"sq-edit",data:{id:o.id}},
        celle:[
          `<span class="c-nome">${esc(o.nome||"—")}</span>`,
          esc(o.mansione||SQ_RUOLO[o.ruolo]||"—"),
          esc(o.telefono||"—"),
          dipBadge(o),
          `<span class="stato ${o.attivo?"fatto":"da_fare"}">${o.attivo?"Attivo":"Invitato"}</span>`,
          ""
        ],
        menu:dipVoci(o)
      })),
      cards:()=>L.map(o=>dipCard(o)).join("")
    });
  }
  const SQ_RUOLO={operaio:"Operaio",preposto:"Preposto",segretaria:"Segretaria"};

  /* ---- SCHEDA PERSONA: mansione, costo orario, documenti di sicurezza ----
     La mansione è il mestiere in cantiere (muratore, manovale...), diversa dal
     "ruolo nell'app" che decide solo cosa vede l'operatore sul telefono.
     Il costo orario servira' per il costo della manodopera sui lavori.
     Le scadenze (visita medica, formazione, documenti) generano gli avvisi. */
  const MANSIONI=["Muratore","Manovale","Capocantiere","Carpentiere","Ferraiolo","Piastrellista",
    "Imbianchino","Cartongessista","Elettricista","Idraulico","Fabbro","Falegname","Gruista",
    "Escavatorista","Autista","Operatore macchine","Geometra","Impiegato","Altro"];
  const CONTRATTI=["Tempo indeterminato","Tempo determinato","Apprendistato","Part-time","Stagionale","A chiamata","Collaborazione","Altro"];

  /* Restituisce le scadenze scadute o vicine (entro 30 giorni) di una persona. */
  function dipAvvisi(o){
    if(!o)return [];
    const oggi=new Date();oggi.setHours(0,0,0,0);
    /* ⚠️ 19 agosto 2026 — «Visita medica scaduto». Il participio era uno
       solo per tutte e quattro, e su due usciva col genere sbagliato.
       Adesso ogni voce si porta dietro il suo: e' l'unico modo, in
       italiano, di non doverci pensare ogni volta che se ne aggiunge una. */
    const voci=[["Visita medica",o.visita_medica_scadenza,"scaduta"],
                ["Formazione sicurezza",o.formazione_scadenza,"scaduta"],
                ["Documento",o.documento_scadenza,"scaduto"],
                ["Permesso di soggiorno",o.permesso_scadenza,"scaduto"]];
    const out=[];
    voci.forEach(function(v){
      if(!v[1])return;
      const d=new Date(String(v[1])+"T00:00:00");
      if(isNaN(d))return;
      const g=Math.round((d-oggi)/86400000);
      if(g<0)out.push({lab:v[0],giorni:g,scaduto:true,fin:v[2]||"scaduto"});
      else if(g<=30)out.push({lab:v[0],giorni:g,scaduto:false,fin:v[2]||"scaduto"});
    });
    return out;
  }
  /* Pallino riassuntivo da mettere in tabella e nelle card. */
  function dipBadge(o){
    const a=dipAvvisi(o);
    if(!a.length)return '<span class="stato fatto">In regola</span>';
    const scaduti=a.filter(function(x){return x.scaduto;});
    if(scaduti.length)return '<span class="stato da_fare" style="background:#fdecea;color:#b3261e" title="'+esc(scaduti.map(function(x){return x.lab;}).join(", "))+'">'+scaduti.length+' scadut'+(scaduti.length>1?'i':'o')+'</span>';
    return '<span class="stato da_fare" style="background:#fdf3e3;color:#b26a00" title="'+esc(a.map(function(x){return x.lab+" fra "+x.giorni+" gg";}).join(", "))+'">In scadenza</span>';
  }
  /* Legge tutti i campi nuovi dal modulo. Vuoto diventa null, non stringa vuota:
     così le colonne data non danno errore su Postgres. */
  /* 13 agosto 2026 — il costo orario scritto male non deve cancellare quello
     buono. _numIt torna null sia per "casella vuota" (legittimo: nessun costo)
     sia per "abc" o "o22,50" (un refuso). I due casi vanno distinti QUI, se no
     un dito scivolato azzerava il costo con il messaggio "Aggiornato ✔" e da
     quel momento i lavori di quella persona perdevano la manodopera. */
  function dipCostoStorto(){
    const e=$("#d-costo"); if(!e)return "";
    const t=String(e.value||"").trim();
    if(t==="")return "";                       /* vuoto = nessun costo, legittimo */
    const n=_numIt("#d-costo");
    if(n==null)return "Non ho capito il costo orario: scrivilo come 22,50";
    /* un costo orario sotto zero entrerebbe nel margine dei lavori e lo
       gonfierebbe: le altre due caselle dei soldi i negativi li rifiutano gia' */
    if(n<0)return "Il costo orario non può essere negativo";
    return "";
  }
  function dipCampiExtra(){
    const v=function(id){const e=$(id);return e?String(e.value||"").trim():"";};
    /* la vecchia n() e' stata tolta: era una terza copia della regola dei
       numeri e per giunta codice morto, perche' la casella era type="number" e
       la virgola non le arrivava mai. Adesso si usa _numIt come dappertutto. */
    const o=function(x){return x===""?null:x;};
    return {
      mansione:o(v("#d-mansione")),
      /* 13 agosto 2026 — era type="number" col placeholder "Es. 22.50": chi
         scriveva 22,50 come si scrive in italiano si vedeva CANCELLARE il costo
         orario (null in colonna) con il messaggio "Aggiornato ✔", e da quel
         momento i suoi lavori perdevano la manodopera dal margine. */
      /* null vuol dire "nessun costo orario", ed e' legittimo se la casella e'
         VUOTA. Se invece dentro c'e' scritto qualcosa che non e' un numero, il
         null e' un refuso: lo intercetta dipCampiOk, qui sotto, se no si
         cancellava il costo con il messaggio "Aggiornato ✔". */
      costo_orario:_numIt("#d-costo"),
      visita_medica_scadenza:o(v("#d-visita")),
      formazione_scadenza:o(v("#d-formazione")),
      attestati:o(v("#d-attestati")),
      documento_numero:o(v("#d-doc-num")),
      documento_scadenza:o(v("#d-doc-scad")),
      permesso_scadenza:o(v("#d-permesso")),
      data_nascita:o(v("#d-nascita")),
      codice_fiscale:o(v("#d-cf").toUpperCase()),
      email:o(v("#d-email")),
      data_assunzione:o(v("#d-assunzione")),
      tipo_contratto:o(v("#d-contratto")),
      emergenza_nome:o(v("#d-emerg-nome")),
      emergenza_telefono:o(v("#d-emerg-tel"))
    };
  }
  /* Copia link, WhatsApp e Rimuovi accesso esistono solo se la persona ha un
     codice d'invito: senza codice non c'e' niente da mandare né da revocare. */
  function dipVoci(o){
    const v=[{lab:"✏ Modifica",action:"sq-edit",data:{id:o.id}}];
    if(o.codice){
      v.push({lab:"🔗 Copia link",action:"sq-copy",data:{link:o.link}});
      v.push({lab:"💬 Invia su WhatsApp",action:"sq-wa",data:{wa:o.wa}});
      /* 5 set 2026 — il QR: in cantiere non si scrive un indirizzo a mano e
         non sempre si ha il numero. Si inquadra e si e' dentro. */
      v.push({lab:"📷 Mostra il QR",action:"sq-qr",data:{link:o.link,nome:o.nome||""}});
      v.push({sep:true});
      v.push({lab:"🚫 Rimuovi accesso",action:"sq-revoca",data:{id:o.id,nome:o.nome},del:true});
    }
    /* 12 agosto 2026 (sera) — c'era solo «Rimuovi accesso», che toglie la
       password ma lascia la persona in elenco per sempre. */
    if(!o.codice)v.push({sep:true});
    v.push({lab:"🗑 Elimina",action:"sq-del",data:{id:o.id},del:true});
    return v;
  }
  function dipCard(o){
    const av=dipAvvisi(o);
    const scaduti=av.filter(x=>x.scaduto);
    /* la barretta dice lo stato dei documenti senza dover leggere:
       rossa se qualcosa è già scaduto, arancione se sta per scadere */
    const tono=scaduti.length?"t-err":(av.length?"t-attesa":(o.attivo?"t-ok":"t-neutro"));
    const nota=scaduti.length
      ? "⚠ "+esc(scaduti.length===1
                 ? (scaduti[0].lab+" "+scaduti[0].fin)
                 : (scaduti.map(x=>x.lab).join(", ")+" scaduti"))
      : (av.length?"⏳ "+esc(av.map(x=>x.lab+" fra "+x.giorni+" gg").join(", ")):"");
    return schedaJob({
      tono, titolo:esc(o.nome),
      destra:`<span class="stato ${o.attivo?"fatto":"bozza"}">${o.attivo?"Attivo":"Invitato"}</span>`,
      meta:[o.mansione?"👷 "+esc(o.mansione):"", o.telefono?"📞 "+esc(o.telefono):""],
      nota, azioni:dipVoci(o)
    });
  }
  /* ===== 12 agosto 2026 (sera) — I PERMESSI ADESSO FANNO QUALCOSA =====
     Queste sette caselle si spuntavano e si salvavano, ma nell'app
     dell'operaio (gestionale-operatore.html) se ne leggevano solo TRE: lavori,
     clienti, fatture. Le altre quattro erano decorazione: togliendo la spunta
     a «Pagamenti» l'operaio poteva lo stesso spendere sulla carta aziendale.
     Adesso comandano tutte e sette, e sotto ognuna c'e' scritto cosa fa: una
     casella che non spieghi non la usa nessuno, o si usa male. */
  /* 13 agosto 2026 — le descrizioni dicevano cose che il telefono non faceva.
     «Foto» prometteva «quelle che carichi tu le vede comunque»: vero nell'app,
     falso sul database, dove la regola di lettura chiedeva la spunta. Adesso
     le due cose combaciano (vedi sql/gest-permessi-collaboratori.sql), e qui
     sotto c'e' scritto anche quali caselle da sole non aprono niente. */
  const PERMS=[
    {key:"lavori",    label:"Lavori",     d:"Vede l'agenda e le scadenze, apre i lavori e li segna fatti.", sez:true},
    {key:"clienti",   label:"Clienti",    d:"Vede l'elenco dei clienti con i recapiti.", sez:true},
    {key:"fatture",   label:"Fatture",    d:"Vede le fatture e può allegare la fattura in PDF.", sez:true},
    {key:"pagamenti", label:"Pagamenti",  d:"Vede la sua carta aziendale e registra le spese.", sez:true},
    {key:"calendario",label:"Calendario", d:"Può girare fra i giorni e i mesi. Senza, vede solo oggi. Va insieme a Lavori."},
    {key:"foto",      label:"Foto",       d:"Può aggiungere foto e video. Quelle che carichi tu le vede comunque. Va insieme a Lavori."},
    {key:"note",      label:"Note",       d:"Può scrivere cosa ha fatto sul lavoro. Senza, le legge e basta. Va insieme a Lavori."},
    /* 15 agosto 2026 — il rapportino di fine giornata. Chi ce l'ha scrive le
       ore di TUTTA la squadra su quel lavoro, quindi vede anche i nomi dei
       colleghi (solo i nomi: costo orario, documenti e recapiti restano
       chiusi, vedi sql/gest-squadra-nomi.sql). Va data a chi in cantiere
       tiene il conto delle ore, di solito il capo squadra. */
    {key:"rapportini",label:"Rapportini", d:"Può scrivere il rapportino di fine giornata: le ore di tutta la squadra su quel lavoro, i materiali usati. Vede i nomi dei colleghi, e solo i nomi. Va insieme a Lavori."}
  ];
  const RUOLO_PRESET={operaio:["calendario","lavori","foto","note"],preposto:["calendario","lavori","foto","note","clienti","rapportini"],segretaria:["calendario","lavori","foto","note","clienti","fatture","pagamenti"]};
  function applyRuoloPreset(){
    const on=RUOLO_PRESET[$("#d-ruolo").value]||[];
    $$("#d-perms input[data-perm]").forEach(ch=>ch.checked=on.includes(ch.dataset.perm));
    permAvviso();
  }
  /* l'avviso vivo sotto le caselle: Calendario, Foto e Note da sole non aprono
     nessuna schermata, e chi le aveva soltanto trovava il lucchetto senza che
     questa scheda glielo avesse mai detto. */
  function permAvviso(){
    const box=$("#d-perms-avviso"); if(!box)return;
    const on={};$$("#d-perms input[data-perm]").forEach(ch=>on[ch.dataset.perm]=ch.checked);
    const sezioni=PERMS.filter(p=>p.sez&&on[p.key]).map(p=>p.label);
    const spente=PERMS.filter(p=>!p.sez&&on[p.key]).map(p=>p.label);
    let t="";
    if(!sezioni.length&&!spente.length) t="⚠️ Senza nessuna spunta questa persona apre l'app e trova il lucchetto.";
    else if(!sezioni.length) t="⚠️ "+spente.join(" e ")+": da sole non aprono nessuna schermata. Accendi anche <b>Lavori</b>, Clienti, Fatture o Pagamenti, se no trova il lucchetto.";
    else if(on.pagamenti&&sezioni.length===1) t="Vedrà solo la sua carta aziendale: niente agenda, niente lavori.";
    else if((on.calendario||on.foto||on.note)&&!on.lavori) t="Calendario, Foto e Note lavorano dentro la scheda di un lavoro: senza <b>Lavori</b> restano spente.";
    box.innerHTML=t;box.style.display=t?"":"none";
  }
  /* la persona creata da un tentativo il cui invito non è partito: serve a
     non doppiarla al secondo Aggiungi (vedi squadraAdd). Si azzera ogni
     volta che si apre il modulo, così una scheda nuova riparte pulita. */
  let _sqOpAppenaCreato=null;
  /* ============================================================
     APRIRE LA SCHEDA DI UNA PERSONA — 14 agosto 2026 (notte)

     ⚠️ Prima si apriva con quello che c'era in `dipCache`, e dipCache si
     riempie SOLO quando la sezione Squadra viene ridisegnata. Il "render
     pigro" (vedi il clic sui tab) ridisegna una sezione solo se è segnata
     "da rifare": «squadra» non sta fra quelle che si rifanno sempre. Quindi
     entri in Squadra una volta, esci, rientri — e i dati sono ancora quelli
     di quando sei entrato la prima volta.

     Il giro che fa male: cambi il costo orario dal telefono; sul computer la
     scheda mostra ancora quello vecchio perché era già caricata; correggi il
     numero di telefono e premi Aggiorna; e il costo vecchio SI RISCRIVE
     SOPRA a quello nuovo. In silenzio — e il costo orario entra nel margine
     di ogni lavoro.

     Riprodotto il 14 agosto: nel database 18,125 e nella casella 35.

     Adesso, prima di aprirla, la persona si rilegge dal database. È UNA
     lettura sola, e solo quando apri davvero una scheda: non tocca il conto
     delle letture all'ingresso nel reparto.

     Se la rilettura non riesce (rete giù, in cantiere succede) la scheda si
     apre lo stesso con quello che c'è — bloccarla sarebbe peggio — ma lo
     DICE, invece di far credere che quei numeri siano quelli veri.
     ============================================================ */
  async function squadraApri(id){
    const cache=(dipCache||[]).find(d=>String(d.id)===String(id));
    if(!sb||!sbUid)return squadraForm(cache);
    let fresco=null,guasto=false;
    try{
      const {data,error}=await sb.from("gest_operatori").select("*").eq("id",id).maybeSingle();
      if(error)guasto=true;
      else if(data)fresco=data;
      else if(!cache){toast("Persona non trovata");return;}
    }catch(e){guasto=true;}
    if(fresco){
      /* la cache tiene ruolo e permessi, che stanno su gest_membri e non
         arrivano da questa lettura: si parte da quella e ci si sovrascrive
         sopra quello appena letto. */
      const i=(dipCache||[]).findIndex(d=>String(d.id)===String(id));
      if(i>=0)dipCache[i]=Object.assign({},dipCache[i],fresco);
    }
    const op=fresco?Object.assign({},cache||{},fresco):cache;
    if(!op){toast("Persona non trovata");return;}
    squadraForm(op,guasto);
  }
  function squadraForm(op,vecchi){
    _sqOpAppenaCreato=null;
    const isNew=!op;op=op||{};
    const apriSic=dipAvvisi(op).length?" open":"";
    /* Modulo lungo -> finestra grande a due colonne, come lavoro e preventivo.
       A sinistra la persona e i suoi documenti, a destra cosa vede sul telefono
       e l'anagrafica. Sotto i 900px torna una colonna sola. */
    openSheetGrande(isNew?"Nuova persona":"Modifica persona",
      `<div class="sh-cols"><div class="sh-col">
${vecchi?`
      <div class="sh-b" style="background:#fff4e5;border:2px solid #ffd9a0">
        <div style="font-size:15px;line-height:1.6;color:#7a4b00">
          <b>Non sono riuscito a rileggere questa persona.</b><br>
          Quello che vedi qui sotto potrebbe essere vecchio: se qualcuno l'ha
          cambiata da un altro telefono, salvando adesso riscriveresti sopra.
          Se puoi, chiudi e riprova quando la connessione torna.
        </div>
      </div>`:""}
      <div class="sh-b">
        <div class="sh-tit">Chi \u00e8</div>
        <div class="field"><label>Nome</label><input id="d-nome" value="${esc(op.nome||"")}" placeholder="Es. Wahid"></div>
        <div class="field"><label>Telefono</label><input id="d-tel" type="tel" value="${esc(op.telefono||"")}" placeholder="Es. 333 1234567"></div>
        <div class="row2">
          <div class="field"><label>Mansione in cantiere</label>
            <input id="d-mansione" list="d-mansioni-list" value="${esc(op.mansione||"")}" placeholder="Es. Muratore">
            <datalist id="d-mansioni-list">${MANSIONI.map(m=>`<option value="${m}"></option>`).join("")}</datalist></div>
          <div class="field"><label>Costo orario (\u20ac)</label>
            <input id="d-costo" type="text" inputmode="decimal" value="${op.costo_orario!=null&&op.costo_orario!==""?esc(_numTesto(op.costo_orario)):""}" placeholder="Es. 22,50" data-euro></div>
        </div>
        <div class="sh-nota">Il costo orario serve per calcolare la manodopera sui lavori.</div>
      </div>

      <div class="sh-b">
        <details${apriSic}>
          <summary class="sh-tit sh-tit--click">\ud83e\uddba Documenti e sicurezza</summary>
          <div class="row2">
            <div class="field"><label>Visita medica \u2014 scade il</label><input id="d-visita" type="date" value="${esc(op.visita_medica_scadenza||"")}"></div>
            <div class="field"><label>Formazione sicurezza \u2014 scade il</label><input id="d-formazione" type="date" value="${esc(op.formazione_scadenza||"")}"></div>
          </div>
          <div class="field"><label>Attestati e patentini</label><input id="d-attestati" value="${esc(op.attestati||"")}" placeholder="Es. muletto, piattaforma aerea, primo soccorso"></div>
          <div class="row2">
            <div class="field"><label>Documento \u2014 numero</label><input id="d-doc-num" value="${esc(op.documento_numero||"")}" placeholder="Es. CA12345AB"></div>
            <div class="field"><label>Documento \u2014 scade il</label><input id="d-doc-scad" type="date" value="${esc(op.documento_scadenza||"")}"></div>
          </div>
          <div class="field"><label>Permesso di soggiorno \u2014 scade il</label><input id="d-permesso" type="date" value="${esc(op.permesso_scadenza||"")}"></div>
          <div class="sh-nota">Il permesso serve solo per lavoratori extra UE. Lascia vuoto se non serve.</div>
        </details>
      </div>

      </div><div class="sh-col">

      <div class="sh-b">
        <div class="sh-tit">Cosa vede sul telefono</div>
        <div class="field"><label>Ruolo nell'app</label><select id="d-ruolo">
          <option value="operaio">Operaio</option>
          <option value="preposto">Preposto</option>
          <option value="segretaria">Segretaria</option></select></div>
        <div class="field"><label>Permessi</label><div id="d-perms">
          ${PERMS.map(p=>`<label class="perm-row"><span><b>${p.label}</b><small>${p.d}</small></span><input type="checkbox" data-perm="${p.key}"></label>`).join("")}</div>
          <p class="sh-nota" id="d-perms-avviso" style="margin:10px 0 0;display:none;font-size:15px;background:#fff4e5;color:#8a4b00;border-radius:10px;padding:10px 12px"></p>
          <p class="sh-nota" style="margin:10px 0 0">Decide cosa vede e cosa può fare <b>dal telefono</b>. Le prime quattro aprono una schermata; le altre quattro cambiano cosa può fare dentro. Il ruolo qui sopra riempie le caselle con la scelta più comune: poi le cambi come vuoi.</p></div>
      </div>

      <div class="sh-b">
        <details>
          <summary class="sh-tit sh-tit--click">\ud83d\udc64 Dati anagrafici e contratto</summary>
          <div class="row2">
            <div class="field"><label>Data di nascita</label><input id="d-nascita" type="date" value="${esc(op.data_nascita||"")}"></div>
            <div class="field"><label>Codice fiscale</label><input id="d-cf" value="${esc(op.codice_fiscale||"")}" style="text-transform:uppercase" placeholder="Es. RSSMRA80A01H501U"></div>
          </div>
          <div class="field"><label>Email</label><input id="d-email" type="email" value="${esc(op.email||"")}" placeholder="nome@email.it"></div>
          <div class="row2">
            <div class="field"><label>Data di assunzione</label><input id="d-assunzione" type="date" value="${esc(op.data_assunzione||"")}"></div>
            <div class="field"><label>Tipo di contratto</label>
              <input id="d-contratto" list="d-contratti-list" value="${esc(op.tipo_contratto||"")}" placeholder="Es. Tempo indeterminato">
              <datalist id="d-contratti-list">${CONTRATTI.map(c=>`<option value="${c}"></option>`).join("")}</datalist></div>
          </div>
          <div class="row2">
            <div class="field"><label>In emergenza chiamare</label><input id="d-emerg-nome" value="${esc(op.emergenza_nome||"")}" placeholder="Es. Maria (moglie)"></div>
            <div class="field"><label>Telefono di emergenza</label><input id="d-emerg-tel" type="tel" value="${esc(op.emergenza_telefono||"")}" placeholder="Es. 333 7654321"></div>
          </div>
        </details>
      </div>

      </div></div>`,
      ctrTastoHTML('operatore')
      +`<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="${isNew?"sq-add":"sq-save"}" data-id="${op.id||""}">${isNew?"Aggiungi":"Salva"}</button>`);
    ctrAscolta('operatore');
    $("#d-ruolo").onchange=applyRuoloPreset;
    $$("#d-perms input[data-perm]").forEach(ch=>ch.addEventListener("change",permAvviso));
    if(isNew){applyRuoloPreset();}
    else{
      /* 14 agosto 2026 — la tendina si tiene il ruolo che trova.
         Prima: `$("#d-ruolo").value = op.ruolo`. Se nel database c'era un
         valore che non e' una delle tre voci (una maiuscola, uno spazio,
         una parola vecchia), il browser non trova l'opzione e mette il
         valore a "": la tendina si apriva IN BIANCO e il primo Salva
         scriveva davvero un ruolo vuoto. E il ruolo conta: "segretaria"
         vede tutte le pratiche dello studio, gli altri solo le proprie.
         Adesso il valore che non conosciamo diventa una voce sua, scritta
         com'e', cosi' si vede e non si perde. */
      if(op.ruolo){
        const _sr=$("#d-ruolo");
        if(_sr&&![..._sr.options].some(o=>o.value===op.ruolo)){
          const _o=document.createElement("option");
          _o.value=op.ruolo;_o.textContent=op.ruolo+" (ruolo non previsto)";
          _sr.insertBefore(_o,_sr.firstChild);
        }
        if(_sr)_sr.value=op.ruolo;
      }
      const perms=op.permessi||{};
      $$("#d-perms input[data-perm]").forEach(ch=>ch.checked=!!perms[ch.dataset.perm]);
      permAvviso();
    }
  }
  async function ensureMestiere(){
    const {data}=await sb.from("gest_mestieri").select("id").limit(1);
    if(data&&data.length)return data[0].id;
    const {data:m,error}=await sb.from("gest_mestieri").insert({user_id:sbUid,nome:"Squadra",icona:"🛠️",colore:"#2e629e",ordine:0}).select().single();
    if(error)throw error;
    return m.id;
  }
  async function squadraAdd(){
    const nome=$("#d-nome").value.trim();if(!nome){toast("Scrivi il nome");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const telefono=$("#d-tel")?$("#d-tel").value.trim():"";
    /* 14 agosto 2026 — un ruolo vuoto non si scrive mai (vedi squadraForm) */
    const ruolo=($("#d-ruolo")&&$("#d-ruolo").value)?$("#d-ruolo").value:"operaio";
    const permessi={};$$("#d-perms input[data-perm]").forEach(ch=>permessi[ch.dataset.perm]=ch.checked);
    const mestiere_id=curMestiere();
    if(!mestiere_id){toast("Apri un reparto prima di aggiungere una persona");return;}
    const _costoKo=dipCostoStorto(); if(_costoKo){toast(_costoKo);return;}
    const extra=dipCampiExtra();
    /* ⚠️ I DOPPIONI QUANDO L'INVITO NON PARTE — 14 agosto 2026.
       Qui si scrive in due tabelle: prima la persona (gest_operatori), poi
       il suo invito (gest_membri). Se la seconda non riesce — la rete che
       cade a metà, il caso di tutti i giorni in cantiere — la persona
       resta scritta e la funzione esce con «Errore invito».
       Chi legge quel messaggio ripreme Aggiungi, ed ecco il DOPPIONE:
       riprodotto, due tentativi = due «Mario Bianchi» in squadra, uno dei
       quali senza accesso. Poi bisogna capire quale eliminare.
       Adesso la persona appena creata si tiene da parte: al secondo
       tentativo non se ne fa un'altra, si riprova solo l'invito. */
    let opId=_sqOpAppenaCreato;
    if(!opId){
      const {data:op,error}=await sb.from("gest_operatori").insert(Object.assign({user_id:sbUid,mestiere_id,nome,telefono:telefono||null},extra)).select().single();
      if(error){toast("Errore: "+error.message);return;}
      opId=op.id;
      _sqOpAppenaCreato=opId;
    }else{
      /* la persona c'era già dal tentativo di prima: si aggiorna, se nel
         frattempo ha corretto il nome o il telefono */
      await sb.from("gest_operatori").update(Object.assign({nome,telefono:telefono||null},extra)).eq("id",opId).eq("user_id",sbUid);
    }
    const codice=sbRand();
    const {error:e2}=await sb.from("gest_membri").insert({impresa_id:sbUid,operatore_id:opId,codice,stato:"invitato",ruolo,permessi});
    if(e2){
      toast("«"+nome+"» è salvata, ma l'invito non è partito: "+e2.message
        +". Premi di nuovo Aggiungi per riprovare solo l'invito — la persona non viene doppiata.");
      return;
    }
    _sqOpAppenaCreato=null;
    closeSheet();renderDip();toast("Persona aggiunta, invito creato ✔");
  }
  async function squadraSave(id){
    if(!id)return;
    const nome=$("#d-nome").value.trim();if(!nome){toast("Scrivi il nome");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const telefono=$("#d-tel")?$("#d-tel").value.trim():"";
    /* 14 agosto 2026 — un ruolo vuoto non si scrive mai (vedi squadraForm) */
    const ruolo=($("#d-ruolo")&&$("#d-ruolo").value)?$("#d-ruolo").value:"operaio";
    const permessi={};$$("#d-perms input[data-perm]").forEach(ch=>permessi[ch.dataset.perm]=ch.checked);
    const _costoKo=dipCostoStorto(); if(_costoKo){toast(_costoKo);return;}
    const extra=dipCampiExtra();
    const {data:okOp,error}=await sb.from("gest_operatori").update(Object.assign({nome,telefono:telefono||null},extra)).eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!okOp||!okOp.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
    const {data:okMem,error:e2}=await sb.from("gest_membri").update({ruolo,permessi}).eq("operatore_id",id).eq("impresa_id",sbUid).select("operatore_id");
    if(e2){toast("Errore permessi: "+e2.message);return;}
    closeSheet();renderDip();
    if(!okMem||!okMem.length){toast("Salvato, ma ruolo e permessi non aggiornati");return;}
    toast("Aggiornato ✔");
  }

  /* ============================================================
     12 agosto 2026 (sera) — LE PERSONE SI POSSONO ELIMINARE

     Era l'unica anagrafica del gestionale senza «Elimina»: c'era «Rimuovi
     accesso», che toglie la password ma lascia la persona nell'elenco per
     sempre. Chi ha avuto dieci operai in tre anni si ritrova dieci schede da
     scorrere ogni volta, e le loro scadenze — visita medica, formazione,
     permesso di soggiorno — continuano a comparire in cima al Riepilogo come
     se fossero ancora in ditta. Per questo la categoria «Persone» del Cestino
     non si e' mai riempita: non si poteva mettere via niente.

     COSA NON SI TOCCA, e perche':
       - le ORE registrate restano. Sono il costo della manodopera dei lavori
         gia' chiusi: cancellarle cambierebbe il margine di lavori vecchi.
       - le FOTO e i VIDEO che ha caricato restano: sono la storia del cantiere.
       - i LAVORI a suo nome restano, ma perdono il nome di chi li seguiva.
     Tutto questo si dice PRIMA, coi numeri veri, non dopo.
     ============================================================ */
  async function dipElimina(id){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const o=(dipCache||[]).find(x=>String(x.id)===String(id))||{};
    const nome=o.nome||"questa persona";
    let ore=0,lav=0,file=0,incerto=false;
    const _n=async function(tab,col,val){
      try{
        const {count,error}=await sb.from(tab).select("id",{count:"exact",head:true})
          .eq("user_id",sbUid).eq(col,val);
        if(error){incerto=true;return 0;}
        return count||0;
      }catch(e){incerto=true;return 0;}
    };
    /* ha l'accesso dal telefono? Non ci si puo' fidare di dipCache: li' dentro
       il codice d'invito non viene copiato, quindi si guarda la tabella vera.
       Si tiene da parte anche lo stato di adesso: se piu' avanti l'eliminazione
       fallisce bisogna rimettere l'accesso ESATTAMENTE com'era (poteva essere
       "invitato", non per forza "attivo"). */
    let statoPrima=null, membroLetto=false, statoLetto=false;
    const _haAccesso=async function(){
      try{
        const {data:m,error}=await sb.from("gest_membri").select("operatore_id,stato")
          .eq("impresa_id",sbUid).eq("operatore_id",id).limit(1);
        /* se la tabella degli accessi non esiste proprio (gestionale vecchio,
           nessuno e' mai stato invitato) allora la risposta e' certa: nessun
           accesso. Se invece e' la rete a non rispondere non si sa niente, e
           piu' sotto l'eliminazione si ferma: dire "nessun accesso" per non
           aver potuto guardare e' il modo di lasciare dentro un ex operaio. */
        if(error){ membroLetto=_tabellaAssente(error); return false; }
        membroLetto=true;
        if(!(m&&m.length))return false;
        /* statoLetto e non "se statoPrima non e' vuoto": una riga con stato
           NULL o "" e' comunque una riga da rimettere com'era, e con il solo
           controllo sul valore l'accesso non tornava e il messaggio diceva
           che era tornato. */
        statoPrima=(m[0].stato==null)?null:String(m[0].stato);
        statoLetto=true;
        return statoPrima!=="revocato";
      }catch(e){ return false; }
    };
    /* ⚠️ DUE NUMERI SBAGLIATI IN UN MESSAGGIO SOLO — 14 agosto 2026 (notte).
       È il messaggio su cui si decide se eliminare una persona: se i numeri
       non sono veri, la decisione si prende al buio.

       1) LE ORE erano le RIGHE. _n() conta le righe con count:"exact": dodici
          registrazioni da otto ore diventavano «12 ore registrate» invece di
          96. Adesso si sommano le ore vere.

       2) LE FOTO DAL TELEFONO non si contavano MAI. L'app dell'operaio scrive
          `operatore: MIO.nome` — il NOME, «Wahid» — mentre qui si cercava
          `operatore = <uuid della persona>`. Due cose diverse: il conto
          tornava zero sempre, ed è proprio dal telefono che se ne caricano
          di più. Adesso si cerca per nome (e per id, per la roba vecchia). */
    const _sommaOre=async function(){
      try{
        const {data,error}=await sb.from("gest_ore").select("ore")
          .eq("user_id",sbUid).eq("operatore_id",id);
        if(error){incerto=true;return 0;}
        return (data||[]).reduce((t,r)=>t+(+r.ore||0),0);
      }catch(e){incerto=true;return 0;}
    };
    const _nFile=async function(tab){
      try{
        const q=[];
        if(nome)q.push('operatore.eq."'+String(nome).replace(/"/g,'')+'"');
        q.push("operatore.eq."+String(id));
        const {count,error}=await sb.from(tab).select("id",{count:"exact",head:true})
          .eq("user_id",sbUid).or(q.join(","));
        if(error){incerto=true;return 0;}
        return count||0;
      }catch(e){incerto=true;return 0;}
    };
    const [a,b,c,d,acc]=await Promise.all([
      _sommaOre(),
      _n("gest_lavori","operatore_id",id),
      _nFile("gest_foto"),
      _nFile("gest_video"),
      _haAccesso()
    ]);
    ore=a;lav=b;file=c+d;
    const voci=[];
    /* «96 ore» e non «96,00 ore»: le ore si scrivono come si dicono */
    if(ore) voci.push(_numTesto(Math.round(ore*100)/100)+(ore===1?" ora registrata":" ore registrate")+" — servono al margine dei lavori");
    if(file)voci.push(file+(file===1?" foto o video caricato":" foto e video caricati"));
    if(lav) voci.push(lav+(lav===1?" lavoro a suo nome, che resterà senza nessuno assegnato"
                                  :" lavori a suo nome, che resteranno senza nessuno assegnato"));
    let msg="Eliminare «"+nome+"» dalla squadra?\n\n";
    if(voci.length){
      msg+="Quello che ha fatto RESTA dov'è:\n"+voci.map(v=>"  •  "+v).join("\n")+"\n\n";
    }
    if(incerto)msg+="ATTENZIONE: non sono riuscito a controllare tutto, la connessione non ha risposto.\n\n";
    if(acc)msg+="Perde anche l'accesso al gestionale dal telefono.\n\n";
    msg+=fraseCestino()+"\n\nContinuare?";
    if(!gconfirm(msg))return;
    /* ===== 12 agosto 2026 (notte) — L'ACCESSO DAL TELEFONO =====
       Prima qui c'era una riga sola, dentro un try/catch che non serviva a
       niente: Supabase su errore NON lancia, restituisce {error}, e quell'error
       non lo leggeva nessuno. Due guai opposti, tutti e due provati:
       1) se la revoca falliva, la persona finiva nel Cestino, il messaggio
          diceva "Persona messa nel Cestino ✔" e la riga in gest_membri restava
          ATTIVA: dal telefono continuava a entrare e a leggere tutto. E siccome
          spariva dall'elenco, la voce "Rimuovi accesso" non era piu'
          raggiungibile: non c'era piu' modo di fermarla.
       2) se invece falliva la cancellazione, l'accesso era gia' stato tolto ma
          il messaggio diceva "Non eliminata": il titolare leggeva "non e'
          successo niente" e l'operaio la mattina dopo non entrava.
       Adesso: la revoca si controlla davvero e, se non riesce, NON si elimina
       nessuno. E se e' la cancellazione a fallire, l'accesso torna com'era. */
    if(!membroLetto){
      alert("Non ho eliminato «"+nome+"».\n\nNon sono riuscito a controllare se ha l'accesso "
        +"al gestionale dal telefono: la connessione non ha risposto.\n\nNon elimino nessuno "
        +"finché non lo so: se ce l'avesse, resterebbe dentro e tu non la vedresti più in "
        +"elenco per fermarla. Riprova fra un momento.");
      return;
    }
    if(acc){
      const rev=await sb.from("gest_membri").update({stato:"revocato"})
        .eq("operatore_id",id).eq("impresa_id",sbUid).select("operatore_id");
      if(rev&&rev.error){
        alert("Non ho eliminato «"+nome+"».\n\nNon sono riuscito a togliergli l'accesso dal "
          +"telefono: "+(rev.error.message||"la connessione non ha risposto")+"\n\nSe la "
          +"eliminassi adesso, continuerebbe a entrare dal telefono e tu non la vedresti "
          +"più in elenco per fermarla. Riprova fra un momento.");
        return;
      }
      if(!(rev&&rev.data&&rev.data.length)){
        alert("Non ho eliminato «"+nome+"».\n\nHo provato a togliergli l'accesso dal telefono "
          +"ma non ho trovato nessuna riga da cambiare. Prima usa «🚫 Rimuovi accesso» sulla "
          +"sua scheda, controlla che diventi «Nessun accesso», poi rielimina.");
        return;
      }
    }
    const {data:ok,error}=await sb.from("gest_operatori").delete().eq("id",id).eq("user_id",sbUid).select("id");
    /* la cancellazione non e' andata: l'accesso l'avevo gia' tolto, lo rimetto
       com'era, se no la persona resta in squadra ma fuori dal telefono senza
       che nessuno lo sappia */
    const _rimettiAccesso=async function(){
      if(!acc||!statoLetto)return true;
      try{
        const r=await sb.from("gest_membri").update({stato:statoPrima})
          .eq("operatore_id",id).eq("impresa_id",sbUid).select("operatore_id");
        return !!(r&&!r.error&&r.data&&r.data.length);
      }catch(e){ return false; }
    };
    if(error||!ok||!ok.length){
      const tornato=await _rimettiAccesso();
      const perche=error?(error.message||"errore"):"non ho trovato nessuna riga da eliminare";
      alert("«"+nome+"» NON è stata eliminata: "+perche+"\n\n"
        +(tornato
          ? "L'accesso dal telefono è rimasto com'era. Riprova fra un momento."
          : "⚠️ ATTENZIONE: le avevo già tolto l'accesso dal telefono e non sono riuscito a "
            +"rimetterlo. La persona è ancora in squadra ma dal telefono non entra. Vai sulla "
            +"sua scheda e rimandale il link d'invito."));
      return;
    }
    renderDip();
    rinfresca("riepilogo","agenda","squadra","scadenzario","galleria","lavori");
    toast(_cestOn()?"Persona messa nel Cestino ✔ — la rimetti a posto da lì":"Persona eliminata");
  }
