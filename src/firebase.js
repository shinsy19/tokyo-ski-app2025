// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCf1-qTtqt7WpK7TCz6_EKXOQybnegUpWk",
  authDomain: "tokyo2025-d68d2.firebaseapp.com",
  projectId: "tokyo2025-d68d2",
  storageBucket: "tokyo2025-d68d2.firebasestorage.com",
  messagingSenderId: "854480200830",
  appId: "1:854480200830:web:2cfa2a74abbcca7cec642f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ 處理離線狀態 (Offline Persistence)
// 讓使用者在雪場訊號不佳時仍能看到行程
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.log("多個分頁開啟，離線功能僅能在一個分頁運作");
    } else if (err.code === 'unimplemented') {
        console.log("瀏覽器不支援離線儲存");
    }
});