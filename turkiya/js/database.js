const DB_NAME = 'turkiya-learning-local';
const DB_VERSION = 2;
const STORES = ['meta', 'settings', 'progress', 'vocabulary', 'reviews', 'quizResults', 'favorites', 'youtubeLessons'];
const LANGUAGE_SCOPED_STORES = new Set(['progress', 'vocabulary', 'reviews', 'quizResults', 'favorites', 'youtubeLessons']);
const LEGACY_APP = 'turkiya-learning-local';
const CURRENT_APP = 'loghati-language-platform';
let dbPromise;

function activeLanguageId() {
  try { return localStorage.getItem('loghati-active-language') || 'tr'; }
  catch { return 'tr'; }
}

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
      if (!db.objectStoreNames.contains('youtubeLessons')) db.createObjectStore('youtubeLessons', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = null; reject(request.error || new Error('تعذر فتح قاعدة البيانات المحلية.')); };
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
  const record = await requestResult(tx.objectStore(storeName).get(key));
  if (record && LANGUAGE_SCOPED_STORES.has(storeName)) {
    const languageId = activeLanguageId();
    if (record.languageId !== languageId && !(languageId === 'tr' && !record.languageId)) return undefined;
  }
  return record;
}

export async function getAll(storeName) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readonly');
  const records = await requestResult(tx.objectStore(storeName).getAll());
  if (!LANGUAGE_SCOPED_STORES.has(storeName)) return records;
  const languageId = activeLanguageId();
  return records.filter((record) => record.languageId === languageId || (languageId === 'tr' && !record.languageId));
}

export async function put(storeName, value) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  const record = LANGUAGE_SCOPED_STORES.has(storeName) && !value.languageId
    ? { ...value, languageId: activeLanguageId() }
    : value;
  return requestResult(tx.objectStore(storeName).put(record));
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
  return { app: CURRENT_APP, version: DB_VERSION, exportedAt: new Date().toISOString(), stores };
}

function normalizeBackup(payload) {
  const isLegacy = payload?.app === LEGACY_APP && payload?.version === 1;
  const isCurrent = payload?.app === CURRENT_APP && payload?.version === DB_VERSION;
  if (!isLegacy && !isCurrent) throw new Error('الملف ليس نسخة احتياطية متوافقة مع منصة لغتي.');
  if (!payload.stores || typeof payload.stores !== 'object') throw new Error('لا تحتوي النسخة على مخازن بيانات صالحة.');
  const stores = { ...payload.stores };
  if (isLegacy) {
    stores.youtubeLessons = [];
    for (const name of LANGUAGE_SCOPED_STORES) {
      stores[name] = (Array.isArray(stores[name]) ? stores[name] : []).map((record) => ({ ...record, languageId: 'tr' }));
    }
  }
  return { stores, isLegacy };
}

export async function importBackup(payload, { replace = true } = {}) {
  const normalized = normalizeBackup(payload);
  const stores = normalized.stores;
  const keyPaths = { meta:'key', settings:'key', progress:'id', vocabulary:'id', reviews:'id', quizResults:'id', favorites:'id', youtubeLessons:'id' };
  const malformed = STORES.filter((name) => Object.prototype.hasOwnProperty.call(stores, name) && !Array.isArray(stores[name]));
  if (malformed.length) throw new Error(`بنية النسخة غير صالحة في المخزن: ${malformed.join('، ')}.`);
  const missing = STORES.filter((name) => !Array.isArray(stores[name]));
  if (replace && missing.length) throw new Error(`النسخة ناقصة؛ لا توجد بيانات صالحة للمخازن: ${missing.join('، ')}. لم تُغيّر بياناتك الحالية.`);
  const valid = STORES.filter((name) => Array.isArray(stores[name]));
  if (!valid.length) throw new Error('لا توجد مخازن بيانات صالحة في النسخة. لم تُغيّر بياناتك الحالية.');
  for (const name of valid) {
    for (const record of stores[name]) {
      const key = record?.[keyPaths[name]];
      if (!record || typeof record !== 'object' || Array.isArray(record) || !['string', 'number'].includes(typeof key) || key === '') {
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
      for (const record of stores[name] || []) store.put(record);
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('تعذر استيراد النسخة.'));
    tx.onabort = () => reject(tx.error || new Error('أُلغِي استيراد النسخة.'));
  });
  return { ok: true, migratedFrom: normalized.isLegacy ? 1 : DB_VERSION };
}

export const storeNames = [...STORES];
