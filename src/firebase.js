import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Web App configuration for the RIYASH PAY project.
const firebaseConfig = {
  apiKey: "AIzaSyBGnt8mBocqJX9y_FEp1zPnRuHdluUM5SM",
  authDomain: "airseeds.firebaseapp.com",
  projectId: "airseeds",
  storageBucket: "airseeds.firebasestorage.app",
  messagingSenderId: "161778874117",
  appId: "1:161778874117:web:4e10a0d5c942bd952de96c",
  measurementId: "G-6Y7XBYHECV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);