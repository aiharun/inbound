// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc,
  collection, // Chat için gerekli
  addDoc,     // Chat için gerekli
  query,      // Chat için gerekli
  orderBy,    // Chat için gerekli
  limit       // Chat için gerekli
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

// ANA VERİ REFERANSI (Araçlar, Rampalar vb.)
const DATA_DOC_REF = doc(db, "dockflow", "live_data");

// --- SİHİRLİ TEMİZLEYİCİ ---
const cleanData = (data: any) => {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
};

// ==========================================
// 1. ANA VERİ FONKSİYONLARI (Araçlar, Rampalar)
// ==========================================

export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  console.log("🔥 Firebase Canlı Bağlantı Başlatıldı...");
  
  const unsubscribe = onSnapshot(DATA_DOC_REF, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      console.log("🔥 VERİ GELDİ (Saat: " + new Date().toLocaleTimeString() + ")");
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
    const cleanUpdates = cleanData(updates);
    await setDoc(DATA_DOC_REF, cleanUpdates, { merge: true });
  } catch (error) {
    console.error("Veri güncelleme hatası:", error);
  }
};

export const resetCloudData = async (fullData: any) => {
  try {
    const cleanFullData = cleanData(fullData);
    await setDoc(DATA_DOC_REF, cleanFullData);
    console.log("Veritabanı sıfırlandı.");
  } catch (error) {
    console.error("Veri sıfırlama hatası:", error);
  }
};

// ==========================================
// 2. CHAT FONKSİYONLARI (Eksik olanlar burasıydı)
// ==========================================

export const subscribeToChat = (onMessages: (msgs: any[]) => void) => {
  // Sohbet mesajlarını "chat_messages" koleksiyonundan çekiyoruz
  // Eskiden kalma veriyi korumak için ayrı koleksiyon mantıklı
  const q = query(
    collection(db, "chat_messages"), 
    orderBy("timestamp", "asc"), 
    limit(100)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    onMessages(messages);
  }, (error) => {
    console.error("Chat bağlantı hatası:", error);
  });

  return unsubscribe;
};

export const sendChatMessage = async (message: any) => {
  try {
    const cleanMessage = cleanData(message);
    // Mesajları ayrı bir koleksiyona ekliyoruz
    await addDoc(collection(db, "chat_messages"), cleanMessage);
  } catch (error) {
    console.error("Mesaj gönderme hatası:", error);
  }
};

// Yardımcı kontrol
export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey;
};