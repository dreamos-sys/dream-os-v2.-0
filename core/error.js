// core/error.js
// Custom error classes dan fungsi utilitas

/**
 * Base custom error untuk aplikasi
 */
export class AppError extends Error {
    constructor(message, code = 'APP_ERROR', status = 500) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.status = status;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Error untuk operasi database / Supabase
 */
export class DatabaseError extends AppError {
    constructor(message, originalError) {
        super(message, 'DB_ERROR', 500);
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

/**
 * Error untuk autentikasi
 */
export class AuthError extends AppError {
    constructor(message) {
        super(message, 'AUTH_ERROR', 401);
        this.name = 'AuthError';
    }
}

/**
 * Error untuk validasi input
 */
export class ValidationError extends AppError {
    constructor(message, fields = []) {
        super(message, 'VALIDATION_ERROR', 400);
        this.name = 'ValidationError';
        this.fields = fields;
    }
}

/**
 * Fungsi untuk menangkap error async dan meneruskannya ke error collector
 * @param {Promise} promise - Promise yang mungkin reject
 * @param {string} context - Konteks error (misal: 'BookingModule')
 * @returns {Promise} - Hasil promise atau melempar error yang sudah dicatat
 */
export async function catchAsync(promise, context = 'unknown') {
    try {
        return await promise;
    } catch (err) {
        // Catat ke error collector (jika ada)
        if (window.errorCollector && typeof window.errorCollector.capture === 'function') {
            window.errorCollector.capture(err, context);
        } else {
            console.error(`[ERROR][${context}]`, err);
        }
        throw err; // tetap lempar error agar bisa ditangani lebih lanjut
    }
}
// core/error.js
import { showToast } from './components.js';

export function handleError(error, context = 'unknown') {
    console.error(`[ERROR][${context}]`, error);
    showToast('Terjadi kesalahan: ' + error.message, 'error');
    // Nanti bisa dikirim ke error collector jika ada
}
