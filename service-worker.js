const CACHE_PREFIX = 'igreja-zuriel-';
const CACHE_NAME = `${CACHE_PREFIX}v50`;
const APP_SHELL = [
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/styles/app.css?v=20260713-14',
  '/js/script.js?v=20260713-19',
  '/img/logo-192.png',
];

try {
  importScripts(
    'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js',
  );
  firebase.initializeApp({
    apiKey: 'AIzaSyCJO_ZzzPby5_JAj8TZw2bq2DbsSk-u3rc',
    authDomain: 'igreja-zuriel.firebaseapp.com',
    projectId: 'igreja-zuriel',
    storageBucket: 'igreja-zuriel.firebasestorage.app',
    messagingSenderId: '581869791754',
    appId: '1:581869791754:web:ae29a789efc8f8143f0df3',
  });
  firebase.messaging().onBackgroundMessage((payload) => {
    const data = payload.data || {};
    return self.registration.showNotification(data.title || 'Igreja Zuriel', {
      body: data.body || 'Há uma nova atualização.',
      icon: '/img/logo-192.png',
      badge: '/img/logo-192.png',
      data: { link: data.link || '/#home' },
      tag: data.id || data.type || 'zuriel-update',
    });
  });
} catch (error) {
  // O restante do aplicativo continua disponível mesmo se o serviço push falhar.
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const oldCaches = names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME);
    await Promise.all(oldCaches.map((name) => caches.delete(name)));
    await self.clients.claim();
    if (oldCaches.length) {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(windows.map((client) => client.navigate(client.url)));
    }
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/index.html'));
    return;
  }

  if (['script', 'style', 'worker', 'document'].includes(event.request.destination)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function networkFirst(request, fallbackPath = '') {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request))
      || (fallbackPath ? await caches.match(fallbackPath) : undefined)
      || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.link || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
