import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

// Configuration của bạn đã được cập nhật
const firebaseConfig = {
  apiKey: "AIzaSyBWRPOOTJNIbye8mR_C6Co1qMaa40l0w-4",
  authDomain: "tool-lanmg.firebaseapp.com",
  databaseURL: "https://tool-lanmg-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tool-lanmg",
  storageBucket: "tool-lanmg.firebasestorage.app",
  messagingSenderId: "344999799656",
  appId: "1:344999799656:web:dbca1ddda50277bec5c4dd",
  measurementId: "G-TRB2DTTQMG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


/**
 * Lắng nghe trạng thái Key từ xa
 */
export const listenToKeyStatus = (hwid, onUpdate) => {
  const licenseRef = ref(db, 'licenses/' + hwid);
  return onValue(licenseRef, (snapshot) => {
    const data = snapshot.val();
    onUpdate(data);
  });
};


/**
 * Lắng nghe cấu hình hệ thống thời gian thực
 */
export const listenToSystemConfig = (onUpdate) => {
  const configRef = ref(db, 'system_config');
  return onValue(configRef, (snapshot) => {
    const data = snapshot.val();
    onUpdate(data);
  });
};

export { db };
