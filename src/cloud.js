// Account + cloud sync (Firebase Auth + Firestore).
//
// What is synced: every localStorage key that starts with "azurite" or "cxess",
// except caches and temporary state (see isSyncKey). Each key is one Firestore
// document: users/{uid}/kv/{encodedKey} = { v: <string>, t: <ms timestamp> }.
// Conflict rule: per key, the newest write wins. A key that was never written
// on this device since sync existed counts as "old", so the account's copy wins.
// When data from the cloud changes this device, the page reloads once so the
// app picks it up.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6_DciBK8zMr55PY2O0jHtuEumcf-TDj4",
  authDomain: "chess-numan.firebaseapp.com",
  projectId: "chess-numan",
  storageBucket: "chess-numan.firebasestorage.app",
  messagingSenderId: "805045246482",
  appId: "1:805045246482:web:07e8fb1fb42b65026256cb",
};

const META_KEY = "azurite-sync-meta"; // { key: lastLocalWriteMs } (never synced)
const MAX_VALUE = 900_000; // Firestore documents are limited to 1 MB

export function isSyncKey(key) {
  if (!/^(azurite|cxess)/i.test(key)) return false;
  if (key === META_KEY) return false;
  // caches / temporary state stay on this device
  return !/(eval|cache|bot-game|profile-tab|sync)/i.test(key);
}

let app, auth, db;
let user = null;
let applyingRemote = false;
let syncing = false;
const dirty = new Set();
let timer = null;
const listeners = new Set();
let status = { state: "signed-out", message: "" };

const rawGet = Storage.prototype.getItem;
const rawSet = Storage.prototype.setItem;
const rawRemove = Storage.prototype.removeItem;

function readMeta() {
  try {
    return JSON.parse(rawGet.call(localStorage, META_KEY)) || {};
  } catch {
    return {};
  }
}
function writeMeta(meta) {
  try {
    rawSet.call(localStorage, META_KEY, JSON.stringify(meta));
  } catch {}
}
function touch(key) {
  const meta = readMeta();
  meta[key] = Date.now();
  writeMeta(meta);
}

function setStatus(state, message = "") {
  status = { state, message };
  listeners.forEach((fn) => fn(status, user));
}
export function onCloudChange(fn) {
  listeners.add(fn);
  fn(status, user);
}

const docId = (key) => encodeURIComponent(key);
const kv = (uid) => collection(db, "users", uid, "kv");

// Track local writes so they can be pushed later.
function hookStorage() {
  Storage.prototype.setItem = function (key, value) {
    rawSet.call(this, key, value);
    if (this === localStorage && !applyingRemote && isSyncKey(String(key))) {
      touch(String(key));
      dirty.add(String(key));
      schedulePush();
    }
  };
  Storage.prototype.removeItem = function (key) {
    rawRemove.call(this, key);
    if (this === localStorage && !applyingRemote && isSyncKey(String(key))) {
      touch(String(key));
      dirty.add(String(key));
      schedulePush();
    }
  };
}

function schedulePush() {
  if (!user) return;
  clearTimeout(timer);
  timer = setTimeout(pushDirty, 2000);
}

async function pushDirty() {
  if (!user || syncing || !dirty.size) return;
  const keys = [...dirty];
  dirty.clear();
  const meta = readMeta();
  try {
    for (const key of keys) {
      const value = rawGet.call(localStorage, key);
      const ref = doc(db, "users", user.uid, "kv", docId(key));
      if (value === null) await deleteDoc(ref);
      else if (value.length <= MAX_VALUE)
        await setDoc(ref, { k: key, v: value, t: meta[key] || Date.now() });
    }
    setStatus("synced", "All changes saved to your account.");
  } catch (e) {
    keys.forEach((k) => dirty.add(k));
    setStatus("error", `Sync failed: ${e.message}`);
  }
}

// Called after login: merge this device with the account.
async function fullSync() {
  if (!user) return;
  syncing = true;
  setStatus("syncing", "Syncing…");
  try {
    const snap = await getDocs(kv(user.uid));
    const cloud = {};
    snap.forEach((d) => {
      const x = d.data();
      if (x && typeof x.k === "string") cloud[x.k] = x;
    });

    const meta = readMeta();
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (isSyncKey(k)) localKeys.push(k);
    }

    let changedLocal = false;
    const toUpload = [];
    const all = new Set([...localKeys, ...Object.keys(cloud)]);

    for (const key of all) {
      if (!isSyncKey(key)) continue;
      const c = cloud[key];
      const lv = rawGet.call(localStorage, key);
      const lt = meta[key] || 0;
      if (c && lv !== null && c.v === lv) continue;
      if (c && (lv === null || (c.t || 0) > lt)) {
        applyingRemote = true;
        try {
          rawSet.call(localStorage, key, c.v);
        } finally {
          applyingRemote = false;
        }
        meta[key] = c.t || Date.now();
        changedLocal = true;
      } else if (lv !== null) {
        toUpload.push(key);
        if (!lt) meta[key] = Date.now();
      }
    }
    writeMeta(meta);
    toUpload.forEach((k) => dirty.add(k));
    syncing = false;
    await pushDirty();

    if (changedLocal) {
      setStatus("synced", "Loaded your data from the account. Reloading…");
      setTimeout(() => location.reload(), 600);
    } else {
      setStatus("synced", "Your data is up to date.");
    }
  } catch (e) {
    syncing = false;
    setStatus("error", `Sync failed: ${e.message}`);
  }
}

const ERRORS = {
  "auth/invalid-credential": "Wrong e-mail or password.",
  "auth/user-not-found": "No account with this e-mail.",
  "auth/wrong-password": "Wrong password.",
  "auth/email-already-in-use": "This e-mail already has an account.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Invalid e-mail address.",
  "auth/popup-closed-by-user": "Sign-in window was closed.",
  "auth/unauthorized-domain":
    "This website address is not allowed yet. Add it under Firebase → Authentication → Settings → Authorized domains.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/operation-not-allowed":
    "This sign-in method is not enabled. Firebase → Authentication → Sign-in method: turn on Google and Email/Password.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-blocked":
    "The browser blocked the sign-in window. Allow pop-ups for this site.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "Invalid Firebase API key.",
};
const nice = (e) => {
  if (ERRORS[e.code]) return ERRORS[e.code];
  if (location.hostname === "127.0.0.1" || location.protocol === "file:")
    return `Open the site as http://localhost:PORT instead of ${location.host || "a file"}; Firebase does not accept this address. (${e.code || e.message})`;
  return `${e.code || ""} ${e.message}`.trim();
};

export async function signInGoogle() {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    setStatus("error", nice(e));
  }
}
export async function signInEmail(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    setStatus("error", nice(e));
  }
}
export async function signUpEmail(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    setStatus("error", nice(e));
  }
}
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    setStatus("signed-out", "Password reset e-mail sent.");
  } catch (e) {
    setStatus("error", nice(e));
  }
}
export async function logOut() {
  await pushDirty();
  await signOut(auth);
}
export const currentUser = () => user;

export function initCloud() {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    setStatus("error", `Cloud unavailable: ${e.message}`);
    return;
  }
  hookStorage();
  onAuthStateChanged(auth, (u) => {
    user = u;
    if (u) fullSync();
    else setStatus("signed-out", "");
  });
  window.addEventListener("online", () => {
    if (user) pushDirty();
  });
  window.addEventListener("beforeunload", () => {
    if (user && dirty.size) pushDirty();
  });
}
