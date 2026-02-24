import { store } from './store.js';
import { showToast, showLoading } from './components.js';
import { handleError } from './error.js';

const modules = {
    booking: () => import('../modules/booking/module.js'),
    // nanti tambah modul lain
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

        const module = await modules[moduleId]();
        if (module && typeof module.init === 'function') {
            module.init();
        }
    } catch (err) {
        handleError(err);
        contentDiv.innerHTML = `<p class="text-center py-20 text-red-500">❌ Gagal memuat modul: ${err.message}</p>`;
    }
}

export function closeModule() {
    document.getElementById('module-window').classList.add('hidden');
    document.getElementById('module-content').innerHTML = '';
}
