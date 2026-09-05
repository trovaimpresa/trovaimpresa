/* =====================================================================
   CONTROLLO DOPPIONI IN REGISTRAZIONE — 29 agosto 2026

   Nasce da due casi veri, guardati nel database:

   · Welcome Clean (Varese, 26 ago) si iscrive alle 22:38 scrivendo
     "dalila.crescinine86@gnail.com". La mail di conferma va nel vuoto.
     Alle 22:40 si riscrive con l'indirizzo giusto. Due schede uguali.
   · FAP GROUP (Siracusa, 28 ago) alle 12:06 scrive
     "faphgroupsrls@gmail.com", una "h" di troppo. Alle 12:47 rifa' tutto.
     Stessa partita IVA, stesso telefono, due schede.

   Con la STESSA email il sito gia' blocca (lo fa Supabase, e la pagina
   porta al login). Ma questi due avevano sbagliato a scrivere l'email:
   per il sito erano due persone diverse.

   Qui ci sono due reti, e nessuna delle due BLOCCA.
   1. Se il dominio dell'email somiglia a uno vero ma non lo e'
      (gnail.com, gmial.com, hotmial.it), lo si fa notare e si offre
      la correzione con un click.
   2. Se la partita IVA o il telefono risultano gia' iscritti, si avvisa
      e si offre il recupero dell'accesso.

   ⚠️ PERCHE' AVVISA E NON BLOCCA
   Chi si e' iscritto con l'email sbagliata NON puo' entrare nel primo
   account: la mail di conferma non gli e' mai arrivata. Se il secondo
   tentativo lo bloccassimo per "partita IVA gia' presente", quella
   persona resterebbe chiusa fuori dal sito per sempre, senza un modo
   per uscirne. Un doppione si sistema, un cliente perso no.

   ⚠️ NON DEVE MAI FERMARE LA REGISTRAZIONE
   Ogni controllo sta dentro un try suo. Se Supabase non risponde, se
   la rete cade, se un campo non c'e': si tace e si va avanti.
   ===================================================================== */
(function () {
  'use strict';

  // ---- i domini di posta veri, quelli che gli artigiani usano davvero ----
  var DOMINI_VERI = [
    'gmail.com', 'libero.it', 'hotmail.it', 'hotmail.com', 'outlook.it',
    'outlook.com', 'yahoo.it', 'yahoo.com', 'virgilio.it', 'alice.it',
    'tiscali.it', 'icloud.com', 'live.it', 'live.com', 'tin.it',
    'fastwebnet.it', 'inwind.it', 'email.it', 'pec.it', 'me.com',
    'aruba.it', 'teletu.it', 'msn.com', 'gmx.com', 'protonmail.com'
  ];

  // distanza fra due parole: quante lettere bisogna cambiare per passare
  // dall'una all'altra. "gnail.com" -> "gmail.com" e' 1.
  function distanza(a, b) {
    var m = a.length, n = b.length, i, j, riga = [], prec;
    for (j = 0; j <= n; j++) riga[j] = j;
    for (i = 1; i <= m; i++) {
      prec = riga[0]; riga[0] = i;
      for (j = 1; j <= n; j++) {
        var tmp = riga[j];
        riga[j] = Math.min(
          riga[j] + 1,
          riga[j - 1] + 1,
          prec + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
        );
        prec = tmp;
      }
    }
    return riga[n];
  }

  function dominioSuggerito(email) {
    var pezzi = String(email || '').toLowerCase().split('@');
    if (pezzi.length !== 2) return null;
    var dom = pezzi[1].trim();
    if (!dom || DOMINI_VERI.indexOf(dom) !== -1) return null;

    // le code sbagliate piu' comuni: .con al posto di .com, .ti al posto di .it
    var corretto = dom
      .replace(/\.con$/, '.com')
      .replace(/\.cm$/, '.com')
      .replace(/\.ti$/, '.it')
      .replace(/\.i$/, '.it');
    if (corretto !== dom && DOMINI_VERI.indexOf(corretto) !== -1) return corretto;

    // altrimenti: somiglia a un dominio vero per una o due lettere?
    var migliore = null, minima = 99;
    for (var k = 0; k < DOMINI_VERI.length; k++) {
      var d = distanza(dom, DOMINI_VERI[k]);
      if (d < minima) { minima = d; migliore = DOMINI_VERI[k]; }
    }
    var soglia = dom.length >= 9 ? 2 : 1;
    if (minima > 0 && minima <= soglia) return migliore;
    return null;
  }

  // ---- il riquadro dell'avviso, sotto al campo -------------------------
  // Colori e misure copiati da showMsg() di queste stesse pagine:
  // sfondo #fdecea, testo #b71c1c, bordo #f5c6cb. Niente di nuovo.
  function riquadro(campo) {
    var id = 'avviso-doppione-' + campo.id;
    var box = document.getElementById(id);
    if (!box) {
      box = document.createElement('div');
      box.id = id;
      box.style.cssText = 'display:none;margin:8px 0 0;padding:10px 12px;' +
        'background:#fdecea;color:#b71c1c;border:1px solid #f5c6cb;' +
        'border-radius:8px;font-size:14px;line-height:1.5;';
      if (campo.parentNode) campo.parentNode.insertBefore(box, campo.nextSibling);
    }
    return box;
  }

  function mostra(campo, html) {
    var box = riquadro(campo);
    box.innerHTML = html;
    box.style.display = 'block';
  }

  function nascondi(campo) {
    var box = document.getElementById('avviso-doppione-' + campo.id);
    if (box) box.style.display = 'none';
  }

  // ---- 1. l'email scritta male -----------------------------------------
  function controllaEmail() {
    var campo = document.getElementById('email');
    if (!campo) return;
    try {
      var valore = campo.value.trim();
      if (!valore || valore.indexOf('@') < 0) { nascondi(campo); return; }
      var giusto = dominioSuggerito(valore);
      if (!giusto) { nascondi(campo); return; }
      var corretta = valore.split('@')[0] + '@' + giusto;
      mostra(campo,
        '⚠️ Controlla l\'indirizzo: volevi scrivere <strong>' + corretta + '</strong>?' +
        '<br><button type="button" id="btn-correggi-email" ' +
        'style="margin-top:8px;background:#b71c1c;color:#fff;border:0;' +
        'border-radius:8px;padding:8px 14px;font-size:14px;font-weight:700;' +
        'cursor:pointer;">Sì, correggi</button>' +
        ' <span style="font-size:14px;">oppure lascia pure com\'è</span>');
      var btn = document.getElementById('btn-correggi-email');
      if (btn) btn.onclick = function () { campo.value = corretta; nascondi(campo); campo.focus(); };
    } catch (e) { /* mai fermare la registrazione */ }
  }

  // ---- 2. partita IVA o telefono già iscritti ---------------------------
  function soloCifre(s) { return String(s || '').replace(/\D/g, ''); }

  // Il collegamento a Supabase e' gia' aperto dalla pagina (supabaseClient).
  // Se per qualsiasi motivo non c'e', non si cerca e non si avvisa: mai
  // costruire un secondo collegamento, mai far cadere la registrazione.
  function client() {
    try {
      if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient;
    } catch (e) {}
    return null;
  }

  async function cerca(colonna, cifre) {
    var sb = client();
    if (!sb) return false;
    // il database ha i numeri scritti in modi diversi ("+393349767316" e
    // "3925993632"): si cerca "che contiene", non "uguale a".
    /* ⛔ 5 SETTEMBRE 2026 — non si legge piu' la tabella, si fa la DOMANDA.
       Prima questa riga leggeva `imprese` con la chiave pubblica: funzionava,
       ma la stessa chiave permetteva di portarsi via l'elenco intero. Adesso
       si chiama `impresa_gia_iscritta`, che risponde SI o NO e non fa uscire
       nessuna riga. L'avviso a schermo e' identico a prima. */
    var res = await sb.rpc('impresa_gia_iscritta', { _colonna: colonna, _cifre: cifre });
    if (res.error) return false;
    return res.data === true;
  }

  function avvisoGiaIscritto(campo, cosa) {
    mostra(campo,
      '⚠️ Risulta già un profilo su TrovaImpresa con ' + cosa + '.' +
      '<br>Se è tuo, non serve rifare la registrazione: ' +
      '<a href="/login-impresa.html" style="color:#b71c1c;font-weight:700;">entra da qui</a>' +
      ' o <a href="/reset-password.html" style="color:#b71c1c;font-weight:700;">recupera la password</a>.' +
      '<br><span style="font-size:14px;">Se invece è la prima volta che ti iscrivi, vai pure avanti.</span>');
  }

  async function controllaPartitaIva() {
    var campo = document.getElementById('partita_iva');
    if (!campo) return;
    try {
      var cifre = soloCifre(campo.value);
      if (cifre.length !== 11) { nascondi(campo); return; }
      if (await cerca('partita_iva', cifre)) avvisoGiaIscritto(campo, 'questa partita IVA');
      else nascondi(campo);
    } catch (e) { /* silenzio */ }
  }

  async function controllaTelefono() {
    var campo = document.getElementById('telefono');
    if (!campo) return;
    try {
      var cifre = soloCifre(campo.value);
      if (cifre.length < 9) { nascondi(campo); return; }
      // si confrontano le ultime 9 cifre: cosi' "+39 334 976 7316" e
      // "3349767316" si riconoscono come lo stesso numero.
      var coda = cifre.slice(-9);
      if (await cerca('telefono', coda)) avvisoGiaIscritto(campo, 'questo numero di telefono');
      else nascondi(campo);
    } catch (e) { /* silenzio */ }
  }

  // ---- aggancio ai campi ------------------------------------------------
  function avvia() {
    var coppie = [
      ['email', controllaEmail],
      ['partita_iva', controllaPartitaIva],
      ['telefono', controllaTelefono]
    ];
    for (var i = 0; i < coppie.length; i++) {
      (function (id, fn) {
        var el = document.getElementById(id);
        if (!el) return;
        // "blur" = quando esce dal campo: non mentre sta ancora scrivendo
        el.addEventListener('blur', fn);
      })(coppie[i][0], coppie[i][1]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else {
    avvia();
  }
})();
