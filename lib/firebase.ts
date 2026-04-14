import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA53k4wsbqDkhDexx29ZYgFZAiDFT9Kg-g",
  authDomain: "fishline-9e984.firebaseapp.com",
  projectId: "fishline-9e984",
  storageBucket: "fishline-9e984.firebasestorage.app",
  messagingSenderId: "257296302870",
  appId: "1:257296302870:web:42c0251616af818e090637"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);