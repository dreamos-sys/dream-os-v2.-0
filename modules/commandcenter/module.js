/**
 * modules/commandcenter/module.js
 * Dream OS — Command Center v2.1
 * ES Module: diload via window.loadModule() dari core
 */

import { supabase } from '../../core/supabase.js';
import { showToast  } from '../../core/components.js';
import { store      } from '../../core/store.js';

console.log('[COMMANDCENTER] Module v2.1 loaded');

// ============================================================
// STATE
// ============================================================
let cachedStats  = {};
let currentTab   = 'dashboard';
let refreshTimer = null;

const TRANSLATIONS = {
    id: { safe: 'AMAN', warning: 'WASPADA', danger: 'BAHAYA', justNow: 'Baru saja' },
    en: { safe: 'SAFE', warning: 'WARNING',  danger: 'DANGER', justNow: 'Just now'  }
};

// ============================================================
// MODULES CONFIG
// ============================================================
const modulesByTab = {
    dashboard: [
        { id: 'analytics', name: 'Analytics', icon: '📈' },
        { id: 'pengajuan', name: 'Pengajuan', icon: '📋' },
        { id: 'laporan',   name: 'Laporan',   icon: '📄' },
        { id: 'ai',        name: 'AI',        icon: '🤖' },
        { id: 'slides',    name: 'Slide',     icon: '🖼️' }, // FIX: konsisten pakai 'slides'
        { id: 'files',     name: 'Files',     icon: '📁' },
        { id: 'backup',    name: 'Backup',    icon: '💾' },
        { id: 'qr',        name: 'QR',        icon: '📱' },
        { id: 'approval',  name: 'Approval',  icon: '✅' }
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
// EXPORTED INIT — dipanggil oleh loadModule()
// ============================================================
export async function init() {
    console.log('[COMMANDCENTER] Initializing...');

    // Inject Developer Intelligence module jika role sesuai
    const user = store.get('user');
    if (user?.role === 'DEVELOPER' || user?.role === 'MASTER') {
        if (!modulesByTab.dashboard.find(m => m.id === 'developer')) {
            modulesByTab.dashboard.push({
                id: 'developer', name: 'Dev Intel', icon: '🧠', devOnly: true
            });
        }
    }

    // Language listener
    const lang = localStorage.getItem('lang') || 'id';
    applyLanguage(lang);
    window.addEventListener('storage', (e) => {
        if (e.key === 'lang') applyLanguage(e.newValue);
    });

    // Tab event listeners (mode module.js pakai addEventListener, bukan onclick inline)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab || 'dashboard';
            renderSubmenu(currentTab);
            renderContent(currentTab);
        });
    });

    await loadAllStats();
    renderSubmenu('dashboard');
    renderContent('dashboard');
    startAutoRefresh();
}

// ============================================================
// CLEANUP — dipanggil saat module di-unload
// ============================================================
export function cleanup() {
    if (refreshTimer) clearInterval(refreshTimer);
    console.log('[COMMANDCENTER] Cleaned up');
}

// ============================================================
// LANGUAGE
// ============================================================
function applyLanguage(lang) {
    document.querySelectorAll('[data-id]').forEach(el => {
        const val = (lang === 'en' && el.getAttribute('data-en'))
            ? el.getAttribute('data-en')
            : el.getAttribute('data-id');
        if (val) el.textContent = val;
    });
}

// ============================================================
// LOAD ALL STATS
// ============================================================
async function loadAllStats() {
    try {
        const [
            booking, k3, dana, stok, maintenance,
            janitorIn, janitorOut, sekuriti, gudang, assets
        ] = await Promise.all([
            supabase.from('bookings').select('*',          { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('k3_reports').select('*',        { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('pengajuan_dana').select('*',    { count: 'exact', head: true }).eq('status', 'pending'),
            // FIX: .lt('column', 'string') tidak valid untuk column-to-column comparison
            // Gunakan RPC atau select semua lalu filter di client jika tidak ada raw filter
            supabase.from('inventory').select('id, jumlah, minimal_stok'),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'proses']),
            supabase.from('janitor_indoor').select('*',    { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('janitor_outdoor').select('*',   { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('sekuriti_reports').select('*',  { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('gudang_stok').select('id, stok, reorder_level'),
            supabase.from('assets').select('id, kondisi').in('kondisi', ['rusak_ringan', 'rusak_berat'])
        ]);

        // FIX: filter column-to-column di client side (lebih aman & portabel)
        const stokKritis  = (stok.data  || []).filter(r => Number(r.jumlah)  < Number(r.minimal_stok));
        const gudangKritis = (gudang.data || []).filter(r => Number(r.stok) < Number(r.reorder_level));

        cachedStats = {
            booking:      booking.count      || 0,
            k3:           k3.count           || 0,
            dana:         dana.count         || 0,
            stok:         stokKritis.length,
            maintenance:  maintenance.count  || 0,
            janitorIn:    janitorIn.count     || 0,
            janitorOut:   janitorOut.count    || 0,
            sekuriti:     sekuriti.count      || 0,
            gudang:       gudangKritis.length,
            assetsRusak:  assets.data?.length || 0,
            total: (booking.count||0) + (k3.count||0) + (dana.count||0) + (maintenance.count||0)
        };

        // Update DOM
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

    } catch (err) {
        console.error('[COMMANDCENTER] loadAllStats error:', err);
        showToast('Gagal memuat data: ' + err.message, 'error');
    }
}

// ============================================================
// SECURITY STATUS
// ============================================================
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

// ============================================================
// AI INSIGHTS
// ============================================================
function generateAIInsights(counts) {
    const aiMessage    = document.getElementById('aiMessage');
    const predictive   = document.getElementById('predictiveList');
    if (!aiMessage) return;

    const insights = [];
    if (counts.booking    >  5) insights.push('📈 Booking tinggi, siapkan ruangan');
    if (counts.k3         >  3) insights.push('⚠️ Perlu review K3 segera');
    if (counts.dana       >  5) insights.push('💰 Dana pending butuh approval');
    if (counts.stok       >  0) insights.push('📦 Stok menipis, segera order');
    if (counts.assetsRusak > 0) insights.push(`🏢 ${counts.assetsRusak} asset butuh perbaikan`);
    if (counts.gudang     >  0) insights.push('🏭 Reorder gudang diperlukan');
    if (insights.length  === 0) insights.push('✅ Semua sistem optimal');

    aiMessage.innerHTML = insights.join(' &nbsp;|&nbsp; ');

    if (predictive) {
        const predictions = [
            { level: 'normal',   icon: 'fa-check-circle',      text: '📊 Booking stabil 7 hari ke depan' },
            { level: counts.k3 > 3 ? 'high' : 'normal',
                                  icon: 'fa-exclamation-circle', text: counts.k3 > 3 ? `⚠️ ${counts.k3} K3 reports butuh perhatian` : '✅ K3 aman' },
            { level: counts.stok > 0 ? 'critical' : 'normal',
                                  icon: 'fa-exclamation-triangle',
                                  text: counts.stok > 0 ? `🔴 ${counts.stok} item stok kritis` : '✅ Stok dalam batas aman' }
        ];
        predictive.innerHTML = predictions.map(p => `
            <li class="predictive-item ${p.level}">
                <i class="fas ${p.icon}"></i> <span>${p.text}</span>
            </li>
        `).join('');
    }
}

// ============================================================
// RENDER SUBMENU
// ============================================================
function renderSubmenu(tab) {
    const container = document.getElementById('submenu-container');
    if (!container) { console.error('[COMMANDCENTER] #submenu-container not found'); return; }

    const modules = modulesByTab[tab] || [];
    container.innerHTML = modules.map(mod => {
        const badge    = cachedStats[mod.id]
            ? `<span class="submenu-badge">${cachedStats[mod.id]}</span>` : '';
        const devClass = mod.devOnly ? ' dev-only' : '';
        return `
            <div class="submenu-item${devClass}" onclick="window.openSubModule('${mod.id}')">
                <span class="submenu-icon">${mod.icon}</span>
                <span class="submenu-name">${mod.name}</span>
                ${badge}
            </div>
        `;
    }).join('');
}

// ============================================================
// RENDER CONTENT
// ============================================================
function renderContent(tab) {
    const content = document.getElementById('content-area');
    if (!content) { console.error('[COMMANDCENTER] #content-area not found'); return; }

    if (tab === 'dashboard') {
        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <h4 class="text-sm font-bold mb-3">📋 Aktivitas Terbaru</h4>
                    <div id="activityFeed" class="activity-feed">Memuat...</div>
                </div>
                <div>
                    <h4 class="text-sm font-bold mb-3">🔮 Prediksi AI</h4>
                    <ul id="predictiveList" class="predictive-list">
                        <li class="predictive-item normal">
                            <i class="fas fa-spinner fa-spin"></i> Menganalisis...
                        </li>
                    </ul>
                </div>
            </div>
            <div class="mt-4">
                <h4 class="text-sm font-bold mb-3">📊 Kesehatan Sistem</h4>
                <div class="health-item">
                    <div class="health-header"><span>Database</span><span id="health-db">98%</span></div>
                    <div class="health-bar"><div class="health-fill" style="width:98%"></div></div>
                </div>
                <div class="health-item">
                    <div class="health-header"><span>API</span><span id="health-api">100%</span></div>
                    <div class="health-bar"><div class="health-fill" style="width:100%"></div></div>
                </div>
                <div class="health-item">
                    <div class="health-header"><span>Storage</span><span id="health-storage">75%</span></div>
                    <div class="health-bar"><div class="health-fill warning" style="width:75%"></div></div>
                </div>
                <div class="health-item">
                    <div class="health-header"><span>Security</span><span id="health-security">100%</span></div>
                    <div class="health-bar"><div class="health-fill" style="width:100%"></div></div>
                </div>
            </div>
            <div class="export-buttons mt-4">
                <button class="btn-action" onclick="window.createBackup()">
                    <i class="fas fa-download"></i> Backup
                </button>
                <button class="btn-action btn-blue" onclick="window.exportToExcel()">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
                <button class="btn-action btn-purple" onclick="window.exportToPDF()">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
            </div>
        `;
        loadRecentActivities();
        generateAIInsights(cachedStats);

    } else if (tab === 'kerja') {
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">🏢</div>
                <p class="text-lg font-bold">Ruang Kerja</p>
                <p class="text-sm mt-2" style="opacity:0.6">Pilih modul kerja di atas</p>
            </div>
        `;

    } else if (tab === 'dana') {
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">💰</div>
                <p class="text-lg font-bold">Dana & Keuangan</p>
                <p class="text-sm mt-2" style="opacity:0.6">Pilih modul dana di atas</p>
            </div>
        `;
    } else {
        content.innerHTML = `<p class="text-center py-8" style="opacity:0.6">Pilih submenu untuk melihat detail</p>`;
    }
}

// ============================================================
// LOAD RECENT ACTIVITIES
// ============================================================
async function loadRecentActivities() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    const { data, error } = await supabase
        .from('audit_logs')
        .select('action, detail, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error || !data || data.length === 0) {
        feed.innerHTML = '<div class="text-center py-4" style="opacity:0.6">Belum ada aktivitas</div>';
        return;
    }

    feed.innerHTML = data.map(a => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-circle" style="color:#10b981;font-size:0.5rem"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${escHtml(a.action)}</div>
                <div class="activity-meta">
                    ${escHtml(a.detail)} &bull; ${new Date(a.created_at).toLocaleString('id-ID')}
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================================
// WINDOW GLOBALS — dipakai oleh HTML onclick
// ============================================================
window.openSubModule = function(id) {
    // Cek role untuk Dev Intel
    if (id === 'developer') {
        const user = store.get('user');
        if (!user || (user.role !== 'DEVELOPER' && user.role !== 'MASTER')) {
            showToast('⛔ Akses ditolak — hanya DEVELOPER/MASTER', 'error');
            return;
        }
    }
    if (typeof window.loadModule === 'function') {
        window.loadModule(id);
    } else {
        showToast('❌ Fungsi loadModule tidak tersedia', 'error');
    }
};

window.createBackup = async function() {
    showToast('⏳ Membuat backup...', 'success');
    try {
        const tables = [
            'bookings','k3_reports','pengajuan_dana',
            'inventory','assets','maintenance_tasks',
            'sekuriti_reports','janitor_indoor','janitor_outdoor',
            'gudang_stok'
        ];
        const backup = { timestamp: new Date().toISOString() };
        for (const table of tables) {
            const { data } = await supabase.from(table).select('*');
            backup[table] = data || [];
        }
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `dream-os-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Backup berhasil!', 'success');
    } catch (err) {
        showToast('❌ Backup gagal: ' + err.message, 'error');
    }
};

window.exportToExcel = function() { showToast('📊 Fitur Excel dalam pengembangan', 'info'); };
window.exportToPDF   = function() { showToast('📄 Fitur PDF dalam pengembangan',   'info'); };

// ============================================================
// AUTO REFRESH
// ============================================================
function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(loadAllStats, 30000);
}

// ============================================================
// HELPERS
// ============================================================
function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
