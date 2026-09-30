import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { Platform } from 'react-native';

import * as authModule from 'firebase/auth';
const getReactNativePersistence = (
  authModule as typeof authModule & {
    getReactNativePersistence: (storage: unknown) => import('firebase/auth').Persistence;
  }
).getReactNativePersistence;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP3evPmAvc9L0teMQfiGZMhNyRcUM_wkg",
  authDomain: "phongtro-f3927.firebaseapp.com",
  projectId: "phongtro-f3927",
  storageBucket: "phongtro-f3927.firebasestorage.app",
  messagingSenderId: "224077714527",
  appId: "1:224077714527:web:2d607ebbe853d72486f7ea",
  measurementId: "G-RFBRT1R4PJ"
};

const app = initializeApp(firebaseConfig);

// Dùng AsyncStorage persistence trên mobile để session không mất khi tắt app
let firebaseAuth: ReturnType<typeof getAuth>;

if (Platform.OS === 'web') {
  // Trên web dùng getAuth mặc định (localStorage)
  firebaseAuth = getAuth(app);
} else {
  // Trên mobile (Android/iOS) dùng AsyncStorage để persist session
  firebaseAuth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { firebaseAuth };
