const events = {};

export const eventBus = {
    on(event, callback) {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
    },
    off(event, callback) {
        if (!events[event]) return;
        events[event] = events[event].filter(cb => cb !== callback);
    },
    emit(event, data) {
        if (!events[event]) return;
        events[event].forEach(cb => cb(data));
    }
};
