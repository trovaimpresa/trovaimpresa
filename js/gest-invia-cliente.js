/* =====================================================================
   INVIA AL CLIENTE — 1 novembre 2026 (approvato da Alex con le foto)

   Dal preventivo, «📤 Invia al cliente» (primo pulsante in alto e nel menu
   «...»). Si apre la finestra grande a due colonne: cosa mandare
   (preventivo e/o capitolati), il link con «Copia», WhatsApp · Email · PDF,
   e il QR da inquadrare o stampare. Il cliente apre
   trovaimpresa.com/preventivo-cliente?t=... dal telefono, senza account,
   e puo' accettare firmando col dito.

   Tabella: gest_preventivi_link (sql/gest-preventivi-link.sql).
   Pagina del cliente: preventivo-cliente.html.
   Porta del cliente: netlify/functions/preventivo-cliente.js.
   Stampo: le «Scelte del cliente» in js/gest-ai-cantiere.js.

   ⛔ LA FOTOGRAFIA. Il cliente non legge il preventivo vivo: legge `dati`,
      che si scatta QUI ogni volta che si apre la finestra, con le STESSE
      funzioni dei conti del PDF (impRiga, _centPerc, _cent2,
      calcolaParcella). Il server non rifa' nessun conto.
      ⚠️ L'ordine dei totali e' quello di prevPdf() in js/gest-documenti-pdf.js:
      se un giorno cambia il riquadro del totale nel PDF, va cambiato
      anche invConti() qui sotto.
   ⛔ DOPO LA FIRMA LA FOTOGRAFIA E' FERMA (lo garantisce anche il database).
      Se il preventivo cambia dopo, la finestra lo dice e propone di mandare
      la versione nuova: la firma vecchia si toglie.
   ⛔ Nel messaggio al cliente NIENTE riga «con TrovaImpresa» (decisione di
      Alex del 26 set): solo il nome dell'impresa.
   ===================================================================== */
(function(){
  "use strict";

  var _inv=null;   /* {p, righe, az, cli, link, caps, sel:{prev:bool, caps:{id:true}}, dati, cambiato} */

  function T(v){ return String(v==null?"":v).trim(); }

  /* ---------- i capitolati del preventivo, puliti ---------- */
  function capLista(cap){
    var out=[];
    var lista=(cap&&Array.isArray(cap.capitolati))?cap.capitolati:((cap&&(cap.voci||cap.dove))?[cap]:[]);
    lista.forEach(function(c,i){
      c=c||{};
      var voci=(Array.isArray(c.voci)?c.voci:[]).map(function(v){
        v=v||{};
        return {titolo:T(v.titolo),cosa:T(v.cosa),materiali:T(v.materiali),compreso:T(v.compreso),escluso:T(v.escluso)};
      }).filter(function(v){ return v.titolo||v.cosa||v.materiali||v.compreso||v.escluso; });
      if(!voci.length) return;   /* un capitolato senza voci non si manda */
      out.push({
        id:String(c.id||("c"+i)), nome:T(c.nome)||"Capitolato", voci:voci,
        dove:T(c.dove), inizio:T(c.inizio), durata:T(c.durata), pagamenti:T(c.pagamenti),
        garanzie:T(c.garanzie), note:T(c.note),
        allegati:(Array.isArray(c.allegati)?c.allegati:[]).filter(function(a){ return a&&a.path; })
          .map(function(a){ return {path:String(a.path),nome:T(a.nome)}; }).slice(0,6)
      });
    });
    return out;
  }

  /* ---------- i conti: stesse funzioni del PDF ---------- */
  function invConti(p,righe){
    var tot=0, out={righe:[],totali:[],totale:null,totale_nota:"",nota_iva:""};
    righe.forEach(function(r){
      if(_rigaSezione(r)){ out.righe.push({sez:true,d:T(r.descrizione)}); return; }
      var rt=impRiga(r.qta,r.prezzo); tot+=rt;
      out.righe.push({d:T(r.descrizione),q:_numTesto(+r.qta||1)+" × "+eur2(+r.prezzo||0),t:eur2(rt)});
    });
    if(ruoloUtente==="professionista"){
      var cp=calcolaParcella(tot,p.cassa_perc,p.iva_perc,!!p.ritenuta,p.ritenuta_perc||20,p.spese_forfait);
      out.totali.push(["Compenso",eur2(cp.compenso)]);
      if(cp.spese) out.totali.push(["Spese (bolli, diritti)",eur2(cp.spese)]);
      if(cp.cassa) out.totali.push(["Cassa previdenziale "+_pct(p.cassa_perc)+"%",eur2(cp.cassa)]);
      out.totali.push([cp.spese?"Totale imponibile":"Imponibile IVA",eur2(cp.imponibile)]);
      if(cp.iva) out.totali.push(["IVA "+_pct(p.iva_perc)+"%",eur2(cp.iva)]);
      if(cp.ritenuta) out.totali.push(["Ritenuta d'acconto "+_pct(p.ritenuta_perc!=null?p.ritenuta_perc:20)+"%","- "+eur2(cp.ritenuta)]);
      out.totale=["Netto a pagare",eur2(cp.totale)];
      out.totale_nota="Netto a pagare";
    }else if(p.iva_perc!=null&&p.iva_perc!==""){
      var _pc=prevContiImpresa(tot,p.iva_perc), perc=_pc.perc, iva=_pc.iva, fin=_pc.totale;
      out.totali.push(["Imponibile",eur2(tot)]);
      if(perc) out.totali.push(["IVA "+_pct(perc)+"%",eur2(iva)]);
      out.totale=["Totale",eur2(fin)];
      out.totale_nota=perc?"IVA "+_pct(perc)+"% compresa":"Totale";
      out.nota_iva="I prezzi delle singole voci sono al netto dell'IVA.";
    }else{
      out.totale=["Totale",eur2(tot)];
      out.totale_nota="IVA esclusa";
    }
    return out;
  }

  /* ---------- la fotografia che vede il cliente ---------- */
  function fotografia(){
    var p=_inv.p, az=_inv.az||{}, conti=invConti(p,_inv.righe);
    var caps=_inv.caps.filter(function(c){ return _inv.sel.caps[c.id]; });
    return {
      v:1,
      tipo:ruoloUtente==="professionista"?"parcella":"preventivo",
      numero:p.numero||null, data:p.data||null, titolo:T(p.titolo), note:T(p.note),
      cliente:T(_inv.cli&&_inv.cli.nome), dove:caps.length?caps[0].dove:"",
      impresa:{nome:T(az.nome),tel:T(az.tel),email:T(az.email)},
      includi_prev:!!_inv.sel.prev,
      righe:_inv.sel.prev?conti.righe:[], totali:_inv.sel.prev?conti.totali:[],
      totale:conti.totale, totale_nota:conti.totale_nota, nota_iva:_inv.sel.prev?conti.nota_iva:"",
      capitolati:caps.map(function(c){ var x=Object.assign({},c); x.cap_id=c.id; delete x.id; return x; })
    };
  }
  /* ⚠️ Il database (jsonb) riordina le chiavi: un JSON.stringify secco direbbe
     «diverso» anche quando non e' cambiato niente (trovato dal vivo il 1 nov:
     «Hai cambiato il preventivo dopo la firma» senza aver toccato nulla).
     Quindi si confronta con le chiavi in ordine. */
  function inOrdine(x){
    if(Array.isArray(x)) return x.map(inOrdine);
    if(x&&typeof x==="object"){ var o={}; Object.keys(x).sort().forEach(function(k){ o[k]=inOrdine(x[k]); }); return o; }
    return x;
  }
  function uguali(a,b){ return JSON.stringify(inOrdine(a||{}))===JSON.stringify(inOrdine(b||{})); }

  function nuovoToken(){
    var a=new Uint8Array(24); crypto.getRandomValues(a);
    return Array.from(a,function(x){ return "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x%57]; }).join("");
  }
  function invUrl(){ return location.origin+"/preventivo-cliente?t="+encodeURIComponent(_inv.link.token); }

  /* scrive la fotografia (se il cliente non ha ancora firmato) */
  async function salvaFoto(){
    var dati=fotografia();
    if(!_inv.link){
      var ins=await sb.from("gest_preventivi_link").insert({preventivo_id:_inv.p.id,user_id:sbUid,token:nuovoToken(),dati:dati}).select("*");
      if(ins.error||!ins.data||!ins.data.length){
        var em=(ins.error&&ins.error.message)||"";
        toast(/gest_preventivi_link|schema cache|does not exist/i.test(em)
          ?"«Invia al cliente» ha bisogno di un aggiornamento del database: esegui sql/gest-preventivi-link.sql su Supabase."
          :"Non riesco a creare il link: "+(em||"riprova"));
        return false;
      }
      _inv.link=ins.data[0]; _inv.cambiato=false; return true;
    }
    if(_inv.link.firmato_il){ _inv.cambiato=!uguali(dati,_inv.link.dati); return true; }
    _inv.cambiato=false;
    if(uguali(dati,_inv.link.dati)) return true;
    var up=await sb.from("gest_preventivi_link").update({dati:dati}).eq("preventivo_id",_inv.p.id).eq("user_id",sbUid).select("*");
    if(up.error||!up.data||!up.data.length){ toast("Non aggiornato: "+((up.error&&up.error.message)||"riprova")); return false; }
    _inv.link=up.data[0]; return true;
  }

  /* ---------- la finestra ---------- */
  async function invApri(id,opz){
    opz=opz||{};
    if(!sb||!sbUid){ toast("Devi essere loggato"); return; }
    var r1=await sb.from("gest_preventivi").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    var p=r1.data; if(!p){ toast("Preventivo non trovato"); return; }
    var res=await Promise.all([
      sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine"),
      sb.from("gest_azienda").select("nome,tel,email,piva").eq("user_id",sbUid).maybeSingle(),
      p.cliente_id?cliDelDocumento(p.cliente_id,"nome,email,telefono"):Promise.resolve({}),
      sb.from("gest_preventivi_link").select("*").eq("preventivo_id",id).eq("user_id",sbUid).maybeSingle()
    ]);
    if(res[3].error&&/gest_preventivi_link|schema cache|does not exist/i.test(res[3].error.message||"")){
      toast("«Invia al cliente» ha bisogno di un aggiornamento del database: esegui sql/gest-preventivi-link.sql su Supabase."); return;
    }
    var link=res[3].data||null, caps=capLista(p.capitolato);
    var sel={prev:true,caps:{}};
    if(link&&link.dati&&link.dati.v){
      sel.prev=link.dati.includi_prev!==false;
      (link.dati.capitolati||[]).forEach(function(c){ if(c.cap_id) sel.caps[c.cap_id]=true; });
    }else{
      caps.forEach(function(c){ sel.caps[c.id]=true; });
    }
    /* aperta dal capitolato: i capitolati vanno dentro (se il cliente non ha gia' firmato) */
    if(opz.capitolati&&!(link&&link.firmato_il)) caps.forEach(function(c){ sel.caps[c.id]=true; });
    _inv={p:p,righe:(res[0].data||[]),az:res[1].data||{},cli:res[2]||{},link:link,caps:caps,sel:sel,cambiato:false};
    if(!(await salvaFoto())) return;
    invDisegna();
  }

  function statoHtml(){
    var l=_inv.link;
    if(l.firmato_il){
      return '<div class="aic-banda aic-banda--ok"><b>Firmato da '+esc(l.firma_nome||"")+'</b> il '+esc(oraIt(l.firmato_il))+'.'
        +(l.firma_img?'<img src="'+esc(l.firma_img)+'" alt="Firma del cliente" style="display:block;max-width:220px;width:100%;margin-top:10px;background:#fff;border:1px solid var(--bordo);border-radius:8px">':'')
        +'</div>'
        +(_inv.cambiato?'<div class="aic-banda aic-banda--attesa" style="margin-top:10px"><b>Hai cambiato il preventivo dopo la firma.</b> Il cliente ha firmato la versione di prima.'
          +'<button type="button" class="aic-btn" data-action="inv-nuova">Manda la versione nuova</button>'
          +'<div class="campo-aiuto">La firma si toglie e il cliente dovrà firmare di nuovo.</div></div>':'');
    }
    if(l.aperto_il){
      return '<div class="aic-banda aic-banda--attesa"><b>Il cliente l\'ha aperto</b> '
        +esc(oraIt(l.ultimo_aperto||l.aperto_il))+(l.aperture>1?' ('+l.aperture+' volte)':'')+'. Non ha ancora firmato.</div>';
    }
    return '<div class="aic-banda">Non ancora aperto dal cliente.</div>';
  }
  function oraIt(iso){
    var d=new Date(iso); if(isNaN(d.getTime())) return "";
    return fdate(d.toISOString().slice(0,10))+" alle "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  }

  function invDisegna(){
    var p=_inv.p, firmato=!!_inv.link.firmato_il, url=invUrl();
    var nomeDoc=(ruoloUtente==="professionista"?"Parcella":"Preventivo")+" n. "+(p.numero||"");
    var conti=invConti(p,_inv.righe);
    var spunte='<label class="aic-fila" style="font-size:16px;margin:4px 0"><input type="checkbox" data-inv-sel="prev"'+(_inv.sel.prev?' checked':'')+(firmato?' disabled':'')+' style="width:20px;height:20px"> '
      +esc(nomeDoc)+' · '+esc(conti.totale?conti.totale[1]:"")+'</label>';
    _inv.caps.forEach(function(c){
      spunte+='<label class="aic-fila" style="font-size:16px;margin:4px 0"><input type="checkbox" data-inv-sel="'+esc(c.id)+'"'+(_inv.sel.caps[c.id]?' checked':'')+(firmato?' disabled':'')+' style="width:20px;height:20px"> Capitolato «'+esc(c.nome)+'»</label>';
    });
    if(!_inv.caps.length) spunte+='<div class="campo-aiuto">Nessun capitolato: lo fai da «📋 Capitolato».</div>';
    var avvisoAz=!T(_inv.az.nome)?'<div class="aic-banda aic-banda--attesa" style="margin-top:10px">Manca il nome della tua attività nei Dati azienda: il cliente vedrà «La tua impresa».</div>':'';

    openSheetGrande("Invia al cliente",
      '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Cosa mandi</div>'+spunte+avvisoAz+'</div>'
      +'<div class="sh-b"><div class="sh-tit">Il link</div>'
      +  '<div class="aic-fila"><input readonly value="'+esc(url)+'" style="flex:1 1 220px;min-height:48px;border:1.5px solid var(--bordo);border-radius:var(--r);padding:0 12px;font-family:inherit;font-size:16px;color:var(--testo);background:var(--sfondo)" onclick="this.select()">'
      +  '<button type="button" class="aic-btn aic-btn--pieno" data-action="inv-copia">'+_AIC_SVG.copia+'<span>Copia link</span></button></div>'
      +  '<div class="aic-fila" style="margin-top:12px">'
      +    '<button type="button" class="aic-btn" data-action="inv-wa">'+_AIC_SVG.wa+'<span>WhatsApp</span></button>'
      +    '<button type="button" class="aic-btn" data-action="inv-email"><svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg><span>Email</span></button>'
      +    '<button type="button" class="aic-btn" data-action="inv-pdf">'+_AIC_SVG.file+'<span>PDF</span></button>'
      +  '</div>'
      +'</div>'
      +'<div class="sh-b"><div class="sh-tit">Il cliente</div>'+statoHtml()+'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">QR da inquadrare</div>'
      +  '<div id="inv-qr" style="display:inline-block;background:#fff;padding:8px;border:1px solid var(--bordo);border-radius:var(--r)"></div>'
      +  '<div class="campo-aiuto">Il cliente lo inquadra col telefono e apre preventivo e capitolato.</div>'
      +  '<button type="button" class="aic-btn" data-action="inv-qr-stampa" style="margin-top:10px">Stampa il QR</button>'
      +'</div>'
      +'</div></div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>');
    disegnaQr(url);
  }

  function caricaQr(){
    if(window.QRCode) return Promise.resolve(true);
    return new Promise(function(ok){
      var sc=document.createElement("script");
      sc.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      sc.onload=function(){ ok(!!window.QRCode); }; sc.onerror=function(){ ok(false); };
      document.head.appendChild(sc);
    });
  }
  async function disegnaQr(url){
    var box=document.getElementById("inv-qr"); if(!box) return;
    if(!(await caricaQr())){ box.textContent="Il QR non si carica: controlla la connessione."; return; }
    box.innerHTML="";
    try{ new window.QRCode(box,{text:url,width:200,height:200,correctLevel:window.QRCode.CorrectLevel.M}); }catch(e){}
  }

  /* quando lo mandi, se era una bozza diventa «Inviato» */
  async function segnaInviato(){
    if(_inv.p.stato!=="bozza") return;
    var r=await sb.from("gest_preventivi").update({stato:"inviato"}).eq("id",_inv.p.id).eq("user_id",sbUid).select("id");
    if(!r.error&&r.data&&r.data.length){ _inv.p.stato="inviato"; if(typeof rinfresca==="function") rinfresca("preventivi","riepilogo"); }
  }
  function testoMessaggio(){
    var p=_inv.p, d=_inv.link.dati||{}, nome=T(_inv.az.nome);
    var cosa=d.includi_prev===false?"il capitolato":((ruoloUtente==="professionista"?"la parcella":"il preventivo")+" n. "+(p.numero||""));
    var conCap=d.includi_prev!==false&&(d.capitolati||[]).length?" con il capitolato":"";
    return "Buongiorno, le mando "+cosa+(p.titolo?" «"+T(p.titolo)+"»":"")+conCap+". Lo trova qui:\n"+invUrl()
      +"\n\nSe va bene, può accettarlo e firmarlo direttamente dal telefono."+(nome?"\n\n"+nome:"");
  }

  async function cambiaScelta(k,acceso){
    if(k==="prev") _inv.sel.prev=acceso; else _inv.sel.caps[k]=acceso;
    if(!_inv.sel.prev&&!Object.keys(_inv.sel.caps).some(function(x){ return _inv.sel.caps[x]; })){
      toast("Scegli almeno una cosa da mandare");
      if(k==="prev") _inv.sel.prev=true; else _inv.sel.caps[k]=true;
      invDisegna(); return;
    }
    if(await salvaFoto()) invDisegna();
  }

  async function versioneNuova(){
    if(!gconfirm("Mandare la versione nuova? La firma del cliente si toglie e dovrà firmare di nuovo.")) return;
    var up=await sb.from("gest_preventivi_link").update({firmato_il:null,dati:fotografia()})
      .eq("preventivo_id",_inv.p.id).eq("user_id",sbUid).select("*");
    if(up.error||!up.data||!up.data.length){ toast("Non aggiornato: "+((up.error&&up.error.message)||"riprova")); return; }
    _inv.link=up.data[0]; _inv.cambiato=false;
    toast("Versione nuova pronta ✔ Rimanda il link al cliente");
    invDisegna();
  }

  function stampaQr(){
    var img=document.querySelector("#inv-qr img")||document.querySelector("#inv-qr canvas");
    var src=img?(img.tagName==="CANVAS"?img.toDataURL("image/png"):img.src):"";
    if(!src){ toast("Il QR non è ancora pronto"); return; }
    var p=_inv.p, nome=T(_inv.az.nome);
    var w=window.open("","_blank");
    if(!w){ toast("Il browser ha bloccato la finestra: consenti i popup e riprova"); return; }
    var e=function(s){ return String(s||"").replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); };
    w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>QR</title>'
      +'<style>body{font-family:Arial,sans-serif;text-align:center;padding:40px;color:#0f172a}h1{font-size:28px;margin:0 0 8px}p{font-size:18px;margin:6px 0}img{width:320px;height:320px;margin:24px auto;display:block}</style></head><body>'
      +(nome?'<h1>'+e(nome)+'</h1>':'')
      +'<p>'+e((ruoloUtente==="professionista"?"Parcella":"Preventivo")+" n. "+(p.numero||"")+(p.titolo?" — "+p.titolo:""))+'</p>'
      +'<img src="'+src+'" alt="QR"><p><b>Inquadra col telefono</b> per vedere e firmare.</p>'
      +'<script>window.onload=function(){window.print();}<\/script></body></html>');
    w.document.close();
  }

  /* ---------- i pulsanti ---------- */
  document.addEventListener("click",function(e){
    var t=e.target.closest&&e.target.closest("[data-action]"); if(!t) return;
    var a=t.dataset.action;
    if(a==="prev-invia"){ invApri(t.dataset.id); return; }
    if(a.indexOf("inv-")!==0||!_inv) return;
    if(a==="inv-copia"){ _aicCopia(invUrl()); segnaInviato(); return; }
    if(a==="inv-wa"){
      var tel=typeof waCleanTel==="function"?waCleanTel(_inv.cli&&_inv.cli.telefono):"";
      var txt=testoMessaggio();
      window.open(tel?("https://wa.me/"+tel+"?text="+encodeURIComponent(txt)):("https://wa.me/?text="+encodeURIComponent(txt)),"_blank","noopener");
      segnaInviato(); return;
    }
    if(a==="inv-email"){
      var p=_inv.p, mail=T(_inv.cli&&_inv.cli.email);
      var ogg=((ruoloUtente==="professionista")?"Parcella":"Preventivo")+" n. "+(p.numero||"")+(p.titolo?" — "+T(p.titolo):"");
      location.href="mailto:"+mail.replace(/[^A-Za-z0-9.@_+-]/g,"")+"?subject="+encodeURIComponent(ogg)+"&body="+encodeURIComponent(testoMessaggio());
      segnaInviato(); return;
    }
    if(a==="inv-pdf"){ if(typeof prevControllaEManda==="function") prevControllaEManda(_inv.p.id); return; }
    if(a==="inv-qr-stampa"){ stampaQr(); segnaInviato(); return; }
    if(a==="inv-nuova"){ versioneNuova(); return; }
  });
  document.addEventListener("change",function(e){
    var c=e.target.closest&&e.target.closest("[data-inv-sel]"); if(!c||!_inv) return;
    cambiaScelta(c.dataset.invSel,c.checked);
  });

  window.gestInviaCliente=invApri;
})();
