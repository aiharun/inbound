// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmOl3FTL5Jr-QnERQCmkTgl6e3HSfraH8",
  authDomain: "inbound-b9ab6.firebaseapp.com",
  projectId: "inbound-b9ab6",
  storageBucket: "inbound-b9ab6.firebasestorage.app",
  messagingSenderId: "1046380639284",
  appId: "1:1046380639284:web:1d2ac5e367d78d30148661",
  measurementId: "G-HJ8P8KLN7J"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DATA_DOC_REF = doc(db, "warehouse", "live_data");

export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  const unsubscribe = onSnapshot(DATA_DOC_REF, (docSnapshot) => {
    if (docSnapshot.exists()) {
      onDataUpdate(docSnapshot.data());
    } else {
      onDataUpdate(null);
    }
  }, (error) => {
    console.error("Firebase dinleme hatası:", error);
  });

  return unsubscribe;
};

export const updateData = async (updates: any) => {
  try {
    // Sadece değişen kısımları güncelle (merge)
    await setDoc(DATA_DOC_REF, updates, { merge: true });
  } catch (error) {
    console.error("Veri güncelleme hatası:", error);
  }
};

export const resetCloudData = async (fullData: any) => {
  try {
    await setDoc(DATA_DOC_REF, fullData);
  } catch (error) {
    console.error("Veri sıfırlama hatası:", error);
  }
};

export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey;
};