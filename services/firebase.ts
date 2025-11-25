// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc,
  collection, 
  addDoc,     
  query,      
  orderBy,    
  limit,
  getDocs,    // Arşiv için gerekli
  writeBatch, // Arşiv temizliği için gerekli
  getDoc      // Tekil arşiv çekmek için gerekli
} from "firebase/firestore";

// ------------------------------------------------------------------
// API ANAHTARLARI (Aynen Korundu)
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ANA VERİ MERKEZİ (Tek Döküman - Sorunsuz Senkronizasyon)
const DATA_DOC_REF = doc(db, "dockflow", "live_data");

// --- SİHİRLİ TEMİZLEYİCİ ---
// Dosya yüklerken oluşan hatayı çözen kısım burasıdır.
const cleanData = (data: any) => {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
};

// ==========================================
// 1. ANA OPERASYONEL VERİLER
// ==========================================

export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  console.log("🔥 Firebase Canlı Bağlantı Başlatıldı...");
  
  const unsubscribeMain = onSnapshot(DATA_DOC_REF, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      console.log("🔥 VERİ GELDİ (Saat: " + new Date().toLocaleTimeString() + ")");
      onDataUpdate(data);
    } else {
      console.log("Veri yok, başlangıç bekleniyor.");
      onDataUpdate(null);
    }
  }, (error) => {
    console.error("Firebase Bağlantı Hatası:", error);
  });
  
  return unsubscribeMain;
};

export const updateData = async (updates: any) => {
  try {
    // Dosyadan gelen veriyi temizle
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
// 2. CHAT & LOG FONKSİYONLARI
// ==========================================

export const subscribeToChat = (onMessages: (msgs: any[]) => void) => {
  if (!db) return () => {};

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
  if (!db) return;
  try {
    const cleanMessage = cleanData(message);
    await addDoc(collection(db, "chat_messages"), cleanMessage);
  } catch (error) {
    console.error("Mesaj gönderme hatası:", error);
  }
};

export const addSystemLog = async (log: any) => {
   if (!db) return;
   try {
       const cleanLog = cleanData(log);
       await addDoc(collection(db, "system_logs"), cleanLog);
   } catch (error) {
       console.error("Log ekleme hatası:", error);
   }
}

// ==========================================
// 3. ARŞİV FONKSİYONLARI (Senin Eklediğin Kısım)
// ==========================================

export const saveDailyArchive = async (archiveData: any) => {
    if (!db) return;
    
    try {
        const archivesRef = collection(db, "daily_archives");
        const cleanArchive = cleanData(archiveData); // Temizleyerek kaydet
        
        // 1. Yeni arşivi kaydet
        await addDoc(archivesRef, cleanArchive);
        
        // 2. 7 günden eski kayıtları sil (Otomatik Temizlik)
        const q = query(archivesRef, orderBy("date", "asc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.size > 7) {
            const excess = snapshot.size - 7;
            const docsToDelete = snapshot.docs.slice(0, excess);
            
            const batch = writeBatch(db);
            docsToDelete.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`${excess} eski arşiv kaydı silindi.`);
        }
        
    } catch (error) {
        console.error("Arşivleme hatası:", error);
    }
};

export const getDailyArchives = async () => {
    if (!db) return [];
    
    try {
        const archivesRef = collection(db, "daily_archives");
        const q = query(archivesRef, orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Arşiv çekme hatası:", error);
        return [];
    }
};

export const getArchiveById = async (id: string) => {
    if (!db) return null;
    
    try {
        const docRef = doc(db, "daily_archives", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Tekil arşiv hatası:", error);
        return null;
    }
};

// Yardımcı kontrol
export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey;
};