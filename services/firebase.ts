// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc 
} from "firebase/firestore";

// ------------------------------------------------------------------
// SENİN API ANAHTARLARIN (Aynen korundu)
// ------------------------------------------------------------------
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
// "dockflow" koleksiyonu içinde "live_data" dökümanı
const DATA_DOC_REF = doc(db, "dockflow", "live_data");

// --- SİHİRLİ TEMİZLEYİCİ (Undefined Hatasını Çözen Kısım) ---
// Verinin içindeki "undefined" değerleri temizler, patlamayı önler.
const cleanData = (data: any) => {
  if (data === undefined || data === null) return null;
  // JSON.stringify undefined alanları otomatik siler.
  return JSON.parse(JSON.stringify(data));
};

// 1. DİNLEME FONKSİYONU
export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  console.log("🔥 Firebase Canlı Bağlantı (Tek Döküman) Başlatılıyor...");
  
  const unsubscribe = onSnapshot(DATA_DOC_REF, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      console.log("🔥 VERİ GELDİ (Saat: " + new Date().toLocaleTimeString() + ")");
      onDataUpdate(data);
    } else {
      console.log("Veri henüz yok (Yeni Proje).");
      onDataUpdate(null);
    }
  }, (error) => {
    console.error("Firebase Bağlantı Hatası:", error);
  });

  return unsubscribe;
};

// 2. GÜNCELLEME FONKSİYONU
export const updateData = async (updates: any) => {
  try {
    // ÖNCE TEMİZLE (Hata almamak için)
    const cleanUpdates = cleanData(updates);
    
    // Sonra gönder (merge: true ile sadece değişeni yazar)
    await setDoc(DATA_DOC_REF, cleanUpdates, { merge: true });
  } catch (error) {
    console.error("Veri güncelleme hatası:", error);
  }
};

// 3. SIFIRLAMA FONKSİYONU
export const resetCloudData = async (fullData: any) => {
  try {
    // ÖNCE TEMİZLE
    const cleanFullData = cleanData(fullData);
    
    // Her şeyi silip baştan yazar
    await setDoc(DATA_DOC_REF, cleanFullData);
    console.log("Veritabanı sıfırlandı.");
  } catch (error) {
    console.error("Veri sıfırlama hatası:", error);
  }
};

// Yardımcı kontrol
export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey;
};