/* foto dello studio (sessione 8): faccia professionista + forfettario.
   node docs/foto-studio.js <fatture|fattura-fondo|computo|ribasso|parcella|sal|collaboratori|persona|strumenti|giornate|crediti> <larghezza> <file.png>   (dalla cartella del progetto; in nuvola google-chrome di sistema)  */
"use strict";
const path=require("path"), B=require(path.resolve("tools/banco-gestionale.js"));
(async()=>{
  const [, , scena, larg, file]=process.argv;
  const W=+larg||375, tel=W<800;
  const srv=await B.servi(), base="http://127.0.0.1:"+srv.address().port;
  const browser=await B.chromium.launch(require("fs").existsSync("/usr/bin/google-chrome")?{executablePath:"/usr/bin/google-chrome"}:{});
  const ctx=await browser.newContext(tel?{viewport:{width:W,height:+process.env.ALTO||760},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:W,height:900}});
  const page=await ctx.newPage();
  page.on("dialog",d=>d.dismiss().catch(()=>{}));
  page.on("pageerror",e=>console.log("ERRORE PAGINA:",e.message));
  /* sessione 9: una collaboratrice, uno strumento con la taratura scaduta, una pratica sua */
  {const D=B.DATI, g=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
   const op=D.gest_operatori[0]; Object.assign(op,{nome:"Giulia Bianchi",mansione:"Disegnatore CAD",costo_orario:20,visita_medica_scadenza:null,formazione_scadenza:null});
   D.gest_mezzi.push(Object.assign({},D.gest_mezzi[1],{id:"00000000-0000-4000-8000-000000000699",nome:"Stazione totale Leica TS07",categoria:"attrezzatura",tipo:"stazione totale",targa:"TS-123",revisione_scad:null,operatore_id:op.id,noleggiabile:false}));
   D.gest_scadenze.push(Object.assign({},D.gest_scadenze[0],{id:"00000000-0000-4000-8000-000000000698",titolo:"Taratura strumento",tipo_pratica:"Taratura strumento",data_scadenza:g(-18),mezzo_id:"00000000-0000-4000-8000-000000000699"}));
   /* sessione 10: le pratiche con «A che punto sta» */
   const L=D.gest_lavori;
   Object.assign(L[0],{descrizione:"CILA bagno Rossi",pratica_tipo:"CILA",pratica_stato:"integrazioni",pratica_comune:"Rieti",pratica_protocollo:"4567/2026",pratica_data_dep:g(-40)});
   Object.assign(L[1],{descrizione:"SCIA ampliamento Verdi",pratica_tipo:"SCIA",pratica_stato:"depositata",pratica_comune:"Rieti",pratica_data_dep:g(-10)});
   Object.assign(L[2],{descrizione:"Accatastamento box",pratica_tipo:"Accatastamento",pratica_stato:"da_preparare"});
   if(process.env.STUDIO_DATE){const m=new Date().toISOString().slice(0,8);
     Object.assign(L[0],{data_prevista:m+"05",stato:"in_corso",dove:"Via Garibaldi 10, Rieti"});Object.assign(L[1],{data_prevista:m+"29",stato:"in_corso",dove:"Piazza Vittorio Emanuele II, Rieti"});Object.assign(L[2],{data_prevista:m+"30",stato:"in_corso",dove:"Via Roma 1, Rieti"});
     if(L[3])Object.assign(L[3],{descrizione:"APE villetta Neri",pratica_tipo:"APE",pratica_stato:"archiviata",stato:"fatto",data_prevista:m+"18",dove:"Via Cintia 5, Rieti"});}
  }
  await B.collega(page,{rete:true,scritture:[]});
  const cors={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"};
  await page.route(/\/rest\/v1\/(imprese|gest_azienda)\b/,async r=>{
    const t=/imprese/.test(r.request().url())?"imprese":"gest_azienda";
    const uno=/vnd\.pgrst\.object/.test(r.request().headers()["accept"]||"");
    const riga=t==="imprese"
      ?{id:1,user_id:"x",email:"banco@trovaimpresa.test",nome_attivita:"Studio di prova",nome:"Mario Prova",mestiere:"Geometra",mestieri:["Geometra"],telefono:"3331234567",descrizione:"Studio di prova del banco: serve solo a far aprire il gestionale. Non esiste davvero e non va mai online.",logo_url:"/img/trovaimpresa-logo.svg",email_confermata:true,premium_pagato:true,vetrina_attiva:true,tipo:"professionista",ruolo:"professionista",piano:"premium",premium_scadenza:"2099-12-31",chat_pro:true,chat_pro_scadenza:"2099-12-31",gest_prova_fine:"2099-12-31",gest_piano_scelto:"premium",citta:"Rieti",attivo:true,stato:"attivo"}
      :{ragione_sociale:"Studio di prova",nome:"Studio di prova",piva:"00000000009",indirizzo:"Via Roma 10",cap:"02100",citta:"Rieti",prov:"RI",iban:"IT60 X054 2811 1010 0000 0123 456",giorni_pagamento:30,regime_fiscale:"RF19",albo_nome:"Collegio dei Geometri di Rieti",albo_numero:"1234"};
    if(r.request().method()==="OPTIONS")return r.fulfill({status:204,headers:cors});
    return r.fulfill({status:200,headers:cors,contentType:"application/json",body:JSON.stringify(uno?riga:[riga])});
  });
  await page.goto(base+"/gestionale-app.html?vedi=professionista",{waitUntil:"domcontentloaded"});
  await B.PAGINE.app.entra(page);
  await B.aspetta(page,1500);
  await page.evaluate(()=>{try{window._tiTipoVero="professionista";adattaMenuProfessionista();}catch(e){}});
  const clic=sel=>page.evaluate(s=>{const b=document.querySelector(s);if(b)b.click();return !!b;},sel);
  const testo=(t,dentro)=>page.evaluate(([t,d])=>{const e=[...document.querySelectorAll((d||"body")+" button, "+(d||"body")+" a, "+(d||"body")+" .sh-scelta, "+(d||"body")+" [data-action]")].find(x=>x.offsetParent&&x.textContent.trim().startsWith(t));if(e)e.click();return !!e;},[t,dentro]);
  const vai=async t=>{await clic('nav.tabs button[data-tab="'+t+'"]');await B.aspetta(page,1500);};
  const scorri=t=>page.evaluate(t=>{const e=[...document.querySelectorAll("#sheet *, #appview *")].find(x=>x.children.length<3&&x.textContent.trim().startsWith(t)&&x.offsetParent);if(e)e.scrollIntoView({block:"start"});return !!e;},t);
  if(scena==="fatture"){await vai("fatture");}
  if(scena==="fattura-fondo"){await vai("fatture");await clic('[data-action="new-fattura"]');await B.aspetta(page,800);await testo("Vuota","#sheet");await B.aspetta(page,1500);await scorri("In fondo alla fattura");}
  if(scena==="computo"||scena==="ribasso"||scena==="parcella"){
    await vai("computi");await B.aspetta(page,500);
    await page.evaluate(()=>{const b=[...document.querySelectorAll("#computi [data-action]")].find(x=>/apri|comp-apri|comp-edit/.test(x.dataset.action)||x.textContent.trim()==="Apri");if(b)b.click();});
    await B.aspetta(page,2000);
    if(scena==="ribasso"){await page.evaluate(()=>{const b=document.querySelector('#co-nav .conav-v[data-p="3"]');if(b)b.click();});await B.aspetta(page,700);}
    if(scena==="parcella"){await clic('.co-az [data-action="comp-prev"]');await B.aspetta(page,2500);await page.evaluate(()=>{const c=document.getElementById("dp-cat");if(c){c.value=c.options[1].value;c.dispatchEvent(new Event("change",{bubbles:true}));const b=document.getElementById("dp-box");if(b)b.scrollIntoView({block:"start"});}});await B.aspetta(page,800);}
  }
  if(scena==="sal"){await vai("sal");await B.aspetta(page,800);}
  if(scena==="collaboratori"){await vai("squadra");await B.aspetta(page,1200);}
  if(scena==="persona"){await vai("squadra");await B.aspetta(page,800);await clic('#squadra [data-action="sq-edit"]');await B.aspetta(page,1500);await page.evaluate(()=>{const d=[...document.querySelectorAll("#sheet details")].find(x=>/Documenti/.test(x.textContent));if(d){d.open=true;d.scrollIntoView({block:"start"});}});await B.aspetta(page,500);}
  if(scena==="persona-perm"){await vai("squadra");await B.aspetta(page,800);await clic('#squadra [data-action="sq-edit"]');await B.aspetta(page,1500);await scorri("Rapportini")||await scorri("Resoconti");}
  if(scena==="strumenti"){await vai("attrezzature");await B.aspetta(page,1500);}
  if(scena==="giornate"){await vai("giornate");await B.aspetta(page,1200);
    await page.evaluate(()=>{const n="Giulia Bianchi";giorProp=[{data:todayStr(),chi:new Set([n]),dove:"Rilievo Rossi",cosa:"Rilievo con la stazione totale. Parcheggio 12 €.",mezza:new Set(),oreX:{[n]:6},spese:[{desc:"Parcheggio",imp:12,on:true}]}];giorDisegna({t:"Controlla qui sotto e premi «Salva».",k:"ok"});});
    await B.aspetta(page,600);await scorri("Controlla e salva");}
  if(scena==="pratiche"){await vai("lavori");await B.aspetta(page,1500);}
  if(scena==="pratica"){await vai("lavori");await B.aspetta(page,1200);await clic('#lavori [data-action="edit-job"]');await B.aspetta(page,2000);await scorri("Dati della pratica");}
  if(scena==="pratica-stato"){await vai("lavori");await B.aspetta(page,1200);await clic('#lavori [data-action="edit-job"]');await B.aspetta(page,2000);await scorri(process.env.SCORRI||"Data prevista");}
  if(scena==="crediti"){await vai("crediti");await B.aspetta(page,1500);}
  /* sessione 10, parte 2: Calendario, Mappa, Tasse allo studio */
  if(scena==="calendario"){await vai("calendario");await B.aspetta(page,1500);if(process.env.GIORNO){await page.evaluate(d=>{const c=document.querySelector('#calendario [data-action="open-day"][data-d="'+d+'"]');if(c)c.click();},process.env.GIORNO);await B.aspetta(page,1200);}else{await page.evaluate(()=>{const l=document.querySelector("#calendario .cal-legend");if(l)l.scrollIntoView({block:"end"});});await B.aspetta(page,500);}}
  if(scena==="mappa"){await vai("mappa");await B.aspetta(page,6000);await page.evaluate(()=>{const l=document.querySelector("#mappa .mp-legenda");if(l)l.scrollIntoView({block:"center"});});await B.aspetta(page,500);}
  if(scena==="tasse-profilo"){await vai("fisco");await B.aspetta(page,2500);await page.evaluate(()=>{try{ftProfilo=null;}catch(e){}});await testo("Le tue tasse");await B.aspetta(page,1500);await testo("Cambia")||await testo("Imposta");await B.aspetta(page,1500);}
  if(scena==="report"){await vai("report");await B.aspetta(page,2500);await scorri("Guadagno o perdita");await B.aspetta(page,500);}
  if(scena==="scadenza-nuova"){await vai("scadenzario");await B.aspetta(page,1500);await clic('[data-action="new-scad"]');await B.aspetta(page,1500);await scorri("A che cosa si riferisce");await page.evaluate(()=>{const s=document.getElementById("s-lav");if(s){s.size=6;}});await B.aspetta(page,400);}
  if(scena==="tasse-prezzo"){await vai("fisco");await B.aspetta(page,2500);await testo("Quanto ti resta");await B.aspetta(page,2000);await scorri("Il prezzo giusto");await B.aspetta(page,500);}
  await B.aspetta(page,700);
  await page.screenshot({path:file});
  await browser.close();srv.close();
})().catch(e=>{console.error(e);process.exit(2);});
