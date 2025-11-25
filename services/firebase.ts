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
// API ANAHTARLARI
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
const DATA_DOC_REF = doc(db, "dockflow", "live_data");

// --- TEMİZLEYİCİ ---
const cleanData = (data: any) => {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
};

// ==========================================
// 1. DATA SUBSCRIBE (Veri Dinleme)
// ==========================================

let internalState: any = {
  users: [],
  drivers: {},
  availablePlates: []
};

export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  console.log("🔥 Firebase: Senkronizasyon Modu Aktif...");

  const emit = () => {
    onDataUpdate({ ...internalState });
  };

  // 1. Operasyonel Veriler
  const unsubMain = onSnapshot(DATA_DOC_REF, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const { users, drivers, availablePlates, ...operationalData } = data;
      internalState = { ...internalState, ...operationalData };
      emit();
    }
  });

  // 2. Kullanıcılar
  const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
    const usersList: any[] = [];
    snap.forEach(doc => usersList.push(doc.data()));
    internalState.users = usersList;
    emit();
  });

  // 3. Plakalar ve Sürücüler
  const unsubPlates = onSnapshot(collection(db, "plates"), (snap) => {
    const driversObj: any = {};
    const platesList: string[] = [];

    snap.forEach(doc => {
      const plate = doc.id;
      driversObj[plate] = doc.data();
      platesList.push(plate);
    });

    internalState.drivers = driversObj;
    internalState.availablePlates = platesList;
    emit();
  });

  return () => {
    unsubMain();
    unsubUsers();
    unsubPlates();
  };
};

// ==========================================
// 2. DATA UPDATE (Veri Güncelleme ve SİLME)
// ==========================================

export const updateData = async (updates: any) => {
  try {
    const batch = writeBatch(db);
    let hasBatchOps = false;
    let mainDocUpdates: any = {};

    // A. KULLANICI GÜNCELLEMESİ (Silme Mantığı Eklendi)
    if (updates.users) {
      const usersRef = collection(db, "users");
      
      // 1. Önce mevcut tüm kullanıcıları çek (Neyi sileceğimizi bilmek için)
      const currentUsersSnap = await getDocs(usersRef);
      const newUsernameList = updates.users.map((u: any) => u.username);

      // 2. Listede olmayanları veritabanından SİL
      currentUsersSnap.docs.forEach((doc) => {
        if (!newUsernameList.includes(doc.id)) {
          batch.delete(doc.ref); // Silme işlemi
          hasBatchOps = true;
        }
      });

      // 3. Yeni/Mevcut kullanıcıları GÜNCELLE
      updates.users.forEach((user: any) => {
        if (user.username) {
          const ref = doc(usersRef, user.username);
          batch.set(ref, cleanData(user));
          hasBatchOps = true;
        }
      });
      
      delete updates.users;
    }

    // B. SÜRÜCÜ GÜNCELLEMESİ (Silme Mantığı Eklendi)
    if (updates.drivers) {
      const platesRef = collection(db, "plates");
      
      // 1. Önce mevcut tüm plakaları çek
      const currentPlatesSnap = await getDocs(platesRef);
      const newPlateList = Object.keys(updates.drivers);

      // 2. Listede olmayanları SİL
      currentPlatesSnap.docs.forEach((doc) => {
        if (!newPlateList.includes(doc.id)) {
          batch.delete(doc.ref); // Silme işlemi
          hasBatchOps = true;
        }
      });

      // 3. Geri kalanları GÜNCELLE
      Object.entries(updates.drivers).forEach(([plate, info]: [string, any]) => {
        const ref = doc(platesRef, plate);
        batch.set(ref, cleanData(info));
        hasBatchOps = true;
      });

      delete updates.drivers;
      if (updates.availablePlates) delete updates.availablePlates;
    }

    // C. DİĞER VERİLER
    if (Object.keys(updates).length > 0) {
      mainDocUpdates = cleanData(updates);
    }

    // İşlemleri Uygula
    if (hasBatchOps) await batch.commit();
    if (Object.keys(mainDocUpdates).length > 0) {
      await setDoc(DATA_DOC_REF, mainDocUpdates, { merge: true });
    }

  } catch (error) {
    console.error("Veri güncelleme/silme hatası:", error);
  }
};

// ==========================================
// 3. RESET DATA (Sıfırlama)
// ==========================================

export const resetCloudData = async (fullData: any) => {
  try {
    // Operasyonel veriyi sıfırla
    const { users, drivers, availablePlates, ...operational } = fullData;
    await setDoc(DATA_DOC_REF, cleanData(operational));

    const batch = writeBatch(db);

    // Eski kullanıcıları temizlemek için önce hepsini silmek daha güvenli (Reset için)
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach(d => batch.delete(d.ref));

    const platesSnap = await getDocs(collection(db, "plates"));
    platesSnap.forEach(d => batch.delete(d.ref));

    // Yenileri ekle
    if (users) {
      users.forEach((u: any) => {
        batch.set(doc(db, "users", u.username), cleanData(u));
      });
    }

    if (drivers) {
      Object.entries(drivers).forEach(([plate, info]: [string, any]) => {
        batch.set(doc(db, "plates", plate), cleanData(info));
      });
    }
    
    await batch.commit();
    console.log("Veritabanı tam resetlendi.");

  } catch (error) {
    console.error("Reset hatası:", error);
  }
};

// ==========================================
// 4. CHAT, LOG ve ARŞİV
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

// ARŞİV
export const saveDailyArchive = async (archiveData: any) => {
    if (!db) return;
    try {
        const dateId = new Date().toISOString().split('T')[0];
        const archiveRef = doc(db, "daily_archives", dateId);
        
        const cleanArchive = cleanData({
            ...archiveData,
            id: dateId, 
            archiveDate: dateId 
        });
        
        await setDoc(archiveRef, cleanArchive);
        
        const q = query(collection(db, "daily_archives"), orderBy("date", "asc"));
        const snapshot = await getDocs(q);
        if (snapshot.size > 7) {
            const batch = writeBatch(db);
            snapshot.docs.slice(0, snapshot.size - 7).forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
    } catch (error) {
        console.error("Arşivleme hatası:", error);
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