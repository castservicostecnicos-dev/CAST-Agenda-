import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp;
let db: Firestore | null = null;

try {
  if (!getApps().length) {
    app = initializeApp({
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
    });
  } else {
    app = getApp();
  }

  // Support custom databaseId if configured in firebase-applet-config.json
  const databaseId = (firebaseConfig as any).firestoreDatabaseId || undefined;
  if (databaseId && databaseId !== '(default)') {
    db = getFirestore(app, databaseId);
  } else {
    db = getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase initialization warning:', error);
}

export { app, db };
