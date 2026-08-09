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

// The admin passcode required to add/subtract Dado Bucks, stored as a
// SHA-256 hash so it isn't sitting in plain text in the page source.
// To change it, run this in your browser's console with your new code:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEWCODE')).then(h => console.log([...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('')))
// then paste the printed hash below.
const ADMIN_PASSCODE_HASH = "6033790b521dfe27633535481153d6bb909de630ab821568ada45e71ad3b438e";
