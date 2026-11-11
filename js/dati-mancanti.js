/* ============================================================
   dati-mancanti.js — TrovaImpresa (11 novembre 2026)

   Se un iscritto entra nel pannello SENZA NOME o SENZA CITTA',
   gli si apre una finestra a tutta pagina che li chiede, e non
   si chiude finche' non li ha scritti.

   PERCHE'
   L'impresa id 55 (iscritta il 22 luglio, con la registrazione
   vecchia) e' entrata nel pannello l'11 novembre e non aveva ne'
   nome ne' citta': nella lista admin compariva «Senza nome», i
   clienti non potevano trovarla e preventivi e fatture del
   gestionale uscivano senza intestazione. Chiesto da Alex.

   REGOLE
   - Chi viene dalla porta del gestionale (vetrina_attiva = false)
     la citta' non l'ha mai dovuta dare: a lui si chiede SOLO il nome.
   - Si scrive nel database con `.select('id')` e si controlla che
     torni una riga: se no si dice che non e' salvato (trappola 3).
   - Se la lettura fallisce, NON si apre niente: meglio un pannello
     senza finestra che un pannello bloccato per un errore di rete.
   - Il fondatore che guarda un'altra impresa non viene disturbato:
     si legge la riga dell'utente collegato, non quella mostrata.

   Va caricato nei 3 pannelli, prima di </body>:
       <script src="/js/dati-mancanti.js?v=1"></script>
   ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

  function vuoto(v) { return v == null || String(v).trim() === ''; }

  function caricaGeo(fatto) {
    if (window.GEO_ITALIA) { fatto(); return; }
    var s = document.createElement('script');
    s.src = '/js/geo-italia.js';
    s.onload = fatto;
    s.onerror = fatto; // senza elenco si scrive la citta' a mano (vedi sotto)
    document.head.appendChild(s);
  }

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function opzioni(lista, testoVuoto) {
    return '<option value="">' + testoVuoto + '</option>' + lista.map(function (x) {
      return '<option value="' + esc(x) + '">' + esc(x) + '</option>';
    }).join('');
  }

  function stile() {
    if (document.getElementById('dm-stile')) return;
    var st = document.createElement('style');
    st.id = 'dm-stile';
    st.textContent =
      '#dm-velo{position:fixed;inset:0;z-index:99999;background:rgba(10,42,77,.55);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}' +
      '#dm-box{background:#fff;border-radius:20px;max-width:620px;width:100%;padding:36px 36px 30px;box-shadow:0 20px 60px rgba(0,0,0,.25);font-family:inherit;color:#0a2a4d;max-height:calc(100vh - 32px);overflow-y:auto;box-sizing:border-box}' +
      '#dm-box h2{font-size:28px;margin:0 0 10px;line-height:1.25}' +
      '#dm-box .dm-sotto{font-size:18px;line-height:1.5;color:#3d4a5c;margin:0 0 24px}' +
      '#dm-box .dm-blocco{display:flex;align-items:center;gap:12px;font-size:20px;font-weight:700;margin:6px 0 14px}' +
      '#dm-box .dm-num{width:34px;height:34px;flex:0 0 34px;border-radius:50%;background:#f07c1e;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:18px}' +
      '#dm-box label{display:block;font-size:18px;font-weight:700;margin:0 0 8px}' +
      '#dm-box input,#dm-box select{width:100%;box-sizing:border-box;font-size:18px;padding:14px 16px;border:1.5px solid #c9d4e3;border-radius:12px;background:#fff;margin:0 0 18px;font-family:inherit;color:#0a2a4d}' +
      '#dm-box input:focus,#dm-box select:focus{border-color:#f07c1e;box-shadow:0 0 0 4px rgba(240,124,30,.15);outline:none}' +
      '#dm-box .dm-due{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}' +
      '#dm-box .dm-err{display:none;background:#fef2f2;border:1.5px solid #fecaca;color:#991b1b;border-radius:10px;padding:12px 14px;font-size:16px;margin:0 0 16px}' +
      '#dm-box button{width:100%;min-height:60px;border:0;border-radius:14px;background:#0a2a4d;color:#fff;font-size:20px;font-weight:800;cursor:pointer;font-family:inherit}' +
      '#dm-box button[disabled]{opacity:.6;cursor:wait}' +
      '@media (max-width:600px){#dm-box{padding:24px 18px 20px}#dm-box h2{font-size:23px}#dm-box .dm-due{display:block}}';
    document.head.appendChild(st);
  }

  function apri(sb, riga, chiediCitta) {
    stile();
    var geo = window.GEO_ITALIA || null;
    var regioni = geo ? Object.keys(geo).sort(function (a, b) { return a.localeCompare(b, 'it'); }) : [];

    var html =
      '<div id="dm-box" role="dialog" aria-modal="true" aria-labelledby="dm-tit">' +
      '<h2 id="dm-tit">' + (!chiediCitta ? 'Ti manca il nome' : (vuoto(riga.nome_attivita) && vuoto(riga.nome) ? 'Ti mancano due dati' : 'Ti manca la citt\u00e0')) + '</h2>' +
      '<p class="dm-sotto">' + (chiediCitta
        ? 'Senza nome e città i clienti della tua zona non ti trovano, e nel gestionale preventivi e fatture escono senza intestazione.'
        : 'Il nome va in cima a preventivi e fatture del gestionale.') + '</p>' +
      '<div class="dm-blocco"><span class="dm-num">1</span>La tua attività</div>' +
      '<label for="dm-nome">Nome della tua attività</label>' +
      '<input id="dm-nome" type="text" autocomplete="organization" placeholder="Es. Mario Rossi Costruzioni" value="' + esc(riga.nome_attivita || riga.nome || '') + '">';

    if (chiediCitta) {
      html += '<div class="dm-blocco"><span class="dm-num">2</span>Dove lavori</div>';
      if (geo) {
        html +=
          '<div class="dm-due"><div><label for="dm-reg">Regione</label><select id="dm-reg">' + opzioni(regioni, '-- Seleziona regione --') + '</select></div>' +
          '<div><label for="dm-prov">Provincia</label><select id="dm-prov" disabled>' + opzioni([], '-- Seleziona provincia --') + '</select></div></div>' +
          '<label for="dm-citta">Città</label><select id="dm-citta" disabled>' + opzioni([], '-- Seleziona città --') + '</select>';
      } else {
        // l'elenco non si e' caricato: si scrive a mano, meglio che bloccare
        html += '<label for="dm-citta">Città</label><input id="dm-citta" type="text" placeholder="Es. Rieti">';
      }
    }

    html += '<div class="dm-err" id="dm-err"></div><button type="button" id="dm-salva">Salva e continua</button></div>';

    var velo = document.createElement('div');
    velo.id = 'dm-velo';
    velo.innerHTML = html;
    document.body.appendChild(velo);
    document.documentElement.style.overflow = 'hidden';

    var $ = function (id) { return document.getElementById(id); };
    var reg = $('dm-reg'), prov = $('dm-prov'), cit = $('dm-citta');

    if (geo && reg) {
      reg.addEventListener('change', function () {
        var p = reg.value && geo[reg.value] ? Object.keys(geo[reg.value]).sort(function (a, b) { return a.localeCompare(b, 'it'); }) : [];
        prov.innerHTML = opzioni(p, '-- Seleziona provincia --');
        prov.disabled = !p.length;
        cit.innerHTML = opzioni([], '-- Seleziona città --');
        cit.disabled = true;
      });
      prov.addEventListener('change', function () {
        var c = (reg.value && prov.value && geo[reg.value] && geo[reg.value][prov.value]) || [];
        c = c.slice().sort(function (a, b) { return a.localeCompare(b, 'it'); });
        cit.innerHTML = opzioni(c, '-- Seleziona città --');
        cit.disabled = !c.length;
      });
      // se una parte c'e' gia', la si rimette
      if (riga.regione && geo[riga.regione]) {
        reg.value = riga.regione; reg.dispatchEvent(new Event('change'));
        if (riga.provincia && geo[riga.regione][riga.provincia]) { prov.value = riga.provincia; prov.dispatchEvent(new Event('change')); }
      }
    }

    function errore(t) { var e = $('dm-err'); e.textContent = t; e.style.display = 'block'; }

    $('dm-salva').addEventListener('click', function () {
      $('dm-err').style.display = 'none';
      var nome = $('dm-nome').value.trim();
      if (nome.length < 2) { errore('Scrivi il nome della tua attività.'); $('dm-nome').focus(); return; }
      var dati = { nome_attivita: nome };
      if (vuoto(riga.nome)) dati.nome = nome;
      if (chiediCitta) {
        if (geo && reg) {
          if (!reg.value) { errore('Scegli la regione.'); reg.focus(); return; }
          if (!prov.value) { errore('Scegli la provincia.'); prov.focus(); return; }
          if (!cit.value) { errore('Scegli la città.'); cit.focus(); return; }
          dati.regione = reg.value; dati.provincia = prov.value; dati.citta = cit.value;
        } else {
          var c = cit.value.trim();
          if (c.length < 2) { errore('Scrivi la città.'); cit.focus(); return; }
          dati.citta = c;
        }
      }
      var btn = $('dm-salva');
      btn.disabled = true; btn.textContent = 'Salvo…';
      sb.from('imprese').update(dati).eq('id', riga.id).select('id').then(function (r) {
        if (r.error || !r.data || !r.data.length) {
          btn.disabled = false; btn.textContent = 'Salva e continua';
          errore('Non sono riuscito a salvare. Controlla la connessione e riprova.');
          return;
        }
        // si ricarica: cosi' tutto il pannello riparte coi dati nuovi
        window.location.reload();
      }, function () {
        btn.disabled = false; btn.textContent = 'Salva e continua';
        errore('Non sono riuscito a salvare. Controlla la connessione e riprova.');
      });
    });

    setTimeout(function () { try { $('dm-nome').focus(); } catch (e) {} }, 50);
  }

  function avvia() {
    if (!window.supabase || !window.supabase.createClient) return;
    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    sb.auth.getUser().then(function (res) {
      var user = res && res.data && res.data.user;
      if (!user) return;
      return sb.from('imprese')
        .select('id,nome,nome_attivita,citta,provincia,regione,vetrina_attiva')
        .eq('user_id', user.id).maybeSingle()
        .then(function (r) {
          if (r.error || !r.data) return;
          var riga = r.data;
          var senzaNome = vuoto(riga.nome_attivita) && vuoto(riga.nome);
          var chiediCitta = riga.vetrina_attiva !== false && vuoto(riga.citta);
          if (!senzaNome && !chiediCitta) return;
          if (chiediCitta) caricaGeo(function () { apri(sb, riga, true); });
          else apri(sb, riga, false);
        });
    }).catch(function () { /* in silenzio: mai bloccare il pannello per un errore */ });
  }

  var tentativi = 0;
  (function attendi() {
    if (window.supabase && window.supabase.createClient) { avvia(); return; }
    if (++tentativi > 50) return;
    setTimeout(attendi, 100);
  })();
})();
