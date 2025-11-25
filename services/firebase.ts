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
const DATA_DOC_REF = doc(db, "dockflow", "live_data"); // Sadece Rampalar ve Araçlar burada kalacak

// --- SİHİRLİ TEMİZLEYİCİ (Undefined Hatasını Önler) ---
const cleanData = (data: any) => {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
};

// ==========================================
// 1. DATA SUBSCRIBE (Veri Dinleme - Birleştirme)
// ==========================================
// React uygulaması tek bir yerden veri beklediği için
// Veritabanındaki parçalanmış verileri (Users, Plates, Main) burada birleştiriyoruz.

let internalState: any = {
  users: [],
  drivers: {},
  availablePlates: []
};

export const subscribeToData = (onDataUpdate: (data: any) => void) => {
  console.log("🔥 Firebase: Ayrıştırılmış Koleksiyon Modu Aktif...");

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

// ARŞİV FONKSİYONLARI (Güncel - Tarih ID'li)
export const saveDailyArchive = async (archiveData: any) => {
    if (!db) return;
    
    try {
        // 1. Bugünü YYYY-AA-GG formatında al (Döküman ID'si olacak)
        const dateId = new Date().toISOString().split('T')[0];

        const archiveRef = doc(db, "daily_archives", dateId);
        
        // 2. Veriyi hazırla
        const cleanArchive = cleanData({
            ...archiveData,
            id: dateId, 
            archiveDate: dateId 
        });
        
        // 3. KAYDET (setDoc ile özel ID kullanarak)
        await setDoc(archiveRef, cleanArchive);
        console.log(`Arşiv kaydedildi: ${dateId}`);
        
        // 4. 7 Günden eski kayıtları temizle
        const archivesCollection = collection(db, "daily_archives");
        const q = query(archivesCollection, orderBy("date", "asc"));
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
    const q = query(collection(db, "daily_archives"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getArchiveById = async (id: string) => {
    const docSnap = await getDoc(doc(db, "daily_archives", id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const isFirebaseConfigured = () => !!firebaseConfig.apiKey;