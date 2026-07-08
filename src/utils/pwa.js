export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  if (isLocalhost) {
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    window.caches?.keys?.().then((names) => {
      names.forEach((name) => window.caches.delete(name));
    });
    return;
  }

  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
