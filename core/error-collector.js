// core/intelligence/error-collector.js
// Mengumpulkan error dari seluruh aplikasi dan menyimpannya ke tabel error_logs

import { supabase } from '../supabase.js';
import { eventBus } from '../eventBus.js';

class ErrorCollector {
    constructor() {
        this.enabled = true;
        this.buffer = [];
        this.flushInterval = 5000; // 5 detik
        this.maxBufferSize = 20;
        this.init();
    }

    init() {
        // Kirim buffer secara periodik
        setInterval(() => this.flush(), this.flushInterval);
        // Listen event error dari modul lain
        eventBus.on('system-error', (data) => this.capture(data.error, data.context));
        console.log('[ErrorCollector] Initialized');
    }

    /**
     * Menangkap error dan menyimpannya ke buffer
     * @param {Error|string} error - Error object atau pesan string
     * @param {string} context - Konteks tempat error terjadi
     * @param {Object} metadata - Data tambahan (opsional)
     */
    capture(error, context = 'unknown', metadata = {}) {
        if (!this.enabled) return;

        const errorLog = {
            timestamp: new Date().toISOString(),
            context,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : null,
            code: error.code || null,
            metadata,
            url: window.location.href,
            user_id: supabase.auth.user()?.id || null
        };

        this.buffer.push(errorLog);
        console.warn('[ErrorCollector] Captured:', errorLog.message);

        // Jika buffer penuh, segera flush
        if (this.buffer.length >= this.maxBufferSize) {
            this.flush();
        }
    }

    /**
     * Mengirim buffer ke Supabase
     */
    async flush() {
        if (this.buffer.length === 0) return;

        const logs = [...this.buffer];
        this.buffer = []; // kosongkan buffer

        try {
            const { error } = await supabase
                .from('error_logs')
                .insert(logs);

            if (error) {
                console.error('[ErrorCollector] Failed to insert logs:', error);
                // Kembalikan ke buffer? Bisa diimplementasikan jika perlu
            } else {
                console.log(`[ErrorCollector] Flushed ${logs.length} error(s)`);
            }
        } catch (err) {
            console.error('[ErrorCollector] Error while flushing:', err);
        }
    }

    /**
     * Mendapatkan semua error dari database (untuk developer panel)
     */
    async getErrors(limit = 100) {
        const { data, error } = await supabase
            .from('error_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }
}

// Ekspor instance tunggal (singleton)
export const errorCollector = new ErrorCollector();

// Pasang ke window agar bisa diakses dari modul mana pun
window.errorCollector = errorCollector;
