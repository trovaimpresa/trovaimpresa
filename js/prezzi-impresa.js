/* =====================================================================
   I PREZZI DELL'IMPRESA — la sezione «I tuoi prezzi» dei pannelli
   (26 settembre 2026, idea presa da Thumbtack e scelta da Alessio)

   L'impresa scrive quanto costano, piu' o meno, i suoi lavori:
   «Rifacimento bagno completo — da 6.000 € a lavoro finito».
   Il cliente li vede sulla scheda pubblica (profilo-impresa.html) e capisce
   subito se l'impresa e' nel suo budget, prima ancora di scrivere.

   Lo carica UGUALE in tre pannelli: pannello-impresa, pannello-artigiano,
   pannello-professionisti. Non tocca niente di quello che c'era:
   - la sezione e la carta del riepilogo le AGGIUNGE da solo, accanto a
     «Foto dei lavori»;
   - `showSection` lo avvolge e basta: prima fa quello che faceva, poi, se
     la sezione e' «prezzi», carica l'elenco.
   Usa le cose che i pannelli hanno gia': `sb` (il client Supabase) e le
   classi `topbar`, `profilo-card`, `form-group`, `btn-salva-annuncio`.

   ⛔ La tabella e' `prezzi_impresa` (sql/prezzi-e-galleria.sql). Se la
      migrazione non c'e', la sezione lo dice invece di restare vuota.
   ⛔ Il tetto di 40 prezzi lo tiene il DATABASE: qui si fa solo vedere
      il messaggio.
   ===================================================================== */
(function () {
  'use strict';

  var UNITA = {
    lavoro: 'a lavoro finito',
    mq: 'al metro quadro',
    metro: 'al metro',
    ora: "all'ora",
    giorno: 'al giorno',
    pezzo: 'a pezzo'
  };
  window.PREZZI_UNITA = UNITA;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* 6000 -> «6.000 €», 35.5 -> «35,50 €». useGrouping sempre acceso: Intl in
     italiano da solo il punto delle migliaia lo mette solo dai 5 numeri in su. */
  function euro(n) {
    var v = Number(n) || 0;
    var intero = Math.round(v * 100) % 100 === 0;
    return v.toLocaleString('it-IT', {
      minimumFractionDigits: intero ? 0 : 2, maximumFractionDigits: 2, useGrouping: true
    }) + ' €';
  }
  window.prezzoInParole = function (p) {
    return (p.a_partire_da ? 'da ' : '') + euro(p.prezzo) + ' ' + (UNITA[p.unita] || '');
  };

  var CSS = '' +
    '#sec-prezzi .pz-intro{font-size:17px;line-height:1.6;color:#334155;margin:0 0 18px;max-width:760px}' +
    '#sec-prezzi .pz-griglia{display:grid;grid-template-columns:2fr 1fr 1.3fr;gap:14px}' +
    '#sec-prezzi .pz-griglia .form-group{margin:0}' +
    '#sec-prezzi .pz-da{display:flex;align-items:center;gap:12px;font-size:17px;font-weight:700;color:#0f172a;' +
      'background:#f1f5f9;border:1.5px solid #cbd5e1;border-radius:12px;padding:14px 16px;cursor:pointer;margin:16px 0}' +
    '#sec-prezzi .pz-da input{width:24px;height:24px;flex:none;accent-color:#0066ff}' +
    '#sec-prezzi .pz-bottoni{display:flex;gap:10px;flex-wrap:wrap;align-items:center}' +
    '#sec-prezzi .pz-annulla{background:#fff;border:1.5px solid #cbd5e1;color:#334155;font:inherit;font-size:16px;' +
      'font-weight:700;border-radius:10px;padding:12px 18px;cursor:pointer}' +
    '#sec-prezzi .pz-msg{display:none;margin:14px 0 0;padding:12px 14px;border-radius:10px;font-size:16px;font-weight:700}' +
    '#sec-prezzi .pz-msg.ok{display:block;background:#e8f6ee;color:#0a6b35}' +
    '#sec-prezzi .pz-msg.ko{display:block;background:#fdecea;color:#a61b1b}' +
    '#sec-prezzi .pz-vuoto{font-size:17px;color:#64748b;padding:18px 0}' +
    '#sec-prezzi .pz-riga{display:flex;gap:14px;align-items:center;padding:16px 0;border-top:1px solid #e2e8f0}' +
    '#sec-prezzi .pz-riga:first-child{border-top:none}' +
    '#sec-prezzi .pz-testo{flex:1;min-width:0}' +
    '#sec-prezzi .pz-voce{font-size:18px;font-weight:800;color:#0f172a;line-height:1.35}' +
    '#sec-prezzi .pz-cifra{font-size:18px;font-weight:800;color:#0052cc;margin-top:2px}' +
    '#sec-prezzi .pz-nota{font-size:15px;color:#64748b;margin-top:2px}' +
    '#sec-prezzi .pz-az{display:flex;gap:6px;flex:none;flex-wrap:wrap;justify-content:flex-end}' +
    '#sec-prezzi .pz-az button{background:#fff;border:1.5px solid #cbd5e1;border-radius:9px;min-width:44px;height:44px;' +
      'padding:0 12px;font:inherit;font-size:15px;font-weight:700;color:#334155;cursor:pointer}' +
    '#sec-prezzi .pz-az button:hover{border-color:#0066ff;color:#0066ff}' +
    '#sec-prezzi .pz-az .pz-via{color:#b42318}' +
    '#sec-prezzi .pz-az button[disabled]{opacity:.35;cursor:default}' +
    '#sec-prezzi .pz-conta{font-size:15px;color:#64748b;font-weight:700;margin:0 0 6px}' +
    '@media(max-width:760px){#sec-prezzi .pz-griglia{grid-template-columns:1fr}' +
      '#sec-prezzi .pz-riga{flex-direction:column;align-items:stretch}' +
      '#sec-prezzi .pz-az{justify-content:flex-start}}';

  var ICONA = '<svg class="ti-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12"/><path d="M4 14h9"/>' +
    '<path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg>';

  function opzioniUnita() {
    return Object.keys(UNITA).map(function (k) {
      return '<option value="' + k + '">' + UNITA[k] + '</option>';
    }).join('');
  }

  var HTML = '' +
    '<div class="topbar"><div class="topbar-title" style="display:flex;align-items:center;gap:14px">' +
      '<span onclick="showSection(\'dashboard\')" style="cursor:pointer;color:#0066ff;font-size:1rem;font-weight:700">← Torna</span>' +
      ICONA + ' I tuoi prezzi</div></div>' +
    '<p class="pz-intro">Scrivi quanto costano, più o meno, i tuoi lavori. Il cliente li vede sulla tua scheda ' +
      'e capisce subito se sei nel suo budget. Il prezzo preciso lo fai tu, dopo il sopralluogo.</p>' +
    '<div class="profilo-card">' +
      '<div class="profilo-title" id="pz-form-tit">Aggiungi un prezzo</div>' +
      '<div class="pz-griglia">' +
        '<div class="form-group"><label for="pz-voce">Il lavoro</label>' +
          '<input type="text" id="pz-voce" maxlength="120" placeholder="Es. Rifacimento bagno completo"></div>' +
        '<div class="form-group"><label for="pz-prezzo">Prezzo in euro</label>' +
          '<input type="text" id="pz-prezzo" inputmode="decimal" placeholder="Es. 6000"></div>' +
        '<div class="form-group"><label for="pz-unita">Come si conta</label>' +
          '<select id="pz-unita">' + opzioniUnita() + '</select></div>' +
      '</div>' +
      '<label class="pz-da"><input type="checkbox" id="pz-da" checked> Scrivi «da» davanti al prezzo (è il prezzo più basso)</label>' +
      '<div class="form-group"><label for="pz-nota">Una riga in più (se vuoi)</label>' +
        '<input type="text" id="pz-nota" maxlength="200" placeholder="Es. Sanitari e piastrelle esclusi"></div>' +
      '<div class="pz-bottoni">' +
        '<button type="button" class="btn-salva-annuncio" id="pz-salva">Aggiungi il prezzo</button>' +
        '<button type="button" class="pz-annulla" id="pz-annulla" style="display:none">Annulla</button>' +
      '</div>' +
      '<div class="pz-msg" id="pz-msg" role="status"></div>' +
    '</div>' +
    '<div class="profilo-card">' +
      '<div class="profilo-title">Come li vede il cliente</div>' +
      '<p class="pz-conta" id="pz-conta"></p>' +
      '<div id="pz-lista"><div class="pz-vuoto">Caricamento…</div></div>' +
    '</div>';

  var CARTA = '' +
    '<div class="dash-quick-icon">' + ICONA.replace('class="ti-ic"', 'class="ti-ic ti-ic-solo"') + '</div>' +
    '<div class="dash-quick-label">I tuoi prezzi</div>' +
    '<div class="dash-quick-sub">Quanto costano i tuoi lavori</div>';

  var elenco = [];
  var inModifica = null;

  function $(id) { return document.getElementById(id); }
  function msg(testo, ok) {
    var m = $('pz-msg'); if (!m) return;
    m.textContent = testo || '';
    m.className = 'pz-msg' + (testo ? (ok ? ' ok' : ' ko') : '');
  }
  function traduci(err) {
    var t = String((err && (err.message || err.details)) || err || '');
    if (/40 prezzi/.test(t)) return 'Hai già 40 prezzi: togline uno prima di aggiungerne un altro.';
    if (/prezzi_impresa/.test(t) && /does not exist|42P01|schema cache/i.test(t))
      return 'La sezione prezzi non è ancora attiva: scrivi all’assistenza.';
    if (/Failed to fetch|NetworkError/i.test(t)) return 'Manca la connessione. Riprova fra un attimo.';
    if (/JWT|session/i.test(t)) return 'La sessione è scaduta: esci e rientra.';
    return 'Non è stato salvato. Riprova fra un attimo.';
  }
  /* «6.000», «6000», «35,50», «35.5» -> numero. Il punto seguito da tre cifre
     e' quello delle migliaia (come si scrive in Italia). */
  function leggiPrezzo(s) {
    s = String(s || '').replace(/[€\s]/g, '');
    if (!s) return NaN;
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    return /^\d+(\.\d{1,2})?$/.test(s) ? Number(s) : NaN;
  }

  function pulisciForm() {
    inModifica = null;
    $('pz-voce').value = ''; $('pz-prezzo').value = ''; $('pz-nota').value = '';
    $('pz-unita').value = 'lavoro'; $('pz-da').checked = true;
    $('pz-form-tit').textContent = 'Aggiungi un prezzo';
    $('pz-salva').textContent = 'Aggiungi il prezzo';
    $('pz-annulla').style.display = 'none';
  }

  function disegna() {
    var box = $('pz-lista'); if (!box) return;
    $('pz-conta').textContent = elenco.length ? (elenco.length === 1 ? '1 prezzo sulla tua scheda' : elenco.length + ' prezzi sulla tua scheda') : '';
    if (!elenco.length) {
      box.innerHTML = '<div class="pz-vuoto">Ancora nessun prezzo. Scrivi il primo qui sopra: bastano il lavoro e la cifra.</div>';
      return;
    }
    box.innerHTML = elenco.map(function (p, i) {
      return '<div class="pz-riga">' +
        '<div class="pz-testo"><div class="pz-voce">' + esc(p.voce) + '</div>' +
          '<div class="pz-cifra">' + esc(window.prezzoInParole(p)) + '</div>' +
          (p.nota ? '<div class="pz-nota">' + esc(p.nota) + '</div>' : '') + '</div>' +
        '<div class="pz-az">' +
          '<button type="button" data-pz="su" data-i="' + i + '" aria-label="Sposta su"' + (i === 0 ? ' disabled' : '') + '>▲</button>' +
          '<button type="button" data-pz="giu" data-i="' + i + '" aria-label="Sposta giù"' + (i === elenco.length - 1 ? ' disabled' : '') + '>▼</button>' +
          '<button type="button" data-pz="modifica" data-i="' + i + '">Modifica</button>' +
          '<button type="button" class="pz-via" data-pz="via" data-i="' + i + '">Elimina</button>' +
        '</div></div>';
    }).join('');
  }

  async function carica() {
    var box = $('pz-lista'); if (!box || typeof sb === 'undefined') return;
    try {
      var u = await sb.auth.getUser();
      var uid = u && u.data && u.data.user && u.data.user.id;
      if (!uid) { box.innerHTML = '<div class="pz-vuoto">La sessione è scaduta: esci e rientra.</div>'; return; }
      var r = await sb.from('prezzi_impresa').select('*').eq('owner_id', uid)
        .order('ordine', { ascending: true }).order('created_at', { ascending: true });
      if (r.error) throw r.error;
      elenco = r.data || [];
      disegna();
    } catch (e) {
      console.error('prezzi:', e);
      box.innerHTML = '<div class="pz-vuoto">' + esc(traduci(e)) + '</div>';
    }
  }
  window.caricaPrezziImpresa = carica;

  async function salva() {
    var voce = $('pz-voce').value.trim();
    var prezzo = leggiPrezzo($('pz-prezzo').value);
    var riga = {
      voce: voce,
      prezzo: prezzo,
      unita: $('pz-unita').value,
      a_partire_da: $('pz-da').checked,
      nota: $('pz-nota').value.trim() || null
    };
    if (voce.length < 2) { msg('Scrivi il lavoro, per esempio «Rifacimento bagno completo».'); $('pz-voce').focus(); return; }
    if (!(prezzo > 0)) { msg('Scrivi il prezzo solo coi numeri, per esempio 6000 oppure 35,50.'); $('pz-prezzo').focus(); return; }
    var btn = $('pz-salva'); btn.disabled = true;
    try {
      var r;
      if (inModifica) {
        r = await sb.from('prezzi_impresa').update(riga).eq('id', inModifica).select('id');
        if (!r.error && (!r.data || !r.data.length)) throw new Error('nessuna riga');
      } else {
        riga.ordine = elenco.length ? (Math.max.apply(null, elenco.map(function (p) { return p.ordine || 0; })) + 1) : 0;
        r = await sb.from('prezzi_impresa').insert(riga).select('id');
      }
      if (r.error) throw r.error;
      msg(inModifica ? 'Prezzo aggiornato. Il cliente lo vede già.' : 'Prezzo aggiunto. Il cliente lo vede già sulla tua scheda.', true);
      pulisciForm();
      await carica();
    } catch (e) {
      console.error('prezzi salva:', e);
      msg(traduci(e));
    } finally { btn.disabled = false; }
  }

  async function sposta(i, dir) {
    var j = i + dir; if (j < 0 || j >= elenco.length) return;
    var a = elenco[i], b = elenco[j];
    /* si scambiano le posizioni; se erano uguali (righe vecchie tutte a 0)
       si rinumera prima tutto l'elenco, se no lo scambio non cambia niente */
    if ((a.ordine || 0) === (b.ordine || 0)) {
      elenco.forEach(function (p, k) { p.ordine = k; });
      await Promise.all(elenco.map(function (p) { return sb.from('prezzi_impresa').update({ ordine: p.ordine }).eq('id', p.id); }));
    }
    var oa = a.ordine, ob = b.ordine;
    var r1 = await sb.from('prezzi_impresa').update({ ordine: ob }).eq('id', a.id).select('id');
    var r2 = await sb.from('prezzi_impresa').update({ ordine: oa }).eq('id', b.id).select('id');
    if (r1.error || r2.error) msg(traduci(r1.error || r2.error));
    await carica();
  }

  async function elimina(i) {
    var p = elenco[i]; if (!p) return;
    if (!confirm('Togliere «' + p.voce + '» dalla tua scheda?')) return;
    var r = await sb.from('prezzi_impresa').delete().eq('id', p.id).select('id');
    if (r.error || !r.data || !r.data.length) { msg(traduci(r.error || 'nessuna riga')); return; }
    if (inModifica === p.id) pulisciForm();
    msg('Prezzo tolto dalla scheda.', true);
    await carica();
  }

  function modifica(i) {
    var p = elenco[i]; if (!p) return;
    inModifica = p.id;
    $('pz-voce').value = p.voce;
    $('pz-prezzo').value = String(p.prezzo).replace('.', ',');
    $('pz-unita').value = p.unita;
    $('pz-da').checked = !!p.a_partire_da;
    $('pz-nota').value = p.nota || '';
    $('pz-form-tit').textContent = 'Modifica il prezzo';
    $('pz-salva').textContent = 'Salva la modifica';
    $('pz-annulla').style.display = '';
    msg('');
    $('pz-voce').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('pz-voce').focus();
  }

  function monta() {
    var foto = document.getElementById('sec-foto-lavori');
    if (!foto || document.getElementById('sec-prezzi')) return;

    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    /* nella sezione «Foto dei lavori»: una riga che dice dove finiscono le
       foto pubbliche, cosi' l'impresa sa che valgono doppio */
    var topFoto = foto.querySelector('.topbar');
    if (topFoto && !document.getElementById('foto-galleria-nota')) {
      var nota = document.createElement('p');
      nota.id = 'foto-galleria-nota';
      nota.style.cssText = 'font-size:16px;line-height:1.55;color:#334155;margin:0 0 16px;max-width:760px';
      nota.innerHTML = 'Le foto con \u00abMostra nel profilo pubblico\u00bb compaiono sulla tua scheda e anche nella pagina ' +
        '<a href="/lavori-realizzati" target="_blank" rel="noopener" style="color:#0066ff;font-weight:700">Lavori realizzati</a>: ' +
        'chi la guarda e vede un tuo lavoro arriva dritto da te. Metti sempre un titolo chiaro, per esempio \u00abRifacimento bagno a Rieti\u00bb.';
      topFoto.parentNode.insertBefore(nota, topFoto.nextSibling);
    }

    var sec = document.createElement('div');
    sec.className = 'section'; sec.id = 'sec-prezzi'; sec.innerHTML = HTML;
    foto.parentNode.insertBefore(sec, foto.nextSibling);

    /* la carta del riepilogo: subito dopo «Foto dei lavori». La classe
       `dash-quick-card` e' la stessa delle altre, cosi' prende il loro
       aspetto e il loro colore. */
    var cartaFoto = document.querySelector('.dash-quick-card[data-card-id="foto-lavori"]');
    if (cartaFoto) {
      var c = document.createElement('div');
      c.className = 'dash-quick-card'; c.setAttribute('data-card-id', 'prezzi');
      c.style.cursor = 'pointer';
      c.innerHTML = CARTA;
      c.addEventListener('click', function () { window.showSection('prezzi', c); });
      cartaFoto.parentNode.insertBefore(c, cartaFoto.nextSibling);
    }

    $('pz-salva').addEventListener('click', salva);
    $('pz-annulla').addEventListener('click', function () { pulisciForm(); msg(''); });
    $('pz-prezzo').addEventListener('keydown', function (e) { if (e.key === 'Enter') salva(); });
    $('pz-lista').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-pz]'); if (!b || b.disabled) return;
      var i = Number(b.getAttribute('data-i')), a = b.getAttribute('data-pz');
      if (a === 'su') sposta(i, -1);
      else if (a === 'giu') sposta(i, 1);
      else if (a === 'modifica') modifica(i);
      else if (a === 'via') elimina(i);
    });

    /* showSection resta quella del pannello: qui la si avvolge soltanto. */
    if (typeof window.showSection === 'function' && !window.showSection.__prezzi) {
      var prima = window.showSection;
      var nuova = function (id) {
        var r = prima.apply(this, arguments);
        if (id === 'prezzi') carica();
        return r;
      };
      nuova.__prezzi = true;
      window.showSection = nuova;
    }
    /* chi arriva con #prezzi nell'indirizzo (o torna indietro) */
    if (location.hash === '#prezzi') setTimeout(function () { window.showSection('prezzi', null, true); }, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta);
  else monta();
})();
