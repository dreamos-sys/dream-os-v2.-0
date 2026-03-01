const STORE_KEY = 'dreamos_store';

let state = { user: null };

try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) state = JSON.parse(saved);
} catch (e) {}

export const store = {
    get(key) { return state[key]; },
    set(key, value) { state[key] = value; localStorage.setItem(STORE_KEY, JSON.stringify(state)); },
    clear() { state = { user: null }; localStorage.removeItem(STORE_KEY); }
};
