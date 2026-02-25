import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

const DB_NAME = 'dreamos-offline';
const DB_VERSION = 1;

let dbPromise;

export async function initDB() {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('pending')) {
                db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('sync')) {
                db.createObjectStore('sync', { keyPath: 'id', autoIncrement: true });
            }
        }
    });
}

export async function saveOffline(table, data) {
    const db = await dbPromise;
    await db.add('pending', { table, data, timestamp: Date.now() });
}

export async function getOffline(table, id) {
    // not implemented fully, for simplicity we return null
    return null;
}

export async function syncOffline() {
    const db = await dbPromise;
    const pending = await db.getAll('pending');
    for (let item of pending) {
        try {
            const { error } = await supabase.from(item.table).insert([item.data]);
            if (!error) {
                await db.delete('pending', item.id);
            }
        } catch (e) {
            console.warn('Sync error', e);
        }
    }
}

// panggil initDB saat startup
initDB();
