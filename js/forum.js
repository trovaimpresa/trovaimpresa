/* Forum Edilizia — 4 ottobre 2026.
   Serve due pagine: forum.html (l'elenco che scorre) e forum-richiesta.html
   (una richiesta sola, quella che va su Google). Stesso file, due modi.

   REGOLE CHE QUI DENTRO NON SI TOCCANO
   - Il cliente pubblica SENZA account: la richiesta nasce "in_attesa" e va
     online solo col clic nella email (netlify/functions/bacheca-conferma.js).
   - Email e codici del cliente non arrivano mai a questa pagina: il database
     non li fa leggere a chi non ha fatto l'accesso.
   - Rispondono solo le imprese con l'accesso fatto (imprese.user_id = utente).
   - Gli id sono UUID: negli attributi data-* vanno bene, mai dentro onclick. */
(function () {
  'use strict';

  var SB_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SB_KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  var sb = window.supabase.createClient(SB_URL, SB_KEY);

  var MESTIERI = ['Muratore', 'Impresa edile', 'Idraulico', 'Elettricista', 'Imbianchino', 'Piastrellista',
    'Falegname', 'Fabbro', 'Carpentiere', 'Cartongessista', 'Serramentista', 'Geometra', 'Architetto', 'Altro'];
  var COLONNE = 'id,slug,titolo,testo,mestiere,citta,foto,nome_pubblico,stato,n_risposte,n_voti,indicizzabile,creato_il';
  var PER_PAGINA = 12;

  var stato = { ordine: 'nuove', mestiere: '', q: '', pagina: 0, finito: false, singolo: false, slug: '', g: '' };

  /* 4 ott 2026 — la ricerca: toglie i caratteri che nel filtro del database
     avrebbero un significato speciale (virgole, parentesi, asterischi, apici…) */
  function pulisciRicerca(t) {
    return String(t || '').replace(/[,()*%\\"'.:;<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  }
  var io = { impresa: null };       // l'impresa che ha fatto l'accesso, se c'e'
  var mieiVoti = {};                // cosa ha gia' votato questo browser
  var fotoScelte = [];

  /* ---------- piccoli attrezzi ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }

  function visitatore() {
    var v = lsGet('ti_forum_vid');
    if (!v || v.length < 8) {
      v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('v' + Date.now() + Math.random().toString(36).slice(2, 12));
      lsSet('ti_forum_vid', v);
    }
    return v;
  }
  try { mieiVoti = JSON.parse(lsGet('ti_forum_voti') || '{}') || {}; } catch (e) { mieiVoti = {}; }
  function salvaVoti() { lsSet('ti_forum_voti', JSON.stringify(mieiVoti)); }

  function fa(iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 90) return 'adesso';
    if (s < 3600) return Math.round(s / 60) + ' min fa';
    if (s < 86400) { var o = Math.round(s / 3600); return o + (o === 1 ? ' ora fa' : ' ore fa'); }
    if (s < 172800) return 'ieri';
    if (s < 2592000) return Math.round(s / 86400) + ' giorni fa';
    return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function iniziale(n) { return esc(String(n || '?').trim().charAt(0).toUpperCase() || '?'); }
  function fotoOk(u) { return typeof u === 'string' && (u.indexOf(SB_URL + '/storage/v1/object/public/') === 0 || u.indexOf('https://trovaimpresa.com/img/forum/') === 0); } /* 6 ott 2026: anche le foto della redazione, tenute nella cartella /img/forum/ */
  function urlRichiesta(r) { return '/forum-richiesta?s=' + encodeURIComponent(r.slug); }

  /* ---------- chi sono ---------- */
  function carica_io() {
    return sb.auth.getSession().then(function (res) {
      var s = res && res.data && res.data.session;
      if (!s) return;
      return sb.from('imprese').select('id,nome_attivita,nome').eq('user_id', s.user.id).limit(1).then(function (r) {
        if (r && r.data && r.data[0]) io.impresa = r.data[0];
      });
    }).catch(function () { });
  }

  /* ---------- pezzi di HTML ---------- */
  function htmlFoto(r) {
    var f = (r.foto || []).filter(fotoOk).slice(0, 4);
    if (!f.length) return '';
    return '<div class="f-foto' + (f.length > 1 ? ' piu' : '') + '">' + f.map(function (u) {
      return '<img src="' + esc(u) + '" alt="Foto della richiesta: ' + esc(r.titolo) + '" loading="lazy" data-act="zoom">';
    }).join('') + '</div>';
  }

  function htmlCommento(c) {
    var autore = c.autore === true, ospite = c.ospite === true;
    var nome = c.impresa_nome || (autore ? 'Autore' : ospite ? 'Ospite' : 'Impresa');
    var intest = autore
      ? '<b>' + esc(nome) + '</b><span class="f-tag-aut">Autore</span>'
      : ospite ? '<b>' + esc(nome) + '</b>'
      : '<a href="/profilo-impresa?id=' + encodeURIComponent(c.impresa_id) + '">' + esc(nome) + '</a><span class="f-tag-imp">Impresa</span>' +
        (c.impresa_mestiere ? ' · ' + esc(c.impresa_mestiere) : '');
    var votato = mieiVoti['c' + c.id] ? ' on' : '';
    return '<div class="f-c" data-cid="' + esc(c.id) + '">' +
      '<div class="f-av' + (autore ? ' a' : '') + '">' + iniziale(nome) + '</div>' +
      '<div><div class="f-nm">' + intest + ' · ' + esc(fa(c.creato_il)) + '</div>' +
      '<p>' + nl2br(c.testo) + '</p>' +
      (c.prezzo_indicativo ? '<span class="f-prezzo">' + esc(c.prezzo_indicativo) + '</span>' : '') +
      '<div class="f-mi"><button class="' + votato.trim() + '" data-act="vota" data-t="c" data-id="' + esc(c.id) + '">👍 <span>' + (c.n_voti || 0) + '</span></button>' +
      '<span class="f-menu"><button data-act="menu" aria-label="Altro">⋯</button>' + menuSegnala('c', c.id) + '</span></div></div></div>';
  }

  function menuSegnala(t, id) {
    return '<div class="f-menu-lista"><small>Segnala per:</small>' +
      ['Spam o pubblicità', 'Insulti o offese', 'Non c\'entra con i lavori edili'].map(function (m) {
        return '<button data-act="segnala" data-t="' + t + '" data-id="' + esc(id) + '" data-m="' + esc(m) + '">' + esc(m) + '</button>';
      }).join('') + '</div>';
  }

  function htmlRispondi(r) {
    if (r.stato === 'chiusa') return '<div class="f-rispondi"><div class="f-finta"><span>Questa richiesta è chiusa.</span></div></div>';
    if (io.impresa) {
      return '<div class="f-rispondi" data-rid="' + esc(r.id) + '">' +
        '<div class="f-finta" data-act="apri-risposta" style="cursor:text"><span>Rispondi come ' + esc(io.impresa.nome_attivita || io.impresa.nome || 'impresa') + '…</span></div>' +
        '<div class="f-scrivi" style="display:none"><textarea maxlength="2000" placeholder="Scrivi la tua risposta"></textarea>' +
        '<input type="text" maxlength="60" placeholder="Prezzo indicativo (facoltativo), es. 4.500 – 6.500 €">' +
        '<button class="f-btn" data-act="invia-risposta">Pubblica la risposta</button><div class="f-msg"></div></div></div>';
    }
    return '<div class="f-rispondi" data-rid="' + esc(r.id) + '" data-slug="' + esc(r.slug) + '">' +
      '<div class="f-finta" data-act="apri-risposta" style="cursor:text"><span>Scrivi una risposta…</span></div>' +
      '<div class="f-scrivi" style="display:none"><input type="text" class="f-ospite-nome" maxlength="40" placeholder="Il tuo nome">' +
      '<textarea maxlength="1500" placeholder="Scrivi la tua risposta"></textarea>' +
      '<input type="text" class="f-trap" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0">' +
      '<button class="f-btn" data-act="invia-ospite">Pubblica la risposta</button><div class="f-msg"></div>' +
      '<div class="f-nota-imp">Niente link, email o numeri di telefono. <b>Sei un\'impresa?</b> <a href="/registrazione-impresa.html">Iscriviti gratis al sito</a>: compari con il bollino «Impresa» e ricevi le richieste nel tuo pannello.</div></div></div>';
  }

  function htmlPost(r, comm, opz) {
    opz = opz || {};
    var tutti = comm || [];
    var mostrati = opz.singolo ? tutti : tutti.slice(0, 3);
    var votato = mieiVoti['r' + r.id] ? ' on' : '';
    var nome = r.nome_pubblico || 'Cliente';
    var titolo = opz.singolo ? '<h1>' + esc(r.titolo) + '</h1>' : '<h2><a href="' + urlRichiesta(r) + '">' + esc(r.titolo) + '</a></h2>';
    return '<article class="f-post" data-rid="' + esc(r.id) + '">' +
      '<div class="f-ph"><div class="f-av">' + iniziale(nome) + '</div><b>' + esc(nome) + '</b> · ' + esc(fa(r.creato_il)) +
      (r.citta ? ' · ' + esc(r.citta) : '') +
      (r.mestiere ? ' <span class="f-chip">' + esc(r.mestiere) + '</span>' : '') +
      (r.stato === 'chiusa' ? ' <span class="f-chiuso">✓ Risolta</span>' : '') + '</div>' +
      titolo + '<div class="f-tx">' + nl2br(r.testo) + '</div>' + htmlFoto(r) +
      '<div class="f-az"><button class="f-b' + votato + '" data-act="vota" data-t="r" data-id="' + esc(r.id) + '">👍 <span>' + (r.n_voti || 0) + '</span></button>' +
      '<a class="f-b" href="' + urlRichiesta(r) + '">💬 ' + (tutti.length ? tutti.length + (tutti.length === 1 ? ' commento' : ' commenti') : 'Nessuna risposta') + '</a>' +
      '<button class="f-b" data-act="condividi" data-slug="' + esc(r.slug) + '">↗ Condividi</button>' +
      '<span class="f-menu"><button data-act="menu" aria-label="Altro">⋯</button>' + menuSegnala('r', r.id) + '</span></div>' +
      '<div class="f-comm">' + mostrati.map(htmlCommento).join('') +
      (!opz.singolo && tutti.length > 3 ? '<a class="f-altri" href="' + urlRichiesta(r) + '">Vedi tutti i ' + tutti.length + ' commenti →</a>' : '') +
      htmlRispondi(r) + '</div></article>';
  }

  /* ---------- lettura dal database ---------- */
  function leggiCommenti(ids) {
    if (!ids.length) return Promise.resolve({});
    return sb.from('bacheca_risposte')
      .select('id,richiesta_id,impresa_id,impresa_nome,impresa_mestiere,testo,prezzo_indicativo,creato_il,autore,ospite,n_voti')
      .in('richiesta_id', ids).eq('stato', 'visibile').order('creato_il', { ascending: true })
      .then(function (res) {
        var mappa = {};
        ((res && res.data) || []).forEach(function (c) { (mappa[c.richiesta_id] = mappa[c.richiesta_id] || []).push(c); });
        return mappa;
      });
  }

  function caricaElenco(aggiungi) {
    var box = $('#f-elenco');
    if (!aggiungi) { stato.pagina = 0; stato.finito = false; box.innerHTML = '<div class="f-vuoto">Carico le richieste…</div>'; }
    var q = sb.from('bacheca_richieste').select(COLONNE).in('stato', ['pubblicata', 'chiusa']);
    if (stato.mestiere) q = q.eq('mestiere', stato.mestiere);
    if (stato.q) q = q.or('titolo.ilike.*' + stato.q + '*,testo.ilike.*' + stato.q + '*');
    if (stato.ordine === 'senza') q = q.eq('n_risposte', 0).eq('stato', 'pubblicata');
    if (stato.ordine === 'utili') q = q.order('n_voti', { ascending: false }).order('creato_il', { ascending: false });
    else q = q.order('creato_il', { ascending: false });
    var da = stato.pagina * PER_PAGINA;
    return q.range(da, da + PER_PAGINA - 1).then(function (res) {
      if (res.error) throw res.error;
      var righe = res.data || [];
      return leggiCommenti(righe.map(function (r) { return r.id; })).then(function (mappa) {
        var html = righe.map(function (r) { return htmlPost(r, mappa[r.id]); }).join('');
        if (!aggiungi) box.innerHTML = '';
        if (!righe.length && !aggiungi) {
          box.innerHTML = stato.q
            ? '<div class="f-vuoto"><b>Nessuna richiesta trovata per «' + esc(stato.q) + '».</b><br>Prova con un\'altra parola, oppure scrivi tu la richiesta: è gratis e non serve registrarsi.</div>'
            : '<div class="f-vuoto"><b>Ancora nessuna richiesta' + (stato.mestiere ? ' per questo mestiere' : '') + '.</b><br>Scrivi tu la prima: è gratis e non serve registrarsi.</div>';
        } else { box.insertAdjacentHTML('beforeend', html); }
        stato.finito = righe.length < PER_PAGINA;
        var altro = $('#f-carica'); if (altro) altro.style.display = stato.finito ? 'none' : 'block';
        stato.pagina++;
      });
    }).catch(function (e) {
      console.error('[forum] elenco', e);
      box.innerHTML = '<div class="f-vuoto">Non riesco a caricare le richieste adesso. Riprova fra poco.</div>';
    });
  }

  /* ---------- pagina della singola richiesta ---------- */
  function metaTag(nome, valore, attr) {
    var el = document.querySelector('meta[' + (attr || 'name') + '="' + nome + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr || 'name', nome); document.head.appendChild(el); }
    el.setAttribute('content', valore);
  }

  function seo(r, comm) {
    var titolo = r.titolo + ' | Forum Edilizia TrovaImpresa';
    var desc = String(r.testo).replace(/\s+/g, ' ').slice(0, 155);
    document.title = titolo;
    metaTag('description', desc);
    metaTag('og:title', titolo, 'property'); metaTag('og:description', desc, 'property');
    var url = 'https://trovaimpresa.com/forum-richiesta?s=' + encodeURIComponent(r.slug);
    var can = document.querySelector('link[rel=canonical]');
    if (!can) { can = document.createElement('link'); can.rel = 'canonical'; document.head.appendChild(can); }
    can.href = url; metaTag('og:url', url, 'property');
    /* solo le richieste con almeno una risposta di un'impresa si fanno vedere a Google */
    var daGoogle = r.indicizzabile === true && comm.some(function (c) { return !c.autore && !c.ospite; });
    metaTag('robots', daGoogle ? 'index,follow' : 'noindex,follow');
    var f = (r.foto || []).filter(fotoOk)[0]; if (f) metaTag('og:image', f, 'property');
    var ld = {
      '@context': 'https://schema.org', '@type': 'DiscussionForumPosting', headline: r.titolo, text: r.testo,
      datePublished: r.creato_il, url: url, author: { '@type': 'Person', name: r.nome_pubblico || 'Cliente' },
      image: f || undefined, commentCount: comm.length,
      comment: comm.map(function (c) {
        return { '@type': 'Comment', text: c.testo, dateCreated: c.creato_il,
          author: { '@type': (c.autore || c.ospite) ? 'Person' : 'Organization', name: c.impresa_nome || 'Impresa' } };
      })
    };
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  function caricaSingola() {
    var box = $('#f-elenco');
    return sb.from('bacheca_richieste').select(COLONNE).eq('slug', stato.slug).in('stato', ['pubblicata', 'chiusa']).limit(1).then(function (res) {
      var r = res && res.data && res.data[0];
      if (!r) {
        metaTag('robots', 'noindex,follow');
        box.innerHTML = '<div class="f-vuoto"><b>Questa richiesta non c\'è o non è ancora online.</b><br><a href="/forum" style="color:#0066ff;font-weight:700">Vai al Forum Edilizia →</a></div>';
        return;
      }
      return leggiCommenti([r.id]).then(function (mappa) {
        var comm = mappa[r.id] || [];
        seo(r, comm);
        box.innerHTML = htmlPost(r, comm, { singolo: true });
        return stato.g ? mostraAutore(r) : null;
      });
    }).catch(function (e) {
      console.error('[forum] singola', e);
      box.innerHTML = '<div class="f-vuoto">Non riesco a caricare la richiesta adesso. Riprova fra poco.</div>';
    });
  }

  function mostraAutore(r) {
    return sb.rpc('bacheca_autore_ok', { p_slug: r.slug, p_codice: stato.g }).then(function (res) {
      if (!res || res.data !== true) return;
      var chiusa = r.stato === 'chiusa';
      var html = '<div class="f-autore" id="f-autore"><b>Questa è la tua richiesta.</b> Solo tu vedi questo riquadro.<br>' +
        (chiusa ? 'È segnata come risolta.' : 'Quando hai risolto, chiudila: le imprese capiscono che non serve più rispondere.') +
        '<br><button class="f-btn" data-act="autore-chiudi" data-chiudi="' + (chiusa ? '0' : '1') + '">' + (chiusa ? 'Riapri la richiesta' : '✓ Ho risolto, chiudi') + '</button> ' +
        '<button class="f-btn" style="background:#0066ff" data-act="autore-scrivi">Rispondi alle imprese</button>' +
        '<div class="f-scrivi" style="display:none;margin-top:10px"><textarea style="width:100%;border:1.5px solid #cfd8e3;border-radius:12px;padding:10px;font-family:inherit;font-size:.95rem;min-height:80px" maxlength="2000" placeholder="Scrivi qui la tua risposta"></textarea>' +
        '<button class="f-btn" data-act="autore-invia">Pubblica</button></div><div class="f-msg"></div></div>';
      $('#f-elenco').insertAdjacentHTML('afterbegin', html);
    }).catch(function () { });
  }

  /* ---------- scrivere una richiesta ---------- */
  function htmlComposer() {
    return '<div class="f-comp-riga"><div class="f-av">👤</div>' +
      '<button type="button" class="f-box" data-act="apri-comp">Cosa ti serve? Scrivi qui la tua richiesta…</button>' +
      '<button type="button" class="f-cam" data-act="apri-comp" aria-label="Aggiungi foto">📷</button></div>' +
      '<form class="f-form" id="f-form" novalidate autocomplete="off">' +
      '<label for="f-titolo">Cosa ti serve? (in una riga)</label><input type="text" id="f-titolo" maxlength="120" placeholder="Es. Crepa sopra la finestra del bagno, è grave?">' +
      '<label for="f-testo">Spiega meglio</label><textarea id="f-testo" maxlength="3000" placeholder="Dove, da quanto tempo, cosa hai già provato…"></textarea>' +
      '<label>Foto (facoltativo, fino a 3)</label><div class="f-foto-zona" data-act="scegli-foto">📷 Aggiungi foto<small>Una foto fa capire il problema molto meglio</small></div>' +
      '<input type="file" id="f-file" accept="image/*" multiple style="display:none"><div class="f-anteprime" id="f-ante"></div>' +
      '<div class="f-due"><div><label for="f-mestiere">Che mestiere ti serve?</label><select id="f-mestiere"><option value="">Non lo so</option>' +
      MESTIERI.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div>' +
      '<div><label for="f-citta">Città</label><input type="text" id="f-citta" maxlength="80" placeholder="Es. Rieti"></div></div>' +
      '<div class="f-due"><div><label for="f-nome">Il tuo nome (facoltativo)</label><input type="text" id="f-nome" maxlength="60" placeholder="Es. Anna"></div>' +
      '<div><label for="f-email">La tua email</label><input type="email" id="f-email" maxlength="200" placeholder="Per confermare la richiesta"></div></div>' +
      '<input type="text" class="f-hp" id="f-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="f-privacy">🔒 La tua email e il tuo telefono non si vedono mai sul sito. Ti scriviamo solo per confermare la richiesta e per avvisarti quando un\'impresa risponde.</div>' +
      '<div class="f-azioni-form"><button type="submit" class="f-btn" id="f-invia">Pubblica la richiesta</button>' +
      '<button type="button" class="f-btn-2" data-act="chiudi-comp">Annulla</button></div><div class="f-msg" id="f-msg"></div></form>';
  }

  function comprimi(file) {
    return new Promise(function (ok) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 1600 / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { URL.revokeObjectURL(u); ok(b); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); ok(null); };
      img.src = u;
    });
  }

  function disegnaAnteprime() {
    $('#f-ante').innerHTML = fotoScelte.map(function (f, i) {
      return '<div><img src="' + URL.createObjectURL(f) + '" alt=""><button type="button" data-act="togli-foto" data-i="' + i + '" aria-label="Togli">×</button></div>';
    }).join('');
  }

  function messaggio(el, testo, tipo) { if (el) { el.className = 'f-msg ' + (tipo || ''); el.textContent = testo || ''; } }

  function inviaRichiesta(ev) {
    ev.preventDefault();
    var m = $('#f-msg'), btn = $('#f-invia');
    var d = {
      titolo: $('#f-titolo').value.trim(), testo: $('#f-testo').value.trim(), mestiere: $('#f-mestiere').value,
      citta: $('#f-citta').value.trim(), nome: $('#f-nome').value.trim(), email: $('#f-email').value.trim(),
      sito_web_extra: $('#f-hp').value
    };
    if (d.titolo.length < 8) return messaggio(m, 'Scrivi in una riga cosa ti serve (almeno 8 lettere).', 'err');
    if (d.testo.length < 20) return messaggio(m, 'Spiega un po\' meglio il problema (almeno 20 lettere).', 'err');
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(d.email)) return messaggio(m, 'Controlla l\'email: serve per confermare la richiesta.', 'err');
    btn.disabled = true; messaggio(m, fotoScelte.length ? 'Carico le foto…' : 'Invio…', '');
    var caricate = [];
    var catena = Promise.resolve();
    fotoScelte.slice(0, 3).forEach(function (f) {
      catena = catena.then(function () {
        return comprimi(f).then(function (blob) {
          if (!blob) return;
          var percorso = 'r/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
          return sb.storage.from('forum-foto').upload(percorso, blob, { contentType: 'image/jpeg' }).then(function (res) {
            if (res.error) throw res.error;
            caricate.push(sb.storage.from('forum-foto').getPublicUrl(percorso).data.publicUrl);
          });
        });
      });
    });
    catena.then(function () {
      d.foto = caricate;
      return fetch('/.netlify/functions/bacheca-pubblica', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok || x.j.error) { btn.disabled = false; return messaggio(m, (x.j && x.j.error) || 'Non sono riuscito a inviare. Riprova.', 'err'); }
        $('#f-form').innerHTML = '<div class="f-ok-box"><div style="font-size:2.4rem">📧</div><h3>Manca un ultimo passo</h3>' +
          '<p>Ti abbiamo scritto a <b>' + esc(d.email) + '</b>.<br>Apri la email e clicca <b>«Pubblica la mia richiesta»</b>: la richiesta va online e le imprese possono risponderti.<br><small>Non la trovi? Guarda anche nella posta indesiderata.</small></p></div>';
      }).catch(function (e) {
        console.error('[forum] invio', e); btn.disabled = false; messaggio(m, 'Non sono riuscito a inviare. Riprova fra poco.', 'err');
      });
  }

  /* ---------- azioni sui post ---------- */
  function chiudiMenu() { document.querySelectorAll('.f-menu.aperto').forEach(function (x) { x.classList.remove('aperto'); }); }

  function azione(ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) { chiudiMenu(); return; }
    var a = el.getAttribute('data-act');

    if (a === 'apri-comp') { $('#f-comp').classList.add('aperto'); var t = $('#f-titolo'); if (t) t.focus(); return; }
    if (a === 'chiudi-comp') { $('#f-comp').classList.remove('aperto'); return; }
    if (a === 'scegli-foto') { $('#f-file').click(); return; }
    if (a === 'togli-foto') { fotoScelte.splice(parseInt(el.getAttribute('data-i'), 10), 1); disegnaAnteprime(); return; }

    if (a === 'zoom') { var lb = $('#f-lb'); lb.querySelector('img').src = el.src; lb.classList.add('on'); return; }

    if (a === 'menu') { var mn = el.closest('.f-menu'); var era = mn.classList.contains('aperto'); chiudiMenu(); if (!era) mn.classList.add('aperto'); return; }

    if (a === 'condividi') {
      var link = 'https://trovaimpresa.com/forum-richiesta?s=' + encodeURIComponent(el.getAttribute('data-slug'));
      if (navigator.share) { navigator.share({ title: 'Forum Edilizia', url: link }).catch(function () { }); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { el.textContent = '✓ Link copiato'; });
      return;
    }

    if (a === 'vota') {
      var t2 = el.getAttribute('data-t'), id = el.getAttribute('data-id'), chiave = t2 + id;
      var span = el.querySelector('span'), prima = parseInt(span.textContent, 10) || 0;
      var dopo = mieiVoti[chiave] ? prima - 1 : prima + 1;
      if (mieiVoti[chiave]) { delete mieiVoti[chiave]; el.classList.remove('on'); } else { mieiVoti[chiave] = 1; el.classList.add('on'); }
      span.textContent = Math.max(0, dopo); salvaVoti();
      sb.rpc('bacheca_vota', { p_tipo: t2, p_id: id, p_visitatore: visitatore() }).then(function (r) {
        if (r && typeof r.data === 'number') span.textContent = r.data;
      });
      return;
    }

    if (a === 'segnala') {
      var lista = el.closest('.f-menu-lista');
      sb.rpc('bacheca_segnala', { p_tipo: el.getAttribute('data-t'), p_id: el.getAttribute('data-id'), p_visitatore: visitatore(), p_motivo: el.getAttribute('data-m') }).then(function () {});
      lista.innerHTML = '<small>Grazie, segnalato. Lo controlliamo.</small>';
      return;
    }

    if (a === 'apri-risposta') { var rr = el.closest('.f-rispondi'); el.style.display = 'none'; rr.querySelector('.f-scrivi').style.display = 'block'; rr.querySelector('textarea').focus(); return; }

    if (a === 'invia-risposta') {
      var box = el.closest('.f-rispondi'), msg = box.querySelector('.f-msg');
      var testo = box.querySelector('textarea').value.trim(), prezzo = box.querySelector('input').value.trim();
      if (testo.length < 10) return messaggio(msg, 'Scrivi almeno una frase.', 'err');
      if (!io.impresa) return messaggio(msg, 'Per rispondere devi accedere come impresa.', 'err');
      el.disabled = true;
      sb.from('bacheca_risposte').insert({ richiesta_id: box.getAttribute('data-rid'), impresa_id: io.impresa.id, testo: testo, prezzo_indicativo: prezzo || null })
        .select('id').then(function (res) {
          el.disabled = false;
          if (res.error) {
            return messaggio(msg, res.error.code === '23505' ? 'Hai già risposto a questa richiesta.' : 'Non sono riuscito a pubblicare la risposta. Riprova.', 'err');
          }
          var nuovo = res.data && res.data[0] ? res.data[0] : res.data;
          if (nuovo && nuovo.id) fetch('/.netlify/functions/bacheca-avviso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ risposta_id: nuovo.id }) }).catch(function () { });
          messaggio(msg, '✓ Risposta pubblicata', 'ok');
          setTimeout(function () { rinfresca(); }, 700);
        });
      return;
    }

    if (a === 'invia-ospite') {
      var bo = el.closest('.f-rispondi'), mo = bo.querySelector('.f-msg');
      var no = bo.querySelector('.f-ospite-nome').value.trim(), to = bo.querySelector('textarea').value.trim();
      if (no.length < 2) return messaggio(mo, 'Scrivi il tuo nome.', 'err');
      if (to.length < 10) return messaggio(mo, 'Scrivi almeno una frase.', 'err');
      el.disabled = true;
      sb.rpc('bacheca_ospite_rispondi', { p_slug: bo.getAttribute('data-slug'), p_nome: no, p_testo: to, p_visitatore: visitatore(), p_trap: bo.querySelector('.f-trap').value })
        .then(function (res) {
          el.disabled = false;
          var d = res && res.data;
          if (!d || d.ok !== true) {
            var e = d && d.err, t = 'Non sono riuscito a pubblicare. Riprova.';
            if (e === 'link') t = 'Niente link, email o numeri di telefono. Per farti trovare, iscriviti gratis come impresa.';
            else if (e === 'limite') t = 'Hai scritto molte risposte: riprova fra un po\'.';
            else if (e === 'chiusa') t = 'Questa richiesta non accetta più risposte.';
            else if (e === 'corto') t = 'Scrivi almeno una frase.';
            return messaggio(mo, t, 'err');
          }
          fetch('/.netlify/functions/bacheca-avviso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ risposta_id: d.id }) }).catch(function () { });
          messaggio(mo, '✓ Risposta pubblicata', 'ok');
          setTimeout(function () { rinfresca(); }, 700);
        });
      return;
    }

    /* ----- l'autore con il suo link riservato ----- */
    if (a === 'autore-scrivi') { $('#f-autore .f-scrivi').style.display = 'block'; return; }
    if (a === 'autore-invia') {
      var bx = $('#f-autore'), tx = bx.querySelector('textarea').value.trim(), mm = bx.querySelector('.f-msg');
      if (tx.length < 2) return messaggio(mm, 'Scrivi qualcosa.', 'err');
      sb.rpc('bacheca_autore_rispondi', { p_slug: stato.slug, p_codice: stato.g, p_testo: tx, p_nome: '' }).then(function (r) {
        if (r.data === true) { messaggio(mm, '✓ Pubblicato', 'ok'); setTimeout(rinfresca, 600); } else messaggio(mm, 'Non sono riuscito a pubblicare. Riprova.', 'err');
      });
      return;
    }
    if (a === 'autore-chiudi') {
      var chiudi = el.getAttribute('data-chiudi') === '1', m3 = $('#f-autore .f-msg');
      sb.rpc('bacheca_autore_chiudi', { p_slug: stato.slug, p_codice: stato.g, p_chiudi: chiudi }).then(function (r) {
        if (r.data === true) rinfresca(); else messaggio(m3, 'Non sono riuscito. Riprova.', 'err');
      });
      return;
    }
  }

  function rinfresca() {
    if (stato.singolo) { caricaSingola(); } else { caricaElenco(false); }
  }

  /* ---------- partenza ---------- */
  function avvia() {
    var p = new URLSearchParams(location.search);
    stato.slug = p.get('s') || ''; stato.g = p.get('g') || '';
    stato.singolo = !!$('#f-singola');

    document.addEventListener('click', azione);
    var lb = $('#f-lb'); if (lb) lb.addEventListener('click', function () { lb.classList.remove('on'); });

    var comp = $('#f-comp');
    if (comp) {
      comp.innerHTML = htmlComposer();
      $('#f-form').addEventListener('submit', inviaRichiesta);
      $('#f-file').addEventListener('change', function (e) {
        Array.prototype.forEach.call(e.target.files, function (f) { if (fotoScelte.length < 3 && /^image\//.test(f.type)) fotoScelte.push(f); });
        e.target.value = ''; disegnaAnteprime();
      });
      if (location.hash === '#scrivi') comp.classList.add('aperto');
      /* i bottoni «Scrivi la tua richiesta» in cima alla pagina aprono la casella */
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href="#scrivi"]'); if (!a) return;
        e.preventDefault(); comp.classList.add('aperto');
        comp.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var t = $('#f-titolo'); if (t) setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (x) { t.focus(); } }, 400);
      });
    }

    /* ricerca e mestiere arrivano dall'indirizzo: /forum?q=bagno  /forum?m=Idraulico */
    var qs = new URLSearchParams(location.search);
    var mm = qs.get('m'); if (mm && MESTIERI.indexOf(mm) > -1) stato.mestiere = mm;
    stato.q = pulisciRicerca(qs.get('q'));
    var campoQ = document.querySelector('.fs-cerca input'); if (campoQ && stato.q) campoQ.value = stato.q;
    if ($('#f-ordina')) document.querySelectorAll('.fs-sub a').forEach(function (a) {
      a.classList.toggle('on', (a.getAttribute('data-m') || '') === stato.mestiere);
    });

    var ord = $('#f-ordina');
    if (ord) {
      var sel = $('#f-filtro-mestiere');
      sel.innerHTML = '<option value="">Tutti i mestieri</option>' + MESTIERI.map(function (m) { return '<option>' + m + '</option>'; }).join('');
      sel.value = stato.mestiere;
      ord.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-ord]'); if (!b) return;
        ord.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
        stato.ordine = b.getAttribute('data-ord'); caricaElenco(false);
      });
      sel.addEventListener('change', function () { stato.mestiere = sel.value; caricaElenco(false); });
      var altro = $('#f-carica'); if (altro) altro.addEventListener('click', function () { caricaElenco(true); });
    }

    carica_io().then(function () { return stato.singolo ? caricaSingola() : caricaElenco(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia); else avvia();
})();
