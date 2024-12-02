

// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjX2DQoGqKXp_zSzPU1Q-Mqx2xw1Ak6v8",
  authDomain: "twiller-960e0.firebaseapp.com",
  projectId: "twiller-960e0",
  storageBucket: "twiller-960e0.firebasestorage.app",
  messagingSenderId: "606201935009",
  appId: "1:606201935009:web:be6bc1ec8f057826c1ace0",
  measurementId: "G-9DY4RSW308"
};
// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };