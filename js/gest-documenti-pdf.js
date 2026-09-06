  /* ============================================================
     I DOCUMENTI DEL CLIENTE, IN PDF — staccato il 6 settembre 2026
     Fetta A dello smontaggio di gestionale-app.html (17.048 → 15.955 righe).

     Qui dentro ci sono i QUATTRO fogli che si stampano e si danno in mano
     al cliente:
       · prevPdf      — il preventivo
       · incaricoPdf  — la lettera d'incarico (col modulo incaricoForm)
       · ordinePdf    — la conferma d'ordine (col modulo ordineForm)
       · verbalePdf   — il verbale di sopralluogo (col modulo verbaleForm)
     piu' i loro moduli, i testi dei pagamenti e le tre memorie che si
     ricordano cosa avevi scritto l'ultima volta (INC_MEM, ORD_MEM, VER_MEM).

     ⚠️ PERCHE' PROPRIO QUESTI. Sono funzioni che non tengono niente in
     memoria fra una volta e l'altra: entrano dei dati, esce un foglio
     stampato. E' la fetta piu' sicura da staccare, per questo e' la prima.

     ⚠️ QUESTO FILE NON E' CHIUSO DENTRO NIENTE (niente IIFE), come
     gest-computo.js e gli altri: vive nello stesso spazio del codice
     scritto dentro la pagina. Quindi vede sb, sbUid, esc, eur2, toast,
     caricaJsPDF, closeSheet, curMestiere e tutti gli altri aiuti comuni
     senza doverseli passare — e per la stessa ragione un nome dichiarato
     qui NON deve esistere da nessun'altra parte, se no la pagina esplode
     al caricamento. Il banco lo controlla:
       prove-claude/banchi-fissi/smontaggio/banco-fetta-a.js

     ⚠️ L'ORDINE DEI <script> CONTA. Questo file va caricato PRIMA del
     blocco scritto dentro la pagina, insieme agli altri gest-*.js.

     I 7 punti d'ingresso, chiamati dal dispatcher della pagina:
     prevPdf · incaricoForm · incaricoPdf · ordineForm · ordinePdf ·
     verbaleForm · verbalePdf
     ============================================================ */

  async function prevPdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    const p=prevCache.find(x=>x.id===id);if(!p)return;
    const {data:azLetta}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    /* ⚠️ IL MURO ALLA FINE — tolto il 14 agosto 2026.
       Qui c'era: niente Dati azienda, niente PDF. Lo stop arrivava nel
       momento peggiore — hai scritto il preventivo, premi «Scarica PDF» e
       ti si apre un modulo da 18 caselle. Misurato: erano gli ultimi 2
       tocchi di 11, ed e' il punto in cui uno molla, perche' pensava di
       aver finito.
       Adesso il PDF ESCE lo stesso, ma si vede a un metro che non e' da
       mandare: fascia rossa in cima a ogni pagina e la parola BOZZA nel
       nome del file. Il preventivo intanto e' tuo, lo guardi, lo fai
       vedere; i dati fiscali li metti quando lo mandi davvero.
       Chi i dati ce l'ha non si accorge di niente: nessuna fascia. */
    const az=azLetta||{};
    const _mancaAz=!az.nome;
    const _mancaPiva=!String(az.piva||"").trim();
    const _bozza=_mancaAz||_mancaPiva;
    let c={};
    c=await cliDelDocumento(p.cliente_id,"nome,indirizzo,referente");
    const {data:rr}=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    const righe=rr||[];
    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"}), M=18, R=210-M;
    let y=20;
    if(_bozza){
      /* la fascia si disegna PRIMA di tutto, in cima: se fosse in fondo
         basterebbe non arrivarci a leggere */
      doc.setFillColor(192,57,43);doc.rect(0,0,210,11,"F");
      doc.setTextColor(255);doc.setFont("helvetica","bold");doc.setFontSize(10);
      doc.text("BOZZA - NON DA CONSEGNARE: mancano "
        +[_mancaAz?"il nome dell'attivita'":"", _mancaPiva?"la partita IVA":""].filter(Boolean).join(" e "),
        105,7.2,{align:"center"});
      doc.setTextColor(0);
      y=26;
    }
    doc.setFont("helvetica","bold");doc.setFontSize(16);
    doc.text(az.nome||"(il nome della tua attivita' va nei Dati azienda)",M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    let hy=y+6;[az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")].filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=4.5;});
    doc.setTextColor(0);
    const isParcella = (ruoloUtente==='professionista');
    doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text(isParcella?"PARCELLA":"PREVENTIVO",R,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("N. "+p.numero+"   del "+fdate(p.data||todayStr()),R,y+5.5,{align:"right"});
    doc.setTextColor(0);
    y=Math.max(hy,y+15)+4;doc.setDrawColor(210);doc.line(M,y,R,y);y+=10;
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Spett.le",M,y);y+=6;
    doc.setFont("helvetica","normal");doc.setFontSize(11);doc.text(c.nome||"—",M,y);y+=5;
    doc.setFontSize(9);doc.setTextColor(90);
    if(c.indirizzo){doc.text(c.indirizzo,M,y);y+=4.5;}
    if(c.referente){doc.text("Rif. "+c.referente,M,y);y+=4.5;}
    doc.setTextColor(0);y+=4;
    doc.setFont("helvetica","bold");doc.setFontSize(11);
    const titLines=doc.splitTextToSize("Oggetto: "+p.titolo,R-M);
    doc.text(titLines,M,y);y+=titLines.length*5+4;
    doc.setFillColor(31,111,92);doc.rect(M,y,R-M,8,"F");
    doc.setTextColor(255);doc.setFont("helvetica","bold");doc.setFontSize(9.5);
    doc.text("Descrizione",M+2,y+5.5);doc.text("Q.tà",R-60,y+5.5,{align:"right"});doc.text("Prezzo",R-32,y+5.5,{align:"right"});doc.text("Totale",R-2,y+5.5,{align:"right"});
    doc.setTextColor(0);doc.setFont("helvetica","normal");y+=8;
    let tot=0;
    righe.forEach(r=>{
      /* ⚠️ 19 agosto 2026 — LA RIGA DI CAPITOLO SUL FOGLIO DEL CLIENTE.
         Esce come una fascia grigia col titolo in grassetto e le tre colonne
         dei numeri VUOTE. Se uscisse come una riga normale, il cliente
         leggerebbe «1 Demolizioni · 1 · 0,00 · 0,00» e si chiederebbe che
         cos'è quella voce da zero euro. Un titolo non ha una quantità. */
      if(_rigaSezione(r)){
        const tl=doc.splitTextToSize(String(r.descrizione||""),R-M-8);
        const th=tl.length*5+4;
        if(y+th>270){doc.addPage();y=20;}
        doc.setFillColor(238,241,244);doc.rect(M,y,R-M,th,"F");
        doc.setDrawColor(210);doc.rect(M,y,R-M,th);
        doc.setFont("helvetica","bold");doc.setFontSize(9.5);
        doc.text(tl,M+2,y+5);
        doc.setFont("helvetica","normal");
        y+=th;
        return;
      }
      const rt=impRiga(r.qta,r.prezzo);tot+=rt;
      const lines=doc.splitTextToSize(r.descrizione,R-M-72);
      const rowH=lines.length*5+4;
      if(y+rowH>270){doc.addPage();y=20;}
      doc.setDrawColor(210);doc.rect(M,y,R-M,rowH);
      doc.setFontSize(9.5);doc.text(lines,M+2,y+5);
      /* ⚠️ 19 agosto 2026 — LA QUANTITÀ USCIVA COL PUNTO.
         Sul PDF si leggeva «20.46 mq»: il numero grezzo di JavaScript, con
         il punto dell'inglese, su un documento che va a un cliente italiano
         — e nella riga sotto lo stesso valore si legge «20,46». Due modi di
         scrivere lo stesso numero nella stessa pagina.
         _numTesto è quello che il gestionale usa dappertutto: mette la
         virgola e toglie la coda della virgola mobile (0,1+0,2 non diventa
         0,30000000000000004), senza aggiungere decimali che non ci sono —
         una quantità di 1 resta «1», non «1,00». */
      doc.text(_numTesto(+r.qta||1),R-60,y+5,{align:"right"});
      doc.text(eurPdf(r.prezzo),R-32,y+5,{align:"right"});
      doc.text(eurPdf(rt),R-2,y+5,{align:"right"});
      y+=rowH;
    });
    y+=4;
    if(isParcella){
      /* Riepilogo della parcella: compenso, spese, cassa, IVA, ritenuta, da incassare.
         Stesse regole del riquadro nel gestionale (vedi calcolaParcella). */
      const cp=calcolaParcella(tot,p.cassa_perc,p.iva_perc,!!p.ritenuta,p.ritenuta_perc||20,p.spese_forfait);
      const righeTot=[["Compenso",cp.compenso,false]];
      if(cp.spese)   righeTot.push(["Spese (bolli, diritti)",cp.spese,false]);
      if(cp.cassa)   righeTot.push(["Cassa previdenziale "+_pct(p.cassa_perc)+"%",cp.cassa,false]);
      righeTot.push([cp.spese?"Totale imponibile":"Imponibile IVA",cp.imponibile,false]);
      if(cp.iva)     righeTot.push(["IVA "+_pct(p.iva_perc)+"%",cp.iva,false]);
      if(cp.ritenuta)righeTot.push(["Ritenuta d'acconto "+_pct(p.ritenuta_perc!=null?p.ritenuta_perc:20)+"%",cp.ritenuta,true]);
      const hBox=righeTot.length*6+16;
      if(y+hBox>272){doc.addPage();y=20;}
      doc.setDrawColor(31,111,92);doc.setLineWidth(.4);doc.rect(R-90,y,90,hBox);doc.setLineWidth(.2);
      let ry=y+7;
      doc.setFont("helvetica","normal");doc.setFontSize(9.5);
      righeTot.forEach(function(r){
        doc.text(r[0],R-88,ry);
        doc.text((r[2]?"- ":"")+eurPdf(r[1]),R-2,ry,{align:"right"});
        ry+=6;
      });
      doc.setDrawColor(31,111,92);doc.line(R-88,ry-3,R-2,ry-3);
      doc.setFont("helvetica","bold");doc.setFontSize(11.5);
      doc.text("NETTO A PAGARE",R-88,ry+4);
      doc.text(eurPdf(cp.totale),R-2,ry+4,{align:"right"});
      y+=hBox+10;
    }else if(p.iva_perc!=null&&p.iva_perc!==""){
      /* 9 agosto 2026 — impresa con l'aliquota indicata: il cliente vede il
         totale FINITO, non solo l'imponibile. È la cifra che gli interessa. */
      const perc=+p.iva_perc||0;
      const ivaVal=_centPerc(tot,perc);
      /* stessa regola del riquadro nel gestionale e della conferma d'ordine:
         si somma l'IVA già arrotondata, se no i tre documenti dello stesso
         lavoro escono con totali diversi di un centesimo */
      const finito=_cent2(tot+ivaVal);
      const hBox=perc?30:18;
      if(y+hBox>272){doc.addPage();y=20;}
      doc.setDrawColor(31,111,92);doc.setLineWidth(.4);doc.rect(R-90,y,90,hBox);doc.setLineWidth(.2);
      doc.setFont("helvetica","normal");doc.setFontSize(9.5);
      let ry=y+7;
      doc.text("Imponibile",R-88,ry);doc.text(eurPdf(tot),R-2,ry,{align:"right"});ry+=6;
      if(perc){doc.text("IVA "+_pct(perc)+"%",R-88,ry);doc.text(eurPdf(ivaVal),R-2,ry,{align:"right"});ry+=6;}
      doc.setDrawColor(31,111,92);doc.line(R-88,ry-3,R-2,ry-3);
      doc.setFont("helvetica","bold");doc.setFontSize(11.5);
      doc.text("TOTALE",R-88,ry+4);doc.text(eurPdf(finito),R-2,ry+4,{align:"right"});
      y+=hBox+10;
    }else{
      doc.setDrawColor(31,111,92);doc.setLineWidth(.4);doc.rect(R-70,y,70,12);doc.setLineWidth(.2);
      doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("TOTALE",R-68,y+7.6);doc.text(eurPdf(tot),R-2,y+7.6,{align:"right"});
      y+=22;
    }
    if(p.note){
      doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Note e condizioni",M,y);y+=5.5;
      doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
      const nl=doc.splitTextToSize(p.note,R-M);doc.text(nl,M,y);y+=nl.length*4.5;doc.setTextColor(0);
    }
    doc.setFontSize(7.5);doc.setTextColor(140);
    const ivaIndicata=(!isParcella&&p.iva_perc!=null&&p.iva_perc!=="");
    doc.text(isParcella
      ? "Preventivo di parcella non vincolante, salvo diversa indicazione nelle note. La ritenuta d'acconto si applica solo se il committente è sostituto d'imposta."
      : (ivaIndicata
        ? "Preventivo non vincolante, salvo diversa indicazione nelle note. I prezzi delle singole voci sono al netto dell'IVA; il totale sopra riportato è comprensivo di IVA al "+(+p.iva_perc||0)+"%."
        : "Preventivo non vincolante, salvo diversa indicazione nelle note. Prezzi IVA esclusa dove non specificato."),
      M,286,{maxWidth:R-M});
    /* «BOZZA» sta anche nel NOME DEL FILE: e' quello che si legge nella
       cartella dei download e nell'allegato dell'email, cioe' l'ultimo
       posto in cui ci si puo' ancora accorgere prima di mandarlo. */
    doc.save((_bozza?"BOZZA-":"")+(isParcella?"parcella-":"preventivo-")+p.numero+"-"+(c.nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".pdf");
    if(_bozza){
      toast("Scaricato, ma è una BOZZA: senza "
        +[_mancaAz?"il nome dell'attività":"", _mancaPiva?"la partita IVA":""].filter(Boolean).join(" e ")
        +" non si manda al cliente. Li metti in Dati azienda quando vuoi.");
    }else{
      toast(isParcella?"PDF parcella scaricato ✅":"PDF preventivo scaricato ✅");
    }
  }

  /* ===== 9 agosto 2026 — LETTERA D'INCARICO (solo studi professionali) =====
     Un tecnico, per legge, deve mettere per iscritto al cliente che cosa farà
     e quanto costa (art. 9 comma 4 del DL 1/2012). Molti lo fanno con un file
     Word riscritto ogni volta. Qui la lettera nasce dal preventivo che c'e'
     già: stesse voci, stessa parcella, zero cose da ribattere.

     ATTENZIONE: è un modello di base, non un parere legale. Le clausole
     standard vanno fatte leggere una volta al proprio consulente; le parti che
     cambiano da incarico a incarico si scrivono nel modulo qui sotto. */

  /* Le scelte dell'ultima volta restano sul dispositivo: chi fa dieci incarichi
     uguali non riscrive dieci volte le stesse condizioni. Nessun dato del
     cliente viene salvato qui, solo le condizioni generiche dello studio. */
  const INC_MEM="gest_incarico_default";
  function incLeggiMem(){
    try{ return JSON.parse(localStorage.getItem(INC_MEM)||"{}")||{}; }catch(e){ return {}; }
  }
  function incScriviMem(o){
    try{ localStorage.setItem(INC_MEM,JSON.stringify(o)); }catch(e){}
  }

  /* ===== 11 agosto 2026 — GLI ESTREMI DELLA POLIZZA =====
     L'art. 9 comma 4 del DL 1/2012 non chiede solo il preventivo scritto:
     chiede che il professionista dica al cliente, PER ISCRITTO E AL MOMENTO
     DELL'INCARICO, con quale polizza è assicurato e fino a quanto copre.
     Una lettera senza questi quattro dati è una lettera incompleta, e in caso
     di contestazione è il professionista a restare scoperto.

     I dati si scrivono una volta sola nei Dati azienda. Qui si leggono e
     basta: se manca anche uno solo dei quattro, la lettera non si stampa. */
  function polizzaEstremi(az){
    const a=az||{};
    const comp=String(a.pol_compagnia||"").trim();
    const num =String(a.pol_numero||"").trim();
    const massG=(a.pol_massimale==null||a.pol_massimale==="")?null:(+a.pol_massimale||0);
    const scad=String(a.pol_scadenza||"").trim();
    const mancano=[];
    if(!comp)mancano.push("la compagnia assicurativa");
    if(!num)mancano.push("il numero di polizza");
    if(!(massG>0))mancano.push("il massimale");
    if(!scad)mancano.push("la scadenza");
    /* scaduta = la data è già passata. Confronto fra testi aaaa-mm-gg, che si
       ordinano da soli: nessun fuso orario di mezzo, nessun giorno perso. */
    return {comp,num,mass:massG,scad,mancano,completa:mancano.length===0,
            scaduta:!!scad&&scad<todayStr()};
  }
  /* Il messaggio che ferma la lettera. Modale, non un toast che sparisce in
     due secondi: qui il lavoro si interrompe e va detto perché. */
  function polizzaFerma(pol){
    const l=pol.mancano;
    const elenco=l.length===1?l[0]:l.slice(0,-1).join(", ")+" e "+l[l.length-1];
    alert("Non posso preparare la lettera d'incarico.\n\n"
      +"Nei Dati azienda manca "+elenco+".\n\n"
      +"La legge (art. 9 comma 4 del DL 1/2012) vuole che gli estremi della tua "
      +"polizza professionale siano scritti nella lettera che firma il cliente.\n\n"
      +"Ti apro adesso i Dati azienda: compila il riquadro «Polizza professionale» "
      +"e salva. Lo fai una volta sola, poi resta lì.");
  }
  /* Stesso discorso per il cliente. Fino a oggi la lettera usciva lo stesso:
     al posto del committente compariva un trattino, e restava in mano un
     foglio da firmare intestato a nessuno. */
  function incaricoClienteOk(c){
    if(c&&String(c.nome||"").trim())return true;
    alert("Non posso preparare la lettera d'incarico.\n\n"
      +"Questo preventivo non ha un cliente collegato, e la lettera deve dire "
      +"chi è il committente che la firma.\n\n"
      +"Apri il preventivo, scegli il cliente e salva: poi riprova.");
    return false;
  }

  const INC_PAGAMENTI=[
    ["saldo",   "Saldo unico alla consegna"],
    ["50-50",   "50% alla firma, 50% alla consegna"],
    ["30-40-30","30% alla firma, 40% durante, 30% alla consegna"],
    ["accordi", "Come indicato nelle condizioni particolari"]
  ];
  const INC_PAG_TESTO={
    "saldo":   "Il compenso sarà corrisposto in un'unica soluzione alla consegna degli elaborati.",
    "50-50":   "Il compenso sarà corrisposto per il 50% alla sottoscrizione del presente incarico e per il restante 50% alla consegna degli elaborati.",
    "30-40-30":"Il compenso sarà corrisposto per il 30% alla sottoscrizione del presente incarico, per il 40% durante lo svolgimento delle prestazioni e per il restante 30% alla consegna degli elaborati.",
    "accordi": "Il compenso sarà corrisposto secondo quanto indicato nelle condizioni particolari."
  };

  async function incaricoForm(id){
    if(ruoloUtente!=='professionista'){toast("La lettera d'incarico è per gli studi professionali");return;}
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const p=prevCache.find(x=>String(x.id)===String(id));
    if(!p){toast("Preventivo non trovato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    /* I due sbarramenti, prima ancora di aprire il modulo: senza committente e
       senza polizza la lettera non si può fare, e scoprirlo dopo aver
       compilato tutto sarebbe la beffa. */
    if(!incaricoClienteOk(await cliDelDocumento(p.cliente_id)))return;
    const pol=polizzaEstremi(az);
    if(!pol.completa){polizzaFerma(pol);return aziendaForm();}
    const {data:rr}=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    const righe=rr||[];
    let tot=0; righe.forEach(r=>{tot+=impRiga(r.qta,r.prezzo);});
    const cp=calcolaParcella(tot,p.cassa_perc,p.iva_perc,!!p.ritenuta,p.ritenuta_perc||20,p.spese_forfait);
    const mem=incLeggiMem();

    /* i titoli dei capitoli restano, ma senza il trattino: in un elenco di
       prestazioni un titolo non è una prestazione, è quello che le tiene
       insieme. Toglierli spezzerebbe il filo fra la lettera e il preventivo. */
    const prestazioni=righe.map(r=>(_rigaSezione(r)?"":"- ")+(r.descrizione||"").trim())
                           .filter(x=>x!=="-"&&x!=="").join("\n");
    const luogoDef=mem.luogo||az.citta||"";
    const foroDef=mem.foro||az.citta||"";
    const tempiDef=mem.tempi||"60 giorni dalla sottoscrizione del presente incarico";
    const pagDef=mem.pagamento||"saldo";

    const opzPag=INC_PAGAMENTI.map(o=>'<option value="'+o[0]+'" '+(o[0]===pagDef?'selected':'')+'>'+o[1]+'</option>').join("");
    const riga=(et,val,neg)=>'<div style="display:flex;justify-content:space-between;gap:12px"><span>'+et+'</span><strong>'+(neg?"− ":"")+eur2(val)+'</strong></div>';
    const rigaT=(et,val)=>'<div style="display:flex;justify-content:space-between;gap:12px"><span>'+et+'</span><strong>'+esc(String(val))+'</strong></div>';

    openSheetGrande("Lettera d'incarico",
      '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">L\'incarico</div>'
      +'<div class="field"><label>Oggetto dell\'incarico</label><input id="in-ogg" value="'+esc(p.titolo||"")+'" placeholder="Es. Pratica CILA per ristrutturazione appartamento"></div>'
      +'<div class="field"><label>Prestazioni comprese</label><textarea id="in-prest" rows="6" placeholder="Una prestazione per riga">'+esc(prestazioni)+'</textarea>'
      +'<div class="campo-aiuto">Arrivano dalle voci del preventivo: puoi aggiungerne o toglierne.</div></div>'
      +'<div class="field"><label>Tempi di esecuzione</label><input id="in-tempi" value="'+esc(tempiDef)+'" placeholder="Es. 60 giorni dalla sottoscrizione"></div>'
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Condizioni particolari</div>'
      +'<div class="field"><textarea id="in-note" rows="4" placeholder="Quello che vale solo per questo incarico: esclusioni, oneri, sopralluoghi compresi...">'+esc(p.note||"")+'</textarea></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Il compenso concordato</div>'
      +'<div class="prev-somma" style="text-align:left;line-height:1.9">'
      +  riga("Compenso",cp.compenso)
      +  (cp.spese?riga("Spese (bolli, diritti)",cp.spese):"")
      +  (cp.cassa?riga("Cassa previdenziale",cp.cassa):"")
      +  '<div style="border-top:1px solid var(--linea,#e5e7eb);margin:6px 0"></div>'
      +  riga(cp.spese?"Totale imponibile":"Imponibile IVA",cp.imponibile)
      +  (cp.iva?riga("IVA",cp.iva):"")
      +  (cp.ritenuta?riga("Ritenuta d\'acconto",cp.ritenuta,true):"")
      +  '<div style="border-top:2px solid var(--blu,#0066ff);margin:6px 0"></div>'
      +  '<div style="display:flex;justify-content:space-between;gap:12px;font-size:17px"><span><strong>Netto a pagare</strong></span><strong>'+eur2(cp.totale)+'</strong></div>'
      +'</div>'
      +'<div class="campo-aiuto">Viene dalla parcella del preventivo. Per cambiarlo, modifica il preventivo.</div>'
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">La tua polizza professionale</div>'
      +'<div class="prev-somma" style="text-align:left;line-height:1.9">'
      +  rigaT("Compagnia",pol.comp)
      +  rigaT("Numero di polizza",pol.num)
      +  rigaT("Massimale",eur2(pol.mass))
      +  rigaT("Scadenza",fdate(pol.scad))
      +'</div>'
      +(pol.scaduta
        ? '<p class="sh-nota az-rosso" style="font-weight:700;margin-bottom:0">Attenzione: questa polizza risulta <b>scaduta il '+fdate(pol.scad)+'</b>. Rinnovala e aggiorna i Dati azienda: consegnare una lettera con una polizza scaduta ti lascia scoperto.</p>'
        : '<div class="campo-aiuto">Finisce stampata nella lettera, come vuole la legge. Per cambiarla vai in Dati azienda.</div>')
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Pagamento e firma</div>'
      +'<div class="field"><label>Modalità di pagamento</label><select id="in-pag">'+opzPag+'</select></div>'
      +'<div class="row2">'
      +'<div class="field"><label>Luogo della firma</label><input id="in-luogo" value="'+esc(luogoDef)+'" placeholder="Es. Rieti"></div>'
      +'<div class="field"><label>Foro competente</label><input id="in-foro" value="'+esc(foroDef)+'" placeholder="Es. Rieti"></div></div>'
      +'<p class="sh-nota" style="margin-bottom:0">Il documento esce in PDF con due righe per la firma: tu e il committente. Le clausole standard (recesso, privacy, foro) sono un modello di base: fattelo leggere una volta dal tuo consulente.</p>'
      +'</div>'
      +'</div></div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="incarico-pdf" data-id="'+esc(String(id))+'">Scarica la lettera</button>');
  }

  async function incaricoPdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    const p=prevCache.find(x=>String(x.id)===String(id));if(!p){toast("Preventivo non trovato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return;}
    const c=await cliDelDocumento(p.cliente_id);
    /* Gli stessi due sbarramenti del modulo, ripetuti qui. Non è pignoleria:
       fra l'apertura del modulo e il clic su «Scarica» può passare del tempo,
       e i Dati azienda si possono aprire e svuotare in un'altra scheda.
       Il controllo che conta è quello attaccato al momento della stampa. */
    if(!incaricoClienteOk(c))return;
    const pol=polizzaEstremi(az);
    if(!pol.completa){polizzaFerma(pol);closeSheet();aziendaForm();return;}
    /* polizza scaduta: si avvisa e si lascia decidere. Può capitare di dover
       consegnare la lettera il giorno stesso del rinnovo, e bloccare tutto
       sarebbe peggio del problema. */
    if(pol.scaduta&&!gconfirm("La tua polizza professionale risulta scaduta il "+fdate(pol.scad)+".\n\nSe stampi adesso, la lettera che firma il cliente riporterà questa data.\n\nVuoi stamparla lo stesso?"))return;
    const {data:rr}=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    let tot=0;(rr||[]).forEach(r=>{tot+=impRiga(r.qta,r.prezzo);});
    const cp=calcolaParcella(tot,p.cassa_perc,p.iva_perc,!!p.ritenuta,p.ritenuta_perc||20,p.spese_forfait);

    const V=x=>{const e=$("#"+x);return e?e.value.trim():"";};
    const dati={
      oggetto:V("in-ogg")||p.titolo||"Incarico professionale",
      prestazioni:V("in-prest"),
      tempi:V("in-tempi"),
      note:V("in-note"),
      pagamento:$("#in-pag")?$("#in-pag").value:"saldo",
      luogo:V("in-luogo"),
      foro:V("in-foro")
    };
    incScriviMem({tempi:dati.tempi,pagamento:dati.pagamento,luogo:dati.luogo,foro:dati.foro});

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});
    const M=18, R=210-M, L=R-M;
    let y=20;
    /* salta pagina se non ci sta più niente */
    const spazio=h=>{ if(y+h>272){doc.addPage();y=20;} };
    /* Si stampa RIGA PER RIGA: un testo lungo (le condizioni particolari le
       scrive l'utente e possono essere lunghe quanto vuole) continua sulla
       pagina dopo invece di uscire dal foglio. */
    const paragrafo=(txt,size,grassetto,colore)=>{
      const stile=()=>{doc.setFont("helvetica",grassetto?"bold":"normal");
                       doc.setFontSize(size||9.5);
                       doc.setTextColor(colore==null?0:colore);};
      stile();
      doc.splitTextToSize(String(txt),L).forEach(function(riga){
        if(y+4.6>272){doc.addPage();y=20;stile();}
        doc.text(riga,M,y); y+=4.6;
      });
      doc.setTextColor(0);
    };
    let nArt=0;
    /* gli articoli si numerano da soli: se un pezzo non c'e' (niente tempi,
       niente foro) i numeri restano in fila senza buchi */
    const titoletto=t=>{ nArt++; y+=4; spazio(10); paragrafo(nArt+". "+t,10.5,true); y+=1.5; };

    /* --- intestazione dello studio --- */
    doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    let hy=y+6;
    [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=4.5;});
    doc.setTextColor(0);
    y=hy+6;
    doc.setDrawColor(210);doc.line(M,y,R,y);y+=9;

    doc.setFont("helvetica","bold");doc.setFontSize(15);
    doc.text("LETTERA D'INCARICO PROFESSIONALE",105,y,{align:"center"});y+=6;
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("Rif. preventivo n. "+(p.numero||"")+" del "+fdate(p.data||todayStr()),105,y,{align:"center"});
    doc.setTextColor(0);y+=10;

    /* --- le parti --- */
    const cliRighe=[c.nome||"—"];
    const cliInd=[(c.indirizzo||"").trim(),[(c.cap||"").trim(),(c.citta||"").trim()].filter(Boolean).join(" ")+((c.prov||"").trim()?" ("+String(c.prov).toUpperCase()+")":"")]
      .filter(x=>x&&x.trim()).join(", ");
    if(cliInd)cliRighe.push(cliInd);
    if(c.piva)cliRighe.push("P.IVA "+c.piva);
    if(c.cod_fiscale)cliRighe.push("C.F. "+c.cod_fiscale);
    if(c.referente)cliRighe.push("Nella persona di "+c.referente);

    const proRighe=[az.nome];
    if(azIndirizzo(az))proRighe.push(azIndirizzo(az));
    if(az.piva)proRighe.push("P.IVA "+az.piva);
    if(az.cod_fiscale)proRighe.push("C.F. "+az.cod_fiscale);

    paragrafo("Il giorno "+fdate(todayStr())+", tra:",9.5,false);
    y+=2;
    paragrafo("IL COMMITTENTE",9.5,true);
    cliRighe.forEach(r=>paragrafo(r,9.5,false));
    y+=3;
    paragrafo("E IL PROFESSIONISTA INCARICATO",9.5,true);
    proRighe.forEach(r=>paragrafo(r,9.5,false));
    y+=3;
    paragrafo("si conviene e si stipula quanto segue.",9.5,false);

    /* --- articoli --- */
    titoletto("Oggetto dell'incarico");
    paragrafo("Il Committente affida al Professionista, che accetta, l'incarico avente ad oggetto: "+dati.oggetto+".");

    if(dati.prestazioni){
      titoletto("Prestazioni comprese");
      dati.prestazioni.split("\n").map(x=>x.trim()).filter(Boolean).forEach(function(r){
        paragrafo(r.charAt(0)==="-"?r:("- "+r));
      });
    }

    titoletto("Compenso");
    const vociC=[["Compenso",cp.compenso,false]];
    if(cp.spese)   vociC.push(["Spese (bolli, diritti)",cp.spese,false]);
    if(cp.cassa)   vociC.push(["Cassa previdenziale "+_pct(p.cassa_perc)+"%",cp.cassa,false]);
    vociC.push([cp.spese?"Totale imponibile":"Imponibile IVA",cp.imponibile,false]);
    if(cp.iva)     vociC.push(["IVA "+_pct(p.iva_perc)+"%",cp.iva,false]);
    if(cp.ritenuta)vociC.push(["Ritenuta d'acconto "+_pct(p.ritenuta_perc!=null?p.ritenuta_perc:20)+"%",cp.ritenuta,true]);
    spazio(vociC.length*5.5+18);
    doc.setFont("helvetica","normal");doc.setFontSize(9.5);
    vociC.forEach(function(v){
      doc.text(v[0],M+2,y);
      doc.text((v[2]?"- ":"")+eurPdf(v[1]),R-2,y,{align:"right"});
      y+=5.5;
    });
    doc.setDrawColor(31,111,92);doc.line(M+2,y-2,R-2,y-2);y+=3;
    doc.setFont("helvetica","bold");doc.setFontSize(11);
    doc.text("NETTO A PAGARE",M+2,y+2);
    doc.text(eurPdf(cp.totale),R-2,y+2,{align:"right"});
    y+=9;
    paragrafo("Il compenso è stato preventivamente concordato in forma scritta, ai sensi dell'art. 9, comma 4, del D.L. 24 gennaio 2012 n. 1, convertito con L. 27/2012. Sono esclusi oneri, diritti e bolli dovuti a enti terzi, se non espressamente indicati.",8.8,false,90);

    /* --- LA POLIZZA (11 agosto 2026) ---
       Sta subito dopo il compenso di proposito: la norma che obbliga a
       scrivere l'uno obbliga a scrivere anche l'altra, ed è la stessa citata
       due righe sopra. Tenerli attaccati fa capire al cliente che sono due
       facce dello stesso adempimento. */
    /* Il blocco sta tutto su UNA pagina: titolo, frase e i quattro dati.
       Alla prima prova il titolo era rimasto in fondo al primo foglio e i
       quattro valori erano finiti sul secondo, spaiati: chi girava pagina
       trovava «Generali, 500.000» senza sapere di che si parlasse. Quindi
       prima si misura quanto occupa, poi si decide se cambiare foglio. */
    const polIntro="Ai sensi dell'art. 9, comma 4, del D.L. 24 gennaio 2012 n. 1, il Professionista rende noti al Committente gli estremi della polizza assicurativa stipulata per i danni provocati nell'esercizio dell'attività professionale:";
    const polCoda="Il Professionista si impegna a comunicare tempestivamente al Committente ogni variazione o cessazione della polizza sopra indicata.";
    const vociP=[["Compagnia",pol.comp],
                 ["Numero di polizza",pol.num],
                 ["Massimale",eurPdf(pol.mass)],
                 ["Scadenza",fdate(pol.scad)]];
    doc.setFont("helvetica","normal");doc.setFontSize(9.5);
    const nIntro=doc.splitTextToSize(polIntro,L).length;
    doc.setFontSize(8.8);
    const nCoda=doc.splitTextToSize(polCoda,L).length;
    /* Due misure, non una. Il CUORE (titolo, frase e i quattro dati) non si
       spezza mai. La nota finale invece è una frase compiuta che si legge
       benissimo anche in cima al foglio dopo: pretenderla attaccata costava
       mezza pagina bianca e, spesso, un terzo foglio in più per ogni lettera. */
    const hCuore=4+4.6+1.5+nIntro*4.6+2+vociP.length*5.2;
    const hTutto=hCuore+2+nCoda*4.6;
    if(y+hTutto>272&&y+hCuore>272){doc.addPage();y=20;}
    titoletto("Polizza assicurativa professionale");
    paragrafo(polIntro);
    y+=2;
    doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.setTextColor(0);
    vociP.forEach(function(v){
      doc.text(v[0],M+2,y);
      doc.setFont("helvetica","bold");doc.text(String(v[1]),M+54,y);doc.setFont("helvetica","normal");
      y+=5.2;
    });
    y+=2;
    paragrafo(polCoda,8.8,false,90);

    titoletto("Modalita' di pagamento");
    let testoPag=INC_PAG_TESTO[dati.pagamento]||INC_PAG_TESTO.saldo;
    if(az.iban)testoPag+=" Il pagamento avverra' tramite bonifico bancario sull'IBAN "+az.iban+".";
    if(az.giorni_pagamento)testoPag+=" Le fatture si intendono da saldare entro "+az.giorni_pagamento+" giorni dalla data di emissione.";
    paragrafo(testoPag);

    if(dati.tempi){
      titoletto("Tempi di esecuzione");
      paragrafo("Il Professionista si impegna a concludere le prestazioni entro "+dati.tempi+", salvo i tempi tecnici degli enti competenti, i ritardi non imputabili al Professionista e le eventuali sospensioni dovute a mancata consegna di documenti da parte del Committente.");
    }

    titoletto("Obblighi del Committente");
    paragrafo("Il Committente si impegna a fornire tempestivamente al Professionista tutta la documentazione necessaria (titoli di proprietà, visure, planimetrie, precedenti pratiche edilizie) e a consentire l'accesso ai luoghi per i sopralluoghi necessari.");

    titoletto("Recesso");
    paragrafo("Ciascuna delle parti può recedere dal presente incarico dandone comunicazione scritta all'altra. In caso di recesso, al Professionista spetta il compenso per le prestazioni già svolte fino a quel momento, oltre al rimborso delle spese sostenute.");

    titoletto("Trattamento dei dati personali");
    paragrafo("Le parti si autorizzano reciprocamente al trattamento dei dati personali per le sole finalità connesse all'esecuzione del presente incarico, ai sensi del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003 come modificato.");

    if(dati.foro){
      titoletto("Foro competente");
      paragrafo("Per ogni controversia relativa al presente incarico sarà competente in via esclusiva il Foro di "+dati.foro+".");
    }

    if(dati.note){
      titoletto("Condizioni particolari");
      paragrafo(dati.note);
    }

    /* --- firme ---
       Il blocco firme è UNO SOLO: data, righe di firma e clausole 1341/1342
       stanno insieme o vanno tutte sulla pagina dopo. Firme su un foglio e
       clausole sul foglio successivo non avrebbero senso: è proprio
       l'accostamento che l'art. 1341 c.c. richiede.
       La larghezza del testo delle clausole è 70 mm, quanto la colonna che
       parte da R-70: prima era più larga della colonna e usciva dal foglio. */
    doc.setFont("helvetica","normal");doc.setFontSize(8);
    const clausole=doc.splitTextToSize("Ai sensi degli artt. 1341 e 1342 c.c. il Committente dichiara di approvare specificamente le clausole relative a: modalità di pagamento, recesso e foro competente.",70);
    const hFirme=6+12+5+12+clausole.length*3.6+14;
    y+=8;
    if(y+hFirme>280){doc.addPage();y=20;}

    paragrafo((dati.luogo?dati.luogo+", ":"")+"li "+fdate(todayStr()),9.5,false);
    y+=12;
    doc.setDrawColor(120);
    doc.line(M,y,M+70,y);
    doc.line(R-70,y,R,y);
    y+=5;
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("Il Professionista",M,y);
    doc.text("Il Committente",R-70,y);
    doc.setTextColor(0);
    y+=12;

    doc.setFontSize(8);doc.setTextColor(120);
    doc.text(clausole,R-70,y);
    y+=clausole.length*3.6+8;
    doc.setDrawColor(120);doc.line(R-70,y,R,y);
    doc.text("Il Committente",R-70,y+4);
    doc.setTextColor(0);

    const nomeFile="incarico-"+(p.numero||"")+"-"+String(c.nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".pdf";
    doc.save(nomeFile);
    closeSheet();
    toast("Lettera d'incarico scaricata ✅");
  }

  /* ===== 9 agosto 2026 — CONFERMA D'ORDINE (imprese e artigiani) =====
     È il gemello della lettera d'incarico, ma per chi lavora in cantiere.
     Un preventivo accettato a voce non è un accordo: quando il cliente
     cambia idea a metà lavoro, o non paga, senza un foglio firmato non c'e'
     niente in mano. Questo foglio nasce dal preventivo già fatto.

     Differenze vere rispetto alla lettera d'incarico del professionista:
     - qui c'e' l'IVA (il tecnico ha la parcella con cassa e ritenuta)
     - ci sono i TEMPI DI CANTIERE e le VARIANTI, che sono il punto dove
       finiscono quasi tutte le liti fra impresa e cliente
     - c'e' la garanzia di legge sulle opere (artt. 1667-1669 c.c.)

     ATTENZIONE: modello di base, non un parere legale. Da far leggere una
     volta al proprio consulente. */

  const ORD_MEM="gest_ordine_default";
  function ordLeggiMem(){ try{ return JSON.parse(localStorage.getItem(ORD_MEM)||"{}")||{}; }catch(e){ return {}; } }
  function ordScriviMem(o){ try{ localStorage.setItem(ORD_MEM,JSON.stringify(o)); }catch(e){} }

  const ORD_PAGAMENTI=[
    ["30-40-30","30% alla firma, 40% a metà lavori, 30% alla fine"],
    ["50-50",   "50% alla firma, 50% alla fine dei lavori"],
    ["saldo",   "Tutto alla fine dei lavori"],
    ["sal",     "A stati di avanzamento, come da accordi"],
    ["accordi", "Come indicato nelle condizioni particolari"]
  ];
  const ORD_PAG_TESTO={
    "30-40-30":"Il corrispettivo sarà pagato per il 30% alla sottoscrizione della presente, per il 40% a metà dell'esecuzione delle opere e per il restante 30% alla fine dei lavori.",
    "50-50":   "Il corrispettivo sarà pagato per il 50% alla sottoscrizione della presente e per il restante 50% alla fine dei lavori.",
    "saldo":   "Il corrispettivo sarà pagato in un'unica soluzione alla fine dei lavori.",
    "sal":     "Il corrispettivo sarà pagato per stati di avanzamento dei lavori, secondo quanto concordato fra le parti.",
    "accordi": "Il corrispettivo sarà pagato secondo quanto indicato nelle condizioni particolari."
  };

  async function ordineForm(id){
    if(ruoloUtente==='professionista'){toast("Per gli studi c'è la lettera d'incarico");return;}
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const p=prevCache.find(x=>String(x.id)===String(id));
    if(!p){toast("Preventivo non trovato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    const {data:rr}=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    const righe=rr||[];
    let imponibile=0; righe.forEach(r=>{imponibile+=impRiga(r.qta,r.prezzo);});
    const perc=(p.iva_perc==null||p.iva_perc==="")?null:(+p.iva_perc||0);
    const ivaVal=perc?_centPerc(imponibile,perc):0;
    const totale=_cent2(imponibile+ivaVal);
    const mem=ordLeggiMem();

    /* come nella lettera d'incarico: i titoli dei capitoli restano, senza il
       trattino davanti, così le opere comprese si leggono nello stesso ordine
       e con gli stessi capitoli del preventivo che il cliente ha in mano. */
    const opere=righe.map(r=>(_rigaSezione(r)?"":"- ")+(r.descrizione||"").trim())
                     .filter(x=>x!=="-"&&x!=="").join("\n");
    const luogoDef=mem.luogo||az.citta||"";
    const foroDef=mem.foro||az.citta||"";
    const tempiDef=mem.tempi||"30 giorni lavorativi dall'inizio dei lavori";
    const pagDef=mem.pagamento||"30-40-30";
    const opzPag=ORD_PAGAMENTI.map(o=>'<option value="'+o[0]+'" '+(o[0]===pagDef?'selected':'')+'>'+o[1]+'</option>').join("");
    const riga=(et,v)=>'<div style="display:flex;justify-content:space-between;gap:12px"><span>'+et+'</span><strong>'+eur2(v)+'</strong></div>';

    openSheetGrande("Conferma d'ordine",
      '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Il lavoro</div>'
      +'<div class="field"><label>Oggetto dei lavori</label><input id="or-ogg" value="'+esc(p.titolo||"")+'" placeholder="Es. Rifacimento bagno completo"></div>'
      /* l'indirizzo del cantiere NON si ricorda dalla volta prima: è l'unica
         cosa che cambia sempre, e un documento firmato con l'indirizzo del
         cliente precedente sarebbe un guaio serio */
      +'<div class="field"><label>Dove si lavora</label><input id="or-dove" value="" placeholder="Es. Via Roma 12, Rieti"></div>'
      +'<div class="field"><label>Opere comprese</label><textarea id="or-opere" rows="6" placeholder="Una lavorazione per riga">'+esc(opere)+'</textarea>'
      +'<div class="campo-aiuto">Arrivano dalle voci del preventivo: puoi aggiungerne o toglierne.</div></div>'
      +'<div class="field"><label>Tempi di esecuzione</label><input id="or-tempi" value="'+esc(tempiDef)+'" placeholder="Es. 30 giorni lavorativi dall\'inizio"></div>'
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Condizioni particolari</div>'
      +'<div class="field"><textarea id="or-note" rows="4" placeholder="Quello che vale solo per questo lavoro: cosa NON e\' compreso, chi fornisce i materiali, smaltimento macerie, ponteggio...">'+esc(p.note||"")+'</textarea></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Il prezzo concordato</div>'
      +'<div class="prev-somma" style="text-align:left;line-height:1.9">'
      +  riga("Imponibile",imponibile)
      +  (perc?riga("IVA "+_pct(perc)+"%",ivaVal):"")
      +  '<div style="border-top:2px solid var(--blu,#0066ff);margin:6px 0"></div>'
      +  '<div style="display:flex;justify-content:space-between;gap:12px;font-size:17px"><span><strong>Totale</strong></span><strong>'+eur2(totale)+'</strong></div>'
      +'</div>'
      +'<div class="campo-aiuto">'+(perc==null
          ? 'Nel preventivo non hai indicato l\'IVA: sul foglio uscira\' scritto "IVA esclusa". Per farci comparire il totale finito, metti l\'aliquota nel preventivo.'
          : 'Viene dal preventivo. Per cambiarlo, modifica il preventivo.')+'</div>'
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Pagamento e firma</div>'
      +'<div class="field"><label>Come si paga</label><select id="or-pag">'+opzPag+'</select></div>'
      +'<div class="row2">'
      +'<div class="field"><label>Luogo della firma</label><input id="or-luogo" value="'+esc(luogoDef)+'" placeholder="Es. Rieti"></div>'
      +'<div class="field"><label>Foro competente</label><input id="or-foro" value="'+esc(foroDef)+'" placeholder="Es. Rieti"></div></div>'
      +'<p class="sh-nota" style="margin-bottom:0">Il foglio esce in PDF con le righe per la firma tua e del cliente. Le clausole standard (varianti, garanzia, recesso, foro) sono un modello di base: fattelo leggere una volta dal tuo consulente.</p>'
      +'</div>'
      +'</div></div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="ordine-pdf" data-id="'+esc(String(id))+'">Scarica la conferma</button>');
  }

  async function ordinePdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    const p=prevCache.find(x=>String(x.id)===String(id));if(!p){toast("Preventivo non trovato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return;}
    let c={};
    c=await cliDelDocumento(p.cliente_id);
    const {data:rr}=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    let imponibile=0;(rr||[]).forEach(r=>{imponibile+=impRiga(r.qta,r.prezzo);});
    const perc=(p.iva_perc==null||p.iva_perc==="")?null:(+p.iva_perc||0);
    const ivaVal=perc?_centPerc(imponibile,perc):0;
    const totale=_cent2(imponibile+ivaVal);

    const V=x=>{const e=$("#"+x);return e?e.value.trim():"";};
    const dati={oggetto:V("or-ogg")||p.titolo||"Lavori", dove:V("or-dove"), opere:V("or-opere"),
                tempi:V("or-tempi"), note:V("or-note"),
                pagamento:$("#or-pag")?$("#or-pag").value:"30-40-30",
                luogo:V("or-luogo"), foro:V("or-foro")};
    ordScriviMem({tempi:dati.tempi,pagamento:dati.pagamento,luogo:dati.luogo,foro:dati.foro});

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});
    const M=18, R=210-M, L=R-M;
    let y=20;
    const paragrafo=(txt,size,grassetto,colore)=>{
      const stile=()=>{doc.setFont("helvetica",grassetto?"bold":"normal");
                       doc.setFontSize(size||9.5);
                       doc.setTextColor(colore==null?0:colore);};
      stile();
      doc.splitTextToSize(String(txt),L).forEach(function(riga){
        if(y+4.6>272){doc.addPage();y=20;stile();}
        doc.text(riga,M,y); y+=4.6;
      });
      doc.setTextColor(0);
    };
    let nArt=0;
    const titoletto=t=>{ nArt++; y+=4; if(y+10>272){doc.addPage();y=20;} paragrafo(nArt+". "+t,10.5,true); y+=1.5; };

    /* intestazione impresa */
    doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    let hy=y+6;
    [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=4.5;});
    doc.setTextColor(0);
    y=hy+6;doc.setDrawColor(210);doc.line(M,y,R,y);y+=9;

    doc.setFont("helvetica","bold");doc.setFontSize(15);
    doc.text("CONFERMA D'ORDINE",105,y,{align:"center"});y+=6;
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("Rif. preventivo n. "+(p.numero||"")+" del "+fdate(p.data||todayStr()),105,y,{align:"center"});
    doc.setTextColor(0);y+=10;

    /* le parti */
    const cliInd=[(c.indirizzo||"").trim(),[(c.cap||"").trim(),(c.citta||"").trim()].filter(Boolean).join(" ")+((c.prov||"").trim()?" ("+String(c.prov).toUpperCase()+")":"")]
      .filter(x=>x&&x.trim()).join(", ");
    const cliRighe=[c.nome||"—"];
    if(cliInd)cliRighe.push(cliInd);
    if(c.piva)cliRighe.push("P.IVA "+c.piva);
    if(c.cod_fiscale)cliRighe.push("C.F. "+c.cod_fiscale);
    if(c.referente)cliRighe.push("Nella persona di "+c.referente);
    const impRighe=[az.nome];
    if(azIndirizzo(az))impRighe.push(azIndirizzo(az));
    if(az.piva)impRighe.push("P.IVA "+az.piva);
    if(az.cod_fiscale)impRighe.push("C.F. "+az.cod_fiscale);

    paragrafo("Il giorno "+fdate(todayStr())+", tra:",9.5,false);y+=2;
    paragrafo("IL COMMITTENTE",9.5,true);
    cliRighe.forEach(r=>paragrafo(r,9.5,false));y+=3;
    paragrafo("E L'IMPRESA ESECUTRICE",9.5,true);
    impRighe.forEach(r=>paragrafo(r,9.5,false));y+=3;
    paragrafo("si conviene e si stipula quanto segue.",9.5,false);

    titoletto("Oggetto dei lavori");
    paragrafo("Il Committente affida all'Impresa, che accetta, l'esecuzione delle seguenti opere: "+dati.oggetto
      +(dati.dove?". I lavori saranno eseguiti presso: "+dati.dove:"")+".");

    if(dati.opere){
      titoletto("Opere comprese");
      dati.opere.split("\n").map(x=>x.trim()).filter(Boolean).forEach(function(r){
        paragrafo(r.charAt(0)==="-"?r:("- "+r));
      });
      paragrafo("Tutto quanto non espressamente indicato sopra si intende escluso.",8.8,false,90);
    }

    titoletto("Corrispettivo");
    const voci=[["Imponibile",imponibile]];
    if(perc)voci.push(["IVA "+_pct(perc)+"%",ivaVal]);
    if(y+voci.length*5.5+18>272){doc.addPage();y=20;}
    doc.setFont("helvetica","normal");doc.setFontSize(9.5);
    voci.forEach(function(v){doc.text(v[0],M+2,y);doc.text(eurPdf(v[1]),R-2,y,{align:"right"});y+=5.5;});
    doc.setDrawColor(31,111,92);doc.line(M+2,y-2,R-2,y-2);y+=3;
    doc.setFont("helvetica","bold");doc.setFontSize(11);
    doc.text("TOTALE",M+2,y+2);doc.text(eurPdf(totale),R-2,y+2,{align:"right"});
    y+=9;
    paragrafo(perc==null
      ? "Il corrispettivo si intende IVA esclusa. Il prezzo è fisso e invariabile per le opere sopra indicate."
      : "Il prezzo è fisso e invariabile per le opere sopra indicate, comprensivo di IVA nella misura riportata.",8.8,false,90);

    titoletto("Modalita' di pagamento");
    let tp=ORD_PAG_TESTO[dati.pagamento]||ORD_PAG_TESTO["30-40-30"];
    if(az.iban)tp+=" Il pagamento avverra' tramite bonifico bancario sull'IBAN "+az.iban+".";
    if(az.giorni_pagamento)tp+=" Le fatture si intendono da saldare entro "+az.giorni_pagamento+" giorni dalla data di emissione.";
    paragrafo(tp);

    if(dati.tempi){
      titoletto("Tempi di esecuzione");
      paragrafo("L'Impresa si impegna a completare le opere entro "+dati.tempi+". Non sono computati nei termini i giorni di maltempo che impediscono la lavorazione, le sospensioni richieste dal Committente, i ritardi dovuti a forniture o autorizzazioni non dipendenti dall'Impresa.");
    }

    titoletto("Varianti e lavori aggiuntivi");
    paragrafo("Ogni lavorazione non prevista nella presente conferma d'ordine dovrà essere concordata per iscritto fra le parti, con indicazione del relativo prezzo, prima della sua esecuzione. In mancanza di accordo scritto, l'Impresa non è tenuta a eseguirla e il Committente non è tenuto a pagarla.");

    titoletto("Obblighi del Committente");
    paragrafo("Il Committente garantisce all'Impresa il libero accesso ai luoghi, la disponibilita' di acqua ed energia elettrica di cantiere, e dichiara di aver ottenuto ogni autorizzazione o titolo edilizio eventualmente necessario per le opere oggetto della presente.");

    titoletto("Garanzia sulle opere");
    paragrafo("L'Impresa garantisce le opere eseguite a regola d'arte ai sensi degli artt. 1667 e 1669 del codice civile. Eventuali difformita' o vizi dovranno essere denunciati dal Committente entro i termini di legge.");

    titoletto("Recesso");
    paragrafo("Il Committente può recedere in qualunque momento, tenendo indenne l'Impresa delle spese sostenute, dei lavori eseguiti e del mancato guadagno, ai sensi dell'art. 1671 del codice civile.");

    titoletto("Trattamento dei dati personali");
    paragrafo("Le parti si autorizzano reciprocamente al trattamento dei dati personali per le sole finalità connesse all'esecuzione dei presenti lavori, ai sensi del Regolamento UE 2016/679 (GDPR).");

    if(dati.foro){
      titoletto("Foro competente");
      paragrafo("Per ogni controversia relativa alla presente sarà competente in via esclusiva il Foro di "+dati.foro+".");
    }

    if(dati.note){
      titoletto("Condizioni particolari");
      paragrafo(dati.note);
    }

    /* firme: blocco unico, larghezza del testo = larghezza della colonna */
    doc.setFont("helvetica","normal");doc.setFontSize(8);
    const clausole=doc.splitTextToSize("Ai sensi degli artt. 1341 e 1342 c.c. il Committente dichiara di approvare specificamente le clausole relative a: varianti e lavori aggiuntivi, modalità di pagamento, recesso e foro competente.",70);
    const hFirme=6+12+5+12+clausole.length*3.6+14;
    y+=8;
    if(y+hFirme>280){doc.addPage();y=20;}
    paragrafo((dati.luogo?dati.luogo+", ":"")+"li "+fdate(todayStr()),9.5,false);
    y+=12;
    doc.setDrawColor(120);
    doc.line(M,y,M+70,y);
    doc.line(R-70,y,R,y);
    y+=5;
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("L'Impresa",M,y);
    doc.text("Il Committente",R-70,y);
    doc.setTextColor(0);
    y+=12;
    doc.setFontSize(8);doc.setTextColor(120);
    doc.text(clausole,R-70,y);
    y+=clausole.length*3.6+8;
    doc.setDrawColor(120);doc.line(R-70,y,R,y);
    doc.text("Il Committente",R-70,y+4);
    doc.setTextColor(0);

    doc.save("conferma-ordine-"+(p.numero||"")+"-"+String(c.nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".pdf");
    closeSheet();
    toast("Conferma d'ordine scaricata ✅");
  }

  /* ===== 9 agosto 2026 — VERBALE DI SOPRALLUOGO (studi professionali) =====
     Oggi il sopralluogo si fa così: foto sparse nel telefono e due appunti su
     un foglio, che poi vanno riscritti in ufficio. Qui il verbale nasce dalle
     foto GIA' caricate in Galleria su quella pratica: si scrive cosa si è
     visto, si spuntano le foto che servono, ed esce un PDF firmabile.
     A cosa serve davvero: è la prova di com'era lo stato dei luoghi PRIMA.
     Quando sei mesi dopo qualcuno dice "quella crepa c'era gia'?", il verbale
     con la data e le foto risponde da solo. */

  const VER_MEM="gest_verbale_default";
  function verLeggiMem(){ try{ return JSON.parse(localStorage.getItem(VER_MEM)||"{}")||{}; }catch(e){ return {}; } }
  function verScriviMem(o){ try{ localStorage.setItem(VER_MEM,JSON.stringify(o)); }catch(e){} }

  let verFoto=[];   /* le foto della pratica, con l'url firmato già pronto */

  async function verbaleForm(lavId){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const l=(lavCache||[]).find(x=>String(x.id)===String(lavId));
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    let cli={};
    if(l)cli=await cliDelDocumento(l.cliente_id);

    /* le foto già caricate su questa pratica */
    verFoto=[];
    try{
      const {data:fs}=await sb.from("gest_foto").select("id,storage_path,tipo,created_at")
        .eq("user_id",sbUid).eq("lavoro_id",lavId).not("tipo","in",_nonFotoSql)
        .order("created_at",{ascending:true}).limit(12);
      for(const f of (fs||[])){
        const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
        if(su&&su.signedUrl)verFoto.push({id:f.id,url:su.signedUrl});
      }
    }catch(e){}

    const mem=verLeggiMem();
    const fotoHtml=verFoto.length
      ? '<div class="ver-foto">'+verFoto.map(function(f,i){
          return '<label class="ver-f"><input type="checkbox" class="ver-ck" data-i="'+i+'" checked>'
                +'<img src="'+f.url+'" alt="foto '+(i+1)+'"></label>';
        }).join("")+'</div>'
        +'<div class="campo-aiuto">Sono le foto già caricate in Galleria su questa pratica. Togli la spunta a quelle che non vuoi nel verbale.</div>'
      : '<p class="sh-nota" style="margin-top:0">Non ci sono foto su questa pratica. Caricale dalla <b>Galleria</b> (o falle fare in cantiere con l' + String.fromCharCode(39) + 'app dell' + String.fromCharCode(39) + 'operaio) e poi torna qui: entrano nel verbale da sole.</p>';

    openSheetGrande("Verbale di sopralluogo",
      '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Il sopralluogo</div>'
      +'<div class="row2">'
      +'<div class="field"><label>Data</label><input type="date" id="vb-data" value="'+todayStr()+'"></div>'
      +'<div class="field"><label>Ora</label><input id="vb-ora" value="" placeholder="Es. 10:30"></div></div>'
      +'<div class="field"><label>Luogo</label><input id="vb-luogo" value="'+esc((l&&l.dove)||cli.indirizzo||"")+'" placeholder="Es. Via Roma 12, Rieti"></div>'
      +'<div class="field"><label>Presenti</label><textarea id="vb-presenti" rows="3" placeholder="Uno per riga. Es.&#10;Geom. Mario Rossi (tecnico incaricato)&#10;Sig. Luigi Bianchi (proprietario)">'+esc(mem.presenti||"")+'</textarea></div>'
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Che cosa hai visto</div>'
      +'<div class="field"><textarea id="vb-rilievi" rows="8" placeholder="Lo stato dei luoghi, le misure prese, le criticita\' riscontrate. Una riga per punto: nel PDF diventano un elenco numerato."></textarea></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Le foto</div>'
      +fotoHtml
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Conclusioni e firma</div>'
      +'<div class="field"><label>Conclusioni (facoltativo)</label><textarea id="vb-concl" rows="3" placeholder="Es. si rende necessario un rilievo strumentale delle lesioni."></textarea></div>'
      +'<div class="field"><label>Luogo della firma</label><input id="vb-firma-luogo" value="'+esc(mem.luogo||az.citta||"")+'" placeholder="Es. Rieti"></div>'
      +'<p class="sh-nota" style="margin-bottom:0">Il verbale esce in PDF con le foto e le righe per la firma dei presenti. Vale come prova dello stato dei luoghi a quella data.</p>'
      +'</div>'
      +'</div></div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="verbale-pdf" data-id="'+esc(String(lavId))+'">Scarica il verbale</button>');
  }

  /* le foto vanno messe nel PDF come dati, non come indirizzo: l'indirizzo
     firmato scade dopo un'ora e il file resterebbe con i buchi */
  function _fotoInDati(url){
    return new Promise(function(res){
      try{
        fetch(url).then(r=>r.blob()).then(function(b){
          const fr=new FileReader();
          fr.onload=()=>res(String(fr.result||""));
          fr.onerror=()=>res("");
          fr.readAsDataURL(b);
        }).catch(()=>res(""));
      }catch(e){ res(""); }
    });
  }
  function _misuraFoto(dataUrl){
    return new Promise(function(res){
      const im=new Image();
      im.onload=()=>res({w:im.naturalWidth||4,h:im.naturalHeight||3});
      im.onerror=()=>res({w:4,h:3});
      im.src=dataUrl;
    });
  }

  async function verbalePdf(lavId){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    const l=(lavCache||[]).find(x=>String(x.id)===String(lavId))||{};
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return;}
    let cli={};
    cli=await cliDelDocumento(l.cliente_id);

    const V=x=>{const e=$("#"+x);return e?e.value.trim():"";};
    const dati={data:V("vb-data")||todayStr(), ora:V("vb-ora"), luogo:V("vb-luogo"),
                presenti:V("vb-presenti"), rilievi:V("vb-rilievi"),
                concl:V("vb-concl"), firmaLuogo:V("vb-firma-luogo")};
    verScriviMem({presenti:dati.presenti,luogo:dati.firmaLuogo});

    /* quali foto ha lasciato spuntate */
    const scelte=[];
    $$(".ver-ck").forEach(function(ck){ if(ck.checked){const f=verFoto[+ck.dataset.i]; if(f)scelte.push(f);} });

    toast("Preparo il verbale…");
    const immagini=[];
    for(const f of scelte){
      const d=await _fotoInDati(f.url);
      if(!d)continue;
      const m=await _misuraFoto(d);
      immagini.push({d,w:m.w,h:m.h});
    }

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});
    const M=18, R=210-M, L=R-M;
    let y=20;
    const paragrafo=(txt,size,grassetto,colore)=>{
      const stile=()=>{doc.setFont("helvetica",grassetto?"bold":"normal");
                       doc.setFontSize(size||9.5);
                       doc.setTextColor(colore==null?0:colore);};
      stile();
      doc.splitTextToSize(String(txt),L).forEach(function(riga){
        if(y+4.6>272){doc.addPage();y=20;stile();}
        doc.text(riga,M,y); y+=4.6;
      });
      doc.setTextColor(0);
    };
    const titoletto=t=>{ y+=4; if(y+10>272){doc.addPage();y=20;} paragrafo(t,10.5,true); y+=1.5; };

    /* intestazione */
    doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    let hy=y+6;
    [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=4.5;});
    doc.setTextColor(0);
    y=hy+6;doc.setDrawColor(210);doc.line(M,y,R,y);y+=9;

    doc.setFont("helvetica","bold");doc.setFontSize(15);
    doc.text("VERBALE DI SOPRALLUOGO",105,y,{align:"center"});y+=8;

    /* i dati in testa */
    doc.setFont("helvetica","normal");doc.setFontSize(9.5);
    const testa=[["Data",fdate(dati.data)+(dati.ora?"  ore "+dati.ora:"")],
                 ["Luogo",dati.luogo||"—"],
                 ["Pratica",l.descrizione||"—"],
                 ["Committente",cli.nome||"—"]];
    testa.forEach(function(r){
      if(y+6>272){doc.addPage();y=20;}
      doc.setFont("helvetica","bold");doc.text(r[0],M,y);
      doc.setFont("helvetica","normal");
      doc.splitTextToSize(String(r[1]),L-32).forEach(function(riga,i){
        doc.text(riga,M+32,y+(i*4.6));
      });
      y+=Math.max(6,doc.splitTextToSize(String(r[1]),L-32).length*4.6+1.4);
    });
    y+=2;doc.setDrawColor(210);doc.line(M,y,R,y);y+=4;

    if(dati.presenti){
      titoletto("Presenti al sopralluogo");
      dati.presenti.split("\n").map(x=>x.trim()).filter(Boolean).forEach(function(r){
        paragrafo(r.charAt(0)==="-"?r:("- "+r));
      });
    }

    titoletto("Stato dei luoghi e rilievi");
    if(dati.rilievi){
      const punti=dati.rilievi.split("\n").map(x=>x.trim()).filter(Boolean);
      if(punti.length>1)punti.forEach(function(r,i){ paragrafo((i+1)+". "+r.replace(/^[-\d.\s]+/,"")); });
      else paragrafo(punti[0]);
    }else{
      paragrafo("—");
    }

    /* le foto: due per riga, mantenendo le proporzioni */
    if(immagini.length){
      titoletto("Documentazione fotografica");
      const larg=(L-6)/2, HMAX=70;
      /* Le misure si calcolano PRIMA, tutte. Due cose che prima sbagliavano:
         1) col tetto di 70 mm si accorciava l'altezza ma non la larghezza, e
            una foto verticale del telefono usciva schiacciata: su un verbale
            che deve provare lo stato dei luoghi è un difetto serio;
         2) il salto pagina guardava solo la PRIMA foto della riga, quindi una
            seconda foto più alta finiva sotto il bordo del foglio. */
      const dim=immagini.map(function(im){
        let w=larg, h=larg*(im.h/im.w);
        if(h>HMAX){ h=HMAX; w=HMAX*(im.w/im.h); }   /* si scala anche la larghezza */
        return {w:w,h:h};
      });
      for(let i=0;i<immagini.length;i+=2){
        const a=dim[i], b=dim[i+1];
        const hRiga=Math.max(a.h, b?b.h:0);
        if(y+hRiga+10>272){doc.addPage();y=20;}
        [i,i+1].forEach(function(k,col){
          if(k>=immagini.length)return;
          const d=dim[k];
          /* centrata nella sua colonna: le verticali non restano appiccicate a sinistra */
          const x=M+col*(larg+6)+(larg-d.w)/2;
          try{ doc.addImage(immagini[k].d,"JPEG",x,y,d.w,d.h,undefined,"FAST"); }catch(e){}
          doc.setFontSize(8);doc.setTextColor(120);
          doc.text("Foto "+(k+1),M+col*(larg+6),y+hRiga+4);
          doc.setTextColor(0);
        });
        y+=hRiga+10;
      }
    }

    if(dati.concl){
      titoletto("Conclusioni");
      paragrafo(dati.concl);
    }

    /* firme dei presenti: blocco unico */
    const hFirme=6+14+6+10;
    y+=6;
    if(y+hFirme>280){doc.addPage();y=20;}
    paragrafo("Il presente verbale, redatto in contraddittorio fra i presenti, documenta lo stato dei luoghi alla data sopra indicata.",8.8,false,90);
    y+=6;
    paragrafo((dati.firmaLuogo?dati.firmaLuogo+", ":"")+"li "+fdate(dati.data),9.5,false);
    y+=12;
    doc.setDrawColor(120);
    doc.line(M,y,M+70,y);
    doc.line(R-70,y,R,y);
    y+=5;
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("Il tecnico",M,y);
    doc.text("Il committente",R-70,y);
    doc.setTextColor(0);

    doc.save("verbale-sopralluogo-"+fdate(dati.data).replace(/\//g,"-")+"-"+String(l.descrizione||"pratica").replace(/[^a-z0-9]+/gi,"-").toLowerCase().slice(0,40)+".pdf");
    closeSheet();
    toast("Verbale scaricato ✅");
  }
