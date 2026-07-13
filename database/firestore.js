import { getFirebase } from '../authentication/firebase.js?v=20260713-13';

export async function signInAdmin(email, password) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  try {
    return await firebase.authModule.signInWithEmailAndPassword(firebase.auth, email, password);
  } catch (error) {
    throw new Error(getFriendlyAuthError(error));
  }
}

export async function signOutAdmin() {
  const firebase = await getFirebase();
  if (firebase) await firebase.authModule.signOut(firebase.auth);
}

export async function getCurrentUser() {
  const firebase = await getFirebase();
  if (!firebase) return null;
  return new Promise((resolve) => {
    const unsubscribe = firebase.authModule.onAuthStateChanged(firebase.auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export function listenAuth(callback) {
  getFirebase().then((firebase) => {
    if (!firebase) return callback(null);
    return firebase.authModule.onAuthStateChanged(firebase.auth, callback);
  });
}

export function listenHymns(collectionName, callback) {
  let unsubscribe;
  getFirebase().then((firebase) => {
    if (!firebase) return;
    const { collection, onSnapshot, orderBy, query } = firebase.firestoreModule;
    const ref = query(collection(firebase.db, collectionName), orderBy('number', 'asc'));
    unsubscribe = onSnapshot(ref, (snapshot) => {
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }, () => callback([]));
  });
  return () => unsubscribe?.();
}

export function listenCalendarEvents(callback) {
  let unsubscribe;
  getFirebase().then((firebase) => {
    if (!firebase) return callback([]);
    const { collection, onSnapshot, orderBy, query } = firebase.firestoreModule;
    const ref = query(collection(firebase.db, 'calendarEvents'), orderBy('date', 'asc'));
    unsubscribe = onSnapshot(ref, (snapshot) => {
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }, () => callback([]));
  });
  return () => unsubscribe?.();
}

export function listenNotices(callback) {
  let unsubscribe;
  getFirebase().then((firebase) => {
    if (!firebase) return callback([]);
    const { collection, onSnapshot } = firebase.firestoreModule;
    const ref = collection(firebase.db, 'notices');
    unsubscribe = onSnapshot(ref, (snapshot) => {
      callback(snapshot.docs
        .map((document) => ({ id: document.id, ...document.data() }))
        .filter((item) => item.notificationOnly !== true));
    }, () => callback([]));
  });
  return () => unsubscribe?.();
}

export function listenNotifications(callback) {
  let unsubscribe;
  let initialized = false;
  getFirebase().then((firebase) => {
    if (!firebase) return callback([], [], false);
    const { collection, onSnapshot } = firebase.firestoreModule;
    const ref = collection(firebase.db, 'notices');
    unsubscribe = onSnapshot(ref, (snapshot) => {
      const items = snapshot.docs
        .map((document) => ({ id: document.id, ...document.data() }))
        .filter((item) => item.notificationOnly === true)
        .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
        .slice(0, 50);
      const changes = initialized
        ? snapshot.docChanges()
          .filter((change) => change.type === 'added' || change.type === 'modified')
          .map((change) => ({ id: change.doc.id, ...change.doc.data() }))
          .filter((item) => item.notificationOnly === true)
        : [];
      callback(items, changes, initialized);
      initialized = true;
    }, () => callback([], [], initialized));
  });
  return () => unsubscribe?.();
}

export async function saveHymn(collectionName, hymn) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { collection, doc, setDoc } = firebase.firestoreModule;
  const id = hymn.id || `${collectionName}-${hymn.number}`;
  try {
    await setDoc(doc(collection(firebase.db, collectionName), id), { ...hymn, id, updatedAt: Date.now() });
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

export async function deleteHymn(collectionName, id) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { doc, deleteDoc } = firebase.firestoreModule;
  try {
    await deleteDoc(doc(firebase.db, collectionName, id));
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

export async function saveCalendarEvent(event) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { collection, doc, writeBatch } = firebase.firestoreModule;
  const isNew = !event.id;
  const id = event.id || `event-${Date.now()}`;
  const updatedAt = Date.now();
  try {
    const batch = writeBatch(firebase.db);
    batch.set(doc(collection(firebase.db, 'calendarEvents'), id), { ...event, id, updatedAt });
    const notification = buildEventNotification({ ...event, id, updatedAt }, isNew);
    batch.set(doc(collection(firebase.db, 'notices'), createNotificationId(updatedAt)), notification);
    await batch.commit();
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

export async function deleteCalendarEvent(id) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { collection, doc, getDoc, writeBatch } = firebase.firestoreModule;
  try {
    const eventRef = doc(firebase.db, 'calendarEvents', id);
    const snapshot = await getDoc(eventRef);
    const event = snapshot.exists() ? { id, ...snapshot.data() } : { id, title: 'Evento' };
    const updatedAt = Date.now();
    const batch = writeBatch(firebase.db);
    batch.delete(eventRef);
    batch.set(doc(collection(firebase.db, 'notices'), createNotificationId(updatedAt)), {
      title: isRehearsalEvent(event) ? 'Ensaio cancelado' : 'Evento cancelado',
      body: event.title || 'Um evento foi removido do calendário.',
      type: isRehearsalEvent(event) ? 'rehearsal' : 'event',
      sourceType: 'calendarEvent',
      sourceId: id,
      link: '/#calendar',
      updatedAt,
      notificationOnly: true,
    });
    await batch.commit();
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

export async function saveNotice(notice) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { collection, doc, writeBatch } = firebase.firestoreModule;
  const isNew = !notice.id;
  const id = notice.id || `notice-${Date.now()}`;
  const updatedAt = Date.now();
  try {
    const batch = writeBatch(firebase.db);
    batch.set(doc(collection(firebase.db, 'notices'), id), { ...notice, id, updatedAt });
    batch.set(doc(collection(firebase.db, 'notices'), createNotificationId(updatedAt)), {
      title: isNew ? 'Novo aviso' : 'Aviso atualizado',
      body: `${notice.title || 'Aviso'}: ${notice.message || ''}`.trim(),
      type: 'notice',
      sourceType: 'notice',
      sourceId: id,
      link: '/#home',
      updatedAt,
      notificationOnly: true,
    });
    await batch.commit();
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

export async function deleteNotice(id) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { collection, doc, getDoc, writeBatch } = firebase.firestoreModule;
  try {
    const noticeRef = doc(firebase.db, 'notices', id);
    const snapshot = await getDoc(noticeRef);
    const notice = snapshot.exists() ? snapshot.data() : {};
    const updatedAt = Date.now();
    const batch = writeBatch(firebase.db);
    batch.delete(noticeRef);
    batch.set(doc(collection(firebase.db, 'notices'), createNotificationId(updatedAt)), {
      title: 'Aviso removido',
      body: notice.title || 'Um aviso foi removido.',
      type: 'notice',
      sourceType: 'notice',
      sourceId: id,
      link: '/#home',
      updatedAt,
      notificationOnly: true,
    });
    await batch.commit();
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

function buildEventNotification(event, isNew) {
  const rehearsal = isRehearsalEvent(event);
  const schedule = formatEventSchedule(event);
  const details = rehearsal
    ? [schedule, event.conductor ? `Regente: ${event.conductor}` : '', event.rehearsalHymn ? `Hino: ${event.rehearsalHymn}` : ''].filter(Boolean).join(' · ')
    : [event.title || 'Evento', schedule].filter(Boolean).join(' · ');
  return {
    title: rehearsal ? (isNew ? 'Novo ensaio' : 'Ensaio atualizado') : (isNew ? 'Novo evento' : 'Evento atualizado'),
    body: details,
    type: rehearsal ? 'rehearsal' : 'event',
    sourceType: 'calendarEvent',
    sourceId: event.id,
    link: '/#calendar',
    updatedAt: event.updatedAt,
    notificationOnly: true,
  };
}

function isRehearsalEvent(event) {
  return event.eventType === 'rehearsal'
    || String(event.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('ensaio');
}

function formatEventSchedule(event) {
  const date = event.recurrence === 'sundays' ? 'Todos os domingos' : formatDateKey(event.date);
  return [date, event.time ? `às ${event.time}` : ''].filter(Boolean).join(' ');
}

function formatDateKey(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

function createNotificationId(timestamp) {
  return `notification-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFriendlyAuthError(error) {
  const code = error?.code || '';
  if (code.includes('api-key-not-valid')) {
    return 'A chave apiKey do Firebase esta incorreta. Copie novamente o firebaseConfig direto do console do Firebase.';
  }
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'E-mail ou senha do administrador incorretos.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'Ative o login por e-mail e senha no Firebase Authentication.';
  }
  return error?.message || 'Nao foi possivel entrar no painel.';
}

function getFriendlyFirestoreError(error) {
  const code = error?.code || '';
  const message = error?.message || '';
  if (code.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return 'Este usuario entrou, mas ainda nao esta cadastrado como administrador no Firestore. Crie um documento em admins com o UID deste usuario e publique as regras.';
  }
  return message || 'Nao foi possivel salvar no Firebase.';
}
