/* ANTEPRIMA 2 */
if(typeof giorImpAperto==="undefined"){window.giorImpAperto=false;}
function lavNumeri(TUTTI,oggi,pro){
    const ritardo=lavFiltra(TUTTI,"ritardo",oggi);
    const daInc  =lavFiltra(TUTTI,"incassare",oggi);
    const valInc =daInc.reduce((s,l)=>s+(+l.importo||0),0);
    /* il piu' in ritardo di tutti: la card sopra dice quanti sono, questa
       dice qual e' il peggiore e da quanto sta li' */
    const peggio =ritardo.slice().sort((a,b)=>String(a.data_prevista||"9999").localeCompare(String(b.data_prevista||"9999")))[0];
    const gg     =peggio?_ggDa(peggio.data_prevista):null;
    /* uno / tanti scritti a mano: «pratica/pratiche» e «lavoro/lavori» non
       si fanno con una regola, si scrivono */
    const uno=pro?"pratica":"lavoro", tanti=pro?"pratiche":"lavori";
    const quanti=n=>n+" "+(n===1?uno:tanti);
    /* 6 nov 2026 — via «In ritardo» e «Il più in ritardo» (ok di Alex): lo
       dicono gia' il filtro «In ritardo» qui sopra e «Parti da qui» nel
       Riepilogo. Resta solo quello che non sta da nessun'altra parte: i soldi
       dei lavori finiti e non ancora incassati. */
    return numFila([
      false?numCard({
        domanda:"In ritardo",
        numero:String(ritardo.length),
        sotto:quanti(ritardo.length)+" oltre la data",
        tono:"err", action:"lav-vista", v:"ritardo"}):null,
      false?numCard({
        domanda:"Il più in ritardo",
        numero:_ggCorto(gg),
        sotto:(peggio.descrizione||("Senza nome")),
        tono:"err", action:"edit-job", id:peggio.id}):null,
      daInc.length?numCard({
        domanda:"Finiti e non ancora incassati",
        numero:eur(valInc),
        sotto:quanti(daInc.length)+(daInc.length===1?" già fatto":" già fatti"),
        tono:"attesa", action:"lav-vista", v:"incassare"}):null
    ]);
  }
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
function giorDisegna(msg){
  const box=document.getElementById("gior-box"); if(!box) return;
  const ta=document.getElementById("gior-voce"); if(ta) giorVoce=ta.value;
  const {per}=giorTotali(giorRighe);
  const date=[...new Set(giorRighe.map(g=>g.data))].sort().reverse();
  const tot=Object.entries(per).sort((a,b)=>b[1].g-a[1].g);
  let h=`<div class="gm"><button type="button" data-gior="prev" aria-label="Mese prima">‹</button><h3>${esc(_gMeseNome(giorMese))}</h3><button type="button" data-gior="next" aria-label="Mese dopo">›</button></div>`;
  if(tot.length) h+=`<div class="gt">${tot.map(([n,t])=>`<div><span>${esc(n)}</span><b>${t.g}</b><span>${t.g===1?"giorno":"giorni"}</span></div>`).join("")}</div>`;

  if(giorProposte.length){
    h+=`<div class="gb gpro"><h4>Da approvare (${giorProposte.length})</h4><div class="gnota">Le hanno mandate i tuoi operai. «Approva» le mette nel mese con 8 ore.</div>`;
    giorProposte.forEach(p=>{
      h+=`<div class="gpr"><div class="w">${esc(giorNomeOp(p.operatore_id))} · ${esc(_gData(p.data))}</div>
        <div class="c"><b>${esc(p.dove)}</b>${p.cosa?" — "+esc(p.cosa):""}</div>
        <div class="grow"><button type="button" class="gsi" data-gior="pro-si" data-id="${esc(p.id)}">Approva</button><button type="button" class="gno" data-gior="pro-no" data-id="${esc(p.id)}">Scarta</button></div></div>`;
    });
    h+=`</div>`;
  }

  if(giorDallaSera){
    h+=`<div class="gb gsera"><h4>Com'è andata oggi?</h4><div class="gnota">Premi e racconta: chi c'era, dove, cosa avete fatto, cosa avete speso.</div>
      <button type="button" class="gbig" data-gior="sera-parla">Parla</button></div>`;
  }

  h+=`<div class="gb"><h4>Racconta la giornata</h4>
    <textarea id="gior-voce" placeholder="«Oggi io, Wahid e Luis a Campoloniano, rifatto il tetto»">${esc(giorVoce)}</textarea>
    <button type="button" class="gbig" data-gior="compila" ${giorOccupato?"disabled":""}>${giorOccupato?"Ci penso…":"Compila la giornata"}</button>
    <div class="gmsg ${msg&&msg.k||""}" id="gior-msg">${esc(msg&&msg.t||"")}</div>
    ${giorProp?"":'<button type="button" class="glink" data-gior="mano" style="align-self:flex-start">Oppure scrivila a mano</button>'}
  </div>`;

  if(giorProp) h+=giorDisegnaProp();

  h+=`<div class="gb"><h4>Il mese</h4>`;
  if(!date.length) h+=`<div class="gvuoto">Nessuna giornata in ${esc(_gMeseNome(giorMese))}.</div>`;
  date.forEach(d=>{
    h+=`<div class="gday"><div class="gd">${esc(_gData(d))}</div>`;
    giorRighe.filter(g=>g.data===d).forEach(g=>{
      const chi=[...new Set(g.ore.map(o=>giorNomeOp(o.operatore_id)))];
      const mezze=g.ore.filter(o=>(+o.ore||0)<GIOR_ORE_GIORNO).map(o=>giorNomeOp(o.operatore_id)+" "+String(+o.ore).replace(".",",")+" ore");
      const L=_gNomeLav(giorLavoro(g.lavoro_id));
      h+=`<div class="gv"><div class="t"><div class="w">${esc(chi.join(", "))}</div>
        <div class="c">${esc(L)}${g.cosa?" — "+esc(g.cosa):""}${mezze.length?" ("+esc(mezze.join(", "))+")":""}</div></div>
        <div class="az">${g.rapportino_id?`<button type="button" class="glink" data-gior="mod" data-k="${esc(g.k)}">modifica</button>`:""}<button type="button" class="glink rosso" data-gior="del" data-k="${esc(g.k)}">cancella</button></div></div>`;
      if(giorModifica===g.k){
        h+=`<div class="gcard"><textarea id="gior-mod-t">${esc(g.cosa)}</textarea><div class="grow"><button type="button" class="gbig blu" data-gior="mod-salva" data-k="${esc(g.k)}">Salva</button><button type="button" class="btn" data-gior="mod-no" style="flex:0 0 auto">Annulla</button></div></div>`;
      }
      if(giorConferma===g.k){
        h+=`<div class="gconf">Cancello questa giornata e le sue ore? <button type="button" class="si" data-gior="del-si" data-k="${esc(g.k)}">Sì, cancella</button><button type="button" class="btn" data-gior="del-no">No</button></div>`;
      }
    });
    h+=`</div>`;
  });
  h+=`</div>`;

  /* i cantieri del mese, con il costo della manodopera */
  const can=giorCostiCantieri();
  if(can.length){
    const conCosto=can.some(c=>c.euro>0);
    h+=`<div class="gb"><h4>I cantieri del mese</h4>`;
    can.forEach(c=>{
      h+=`<div class="gcan"><span class="n">${esc(c.nome)}</span><span class="g">${c.giorni.size} ${c.giorni.size===1?"giorno":"giorni"}</span>${conCosto?`<span class="e">${esc(_gEuro(c.euro))}</span>`:""}</div>`;
      const a=giorAvanz[c.id];
      if(a&&!a.fatto){
        const pc=Math.round(a.speso/a.importo*100), w=Math.max(0,Math.min(100,pc));
        const cl=pc>=100?"rosso":pc>=80?"giallo":"";
        h+=`<div class="gav ${cl}"><div class="gbar"><i style="width:${w}%"></i></div>
          <div class="gavt">${pc>=100?"<b>In perdita:</b> ":pc>=80?"<b>Attenzione:</b> ":""}speso finora il ${pc}% di ${esc(_gEuro(a.importo))}${pc>=100?" — esce più di quello che entra":pc>=80?" — stai per andare in perdita":""}</div></div>`;
      }
    });
    if(conCosto){
      const tot=can.reduce((a,c)=>a+c.euro,0);
      h+=`<div class="gcan tot"><span class="n">Manodopera del mese</span><span class="e">${esc(_gEuro(tot))}</span></div>
        <div class="gnota">Ore segnate × costo orario di ognuno (lo scrivi in Squadra).</div>`;
    } else {
      h+=`<div class="gnota">Scrivi il costo orario dei tuoi operai in <button type="button" class="glink" data-gior="squadra">Squadra</button> e qui vedi quanto ti costa ogni cantiere.</div>`;
    }
    h+=`</div>`;
  }

  /* 6 nov 2026 — LE IMPOSTAZIONI SI CHIUDONO (ok di Alex). La domanda della
     sera e il consulente del lavoro si impostano una volta e poi non si
     toccano piu': stavano sempre aperti in fondo alla pagina. Adesso stanno
     dentro «Impostazioni», chiuso. Resta aperto se l'avevi aperto tu
     (giorImpAperto), cosi' premendo Salva la pagina non si richiude. */
  h+=`<details class="gb gimp" id="gior-imp"${giorImpAperto?" open":""}><summary class="gimp-t">Impostazioni <span>notifica della sera e consulente del lavoro</span></summary>`;

  /* la domanda della sera, su questo telefono */
  h+=giorSeraBox();

  /* il consulente del lavoro */
  if(giorCdl){
    h+=`<div class="gb"><h4>Consulente del lavoro</h4>
      <div class="gnota">Il primo di ogni mese gli mando le giornate del mese finito: giorni e ore di ognuno, cantiere per cantiere, e il file per Excel.</div>
      <input type="text" id="gior-cdl-email" inputmode="email" autocomplete="email" placeholder="Email del consulente" value="${esc(giorCdl.email)}">
      <label class="gspunta"><input type="checkbox" id="gior-cdl-invio" ${giorCdl.invio?"checked":""}> Mandagliele ogni mese</label>
      <div class="grow"><button type="button" class="gbig blu" data-gior="cdl-salva">Salva</button><button type="button" class="btn" data-gior="cdl-prova" style="flex:0 0 auto">Mandale a me per prova</button></div>
      ${giorCdl.ultimo?`<div class="gnota">Ultimo mese mandato: ${esc(_gMeseNome(giorCdl.ultimo).toLowerCase())}.</div>`:""}
      <div class="gmsg" id="gior-cdl-msg"></div>
    </div>`;
  }
  h+=`</details>`;
  box.innerHTML=h;
  const imp=document.getElementById("gior-imp");
  if(imp) imp.addEventListener("toggle",function(){ giorImpAperto=imp.open; });
}
(function(){var s=document.createElement("style");s.textContent="#giornate details.gimp{display:block}\n#giornate .gimp-t{cursor:pointer;font-size:19px;font-weight:700;list-style:revert;padding:4px 0}\n#giornate .gimp-t span{display:block;font-size:15px;font-weight:400;color:var(--testo-2,#475569);margin-top:2px}\n#giornate .gimp>.gb{border:0;border-top:1px solid var(--bordo,#e2e8f0);border-radius:0;padding:16px 0 0;margin:16px 0 0}";document.head.appendChild(s);})();
