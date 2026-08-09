// ============================================================
// Dado Bucks Bank — Firebase configuration
//
// 1. Go to https://console.firebase.google.com and create a
//    free project (no credit card needed).
// 2. In the project, click "Build > Firestore Database" and
//    create a database (choose "Start in test mode").
// 3. Click the gear icon > Project settings > scroll to
//    "Your apps" > click the </> (web) icon to register a web app.
// 4. Copy the firebaseConfig object it gives you and paste the
//    values below, replacing the placeholders.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyD60U89ohY8xEO1oScFQ_STZ94Dgrov4S0",
  authDomain: "dado-bucks-bank.firebaseapp.com",
  projectId: "dado-bucks-bank",
  storageBucket: "dado-bucks-bank.firebasestorage.app",
  messagingSenderId: "862382999377",
  appId: "1:862382999377:web:dc5a3fee20a9d90024b570"
};

// The admin passcode required to add/subtract Dado Bucks.
const ADMIN_PASSCODE = "6590";
