/**
 * DREAM OS v2.0 - COMMAND CENTER ENGINE
 * Developer: Erwinsyah | Approver: Hanung Budianto S. E [cite: 2026-01-24]
 */

import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

// ── 🧠 KONFIGURASI MENU (INTEGRATED) ─────────────────
const modulesByTab = {
  dashboard: [
    { id:'analytics', name:'Analytics', icon:'📈' },
    { id:'pengajuan', name:'Pengajuan', icon:'📋' },
    { id:'approval', name:'Approval', icon:'✅' },
    { id:'ai', name:'AI Insight', icon:'🤖' }
  ],
  kerja: [
    { id:'booking', name:'Booking', icon:'📅' },
    { id:'k3', name:'K3 Report', icon:'⚠️' },
    { id:'sekuriti', name:'Sekuriti', icon:'🛡️' },
    { id:'stok', name:'Stok Gudang', icon:'📦' },
    { id:'maintenance', name:'Maintenance', icon:'🔧' }
  ],
  dana: [
    { id:'dana', name:'Input Dana', icon:'💰' },
    { id:'laporan', name:'Laporan SPJ', icon:'📄' },
    { id:'approval', name:'Approval Kabag', icon:'✅' }
  ]
};

let cachedStats = { booking: 0, k3: 0, dana: 0, total: 0 };
let currentTab = 'dashboard';

// ── 🚀 INITIALIZATION ────────────────────────────────
export async function init() {
  console.log('[DREAM OS] v2.0 Nerve Center Online');

  // Fix Global Navigation
  window.openSubModule = (id) => {
    showToast(`Membuka Modul: ${id}`, 'info');
    if (typeof window.loadModule === 'function') {
      window.loadModule(id);
    } else {
      window.location.hash = `#/${id}`; // Fallback navigation
    }
  };

  setupListeners();
  await loadData();
  renderSubmenu('dashboard');
  renderContent('dashboard');
}

// ── 📡 DATA ENGINE (ISO 55001) ───────────────────────
async function loadData() {
  try {
    const [bk, k3, dn] = await Promise.all([
      supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('k3_reports').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('pengajuan_dana').select('*', { count:'exact', head:true }).eq('status','pending')
    ]);

    cachedStats = {
      booking: bk.count || 0,
      k3: k3.count || 0,
      dana: dn.count || 0,
      total: (bk.count||0) + (k3.count||0) + (dn.count||0)
    };

    updateStatsUI();
  } catch (e) {
    console.error("Data Sync Failed");
  }
}

// ── 🛠️ UI HANDLERS ───────────────────────────────────
function setupListeners() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.onclick = () => {
      // Hilangkan class active dari semua tab
      tabs.forEach(t => t.classList.remove('active'));
      // Tambah class active ke yang diklik
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
    'stat-dana': cachedStats.dana
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  // Logika Keamanan (ISO 27001)
  const secStatus = document.getElementById('securityStatus');
  if (secStatus) {
    if (cachedStats.total > 10) {
      secStatus.className = 'security-status status-danger';
      secStatus.innerHTML = '⚠️ WASPADA';
    } else {
      secStatus.className = 'security-status status-safe';
      secStatus.innerHTML = '✅ AMAN';
    }
  }
}

function renderSubmenu(tab) {
  const container = document.getElementById('submenu-container');
  if (!container) return;

  const mods = modulesByTab[tab] || [];
  container.innerHTML = mods.map(m => `
    <div class="submenu-item" onclick="window.openSubModule('${m.id}')">
      <span class="submenu-icon">${m.icon}</span>
      <span class="submenu-name">${m.name}</span>
      ${cachedStats[m.id] ? `<span class="submenu-badge">${cachedStats[m.id]}</span>` : ''}
    </div>
  `).join('');
}

function renderContent(tab) {
  const area = document.getElementById('content-area');
  if (!area) return;

  if (tab === 'dashboard') {
    area.innerHTML = `
      <div class="dashboard-grid">
        <div class="card p-4">
          <p class="text-xs font-bold mb-2">🔮 Prediksi AI</p>
          <div id="aiMessage" class="text-xs opacity-80">
            ${cachedStats.total > 0 ? `Terdapat ${cachedStats.total} antrean. Segera proses untuk menjaga ISO 9001.` : 'Semua sistem berjalan optimal.'}
          </div>
        </div>
      </div>`;
  } else {
    area.innerHTML = `
      <div class="text-center py-12 opacity-40">
        <p>Silakan pilih submenu <strong>${tab.toUpperCase()}</strong> di atas</p>
      </div>`;
  }
}

export function cleanup() { console.log('Sistem Saraf Standby.'); }
