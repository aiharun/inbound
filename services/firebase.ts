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
  writeBatch,
  getDocs,
  deleteDoc,
  getDoc
} from "firebase/firestore";

// ------------------------------------------------------------------
// SENİN API ANAHTARLARIN
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

// REFERANSLAR
const DATA_DOC_REF = doc(db, "dockflow", "live_data"); // Sadece Rampalar ve Araçlar burada kalacak

// --- SİHİRLİ TEMİZLEYİCİ ---
const cleanData = (data: any) => {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
};

// ==========================================
// 1. DATA SUBSCRIBE (Veri Dinleme - Birleştirme)
// ==========================================
// Burası çok önemli: 3 farklı yerden veriyi alıp React'e tek paket yapıyor.
// Böylece React kodunu değiştirmene gerek kalmıyor.

// Geçici hafıza
let internalState: any = {
  users: [],
  drivers: {},
  availablePlates: []
};

export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  console.log("🔥 Firebase: Ayrıştırılmış Koleksiyon Modu Başlatılıyor...");

  const emit = () => {
    // Tüm parçaları birleştirip React'e gönder
    onDataUpdate({ ...internalState });
  };

  // 1. PARÇA: Operasyonel Veriler (Rampalar, Seferler vs.)
  const unsubMain = onSnapshot(DATA_DOC_REF, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      // users ve drivers buradan gelmeyecek artık, onları eziyoruz
      const { users, drivers, availablePlates, ...operationalData } = data;
      internalState = { ...internalState, ...operationalData };
      emit();
    }
  });

  // 2. PARÇA: Kullanıcılar (Users Koleksiyonu)
  const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
    const usersList: any[] = [];
    snap.forEach(doc => usersList.push(doc.data()));
    internalState.users = usersList;
    emit();
  });

  // 3. PARÇA: Plakalar ve Sürücüler (Plates Koleksiyonu)
  const unsubPlates = onSnapshot(collection(db, "plates"), (snap) => {
    const driversObj: any = {};
    const platesList: string[] = [];

    snap.forEach(doc => {
      const plate = doc.id;
      driversObj[plate] = doc.data(); // İsim, telefon vs.
      platesList.push(plate);
    });

    internalState.drivers = driversObj;
    internalState.availablePlates = platesList;
    emit();
  });

  // Dinlemeyi durdurmak istendiğinde hepsini kapat
  return () => {
    unsubMain();
    unsubUsers();
    unsubPlates();
  };
};

// ==========================================
// 2. DATA UPDATE (Veri Güncelleme - Dağıtma)
// ==========================================
// React tek parça gönderir, biz burada onu ilgili kutulara dağıtırız.

export const updateData = async (updates: any) => {
  try {
    const batch = writeBatch(db);
    let hasBatchOps = false;
    let mainDocUpdates: any = {};

    // A. KULLANICI GÜNCELLEMESİ VARSA -> 'users' koleksiyonuna
    if (updates.users) {
      const usersRef = collection(db, "users");
      // Not: Tam senkronizasyon için önce eskileri silmek gerekebilir ama
      // performans için şimdilik sadece üzerine yazıyoruz (overwrite).
      updates.users.forEach((user: any) => {
        if (user.username) {
          const ref = doc(usersRef, user.username);
          batch.set(ref, cleanData(user));
          hasBatchOps = true;
        }
      });
      // Main doc'a yazılmasın diye siliyoruz
      delete updates.users;
    }

    // B. SÜRÜCÜ GÜNCELLEMESİ VARSA -> 'plates' koleksiyonuna
    if (updates.drivers) {
      const platesRef = collection(db, "plates");
      Object.entries(updates.drivers).forEach(([plate, info]: [string, any]) => {
        const ref = doc(platesRef, plate);
        batch.set(ref, cleanData(info));
        hasBatchOps = true;
      });
      delete updates.drivers;
      // availablePlates otomatik oluştuğu için main doc'tan siliyoruz
      if (updates.availablePlates) delete updates.availablePlates;
    }

    // C. DİĞER HER ŞEY -> 'dockflow/live_data' dökümanına
    if (Object.keys(updates).length > 0) {
      mainDocUpdates = cleanData(updates);
    }

    // İşlemleri Uygula
    if (hasBatchOps) await batch.commit();
    if (Object.keys(mainDocUpdates).length > 0) {
      await setDoc(DATA_DOC_REF, mainDocUpdates, { merge: true });
    }

  } catch (error) {
    console.error("Veri dağıtım hatası:", error);
  }
};

// ==========================================
// 3. RESET DATA (Sıfırlama)
// ==========================================
// Günü bitir dediğinde tüm koleksiyonları temizler.

export const resetCloudData = async (fullData: any) => {
  try {
    // Önce operasyonel veriyi sıfırla
    const { users, drivers, availablePlates, ...operational } = fullData;
    await setDoc(DATA_DOC_REF, cleanData(operational));

    // Şimdi koleksiyonları güncelle (Batch ile)
    const batch = writeBatch(db);

    // Users
    if (users) {
      users.forEach((u: any) => {
        batch.set(doc(db, "users", u.username), cleanData(u));
      });
    }

    // Drivers
    if (drivers) {
      Object.entries(drivers).forEach(([plate, info]: [string, any]) => {
        batch.set(doc(db, "plates", plate), cleanData(info));
      });
    }
    
    await batch.commit();
    console.log("Veritabanı organize şekilde sıfırlandı.");

  } catch (error) {
    console.error("Reset hatası:", error);
  }
};

// ==========================================
// 4. CHAT, LOG ve ARŞİV (Ayrı Koleksiyonlar)
// ==========================================

export const subscribeToChat = (onMessages: (msgs: any[]) => void) => {
  const q = query(collection(db, "chat_messages"), orderBy("timestamp", "asc"), limit(100));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onMessages(messages);
  });
};

export const sendChatMessage = async (message: any) => {
  await addDoc(collection(db, "chat_messages"), cleanData(message));
};

export const addSystemLog = async (log: any) => {
   await addDoc(collection(db, "system_logs"), cleanData(log));
}

// Arşiv
export const saveDailyArchive = async (archiveData: any) => {
    const archivesRef = collection(db, "daily_archives");
    await addDoc(archivesRef, cleanData(archiveData));
    
    // 7 gün temizliği
    const q = query(archivesRef, orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    if (snapshot.size > 7) {
        const batch = writeBatch(db);
        snapshot.docs.slice(0, snapshot.size - 7).forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
};

export const getDailyArchives = async () => {
    const q = query(collection(db, "daily_archives"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getArchiveById = async (id: string) => {
    const docSnap = await getDoc(doc(db, "daily_archives", id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const isFirebaseConfigured = () => !!firebaseConfig.apiKey;