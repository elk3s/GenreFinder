import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc, updateDoc } from "firebase/firestore";

// Configuration loaded from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyA6nqU-eYhX9oHW5hhUzNGp7fMKqfHT6y8",
  authDomain: "gen-lang-client-0856000804.firebaseapp.com",
  projectId: "gen-lang-client-0856000804",
  storageBucket: "gen-lang-client-0856000804.firebasestorage.app",
  messagingSenderId: "713610810310",
  appId: "1:713610810310:web:06dd865e7afd94d373d8c7",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const db = getFirestore(app);

export { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile };
export type { User };
