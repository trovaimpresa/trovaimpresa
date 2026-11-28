/* foto dello studio (sessione 8): faccia professionista + forfettario.
   node docs/foto-studio.js <fatture|fattura-fondo|computo|ribasso|parcella|sal> <larghezza> <file.png>   (dalla cartella del progetto; in nuvola google-chrome di sistema)  */
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
  await B.collega(page,{rete:true,scritture:[]});
  const cors={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"};
  await page.route(/\/rest\/v1\/(imprese|gest_azienda)\b/,async r=>{
    const t=/imprese/.test(r.request().url())?"imprese":"gest_azienda";
    const uno=/vnd\.pgrst\.object/.test(r.request().headers()["accept"]||"");
    const riga=t==="imprese"
      ?{id:1,user_id:"x",email:"banco@trovaimpresa.test",nome_attivita:"Studio di prova",nome:"Mario Prova",mestiere:"Geometra",mestieri:["Geometra"],telefono:"3331234567",descrizione:"Studio di prova del banco: serve solo a far aprire il gestionale. Non esiste davvero e non va mai online.",logo_url:"/img/trovaimpresa-logo.svg",email_confermata:true,premium_pagato:true,vetrina_attiva:true,tipo:"professionista",ruolo:"professionista",piano:"premium",premium_scadenza:"2099-12-31",chat_pro:true,chat_pro_scadenza:"2099-12-31",gest_prova_fine:"2099-12-31",gest_piano_scelto:"premium",citta:"Rieti",attivo:true,stato:"attivo"}
      :{ragione_sociale:"Studio di prova",nome:"Studio di prova",piva:"00000000009",indirizzo:"Via Roma 10",cap:"02100",citta:"Rieti",prov:"RI",iban:"IT60 X054 2811 1010 0000 0123 456",giorni_pagamento:30,regime_fiscale:"RF19"};
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
  await B.aspetta(page,700);
  await page.screenshot({path:file});
  await browser.close();srv.close();
})().catch(e=>{console.error(e);process.exit(2);});
