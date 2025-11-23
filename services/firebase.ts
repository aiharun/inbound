// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc 
} from "firebase/firestore";

// Senin Proje Ayarların (Aynen korundu)
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
// Bu sefer senin kodundaki "dockflow" ismini kullandım ki karışıklık olmasın
const DATA_DOC_REF = doc(db, "dockflow", "live_data");

// 1. DİNLEME FONKSİYONU
// Veritabanını canlı olarak izler ve React'e haber verir
export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  console.log("🔥 Firebase Canlı Bağlantı Başlatılıyor...");
  
  const unsubscribe = onSnapshot(DATA_DOC_REF, (docSnapshot) => {
    if (docSnapshot.exists()) {
      // Veri varsa React'e gönder
      const data = docSnapshot.data();
      onDataUpdate(data);
    } else {
      // Veri yoksa (Proje yeni açıldıysa)
      console.log("Veri bulunamadı, başlangıç bekleniyor.");
      onDataUpdate(null);
    }
  }, (error) => {
    console.error("Firebase Bağlantı Hatası:", error);
  });

  return unsubscribe;
};

// 2. GÜNCELLEME FONKSİYONU
// React tarafındaki state neyse, aynısını veritabanına yazar
export const updateData = async (updates: any) => {
  try {
    // merge: true sayesinde sadece değişen kısımları günceller
    await setDoc(DATA_DOC_REF, updates, { merge: true });
  } catch (error) {
    console.error("Veri güncelleme hatası:", error);
  }
};

// 3. SIFIRLAMA FONKSİYONU
// "Günü Bitir" dediğinde her şeyi sıfırdan yazar
export const resetCloudData = async (fullData: any) => {
  try {
    // merge kullanmıyoruz, çünkü tamamen üzerine yazıp temizlemek istiyoruz
    await setDoc(DATA_DOC_REF, fullData);
    console.log("Veritabanı sıfırlandı.");
  } catch (error) {
    console.error("Veri sıfırlama hatası:", error);
  }
};

// Yardımcı fonksiyon: App.tsx içinde kontrol için kullanılıyor
export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey;
};