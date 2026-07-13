import { firebaseConfig } from '../config/firebase-config.js?v=20260713-13';

const FIREBASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.5';

let firebase;

export async function getFirebase() {
  if (firebase) return firebase;
  if (!firebaseConfig?.apiKey) return null;

  const appModule = await import(`${FIREBASE_CDN}/firebase-app.js`);
  const authModule = await import(`${FIREBASE_CDN}/firebase-auth.js`);
  const firestoreModule = await import(`${FIREBASE_CDN}/firebase-firestore.js`);
  const app = appModule.initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);

  firebase = { app, auth, db, authModule, firestoreModule };
  return firebase;
}
