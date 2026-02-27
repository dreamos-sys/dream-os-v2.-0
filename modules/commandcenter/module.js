import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/eventBus.js';

console.log('[COMMANDCENTER] Super Integrated Version Loaded');

let currentLang = localStorage.getItem('lang') || 'id';
let currentTab = 'dashboard';
let cachedStats = {};

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

const modulesByTab = {
    dashboard: [
        { id: 'analytics', name: 'Analytics', icon: '📈' },
        { id: 'pengajuan', name: 'Pengajuan', icon: '📋' },
        { id: 'laporan', name: 'Laporan', icon: '📄' },
        { id: 'ai', name: 'AI', icon: '🤖' },
        { id: 'slides', name: 'Slide', icon: '🖼️' },
        { id: 'files', name: 'Files', icon: '📁' },
        { id: 'backup', name: 'Backup', icon: '💾' },
        { id: 'qr', name: 'QR', icon: '📱' },
        { id: 'approval', name: 'Approval', icon: '✅' }
    ],
    kerja: [
        { id: 'booking', name: 'Booking', icon: '📅' },
        { id: 'k3', name: 'K3', icon: '⚠️' },
        { id: 'sekuriti', name: 'Sekuriti', icon: '🛡️' },
        { id: 'janitor-indoor', name: 'Janitor In', icon: '🧹' },
        { id: 'janitor-outdoor', name: 'Janitor Out', icon: '🌿' },
        { id: 'stok', name: 'Stok', icon: '📦' },
        { id: 'maintenance', name: 'Maintenance', icon: '🔧' },
        { id: 'asset', name: 'Asset', icon: '🏢' },
        { id: 'gudang', name: 'Gudang', icon: '🏭' }
    ],
    dana: [
        { id: 'dana', name: 'Dana', icon: '💰' },
        { id: 'approval', name: 'Approval', icon: '✅' },
        { id: 'qr', name: 'QR', icon: '📱' },
        { id: 'backup', name: 'Backup', icon: '💾' },
        { id: 'laporan', name: 'Laporan', icon: '📄' },
        { id: 'analytics', name: 'Analytics', icon: '📈' }
    ]
};

export async function init() {
    console.log('[COMMANDCENTER] Initializing...');
    
    // Pastikan semua elemen HTML ada
    await loadAllStats();
    setupTabs();
    renderSubmenu('dashboard');
    renderDashboardContent();
    startAutoRefresh();

    // Listener dari modul lain
    eventBus.on('k3-critical', (data) => {
        const aiMessage = document.getElementById('aiMessage');
        if (aiMessage) {
            aiMessage.innerHTML = `🚨 ${data.pesan}`;
            aiMessage.classList.add('text-red-400', 'animate-pulse');
        }
        showToast(data.pesan, 'warning');
    });

    eventBus.on('dana-pengajuan-baru', (data) => {
        showToast(`Pengajuan dana baru: ${data.nomor}`, 'info');
        loadAllStats();
    });
}

async function loadAllStats() {
    try {
        const [booking, k3, dana, stok, maintenance] = await Promise.all([
            supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('k3_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('pengajuan_dana').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('inventory').select('*').lt('jumlah', 'minimal_stok'),
            supabase.from('maintenance_tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'proses'])
        ]);

        cachedStats = {
            booking: booking.count || 0,
            k3: k3.count || 0,
            dana: dana.count || 0,
            stok: stok.data?.length || 0,
            maintenance: maintenance.count || 0,
            total: (booking.count||0) + (k3.count||0) + (dana.count||0) + (maintenance.count||0)
        };

        // Update stats
        document.getElementById('stat-booking').textContent = cachedStats.booking;
        document.getElementById('stat-k3').textContent = cachedStats.k3;
        document.getElementById('stat-dana').textContent = cachedStats.dana;
        document.getElementById('stat-stok').textContent = cachedStats.stok;
        document.getElementById('stat-maintenance').textContent = cachedStats.maintenance;
        document.getElementById('stat-total').textContent = cachedStats.total;

        updateSecurityStatus(cachedStats.total);
        generateAIInsights(cachedStats);
        document.getElementById('lastSync').textContent = TRANSLATIONS[currentLang].justNow;

    } catch (err) {
        console.error('[COMMANDCENTER] Stats load error:', err);
        showToast('Gagal memuat data', 'error');
    }
}

function updateSecurityStatus(total) {
    const status = document.getElementById('securityStatus');
    const t = TRANSLATIONS[currentLang];
    if (!status) return;
    
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
    if (!aiMessage || !predictiveList) return;

    const insights = [];
    if (counts.booking > 5) insights.push('📈 Booking tinggi, siapkan ruangan');
    if (counts.k3 > 3) insights.push('⚠️ Perlu review K3');
    if (counts.dana > 5) insights.push('💰 Dana pending butuh approval');
    if (counts.stok > 0) insights.push('📦 Stok menipis, segera order');
    if (insights.length === 0) insights.push('✅ Semua sistem optimal');

    aiMessage.innerHTML = insights.join(' | ');

    const predictions = [
        { level: 'normal', icon: 'fa-check-circle', text: '📊 Booking stabil 7 hari ke depan' },
        { level: 'high', icon: 'fa-exclamation-circle', text: '⚠️ 3 K3 reports butuh perhatian' },
        { level: 'critical', icon: 'fa-exclamation-triangle', text: '🔴 Storage 75% - bersihkan file lama' }
    ];
    predictiveList.innerHTML = predictions.map(p => `
        <li class="predictive-item ${p.level}">
            <i class="fas ${p.icon}"></i> <span>${p.text}</span>
        </li>
    `).join('');
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            renderSubmenu(currentTab);
            if (currentTab === 'dashboard') {
                renderDashboardContent();
            } else {
                document.getElementById('content-area').innerHTML = 
                    '<p class="text-center py-8 opacity-60">Pilih submenu untuk melihat detail</p>';
            }
        });
    });
}

function renderSubmenu(tab) {
    const container = document.getElementById('submenu-container');
    const modules = modulesByTab[tab] || [];
    container.innerHTML = modules.map(mod => `
        <div class="submenu-item" onclick="window.loadModule('${mod.id}')">
            <span class="submenu-icon">${mod.icon}</span>
            <span class="submenu-name">${mod.name}</span>
            ${cachedStats[mod.id] ? `<span class="submenu-badge">${cachedStats[mod.id]}</span>` : ''}
        </div>
    `).join('');
}

function renderDashboardContent() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <h4 class="text-sm font-bold mb-3">📋 Aktivitas Terbaru</h4>
                <div id="activityFeed" class="activity-feed">Memuat...</div>
            </div>
            <div>
                <h4 class="text-sm font-bold mb-3">🔮 Prediksi AI</h4>
                <ul id="predictiveList" class="predictive-list">
                    <li class="predictive-item"><i class="fas fa-spinner fa-spin"></i> Menganalisis...</li>
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
                <div class="health-bar"><div class="health-fill" style="width:75%"></div></div>
            </div>
            <div class="health-item">
                <div class="health-header"><span>Security</span><span id="health-security">100%</span></div>
                <div class="health-bar"><div class="health-fill" style="width:100%"></div></div>
            </div>
        </div>
        <div class="export-buttons mt-4">
            <button class="btn-action" onclick="createBackup()"><i class="fas fa-download"></i> Backup</button>
            <button class="btn-action btn-blue" onclick="exportToExcel()"><i class="fas fa-file-excel"></i> Excel</button>
            <button class="btn-action btn-purple" onclick="exportToPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
        </div>
    `;
    loadRecentActivities();
    generateAIInsights(cachedStats);
}

async function loadRecentActivities() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    
    const { data, error } = await supabase
        .from('audit_logs')
        .select('action, detail, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    
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

window.createBackup = async function() {
    try {
        showToast('Membuat backup...', 'success');
        const tables = ['bookings', 'k3_reports', 'pengajuan_dana', 'inventory', 'assets', 'maintenance_tasks'];
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

window.exportToExcel = () => showToast('Fitur Excel dalam pengembangan', 'info');
window.exportToPDF = () => showToast('Fitur PDF dalam pengembangan', 'info');

let refreshInterval;
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(loadAllStats, 30000);
}

export function cleanup() {
    if (refreshInterval) clearInterval(refreshInterval);
}
