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

  /* 3 ottobre 2026 — IL LOGO NON SI MOSTRA PIU' NEL GESTIONALE.
     Chiesto da Alessio: il logo dell'attivita' sta solo fuori (scheda
     pubblica e pannello). Le caselle [data-logo] restano nascoste e vuote:
     questa funzione c'e' ancora solo perche' la chiamano leggi() e carica(). */
  function disegna() {
    document.querySelectorAll('[data-logo]').forEach(function (el) { el.hidden = true; el.innerHTML = ''; });
  }

  /* 27 set 2026 — CON CHE ACCOUNT SEI DENTRO.
     Chi ha due account (uno vero, uno di prova) si ritrovava un gestionale
     vuoto senza capire perche': il browser tiene un account solo alla volta.
     Nella prima schermata adesso c'e' scritto con quale email sei dentro,
     e un tasto per cambiarla. */
  function chiSono() {
    var el = document.querySelector('[data-chi-sono]'); if (!el || !SB) return;
    SB.auth.getUser().then(function (r) {
      var em = r && r.data && r.data.user && r.data.user.email; if (!em) return;
      el.hidden = false;
      el.innerHTML = 'Sei dentro come <b>' + esc(em) + '</b> · <button type="button" data-gl="esci">Cambia account</button>';
    }).catch(function () {});
  }
  function leggi() {
    if (!SB || !UID) return;
    chiSono();
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
    if (e.target.closest('[data-gl="esci"]') && SB) {
      SB.auth.signOut().catch(function () {}).then(function () { location.href = '/login-impresa.html?redirect=gestionale'; });
      return;
    }
    var b = e.target.closest('[data-gl="carica"]'); if (!b) return;
    var i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    i.addEventListener('change', function () { carica(i.files && i.files[0]); });
    i.click();
  });

  /* ---- IL LOGO NEI PDF (27 set 2026) ----
     Si mette in alto a sinistra, SOPRA il nome dell'impresa, e sposta giu'
     l'intestazione di quanto serve. Senza logo il foglio resta identico.
     Il browser lo ridisegna in PNG: jsPDF non legge il webp.
     Se qualcosa va storto (rete, immagine rotta) il PDF esce senza logo:
     mai un PDF fermo per colpa del logo. */
  var PDF_CACHE = null;
  function logoPerPdf() {
    if (PDF_CACHE && PDF_CACHE.src === URL_LOGO) return Promise.resolve(PDF_CACHE);
    return new Promise(function (ok) {
      if (!URL_LOGO) return ok(null);
      var im = new Image(); im.crossOrigin = 'anonymous';
      var fatto = false, fine = function (v) { if (!fatto) { fatto = true; ok(v); } };
      setTimeout(function () { fine(null); }, 6000);
      im.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = im.naturalWidth; c.height = im.naturalHeight;
          var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0);
          PDF_CACHE = { src: URL_LOGO, url: c.toDataURL('image/png'), w: im.naturalWidth, h: im.naturalHeight };
          fine(PDF_CACHE);
        } catch (e) { fine(null); }
      };
      im.onerror = function () { fine(null); };
      im.src = URL_LOGO;
    });
  }
  window.gestLogoPdf = async function (doc, M, y) {
    try {
      if (!URL_LOGO && SB && UID) {
        var r = await SB.from('imprese').select('logo_url').eq('user_id', UID).maybeSingle();
        if (!r.error && r.data && r.data.logo_url && r.data.logo_url !== '/img/logo.png') URL_LOGO = r.data.logo_url;
      }
      var d = await logoPerPdf(); if (!d) return y;
      var maxW = 42, maxH = 18, k = Math.min(maxW / d.w, maxH / d.h);
      var w = d.w * k, h = d.h * k;
      doc.addImage(d.url, 'PNG', M, y - 6, w, h);
      return y + h + 2;
    } catch (e) { return y; }
  };

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
