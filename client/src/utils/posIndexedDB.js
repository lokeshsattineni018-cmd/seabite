// posIndexedDB.js
// Utility to handle offline POS order queueing in IndexedDB

const DB_NAME = "SeaBitePOS";
const DB_VERSION = 1;
const STORE_NAME = "offlineOrders";

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (e) => {
      resolve(e.target.result);
    };

    request.onerror = (e) => {
      reject("IndexedDB failed to open: " + e.target.error);
    };
  });
}

export async function saveOfflineOrder(order) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(order);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject("Failed to save offline order: " + e.target.error);
  });
}

export async function getOfflineOrders() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject("Failed to fetch offline orders: " + e.target.error);
  });
}

export async function deleteOfflineOrder(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject("Failed to delete offline order: " + e.target.error);
  });
}

export async function clearOfflineOrders() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject("Failed to clear offline orders: " + e.target.error);
  });
}
