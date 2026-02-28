class Store {
    constructor() {
        this.state = {};
    }
    set(key, value) {
        this.state[key] = value;
        sessionStorage.setItem(key, JSON.stringify(value));
    }
    get(key) {
        if (this.state[key]) return this.state[key];
        const stored = sessionStorage.getItem(key);
        if (stored) {
            try {
                this.state[key] = JSON.parse(stored);
                return this.state[key];
            } catch {}
        }
        return null;
    }
    clear() {
        this.state = {};
        sessionStorage.clear();
    }
}
export const store = new Store();
