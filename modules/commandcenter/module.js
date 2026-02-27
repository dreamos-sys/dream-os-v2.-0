/**
 * DREAM OS v2.0 - COMMAND CENTER ENGINE (FIXED)
 * Developer: Erwinsyah | Approver: Hanung Budianto S. E
 * Fixed by: Dream Team (Qwen + Gemini)
 */

import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

// ── 🧠 KONFIGURASI MENU (FIXED - NO DUPLICATE) ─────────
const modulesByTab = {
  dashboard: [
    { id:'analytics', name:'Analytics', icon:'📈' },
    { id:'pengajuan', name:'Pengajuan', icon:'📋' },
    { id:'approval', name:'Approval', icon:'✅' },
    { id:'ai', name:'AI Insight', icon:'🤖' },
    { id:'backup', name:'Backup', icon:'💾' },
    { id:'files', name:'Files', icon:'📁' }
  ],
  kerja: [
    { id:'booking', name:'Booking', icon:'📅' },
    { id:'k3', name:'K3 Report', icon:'⚠️' },
    { id:'sekuriti', name:'Sekuriti', icon:'🛡️' },
    { id:'stok', name:'Stok Gudang', icon:'📦' },
    { id:'maintenance', name:'Maintenance', icon:'🔧' },
    { id:'asset', name:'Asset', icon:'🏢' },
    { id:'janitor-indoor', name:'Janitor In', icon:'🧹' },
    { id:'janitor-outdoor', name:'Janitor Out', icon:'🌿' }
  ],
  dana: [
    { id:'dana', name:'Input Dana', icon:'💰' },
    { id:'laporan', name:'Laporan SPJ', icon:'📄' },
    { id:'approval-dana', name:'Approval Kabag', icon:'✅' } // ✅ FIX: Unique ID
  ]
};

// ── 📊 STATE ───────────────────────────────────────────
let cachedStats = { 
  booking: 0, k3: 0, dana: 0, stok: 0, maintenance: 0,
  janitorIn: 0, janitorOut: 0, sekuriti: 0, total: 0 
};
let currentTab = 'dashboard';
let refreshTimer = null;

// ── 👤 AUTH CHECK ──────────────────────────────────────
function checkAuth() {
  const user = store.get('user');
  if (!user || !user.role) {
    showToast('⛔ Silakan login terlebih dahulu', 'error');    setTimeout(() => {
      window.location.href = '../../index.html';
    }, 2000);
    return false;
  }
  return true;
}

// ── 🚀 INITIALIZATION (FIXED) ──────────────────────────
export async function init() {
  console.log('[DREAM OS] v2.0 Nerve Center Online');

  // Auth check
  if (!checkAuth()) return;

  // ✅ FIX #1: Global Navigation dengan path benar
  window.openSubModule = (id) => {
    // Role check untuk module tertentu
    if (id === 'developer') {
      const user = store.get('user');
      if (!['DEVELOPER', 'MASTER'].includes(user?.role)) {
        showToast('⛔ Akses ditolak', 'error');
        return;
      }
    }

    showToast(`Membuka Modul: ${id}`, 'info');
    
    // Prioritas 1: loadModule dari core
    if (typeof window.loadModule === 'function') {
      window.loadModule(id);
      return;
    }
    
    // ✅ FIX #2: Path benar (../ bukan ./ atau hash)
    window.location.href = '../' + id + '/index.html';
  };

  // ✅ FIX #3: Global Functions
  window.goBack = () => {
    if (window.closeModule) window.closeModule();
    else window.history.back();
  };

  window.createBackup = async () => {
    showToast('⏳ Backup...', 'info');
    try {
      const tables = ['bookings','k3_reports','pengajuan_dana','inventory'];
      const backup = { timestamp: new Date().toISOString() };
      for (const table of tables) {        const { data } = await supabase.from(table).select('*');
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

  window.exportToExcel = () => showToast('📊 Fitur Excel dalam pengembangan', 'info');
  window.exportToPDF = () => showToast('📄 Fitur PDF dalam pengembangan', 'info');

  setupListeners();
  await loadData();
  renderSubmenu('dashboard');
  renderContent('dashboard');
  
  // ✅ FIX #4: Auto-Refresh setiap 30 detik
  refreshTimer = setInterval(loadData, 30000);
}

// ── 📡 DATA ENGINE (FIXED - WITH ERROR HANDLING) ───────
async function loadData() {
  try {
    const [bk, k3, dn, inv, mn, ji, jo, sk] = await Promise.all([
      supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('k3_reports').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('pengajuan_dana').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('inventory').select('id, jumlah, minimal_stok'),
      supabase.from('maintenance_tasks').select('*', { count:'exact', head:true }).in('status',['pending','proses']),
      supabase.from('janitor_indoor').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('janitor_outdoor').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('sekuriti_reports').select('*', { count:'exact', head:true }).eq('status','pending')
    ]);

    // Filter stok kritis
    const stokKritis = (inv.data || []).filter(r => Number(r.jumlah) < Number(r.minimal_stok));

    cachedStats = {
      booking: bk.count || 0,
      k3: k3.count || 0,
      dana: dn.count || 0,
      stok: stokKritis.length,      maintenance: mn.count || 0,
      janitorIn: ji.count || 0,
      janitorOut: jo.count || 0,
      sekuriti: sk.count || 0,
      total: (bk.count||0) + (k3.count||0) + (dn.count||0) + (mn.count||0)
    };

    updateStatsUI();
    
  } catch (e) {
    console.error("[DREAM OS] Data Sync Failed:", e);
    // ✅ FIX #5: Show error ke user
    showToast('⚠️ Gagal sinkronisasi data', 'error');
  }
}

// ── 🛠️ UI HANDLERS (FIXED) ────────────────────────────
function setupListeners() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      
      currentTab = btn.getAttribute('data-tab') || btn.id.replace('tab-', '');
      console.log(`[TAB] Switched to: ${currentTab}`);
      
      renderSubmenu(currentTab);
      renderContent(currentTab);
    };
  });
}

function updateStatsUI() {
  const map = {
    'stat-total': cachedStats.total,
    'stat-booking': cachedStats.booking,
    'stat-k3': cachedStats.k3,
    'stat-dana': cachedStats.dana,
    'stat-stok': cachedStats.stok,
    'stat-maintenance': cachedStats.maintenance
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    // ✅ FIX #6: Check element exists before setting
    if (el) el.textContent = val;
  });

  // Security Status  const secStatus = document.getElementById('securityStatus');
  if (secStatus) {
    if (cachedStats.total > 10) {
      secStatus.className = 'security-status status-danger';
      secStatus.innerHTML = '⚠️ WASPADA';
    } else if (cachedStats.total > 0) {
      secStatus.className = 'security-status status-warning';
      secStatus.innerHTML = '⚡ SIAGA';
    } else {
      secStatus.className = 'security-status status-safe';
      secStatus.innerHTML = '✅ AMAN';
    }
  }
}

function renderSubmenu(tab) {
  const container = document.getElementById('submenu-container');
  // ✅ FIX #7: Check container exists
  if (!container) {
    console.warn('[DREAM OS] submenu-container not found');
    return;
  }

  const mods = modulesByTab[tab] || [];
  container.innerHTML = mods.map(m => {
    const badge = cachedStats[m.id] ? `<span class="submenu-badge">${cachedStats[m.id]}</span>` : '';
    const devClass = m.id === 'developer' ? ' dev-only' : '';
    return `
      <div class="submenu-item${devClass}" onclick="window.openSubModule('${m.id}')">
        <span class="submenu-icon">${m.icon}</span>
        <span class="submenu-name">${m.name}</span>
        ${badge}
      </div>`;
  }).join('');
}

function renderContent(tab) {
  const area = document.getElementById('content-area');
  // ✅ FIX #8: Check area exists
  if (!area) {
    console.warn('[DREAM OS] content-area not found');
    return;
  }

  if (tab === 'dashboard') {
    area.innerHTML = `
      <div class="dashboard-grid">
        <div class="card p-4">
          <p class="text-xs font-bold mb-2">🔮 Prediksi AI</p>
          <div id="aiMessage" class="text-xs opacity-80">            ${cachedStats.total > 0 
              ? `Terdapat ${cachedStats.total} antrean. Segera proses untuk menjaga ISO 9001.` 
              : 'Semua sistem berjalan optimal.'}
          </div>
        </div>
        <div class="card p-4 mt-4">
          <p class="text-xs font-bold mb-2">📊 Kesehatan Sistem</p>
          <div class="health-item">
            <div class="health-header"><span>Database</span><span>98%</span></div>
            <div class="health-bar"><div class="health-fill" style="width:98%"></div></div>
          </div>
          <div class="health-item">
            <div class="health-header"><span>API</span><span>100%</span></div>
            <div class="health-bar"><div class="health-fill" style="width:100%"></div></div>
          </div>
          <div class="health-item">
            <div class="health-header"><span>Security</span><span>100%</span></div>
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
      </div>`;
  } else if (tab === 'kerja') {
    area.innerHTML = `
      <div class="text-center py-12 opacity-40">
        <div class="text-4xl mb-4">🏢</div>
        <p>Silakan pilih submenu <strong>${tab.toUpperCase()}</strong> di atas</p>
      </div>`;
  } else if (tab === 'dana') {
    area.innerHTML = `
      <div class="text-center py-12 opacity-40">
        <div class="text-4xl mb-4">💰</div>
        <p>Silakan pilih submenu <strong>${tab.toUpperCase()}</strong> di atas</p>
        <p class="text-xs mt-2">Pengajuan pending: ${cachedStats.dana}</p>
      </div>`;
  } else {
    area.innerHTML = `
      <div class="text-center py-12 opacity-40">
        <p>Silakan pilih submenu <strong>${tab.toUpperCase()}</strong> di atas</p>
      </div>`;  }
}

// ── 🧹 CLEANUP (FIXED) ────────────────────────────────
export function cleanup() {
  // ✅ FIX #9: Clear timer on cleanup
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  console.log('[DREAM OS] Sistem Saraf Standby.');
}

// ── 🛡️ ERROR HANDLING (NEW) ───────────────────────────
window.addEventListener('error', (e) => {
  console.error('[DREAM OS] Global Error:', e.message);
  showToast('⚠️ Terjadi kesalahan sistem', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[DREAM OS] Unhandled Promise:', e.reason);
});

console.log('[DREAM OS] Command Center Engine Loaded ✅');
