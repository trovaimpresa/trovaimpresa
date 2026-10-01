// [SPOSTATO] op-core.js: le righe 1-2058 del vecchio file ora stanno in: op-base.js (righe 1-268), op-agenda-giorno.js (righe 269-627), op-spese-foto.js (righe 628-853), op-rapido-voce.js (righe 854-1422), op-rapportini.js (righe 1423-1764), op-salvataggio-lavoro.js (righe 1765-1830), op-timbratura.js (righe 1831-2058). Qui resta il resto.
/* ===== RESTYLING PRO: emoji dell'interfaccia → icone SVG ===== */
const _ICONS={
  "📍":'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  "👤":'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "📞":'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z"/>',
  "📄":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  "📅":'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  "📝":'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
  "💶":'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  "📷":'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  "📎":'<path d="m21.4 11.1-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 1 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8"/>',
  "🔒":'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
};
const _EMO_KEYS=Object.keys(_ICONS).join("|");
const _EMO_RE=new RegExp("("+_EMO_KEYS+")️?","g");
const _EMO_TEST=new RegExp("("+_EMO_KEYS+")");
const _svgIcon=e=>'<svg class="emic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+_ICONS[e]+'</svg>';
let _icoObs=null;
function _iconizza(){
  if(_icoObs)_icoObs.disconnect();
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(t){
    if(!t.nodeValue||!_EMO_TEST.test(t.nodeValue))return NodeFilter.FILTER_REJECT;
    return t.parentElement&&t.parentElement.closest("textarea,script,style")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
  const nodi=[];let n;while(n=w.nextNode())nodi.push(n);
  nodi.forEach(t=>{
    const span=document.createElement("span");
    span.innerHTML=t.nodeValue.replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])).replace(_EMO_RE,(m,e)=>_svgIcon(e));
    t.parentNode.replaceChild(span,t);
  });
  _icoObs.observe(document.body,{childList:true,subtree:true,characterData:true});
}
_icoObs=new MutationObserver(()=>_iconizza());
_iconizza();

/* ===== avvio ===== */
if(!sb){
  /* niente libreria = niente app: si dice, e non si prova nemmeno a
     partire (se no il primo sb.auth spacca tutto un'altra volta) */
  gate("Non riesco a caricare l'app: la linea non basta. Spostati dove prende meglio e riapri la pagina.");
}else{
  sb.auth.getSession().then(({data})=>boot(data.session));
  sb.auth.onAuthStateChange((_e,s)=>setTimeout(()=>boot(s),0));
}
