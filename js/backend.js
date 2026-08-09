// ============================================================
// Data layer for Dado Bucks Bank — multi-profile edition.
//
// Every kid gets their own profile: { name, passcodeHash, balance }
// plus a "transactions" subcollection. If a real Firebase config has
// been filled into config.js, everything lives in Firestore (synced
// across every device). Until then, it automatically falls back to
// this browser's localStorage so you can preview and test right away.
// ============================================================

const USE_FIREBASE = firebaseConfig.apiKey !== "YOUR_API_KEY";

const LOCAL_KEY = "dadoBucksData";

// sha256("6590") — used only to seed a demo "Neil" profile in local mode
// so it mirrors the real site.
const DEFAULT_PASSCODE_HASH = "6033790b521dfe27633535481153d6bb909de630ab821568ada45e71ad3b438e";

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function slugify(name) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
  return base || "kid";
}

function readLocal() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw) return JSON.parse(raw);
  const initial = { profiles: { neil: { name: "Neil", passcodeHash: DEFAULT_PASSCODE_HASH, balance: 0, transactions: [] } } };
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

  // callback([{id,name}]) — list of all kid profiles
  subscribeProfiles(callback) {
    if (USE_FIREBASE) {
      return db.collection("profiles").orderBy("createdAt", "asc").onSnapshot((snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
      });
    } else {
      const handler = () => {
        const data = readLocal();
        callback(Object.keys(data.profiles).map((id) => ({ id, name: data.profiles[id].name })));
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

  // -> Promise<string|null> profile display name, or null if it doesn't exist
  async getProfileName(profileId) {
    if (USE_FIREBASE) {
      const doc = await db.collection("profiles").doc(profileId).get();
      return doc.exists ? doc.data().name : null;
    } else {
      const data = readLocal();
      return data.profiles[profileId] ? data.profiles[profileId].name : null;
    }
  },

  // { name, passcode } -> Promise<string> new profile id
  async createProfile({ name, passcode }) {
    const passcodeHash = await sha256(passcode);

    if (USE_FIREBASE) {
      let id = slugify(name);
      let suffix = 2;
      while ((await db.collection("profiles").doc(id).get()).exists) {
        id = `${slugify(name)}-${suffix++}`;
      }
      await db.collection("profiles").doc(id).set({
        name,
        passcodeHash,
        balance: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return id;
    } else {
      const data = readLocal();
      let id = slugify(name);
      let suffix = 2;
      while (data.profiles[id]) {
        id = `${slugify(name)}-${suffix++}`;
      }
      data.profiles[id] = { name, passcodeHash, balance: 0, transactions: [] };
      writeLocal(data);
      return id;
    }
  },

  // -> Promise<boolean>
  async verifyPasscode(profileId, passcode) {
    const enteredHash = await sha256(passcode || "");
    if (USE_FIREBASE) {
      const doc = await db.collection("profiles").doc(profileId).get();
      return doc.exists && doc.data().passcodeHash === enteredHash;
    } else {
      const data = readLocal();
      const profile = data.profiles[profileId];
      return !!profile && profile.passcodeHash === enteredHash;
    }
  },

  // callback(balance:number)
  subscribeBalance(profileId, callback) {
    if (USE_FIREBASE) {
      return db.collection("profiles").doc(profileId).onSnapshot((doc) => {
        callback(doc.exists ? doc.data().balance : 0);
      });
    } else {
      const handler = () => {
        const data = readLocal();
        callback(data.profiles[profileId] ? data.profiles[profileId].balance : 0);
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

  // callback(transactions:[{id,title,amount,type,date}]) newest first
  subscribeTransactions(profileId, callback, max) {
    if (USE_FIREBASE) {
      let q = db.collection("profiles").doc(profileId).collection("transactions").orderBy("date", "desc");
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
        const profile = data.profiles[profileId];
        const sorted = profile ? [...profile.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
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

  // profileId, { title, amount, type: 'credit'|'debit' } -> Promise
  async addTransaction(profileId, { title, amount, type }) {
    const signedAmount = type === "credit" ? Math.abs(amount) : -Math.abs(amount);

    if (USE_FIREBASE) {
      const profileRef = db.collection("profiles").doc(profileId);
      await db.runTransaction(async (t) => {
        const doc = await t.get(profileRef);
        const currentBalance = doc.exists ? doc.data().balance : 0;
        const newBalance = currentBalance + signedAmount;
        if (newBalance < 0) throw new Error("INSUFFICIENT_FUNDS");
        t.set(profileRef, { balance: newBalance }, { merge: true });
        const txnRef = profileRef.collection("transactions").doc();
        t.set(txnRef, {
          title,
          amount: Math.abs(amount),
          type,
          date: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    } else {
      const data = readLocal();
      const profile = data.profiles[profileId];
      if (!profile) throw new Error("PROFILE_NOT_FOUND");
      const newBalance = profile.balance + signedAmount;
      if (newBalance < 0) throw new Error("INSUFFICIENT_FUNDS");
      profile.balance = newBalance;
      profile.transactions.push({
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
