const DB_NAME = "collection";
const DB_VERSION = 1;

export const STORES = {
    ROMS: "roms",
    SAVES: "saves",
    STATES: "states",
    SETTINGS: "settings"
};

let dbPromise;

export async function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = ({ target }) => {
            const db = target.result;

            createStore(db, STORES.ROMS, "sha256");
            createStore(db, STORES.SAVES, "sha256");
            createStore(db, STORES.STATES, "id");
            createStore(db, STORES.SETTINGS, "key");
        };

        request.onsuccess = ({ target }) => resolve(target.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
}

function createStore(db, name, keyPath) {
    if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, { keyPath });
    }
}

function transaction(storeName, mode = "readonly") {
    return openDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
}

function requestPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function put(storeName, value) {
    const store = await transaction(storeName, "readwrite");
    return requestPromise(store.put(value));
}

export async function get(storeName, key) {
    const store = await transaction(storeName);
    return requestPromise(store.get(key));
}

export async function getAll(storeName) {
    const store = await transaction(storeName);
    return requestPromise(store.getAll());
}

export async function remove(storeName, key) {
    const store = await transaction(storeName, "readwrite");
    return requestPromise(store.delete(key));
}

export async function clear(storeName) {
    const store = await transaction(storeName, "readwrite");
    return requestPromise(store.clear());
}

export const saveRom = rom =>
    put(STORES.ROMS, rom);

export const loadRom = sha256 =>
    get(STORES.ROMS, sha256);

export const loadAllRoms = () =>
    getAll(STORES.ROMS);

export const deleteRom = sha256 =>
    remove(STORES.ROMS, sha256);