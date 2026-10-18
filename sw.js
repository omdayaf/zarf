var CACHE = 'zarf-v1';
var FILES = ['./', 'index.html', 'manifest.webmanifest'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    return r;
  }).catch(function () { return caches.match(e.request); }));
});

self.addEventListener('push', function (e) {
  e.waitUntil((async function () {
    var title = 'ظرف', body = 'سجّل مصروفك اليوم.';
    try {
      var c = await caches.open('zarf-cfg');
      var r = await c.match('https://zarf.local/cfg');
      if (r) {
        var cfg = await r.json();
        var m = await fetch(cfg.push.replace(/\/$/, '') + '/msg?t=' + encodeURIComponent(cfg.token));
        var j = await m.json();
        title = j.title || title; body = j.body || body;
      }
    } catch (err) {}
    await self.registration.showNotification(title, { body: body, dir: 'rtl', lang: 'ar' });
  })());
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
