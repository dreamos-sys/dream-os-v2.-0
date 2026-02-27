import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

console.log('[COMMANDCENTER] Module v2.1 loaded');

let cachedStats = {};
let currentTab = 'dashboard';
let refreshTimer = null;

const TRANSLATIONS = {
    id: { safe: 'AMAN', warning: 'WASPADA', danger: 'BAHAYA', justNow: 'Baru saja' },
    en: { safe: 'SAFE', warning: 'WARNING', danger: 'DANGER', justNow: 'Just now' }
};

const modulesByTab = {
    dashboard: [
        { id: 'analytics',  name: 'Analytics',  icon: '📈' },
        { id: 'pengajuan',  name: 'Pengajuan',  icon: '📋' },
        { id: 'laporan',    name: 'Laporan',    icon: '📄' },
        { id: 'ai',         name: 'AI',         icon: '🤖' },
        { id: 'slides',     name: 'Slide',      icon: '🖼️' },
        { id: 'files',      name: 'Files',      icon: '📁' },
        { id: 'backup',     name: 'Backup',     icon: '💾' },
        { id: 'qr',         name: 'QR',         icon: '📱' },
        { id: 'approval',   name: 'Approval',   icon: '✅' }
    ],
    kerja: [
        { id: 'booking',         name: 'Booking',     icon: '📅' },
        { id: 'k3',              name: 'K3',          icon: '⚠️' },
        { id: 'sekuriti',        name: 'Sekuriti',    icon: '🛡️' },
        { id: 'janitor-indoor',  name: 'Janitor In',  icon: '🧹' },
        { id: 'janitor-outdoor', name: 'Janitor Out', icon: '🌿' },
        { id: 'stok',            name: 'Stok',        icon: '📦' },
        { id: 'maintenance',     name: 'Maintenance', icon: '🔧' },
        { id: 'asset',           name: 'Asset',       icon: '🏢' },
        { id: 'gudang',          name: 'Gudang',      icon: '🏭' }
    ],
    dana: [
        { id: 'dana',      name: 'Dana',      icon: '💰' },
        { id: 'approval',  name: 'Approval',  icon: '✅' },
        { id: 'qr',        name: 'QR',        icon: '📱' },
        { id: 'backup',    name: 'Backup',    icon: '💾' },
        { id: 'laporan',   name: 'Laporan',   icon: '📄' },
        { id: 'analytics', name: 'Analytics', icon: '📈' }
    ]
};

// ============================================================
// EXPOSED GLOBALS (untuk onclick di HTML)
// ============================================================
window.switchTab = function(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.classList.add('active');
    currentTab = tab;
    renderSubmenu(tab);
    renderContent(tab);
};

window.goBack = function() {
    if (window.closeModule) window.closeModule();
    else window.history.back();
};

window.goToModule = function(id) {
    if (id === 'developer') {
        const user = store.get('user');
        if (!user || (user.role !== 'DEVELOPER' && user.role !== 'MASTER')) {
            showToast('⛔ Akses ditolak', 'error');
            return;
        }
    }
    if (window.loadModule) window.loadModule(id);
    else showToast('❌ Fungsi loadModule tidak tersedia', 'error');
};

// ============================================================
// INIT
// ============================================================
export async function init() {
    console.log('[COMMANDCENTER] Initializing...');

    // Developer module jika role sesuai
    const user = store.get('user');
    if (user?.role === 'DEVELOPER' || user?.role === 'MASTER') {
        if (!modulesByTab.dashboard.find(m => m.id === 'developer')) {
            modulesByTab.dashboard.push({ id: 'developer', name: 'Dev Intel', icon: '🧠', devOnly: true });
        }
    }

    // Language listener
    const lang = localStorage.getItem('lang') || 'id';
    applyLanguage(lang);
    window.addEventListener('storage', (e) => {
        if (e.key === 'lang') applyLanguage(e.newValue);
    });

    await loadAllStats();
    renderSubmenu('dashboard');
    renderContent('dashboard');
    startAutoRefresh();
}

export function cleanup() {
    if (refreshTimer) clearInterval(refreshTimer);
}

function applyLanguage(lang) {
    document.querySelectorAll('[data-id]').forEach(el => {
        const val = (lang === 'en' && el.getAttribute('data-en')) ? el.getAttribute('data-en') : el.getAttribute('data-id');
        if (val) el.textContent = val;
    });
}

// ============================================================
// LOAD STATS
// ============================================================
async function loadAllStats() {
    try {
        const [booking, k3, dana, stok, maintenance, janitorIn, janitorOut, sekuriti, gudang, assets] = await Promise.all([
            supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('k3_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('pengajuan_dana').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('inventory').select('id, jumlah, minimal_stok'),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'proses']),
            supabase.from('janitor_indoor').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('janitor_outdoor').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('sekuriti_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('gudang_stok').select('id, stok, reorder_level'),
            supabase.from('assets').select('id, kondisi').in('kondisi', ['rusak_ringan', 'rusak_berat'])
        ]);

        const stokKritis = (stok.data || []).filter(r => Number(r.jumlah) < Number(r.minimal_stok));
        const gudangKritis = (gudang.data || []).filter(r => Number(r.stok) < Number(r.reorder_level));

        cachedStats = {
            booking:     booking.count || 0,
            k3:          k3.count || 0,
            dana:        dana.count || 0,
            stok:        stokKritis.length,
            maintenance: maintenance.count || 0,
            janitorIn:   janitorIn.count || 0,
            janitorOut:  janitorOut.count || 0,
            sekuriti:    sekuriti.count || 0,
            gudang:      gudangKritis.length,
            assetsRusak: assets.data?.length || 0,
            total: (booking.count||0) + (k3.count||0) + (dana.count||0) + (maintenance.count||0)
        };

        setEl('stat-booking',     cachedStats.booking);
        setEl('stat-k3',          cachedStats.k3);
        setEl('stat-dana',        cachedStats.dana);
        setEl('stat-stok',        cachedStats.stok);
        setEl('stat-maintenance', cachedStats.maintenance);
        setEl('stat-total',       cachedStats.total);

        updateSecurityStatus(cachedStats.total);
        generateAIInsights(cachedStats);

        const lang = localStorage.getItem('lang') || 'id';
        setEl('lastSync', TRANSLATIONS[lang].justNow);
        renderSubmenu(currentTab);

    } catch (err) {
        console.error('[COMMANDCENTER] loadAllStats error:', err);
        showToast('Gagal memuat data: ' + err.message, 'error');
    }
}

function updateSecurityStatus(total) {
    const status = document.getElementById('securityStatus');
    if (!status) return;
    const lang = localStorage.getItem('lang') || 'id';
    const t = TRANSLATIONS[lang];
    status.className = 'security-status';
    if (total === 0) {
        status.classList.add('status-safe');
        status.innerHTML = `<i class="fas fa-shield-check mr-2"></i><span>${t.safe}</span>`;
    } else if (total < 10) {
        status.classList.add('status-warning');
        status.innerHTML = `<i class="fas fa-triangle-exclamation mr-2"></i><span>${t.warning}</span>`;
    } else {
        status.classList.add('status-danger');
        status.innerHTML = `<i class="fas fa-circle-exclamation mr-2"></i><span>${t.danger}</span>`;
    }
}

function generateAIInsights(counts) {
    const aiMsg = document.getElementById('aiMessage');
    const pred = document.getElementById('predictiveList');
    if (!aiMsg) return;

    const insights = [];
    if (counts.booking > 5) insights.push('📈 Booking tinggi');
    if (counts.k3 > 3) insights.push('⚠️ Review K3');
    if (counts.dana > 5) insights.push('💰 Dana pending');
    if (counts.stok > 0) insights.push('📦 Stok menipis');
    if (insights.length === 0) insights.push('✅ Semua optimal');
    aiMsg.innerHTML = insights.join(' | ');

    if (pred) {
        pred.innerHTML = `
            <li class="predictive-item normal"><i class="fas fa-check-circle"></i> 📊 Booking stabil</li>
            <li class="predictive-item ${counts.k3 > 3 ? 'high' : 'normal'}"><i class="fas fa-exclamation-circle"></i> ${counts.k3 > 3 ? `⚠️ ${counts.k3} K3 reports` : '✅ K3 aman'}</li>
            <li class="predictive-item ${counts.stok > 0 ? 'critical' : 'normal'}"><i class="fas fa-exclamation-triangle"></i> ${counts.stok > 0 ? '🔴 Stok kritis' : '✅ Stok aman'}</li>
        `;
    }
}

function renderSubmenu(tab) {
    const container = document.getElementById('submenu-container');
    if (!container) return;
    const modules = modulesByTab[tab] || [];
    container.innerHTML = modules.map(mod => {
        const badge = cachedStats[mod.id] ? `<span class="submenu-badge">${cachedStats[mod.id]}</span>` : '';
        const devClass = mod.devOnly ? ' dev-only' : '';
        return `<div class="submenu-item${devClass}" onclick="window.goToModule('${mod.id}')">
            <span class="submenu-icon">${mod.icon}</span>
            <span class="submenu-name">${mod.name}</span>
            ${badge}
        </div>`;
    }).join('');
}

function renderContent(tab) {
    const content = document.getElementById('content-area');
    if (!content) return;
    if (tab === 'dashboard') {
        content.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div><h4 class="text-sm font-bold mb-2">📋 Aktivitas</h4><div id="activityFeed" class="activity-feed">Memuat...</div></div>
                <div><h4 class="text-sm font-bold mb-2">🔮 Prediksi AI</h4><ul id="predictiveList" class="predictive-list"><li class="predictive-item"><i class="fas fa-spinner fa-spin"></i> Menganalisis...</li></ul></div>
            </div>
            <div class="mt-4">
                <h4 class="text-sm font-bold mb-2">📊 Kesehatan Sistem</h4>
                <div class="health-item"><div class="health-header"><span>Database</span><span>98%</span></div><div class="health-bar"><div class="health-fill" style="width:98%"></div></div></div>
                <div class="health-item"><div class="health-header"><span>API</span><span>100%</span></div><div class="health-bar"><div class="health-fill" style="width:100%"></div></div></div>
                <div class="health-item"><div class="health-header"><span>Storage</span><span>75%</span></div><div class="health-bar"><div class="health-fill warning" style="width:75%"></div></div></div>
                <div class="health-item"><div class="health-header"><span>Security</span><span>100%</span></div><div class="health-bar"><div class="health-fill" style="width:100%"></div></div></div>
            </div>
            <div class="export-buttons mt-4">
                <button class="btn-action" onclick="window.createBackup()"><i class="fas fa-download"></i> Backup</button>
                <button class="btn-action btn-blue" onclick="window.exportToExcel()"><i class="fas fa-file-excel"></i> Excel</button>
                <button class="btn-action btn-purple" onclick="window.exportToPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
            </div>
        `;
        loadRecentActivities();
        generateAIInsights(cachedStats);
    } else {
        content.innerHTML = `<p class="text-center py-8 opacity-60">Pilih submenu untuk melihat detail</p>`;
    }
}

async function loadRecentActivities() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    const { data, error } = await supabase
        .from('audit_logs')
        .select('action, detail, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    if (error || !data?.length) {
        feed.innerHTML = '<div class="text-center py-4 opacity-60">Belum ada aktivitas</div>';
        return;
    }
    feed.innerHTML = data.map(a => `
        <div class="activity-item">
            <div class="activity-icon"><i class="fas fa-circle" style="color:#10b981"></i></div>
            <div class="activity-content">
                <div class="activity-title">${a.action}</div>
                <div class="activity-meta">${a.detail} • ${new Date(a.created_at).toLocaleString('id-ID')}</div>
            </div>
        </div>
    `).join('');
}

// ============================================================
// GLOBAL BACKUP FUNCTIONS
// ============================================================
window.createBackup = async function() {
    showToast('⏳ Backup...', 'success');
    try {
        const tables = ['bookings','k3_reports','pengajuan_dana','inventory','assets','maintenance_tasks','sekuriti_reports','janitor_indoor','janitor_outdoor','gudang_stok'];
        const backup = { timestamp: new Date().toISOString() };
        for (const table of tables) {
            const { data } = await supabase.from(table).select('*');
            backup[table] = data || [];
        }
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dream-os-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Backup berhasil!', 'success');
    } catch (err) {
        showToast('❌ Backup gagal: ' + err.message, 'error');
    }
};
window.exportToExcel = () => showToast('Fitur Excel dalam pengembangan', 'info');
window.exportToPDF   = () => showToast('Fitur PDF dalam pengembangan',   'info');

function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(loadAllStats, 30000);
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
