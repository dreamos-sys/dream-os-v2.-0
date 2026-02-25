import { showToast } from './components.js';
import { supabase } from './supabase.js';

export class AppError extends Error {
    constructor(message, code, status = 500) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

export function handleError(error) {
    console.error(error);
    if (error instanceof AppError) {
        showToast(error.message, 'error');
        // Log error ke database (opsional)
        supabase.from('error_logs').insert([{
            message: error.message,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }]).then();
    } else {
        showToast('Terjadi kesalahan sistem', 'error');
        supabase.from('error_logs').insert([{
            message: error.message || 'Unknown error',
            stack: error.stack,
            timestamp: new Date().toISOString()
        }]).then();
    }
}
