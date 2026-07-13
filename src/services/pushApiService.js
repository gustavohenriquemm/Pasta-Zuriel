import { getFirebase } from '../../authentication/firebase.js?v=20260713-19';

const API_PATH = '/api/notifications';

export async function registerNotificationToken(token) {
  return requestNotificationApi({ action: 'register', token });
}

export async function unregisterNotificationToken(token) {
  if (!token) return { enabled: false };
  return requestNotificationApi({ action: 'unregister', token });
}

export async function sendPushNotification(notification) {
  const firebase = await getFirebase();
  const user = firebase?.auth?.currentUser;
  if (!user) throw new Error('Entre novamente no painel para enviar a notificação.');
  const idToken = await user.getIdToken();
  return requestNotificationApi({ action: 'send', notification }, idToken);
}

async function requestNotificationApi(body, idToken = '') {
  const response = await fetch(API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Não foi possível configurar as notificações.');
  }
  return result;
}
