/* =====================================================================
   EMAIL SBAGLIATA — 13 novembre 2026   (vedi netlify/functions/email-sbagliata.js)

   Sulla schermata «Ci siamo quasi!» controlla, dopo qualche secondo, se
   la mail di conferma e' tornata indietro perche' la casella non esiste.
   Se si': box rosso «Questa email non esiste» con la casella per
   scrivere quella giusta. Un tocco e la conferma riparte al nuovo indirizzo.

   ⚠️ Non deve MAI rompere la schermata: ogni cosa sta in un try, e se la
   funzione non risponde si tace.
   ===================================================================== */
(function () {
  'use strict';
  var URL_F = '/.netlify/functions/email-sbagliata';
  var ATTESE = [12000, 30000, 60000, 120000];   // quando ricontrollare (ms)

  function chiama(dati) {
    return fetch(URL_F, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati)
    }).then(function (r) { return r.json().catch(function () { return {}; }); });
  }

  function mostraBox(emailVecchia, userId) {
    if (document.getElementById('sc-sbagliata')) return;
    var ancora = document.getElementById('sc-email');
    if (!ancora) return;
    var box = document.createElement('div');
    box.id = 'sc-sbagliata';
    box.style.cssText = 'text-align:left;background:#fef2f2;border:2px solid #fca5a5;border-radius:14px;' +
      'padding:16px 16px 18px;margin:0 0 20px';
    box.innerHTML =
      '<p style="font-size:18px;font-weight:800;color:#b91c1c;margin:0 0 6px">❌ Questa email non esiste</p>' +
      '<p style="font-size:16px;line-height:1.55;color:#7f1d1d;margin:0 0 12px">La mail ci è tornata indietro: ' +
      'forse c\'è una lettera sbagliata. Scrivi l\'email giusta e te la rimandiamo subito.</p>' +
      '<input type="email" id="sc-nuova" autocapitalize="none" autocorrect="off" spellcheck="false" ' +
      'placeholder="la tua email giusta" style="width:100%;box-sizing:border-box;font-size:18px;padding:14px;' +
      'border:2px solid #fca5a5;border-radius:10px;font-family:inherit;margin:0 0 10px">' +
      '<button type="button" id="sc-correggi" style="width:100%;background:#ff8800;color:#fff;border:none;' +
      'border-radius:12px;padding:16px;font-size:17px;font-weight:800;font-family:inherit;cursor:pointer">' +
      '✉️ Correggi e rimandami la mail</button>' +
      '<div id="sc-correggi-msg" style="font-size:16px;line-height:1.5;margin:10px 0 0"></div>';
    ancora.parentNode.insertBefore(box, ancora.nextSibling);
    var campo = document.getElementById('sc-nuova');
    campo.value = emailVecchia;
    try { campo.focus(); campo.select(); } catch (e) {}

    document.getElementById('sc-correggi').onclick = function () {
      var b = this, msg = document.getElementById('sc-correggi-msg');
      var nuova = campo.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nuova)) {
        msg.innerHTML = '<span style="color:#b91c1c;font-weight:700">Scrivi un\'email valida.</span>'; return;
      }
      b.disabled = true; b.textContent = '⏳ Un attimo...';
      chiama({ azione: 'correggi', email: emailVecchia, user_id: userId, nuova: nuova }).then(function (r) {
        if (r && r.ok) {
          ancora.textContent = r.email;
          box.style.background = '#f0fdf4'; box.style.borderColor = '#86efac';
          box.innerHTML = '<p style="font-size:18px;font-weight:800;color:#15803d;margin:0 0 6px">✅ Fatto!</p>' +
            '<p style="font-size:16px;line-height:1.55;color:#14532d;margin:0">Ti abbiamo mandato la mail a <b></b>. ' +
            'Aprila e clicca sul link (guarda anche nello SPAM).</p>';
          box.querySelector('b').textContent = r.email;
          sorveglia(r.email, userId);   // ricontrollo anche il nuovo indirizzo
        } else {
          msg.innerHTML = '<span style="color:#b91c1c;font-weight:700"></span>';
          msg.firstChild.textContent = (r && r.errore) || 'Non ci sono riuscito. Scrivici a info@trovaimpresa.com.';
          b.disabled = false; b.textContent = '✉️ Correggi e rimandami la mail';
        }
      }, function () {
        msg.innerHTML = '<span style="color:#b91c1c;font-weight:700">Connessione assente. Riprova fra poco.</span>';
        b.disabled = false; b.textContent = '✉️ Correggi e rimandami la mail';
      });
    };
  }

  function sorveglia(email, userId) {
    if (!email || !userId) return;
    var i = 0, finito = false;
    function giro() {
      if (finito || i >= ATTESE.length) return;
      setTimeout(function () {
        try {
          chiama({ azione: 'controlla', email: email, user_id: userId }).then(function (r) {
            if (!r) return giro();
            if (r.tornata) { finito = true; mostraBox(email, userId); return; }
            if (r.stato === 'confermata' || r.stato === 'delivered') { finito = true; return; }
            giro();
          }, giro);
        } catch (e) {}
      }, ATTESE[i++]);
    }
    giro();
  }

  window.sorvegliaRimbalzo = function (email, userId) { try { sorveglia(email, userId); } catch (e) {} };
})();
