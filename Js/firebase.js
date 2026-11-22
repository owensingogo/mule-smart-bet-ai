import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
export const firebaseConfig = {
 apiKey: "AIzaSyCjf5C-1Et7bAtQmoztKqKKdJCc0wAuiCI",
 authDomain: "mule-smart-bet-al.firebaseapp.com",
 projectId: "mule-smart-bet-al",
 storageBucket: "mule-smart-bet-al.firebasestorage.app",
 messagingSenderId: "76542227639",
 appId: "1:76542227639:web:ff50fe9d31f46ee5a4c932"
};
const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);
