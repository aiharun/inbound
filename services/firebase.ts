import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// ------------------------------------------------------------------
// TODO: REPLACE THIS CONFIG WITH YOUR OWN FROM FIREBASE CONSOLE
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project
// 3. Add a Web App
// 4. Copy the config object below
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

let db = null;
let docRef = null;

// Attempt to initialize Firebase only if config is updated
try {
    if (firebaseConfig.apiKey !== "AIzaSyBmOl3FTL5Jr-QnERQCmkTgl6e3HSfraH8") {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        // Single document to store the entire warehouse state for simple sync
        docRef = doc(db, "dockflow", "main_operation");
        console.log("Firebase initialized successfully");
    } else {
        console.warn("Firebase config is default. Real-time sync is disabled.");
    }
} catch (error) {
    console.error("Failed to initialize Firebase:", error);
}

export const isFirebaseConfigured = () => !!db && !!docRef;

export const subscribeToData = (onData: (data: any) => void) => {
    if (!docRef) return () => {};
    
    console.log("Subscribing to Firestore updates...");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            onData(docSnap.data());
        } else {
            // Document doesn't exist yet (fresh install)
            onData(null);
        }
    }, (error) => {
        console.error("Firestore sync error:", error);
    });

    return unsubscribe;
};

export const updateData = async (data: any) => {
    if (!docRef) return;
    // Merge allow us to update specific top-level fields (like vehicles array) 
    // without overwriting others if we pass partial objects
    try {
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating data:", error);
    }
};

export const resetCloudData = async (data: any) => {
    if (!docRef) return;
    // Set without merge overwrites the entire document
    await setDoc(docRef, data);
};