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
 * Cập nhật Key lên Cloud cho một HWID cụ thể
 */
export const syncKeyToCloud = async (hwid, data) => {
  try {
    const licenseRef = ref(db, 'licenses/' + hwid);
    await set(licenseRef, data);
    console.log(`Cloud: Đã đồng bộ HWID ${hwid}`);
  } catch (error) {
    console.error("Cloud Error:", error);
  }
};

/**
 * Thu hồi Key trên Cloud (Kick-out)
 */
export const revokeKeyFromCloud = async (hwid) => {
  try {
    const licenseRef = ref(db, 'licenses/' + hwid);
    await remove(licenseRef);
    console.log(`Cloud: Đã thu hồi (KICK) HWID ${hwid}`);
  } catch (error) {
    console.error("Cloud Revoke Error:", error);
  }
};

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
 * Cập nhật cấu hình hệ thống (Version, Download URL)
 */
export const syncSystemConfig = async (data) => {
  try {
    const configRef = ref(db, 'system_config');
    await set(configRef, data);
    console.log("Cloud: Đã cập nhật cấu hình hệ thống");
  } catch (error) {
    console.error("Cloud System Config Error:", error);
  }
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
