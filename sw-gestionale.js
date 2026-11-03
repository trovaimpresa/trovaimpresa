/* =====================================================================
   3 novembre 2026 — le notifiche del gestionale (la domanda della sera)
   Fa SOLO due cose: mostra la notifica e, al tocco, apre il gestionale.
   ⛔ Niente cache, niente «fetch»: il sito resta servito come sempre.
   ===================================================================== */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { testo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titolo || 'TrovaImpresa', {
    body: d.testo || '', icon: '/img/app/gestionale-192.png', badge: '/img/app/gestionale-192.png',
    tag: 'sera', renotify: true, data: { url: d.url || '/gestionale-app.html' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/gestionale-app.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) { if (l[i].url.indexOf('/gestionale-app.html') >= 0 && 'navigate' in l[i]) return l[i].navigate(url).then(function (c) { return c && c.focus(); }); }
    return self.clients.openWindow(url);
  }));
});
