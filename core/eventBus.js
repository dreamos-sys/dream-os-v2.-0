/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  Dream OS - Event Bus v2.1                               ║
 * ║  🤲 Bi idznillah - Decoupled Communication Hub          ║
 * ╚══════════════════════════════════════════════════════════╝
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map(); // For one-time listeners
    }

    /**
     * 📡 SUBSCRIBE to event
     * @param {string} event - Event name
     * @param {function} callback - Handler function
     * @returns {function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * 🎯 SUBSCRIBE ONCE (auto-unsubscribe after first trigger)
     */
    once(event, callback) {
        const onceWrapper = (...args) => {
            callback(...args);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
        return () => this.off(event, onceWrapper);
    }

    /**
     * ❌ UNSUBSCRIBE from event
     */
    off(event, callback) {
        if (!this.events.has(event)) return;
        
        const callbacks = this.events.get(event);
        
        if (callback) {            // Remove specific callback
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        } else {
            // Remove all callbacks for this event
            this.events.delete(event);
        }
    }

    /**
     * 📤 EMIT event to all listeners
     */
    emit(event, data = {}) {
        if (!this.events.has(event)) return;
        
        const callbacks = [...this.events.get(event)]; // Copy to avoid mutation issues
        
        for (const callback of callbacks) {
            try {
                callback(data);
            } catch (err) {
                console.error(`[EventBus] Error in listener for "${event}":`, err);
                // Optional: emit error event
                this.emit('event:error', { event, error: err.message, listener: callback.name });
            }
        }
    }

    /**
     * 🔄 REQUEST-RESPONSE pattern (emit + wait for first response)
     */
    async request(event, data = {}, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const requestId = `${event}:${Date.now()}:${Math.random()}`;
            
            const timer = setTimeout(() => {
                off();
                reject(new Error(`Request timeout: ${event}`));
            }, timeout);
            
            const off = this.once(`${event}:response:${requestId}`, (response) => {
                clearTimeout(timer);
                resolve(response);
            });
            
            this.emit(event, { ...data, _requestId: requestId });
        });
    }
    /**
     * 📊 GET STATS - For debugging
     */
    getStats() {
        const stats = {};
        for (const [event, callbacks] of this.events) {
            stats[event] = callbacks.length;
        }
        return {
            totalEvents: this.events.size,
            listenersPerEvent: stats,
            totalListeners: Object.values(stats).reduce((a, b) => a + b, 0)
        };
    }

    /**
     * 🧹 CLEAR ALL - Reset bus (use with caution)
     */
    clear() {
        this.events.clear();
        this.onceEvents.clear();
        console.log('[EventBus] Cleared all listeners');
    }
}

// 🚀 Export singleton
export const eventBus = new EventBus();
window.eventBus = eventBus; // Global access

console.log('🕸️ [EventBus] Singleton exported');
