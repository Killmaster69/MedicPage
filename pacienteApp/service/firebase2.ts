import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "example",
  authDomain: "example",
  projectId: "example",
  storageBucket: "example",
  messagingSenderId: "example",
  appId: "example",
  measurementId: "example"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Función de login (puedes agregar otras también aquí)
const loginWithEmail = (email: string, password: string) => {
  return auth.signInWithEmailAndPassword(email, password);
};

export { auth, db, loginWithEmail };
