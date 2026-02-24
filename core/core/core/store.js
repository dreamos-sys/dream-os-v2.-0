class Store {
    constructor() {
        this.state = {};
        this.listeners = {};
    }

    set(key, value) {
        this.state[key] = value;
        this.emit(key, value);
    }

    get(key) {
        return this.state[key];
    }

    on(key, callback) {
        if (!this.listeners[key]) this.listeners[key] = [];
        this.listeners[key].push(callback);
    }

    emit(key, value) {
        if (this.listeners[key]) {
            this.listeners[key].forEach(cb => cb(value));
        }
    }
}

export const store = new Store();
