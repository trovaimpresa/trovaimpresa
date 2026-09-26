/* 26 set 2026 — IL CATALOGO DELLE PRESTAZIONI DEI PROFESSIONISTI, IN UN POSTO SOLO.
   Prima c'erano →4← gruppi (Geometra, Ingegnere, Perito industriale, Perito
   estimatore) copiati in tre file. Un architetto, un interior designer o un
   termotecnico non trovava niente di suo. Adesso:
   - GRUPPI: le prestazioni divise per argomento (nessuna ripetuta);
   - PER_MESTIERE: quali gruppi proporre prima a ogni professione, con gli
     stessi codici della registrazione (architetto, geometra, ...).
   Lo usano modifica-profilo.html (i suggerimenti sotto «Cosa sai fare») e
   profilo-impresa.html (la tendina «Prestazione richiesta» dell'incarico).
   ⚠️ La ricerca (cerca-professionisti.html, SPEC_PAROLE) cerca per PAROLE
   dentro questi testi: chi cambia una frase qui controlli che la sua
   specializzazione la trovi ancora. */
(function (w) {
  var GRUPPI = {
    'Pratiche edilizie e catasto': [
      'Pratiche edilizie (CILA, SCIA, permesso di costruire)',
      'Sanatorie e condoni edilizi',
      'Certificato di agibilità',
      'Relazione tecnica di conformità urbanistica',
      'Pratiche per bonus edilizi (Ecobonus, Sismabonus, Bonus casa)',
      'Accatastamento e pratiche catastali (DOCFA)',
      'Visure e volture catastali',
      'Successioni immobiliari'
    ],
    'Progettazione': [
      'Progettazione architettonica (nuove costruzioni e ristrutturazioni)',
      'Progettazione strutturale (c.a., acciaio, legno)',
      'Calcolo strutturale e relazioni di calcolo',
      'Progettazione BIM',
      'Rendering e modellazione 3D',
      'Progettazione del verde e dei giardini'
    ],
    'Interni e arredo': [
      'Progetto di interni',
      'Scelta di materiali e finiture',
      'Progetto illuminotecnico',
      'Arredo su misura',
      'Fornitura e montaggio arredi',
      'Home staging per vendita o affitto'
    ],
    'Rilievi e topografia': [
      'Rilievi topografici',
      'Frazionamenti e tipo mappale (PREGEO)',
      'Rilievo architettonico',
      'Rilievo con drone o laser scanner',
      'Tracciamenti in cantiere'
    ],
    'Direzione lavori e cantiere': [
      'Direzione lavori',
      'Direzione lavori strutturali',
      'Direzione lavori impiantistici',
      'Computo metrico estimativo',
      'Contabilità di cantiere (SAL)',
      'Coordinamento sicurezza (CSP/CSE)',
      'Piani di sicurezza (PSC e POS)',
      'Gestione e coordinamento della commessa'
    ],
    'Strutture e antisismica': [
      'Collaudo statico',
      'Pratiche sismiche e deposito al Genio Civile',
      'Classificazione sismica e Sismabonus',
      'Verifica di vulnerabilità sismica'
    ],
    'Impianti ed energia': [
      'Progettazione impianti (elettrico, termico, idraulico)',
      'Progettazione impianti elettrici',
      'Progettazione impianti termici e climatizzazione',
      'Progettazione impianto fotovoltaico',
      'Dichiarazione di conformità impianti (DM 37/2008)',
      'Collaudo e certificazione impianti',
      'APE - Attestato di Prestazione Energetica',
      'Relazione energetica (Legge 10)',
      'Diagnosi energetica',
      'Consulenza efficientamento energetico'
    ],
    'Antincendio e acustica': [
      'Pratiche antincendio (SCIA VVF)',
      'Certificato prevenzione incendi (CPI)',
      'Valutazione di impatto acustico',
      'Requisiti acustici passivi degli edifici'
    ],
    'Geologia': [
      'Relazione geologica',
      'Indagini geotecniche',
      'Studio di rischio idrogeologico'
    ],
    'Perizie e stime': [
      'Perizie e stime immobiliari',
      'Perizie di stima per mutuo',
      'Perizie giurate / asseverate',
      'Consulenza tecnica (CTU e CTP)',
      'Stime per successioni e divisioni',
      'Perizie danni e assicurative'
    ],
    'Restauro': [
      'Restauro conservativo',
      'Pratiche per beni vincolati (Soprintendenza)',
      'Consolidamento e recupero di edifici storici'
    ],
    'Condominio': [
      'Amministrazione condominiale',
      'Gestione dei lavori straordinari in condominio',
      'Pratiche per i bonus condominiali'
    ]
  };

  var PER_MESTIERE = {
    architetto: ['Progettazione', 'Pratiche edilizie e catasto', 'Interni e arredo', 'Direzione lavori e cantiere', 'Restauro'],
    ingegnere_civile: ['Progettazione', 'Strutture e antisismica', 'Direzione lavori e cantiere', 'Pratiche edilizie e catasto'],
    ingegnere_strutturale: ['Strutture e antisismica', 'Progettazione', 'Direzione lavori e cantiere'],
    ingegnere_impiantistico: ['Impianti ed energia', 'Antincendio e acustica', 'Direzione lavori e cantiere'],
    geometra: ['Pratiche edilizie e catasto', 'Rilievi e topografia', 'Direzione lavori e cantiere', 'Perizie e stime'],
    perito_industriale: ['Impianti ed energia', 'Antincendio e acustica', 'Perizie e stime'],
    topografo: ['Rilievi e topografia', 'Pratiche edilizie e catasto'],
    geologo: ['Geologia', 'Strutture e antisismica'],
    interior_designer: ['Interni e arredo', 'Progettazione'],
    arredatore: ['Interni e arredo'],
    home_stager: ['Interni e arredo'],
    progettista_3d: ['Progettazione', 'Interni e arredo'],
    progettista_verde: ['Progettazione'],
    consulente_energetico: ['Impianti ed energia', 'Pratiche edilizie e catasto'],
    termotecnico: ['Impianti ed energia'],
    consulente_sicurezza: ['Direzione lavori e cantiere'],
    tecnico_acustico: ['Antincendio e acustica'],
    tecnico_antincendio: ['Antincendio e acustica'],
    restauratore: ['Restauro'],
    consulente_pratiche: ['Pratiche edilizie e catasto'],
    direttore_lavori: ['Direzione lavori e cantiere'],
    collaudatore_strutture: ['Strutture e antisismica', 'Direzione lavori e cantiere'],
    project_manager: ['Direzione lavori e cantiere'],
    amministratore_condominio: ['Condominio']
  };

  /* i gruppi da proporre a chi fa questi mestieri: prima i suoi, senza doppioni */
  function gruppiPer(mestieri) {
    var out = [];
    [].concat(mestieri || []).forEach(function (m) {
      (PER_MESTIERE[String(m || '').trim()] || []).forEach(function (g) { if (out.indexOf(g) < 0) out.push(g); });
    });
    return out;
  }

  w.TI_PRESTAZIONI = { gruppi: GRUPPI, perMestiere: PER_MESTIERE, gruppiPer: gruppiPer };

  /* ---------------------------------------------------------------
     SUGGERIMENTI in modifica-profilo.html, sotto «Cosa sai fare».
     La casella resta quella di prima (una prestazione per riga): i
     tasti aggiungono o tolgono una riga, niente di piu'. Si vedono
     solo ai professionisti. */
  function montaSuggerimenti() {
    var ta = document.getElementById('f-prestazioni');
    var selM = document.getElementById('f-mestiere-professionista');
    if (!ta || !selM) return;
    /* «Cosa sai fare» subito sotto la professione: chi cambia professione
       vede cambiare i suggerimenti li' sotto, senza scorrere mezza pagina.
       Si sposta il riquadro intero (titolo e casella): il salvataggio lo
       trova per id, quindi non cambia niente. Solo per i professionisti. */
    var card = document.getElementById('card-prestazioni');
    var primo = document.querySelector('#sec-professionista > .form-card');
    if (card && primo && !card.getAttribute('data-spostata')) { primo.parentNode.insertBefore(card, primo.nextSibling); card.setAttribute('data-spostata', '1'); }
    var box = document.getElementById('prest-suggerimenti');
    if (!box) {
      box = document.createElement('div');
      box.id = 'prest-suggerimenti';
      box.className = 'prest-sugg';
      ta.parentNode.appendChild(box);   // sotto la casella e la sua spiegazione
      var st = document.createElement('style');
      st.textContent =
        '.prest-sugg{margin:18px 0 4px;padding-top:16px;border-top:1px solid #e3ebf6}' +
        '.prest-sugg .ps-tit{font-size:15.5px;font-weight:700;color:#0a2a4d;margin:0 0 8px}' +
        '.prest-sugg .ps-gr{font-size:14px;font-weight:700;color:#475569;margin:12px 0 6px}' +
        '.prest-sugg .ps-chips{display:flex;flex-wrap:wrap;gap:8px}' +
        '.prest-sugg .ps-chip{font:inherit;font-size:15px;background:#fff;border:1.5px solid #d6e4ff;color:#0a2a4d;border-radius:999px;padding:8px 14px;cursor:pointer;text-align:left;line-height:1.3}' +
        '.prest-sugg .ps-chip:hover{border-color:#8fb5ff;background:#f5f9ff}' +
        '.prest-sugg .ps-chip.on{background:#eefaf2;border-color:#a9dcb9;color:#146c31;font-weight:700}' +
        '.prest-sugg .ps-chip.on::before{content:"\\2713  "}' +
        '.prest-sugg .ps-tend{border:1.5px solid #e3ebf6;border-radius:14px;background:#fff;margin:0 0 8px}' +
        '.prest-sugg .ps-tend[open]{border-color:#bcd3f7}' +
        '.prest-sugg .ps-tend summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:13px 16px;font-size:16px;font-weight:700;color:#0a2a4d}' +
        '.prest-sugg .ps-tend summary::-webkit-details-marker{display:none}' +
        '.prest-sugg .ps-tend summary::after{content:"";margin-left:auto;width:9px;height:9px;border-right:2.5px solid #0066ff;border-bottom:2.5px solid #0066ff;transform:rotate(45deg);transition:transform .15s}' +
        '.prest-sugg .ps-tend[open] summary::after{transform:rotate(-135deg)}' +
        '.prest-sugg .ps-tend summary em{font-style:normal;font-size:13.5px;font-weight:700;color:#146c31;background:#eefaf2;border:1px solid #a9dcb9;border-radius:999px;padding:2px 9px}' +
        '.prest-sugg .ps-tend .ps-chips{padding:2px 16px 16px}' +
        '.prest-sugg .ps-altre{font-size:14.5px;font-weight:700;color:#475569;margin:16px 0 8px}';
      document.head.appendChild(st);
    }
    function righe() { return (ta.value || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
    function chipHtml(p, sc) {
      var on = sc.some(function (r) { return r.toLowerCase() === p.toLowerCase(); });
      return '<button type="button" class="ps-chip' + (on ? ' on' : '') + '" data-p="' + p.replace(/"/g, '&quot;') + '">' + p + '</button>';
    }
    /* ogni gruppo e' una tendina chiusa: si apre toccandola. Sul titolo
       c'e' quante ne hai gia' scelte, cosi' non serve aprirle per saperlo. */
    function gruppoHtml(g, sc) {
      var n = GRUPPI[g].filter(function (p) { return sc.some(function (r) { return r.toLowerCase() === p.toLowerCase(); }); }).length;
      var aperta = aperte.indexOf(g) >= 0 ? ' open' : '';
      return '<details class="ps-tend" data-g="' + g + '"' + aperta + '><summary><span>' + g + '</span>' +
        (n ? '<em>' + n + (n === 1 ? ' scelta' : ' scelte') + '</em>' : '') + '</summary>' +
        '<div class="ps-chips">' + GRUPPI[g].map(function (p) { return chipHtml(p, sc); }).join('') + '</div></details>';
    }
    var aperte = [];   // le tendine aperte restano aperte quando si ridisegna
    function disegna() {
      aperte = [].map.call(box.querySelectorAll('details.ps-tend[open]'), function (d) { return d.getAttribute('data-g'); });
      var sel2 = document.getElementById('f-mestiere2-professionista');
      var miei = gruppiPer([selM.value, sel2 && sel2.value]);
      var altri = Object.keys(GRUPPI).filter(function (g) { return miei.indexOf(g) < 0; });
      var sc = righe();
      box.innerHTML = '<div class="ps-tit">Tocca per aggiungere le prestazioni che fai</div>' +
        miei.map(function (g) { return gruppoHtml(g, sc); }).join('') +
        (altri.length ? '<div class="ps-altre">' + (miei.length ? 'Altre prestazioni' : 'Tutte le prestazioni') + '</div>' +
          altri.map(function (g) { return gruppoHtml(g, sc); }).join('') : '');
    }
    box.onclick = function (e) {
      var b = e.target.closest && e.target.closest('.ps-chip'); if (!b) return;
      // la casella e' chiusa: prima si apre col suo «Modifica», come a mano
      if (ta.readOnly) {
        var card = ta.closest('.form-card');
        var mod = card && card.querySelector('.btn-modifica');
        if (mod) mod.click();
        if (ta.readOnly) return;
      }
      var p = b.getAttribute('data-p'), sc = righe();
      var i = -1; sc.forEach(function (r, k) { if (r.toLowerCase() === p.toLowerCase()) i = k; });
      if (i >= 0) sc.splice(i, 1); else sc.push(p);
      ta.value = sc.join('\n');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      disegna();
    };
    selM.addEventListener('change', disegna);
    var s2 = document.getElementById('f-mestiere2-professionista'); if (s2) s2.addEventListener('change', disegna);
    ta.addEventListener('input', function () { clearTimeout(ta._psT); ta._psT = setTimeout(disegna, 400); });
    disegna();
  }

  /* modifica-profilo riempie i campi quando arrivano i dati: si riprova
     finche' non si sa se e' un professionista (la card delle professioni
     si vede) e la casella e' stata riempita. */
  function quandoPronto() {
    if (!document.getElementById('f-prestazioni')) return;
    var tentativi = 0;
    (function prova() {
      var selM = document.getElementById('f-mestiere-professionista');
      var visibile = selM && selM.offsetParent !== null;
      if (visibile && (selM.value || tentativi > 20)) { montaSuggerimenti(); return; }
      if (++tentativi < 60) setTimeout(prova, 250);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', quandoPronto); else quandoPronto();
})(window);
