const crypto = require('node:crypto');

let cert;
let getApps;
let initializeApp;
let getAuth;
let FieldValue;
let getFirestore;
let getMessaging;

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    ensureFirebaseAdmin();
    const body = parseBody(request.body);
    if (body.action === 'register') return registerToken(request, response, body.token);
    if (body.action === 'unregister') return unregisterToken(response, body.token);
    if (body.action === 'send') return sendNotification(request, response, body.notification);
    return response.status(400).json({ error: 'Ação de notificação inválida.' });
  } catch (error) {
    console.error('Notification API error:', error);
    const status = Number(error.statusCode || 500);
    const message = status >= 500
      ? 'O serviço de notificações ainda não foi configurado na Vercel.'
      : error.message;
    return response.status(status).json({ error: message });
  }
};

async function registerToken(request, response, rawToken) {
  const token = validateToken(rawToken);
  const db = getFirestore();
  const ref = db.collection('notificationTokens').doc(hashToken(token));
  const existing = await ref.get();
  await ref.set({
    token,
    active: true,
    userAgent: String(request.headers['user-agent'] || '').slice(0, 500),
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return response.status(200).json({ enabled: true });
}

async function unregisterToken(response, rawToken) {
  const token = validateToken(rawToken);
  await getFirestore().collection('notificationTokens').doc(hashToken(token)).delete();
  return response.status(200).json({ enabled: false });
}

async function sendNotification(request, response, rawNotification) {
  await requireAdmin(request);
  const notification = validateNotification(rawNotification);
  const result = await broadcast(notification);
  return response.status(200).json(result);
}

async function requireAdmin(request) {
  const authorization = String(request.headers.authorization || '');
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!idToken) throw httpError(401, 'Login administrativo necessário.');
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(idToken);
  } catch {
    throw httpError(401, 'Sua sessão expirou. Entre novamente no painel.');
  }
  const admin = await getFirestore().collection('admins').doc(decoded.uid).get();
  if (!admin.exists) throw httpError(403, 'Este usuário não tem permissão para enviar notificações.');
}

async function broadcast(notification) {
  const db = getFirestore();
  const snapshot = await db.collection('notificationTokens').where('active', '==', true).get();
  let successCount = 0;
  let failureCount = 0;
  for (let index = 0; index < snapshot.docs.length; index += 500) {
    const docs = snapshot.docs.slice(index, index + 500);
    const tokens = docs.map((document) => document.data().token).filter(Boolean);
    if (!tokens.length) continue;
    const result = await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        link: notification.link,
        type: notification.type,
      },
      webpush: { headers: { Urgency: 'high' } },
    });
    successCount += result.successCount;
    failureCount += result.failureCount;
    const invalidTokenDeletes = [];
    result.responses.forEach((item, itemIndex) => {
      const code = String(item.error?.code || '');
      if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
        invalidTokenDeletes.push(docs[itemIndex].ref.delete());
      }
    });
    await Promise.all(invalidTokenDeletes);
  }
  return { sent: successCount, failed: failureCount };
}

function ensureFirebaseAdmin() {
  loadFirebaseAdminModules();
  if (getApps().length) return;
  const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim();
  const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin não configurado.');
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

function loadFirebaseAdminModules() {
  if (getApps) return;
  ({ cert, getApps, initializeApp } = require('firebase-admin/app'));
  ({ getAuth } = require('firebase-admin/auth'));
  ({ FieldValue, getFirestore } = require('firebase-admin/firestore'));
  ({ getMessaging } = require('firebase-admin/messaging'));
}

function validateToken(value) {
  const token = String(value || '').trim();
  if (token.length < 80 || token.length > 4096) throw httpError(400, 'Token de notificação inválido.');
  return token;
}

function validateNotification(value = {}) {
  const title = String(value.title || 'Igreja Zuriel').trim().slice(0, 120);
  const body = String(value.body || value.message || 'Há uma nova atualização.').trim().slice(0, 500);
  const link = normalizeLink(value.link);
  const type = String(value.type || 'update').trim().slice(0, 50);
  const id = String(value.id || `notification-${Date.now()}`).trim().slice(0, 150);
  if (!title || !body) throw httpError(400, 'Preencha o título e a mensagem da notificação.');
  return { id, title, body, link, type };
}

function normalizeLink(value) {
  const link = String(value || '/#home').trim();
  return link.startsWith('/') && !link.startsWith('//') ? link.slice(0, 500) : '/#home';
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    throw httpError(400, 'Conteúdo inválido.');
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
