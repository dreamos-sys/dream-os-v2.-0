import { store } from './store.js';
import { showToast } from './components.js';

const ROLES = {
    "012443410": { role: "DEVELOPER", modules: ['booking','k3','sekuriti','janitor-indoor','janitor-outdoor','stok','maintenance','asset','dana','commandcenter','qr'] },
    "Mr.M_Architect_2025": { role: "MASTER", modules: ['booking','k3','sekuriti','janitor-indoor','janitor-outdoor','stok','maintenance','asset','dana','commandcenter','qr'] },
    "4dm1n_AF6969@00": { role: "ADMIN", modules: ['booking','k3','sekuriti','janitor-indoor','janitor-outdoor','stok','maintenance','asset','dana','commandcenter','qr'] },
    "LHPSsec_AF2025": { role: "SEKURITI", modules: ['sekuriti'] },
    "CHCS_AF_@003": { role: "JANITOR", modules: ['janitor-indoor','janitor-outdoor'] },
    "SACS_AF@004": { role: "STOK", modules: ['stok'] },
    "M41n_4F@234": { role: "MAINTENANCE", modules: ['maintenance'] },
    "4dm1n_6969@01": { role: "INVENTARIS", modules: ['asset'] },
    "4dm1n_9696@02": { role: "GUDANG", modules: ['stok'] },
    "4553Tumum_AF@1112": { role: "ASSET", modules: ['asset'] },
    "user_@1234": { role: "USER_BOOKING", modules: ['booking'] },
    "user_@2345": { role: "USER_K3", modules: ['k3'] }
};

export async function login(key) {
    const user = ROLES[key];
    if (!user) {
        showToast('Akses ditolak!', 'error');
        return false;
    }

    sessionStorage.setItem('dream_user', key);
    sessionStorage.setItem('dream_user_data', JSON.stringify(user));

    store.set('user', user);
    store.set('modules', user.modules);

    showToast(`Selamat datang, ${user.role}!`, 'success');
    return true;
}

export function logout() {
    sessionStorage.clear();
    window.location.reload();
}

export function checkSession() {
    const data = sessionStorage.getItem('dream_user_data');
    if (data) {
        const user = JSON.parse(data);
        store.set('user', user);
        store.set('modules', user.modules);
        return true;
    }
    return false;
}
