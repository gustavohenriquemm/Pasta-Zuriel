const NOTIFICATIONS_ENABLED_KEY = 'zuriel:browser-notifications-enabled';
const LAST_SEEN_KEY = 'zuriel:notifications-last-seen';

export function getNotificationStatus() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { state: 'unsupported', message: 'Este aparelho não oferece notificações pelo navegador.' };
  }
  if (Notification.permission === 'granted') {
    return { state: 'enabled', message: 'Avisos imediatos ativados enquanto o site estiver aberto.' };
  }
  if (Notification.permission === 'denied') {
    return { state: 'blocked', message: 'As notificações estão bloqueadas nas configurações do navegador.' };
  }
  return { state: 'available', message: 'Ative para receber avisos imediatos enquanto o site estiver aberto.' };
}

export async function enableNotifications() {
  const status = getNotificationStatus();
  if (status.state === 'unsupported') throw new Error(status.message);
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permissão para notificações não concedida.');
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
  return { state: 'enabled', message: 'Avisos imediatos ativados enquanto o site estiver aberto.' };
}

export function initializeNotifications() {
  if ('Notification' in window && Notification.permission === 'granted') {
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
  }
}

export function getNotificationsLastSeen() {
  return Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
}

export function markNotificationsRead(timestamp = Date.now()) {
  localStorage.setItem(LAST_SEEN_KEY, String(timestamp));
}

export async function showSiteNotification(notification) {
  const title = notification.title || 'Igreja Zuriel';
  const body = notification.body || 'Há uma nova atualização.';
  if (Notification.permission !== 'granted' || localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'true') return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/img/logo-192.png',
      badge: '/img/logo-192.png',
      data: { link: notification.link || '/#home' },
      tag: notification.id || notification.type || 'zuriel-update',
    });
  } catch {
    // Falhas do navegador não interrompem o restante do site.
  }
}
