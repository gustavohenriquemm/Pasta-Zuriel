import crypto from 'node:crypto';

const FIREBASE_WEB_API_KEY = 'AIzaSyCJO_ZzzPby5_JAj8TZw2bq2DbsSk-u3rc';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPE = [
  'https://www.googleapis.com/auth/datastore',
  'https://www.googleapis.com/auth/firebase.messaging',
].join(' ');

let cachedAccessToken = '';
let cachedAccessTokenExpiresAt = 0;

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = parseBody(request.body);
    if (body.action === 'health') return response.status(200).json(getConfigurationHealth());
    ensureConfiguration();
    if (body.action === 'register') return registerToken(request, response, body.token);
    if (body.action === 'unregister') return unregisterToken(response, body.token);
    if (body.action === 'send') return sendNotification(request, response, body.notification);
    return response.status(400).json({ error: 'Ação de notificação inválida.' });
  } catch (error) {
    console.error('Notification API error:', getSafeDiagnostic(error));
    const status = Number(error.statusCode || 500);
    const publicError = status >= 500 ? classifyServerError(error) : { message: error.message };
    return response.status(status).json({
      error: publicError.message,
      code: publicError.code,
      diagnostic: status >= 500 ? getSafeDiagnostic(error) : undefined,
    });
  }
}

async function registerToken(request, response, rawToken) {
  const token = validateToken(rawToken);
  const accessToken = await getGoogleAccessToken();
  const now = new Date().toISOString();
  const documentId = hashToken(token);
  const result = await fetch(firestoreDocumentUrl('notificationTokens', documentId), {
    method: 'PATCH',
    headers: googleJsonHeaders(accessToken),
    body: JSON.stringify({
      fields: {
        token: { stringValue: token },
        active: { booleanValue: true },
        userAgent: { stringValue: String(request.headers['user-agent'] || '').slice(0, 500) },
        createdAt: { timestampValue: now },
        updatedAt: { timestampValue: now },
      },
    }),
  });
  if (!result.ok) throw await googleApiError(result, 'Não foi possível registrar o aparelho.');
  return response.status(200).json({ enabled: true });
}

async function unregisterToken(response, rawToken) {
  const token = validateToken(rawToken);
  const accessToken = await getGoogleAccessToken();
  const result = await fetch(firestoreDocumentUrl('notificationTokens', hashToken(token)), {
    method: 'DELETE',
    headers: googleAuthHeaders(accessToken),
  });
  if (!result.ok && result.status !== 404) throw await googleApiError(result, 'Não foi possível remover o aparelho.');
  return response.status(200).json({ enabled: false });
}

async function sendNotification(request, response, rawNotification) {
  const accessToken = await getGoogleAccessToken();
  await requireAdmin(request, accessToken);
  const notification = validateNotification(rawNotification);
  const devices = await listNotificationDevices(accessToken);
  let successCount = 0;
  let failureCount = 0;
  for (let index = 0; index < devices.length; index += 25) {
    const batch = devices.slice(index, index + 25);
    const results = await Promise.all(batch.map((device) => sendToDevice(accessToken, device, notification)));
    successCount += results.filter((item) => item.sent).length;
    failureCount += results.filter((item) => !item.sent).length;
    await Promise.all(results.filter((item) => item.invalid).map((item) => deleteDevice(accessToken, item.documentId)));
  }
  return response.status(200).json({ sent: successCount, failed: failureCount });
}

async function requireAdmin(request, accessToken) {
  const authorization = String(request.headers.authorization || '');
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!idToken) throw httpError(401, 'Login administrativo necessário.');
  const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!lookup.ok) throw httpError(401, 'Sua sessão expirou. Entre novamente no painel.');
  const lookupData = await lookup.json();
  const uid = String(lookupData.users?.[0]?.localId || '');
  if (!uid) throw httpError(401, 'Sua sessão expirou. Entre novamente no painel.');
  const admin = await fetch(firestoreDocumentUrl('admins', uid), {
    headers: googleAuthHeaders(accessToken),
  });
  if (admin.status === 404) throw httpError(403, 'Este usuário não tem permissão para enviar notificações.');
  if (!admin.ok) throw await googleApiError(admin, 'Não foi possível validar o administrador.');
}

async function listNotificationDevices(accessToken) {
  const devices = [];
  let pageToken = '';
  do {
    const url = new URL(firestoreCollectionUrl('notificationTokens'));
    url.searchParams.set('pageSize', '500');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const result = await fetch(url, { headers: googleAuthHeaders(accessToken) });
    if (!result.ok) throw await googleApiError(result, 'Não foi possível consultar os aparelhos.');
    const data = await result.json();
    (data.documents || []).forEach((document) => {
      const token = document.fields?.token?.stringValue;
      const active = document.fields?.active?.booleanValue === true;
      if (token && active) devices.push({ token, documentId: document.name.split('/').pop() });
    });
    pageToken = String(data.nextPageToken || '');
  } while (pageToken);
  return devices;
}

async function sendToDevice(accessToken, device, notification) {
  const projectId = getFirebaseEnvironment().projectId;
  const result = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`, {
    method: 'POST',
    headers: googleJsonHeaders(accessToken),
    body: JSON.stringify({
      message: {
        token: device.token,
        data: {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          link: notification.link,
          type: notification.type,
        },
        webpush: { headers: { Urgency: 'high' } },
      },
    }),
  });
  if (result.ok) return { sent: true, invalid: false, documentId: device.documentId };
  const data = await result.json().catch(() => ({}));
  const errorCode = String(data.error?.details?.find((item) => item.errorCode)?.errorCode || '');
  const invalid = result.status === 404 || ['UNREGISTERED', 'INVALID_ARGUMENT'].includes(errorCode);
  return { sent: false, invalid, documentId: device.documentId };
}

async function deleteDevice(accessToken, documentId) {
  if (!documentId) return;
  await fetch(firestoreDocumentUrl('notificationTokens', documentId), {
    method: 'DELETE',
    headers: googleAuthHeaders(accessToken),
  }).catch(() => {});
}

async function getGoogleAccessToken() {
  if (cachedAccessToken && cachedAccessTokenExpiresAt > Date.now() + 60_000) return cachedAccessToken;
  const { clientEmail, privateKey } = getFirebaseEnvironment();
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const unsignedJwt = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsignedJwt), privateKey).toString('base64url');
  const result = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsignedJwt}.${signature}`,
    }),
  });
  if (!result.ok) throw await googleApiError(result, 'O Google recusou a credencial de notificação.');
  const data = await result.json();
  cachedAccessToken = String(data.access_token || '');
  cachedAccessTokenExpiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;
  if (!cachedAccessToken) throw new Error('O Google não retornou uma credencial de acesso.');
  return cachedAccessToken;
}

function ensureConfiguration() {
  const { projectId, clientEmail, privateKey } = getFirebaseEnvironment();
  if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase não configurado.');
}

function getFirebaseEnvironment() {
  return {
    projectId: String(process.env.FIREBASE_PROJECT_ID || '').trim(),
    clientEmail: String(process.env.FIREBASE_CLIENT_EMAIL || '').trim(),
    privateKey: String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim(),
  };
}

function getConfigurationHealth() {
  const { projectId, clientEmail, privateKey } = getFirebaseEnvironment();
  return {
    function: true,
    configuration: {
      projectId: Boolean(projectId),
      clientEmail: Boolean(clientEmail),
      privateKey: Boolean(privateKey),
      privateKeyFormat: privateKey.startsWith('-----BEGIN PRIVATE KEY-----')
        && privateKey.endsWith('-----END PRIVATE KEY-----'),
    },
  };
}

function firestoreCollectionUrl(collectionName) {
  const { projectId } = getFirebaseEnvironment();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collectionName)}`;
}

function firestoreDocumentUrl(collectionName, documentId) {
  return `${firestoreCollectionUrl(collectionName)}/${encodeURIComponent(documentId)}`;
}

function googleAuthHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

function googleJsonHeaders(accessToken) {
  return { ...googleAuthHeaders(accessToken), 'Content-Type': 'application/json' };
}

async function googleApiError(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  const error = new Error(String(data.error?.message || fallbackMessage));
  error.googleCode = String(data.error?.status || response.status);
  return error;
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

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function classifyServerError(error) {
  const message = String(error?.message || '');
  if (message.includes('Firebase não configurado')) {
    return {
      code: 'missing-environment-variable',
      message: 'Uma ou mais variáveis do Firebase não foram encontradas na Vercel.',
    };
  }
  if (/private key|private_key|PEM|DECODER|secretOrPrivateKey/i.test(message)) {
    return {
      code: 'invalid-private-key',
      message: 'A chave FIREBASE_PRIVATE_KEY está em um formato inválido na Vercel.',
    };
  }
  return {
    code: 'notification-server-error',
    message: 'O servidor não conseguiu se autenticar para enviar a notificação.',
  };
}

function getSafeDiagnostic(error) {
  return {
    name: String(error?.name || 'Error').slice(0, 80),
    code: String(error?.code || error?.googleCode || 'no-code').slice(0, 120),
  };
}
