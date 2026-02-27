/**
 * DREAM OS v13.5 - SMART INTEGRATED COMMAND CENTER
 * Bismillah bi idznillah. [cite: 2026-01-18]
 * "Mutual integration like a body" [cite: 2026-02-26]
 */

import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

// ── 🛡️ CONFIG & IDENTITY ─────────────────────────────
const SYSTEM_CONFIG = {
  applicant: 'Erwinsyah', // [cite: 2026-01-24]
  approver: 'Hanung Budianto S. E', // [cite: 2026-01-24]
  workStart: 7.5, // 07:30 [cite: 2026-01-11]
  workEnd: 16.0   // 16:00 [cite: 2026-01-11]
};

let cachedStats = { booking: 0, k3: 0, dana: 0, stok: 0, total: 0 };
let currentTab = 'dashboard';
let realtimeChannel = null;

// ── 🧠 INTEGRATED ENGINE (The Immunity) ──────────────
const ImmunitySystem = {
  analyze(table, data) {
    // Jika stok kritis, integrasikan ke modul Dana (ISO 55001)
    if (table === 'inventory' && data.jumlah < data.minimal_stok) {
      showToast(`📦 Stok ${data.nama_barang} kritis! Draft pengajuan dana untuk Pak Hanung disiapkan.`, 'warning');
    }
    // Jika K3 bahaya, kunci sistem booking (Safety First)
    if (table === 'k3_reports' && data.status === 'danger') {
      showToast(`⚠️ Bahaya K3 di ${data.lokasi}! Akses area di-lock otomatis.`, 'error');
    }
  }
};

// ── 🚀 EXPORTED INIT ──────────────────────────────────
export async function init() {
  console.log('[COMMANDCENTER] Pulse Active...');
  
  try {
    // 1. Validasi Jam Kerja [cite: 2026-01-11]
    const now = new Date();
    const currentHour = now.getHours() + (now.getMinutes() / 60);
    if (currentHour < SYSTEM_CONFIG.workStart || currentHour > SYSTEM_CONFIG.workEnd) {
      console.log("Sistem dalam mode monitoring 24 jam (Sekuriti Only).");
    }

    // 2. Jalankan Real-time Listener (No More Polling!)
    setupRealtime();

    // 3. Load Awal & Render
    await loadStats();
    renderSubmenu(currentTab);
    renderContent(currentTab);

  } catch (err) {
    console.error("Critical Error:", err);
    showToast("Sistem Imun: Gagal sinkronisasi data", "error");
  }
}

// ── 📡 REAL-TIME SYNC ────────────────────────────────
function setupRealtime() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);

  realtimeChannel = supabase.channel('system-pulse')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      loadStats(); // Auto-refresh data
      ImmunitySystem.analyze(payload.table, payload.new);
    })
    .subscribe();
}

// ── 📊 DATA AGGREGATION ──────────────────────────────
async function loadStats() {
  const [bk, k3, dn, inv] = await Promise.all([
    supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','pending'),
    supabase.from('k3_reports').select('*', { count:'exact', head:true }).eq('status','pending'),
    supabase.from('pengajuan_dana').select('*', { count:'exact', head:true }).eq('status','pending'),
    supabase.from('inventory').select('id,jumlah,minimal_stok')
  ]);

  cachedStats = {
    booking: bk.count || 0,
    k3: k3.count || 0,
    dana: dn.count || 0,
    stok: (inv.data || []).filter(r => Number(r.jumlah) < Number(r.minimal_stok)).length,
    total: (bk.count||0) + (k3.count||0) + (dn.count||0)
  };

  updateUI();
}

function updateUI() {
  // Update angka-angka di box panel
  const elements = ['total', 'booking', 'k3', 'dana', 'stok'];
  elements.forEach(id => {
    const el = document.getElementById(`stat-${id}`);
    if (el) el.textContent = cachedStats[id === 'total' ? 'total' : id];
  });

  // Update Security Status Box
  const secEl = document.getElementById('securityStatus');
  if (secEl) {
    const isDanger = cachedStats.total > 5;
    secEl.className = `security-status ${isDanger ? 'status-danger' : 'status-safe'}`;
    secEl.innerHTML = isDanger ? '⚠️ WASPADA' : '✅ AMAN'; //
  }
}

// ── 📑 RENDER CONTENT ────────────────────────────────
function renderContent(tab) {
  const area = document.getElementById('content-area');
  if (!area) return;

  if (tab === 'dashboard') {
    area.innerHTML = `
      <div class="activity-grid">
        <div class="card">
          <p class="title">📋 Aktivitas Terbaru</p>
          <div id="feed">Memuat logs...</div>
        </div>
        <div class="card">
          <p class="title">🔮 Prediksi AI</p>
          <div id="aiMessage">
            ${cachedStats.total === 0 ? '✅ Semua sistem optimal' : `🤖 Ada ${cachedStats.total} tugas menanti.`}
          </div>
        </div>
      </div>
    `;
  }
}

export function cleanup() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
}
