// Service Worker for 考公工作台 PWA
//
// ⚠️ 发版清单（每次修改 css/style.css 或 js/app.js 后必须执行）：
//   1. 将下方 CACHE_VERSION 递增（如 v32 改为 v33），让旧缓存失效
//   2. 若新增了需要离线可用的静态资源（如新图片），加入 PRECACHE_ASSETS
//   3. 部署后浏览器会自动安装新版本并提示「已更新到最新版本，刷新页面生效」
const CACHE_VERSION = 'v39';
const CACHE_NAME = 'kaogong-' + CACHE_VERSION;

// Core assets to precache
const PRECACHE_ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/app.js',
  'icon-192.png',
  'icon-512.png'
];

// Install: precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Notification click: focus the existing workbench tab, or open it
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var client = list[i];
        if (client.url && client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          // Forward action to the page so it can pause/resume
          if (event.action === 'pause') {
            client.postMessage({ type: 'timer-action', action: 'toggle' });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// Fetch: stale-while-revalidate for same-origin, network-first for cross-origin
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // For same-origin requests: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }
  
  // For cross-origin: network-first, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
