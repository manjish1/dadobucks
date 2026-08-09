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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// The admin passcode required to add/subtract Dado Bucks.
const ADMIN_PASSCODE = "6590";
