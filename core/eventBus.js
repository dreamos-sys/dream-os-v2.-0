// core/eventBus.js
// Event bus sederhana dengan pattern pub/sub

const events = {};

export const eventBus = {
    /**
     * Mendaftarkan listener untuk suatu event
     * @param {string} event - Nama event
     * @param {Function} callback - Fungsi yang akan dipanggil saat event di-trigger
     */
    on(event, callback) {
        if (!events[event]) {
            events[event] = [];
        }
        events[event].push(callback);
        console.log(`[eventBus] Listener registered for "${event}"`);
    },

    /**
     * Menghapus listener tertentu
     * @param {string} event - Nama event
     * @param {Function} callback - Fungsi yang akan dihapus (opsional, jika tidak ada hapus semua)
     */
    off(event, callback) {
        if (!events[event]) return;
        if (callback) {
            events[event] = events[event].filter(cb => cb !== callback);
        } else {
            delete events[event];
        }
        console.log(`[eventBus] Listener removed for "${event}"`);
    },

    /**
     * Memicu event dengan data tertentu
     * @param {string} event - Nama event
     * @param {any} data - Data yang akan dikirim ke listener
     */
    emit(event, data) {
        if (!events[event]) {
            console.log(`[eventBus] Event "${event}" emitted but no listeners.`);
            return;
        }
        console.log(`[eventBus] Emitting "${event}" with data:`, data);
        events[event].forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error(`[eventBus] Error in listener for "${event}":`, err);
            }
        });
    },

    /**
     * Menghapus semua event (untuk testing/cleanup)
     */
    clear() {
        Object.keys(events).forEach(key => delete events[key]);
        console.log('[eventBus] All events cleared');
    }
};
