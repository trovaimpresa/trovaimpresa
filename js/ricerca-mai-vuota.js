/* ricerca-mai-vuota.js — 18 ottobre 2026
   Il guasto misurato: su 55 ricerche dei clienti in 30 giorni, 41 sono finite
   con «Nessun risultato». Tre cause, provate dal vivo:
   1) una REGIONE scritta nella casella della citta' («Veneto») veniva cercata
      come se fosse il nome di un comune → zero, anche con 3 imprese in Veneto;
   2) un CAP («06022») idem → zero, anche se la casella dice «Citta' o CAP»;
   3) un paese piccolo senza iscritti → zero, e il database restituiva solo chi
      ha quella parola nella citta', quindi anche «Allarga a 30 km» non trovava
      niente: il raggio non veniva mai cercato davvero.
   Qui:
   - ZonaRicerca.prepara()  sistema la casella PRIMA della ricerca (regione → tendina,
                            CAP → nome del comune, «RM - ROMA» → «ROMA»);
   - ZonaRicerca.vicine()   se la citta' e' vuota, cerca nel raggio con un riquadro
                            di coordinate (funziona anche con migliaia di iscritti);
   - ZonaRicerca.testata()  la riga che spiega «a X non c'e' nessuno, ecco i piu' vicini».
   Lo usano cerca-imprese, cerca-artigiani e cerca-professionisti. */
(function () {
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[’'`]/g, "'").replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var ALIAS = {
    'trentino': 'Trentino-Alto Adige', 'alto adige': 'Trentino-Alto Adige', 'sudtirol': 'Trentino-Alto Adige',
    'friuli': 'Friuli-Venezia Giulia', 'emilia': 'Emilia-Romagna', 'romagna': 'Emilia-Romagna',
    'val d\'aosta': "Valle d'Aosta", 'valle aosta': "Valle d'Aosta", 'vda': "Valle d'Aosta"
  };
  function regioneDaNome(t) {
    var n = norm(t).replace(/^regione /, '');
    if (!n) return '';
    var regs = Object.keys(window.GEO_ITALIA || {});
    for (var i = 0; i < regs.length; i++) if (norm(regs[i]) === n) return regs[i];
    return ALIAS[n] || '';
  }

  async function daCap(cap) {
    try {
      var r = await fetch('https://nominatim.openstreetmap.org/search?postalcode=' + encodeURIComponent(cap) +
        '&country=Italia&format=json&addressdetails=1&limit=1', { headers: { 'Accept-Language': 'it' } });
      var d = await r.json();
      if (!d || !d[0]) return null;
      var a = d[0].address || {};
      var nome = a.city || a.town || a.village || a.municipality || a.hamlet || '';
      return nome ? { nome: nome, lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) } : null;
    } catch (e) { return null; }
  }

  var ultimo = null; // cosa ha cambiato prepara(), per la testata

  async function prepara() {
    ultimo = null;
    var inp = document.getElementById('cittaInput');
    var sel = document.getElementById('regioneSelect');
    if (!inp) return null;
    var t = inp.value.trim();
    if (!t) return null;

    // «RM - ROMA», «Roma (RM)», «Roma, Lazio» → «Roma»
    var m = t.match(/^[A-Za-z]{2}\s*-\s*(.+)$/);
    if (m) t = m[1].trim();
    t = t.replace(/\s*\([A-Za-z]{2}\)\s*$/, '').replace(/,.*$/, '').trim();
    if (t !== inp.value.trim()) inp.value = t;

    if (/^\d{5}$/.test(t)) {
      var c = await daCap(t);
      if (c) { inp.value = c.nome; ultimo = { cap: t, nome: c.nome }; }
      return ultimo;
    }

    var reg = regioneDaNome(t);
    if (reg && sel) {
      sel.value = reg;
      inp.value = '';
      ultimo = { regione: reg };
    }
    return ultimo;
  }

  /* costruisci() deve restituire la query della pagina SENZA filtri di luogo
     (tipo, mestiere, stelle, verificati...). Qui si aggiunge il riquadro. */
  async function vicine(costruisci, lat, lng, km) {
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return [];
    km = km || 100;
    var dLat = km / 111, dLng = km / (111 * Math.cos(lat * Math.PI / 180));
    var q = costruisci()
      .gte('lat', lat - dLat).lte('lat', lat + dLat)
      .gte('lng', lng - dLng).lte('lng', lng + dLng);
    var r = await q.limit(300);
    if (r.error) throw r.error;
    var R = 6371, rad = Math.PI / 180;
    return (r.data || []).map(function (i) {
      var a = Math.sin((i.lat - lat) * rad / 2) ** 2 +
        Math.cos(lat * rad) * Math.cos(i.lat * rad) * Math.sin((i.lng - lng) * rad / 2) ** 2;
      i._distKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      i._fuoriZona = false;
      return i;
    }).filter(function (i) { return i._distKm <= km; })
      .sort(function (a, b) { return a._distKm - b._distKm; })
      .slice(0, 24);
  }

  /* chi = "un'impresa" | "un artigiano" | "un professionista" */
  function testata(dove, chi, n) {
    var iscr = chi === "un'impresa" ? 'iscritta' : 'iscritto';
    var plur = chi === "un'impresa" ? 'le imprese più vicine' : (chi === 'un professionista' ? 'i professionisti più vicini' : 'gli artigiani più vicini');
    return '<div class="zona-allargata" style="background:#eaf1ff;border:1.5px solid #b9d0ff;border-radius:14px;' +
      'padding:16px 20px;margin:0 0 18px;font-size:17px;line-height:1.45;color:#0b2a5b">' +
      '<strong style="font-size:19px">A ' + esc(dove) + ' non c&rsquo;&egrave; ancora ' + chi.replace("'", '&rsquo;') + ' ' + iscr + '.</strong><br>' +
      'Ecco ' + plur + ' (' + n + '), dalla pi&ugrave; vicina.</div>';
  }

  function regioneScritta() { return ultimo && ultimo.regione ? ultimo.regione : ''; }

  window.ZonaRicerca = { prepara: prepara, vicine: vicine, testata: testata, regioneDaNome: regioneDaNome, regioneScritta: regioneScritta };
})();
