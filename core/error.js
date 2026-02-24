import { showToast } from './components.js';

export class AppError extends Error {
    constructor(message, code, status = 500) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

export function handleError(error) {
    if (error instanceof AppError) {
        showToast(error.message, 'error');
        console.error(`[AppError ${error.code}]`, error.message);
    } else {
        showToast('Terjadi kesalahan sistem. Silakan coba lagi.', 'error');
        console.error('Unexpected error:', error);
    }
}
