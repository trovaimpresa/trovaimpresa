/* 12 ottobre 2026 — IL TUO NUMERO WHATSAPP, PER LA SQUADRA (lato titolare)
   Lo scrivi una volta sola, in cima alla Squadra. Chi lavora con te, quando ti scrive in chat,
   ha il tasto «Avvisa il capo su WhatsApp» che apre direttamente la tua chat.
   Tabella: gest_contatto_capo (sql/gest-contatto-capo.sql).
   ⚠️ Usa sb, sbUid, toast solo a chiamata avvenuta. */
let GT_TEL=null,GT_MOD=false;
async function gtDisegna(){
  const box=document.getElementById("gt-box");if(!box)return;
  if(GT_TEL===null){
    try{const r=await sb.from("gest_contatto_capo").select("telefono").eq("user_id",sbUid).maybeSingle();GT_TEL=(r&&r.data&&r.data.telefono)||"";}catch(_){GT_TEL="";}
  }
  const e=function(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
  if(GT_TEL&&!GT_MOD){
    box.innerHTML='<div class="gt-card"><div class="gt-t">Il tuo numero per la squadra</div><div class="gt-n">'+e(GT_TEL)+'</div>'
      +'<button type="button" class="gt-b" data-gt="cambia">Cambia</button></div>';
  }else{
    box.innerHTML='<div class="gt-card"><div class="gt-t">Il tuo numero WhatsApp</div>'
      +'<div class="gt-s">La squadra lo usa per scriverti: il tasto WhatsApp apre direttamente la tua chat.</div>'
      +'<input id="gt-tel" class="gt-i" inputmode="tel" maxlength="20" placeholder="Es. 333 1234567" value="'+e(GT_TEL)+'">'
      +'<div class="gt-r"><button type="button" class="gt-b p" data-gt="salva">Salva</button>'
      +(GT_TEL?'<button type="button" class="gt-b" data-gt="annulla">Annulla</button>':"")+'</div></div>';
  }
}
document.addEventListener("click",async function(ev){
  const b=ev.target.closest&&ev.target.closest("[data-gt]");if(!b)return;
  const a=b.getAttribute("data-gt");
  if(a==="cambia"){GT_MOD=true;gtDisegna();}
  else if(a==="annulla"){GT_MOD=false;gtDisegna();}
  else if(a==="salva"){
    const v=String(document.getElementById("gt-tel").value||"").trim();
    const num=v.replace(/[^\d+]/g,"");
    if(v&&!/^\+?\d{8,15}$/.test(num)){toast("Il numero non sembra giusto: controllalo");return;}
    b.disabled=true;
    const {error}=await sb.from("gest_contatto_capo").upsert({user_id:sbUid,telefono:v||null,aggiornato_il:new Date().toISOString()});
    b.disabled=false;
    if(error){toast("Numero non salvato: "+error.message);return;}
    GT_TEL=v;GT_MOD=false;toast("Numero salvato");gtDisegna();
  }
});
if(!document.getElementById("gt-stile")){
  const st=document.createElement("style");st.id="gt-stile";
  st.textContent="#gt-box{margin:0 0 14px}.gt-card{border:2px solid #0a2a4d;border-radius:12px;padding:14px 16px;background:#fff}"
    +".gt-t{font-size:19px;font-weight:800;color:#0a2a4d}.gt-s{font-size:16px;color:#4b5563;margin-top:4px}.gt-n{font-size:22px;font-weight:800;margin:6px 0}"
    +".gt-i{width:100%;box-sizing:border-box;font:inherit;font-size:20px;padding:12px;border:1.5px solid #9aa7b5;border-radius:10px;margin-top:10px}"
    +".gt-r{display:flex;gap:8px;margin-top:10px}.gt-b{font:inherit;font-size:17px;font-weight:700;border:1.5px solid #7b8794;background:#fff;color:#0b1220;border-radius:10px;padding:11px 18px;cursor:pointer}"
    +".gt-b.p{background:#0a2a4d;border-color:#0a2a4d;color:#fff}";
  document.head.appendChild(st);
}
(function(){let n=0;const t=setInterval(function(){n++;
  if(typeof sbUid!=="undefined"&&sbUid&&typeof sb!=="undefined"&&sb){clearInterval(t);
    const g=document.getElementById("gp-banner");
    if(g&&!document.getElementById("gt-box")){const d=document.createElement("div");d.id="gt-box";g.parentNode.insertBefore(d,g.nextSibling);}
    gtDisegna();}
  else if(n>40)clearInterval(t);},1000);})();
