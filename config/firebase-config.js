import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA3xdQ6V4UGHIPfOYTUFmd3Pwk-uRtrseI",
  authDomain: "rastreando-app-dm.firebaseapp.com",
  projectId: "rastreando-app-dm",
  storageBucket: "rastreando-app-dm.firebasestorage.app",
  messagingSenderId: "1095461871531",
  appId: "1:1095461871531:web:6e691150c3e2d7135fbcee"
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Inicializa a autenticação com persistência em React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

auth.languageCode = 'pt';

// Inicializa o Firestore
const db = getFirestore(app);

// Inicializa o Storage
const storage = getStorage(app); // Adição do Storage

export { auth, db, storage };
