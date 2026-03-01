const events = {};
export const eventBus = {
    on(event, cb) { if (!events[event]) events[event] = []; events[event].push(cb); },
    off(event, cb) { if (!events[event]) return; events[event] = events[event].filter(c => c !== cb); },
    emit(event, data) { if (!events[event]) return; events[event].forEach(cb => cb(data)); }
};
