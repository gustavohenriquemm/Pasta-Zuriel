import { getFirebase } from '../authentication/firebase.js';

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
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }, () => callback([]));
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
  const { collection, doc, setDoc } = firebase.firestoreModule;
  const id = event.id || `event-${Date.now()}`;
  try {
    await setDoc(doc(collection(firebase.db, 'calendarEvents'), id), { ...event, id, updatedAt: Date.now() });
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

export async function deleteCalendarEvent(id) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { doc, deleteDoc } = firebase.firestoreModule;
  try {
    await deleteDoc(doc(firebase.db, 'calendarEvents', id));
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

export async function saveNotice(notice) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { collection, doc, setDoc } = firebase.firestoreModule;
  const id = notice.id || `notice-${Date.now()}`;
  try {
    await setDoc(doc(collection(firebase.db, 'notices'), id), { ...notice, id, updatedAt: Date.now() });
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
}

export async function deleteNotice(id) {
  const firebase = await getFirebase();
  if (!firebase) throw new Error('Firebase ainda nao configurado.');
  const { doc, deleteDoc } = firebase.firestoreModule;
  try {
    await deleteDoc(doc(firebase.db, 'notices', id));
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error));
  }
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
