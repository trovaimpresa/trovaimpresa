/* =====================================================================
   LE MIE OFFERTE DI LAVORO — nei pannelli (24 ottobre 2026)

   Prima ogni pannello aveva la sua versione: nell'impresa c'era solo
   «Elimina», negli altri due solo «Chiudi». Nessuno poteva modificare,
   riaprire o rinnovare, e nessuno sapeva quando l'offerta scadeva.
   Adesso i tre pannelli usano questa sola: per ogni offerta lo stato
   («Online fino al…» / «Chiusa»), le candidature e «Gestisci», che apre
   la pagina dove si modifica, chiude, riapre o rinnova.

   Sostituisce `caricaMieOfferte` del pannello (stesso nome: i pulsanti
   e showSection che la chiamano non cambiano). I dati arrivano da
   /.netlify/functions/offerta-gestione (azione «miei»): il link di
   gestione contiene il token, che dal browser non si legge.
   Va caricato DOPO lo script grande del pannello.
   ===================================================================== */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function dataIt(d) {
    if (!d) return '';
    var x = new Date(String(d).slice(0, 10) + 'T12:00:00');
    return isNaN(x) ? '' : x.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  var CSS = '' +
    '#lista-mie-offerte .mo-intro{font-size:17px;line-height:1.6;color:#334155;margin:0 0 16px;max-width:760px}' +
    '#lista-mie-offerte .mo-nuova{display:inline-block;background:#0066ff;color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:12px 20px;border-radius:10px;margin:0 0 18px}' +
    '#lista-mie-offerte .mo-box{background:#fff;border-radius:14px;padding:4px 20px;box-shadow:0 2px 10px rgba(0,0,0,.07)}' +
    '#lista-mie-offerte .mo-vuoto{font-size:17px;color:#64748b;padding:22px 0;line-height:1.6}' +
    '#lista-mie-offerte .mo-riga{display:flex;gap:16px;align-items:center;padding:18px 0;border-top:1px solid #e2e8f0}' +
    '#lista-mie-offerte .mo-riga:first-child{border-top:none}' +
    '#lista-mie-offerte .mo-testo{flex:1;min-width:0}' +
    '#lista-mie-offerte .mo-tipo{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#0052cc}' +
    '#lista-mie-offerte .mo-tit{font-size:18px;font-weight:800;color:#0f172a;line-height:1.35;margin-top:2px}' +
    '#lista-mie-offerte .mo-stato{font-size:15.5px;color:#475569;margin-top:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
    '#lista-mie-offerte .mo-pallino{width:11px;height:11px;border-radius:50%;background:#16a34a;flex:none}' +
    '#lista-mie-offerte .mo-pallino.chiuso{background:#9ca3af}' +
    '#lista-mie-offerte .mo-cand{color:#0047b3;font-weight:700;text-decoration:underline;cursor:pointer}' +
    '#lista-mie-offerte .mo-tasti{display:flex;gap:10px;flex-wrap:wrap}' +
    '#lista-mie-offerte .mo-gestisci{background:#0066ff;color:#fff;border-radius:10px;padding:12px 20px;font-size:16px;font-weight:800;text-decoration:none;white-space:nowrap}' +
    '#lista-mie-offerte .mo-gestisci:hover{background:#0052cc}' +
    '#lista-mie-offerte .mo-vedi{border:1.5px solid #0066ff;color:#0052cc;border-radius:10px;padding:11px 16px;font-size:16px;font-weight:800;text-decoration:none;white-space:nowrap}' +
    '@media(max-width:760px){#lista-mie-offerte .mo-riga{flex-direction:column;align-items:stretch}' +
      '#lista-mie-offerte .mo-tasti a{flex:1;text-align:center}}';

  var stileMesso = false;
  function mettiStile() {
    if (stileMesso) return; stileMesso = true;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  }

  function apriCandidature() {
    if (typeof window.showSection === 'function') window.showSection('candidature');
    if (typeof window.caricaCandidature === 'function') window.caricaCandidature();
  }

  async function contaCandidature(ids) {
    var conta = {};
    try {
      if (!ids.length || typeof sb === 'undefined') return conta;
      var r = await sb.from('candidature').select('offerta_id').in('offerta_id', ids);
      (r.data || []).forEach(function (c) { conta[c.offerta_id] = (conta[c.offerta_id] || 0) + 1; });
    } catch (e) { /* senza il numero la lista resta comunque utile */ }
    return conta;
  }

  /* alcuni pannelli hanno gia' il loro «Pubblica una nuova offerta» sopra l'elenco */
  function giaUnBottone(box) {
    var sec = $('sec-mie-offerte'); if (!sec) return false;
    var link = sec.querySelectorAll('a[href*="offerte-registrazione"]');
    for (var i = 0; i < link.length; i++) if (!box.contains(link[i])) return true;
    return false;
  }

  async function caricaMieOfferte(riprova) {
    var box = $('lista-mie-offerte'); if (!box) return;
    mettiStile();
    var testa = '<p class="mo-intro">Qui ritrovi le offerte di lavoro che hai pubblicato. Da «Gestisci» le modifichi, le chiudi quando hai trovato la persona, le riapri o le rinnovi. ' +
      'Ogni offerta resta online 30 giorni: prima che scada ti scriviamo per rinnovarla.</p>' +
      (giaUnBottone(box) ? '' : '<a class="mo-nuova" href="/offerte-registrazione.html">+ Pubblica un\'offerta</a>');
    if (riprova !== true) box.innerHTML = testa + '<div class="mo-box"><div class="mo-vuoto">Caricamento…</div></div>';
    try {
      var s = (typeof sb !== 'undefined' && sb && sb.auth) ? (await sb.auth.getSession()).data.session : null;
      if (!s) { box.innerHTML = testa + '<div class="mo-box"><div class="mo-vuoto">La sessione è scaduta: esci e rientra.</div></div>'; return; }
      var res = await fetch('/.netlify/functions/offerta-gestione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token },
        body: JSON.stringify({ azione: 'miei' })
      });
      var json = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(json.error || 'errore');
      var lista = json.offerte || [];
      if (!lista.length) {
        box.innerHTML = testa + '<div class="mo-box"><div class="mo-vuoto">Non hai ancora pubblicato offerte di lavoro. ' +
          'Bastano cinque campi: chi cerchi, dove, e come ti contattano.</div></div>';
        return;
      }
      var conta = await contaCandidature(lista.map(function (o) { return o.id; }));
      box.innerHTML = testa + '<div class="mo-box">' + lista.map(function (o) {
        var aperta = o.attiva !== false;
        var n = conta[o.id] || 0;
        var cand = n === 0 ? 'Nessuna candidatura' : (n === 1 ? '1 candidatura' : n + ' candidature');
        return '<div class="mo-riga"><div class="mo-testo">' +
          '<div class="mo-tipo">' + esc(o.tipo_offerta ? 'Cerco: ' + o.tipo_offerta : 'Offerta di lavoro') + '</div>' +
          '<div class="mo-tit">' + esc(o.titolo || 'Offerta di lavoro') + (o.citta ? ' — ' + esc(o.citta) : '') + '</div>' +
          '<div class="mo-stato"><span class="mo-pallino' + (aperta ? '' : ' chiuso') + '"></span>' +
            (aperta ? 'Online' + (o.data_scadenza_annuncio ? ' fino al ' + esc(dataIt(o.data_scadenza_annuncio)) : '') : 'Chiusa') +
            ' · ' + (n ? '<a class="mo-cand" data-mo-cand="1">' + cand + '</a>' : cand) + '</div>' +
          '</div><div class="mo-tasti">' +
            (aperta ? '<a class="mo-vedi" href="/offerta-lavoro.html?id=' + encodeURIComponent(o.id) + '" target="_blank" rel="noopener">Vedi</a>' : '') +
            (o.gestisci ? '<a class="mo-gestisci" href="' + esc(o.gestisci) + '" target="_blank" rel="noopener">Gestisci</a>' : '') +
          '</div></div>';
      }).join('') + '</div>';
      box.querySelectorAll('[data-mo-cand]').forEach(function (a) { a.addEventListener('click', apriCandidature); });
    } catch (e) {
      /* la prima chiamata dopo un po' di riposo a volte cade (funzione «fredda»): si riprova una volta da soli */
      if (riprova !== true) { setTimeout(function () { caricaMieOfferte(true); }, 1500); return; }
      box.innerHTML = testa + '<div class="mo-box"><div class="mo-vuoto">Non riesco a leggere le tue offerte in questo momento. Riprova fra un attimo.</div></div>';
    }
  }

  window.caricaMieOfferte = function () { return caricaMieOfferte(false); };
})();
