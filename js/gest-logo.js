/* =====================================================================
   27 set 2026 — IL LOGO DELL'IMPRESA DENTRO I GESTIONALI
   Richiesta arrivata da «Chiedi una funzione» il 15 agosto: «mi servirebbe
   inserire una foto del logo su ogni gestionale».

   Il logo e' LO STESSO della scheda pubblica e del pannello: colonna
   imprese.logo_url, deposito «loghi-imprese», file <uid>/logo.webp.
   Uno solo per tutta l'azienda: lo cambi qui e cambia anche la vetrina.

   Dove si vede:
   - [data-logo="grande"]  la schermata iniziale: se il logo manca c'e' il
                           tondo tratteggiato «+ Il tuo logo» che lo fa caricare
   - [data-logo="piccolo"] le barre in alto: si vede solo se il logo c'e'

   ⚠️ Il file vive da solo (IIFE): la pagina lo accende con
   gestLogoAvvia(sb, ()=>sbUid). Cosi' va bene sia per gestionale-app
   (sb globale) sia per il noleggio (sb chiuso dentro la sua funzione).
   ===================================================================== */
(function () {
  var SB = null, UID = null, URL_LOGO = null, IN_CORSO = false;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }

  function disegna() {
    document.querySelectorAll('[data-logo]').forEach(function (el) {
      var grande = el.getAttribute('data-logo') === 'grande';
      if (URL_LOGO) {
        el.hidden = false;
        el.classList.add('gl-si'); el.classList.remove('gl-no');
        el.innerHTML = '<img src="' + esc(URL_LOGO) + '" alt="Il tuo logo">'
          + (grande ? '<button type="button" class="gl-cambia" data-gl="carica">Cambia logo</button>' : '');
      } else if (grande) {
        el.hidden = false;
        el.classList.add('gl-no'); el.classList.remove('gl-si');
        el.innerHTML = '<button type="button" class="gl-vuoto" data-gl="carica" title="Metti il logo della tua impresa">'
          + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
          + '<span>Il tuo logo</span></button>';
      } else {
        el.hidden = true; el.innerHTML = '';
      }
    });
  }

  function leggi() {
    if (!SB || !UID) return;
    SB.from('imprese').select('logo_url').eq('user_id', UID).maybeSingle().then(function (r) {
      if (r.error) return;                   /* se non legge non si tocca niente */
      URL_LOGO = (r.data && r.data.logo_url && r.data.logo_url !== '/img/logo.png') ? r.data.logo_url : null;
      disegna();
    });
  }

  function avviso(t) { try { if (window.toast) window.toast(t); else alert(t); } catch (e) { alert(t); } }

  async function carica(file) {
    if (!file || IN_CORSO) return;
    if (!/^image\//.test(file.type)) { avviso('Scegli una foto o un\'immagine (JPG, PNG)'); return; }
    IN_CORSO = true;
    try {
      var prep = window.preparaFileUpload
        ? await window.preparaFileUpload(file, { lato: 400, qualita: 0.82, formato: 'webp' })
        : { file: file, compressa: false };
      if (prep.errore) { avviso(prep.errore); return; }
      var path = UID + '/logo.' + (prep.compressa ? 'webp' : 'png');
      var up = await SB.storage.from('loghi-imprese').upload(path, prep.file,
        { upsert: true, contentType: prep.compressa ? 'image/webp' : file.type, cacheControl: '31536000' });
      if (up.error) { avviso('Logo non caricato: ' + (up.error.message || 'errore')); return; }
      var pub = SB.storage.from('loghi-imprese').getPublicUrl(path);
      var url = pub.data.publicUrl + '?v=' + Date.now();
      /* .select: una scrittura fermata dai permessi torna «riuscita» e vuota */
      var w = await SB.from('imprese').update({ logo_url: url }).eq('user_id', UID).select('user_id');
      if (w.error || !w.data || !w.data.length) { avviso('Logo caricato ma non salvato: riprova'); return; }
      URL_LOGO = url;
      disegna();
      avviso('Logo salvato ✔');
    } finally { IN_CORSO = false; }
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-gl="carica"]'); if (!b) return;
    var i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    i.addEventListener('change', function () { carica(i.files && i.files[0]); });
    i.click();
  });

  window.gestLogoAvvia = function (sb, getUid) {
    SB = sb; if (!SB) return;
    var giri = 0;
    (function aspetta() {
      var u = getUid && getUid();
      if (u) { UID = u; leggi(); return; }
      if (++giri < 60) setTimeout(aspetta, 1000);
    })();
  };
})();
