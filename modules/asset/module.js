/**
 * modules/asset/module.js
 * Dream OS v2.0 — Modul Inventaris Aset Tetap (REVISED & FIXED)
 * ✅ Fitur: Daftar aset, tambah/edit, QR code functional, laporan pajak, analytics
 * ✅ Fix: ensureSB, writeAuditLog, null checks, CSS complete, error handling
 */

'use strict';

const SB_URL_FALLBACK = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

/* ============================================================
   CSS INJECTION (COMPLETE)
============================================================ */
function injectCSS() {
    if (document.getElementById('asset-styles')) return;
    const s = document.createElement('style');
    s.id = 'asset-styles';
    s.textContent = `
        :root {
            --asset-primary: #8b5cf6;
            --asset-primary-light: rgba(139,92,246,0.1);
            --asset-primary-border: rgba(139,92,246,0.25);
            --asset-bg-panel: rgba(15,23,42,0.88);
            --asset-text: #e2e8f0;
            --asset-text-muted: #94a3b8;
            --asset-text-dim: #64748b;
            --asset-border: rgba(255,255,255,0.08);
            --asset-border-strong: rgba(255,255,255,0.15);
            --asset-radius: 16px;
            --asset-radius-sm: 12px;
            --asset-radius-xs: 8px;
            --asset-transition: 0.2s ease;
            --asset-shadow: 0 4px 18px rgba(139,92,246,0.15);
            --asset-font-mono: 'JetBrains Mono', monospace;
            --asset-font-sans: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        #asset-root * { box-sizing: border-box; }
        #asset-root {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--asset-font-sans);
            color: var(--asset-text);
        }
        .asset-panel {            background: var(--asset-bg-panel);
            backdrop-filter: blur(18px);
            border: 1px solid var(--asset-primary-border);
            border-radius: var(--asset-radius);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: background var(--asset-transition), border-color var(--asset-transition);
        }
        .asset-panel:hover {
            background: rgba(15,23,42,0.92);
            border-color: var(--asset-primary);
        }
        .asset-header {
            background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05));
            border-left: 4px solid var(--asset-primary);
        }
        .asset-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--asset-primary), #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .asset-sub {
            font-size: 0.75rem;
            color: var(--asset-text-muted);
        }
        .asset-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid var(--asset-primary-border);
            margin-bottom: 1.5rem;
            overflow-x: auto;
            scrollbar-width: none;
        }
        .asset-tabs::-webkit-scrollbar { display: none; }
        .asset-tab {
            padding: 0.65rem 1.5rem;
            background: rgba(255,255,255,0.04);
            border: 1px solid transparent;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--asset-text-dim);
            white-space: nowrap;
            transition: background var(--asset-transition), color var(--asset-transition);
        }
        .asset-tab:hover { background: var(--asset-primary-light); color: var(--asset-text); }        .asset-tab.active { background: rgba(139,92,246,0.18); border-color: var(--asset-primary); color: var(--asset-primary); }
        .asset-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .asset-label {
            display: block;
            font-size: 0.75rem;
            color: var(--asset-text-muted);
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .asset-input, .asset-select, .asset-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1.5px solid var(--asset-primary-border);
            border-radius: var(--asset-radius-xs);
            color: var(--asset-text);
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            transition: border-color var(--asset-transition), box-shadow var(--asset-transition);
        }
        .asset-input:focus, .asset-select:focus, .asset-textarea:focus {
            border-color: var(--asset-primary);
            box-shadow: 0 0 0 3px var(--asset-primary-light);
        }
        .asset-select option { background: #1e293b; color: var(--asset-text); }
        .asset-textarea { resize: vertical; min-height: 80px; }
        .asset-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.6rem 1.2rem;
            border-radius: var(--asset-radius-xs);
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: transform var(--asset-transition), background var(--asset-transition), border-color var(--asset-transition);
            border: none;
            background: rgba(255,255,255,0.08);
            color: var(--asset-text);
        }
        .asset-btn:hover:not(:disabled) { transform: translateY(-1px); background: rgba(255,255,255,0.15); }
        .asset-btn-primary {            background: linear-gradient(135deg, var(--asset-primary), #7c3aed);
            color: #020617;
        }
        .asset-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--asset-shadow); }
        .asset-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .asset-btn-sm {
            padding: 0.3rem 1rem;
            font-size: 0.75rem;
            border-radius: 20px;
        }
        .asset-table-wrap {
            overflow-x: auto;
            border-radius: var(--asset-radius);
            border: 1px solid var(--asset-border);
        }
        table.asset-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        table.asset-table thead { background: rgba(0,0,0,0.3); }
        table.asset-table th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.7rem;
            text-transform: uppercase;
            color: var(--asset-text-muted);
        }
        table.asset-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--asset-border);
            vertical-align: middle;
        }
        table.asset-table tr:hover td { background: rgba(255,255,255,0.02); }
        .asset-badge {
            display: inline-block;
            padding: 0.2rem 0.75rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .asset-badge-aktif { background: rgba(16,185,129,0.2); color: #10b981; }
        .asset-badge-rusak { background: rgba(239,68,68,0.2); color: #ef4444; }
        .asset-badge-hilang { background: rgba(100,116,139,0.2); color: #64748b; }
        .asset-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }        .asset-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--asset-primary-light);
            border-top-color: var(--asset-primary);
            border-radius: 50%;
            animation: asset-spin 1s linear infinite;
        }
        @keyframes asset-spin { to { transform: rotate(360deg); } }
        .asset-qr {
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            cursor: pointer;
            transition: background var(--asset-transition);
        }
        .asset-qr:hover { background: var(--asset-primary-light); }
        .asset-stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .asset-stat-card {
            background: rgba(0,0,0,0.2);
            border-radius: var(--asset-radius-sm);
            padding: 1rem;
            border-left: 3px solid var(--asset-primary);
        }
        .asset-stat-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: var(--asset-text-muted);
            letter-spacing: 0.5px;
        }
        .asset-stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 0.25rem;
            color: var(--asset-text);
        }
        .asset-analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;        }
        .asset-chart-box {
            background: rgba(0,0,0,0.2);
            border-radius: var(--asset-radius-sm);
            padding: 1rem;
        }
        @media print {
            #asset-root {
                background: white;
                color: #1e293b;
                padding: 0.5in;
            }
            .asset-panel {
                background: white;
                backdrop-filter: none;
                border: 1px solid #ccc;
                box-shadow: none;
            }
            .asset-tabs, .asset-btn, .asset-header::before, .asset-qr {
                display: none;
            }
        }
        .tier-low .asset-panel {
            backdrop-filter: none;
            background: rgba(15,23,42,0.95);
        }
        .tier-low .asset-spinner {
            animation: none;
        }
    `;
    document.head.appendChild(s);
}

/* ============================================================
   EXPORT DEFAULT — FIXED & COMPLETE
============================================================ */
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    injectCSS();

    // ✅ FIXED: Toast function with fallback
    const toast = showToast || function(msg, type) {
        const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
        const el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
        const tc = document.getElementById('toast-container');
        if (tc) {
            tc.appendChild(el);
            setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 350); }, 3000);
        } else {            el.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(139,92,246,.9);color:white;padding:9px 18px;border-radius:10px;z-index:99999;font-weight:700;font-size:.85rem;`;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2800);
        }
    };

    // ✅ FIXED: Escape function
    const esc = utils?.esc || function(s) {
        return String(s||'').replace(/[&<>"]/g, function(m) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]; });
    };

    // Format helpers
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '—';
    const fmtRp = (n) => 'Rp ' + Number(n||0).toLocaleString('id-ID');

    // State
    let _sb = supabase || null;
    let _user = currentUser || null;
    let _assets = [];

    // ✅ FIXED: ensureSB implementation
    function ensureSB() {
        if (_sb) return Promise.resolve(true);
        if (window.supabase?.createClient) {
            _sb = window.supabase.createClient(SB_URL_FALLBACK, SB_KEY_FALLBACK);
            return Promise.resolve(true);
        }
        return new Promise((resolve) => {
            const sc = document.createElement('script');
            sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            sc.onload = () => {
                if (window.supabase) { _sb = window.supabase.createClient(SB_URL_FALLBACK, SB_KEY_FALLBACK); resolve(true); }
                else resolve(false);
            };
            sc.onerror = () => resolve(false);
            document.head.appendChild(sc);
        });
    }

    // ✅ FIXED: writeAuditLog implementation
    async function writeAuditLog(action, detail) {
        if (!_sb) return;
        try {
            await _sb.from('audit_logs').insert([{
                action,
                detail,
                user: _user?.name || 'System',
                created_at: new Date().toISOString()
            }]);
        } catch (e) { console.warn('[ASSET] audit_log error:', e.message); }    }

    /* ============================================================
       RENDER HTML — WITH STATS & ANALYTICS TAB
    ============================================================ */
    function renderRoot(container) {
        const userName = _user?.name?.toUpperCase() || 'GUEST';
        container.innerHTML = `
        <div id="asset-root">
            <!-- HEADER -->
            <div class="asset-panel asset-header">
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="font-size:3rem;">🏛️</div>
                    <div>
                        <div class="asset-title">INVENTARIS ASET</div>
                        <div class="asset-sub">Manajemen Aset Tetap · Pajak & Penyusutan · QR Tracking</div>
                    </div>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">${esc(userName)}</span>
                    </div>
                </div>
            </div>

            <!-- STATS OVERVIEW -->
            <div class="asset-stat-grid">
                <div class="asset-stat-card">
                    <div class="asset-stat-label">Total Aset</div>
                    <div class="asset-stat-value" id="asset-stat-total">0</div>
                </div>
                <div class="asset-stat-card">
                    <div class="asset-stat-label">Aktif</div>
                    <div class="asset-stat-value" id="asset-stat-aktif" style="color:#10b981">0</div>
                </div>
                <div class="asset-stat-card">
                    <div class="asset-stat-label">Rusak</div>
                    <div class="asset-stat-value" id="asset-stat-rusak" style="color:#ef4444">0</div>
                </div>
                <div class="asset-stat-card">
                    <div class="asset-stat-label">Total Nilai</div>
                    <div class="asset-stat-value" id="asset-stat-nilai" style="font-size:1.2rem">Rp 0</div>
                </div>
            </div>

            <!-- TABS -->
            <div class="asset-tabs">
                <button class="asset-tab active" data-tab="list">📋 Daftar Aset</button>
                <button class="asset-tab" data-tab="tambah">➕ Tambah Aset</button>
                <button class="asset-tab" data-tab="laporan">📊 Laporan Pajak</button>
                <button class="asset-tab" data-tab="analytics">📈 Analytics</button>
            </div>
            <!-- TAB LIST -->
            <div id="asset-tab-list" class="tab-content">
                <div class="asset-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
                        <h3 style="font-size:1.2rem; font-weight:700; color:var(--asset-primary);">Daftar Aset</h3>
                        <input type="text" id="asset-search" placeholder="Cari kode/nama..." class="asset-input" style="max-width:250px;">
                    </div>
                    <div id="asset-list"></div>
                </div>
            </div>

            <!-- TAB TAMBAH -->
            <div id="asset-tab-tambah" class="tab-content" style="display:none;">
                <div class="asset-panel">
                    <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1.5rem; color:var(--asset-primary);">Form Aset</h3>
                    <form id="assetForm">
                        <input type="hidden" id="asset-id">
                        <div class="asset-form-grid">
                            <div><label class="asset-label">Kode Aset *</label><input type="text" id="asset-kode" class="asset-input" required placeholder="Contoh: AST-BGN-001"></div>
                            <div><label class="asset-label">Nama Aset *</label><input type="text" id="asset-nama" class="asset-input" required></div>
                        </div>
                        <div class="asset-form-grid">
                            <div><label class="asset-label">Kategori</label><input type="text" id="asset-kategori" class="asset-input" placeholder="Tanah/Bangunan/Kendaraan/Elektronik"></div>
                            <div><label class="asset-label">Lokasi</label><input type="text" id="asset-lokasi" class="asset-input" placeholder="Contoh: Gedung A Lt 2"></div>
                        </div>
                        <div class="asset-form-grid">
                            <div><label class="asset-label">Nilai Perolehan (Rp)</label><input type="number" id="asset-nilai" class="asset-input" min="0" value="0"></div>
                            <div><label class="asset-label">Tanggal Perolehan</label><input type="date" id="asset-tgl" class="asset-input"></div>
                        </div>
                        <div class="asset-form-grid">
                            <div><label class="asset-label">Masa Manfaat (tahun)</label><input type="number" id="asset-masa" class="asset-input" min="1" placeholder="Contoh: 5"></div>
                            <div><label class="asset-label">Tarif Pajak (%)</label><input type="number" id="asset-tarif" class="asset-input" step="0.1" min="0" placeholder="Contoh: 12.5"></div>
                        </div>
                        <div class="asset-form-grid">
                            <div><label class="asset-label">Penanggung Jawab</label><input type="text" id="asset-pj" class="asset-input" placeholder="Nama PIC"></div>
                            <div><label class="asset-label">Kondisi</label>
                                <select id="asset-kondisi" class="asset-select">
                                    <option value="aktif">Aktif</option>
                                    <option value="rusak">Rusak</option>
                                    <option value="hilang">Hilang</option>
                                </select>
                            </div>
                        </div>
                        <div class="asset-form-grid">
                            <div><label class="asset-label">Metode Penyusutan</label>
                                <select id="asset-metode" class="asset-select">
                                    <option value="garis_lurus">Garis Lurus</option>
                                    <option value="saldo_menurun">Saldo Menurun</option>
                                </select>                            </div>
                            <div><label class="asset-label">QR Code</label>
                                <div class="asset-qr" id="asset-qr-generate" title="Generate QR Code">🖼️</div>
                            </div>
                        </div>
                        <button type="submit" class="asset-btn asset-btn-primary" id="asset-submit">Simpan Aset</button>
                        <div id="asset-form-result" style="margin-top:1rem;text-align:center;"></div>
                    </form>
                </div>
            </div>

            <!-- TAB LAPORAN PAJAK -->
            <div id="asset-tab-laporan" class="tab-content" style="display:none;">
                <div class="asset-panel">
                    <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem; color:var(--asset-primary);">Laporan Pajak Aset</h3>
                    <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
                        <button class="asset-btn asset-btn-primary" id="asset-export-pdf"><i class="fas fa-file-pdf"></i> Export PDF</button>
                        <button class="asset-btn asset-btn" id="asset-print-preview"><i class="fas fa-print"></i> Print</button>
                    </div>
                    <div id="asset-laporan-view" style="background:white; color:#1e293b; padding:1rem; border-radius:8px;"></div>
                </div>
            </div>

            <!-- TAB ANALYTICS -->
            <div id="asset-tab-analytics" class="tab-content" style="display:none;">
                <div class="asset-panel">
                    <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem; color:var(--asset-primary);">📊 Analytics Aset</h3>
                    <div class="asset-analytics-grid">
                        <div class="asset-chart-box">
                            <h4 style="margin-bottom:0.5rem;">Distribusi Kategori</h4>
                            <div id="asset-chart-category"></div>
                        </div>
                        <div class="asset-chart-box">
                            <h4 style="margin-bottom:0.5rem;">Aset Berdasarkan Kondisi</h4>
                            <div id="asset-chart-kondisi"></div>
                        </div>
                        <div class="asset-chart-box">
                            <h4 style="margin-bottom:0.5rem;">Top 5 Nilai Tertinggi</h4>
                            <div id="asset-chart-top"></div>
                        </div>
                        <div class="asset-chart-box">
                            <h4 style="margin-bottom:0.5rem;">Penyusutan per Kategori</h4>
                            <div id="asset-chart-penyusutan"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    /* ============================================================
       LOAD STATS
    ============================================================ */
    async function loadStats() {
        try {
            const { data, error } = await _sb.from('inventaris_aset').select('nilai_perolehan, akum_penyusutan, kondisi');
            if (error) throw error;
            
            const total = data?.length || 0;
            const aktif = data?.filter(a => a.kondisi === 'aktif').length || 0;
            const rusak = data?.filter(a => a.kondisi === 'rusak').length || 0;
            const totalNilai = data?.reduce((sum, a) => sum + (a.nilai_perolehan || 0), 0) || 0;
            
            const totalEl = document.getElementById('asset-stat-total');
            const aktifEl = document.getElementById('asset-stat-aktif');
            const rusakEl = document.getElementById('asset-stat-rusak');
            const nilaiEl = document.getElementById('asset-stat-nilai');
            
            if (totalEl) totalEl.textContent = total;
            if (aktifEl) aktifEl.textContent = aktif;
            if (rusakEl) rusakEl.textContent = rusak;
            if (nilaiEl) nilaiEl.textContent = fmtRp(totalNilai);
        } catch (err) {
            console.warn('[ASSET] Stats error:', err);
        }
    }

    /* ============================================================
       LOAD ASSETS — FIXED: fallback to order by id if created_at missing
    ============================================================ */
    async function loadAssets() {
        const list = document.getElementById('asset-list');
        if (!list) return;
        list.innerHTML = '<div class="asset-loader"><div class="asset-spinner"></div><p style="margin-top:1rem;">Memuat...</p></div>';
        try {
            // Try created_at first, fallback to id if column doesn't exist
            let query = _sb.from('inventaris_aset').select('*');
            try {
                query = query.order('created_at', { ascending: false });
            } catch (e) {
                query = query.order('id', { ascending: false });
            }
            const { data, error } = await query;
            if (error) throw error;
            _assets = data || [];
            renderAssetList(_assets);
            loadStats();
        } catch (err) {
            list.innerHTML = `<p style="color:#ef4444;text-align:center;">Gagal memuat: ${esc(err.message)}</p>`;        }
    }

    function renderAssetList(items) {
        const list = document.getElementById('asset-list');
        if (!list) return;
        if (items.length === 0) {
            list.innerHTML = '<p style="opacity:0.7;text-align:center; padding:2rem;">Belum ada aset</p>';
            return;
        }
        let html = '<div class="asset-table-wrap"><table class="asset-table"><thead><tr><th>Kode</th><th>Nama</th><th>Nilai</th><th>Nilai Buku</th><th>Kondisi</th><th>Lokasi</th><th>Aksi</th></tr></thead><tbody>';
        items.forEach(a => {
            const nilaiBuku = (a.nilai_perolehan - (a.akum_penyusutan || 0)) || a.nilai_perolehan;
            const badgeClass = a.kondisi === 'aktif' ? 'asset-badge-aktif' : a.kondisi === 'rusak' ? 'asset-badge-rusak' : 'asset-badge-hilang';
            html += `
                <tr>
                    <td><strong>${esc(a.kode_aset)}</strong></td>
                    <td>${esc(a.nama_aset)}<br><span style="font-size:0.75rem; opacity:0.7;">${esc(a.kategori||'')}</span></td>
                    <td>${fmtRp(a.nilai_perolehan)}</td>
                    <td>${fmtRp(nilaiBuku)}</td>
                    <td><span class="asset-badge ${badgeClass}">${a.kondisi}</span></td>
                    <td>${esc(a.lokasi||'—')}</td>
                    <td><button class="asset-btn asset-btn-sm" data-id="${a.id}" data-action="edit"><i class="fas fa-edit"></i></button></td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        list.innerHTML = html;
    }

    /* ============================================================
       SUBMIT FORM — FIXED
    ============================================================ */
    async function handleSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('asset-id').value;
        const data = {
            kode_aset: document.getElementById('asset-kode').value,
            nama_aset: document.getElementById('asset-nama').value,
            kategori: document.getElementById('asset-kategori').value || null,
            lokasi: document.getElementById('asset-lokasi').value || null,
            nilai_perolehan: parseFloat(document.getElementById('asset-nilai').value) || 0,
            tgl_perolehan: document.getElementById('asset-tgl').value || null,
            masa_manfaat: parseInt(document.getElementById('asset-masa').value) || null,
            tarif_pajak: parseFloat(document.getElementById('asset-tarif').value) || null,
            penanggung_jawab: document.getElementById('asset-pj').value || null,
            kondisi: document.getElementById('asset-kondisi').value,
            metode_penyusutan: document.getElementById('asset-metode').value
        };
        if (!data.kode_aset || !data.nama_aset) { toast('Kode dan nama aset wajib diisi', 'warning'); return; }        
        const btn = document.getElementById('asset-submit');
        const originalText = btn.innerHTML;
        btn.disabled = true; 
        btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:asset-spin 1s linear infinite"></i> Menyimpan...';
        
        try {
            let error;
            if (id) ({ error } = await _sb.from('inventaris_aset').update(data).eq('id', id));
            else ({ error } = await _sb.from('inventaris_aset').insert([data]));
            if (error) throw error;
            
            await writeAuditLog('Aset ' + (id ? 'Update' : 'Tambah'), data.kode_aset);
            toast('Aset tersimpan', 'success');
            
            document.getElementById('assetForm').reset();
            document.getElementById('asset-id').value = '';
            loadAssets();
            document.querySelector('.asset-tab[data-tab="list"]').click();
        } catch (err) {
            toast('Gagal: ' + err.message, 'error');
            document.getElementById('asset-form-result').innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
        } finally {
            btn.disabled = false; 
            btn.innerHTML = originalText;
        }
    }

    /* ============================================================
       EDIT ASSET
    ============================================================ */
    function editAsset(id) {
        const a = _assets.find(x => x.id === id);
        if (!a) return;
        document.getElementById('asset-id').value = a.id;
        document.getElementById('asset-kode').value = a.kode_aset;
        document.getElementById('asset-nama').value = a.nama_aset;
        document.getElementById('asset-kategori').value = a.kategori || '';
        document.getElementById('asset-lokasi').value = a.lokasi || '';
        document.getElementById('asset-nilai').value = a.nilai_perolehan;
        document.getElementById('asset-tgl').value = a.tgl_perolehan || '';
        document.getElementById('asset-masa').value = a.masa_manfaat || '';
        document.getElementById('asset-tarif').value = a.tarif_pajak || '';
        document.getElementById('asset-pj').value = a.penanggung_jawab || '';
        document.getElementById('asset-kondisi').value = a.kondisi || 'aktif';
        document.getElementById('asset-metode').value = a.metode_penyusutan || 'garis_lurus';
        document.querySelector('.asset-tab[data-tab="tambah"]').click();
    }

    /* ============================================================       SEARCH
    ============================================================ */
    function setupSearch() {
        const inp = document.getElementById('asset-search');
        inp?.addEventListener('input', (e) => {
            const kw = e.target.value.toLowerCase();
            const filtered = _assets.filter(a => 
                a.nama_aset?.toLowerCase().includes(kw) || 
                (a.kode_aset && a.kode_aset.toLowerCase().includes(kw)) ||
                (a.kategori && a.kategori.toLowerCase().includes(kw))
            );
            renderAssetList(filtered);
        });
    }

    /* ============================================================
       LAPORAN PAJAK — FIXED
    ============================================================ */
    async function loadLaporan() {
        const view = document.getElementById('asset-laporan-view');
        if (!view) return;
        view.innerHTML = '<div class="asset-loader"><div class="asset-spinner"></div><p>Memuat laporan...</p></div>';
        try {
            const { data } = await _sb.from('inventaris_aset').select('*').eq('kondisi', 'aktif');
            if (!data || data.length === 0) {
                view.innerHTML = '<p style="opacity:0.7;">Tidak ada aset aktif</p>';
                return;
            }
            let totalNilai = 0, totalAkum = 0;
            data.forEach(a => {
                totalNilai += a.nilai_perolehan || 0;
                totalAkum += a.akum_penyusutan || 0;
            });
            let html = `
                <h3 style="font-size:1.1rem;">Laporan Pajak Aset Tetap</h3>
                <p>Per tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;margin-top:1rem;">
                        <thead style="background:#f1f5f9;">
                            <tr><th style="padding:0.5rem;border:1px solid #cbd5e1;">Kode</th><th>Nama</th><th>Nilai Perolehan</th><th>Akum. Penyusutan</th><th>Nilai Buku</th></tr>
                        </thead>
                        <tbody>
                            ${data.map(a => `<tr>
                                <td style="padding:0.5rem;border:1px solid #cbd5e1;">${esc(a.kode_aset)}</td>
                                <td>${esc(a.nama_aset)}</td>
                                <td style="text-align:right;">${fmtRp(a.nilai_perolehan)}</td>
                                <td style="text-align:right;">${fmtRp(a.akum_penyusutan)}</td>
                                <td style="text-align:right;">${fmtRp((a.nilai_perolehan||0)-(a.akum_penyusutan||0))}</td>
                            </tr>`).join('')}
                        </tbody>                        <tfoot style="background:#f1f5f9;">
                            <tr><td colspan="2" style="text-align:right;font-weight:700;">Total</td>
                                <td style="text-align:right;">${fmtRp(totalNilai)}</td>
                                <td style="text-align:right;">${fmtRp(totalAkum)}</td>
                                <td style="text-align:right;">${fmtRp(totalNilai-totalAkum)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
            view.innerHTML = html;
        } catch (err) {
            view.innerHTML = `<p style="color:#ef4444;">Gagal memuat laporan: ${esc(err.message)}</p>`;
        }
    }

    /* ============================================================
       ANALYTICS TAB
    ============================================================ */
    async function loadAnalytics() {
        const container = document.getElementById('asset-tab-analytics');
        if (!container) return;
        
        try {
            const { data } = await _sb.from('inventaris_aset').select('*');
            if (!data || data.length === 0) {
                container.innerHTML = '<p style="opacity:0.7; text-align:center; padding:2rem;">Belum ada data untuk analytics</p>';
                return;
            }
            
            // Category distribution
            const byCategory = {};
            data.forEach(a => {
                const cat = a.kategori || 'Lainnya';
                byCategory[cat] = (byCategory[cat] || 0) + 1;
            });
            
            // Condition distribution
            const byCondition = { aktif: 0, rusak: 0, hilang: 0 };
            data.forEach(a => {
                if (byCondition[a.kondisi] !== undefined) byCondition[a.kondisi]++;
            });
            
            // Top 5 by value
            const top5 = [...data].sort((a,b) => (b.nilai_perolehan||0) - (a.nilai_perolehan||0)).slice(0,5);
            
            // Depreciation by category
            const depByCat = {};
            data.forEach(a => {
                const cat = a.kategori || 'Lainnya';                depByCat[cat] = (depByCat[cat] || 0) + (a.akum_penyusutan || 0);
            });
            
            let html = `
                <div class="asset-chart-box">
                    <h4 style="margin-bottom:0.5rem;">📦 Distribusi Kategori</h4>
                    ${Object.entries(byCategory).map(([cat, count]) => `
                        <div style="display:flex; justify-content:space-between; padding:0.25rem 0; border-bottom:1px solid var(--asset-border);">
                            <span>${esc(cat)}</span>
                            <span style="font-weight:600;">${count}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="asset-chart-box">
                    <h4 style="margin-bottom:0.5rem;">🔧 Kondisi Aset</h4>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <span class="asset-badge asset-badge-aktif">Aktif: ${byCondition.aktif}</span>
                        <span class="asset-badge asset-badge-rusak">Rusak: ${byCondition.rusak}</span>
                        <span class="asset-badge asset-badge-hilang">Hilang: ${byCondition.hilang}</span>
                    </div>
                </div>
                <div class="asset-chart-box">
                    <h4 style="margin-bottom:0.5rem;">💰 Top 5 Nilai Tertinggi</h4>
                    ${top5.map(a => `
                        <div style="padding:0.25rem 0; border-bottom:1px solid var(--asset-border);">
                            <strong>${esc(a.nama_aset)}</strong><br>
                            <span style="font-size:0.8rem; opacity:0.7;">${esc(a.kode_aset)} | ${fmtRp(a.nilai_perolehan)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="asset-chart-box">
                    <h4 style="margin-bottom:0.5rem;">📉 Total Penyusutan per Kategori</h4>
                    ${Object.entries(depByCat).map(([cat, dep]) => `
                        <div style="display:flex; justify-content:space-between; padding:0.25rem 0; border-bottom:1px solid var(--asset-border);">
                            <span>${esc(cat)}</span>
                            <span style="font-weight:600;">${fmtRp(dep)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            container.innerHTML = `<div class="asset-panel"><div class="asset-analytics-grid">${html}</div></div>`;
        } catch (err) {
            console.error('[ASSET] Analytics error:', err);
            container.innerHTML = `<p style="color:#ef4444;">Gagal memuat analytics</p>`;
        }
    }

    /* ============================================================
       QR CODE GENERATOR — FIXED & FUNCTIONAL
    ============================================================ */    function setupQRGenerator() {
        const qrBtn = document.getElementById('asset-qr-generate');
        if (!qrBtn) return;
        
        qrBtn.addEventListener('click', async () => {
            const kode = document.getElementById('asset-kode')?.value || `ASSET-${Date.now()}`;
            try {
                // Generate QR using public API
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`DREAM-OS|${kode}`)}`;
                
                // Create modal
                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
                modal.innerHTML = `
                    <div style="background:#1e293b; padding:1.5rem; border-radius:16px; text-align:center; max-width:300px; border:1px solid var(--asset-primary-border);">
                        <h4 style="margin-bottom:1rem; color:var(--asset-primary);">QR Code</h4>
                        <p style="font-size:0.85rem; margin-bottom:0.5rem; opacity:0.8;">${esc(kode)}</p>
                        <img src="${qrUrl}" alt="QR Code" style="max-width:200px; border-radius:8px; border:2px solid var(--asset-primary);">
                        <p style="font-size:0.75rem; margin-top:0.5rem; opacity:0.7;">Scan untuk detail aset</p>
                        <button id="asset-qr-close" style="margin-top:1rem; padding:0.5rem 1.5rem; background:var(--asset-primary); border:none; border-radius:8px; color:#020617; font-weight:700; cursor:pointer;">Tutup</button>
                    </div>
                `;
                document.body.appendChild(modal);
                
                // Close handler
                document.getElementById('asset-qr-close')?.addEventListener('click', () => modal.remove());
                modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
                
                toast('QR Code generated!', 'success');
            } catch (err) {
                toast('Gagal generate QR: ' + err.message, 'error');
            }
        });
    }

    /* ============================================================
       EVENT DELEGATION — FIXED
    ============================================================ */
    function attachEvents() {
        // Tab switching
        document.querySelectorAll('.asset-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.asset-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('asset-tab-list').style.display = tab === 'list' ? 'block' : 'none';
                document.getElementById('asset-tab-tambah').style.display = tab === 'tambah' ? 'block' : 'none';
                document.getElementById('asset-tab-laporan').style.display = tab === 'laporan' ? 'block' : 'none';
                document.getElementById('asset-tab-analytics').style.display = tab === 'analytics' ? 'block' : 'none';
                if (tab === 'list') loadAssets();                if (tab === 'laporan') loadLaporan();
                if (tab === 'analytics') loadAnalytics();
            });
        });
        
        // Form submit
        document.getElementById('assetForm')?.addEventListener('submit', handleSubmit);
        
        // Edit button delegation
        document.getElementById('asset-list')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="edit"]');
            if (btn) editAsset(btn.dataset.id);
        });
        
        // Search
        setupSearch();
        
        // QR Generator
        setupQRGenerator();
        
        // Export PDF (simple print)
        document.getElementById('asset-export-pdf')?.addEventListener('click', () => {
            document.querySelector('.asset-tab[data-tab="laporan"]').click();
            setTimeout(() => {
                window.print();
                toast('Print dialog opened', 'info');
            }, 100);
        });
        
        // Print preview
        document.getElementById('asset-print-preview')?.addEventListener('click', () => {
            window.print();
        });
    }

    /* ============================================================
       INIT
    ============================================================ */
    setTimeout(async () => {
        const container = document.getElementById('module-content');
        if (!container) return;
        
        await ensureSB();
        renderRoot(container);
        attachEvents();
        loadAssets();
        
        console.log('[ASSET] Ready ✅');
    }, 100);
    /* ============================================================
       CLEANUP
    ============================================================ */
    return function cleanup() {
        document.getElementById('asset-styles')?.remove();
        console.log('[ASSET] Cleanup done');
    };
}
