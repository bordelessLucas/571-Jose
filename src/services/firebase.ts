import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function requireEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

const firebaseConfig = {
  apiKey: requireEnv(import.meta.env.VITE_FIREBASE_API_KEY, 'VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv(
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_AUTH_DOMAIN',
  ),
  projectId: requireEnv(
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_PROJECT_ID',
  ),
  storageBucket: requireEnv(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_STORAGE_BUCKET',
  ),
  messagingSenderId: requireEnv(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
  ),
  appId: requireEnv(import.meta.env.VITE_FIREBASE_APP_ID, 'VITE_FIREBASE_APP_ID'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

export const analyticsPromise: Promise<Analytics | null> = isSupported().then(
  (supported) => (supported ? getAnalytics(firebaseApp) : null),
)
