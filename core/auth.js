import { store } from './store.js';
import { showToast } from './components.js';

const ROLES = {
    "012443410": { role: "DEVELOPER", modules: ['commandcenter','booking','k3','sekuriti','janitor-indoor','janitor-outdoor','stok','maintenance','asset'] }
};

export async function login(key) {
    const user = ROLES[key];
    if (!user) {
        showToast('Akses ditolak!', 'error');
        return false;
    }
    store.set('user', user);
    store.set('modules', user.modules);
    store.set('authenticated', true);
    showToast(`Selamat datang, ${user.role}!`, 'success');
    return true;
}

export function logout() {
    store.clear();
    window.location.reload();
}

export function checkSession() {
    return store.get('authenticated') === true;
}
