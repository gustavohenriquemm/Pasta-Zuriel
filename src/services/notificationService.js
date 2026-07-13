import { firebaseVapidKey } from '../../config/firebase-config.js?v=20260713-19';
import { getFirebaseMessaging } from '../../authentication/firebase.js?v=20260713-19';
import { registerNotificationToken } from './pushApiService.js?v=20260713-19';

const NOTIFICATIONS_ENABLED_KEY = 'zuriel:browser-notifications-enabled';
const LAST_SEEN_KEY = 'zuriel:notifications-last-seen';
const TOKEN_KEY = 'zuriel:notification-token';

export function getNotificationStatus() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    return {
      state: 'unsupported',
      message: isAppleMobile
        ? 'No iPhone, adicione o Zuriel à Tela de Início e abra pelo ícone para ativar as notificações.'
        : 'Este aparelho não oferece notificações pelo navegador.',
    };
  }
  if (Notification.permission === 'granted') {
    return { state: 'enabled', message: 'Notificações ativadas, inclusive quando o aplicativo estiver fechado.' };
  }
  if (Notification.permission === 'denied') {
    return { state: 'blocked', message: 'As notificações estão bloqueadas nas configurações do navegador.' };
  }
  return { state: 'available', message: 'Ative para receber avisos mesmo quando o aplicativo estiver fechado.' };
}

export async function enableNotifications() {
  const status = getNotificationStatus();
  if (status.state === 'unsupported') throw new Error(status.message);
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permissão para notificações não concedida.');
  await registerPushDevice();
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
  return { state: 'enabled', message: 'Notificações ativadas, inclusive quando o aplicativo estiver fechado.' };
}

export function initializeNotifications() {
  if ('Notification' in window && Notification.permission === 'granted') {
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
    registerPushDevice().catch(() => {});
  }
}

async function registerPushDevice() {
  const firebase = await getFirebaseMessaging();
  if (!firebase) throw new Error('Este aparelho não é compatível com notificações em segundo plano.');
  const registration = await navigator.serviceWorker.ready;
  const token = await firebase.messagingModule.getToken(firebase.messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error('Não foi possível registrar este aparelho para receber notificações.');
  await registerNotificationToken(token);
  localStorage.setItem(TOKEN_KEY, token);
  return token;
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
