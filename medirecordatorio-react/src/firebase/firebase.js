// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "example",
  authDomain: "example",
  projectId: "example",
  storageBucket: "example",
  messagingSenderId: "example",
  appId: "example",
  measurementId: "example"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Servicios que vas a usar
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar para usar en el proyecto
export { auth, db };
