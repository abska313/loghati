const DB_NAME = 'turkiya-learning-local';
const DB_VERSION = 1;
const STORES = ['meta', 'settings', 'progress', 'vocabulary', 'reviews', 'quizResults', 'favorites'];
let dbPromise;

function openDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('المتصفح لا يدعم IndexedDB.'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('vocabulary')) db.createObjectStore('vocabulary', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('reviews')) db.createObjectStore('reviews', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('quizResults')) db.createObjectStore('quizResults', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('favorites')) db.createObjectStore('favorites', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('تعذر فتح قاعدة البيانات المحلية.'));
    request.onblocked = () => reject(new Error('أغلق علامة تبويب أخرى للتطبيق ثم أعد المحاولة.'));
  });
  return dbPromise;
}

export async function initDatabase() {
  const db = await openDatabase();
  db.onversionchange = () => { db.close(); dbPromise = null; };
  return db;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('تعذرت عملية التخزين.'));
  });
}

export async function get(storeName, key) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readonly');
  return requestResult(tx.objectStore(storeName).get(key));
}

export async function getAll(storeName) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readonly');
  return requestResult(tx.objectStore(storeName).getAll());
}

export async function put(storeName, value) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  const request = tx.objectStore(storeName).put(value);
  return requestResult(request);
}

export async function remove(storeName, key) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  return requestResult(tx.objectStore(storeName).delete(key));
}

export async function clearStore(storeName) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  return requestResult(tx.objectStore(storeName).clear());
}

export async function exportBackup() {
  const db = await openDatabase();
  const stores = {};
  await Promise.all(STORES.map(async (name) => {
    const tx = db.transaction(name, 'readonly');
    stores[name] = await requestResult(tx.objectStore(name).getAll());
  }));
  return { app: 'turkiya-learning-local', version: DB_VERSION, exportedAt: new Date().toISOString(), stores };
}

export async function importBackup(payload, { replace = true } = {}) {
  if (!payload || payload.app !== 'turkiya-learning-local' || !payload.stores || typeof payload.stores !== 'object') {
    throw new Error('الملف ليس نسخة احتياطية صالحة لتطبيق تركيّة.');
  }
  if (payload.version !== DB_VERSION) {
    throw new Error('إصدار النسخة غير متوافق مع هذا التطبيق.');
  }
  const keyPaths = { meta:'key', settings:'key', progress:'id', vocabulary:'id', reviews:'id', quizResults:'id', favorites:'id' };
  const malformed = STORES.filter((name) => Object.prototype.hasOwnProperty.call(payload.stores, name) && !Array.isArray(payload.stores[name]));
  if (malformed.length) throw new Error(`بنية النسخة غير صالحة في المخزن: ${malformed.join('، ')}.`);
  const missing = STORES.filter((name) => !Array.isArray(payload.stores[name]));
  if (replace && missing.length) throw new Error(`النسخة ناقصة؛ لا توجد بيانات صالحة للمخازن: ${missing.join('، ')}. لم تُغيّر بياناتك الحالية.`);
  const valid = STORES.filter((name) => Array.isArray(payload.stores[name]));
  if (!valid.length) throw new Error('لا توجد مخازن بيانات صالحة في النسخة. لم تُغيّر بياناتك الحالية.');
  for (const name of valid) {
    for (const record of payload.stores[name]) {
      const key = record?.[keyPaths[name]];
      if (!record || typeof record !== 'object' || Array.isArray(record) || !['string','number'].includes(typeof key) || key === '') {
        throw new Error(`تحتوي النسخة على سجل غير صالح في ${name}. لم تُغيّر بياناتك الحالية.`);
      }
    }
  }
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const targetStores = replace ? STORES : valid;
    const tx = db.transaction(targetStores, 'readwrite');
    for (const name of targetStores) {
      const store = tx.objectStore(name);
      if (replace) store.clear();
      for (const record of payload.stores[name] || []) store.put(record);
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('تعذر استيراد النسخة.'));
    tx.onabort = () => reject(tx.error || new Error('أُلغِي استيراد النسخة.'));
  });
  return true;
}

export const storeNames = [...STORES];
