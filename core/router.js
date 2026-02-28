import { showLoading } from './components.js';
import { store } from './store.js';
import { showToast } from './components.js';

const modules = {
    commandcenter: () => import('../modules/commandcenter/module.js'),
    // nanti tambah modul lain
};

export async function loadModule(moduleId) {
    const userModules = store.get('modules') || [];
    if (!userModules.includes(moduleId) && !userModules.includes('all')) {
        showToast('Anda tidak memiliki akses ke modul ini', 'error');
        return;
    }

    const win = document.getElementById('module-window');
    const content = document.getElementById('module-content');
    if (!win || !content) return;

    win.classList.remove('hidden');
    content.innerHTML = `<div class="shalawat-loading"><div class="arabic">اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ</div><p class="text-slate-400 mt-4">Memuat...</p></div>`;

    try {
        const mod = await modules[moduleId]();
        if (mod && typeof mod.init === 'function') {
            await mod.init();
        } else {
            throw new Error('Modul tidak memiliki fungsi init');
        }
    } catch (err) {
        console.error(err);
        content.innerHTML = `<div class="text-center py-20 text-red-400">❌ Gagal: ${err.message}</div>`;
    }
}

export function closeModule() {
    document.getElementById('module-window').classList.add('hidden');
    document.getElementById('module-content').innerHTML = '';
}
