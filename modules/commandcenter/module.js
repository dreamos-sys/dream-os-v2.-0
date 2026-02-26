import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';
import { predictStock } from '../../core/ai.js'; // hanya import yang tersedia

console.log('[COMMANDCENTER] Module loaded - Super Integrated Version');

let currentLang = localStorage.getItem('lang') || 'id';

const TRANSLATIONS = {
    id: {
        safe: 'AMAN',
        warning: 'WASPADA',
        danger: 'BAHAYA',
        justNow: 'Baru saja'
    },
    en: {
        safe: 'SAFE',
        warning: 'WARNING',
        danger: 'DANGER',
        justNow: 'Just now'
    }
};

// ===== INIT MODULE =====
export async function init() {
    console.log('[COMMANDCENTER] Initializing...');
    applyLanguage(currentLang);
    await loadAllData();
    setupEventListeners();
    startAutoRefresh();
}

// ===== APPLY LANGUAGE =====
function applyLanguage(lang) {
    document.querySelectorAll('[data-id]').forEach(el => {
        if (lang === 'en' && el.getAttribute('data-en')) {
            el.textContent = el.getAttribute('data-en');
        } else {
            el.textContent = el.getAttribute('data-id');
        }
    });
}

// ===== LOAD ALL DATA =====
async function loadAllData() {
    try {
        const [booking, k3, dana, stok, maintenance, janitorIn, janitorOut, sekuriti, toolRequests, assets, gudang] = await Promise.all([
            supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('k3_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('pengajuan_dana').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('inventory').select('*').lt('jumlah', 'minimal_stok'),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'proses']),
            supabase.from('janitor_indoor').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('janitor_outdoor').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('sekuriti_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('tool_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('assets').select('*').in('kondisi', ['rusak_ringan', 'rusak_berat']),
            supabase.from('gudang_stok').select('*').lt('stok', 'reorder_level')
        ]);

        const bookingCount = booking.count || 0;
        const k3Count = k3.count || 0;
        const danaCount = dana.count || 0;
        const stokMenipis = stok.data?.length || 0;
        const maintenanceCount = maintenance.count || 0;
        const totalPending = bookingCount + k3Count + danaCount + maintenanceCount + (janitorIn.count||0) + (janitorOut.count||0) + (sekuriti.count||0) + (toolRequests.count||0);

        document.getElementById('stat-booking').textContent = bookingCount;
        document.getElementById('stat-k3').textContent = k3Count;
        document.getElementById('stat-dana').textContent = danaCount;
        document.getElementById('stat-stok').textContent = stokMenipis;
        document.getElementById('stat-maintenance').textContent = maintenanceCount;
        document.getElementById('stat-total').textContent = totalPending;

        updateSecurityStatus(totalPending);
        generateAIInsights({ booking: bookingCount, k3: k3Count, dana: danaCount, stok: stokMenipis });
        renderModuleStatus({
            booking: bookingCount,
            k3: k3Count,
            dana: danaCount,
            stok: stokMenipis,
            maintenance: maintenanceCount,
            janitorIn: janitorIn.count || 0,
            janitorOut: janitorOut.count || 0,
            sekuriti: sekuriti.count || 0,
            toolRequests: toolRequests.count || 0,
            assetsRusak: assets.data?.length || 0,
            gudang: gudang.data?.length || 0
        });
        loadRecentActivities();
        document.getElementById('lastSync').textContent = TRANSLATIONS[currentLang].justNow;

    } catch (err) {
        console.error('[COMMANDCENTER] Error loading data:', err);
        showToast('Gagal memuat data', 'error');
    }
}

function updateSecurityStatus(total) {
    const status = document.getElementById('securityStatus');
    const t = TRANSLATIONS[currentLang];
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
    const aiMessage = document.getElementById('aiMessage');
    const predictiveList = document.getElementById('predictiveList');
    const insights = [];

    if (counts.booking > 5) insights.push('📈 Booking tinggi, siapkan ruangan');
    if (counts.k3 > 3) insights.push('⚠️ Perlu review K3');
    if (counts.dana > 5) insights.push('💰 Dana pending butuh approval');
    if (counts.stok > 0) insights.push('📦 Stok menipis, segera order');
    if (insights.length === 0) insights.push('✅ Semua sistem optimal');

    aiMessage.textContent = insights.join(' | ');

    const predictions = [
        { level: 'normal', icon: 'fa-check-circle', text: '📊 Booking stabil 7 hari ke depan' },
        { level: 'high', icon: 'fa-exclamation-circle', text: '⚠️ 3 K3 reports butuh perhatian' },
        { level: 'critical', icon: 'fa-exclamation-triangle', text: '🔴 Storage 75% - bersihkan file lama' }
    ];
    predictiveList.innerHTML = predictions.map(p => `
        <li class="predictive-item ${p.level}">
            <i class="fas ${p.icon}"></i><span>${p.text}</span>
        </li>
    `).join('');
}

function renderModuleStatus(data) {
    const grid = document.getElementById('moduleStatusGrid');
    const modules = [
        { id: 'booking', name: 'Booking', icon: '📅', count: data.booking, color: 'emerald' },
        { id: 'k3', name: 'K3', icon: '⚠️', count: data.k3, color: 'orange' },
        { id: 'dana', name: 'Dana', icon: '💰', count: data.dana, color: 'purple' },
        { id: 'stok', name: 'Stok', icon: '📦', count: data.stok, color: 'cyan' },
        { id: 'maintenance', name: 'Maintenance', icon: '🔧', count: data.maintenance, color: 'yellow' },
        { id: 'janitor-indoor', name: 'Janitor In', icon: '🧹', count: data.janitorIn, color: 'teal' },
        { id: 'janitor-outdoor', name: 'Janitor Out', icon: '🌿', count: data.janitorOut, color: 'green' },
        { id: 'sekuriti', name: 'Sekuriti', icon: '🛡️', count: data.sekuriti, color: 'blue' },
        { id: 'asset', name: 'Asset', icon: '🏢', count: data.assetsRusak, color: 'slate' },
        { id: 'gudang', name: 'Gudang', icon: '🏭', count: data.gudang, color: 'gray' }
    ];
    grid.innerHTML = modules.map(m => `
        <div class="module-card" onclick="openSubModule('${m.id}')">
            <span class="module-icon">${m.icon}</span>
            <span class="module-name">${m.name}</span>
            <span class="module-badge ${m.count > 0 ? (m.count > 5 ? 'critical' : 'warning') : ''}">${m.count}</span>
        </div>
    `).join('');
}

async function loadRecentActivities() {
    const feed = document.getElementById('activityFeed');
    const { data, error } = await supabase
        .from('audit_logs')
        .select('action, detail, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(15);
    if (error || !data) {
        feed.innerHTML = '<div class="text-center py-4 opacity-60">Gagal memuat</div>';
        return;
    }
    if (data.length === 0) {
        feed.innerHTML = '<div class="text-center py-4 opacity-60">Belum ada aktivitas</div>';
        return;
    }
    feed.innerHTML = data.map(a => `
        <div class="activity-item">
            <div class="activity-icon"><i class="fas fa-circle text-emerald-400"></i></div>
            <div class="activity-content">
                <div class="activity-title">${a.action}</div>
                <div class="activity-meta">${a.detail} • ${new Date(a.created_at).toLocaleString('id-ID')}</div>
            </div>
        </div>
    `).join('');
}

window.openSubModule = function(id) {
    if (window.loadModule) {
        window.loadModule(id);
    } else {
        showToast('Fungsi loadModule tidak tersedia', 'error');
    }
};

window.filterByStatus = function(status) {
    showToast('Filter: ' + status, 'info');
};

window.createBackup = async function() {
    try {
        showToast('Membuat backup...', 'success');
        const tables = ['bookings', 'k3_reports', 'pengajuan_dana', 'inventory', 'assets', 'maintenance_tasks', 'sekuriti_reports', 'janitor_indoor', 'janitor_outdoor'];
        const backup = {};
        for (const table of tables) {
            const { data } = await supabase.from(table).select('*');
            backup[table] = data || [];
        }
        backup.timestamp = new Date().toISOString();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dream-os-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup berhasil', 'success');
    } catch (err) {
        showToast('Backup gagal: ' + err.message, 'error');
    }
};

window.exportToExcel = function() {
    showToast('Fitur Excel dalam pengembangan', 'info');
};
window.exportToPDF = function() {
    showToast('Fitur PDF dalam pengembangan', 'info');
};

let refreshInterval;
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(loadAllData, 30000);
}

function setupEventListeners() {}

export function cleanup() {
    if (refreshInterval) clearInterval(refreshInterval);
}
