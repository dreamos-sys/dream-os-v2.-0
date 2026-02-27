// core/intelligence/error-collector.js
import { supabase } from '../supabase.js';
import { store } from '../store.js';

const originalConsoleError = console.error;
let errorBuffer = [];

// Override console.error dengan safety
console.error = (...args) => {
    try {
        captureError({ message: args.join(' '), source: 'console', severity: 'medium' });
    } catch (_) {}
    originalConsoleError.apply(console, args);
};

// Fungsi untuk mendapatkan modul aktif saat ini (bisa dari router atau state)
function getCurrentActiveModules() {
    // Coba ambil dari store jika ada, atau dari URL
    const path = window.location.hash || window.location.pathname;
    return [path] || [];
}

// Generate error ID dengan normalisasi line number
function generateErrorId(error) {
    // Normalisasi: hilangkan angka baris dan lokasi stack
    const normalized = (error.message || '')
        .replace(/line \d+/gi, 'line X')
        .replace(/\bat\s+.+:\d+:\d+/g, '');
    
    const str = `${normalized}|${error.source || 'unknown'}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}

// Capture error dengan metadata
function captureError(errorData) {
    const user = store.get('user');
    const error = {
        ...errorData,
        error_id: generateErrorId(errorData),
        user_id: user?.key || 'anonymous',
        user_role: user?.role || 'guest',
        url: window.location.href,
        browser_info: navigator.userAgent,
        timestamp: new Date().toISOString(),
        metadata: {
            session_id: sessionStorage.getItem('dream_session'),
            last_actions: store.get('action_history')?.slice(-5) || [],
            component_tree: getCurrentActiveModules()
        }
    };
    errorBuffer.push(error);
    if (errorBuffer.length >= 10) flushErrors();
}

// Kirim error ke Supabase (batch)
async function flushErrors() {
    if (errorBuffer.length === 0) return;
    const errors = [...errorBuffer];
    errorBuffer = [];
    try {
        await supabase.from('error_logs').insert(errors);
    } catch (err) {
        console.warn('Failed to save errors, saving to localStorage');
        localStorage.setItem('pending_errors', JSON.stringify(errors));
    }
}

// Flush tiap 5 detik
setInterval(flushErrors, 5000);

// Tangkap unhandled rejection
window.addEventListener('unhandledrejection', (event) => {
    captureError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        source: 'unhandledrejection',
        severity: 'high'
    });
});

// Tangkap error global
window.addEventListener('error', (event) => {
    captureError({
        message: event.message,
        stack: event.error?.stack,
        source: 'global',
        filename: event.filename,
        lineno: event.lineno,
        severity: 'high'
    });
});

export const errorCollector = { captureError };
