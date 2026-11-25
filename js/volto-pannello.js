/* =====================================================================
   volto-pannello.js — riquadro «Entra col volto o l'impronta» in fondo
   ai pannelli (impresa, artigiano, professionisti), sopra «Elimina il
   tuo profilo».
   25 nov 2026 — Alessio: «il meccanismo e' sbagliato». Prima volto/
   impronta si attivava SOLO con la domanda dopo l'accesso, e se dicevi
   «Non ora» per 30 giorni non c'era modo di attivarlo. Adesso c'e' anche
   qui, sempre.
   - Attiva   -> conferma.html (la stessa pagina della domanda dopo
                 l'accesso) che fa partire volto/impronta e torna QUI.
   - Disattiva-> su questo dispositivo il pulsante «Volto o impronta»
                 della pagina di accesso non si vede piu' (pk_ok tolto).
   Compare solo se il telefono/computer sa farlo.
   ===================================================================== */
(function () {
  'use strict';
  if (window.TROVAIMPRESA_APP_IOS) return; /* nell'app iPhone non funziona ancora */
  var PANNELLI = ['pannello-artigiano.html', 'pannello-impresa.html',
                  'pannello-negozio.html', 'pannello-professionisti.html'];
  var qui = location.pathname.replace(/^\//, '').replace(/\/$/, '');
  if (!/\.html$/.test(qui)) qui += '.html';
  if (PANNELLI.indexOf(qui) < 0) return;

  function attivo() { try { return localStorage.getItem('pk_ok') === '1'; } catch (e) { return false; } }

  function disegna(box) {
    var on = attivo();
    box.innerHTML =
      '<div style="font-size:20px;font-weight:800;color:#0a2a4d;margin:0 0 6px">Entra col volto o l’impronta</div>' +
      (on
        ? '<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#16824a">✓ Attivo su questo dispositivo.</p>' +
          '<p style="margin:0 0 16px;font-size:16px;color:#475569">Alla pagina di accesso tocca «Volto o impronta».</p>'
        : '<p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.45">Su questo dispositivo non è ancora attivo.<br>La prossima volta entri senza password.</p>') +
      '<button type="button" id="ti-volto-btn" style="width:100%;font:inherit;font-size:18px;font-weight:800;padding:14px;border-radius:12px;cursor:pointer;' +
      (on ? 'background:#fff;color:#0a2a4d;border:2px solid #0a2a4d">Disattiva'
          : 'background:#ff8800;color:#fff;border:none">Attiva') +
      '</button>';
    document.getElementById('ti-volto-btn').onclick = function () {
      if (attivo()) {
        try { localStorage.removeItem('pk_ok'); localStorage.setItem('pk_no', String(Date.now())); } catch (e) {}
        disegna(box);
      } else {
        try { localStorage.removeItem('pk_no'); } catch (e) {}
        location.href = '/conferma.html?accesso=1&sessione=1&vai=' + encodeURIComponent(qui);
      }
    };
  }

  async function avvia() {
    try {
      if (!window.PublicKeyCredential ||
          typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return;
      if (!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())) return;
    } catch (e) { return; }
    var link = document.querySelector('a[href="/elimina-profilo"]');
    if (!link || document.getElementById('ti-volto')) return;
    var box = document.createElement('div');
    box.id = 'ti-volto';
    box.style.cssText = 'max-width:560px;margin:24px auto 0;padding:22px 24px;background:#fff;' +
      'border:1.5px solid #dce2ec;border-radius:18px;text-align:left';
    var riga = link.parentElement;
    riga.parentElement.insertBefore(box, riga);
    disegna(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
