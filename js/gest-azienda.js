/* ═══ FETTA F1 · I DATI DELL'AZIENDA ══════════════════════════════════
   Staccata da gestionale-app.html il 6 settembre 2026 (righe 8570-8825).

   COSA C'E' DENTRO — la scheda «Dati azienda» tutta intera, un blocco solo:
   aziendaRow (la riga letta dal database), REGIMI (i regimi fiscali della
   fattura elettronica), azIndirizzo (indirizzo su una riga sola per le
   intestazioni dei PDF), aziendaForm (il modulo) e saveAzienda (il
   salvataggio, con il ricupero quando una colonna nuova non c'e' ancora nel
   database). Taglio puro: dentro non e' cambiato un carattere.

   ⚠️ CHI CHIAMA QUESTA ROBA DA FUORI — e perche' funziona lo stesso
   - `azIndirizzo` la usano js/gest-computo-pdf.js (in 4 punti), la stampa
     dei PDF dentro la pagina e il backup JSON. La chiamano tutti DENTRO una
     funzione: quando quella funzione gira, questo file e' gia' nato.
   - `aziendaForm` la usano js/gest-computo-pdf.js e js/gest-documenti-pdf.js
     per mandarti a riempire i dati quando mancano. Stessa cosa.
   - `aziendaRow` la legge la pagina in piu' punti. Questo file parte PRIMA
     della pagina, quindi quando la pagina la cerca, esiste gia'.

   COSA NON C'E', E PERCHE'
   - `delPanel` (~riga 8371) NON e' di questa fetta: e' il pannello di
     eliminazione generale, lo usano anche i reparti. Resta nella pagina.
   - `eurPdf`, `_umPdf`, `generaPdf` (subito sotto) sono la stampa: non
     c'entrano con i dati azienda. Restano dove sono.
   - Clienti e Fornitori restano nella pagina: sono blocchi sparsi, si
     staccano in un taglio loro.

   ⛔ LE DUE REGOLE DI QUESTO FILE
   1. Non e' chiuso dentro niente (niente IIFE): vive nello stesso spazio
      della pagina e vede sb, sbUid, cur, esc, toast, closeSheet, $ senza che
      nessuno glieli passi. Per la stessa ragione, un nome dichiarato anche
      nella pagina spegnerebbe TUTTO il gestionale al caricamento.
   2. Al primo livello qui non si puo' USARE niente che stia nella pagina:
      questo file parte PRIMA. `aziendaRow` e' null e `REGIMI` e' un elenco
      scritto a mano: non chiamano niente, per questo possono stare in cima.

   Il banco che protegge tutto questo:
   prove-claude/banchi-fissi/smontaggio/banco-fette.js
   ═══════════════════════════════════════════════════════════════════════ */

  let aziendaRow=null;

  /* Regimi fiscali della fattura elettronica. Ne tengo pochi: sono quelli che
     usa davvero un'impresa edile o un artigiano. Gli altri li sa il commercialista. */
  const REGIMI=[
    ["RF01","RF01 — Ordinario (il più comune)"],
    ["RF19","RF19 — Forfettario"],
    ["RF02","RF02 — Minimi (vecchio regime)"],
    ["RF17","RF17 — IVA per cassa"],
    ["RF16","RF16 — IVA per cassa verso la Pubblica Amministrazione"]
  ];

  /* L'indirizzo completo, messo insieme dai pezzi. Serve ai PDF e alla Mappa.
     Se città e CAP non sono ancora compilati, resta quello che c'era prima:
     così chi ha già scritto tutto dentro "Via e numero" non perde niente. */
  function azIndirizzo(a){
    if(!a)return "";
    const via=(a.indirizzo||"").trim();
    const coda=[(a.cap||"").trim(),(a.citta||"").trim()].filter(Boolean).join(" ");
    const pr=(a.prov||"").trim();
    if(!coda&&!pr)return via;
    return [via,coda+(pr?" ("+pr.toUpperCase()+")":"")].filter(Boolean).join(", ");
  }

  async function aziendaForm(){
    aziendaRow=null;
    if(sb&&sbUid){
      /* ===== 12 agosto 2026 (sera) — LA RETE DI SICUREZZA =====
         Questi sono i dati che finiscono su OGNI fattura: ragione sociale,
         P.IVA, IBAN, regime fiscale, codice SdI, polizza. L'errore della
         lettura non lo guardava nessuno: se il database non rispondeva il
         modulo si apriva tutto vuoto, e il Salva scriveva il vuoto sopra i dati
         veri. Bastava aprire "Dati azienda" nel momento sbagliato, premere
         Salva senza cambiare niente, e la partita IVA spariva. */
      const {data,error:erA}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
      if(erA){
        toast("Non riesco a leggere i dati dell'azienda: "+(erA.message||"il database non risponde")
              +". Non apro il modulo, se no salvandolo li cancelli. Riprova fra un attimo.");
        return;
      }
      aziendaRow=data||null;
    }
    const a=aziendaRow||{};
    const reg=a.regime_fiscale||"RF01";
    /* Modulo lungo -> finestra grande a due colonne, come persona, lavoro e
       preventivo. A sinistra chi sei e dove sei, a destra fisco e cantiere.
       Sotto i 900px torna una colonna sola. */
    openSheetGrande("Dati azienda",
      `<div class="sh-cols"><div class="sh-col">

      <div class="sh-b">
        <div class="sh-tit">Chi sei</div>
        <div class="field"><label>Nome / Ragione sociale</label><input id="a-nome" value="${esc(a.nome||"")}" placeholder="Es. Multiservizi Rossi srl"></div>
        <div class="row2">
          <div class="field"><label>Partita IVA</label><input id="a-piva" value="${esc(a.piva||"")}" placeholder="Es. 01234567890"></div>
          <div class="field"><label>Codice fiscale</label><input id="a-cf" value="${esc(a.cod_fiscale||"")}" placeholder="Se diverso dalla P.IVA"></div>
        </div>
        <div class="sh-nota">Compaiono in cima a ogni PDF di preventivo e fattura.</div>
      </div>

      <div class="sh-b">
        <div class="sh-tit">Dove sei</div>
        <!-- ⚠️ 22 agosto 2026 — «Es.» DAVANTI A TUTTI E TRE, e non e' un dettaglio.
             La via lo aveva («Es. Via Dante Alighieri, 5»), CAP, Citta' e
             Provincia no: dicevano «02100», «Rieti», «RI» e basta. Un
             suggerimento senza «Es.» sembra una casella gia' compilata, e
             quelle tre sono rimaste vuote per mesi — con l'indirizzo che
             usciva a meta' su OGNI PDF (preventivi, fatture, computo, SAL,
             lista per la gara, analisi dei prezzi).
             Peggio: l'esempio era l'indirizzo VERO di Alessio, quindi la
             schermata sembrava piena anche a lui. Visto in una foto il 22
             agosto, mentre cercavamo perche' l'indirizzo usciva corto. -->
        <div class="field"><label>Via e numero</label><input id="a-ind" value="${esc(a.indirizzo||"")}" placeholder="Es. Via Dante Alighieri, 5"></div>
        <div class="row2">
          <div class="field"><label>CAP</label><input id="a-cap" value="${esc(a.cap||"")}" placeholder="Es. 02100" inputmode="numeric"></div>
          <div class="field"><label>Città</label><input id="a-citta" value="${esc(a.citta||"")}" placeholder="Es. Rieti"></div>
        </div>
        <div class="field"><label>Provincia</label><input id="a-prov" value="${esc(a.prov||"")}" placeholder="Es. RI" maxlength="2" style="max-width:120px;text-transform:uppercase"></div>
        <div class="sh-nota">La Mappa parte da qui per calcolare le distanze dei cantieri.</div>
      </div>

      <div class="sh-b">
        <div class="sh-tit">Come ti trovano e come ti pagano</div>
        <div class="row2">
          <div class="field"><label>Telefono</label><input id="a-tel" type="tel" value="${esc(a.tel||"")}"></div>
          <div class="field"><label>Email</label><input id="a-email" type="email" value="${esc(a.email||"")}"></div>
        </div>
        <div class="field"><label>IBAN (per i bonifici)</label><input id="a-iban" value="${esc(a.iban||"")}" placeholder="IT.."></div>
        <div class="field"><label>Entro quanti giorni ti devono pagare</label>
          <input type="number" id="a-gg" inputmode="numeric" value="${a.giorni_pagamento||30}" placeholder="30"></div>
        <div class="sh-nota">I giorni servono alle Fatture per dirti quando una fattura è scaduta. Di solito 30.</div>
        <!-- ⛔ 22 agosto 2026 — QUANTO CHIEDI ALL'ORA.
             Non e' il costo del collaboratore (gest_operatori.costo_orario, che
             e' quanto COSTA lui e serve al Report): questo e' quanto CHIEDI tu
             al cliente. Confonderli vuol dire fatturare il proprio costo.
             Serve al pulsante «Porta le ore nella parcella»: senza, le righe
             arrivano col prezzo vuoto. Se la colonna nel database non c'e'
             ancora, saveAzienda la lascia cadere e tutto il resto si salva. -->
        <div class="field"><label>Quanto chiedi all'ora (€)</label>
          <input type="text" id="a-tariffa" inputmode="decimal" value="${a.tariffa_oraria!=null&&a.tariffa_oraria!==""?esc(_numTesto(a.tariffa_oraria)):""}" placeholder="Es. 35,00" data-euro></div>
        <div class="sh-nota">Serve al pulsante <b>«Porta le ore nella parcella»</b> nel registro delle ore: le ore diventano righe già col prezzo. Se lo lasci vuoto, le righe arrivano <b>senza prezzo</b> e lo scrivi tu. ⛔ Non è il costo di un collaboratore: è quanto <b>chiedi tu</b>.</div>
        ${ruoloUtente==='professionista'?`
        <div class="field" style="border-top:1px solid var(--linea,#e5e7eb);padding-top:14px;margin-top:14px">
          <label>Crediti formativi da fare ogni anno (CFP)</label>
          <input type="number" id="a-cfp" inputmode="numeric" value="${a.cfp_obiettivo!=null?a.cfp_obiettivo:30}" placeholder="30"></div>
        <div class="sh-nota">Di norma <b>30</b> per ingegneri e architetti, <b>20</b> per i geometri. È l'obiettivo che vedi nella sezione Crediti formativi.</div>`:""}
      </div>

      </div><div class="sh-col">

      <div class="sh-b">
        <div class="sh-tit">Fattura elettronica</div>
        <div class="field"><label>Regime fiscale</label>
          <select id="a-regime">${REGIMI.map(r=>`<option value="${r[0]}"${reg===r[0]?" selected":""}>${r[1]}</option>`).join("")}</select></div>
        <div class="field"><label>Codice destinatario</label>
          <input id="a-sdi" value="${esc(a.sdi_codice||"")}" placeholder="7 caratteri, oppure 0000000" maxlength="7" style="text-transform:uppercase"></div>
        <div class="field"><label>PEC</label><input id="a-pec" type="email" value="${esc(a.sdi_pec||"")}" placeholder="nomeazienda@pec.it"></div>
        <div class="sh-nota">Questi tre te li dà il commercialista. Non servono ancora a niente: li chiederà la fattura elettronica, che sto ancora costruendo. Compilarli adesso ti fa risparmiare tempo dopo.</div>
      </div>

      ${ruoloUtente==='professionista'?`
      <div class="sh-b">
        <div class="sh-tit">Polizza professionale</div>
        <div class="field"><label>Compagnia assicurativa</label><input id="a-pol-comp" value="${esc(a.pol_compagnia||"")}" placeholder="Es. Generali Italia"></div>
        <div class="field"><label>Numero di polizza</label><input id="a-pol-num" value="${esc(a.pol_numero||"")}" placeholder="Come sul certificato"></div>
        <div class="row2">
          <div class="field"><label>Massimale (€)</label>
            <input type="text" id="a-pol-mass" inputmode="decimal" value="${a.pol_massimale!=null&&a.pol_massimale!==""?esc(_numTesto(a.pol_massimale)):""}" placeholder="Es. 500.000" data-euro></div>
          <div class="field"><label>Scadenza</label><input type="date" id="a-pol-scad" value="${esc(a.pol_scadenza||"")}"></div>
        </div>
        <div class="sh-nota">Li scrivi <b>una volta sola</b> e restano lì. Finiscono stampati in ogni lettera d'incarico, perché <b class="az-rosso">la legge lo pretende</b> (art. 9 comma 4 del DL 1/2012). Finché mancano, la lettera d'incarico non si scarica.</div>
      </div>`:""}

      ${ruoloUtente==='professionista'?"":`
      <div class="sh-b">
        <div class="sh-tit">Patente a crediti</div>
        <div class="row2">
          <div class="field"><label>Numero patente</label><input id="a-pat-n" value="${esc(a.pat_numero||"")}" placeholder="Come sul portale INL"></div>
          <div class="field"><label>Data di rilascio</label><input type="date" id="a-pat-d" value="${esc(a.pat_data||"")}"></div>
        </div>
        <div class="field"><label>Crediti attuali</label>
          <input type="number" id="a-pat-c" inputmode="numeric" min="0" max="100" value="${a.pat_crediti!=null?a.pat_crediti:""}" placeholder="30" style="max-width:160px"></div>
        <div class="sh-nota">Si parte da 30 crediti; <b class="az-rosso">sotto 15 non si può operare in cantiere</b>. Il Riepilogo ti avvisa già sotto 20, così hai tempo di recuperarli. È dell'impresa, non del singolo dipendente. Aggiornalo tu quando cambia: non si può leggere da solo dal portale.</div>
      </div>`}

      <div class="sh-b">
        <div class="sh-tit">Email dal gestionale</div>
        <label for="a-rieplun" style="display:flex;gap:12px;align-items:flex-start;font-size:16px;line-height:1.6;cursor:pointer;padding:4px 0">
          <input type="checkbox" id="a-rieplun"${a.riepilogo_lunedi===false?"":" checked"} style="width:22px;height:22px;margin:2px 0 0;flex:0 0 auto;cursor:pointer">
          <span>Mandami il <b>riepilogo del lunedì</b> mattina</span>
        </label>
        <div class="sh-nota">Un'email il lunedì alle 7:30 con le scadenze della settimana, le fatture che non ti hanno ancora pagato e ${ruoloUtente==='professionista'?"le pratiche":"i lavori"} in ritardo. <b>Se in una settimana non c'è niente da segnalare, non arriva niente</b>: nessuna email a vuoto.</div>
      </div>

      </div></div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-azienda">Salva</button>`);
  }
  async function saveAzienda(){
    if(!sbUid){toast("Devi essere loggato");return;}
    const v=id=>{const e=$(id);return e?String(e.value||"").trim():"";};
    const row={user_id:sbUid,
      nome:v("#a-nome"),piva:v("#a-piva"),indirizzo:v("#a-ind"),
      tel:v("#a-tel"),email:v("#a-email"),iban:v("#a-iban"),
      num_fatt:(aziendaRow&&aziendaRow.num_fatt!=null)?aziendaRow.num_fatt:1};
    /* dove sei + dati fiscali: tutti facoltativi. Vuoto = null, così si può
       anche svuotare un campo compilato per sbaglio. */
    row.cod_fiscale    = v("#a-cf").toUpperCase()||null;
    row.cap            = v("#a-cap")||null;
    row.citta          = v("#a-citta")||null;
    row.prov           = v("#a-prov").toUpperCase()||null;
    row.regime_fiscale = v("#a-regime")||null;
    row.sdi_codice     = v("#a-sdi").toUpperCase()||null;
    row.sdi_pec        = v("#a-pec")||null;
    const gg=parseInt($("#a-gg")?$("#a-gg").value:"",10);
    if(gg>0)row.giorni_pagamento=gg;
    /* obiettivo CFP: il campo c'e' solo per gli studi, quindi si scrive solo
       se esiste (se no un'impresa azzererebbe il valore senza saperlo) */
    if($("#a-cfp")){
      const cfp=parseInt($("#a-cfp").value,10);
      row.cfp_obiettivo=(cfp>0)?cfp:null;
    }
    /* patente a crediti: campi facoltativi. Vuoto = null, così si può anche
       svuotare un campo compilato per sbaglio.
       ATTENZIONE (9/8/2026): per gli studi il blocco non compare più. Se
       scrivessimo lo stesso, i campi assenti risulterebbero vuoti e il
       salvataggio AZZEREREBBE una patente già registrata. Quindi si tocca
       solo se il blocco c'e' davvero. */
    if($("#a-pat-n")||$("#a-pat-d")||$("#a-pat-c")){
      const patN=$("#a-pat-n")?$("#a-pat-n").value.trim():"";
      const patD=$("#a-pat-d")?$("#a-pat-d").value:"";
      const patC=$("#a-pat-c")?$("#a-pat-c").value.trim():"";
      row.pat_numero  = patN||null;
      row.pat_data    = patD||null;
      row.pat_crediti = patC===""?null:Math.max(0,parseInt(patC,10)||0);
    }
    /* polizza professionale: stessa precauzione della patente al contrario.
       Il riquadro c'e' solo per gli studi; se scrivessimo sempre, un'impresa
       che salva i suoi dati cancellerebbe una polizza registrata dallo studio.
       Quindi si tocca solo se i campi ci sono davvero. */
    if($("#a-pol-comp")||$("#a-pol-num")||$("#a-pol-mass")||$("#a-pol-scad")){
      /* ⛔ 4 settembre 2026 — QUI C'ERA UNA CASELLA type="number".
         Il massimale e' l'unico numero grande di questo modulo, e chi lo
         scrive lo scrive come si scrive: «1.000.000». Una casella number
         quel valore non lo accetta e si SVUOTA da sola, senza dire niente:
         premevi Salva e il massimale spariva. E anche leggendolo a mano
         `parseFloat("1.000.000")` avrebbe fatto 1.
         Adesso e' una casella di testo letta da `_numeroIt`, la stessa
         regola italiana di tutto il resto, e porta il `data-euro` che mette
         il punto delle migliaia — che e' proprio il caso per cui Alessio
         l'aveva chiesto il 22 agosto: «500000» e «500.000» sono lo stesso
         numero, ma uno zero di troppo si vede solo nel secondo. */
      const polM=$("#a-pol-mass")?String($("#a-pol-mass").value||"").trim():"";
      row.pol_compagnia = v("#a-pol-comp")||null;
      row.pol_numero    = v("#a-pol-num")||null;
      /* il tetto non è pignoleria: la colonna regge fino a 10 miliardi, e un
         dito appoggiato sullo zero farebbe fallire il salvataggio con un
         messaggio del database che non spiega niente */
      row.pol_massimale = polM===""?null:Math.min(999999999,Math.max(0,_numeroIt(polM)||0));
      row.pol_scadenza  = ($("#a-pol-scad")?$("#a-pol-scad").value:"")||null;
    }
    /* riepilogo del lunedì: la casella c'e' per tutti i ruoli, quindi qui non
       serve la precauzione della patente e della polizza */
    if($("#a-rieplun"))row.riepilogo_lunedi=!!$("#a-rieplun").checked;
    /* 22 agosto 2026 — la tariffa oraria. Vuoto = null, non zero: uno zero
       sembra un prezzo, il vuoto si vede che manca. */
    if($("#a-tariffa")){
      const tv=String($("#a-tariffa").value||"").trim();
      row.tariffa_oraria = tv===""?null:Math.max(0,_numeroIt(tv)||0);
    }

    let {error}=await sb.from("gest_azienda").upsert(row,{onConflict:"user_id"});
    /* se una colonna aggiunta di recente non c'e' ancora nel database, salvo
       tutto il resto lo stesso invece di far fallire il salvataggio */
    const OPZ=["giorni_pagamento","pat_numero","pat_data","pat_crediti","cfp_obiettivo",
               "cod_fiscale","cap","citta","prov","regime_fiscale","sdi_codice","sdi_pec",
               "pol_compagnia","pol_numero","pol_massimale","pol_scadenza",
               "riepilogo_lunedi","tariffa_oraria"];
    const tolte=[];
    while(error){
      const c=OPZ.find(x=>!tolte.includes(x)&&(error.message||"").indexOf(x)>=0);
      if(!c)break;
      delete row[c];tolte.push(c);
      ({error}=await sb.from("gest_azienda").upsert(row,{onConflict:"user_id"}));
    }
    if(!error&&tolte.length){
      /* se a cadere è la polizza lo dico chiaro: senza quelle colonne la
         lettera d'incarico resterà bloccata, e un "alcuni campi" generico
         lascerebbe cercare il motivo dalla parte sbagliata */
      toast(tolte.some(x=>x.indexOf("pol_")===0)
        ? "Salvato, ma la polizza non si è registrata: manca la migrazione del database (sql/gest-azienda-polizza.sql)."
        : "Salvato, ma alcuni campi nuovi richiedono un aggiornamento del database.");
    }
    if(error){toast("Errore: "+error.message);return;}
    closeSheet();toast("Dati azienda salvati ✔");
  }
