const DB_NAME = 'loghati';
const DB_VER = 1;
const STORES = ['kv', 'progress', 'settings', 'cards', 'mistakes'];

let dbPromise = null;
let memFallback = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('no-idb'));
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(err => {
    console.warn('IndexedDB unavailable, fallback to localStorage:', err.message);
    memFallback = {
      _m: JSON.parse(localStorage.getItem('loghati-fb') || '{}'),
      _save() { try { localStorage.setItem('loghati-fb', JSON.stringify(this._m)); } catch {} },
      async get(store, key) { return this._m[store]?.[key]; },
      async put(store, key, val) { (this._m[store] ||= {})[key] = val; this._save(); },
      async del(store, key) { if (this._m[store]) delete this._m[store][key]; this._save(); },
      async all(store) { return Object.values(this._m[store] || {}); }
    };
    return memFallback;
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await open();
  if (db === memFallback) return fn(memFallback);
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    try { result = fn({
      get: k => wrap(s.get(k)),
      put: (k, v) => wrap(s.put(v, k)),
      del: k => wrap(s.delete(k)),
      all: () => wrap(s.getAll()),
      clear: () => wrap(s.clear())
    }); } catch (e) { return reject(e); }
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  });
}

function wrap(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export const DB = {
  async get(store, key) {
    const db = await open();
    if (db === memFallback) return memFallback.get(store, key);
    return tx(store, 'readonly', s => s.get(key));
  },
  async put(store, key, val) {
    const db = await open();
    if (db === memFallback) return memFallback.put(store, key, val);
    return tx(store, 'readwrite', s => s.put(key, val));
  },
  async del(store, key) {
    const db = await open();
    if (db === memFallback) return memFallback.del(store, key);
    return tx(store, 'readwrite', s => s.del(key));
  },
  async all(store) {
    const db = await open();
    if (db === memFallback) return memFallback.all(store);
    return tx(store, 'readonly', s => s.all());
  },
  async clear() {
    const db = await open();
    if (db === memFallback) { memFallback._m = {}; memFallback._save(); return; }
    for (const st of STORES) await tx(st, 'readwrite', s => s.clear());
  }
};
