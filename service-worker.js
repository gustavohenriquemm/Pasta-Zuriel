const CACHE_NAME = 'igreja-zuriel-v46';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/script.js',
  '/styles/app.css',
  '/src/app.js',
  '/src/components/Layout.js',
  '/src/components/icons.js',
  '/src/components/EventDetailsModal.js',
  '/src/pages/HomePage.js',
  '/src/pages/BiblePage.js',
  '/src/pages/HymnalPage.js',
  '/src/pages/CalendarPage.js',
  '/src/pages/SundaySchoolPage.js',
  '/src/data/sundaySchoolLessons.js',
  '/src/services/calendarService.js',
  '/src/services/bibleService.js',
  '/src/services/hymnService.js',
  '/src/services/notificationService.js',
  '/src/utils/cache.js',
  '/src/utils/pwa.js',
  '/src/hooks/useTheme.js',
  '/authentication/firebase.js',
  '/database/firestore.js',
  '/admin/AdminPage.js',
  '/config/firebase-config.js',
  '/data/hymns/mocidade.seed.json',
  '/img/i1.png',
  '/img/i2.png',
  '/img/logo.png',
  '/img/bannerzuriel.png',
  '/img/mocidade.jpg',
  '/img/harpa.jpg',
  '/img/biblia.jpg',
  '/img/calendario.jpg',
  '/img/mocidade.png',
  '/img/harpa.png',
  '/img/biblia.png',
  '/img/calendario.png',
  '/img/Escolinhadominical.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        if (response.ok && new URL(event.request.url).origin === location.origin) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});

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
    })
  );
});
