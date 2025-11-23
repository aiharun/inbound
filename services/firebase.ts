// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";

// Senin API Anahtarların (Aynen korudum)
const firebaseConfig = {
  apiKey: "AIzaSyBmOl3FTL5Jr-QnERQCmkTgl6e3HSfraH8",
  authDomain: "inbound-b9ab6.firebaseapp.com",
  projectId: "inbound-b9ab6",
  storageBucket: "inbound-b9ab6.firebasestorage.app",
  messagingSenderId: "1046380639284",
  appId: "1:1046380639284:web:1d2ac5e367d78d30148661",
  measurementId: "G-HJ8P8KLN7J"
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Verilerin tutulacağı tekil döküman referansı
// "warehouse" koleksiyonu içinde "live_data" dökümanı
const DATA_DOC_REF = doc(db, "warehouse", "live_data");

// 1. DİNLEME FONKSİYONU (İşte sihri yapan yer burası)
// getDoc yerine onSnapshot kullanıyoruz.
export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  // Bu fonksiyon veritabanında bir yaprak kımıldasa çalışır
  const unsubscribe = onSnapshot(DATA_DOC_REF, (docSnapshot) => {
    if (docSnapshot.exists()) {
      // Veri varsa React'e gönder
      onDataUpdate(docSnapshot.data());
    } else {
      // Veri yoksa (ilk açılışsa) boş gönder
      onDataUpdate(null);
    }
  }, (error) => {
    console.error("Firebase dinleme hatası:", error);
  });

  // Dinlemeyi durdurma fonksiyonunu geri döndür
  return unsubscribe;
};

// 2. VERİ GÜNCELLEME FONKSİYONU
export const updateData = async (updates: any) => {
  try {
    // Sadece değişen kısımları güncelle (merge)
    await setDoc(DATA_DOC_REF, updates, { merge: true });
  } catch (error) {
    console.error("Veri güncelleme hatası:", error);
  }
};

// 3. VERİ SIFIRLAMA FONKSİYONU
export const resetCloudData = async (fullData: any) => {
  try {
    // Tüm veriyi baştan yazar
    await setDoc(DATA_DOC_REF, fullData);
  } catch (error) {
    console.error("Veri sıfırlama hatası:", error);
  }
};

// Yardımcı fonksiyon
export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey;
};