import { store } from './store.js';
import { showToast, showLoading } from './components.js';
import { handleError } from './error.js';

// Dynamic imports untuk semua modul (tambah sesuai kebutuhan)
const modules = {
    booking: () => import('../modules/booking/module.js'),
    k3: () => import('../modules/k3/module.js'),
    sekuriti: () => import('../modules/sekuriti/module.js'),
    'janitor-indoor': () => import('../modules/janitor-indoor/module.js'),
    'janitor-outdoor': () => import('../modules/janitor-outdoor/module.js'),
    stok: () => import('../modules/stok/module.js'),
    maintenance: () => import('../modules/maintenance/module.js'),
    asset: () => import('../modules/asset/module.js'),
    dana: () => import('../modules/dana/module.js'),
    commandcenter: () => import('../modules/commandcenter/module.js'),
    qr: () => import('../modules/qr/module.js')
};

export async function loadModule(moduleId) {
    const userModules = store.get('modules') || [];
    if (!userModules.includes(moduleId) && !userModules.includes('all')) {
        showToast('Anda tidak memiliki akses ke modul ini', 'error');
        return;
    }

    const moduleWindow = document.getElementById('module-window');
    const contentDiv = document.getElementById('module-content');

    moduleWindow.classList.remove('hidden');
    showLoading('module-content', `Memuat modul ${moduleId}...`);

    try {
        const htmlRes = await fetch(`./modules/${moduleId}/index.html`);
        if (!htmlRes.ok) throw new Error('Modul tidak ditemukan');
        const html = await htmlRes.text();
        contentDiv.innerHTML = html;

        const mod = await modules[moduleId]();
        if (mod && typeof mod.init === 'function') {
            mod.init();
        } else {
            console.warn(`Modul ${moduleId} tidak memiliki fungsi init()`);
        }
    } catch (err) {
        handleError(err);
        contentDiv.innerHTML = `<div class="text-center py-20 text-red-400">❌ Gagal memuat modul: ${err.message}</div>`;
    }
}

export function closeModule() {
    document.getElementById('module-window').classList.add('hidden');
    document.getElementById('module-content').innerHTML = '';
}
