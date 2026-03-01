// Simple store with localStorage persistence
const STORE_KEY = 'dreamos_store';

const defaultState = {
    user: null,
    theme: 0,
    autoShalat: true,
    lastModule: null
};

let state = { ...defaultState };

// Load from localStorage
try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
        state = { ...defaultState, ...JSON.parse(saved) };
    }
} catch (e) {
    console.warn('Failed to load store', e);
}

function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export const store = {
    get(key) {
        return state[key];
    },
    set(key, value) {
        state[key] = value;
        save();
    },
    clear() {
        state = { ...defaultState };
        localStorage.removeItem(STORE_KEY);
    }
};
