// core/eventBus.js
/**
 * 🧠 Dream OS Event Bus
 * Menghubungkan semua modul secara real-time
 */

export const eventBus = {
    /**
     * Mendaftarkan listener untuk suatu event
     * @param {string} event - Nama event (contoh: 'k3-report')
     * @param {Function} callback - Fungsi yang dipanggil saat event terjadi
     */
    on(event, callback) {
        document.addEventListener(event, (e) => callback(e.detail));
    },

    /**
     * Memancarkan event ke seluruh sistem
     * @param {string} event - Nama event
     * @param {any} data - Data yang dikirim
     */
    emit(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
};
