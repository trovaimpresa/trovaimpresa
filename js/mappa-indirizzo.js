/* 11 ottobre 2026 — LA MAPPA SOTTO L'INDIRIZZO
   Quando c'e' un indirizzo si vede subito la mappa, senza uscire dalla pagina.
   · gestionale: nel modulo del lavoro, sotto «Dove» (#j-dove): si aggiorna mentre scrivi
   · pagina dell'operaio: dentro il lavoro (js/op-mappa.js)
   Nessuna chiave e nessun costo: e' la mappa «da incorporare» di Google Maps.
   ⚠️ Il file parte PRIMA della pagina: non usa niente della pagina in cima. */
function mappaUrl(ind){return "https://maps.google.com/maps?q="+encodeURIComponent(ind)+"&z=16&output=embed";}
function mappaLink(ind){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(ind);}
function mappaHtml(ind){
  ind=String(ind||"").trim();
  if(ind.length<6)return "";
  return '<div class="mp-prev"><iframe class="mp-fr" src="'+mappaUrl(ind).replace(/"/g,"&quot;")+'" loading="lazy" title="Mappa" referrerpolicy="no-referrer-when-downgrade"></iframe>'
    +'<a class="mp-ap" href="'+mappaLink(ind).replace(/"/g,"&quot;")+'" target="_blank" rel="noopener">Apri in Google Maps</a></div>';
}
(function(){
  if(window.__mappaInd)return;window.__mappaInd=1;
  const st=document.createElement("style");
  st.textContent=".mp-prev{margin:8px 0 12px}.mp-fr{width:100%;height:220px;border:2px solid #0a2a4d;border-radius:12px;display:block;background:#e7eef8}"
    +".mp-ap{display:block;text-align:center;margin-top:8px;font-size:17px;font-weight:700;color:#0a2a4d;text-decoration:underline}";
  document.head.appendChild(st);
  /* gestionale: ogni volta che si apre un modulo con #j-dove, ci si aggancia */
  let timer=null;
  const aggancia=function(){
    const i=document.getElementById("j-dove");
    if(!i||i.dataset.mappa)return;
    i.dataset.mappa="1";
    const box=document.createElement("div");box.id="j-dove-mappa";
    const campo=i.closest(".field")||i.parentNode;
    campo.parentNode.insertBefore(box,campo.nextSibling);
    const agg=function(){box.innerHTML=mappaHtml(i.value);};
    i.addEventListener("input",function(){clearTimeout(timer);timer=setTimeout(agg,800);});
    agg();
  };
  const mo=new MutationObserver(function(){aggancia();});
  const parti=function(){mo.observe(document.body,{childList:true,subtree:true});aggancia();};
  if(document.body)parti();else document.addEventListener("DOMContentLoaded",parti);
})();
