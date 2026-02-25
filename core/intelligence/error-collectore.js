// core/intelligence/error-collector.js
import { supabase } from '../supabase.js';
import { store } from '../store.js';

const originalConsoleError = console.error;
let errorBuffer = [];

console.error = (...args) => {
    try {
        captureError({ message: args.join(' '), source: 'console', severity: 'medium' });
    } catch (_) {}
    originalConsoleError.apply(console, args);
};

function captureError(errorData) {
    const user = store.get('user');
    const error = {
        ...errorData,
        error_id: generateErrorId(errorData),
        user_id: user?.key || 'anonymous',
        user_role: user?.role || 'guest',
        url: window.location.href,
        browser_info: navigator.userAgent,
        timestamp: new Date().toISOString()
    };
    errorBuffer.push(error);
    if (errorBuffer.length >= 10) flushErrors();
}

function generateErrorId(error) {
    let str = `${error.message}|${error.source}`;
    if (error.stack) str += `|${error.stack.split('\n')[0]}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}

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

setInterval(flushErrors, 5000);
window.addEventListener('unhandledrejection', (event) => {
    captureError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        source: 'unhandledrejection',
        severity: 'high'
    });
});
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
