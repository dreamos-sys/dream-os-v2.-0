/**
 * modules/commandcenter/module.js
 * Dream OS — Command Center v2.1
 * ES Module — diload via window.loadModule() dari core
 */

import { supabase } from '../../core/supabase.js';
import { showToast  } from '../../core/components.js';
import { store      } from '../../core/store.js';

console.log('[COMMANDCENTER] Module v2.1 loaded');

// ── STATE ────────────────────────────────────────────
let cachedStats  = {};
let currentTab   = 'dashboard';
let refreshTimer = null;

const TRANSLATIONS = {
  id: { safe:'AMAN', warning:'WASPADA', danger:'BAHAYA', justNow:'Baru saja' },
  en: { safe:'SAFE', warning:'WARNING',  danger:'DANGER', justNow:'Just now'  }
};

// ── MODULES CONFIG ───────────────────────────────────
const modulesByTab = {
  dashboard: [
    { id:'analytics', name:'Analytics', icon:'📈' },
    { id:'pengajuan', name:'Pengajuan', icon:'📋' },
    { id:'laporan',   name:'Laporan',   icon:'📄' },
    { id:'ai',        name:'AI',        icon:'🤖' },
    { id:'slides',    name:'Slide',     icon:'🖼️' }, // FIX: konsisten 'slides'
    { id:'files',     name:'Files',     icon:'📁' },
    { id:'backup',    name:'Backup',    icon:'💾' },
    { id:'qr',        name:'QR',        icon:'📱' },
    { id:'approval',  name:'Approval',  icon:'✅' }
  ],
  kerja: [
    { id:'booking',         name:'Booking',     icon:'📅' },
    { id:'k3',              name:'K3',          icon:'⚠️' },
    { id:'sekuriti',        name:'Sekuriti',    icon:'🛡️' },
    { id:'janitor-indoor',  name:'Janitor In',  icon:'🧹' },
    { id:'janitor-outdoor', name:'Janitor Out', icon:'🌿' },
    { id:'stok',            name:'Stok',        icon:'📦' },
    { id:'maintenance',     name:'Maintenance', icon:'🔧' },
    { id:'asset',           name:'Asset',       icon:'🏢' },
    { id:'gudang',          name:'Gudang',      icon:'🏭' }
  ],
  dana: [
    { id:'dana',      name:'Dana',      icon:'💰' },
    { id:'approval',  name:'Approval',  icon:'✅' },
    { id:'qr',        name:'QR',        icon:'📱' },
    { id:'backup',    name:'Backup',    icon:'💾' },
    { id:'laporan',   name:'Laporan',   icon:'📄' },
    { id:'analytics', name:'Analytics', icon:'📈' }
  ]
};

// ── EXPORTED INIT ────────────────────────────────────
export async function init() {
  console.log('[COMMANDCENTER] Initializing...');

  // Inject Dev Intel hanya jika role sesuai
  const user = store.get('user');
  if (user?.role === 'DEVELOPER' || user?.role === 'MASTER') {
    if (!modulesByTab.dashboard.find(m => m.id === 'developer')) {
      modulesByTab.dashboard.push({
        id:'developer', name:'Dev Intel', icon:'🧠', devOnly:true
      });
    }
  }

  // Language
  const lang = localStorage.getItem('lang') || 'id';
  applyLanguage(lang);
  window.addEventListener('storage', e => {
    if (e.key === 'lang') applyLanguage(e.newValue);
  });

  // Tab listeners — FIX: addEventListener agar tidak bentrok dengan onclick inline HTML
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab || btn.id.replace('tab-', '');
      renderSubmenu(currentTab);
      renderContent(currentTab);
    });
  });

  await loadAllStats();
  renderSubmenu('dashboard');
  renderContent('dashboard');
  startAutoRefresh();
}

// ── CLEANUP ──────────────────────────────────────────
export function cleanup() {
  if (refreshTimer) clearInterval(refreshTimer);
  console.log('[COMMANDCENTER] Cleaned up');
}

// ── LANGUAGE ─────────────────────────────────────────
function applyLanguage(lang) {
  document.querySelectorAll('[data-id]').forEach(el => {
    const val = (lang === 'en' && el.getAttribute('data-en'))
      ? el.getAttribute('data-en')
      : el.getAttribute('data-id');
    if (val) el.textContent = val;
  });
}

// ── HELPERS ──────────────────────────────────────────
function setEl(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtDT(d) { return d ? new Date(d).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'; }

// ── LOAD ALL STATS ───────────────────────────────────
async function loadAllStats() {
  try {
    const [bk, k3, dn, inv, mn, ji, jo, sk] = await Promise.all([
      supabase.from('bookings').select('*',          { count:'exact', head:true }).eq('status','pending'),
      supabase.from('k3_reports').select('*',        { count:'exact', head:true }).eq('status','pending'),
      supabase.from('pengajuan_dana').select('*',    { count:'exact', head:true }).eq('status','pending'),
      // FIX: ambil semua, filter client-side (column-to-column tidak bisa via .lt() string)
      supabase.from('inventory').select('id,jumlah,minimal_stok'),
      supabase.from('maintenance_tasks').select('*', { count:'exact', head:true }).in('status',['pending','proses']),
      supabase.from('janitor_indoor').select('*',    { count:'exact', head:true }).eq('status','pending'),
      supabase.from('janitor_outdoor').select('*',   { count:'exact', head:true }).eq('status','pending'),
      supabase.from('sekuriti_reports').select('*',  { count:'exact', head:true }).eq('status','pending')
    ]);

    // FIX: filter client-side untuk column-to-column comparison
    const stokKritis = (inv.data||[]).filter(r => Number(r.jumlah) < Number(r.minimal_stok));

    cachedStats = {
      booking:     bk.count  || 0,
      k3:          k3.count  || 0,
      dana:        dn.count  || 0,
      stok:        stokKritis.length,
      maintenance: mn.count  || 0,
      janitorIn:   ji.count  || 0,
      janitorOut:  jo.count  || 0,
      sekuriti:    sk.count  || 0,
      total: (bk.count||0) + (k3.count||0) + (dn.count||0) + (mn.count||0)
    };

    setEl('stat-total',       cachedStats.total);
    setEl('stat-booking',     cachedStats.booking);
    setEl('stat-k3',          cachedStats.k3);
    setEl('stat-dana',        cachedStats.dana);
    setEl('stat-stok',        cachedStats.stok);
    setEl('stat-maintenance', cachedStats.maintenance);

    updateSecurityStatus(cachedStats.total);
    generateAIInsights(cachedStats);

    const lang = localStorage.getItem('lang') || 'id';
    setEl('lastSync', TRANSLATIONS[lang].justNow);

    // Re-render badge
    renderSubmenu(currentTab);

  } catch (err) {
    console.error('[COMMANDCENTER] loadAllStats:', err);
    showToast('Gagal memuat data: ' + err.message, 'error');
  }
}

// ── SECURITY STATUS ──────────────────────────────────
function updateSecurityStatus(total) {
  const el = document.getElementById('securityStatus');
  if (!el) return;
  const lang = localStorage.getItem('lang') || 'id';
  const t    = TRANSLATIONS[lang];
  el.className = 'security-status';
  if (total === 0) {
    el.classList.add('status-safe');
    el.innerHTML = `<i class="fas fa-shield-check mr-2"></i>${t.safe}`;
  } else if (total < 10) {
    el.classList.add('status-warning');
    el.innerHTML = `<i class="fas fa-triangle-exclamation mr-2"></i>${t.warning}`;
  } else {
    el.classList.add('status-danger');
    el.innerHTML = `<i class="fas fa-circle-exclamation mr-2"></i>${t.danger}`;
  }
}

// ── AI INSIGHTS ──────────────────────────────────────
function generateAIInsights(c) {
  const el = document.getElementById('aiMessage');
  const pl = document.getElementById('predictiveList');
  if (!el) return;

  const ins = [];
  if (c.booking    > 5) ins.push('📈 Booking tinggi—siapkan ruangan');
  if (c.k3         > 3) ins.push('⚠️ Perlu review K3 segera');
  if (c.dana       > 5) ins.push('💰 Dana pending menumpuk');
  if (c.stok       > 0) ins.push('📦 Stok kritis—lakukan reorder');
  if (!ins.length)       ins.push('✅ Semua sistem optimal');
  el.innerHTML = ins.join(' &nbsp;|&nbsp; ');

  if (pl) {
    pl.innerHTML = [
      { cls:'normal', ic:'fa-check-circle',      color:'var(--em)', txt:'📊 Booking stabil 7 hari ke depan' },
      { cls: c.k3>3 ? 'high':'normal',   ic:'fa-exclamation-circle',  color: c.k3>3?'var(--or)':'var(--em)', txt: c.k3>3?`⚠️ ${c.k3} K3 reports butuh perhatian`:'✅ K3 dalam batas aman' },
      { cls: c.stok>0 ? 'critical':'normal', ic:'fa-exclamation-triangle', color: c.stok>0?'var(--re)':'var(--em)', txt: c.stok>0?`🔴 ${c.stok} item stok kritis`:'✅ Stok dalam batas aman' }
    ].map(p => `
      <li class="predictive-item ${p.cls}">
        <i class="fas ${p.ic}" style="color:${p.color}"></i>
        <span>${p.txt}</span>
      </li>`).join('');
  }
}

// ── RENDER SUBMENU ───────────────────────────────────
function renderSubmenu(tab) {
  const c = document.getElementById('submenu-container');
  if (!c) return;
  const mods = modulesByTab[tab] || [];
  c.innerHTML = mods.map(m => {
    const badge  = cachedStats[m.id] ? `<span class="submenu-badge">${cachedStats[m.id]}</span>` : '';
    const devCls = m.devOnly ? ' dev-only' : '';
    return `
      <div class="submenu-item${devCls}" onclick="window.openSubModule('${m.id}')">
        <span class="submenu-icon">${m.icon}</span>
        <span class="submenu-name">${m.name}</span>
        ${badge}
      </div>`;
  }).join('');
}

// ── RENDER CONTENT ───────────────────────────────────
function renderContent(tab) {
  const c = document.getElementById('content-area');
  if (!c) return;

  if (tab === 'dashboard') {
    c.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div>
          <p style="font-size:.8rem;font-weight:700;margin-bottom:.75rem">📋 Aktivitas Terbaru</p>
          <div id="activityFeed" class="activity-feed">Memuat...</div>
        </div>
        <div>
          <p style="font-size:.8rem;font-weight:700;margin-bottom:.75rem">🔮 Prediksi AI</p>
          <ul id="predictiveList" class="predictive-list">
            <li class="predictive-item normal">
              <i class="fas fa-spinner fa-spin"></i> Menganalisis...
            </li>
          </ul>
        </div>
      </div>
      <div style="margin-top:1rem">
        <p style="font-size:.8rem;font-weight:700;margin-bottom:.75rem">📊 Kesehatan Sistem</p>
        <div class="health-item"><div class="health-header"><span>Database</span><span>98%</span></div><div class="health-bar"><div class="health-fill green" style="width:98%"></div></div></div>
        <div class="health-item"><div class="health-header"><span>API</span><span>100%</span></div><div class="health-bar"><div class="health-fill green" style="width:100%"></div></div></div>
        <div class="health-item"><div class="health-header"><span>Storage</span><span>75%</span></div><div class="health-bar"><div class="health-fill yellow" style="width:75%"></div></div></div>
        <div class="health-item"><div class="health-header"><span>Security</span><span>100%</span></div><div class="health-bar"><div class="health-fill green" style="width:100%"></div></div></div>
      </div>
      <div class="export-buttons" style="margin-top:1rem">
        <button class="ebt" onclick="window.createBackup()"><i class="fas fa-download"></i>Backup</button>
        <button class="ebt" style="background:rgba(59,130,246,.15)" onclick="window.exportToExcel()"><i class="fas fa-file-excel"></i>Excel</button>
        <button class="ebt" style="background:rgba(168,85,247,.15)" onclick="window.exportToPDF()"><i class="fas fa-file-pdf"></i>PDF</button>
      </div>`;
    loadRecentActivities();
    generateAIInsights(cachedStats);

  } else if (tab === 'kerja') {
    c.innerHTML = `
      <div style="text-align:center;padding:1.5rem">
        <div style="font-size:3rem;margin-bottom:.75rem">🏢</div>
        <p style="font-weight:700">Ruang Kerja</p>
        <p style="opacity:.5;font-size:.85rem;margin:.5rem 0">Pilih modul kerja di atas</p>
      </div>`;

  } else if (tab === 'dana') {
    c.innerHTML = `
      <div style="text-align:center;padding:1.5rem">
        <div style="font-size:3rem;margin-bottom:.75rem">💰</div>
        <p style="font-weight:700">Dana & Keuangan</p>
        <p style="opacity:.5;font-size:.85rem;margin:.5rem 0 1rem">Pilih modul dana di atas</p>
        <div style="background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);border-radius:14px;padding:.875rem">
          <p style="font-size:.85rem">
            <i class="fas fa-clock mr-2" style="color:var(--pu)"></i>
            Pengajuan pending: <strong style="color:var(--pu)">${cachedStats.dana ?? '—'}</strong>
          </p>
        </div>
      </div>`;
  } else {
    c.innerHTML = `<p style="text-align:center;padding:2rem;opacity:.5">Pilih submenu untuk melihat detail</p>`;
  }
}

// ── RECENT ACTIVITIES ────────────────────────────────
async function loadRecentActivities() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action,detail,created_at')
    .order('created_at', { ascending: false })
    .limit(8);
  if (error || !data?.length) {
    feed.innerHTML = '<div style="text-align:center;padding:1rem;opacity:.5;font-size:.82rem">Belum ada aktivitas</div>';
    return;
  }
  feed.innerHTML = data.map(a => `
    <div class="activity-item">
      <div style="width:8px;height:8px;border-radius:50%;background:#10b981;margin-top:4px;flex-shrink:0"></div>
      <div class="activity-content">
        <div class="title">${esc(a.action)}</div>
        <div class="meta">${esc(a.detail)} &bull; ${fmtDT(a.created_at)}</div>
      </div>
    </div>`).join('');
}

// ── WINDOW GLOBALS (dipanggil dari HTML onclick) ─────
// FIX: openSubModule untuk routing ke loadModule() dari core
window.openSubModule = function(id) {
  if (id === 'developer') {
    const user = store.get('user');
    if (!user || !['DEVELOPER','MASTER'].includes(user.role)) {
      showToast('⛔ Akses ditolak — hanya DEVELOPER/MASTER', 'error');
      return;
    }
  }
  if (typeof window.loadModule === 'function') {
    window.loadModule(id);
  } else {
    showToast('loadModule tidak tersedia', 'error');
  }
};

window.createBackup = async function() {
  showToast('⏳ Membuat backup...', 'success');
  const tables = ['bookings','k3_reports','pengajuan_dana','inventory','assets',
    'maintenance_tasks','sekuriti_reports','janitor_indoor','janitor_outdoor'];
  const backup = { version:'2.1', timestamp: new Date().toISOString(), tables:{} };
  for (const t of tables) {
    const { data } = await supabase.from(t).select('*');
    backup.tables[t] = data || [];
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type:'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `dream-os-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('✅ Backup berhasil!', 'success');
};

window.exportToExcel = function() { showToast('📊 Fitur Excel dalam pengembangan', 'info'); };
window.exportToPDF   = function() { showToast('📄 Fitur PDF dalam pengembangan',   'info'); };

// ── AUTO REFRESH ─────────────────────────────────────
function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(loadAllStats, 30000);
}
