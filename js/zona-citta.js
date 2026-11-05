/* 5 nov 2026 — LA RICERCA GUARDA ANCHE LA PROVINCIA E I KM VERI.
   Prima le 3 pagine di ricerca (imprese, artigiani, professionisti)
   chiedevano al database solo chi aveva scritto quella citta' nel nome:
   cercando «Bari» un'impresa di Noci (provincia di Bari, 45 km) non usciva
   MAI, nemmeno spostando la barra dei km, perche' i km si applicavano dopo,
   solo a chi aveva gia' passato il filtro del nome. Erano 61 imprese su 169.

   Adesso:
   - barra a 0 («Solo la citta'»): la citta' cercata E i paesi della sua
     provincia, prima quelli della citta';
   - barra a N km: la citta', la sua provincia E tutti quelli entro N km,
     di qualunque provincia (allargando, i risultati non calano mai);
   - barra a 100 («Qualsiasi»): un raggio largo, i piu' vicini prima.
   Le tre pagine usano queste stesse funzioni: la regola sta in un posto solo. */
(function () {
  function pulisci(c) { return String(c || '').replace(/[,()"*]/g, '').trim(); }

  /* Il filtro che va al database. q e' la query di Supabase. */
  function filtroDb(q, citta, lat, lng, km) {
    var c = pulisci(citta);
    if (!c) return q;
    km = parseInt(km, 10) || 0;
    if (km > 0 && lat !== null && lng !== null && isFinite(lat) && isFinite(lng)) {
      var r = km >= 100 ? 300 : km;
      var dLat = r / 111;
      var dLng = r / (111 * Math.max(0.2, Math.cos(lat * Math.PI / 180)));
      /* la citta' e la sua provincia restano SEMPRE dentro: allargando i
         km i risultati devono aumentare, mai diminuire */
      return q.or('citta.ilike."*' + c + '*",provincia.ilike."' + c + '",and(lat.gte.' + (lat - dLat) +
        ',lat.lte.' + (lat + dLat) + ',lng.gte.' + (lng - dLng) + ',lng.lte.' + (lng + dLng) + ')');
    }
    return q.or('citta.ilike."*' + c + '*",provincia.ilike."' + c + '"');
  }

  /* Sta nella citta' cercata (o nella sua provincia)? */
  function inCitta(i, citta) {
    var c = pulisci(citta).toLowerCase();
    return !!c && String(i.citta || '').trim().toLowerCase().indexOf(c) !== -1;
  }
  function inProvincia(i, citta) {
    var c = pulisci(citta).toLowerCase();
    return !!c && String(i.provincia || '').trim().toLowerCase() === c;
  }

  /* Prima chi sta nella citta', poi gli altri dal piu' vicino.
     Dentro la citta' resta l'ordine scelto dalla pagina. */
  function ordina(lista, citta) {
    return (lista || []).map(function (x, n) { return { x: x, n: n }; })
      .sort(function (a, b) {
        var ca = inCitta(a.x, citta) ? 0 : 1, cb = inCitta(b.x, citta) ? 0 : 1;
        if (ca !== cb) return ca - cb;
        if (ca === 1) {
          var da = a.x._distKm, db = b.x._distKm;
          if (da !== null && db !== null && da !== db) return da - db;
          if (da === null && db !== null) return 1;
          if (db === null && da !== null) return -1;
        }
        return a.n - b.n;
      }).map(function (o) { return o.x; });
  }

  window.ZonaCitta = { filtroDb: filtroDb, inCitta: inCitta, inProvincia: inProvincia, ordina: ordina };
})();
