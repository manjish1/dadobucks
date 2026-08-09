// ============================================================
// Data layer for Dado Bucks Bank.
//
// If a real Firebase config has been filled into config.js, all
// data is stored live in Firestore (synced across every device).
// Until then, the app automatically falls back to this browser's
// localStorage so you can preview and test everything right away.
// ============================================================

const USE_FIREBASE = firebaseConfig.apiKey !== "YOUR_API_KEY";

const LOCAL_KEY = "dadoBucksData";

function readLocal() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw) return JSON.parse(raw);
  const initial = { balance: 0, transactions: [] };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(initial));
  return initial;
}

function writeLocal(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("dado-local-update"));
}

let db = null;
if (USE_FIREBASE) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

const Backend = {
  mode: USE_FIREBASE ? "firebase" : "local",

  // callback(balance:number)
  subscribeBalance(callback) {
    if (USE_FIREBASE) {
      return db.collection("bank").doc("main").onSnapshot((doc) => {
        callback(doc.exists ? doc.data().balance : 0);
      });
    } else {
      const handler = () => callback(readLocal().balance);
      handler();
      window.addEventListener("dado-local-update", handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("dado-local-update", handler);
        window.removeEventListener("storage", handler);
      };
    }
  },

  // callback(transactions:[{id,title,amount,type,date}]) newest first
  subscribeTransactions(callback, max) {
    if (USE_FIREBASE) {
      let q = db.collection("bank").doc("main").collection("transactions").orderBy("date", "desc");
      if (max) q = q.limit(max);
      return q.onSnapshot((snap) => {
        const txns = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title,
            amount: data.amount,
            type: data.type,
            date: data.date && data.date.toDate ? data.date.toDate() : new Date(data.date)
          };
        });
        callback(txns);
      });
    } else {
      const handler = () => {
        const data = readLocal();
        const sorted = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        callback(max ? sorted.slice(0, max) : sorted);
      };
      handler();
      window.addEventListener("dado-local-update", handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("dado-local-update", handler);
        window.removeEventListener("storage", handler);
      };
    }
  },

  // { title, amount, type: 'credit'|'debit' } -> Promise
  async addTransaction({ title, amount, type }) {
    const signedAmount = type === "credit" ? Math.abs(amount) : -Math.abs(amount);

    if (USE_FIREBASE) {
      const mainRef = db.collection("bank").doc("main");
      await db.runTransaction(async (t) => {
        const doc = await t.get(mainRef);
        const currentBalance = doc.exists ? doc.data().balance : 0;
        const newBalance = currentBalance + signedAmount;
        if (newBalance < 0) throw new Error("INSUFFICIENT_FUNDS");
        t.set(mainRef, { balance: newBalance }, { merge: true });
        const txnRef = mainRef.collection("transactions").doc();
        t.set(txnRef, {
          title,
          amount: Math.abs(amount),
          type,
          date: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    } else {
      const data = readLocal();
      const newBalance = data.balance + signedAmount;
      if (newBalance < 0) throw new Error("INSUFFICIENT_FUNDS");
      data.balance = newBalance;
      data.transactions.push({
        id: Date.now().toString(),
        title,
        amount: Math.abs(amount),
        type,
        date: new Date().toISOString()
      });
      writeLocal(data);
    }
  }
};
