// core/navigation.js
import { eventBus } from './eventBus.js';

/**
 * 🧭 Navigate to any module from anywhere
 * @param {string} moduleId - Target module ID
 * @param {object} params - Optional params to pass
 * @param {boolean} closeCurrent - Close current module first?
 */
export function navigateTo(moduleId, params = {}, closeCurrent = true) {
    eventBus.emit('module:navigate', {
        moduleId,
        params,
        closeCurrent
    });
}

/**
 * 🚪 Close current module
 */
export function closeCurrentModule() {
    eventBus.emit('module:close');
}

/**
 * 🔄 Refresh current module
 */
export function refreshCurrentModule() {
    // This requires commandHub to track active module
    if (window.commandHub?.activeModule) {
        window.commandHub.reloadModule(window.commandHub.activeModule);
    }
}

// Expose to window for inline onclick
window.navigateTo = navigateTo;
window.closeModule = closeCurrentModule;
window.refreshModule = refreshCurrentModule;

console.log('🧭 [Navigation] Helper functions exported');
