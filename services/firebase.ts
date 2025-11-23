// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc 
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

const DATA_DOC_REF = doc(db, "dockflow", "live_data");

// --- SİHİRLİ TEMİZLEYİCİ FONKSİYON ---
// Bu fonksiyon verinin içindeki tüm "undefined" değerleri temizler.
// Firestore hatasını engelleyen kilit nokta burasıdır.
const cleanData = (data: any) => {
  if (data === undefined) return null;
  // JSON.stringify undefined alanları otomatik olarak siler.
  // JSON.parse ise onu tekrar nesneye çevirir.
  return JSON.parse(JSON.stringify(data));
};

export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  console.log("🔥 Firebase Canlı Bağlantı Aktif...");
  
  const unsubscribe = onSnapshot(DATA_DOC_REF, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      onDataUpdate(data);
    } else {
      onDataUpdate(null);
    }
  }, (error) => {
    console.error("Firebase Bağlantı Hatası:", error);
  });

  return unsubscribe;
};

export const updateData = async (updates: any) => {
  try {
    // GÖNDERMEDEN ÖNCE TEMİZLE
    const cleanUpdates = cleanData(updates);
    
    // merge: true ile güncelle
    await setDoc(DATA_DOC_REF, cleanUpdates, { merge: true });
  } catch (error) {
    console.error("Veri güncelleme hatası:", error);
  }
};

export const resetCloudData = async (fullData: any) => {
  try {
    // GÖNDERMEDEN ÖNCE TEMİZLE
    const cleanFullData = cleanData(fullData);
    
    await setDoc(DATA_DOC_REF, cleanFullData);
    console.log("Veritabanı sıfırlandı.");
  } catch (error) {
    console.error("Veri sıfırlama hatası:", error);
  }
};

export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey;
};