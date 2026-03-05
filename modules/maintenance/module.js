/**
 * modules/maintenance/module.js
 * Dream OS v2.0 — Modul Maintenance REVISED
 * ✅ Ceklis Harian, History, Analytics, Search, Reminder
 * ✅ Integrasi Inventory & Command Center
 */

'use strict';

const SB_URL_FALLBACK = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

function injectCSS() {
    if (document.getElementById('maint-styles')) return;
    const s = document.createElement('style');
    s.id = 'maint-styles';
    s.textContent = `
        :root {
            --maint-primary: #f97316;
            --maint-success: #10b981;
            --maint-warning: #f59e0b;
            --maint-danger: #ef4444;
            --maint-bg-panel: rgba(15,23,42,0.88);
            --maint-text: #e2e8f0;
            --maint-radius: 16px;
        }
        #maint-root { max-width: 1400px; margin: 0 auto; padding: 1rem; font-family: 'Inter', sans-serif; color: var(--maint-text); }
        .maint-panel { background: var(--maint-bg-panel); border-radius: var(--maint-radius); padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(249,115,22,0.2); }
        .maint-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .maint-tab { padding: 0.6rem 1.2rem; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; font-weight: 600; }
        .maint-tab.active { background: var(--maint-primary); color: #020617; }
        .maint-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .maint-input, .maint-select, .maint-textarea { width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(249,115,22,0.3); border-radius: 8px; color: var(--maint-text); }
        .maint-btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; }
        .maint-btn-primary { background: var(--maint-primary); color: #020617; }
        .maint-btn-sm { padding: 0.3rem 0.8rem; font-size: 0.8rem; }
        .maint-card { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; }
        .maint-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .badge-pending { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .badge-proses { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .badge-selesai { background: rgba(16,185,129,0.2); color: #10b981; }
        .badge-high { background: rgba(239,68,68,0.2); color: #ef4444; }
        .badge-normal { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .maint-table { width: 100%; border-collapse: collapse; }
        .maint-table th, .maint-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .chart-container { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1rem; margin: 1rem 0; }
        .stat-card { background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05)); border-left: 4px solid var(--maint-primary); padding: 1rem; border-radius: 8px; }
        .stat-value { font-size: 2rem; font-weight: 700; color: var(--maint-primary); }
        .search-box { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .reminder-box { background: rgba(245,158,11,0.1); border: 1px solid var(--maint-warning); border-radius: 8px; padding: 1rem; margin: 1rem 0; }    `;
    document.head.appendChild(s);
}

export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    injectCSS();
    
    const toast = showToast || ((msg, type) => console.log(`[${type}] ${msg}`));
    const esc = utils?.esc || ((s) => String(s||'').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])));
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '—';
    const fmtRp = (n) => 'Rp ' + Number(n||0).toLocaleString('id-ID');
    
    let _sb = supabase;
    let _currentTab = 'dashboard';
    let _currentFilter = 'all';
    
    function renderRoot(container) {
        container.innerHTML = `
        <div id="maint-root">
            <!-- HEADER -->
            <div class="maint-panel" style="background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05)); border-left: 4px solid var(--maint-primary);">
                <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
                    <div style="font-size:3rem;">🔧</div>
                    <div>
                        <div style="font-size:1.8rem; font-weight:800; background: linear-gradient(135deg, var(--maint-primary), #ea580c); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">MAINTENANCE MANAGER</div>
                        <div style="font-size:0.85rem; opacity:0.8;">Ceklis Harian · History · Analytics · Reminder</div>
                    </div>
                </div>
            </div>
            
            <!-- STATS OVERVIEW -->
            <div class="maint-grid" style="margin-bottom:1.5rem;">
                <div class="stat-card">
                    <div style="font-size:0.75rem; opacity:0.8;">Total Tugas</div>
                    <div class="stat-value" id="maint-stat-total">0</div>
                </div>
                <div class="stat-card">
                    <div style="font-size:0.75rem; opacity:0.8;">Dalam Proses</div>
                    <div class="stat-value" id="maint-stat-proses">0</div>
                </div>
                <div class="stat-card">
                    <div style="font-size:0.75rem; opacity:0.8;">Selesai</div>
                    <div class="stat-value" id="maint-stat-selesai">0</div>
                </div>
                <div class="stat-card">
                    <div style="font-size:0.75rem; opacity:0.8;">Pending</div>
                    <div class="stat-value" id="maint-stat-pending">0</div>
                </div>
            </div>
                        <!-- TABS -->
            <div class="maint-tabs">
                <div class="maint-tab active" data-tab="dashboard">📊 Dashboard</div>
                <div class="maint-tab" data-tab="form">➕ Tugas Baru</div>
                <div class="maint-tab" data-tab="history">📜 History</div>
                <div class="maint-tab" data-tab="analytics">📈 Analytics</div>
                <div class="maint-tab" data-tab="schedule">📅 Jadwal Rutin</div>
                <div class="maint-tab" data-tab="reminder">⏰ Reminder</div>
            </div>
            
            <!-- TAB CONTENT -->
            <div id="maint-content"></div>
        </div>
        `;
    }
    
    // DASHBOARD TAB
    async function renderDashboard() {
        const content = document.getElementById('maint-content');
        content.innerHTML = '<div style="text-align:center; padding:3rem;"><div class="maint-spinner"></div><p>Memuat...</p></div>';
        
        try {
            // Fetch stats
            const [total, proses, selesai, pending] = await Promise.all([
                _sb.from('maintenance_tasks').select('*', {count:'exact', head:true}),
                _sb.from('maintenance_tasks').select('*', {count:'exact', head:true}).eq('status','proses'),
                _sb.from('maintenance_tasks').select('*', {count:'exact', head:true}).eq('status','selesai'),
                _sb.from('maintenance_tasks').select('*', {count:'exact', head:true}).eq('status','pending')
            ]);
            
            // Fetch recent tasks
            const {data: recentTasks} = await _sb.from('maintenance_tasks')
                .select('*').order('created_at', {ascending:false}).limit(5);
            
            // Fetch top problematic items
            const {data: topItems} = await _sb.from('maintenance_analytics')
                .select('*').limit(5);
            
            document.getElementById('maint-stat-total').textContent = total.count || 0;
            document.getElementById('maint-stat-proses').textContent = proses.count || 0;
            document.getElementById('maint-stat-selesai').textContent = selesai.count || 0;
            document.getElementById('maint-stat-pending').textContent = pending.count || 0;
            
            let html = `
                <div class="maint-grid" style="grid-template-columns: 2fr 1fr;">
                    <!-- Recent Tasks -->
                    <div class="maint-panel">
                        <h3 style="margin-bottom:1rem;">📋 Tugas Terbaru</h3>
                        ${recentTasks?.map(task => `
                            <div class="maint-card">                                <div style="display:flex; justify-content:space-between; align-items:start;">
                                    <div>
                                        <div style="font-weight:700;">${esc(task.deskripsi)}</div>
                                        <div style="font-size:0.8rem; opacity:0.7; margin-top:0.25rem;">
                                            📍 ${esc(task.lokasi)} | 👤 ${esc(task.petugas)} | 📅 ${fmtDate(task.tanggal)}
                                        </div>
                                    </div>
                                    <span class="maint-badge badge-${task.status}">${task.status}</span>
                                </div>
                            </div>
                        `).join('') || '<p>Tidak ada tugas</p>'}
                    </div>
                    
                    <!-- Top Problematic Items -->
                    <div class="maint-panel">
                        <h3 style="margin-bottom:1rem;">⚠️ Barang Sering Rusak</h3>
                        ${topItems?.map(item => `
                            <div class="maint-card" style="border-left: 3px solid var(--maint-warning);">
                                <div style="font-weight:600;">${esc(item.unit_aset || 'N/A')}</div>
                                <div style="font-size:0.8rem; opacity:0.7;">
                                    📍 ${esc(item.lokasi)}<br>
                                    🔧 ${item.total_maintenance}x maintenance<br>
                                    💰 ${fmtRp(item.total_biaya)}
                                </div>
                            </div>
                        `).join('') || '<p>Tidak ada data</p>'}
                    </div>
                </div>
            `;
            
            content.innerHTML = html;
        } catch (err) {
            console.error('[MAINT] Dashboard error:', err);
            content.innerHTML = '<p style="color:#ef4444;">Gagal memuat dashboard</p>';
        }
    }
    
    // FORM TAB
    function renderForm() {
        const content = document.getElementById('maint-content');
        content.innerHTML = `
            <div class="maint-panel">
                <h3 style="margin-bottom:1.5rem;">📝 Buat Tugas Maintenance Baru</h3>
                <form id="maintForm">
                    <div class="maint-grid">
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Tanggal *</label>
                            <input type="date" id="maint-tanggal" class="maint-input" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div>                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Waktu</label>
                            <input type="time" id="maint-waktu" class="maint-input">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Petugas *</label>
                            <input type="text" id="maint-petugas" class="maint-input" required placeholder="Nama petugas">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Prioritas</label>
                            <select id="maint-prioritas" class="maint-select">
                                <option value="low">Low</option>
                                <option value="normal" selected>Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="maint-grid" style="margin-top:1rem;">
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Jenis Kegiatan *</label>
                            <select id="maint-jenis" class="maint-select" required>
                                <option value="perbaikan">Perbaikan</option>
                                <option value="penggantian">Penggantian</option>
                                <option value="perawatan">Perawatan</option>
                                <option value="cuci_ac">Cuci AC</option>
                                <option value="inspeksi">Inspeksi</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Kategori</label>
                            <select id="maint-kategori" class="maint-select">
                                <option value="ac">AC</option>
                                <option value="listrik">Listrik</option>
                                <option value="plumbing">Plumbing</option>
                                <option value="gedung">Gedung</option>
                                <option value="peralatan">Peralatan</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="maint-grid" style="margin-top:1rem;">
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Lokasi *</label>
                            <input type="text" id="maint-lokasi" class="maint-input" required placeholder="Contoh: Ruang Server">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Gedung</label>
                            <input type="text" id="maint-gedung" class="maint-input" placeholder="Gedung A/B/C">                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Lantai</label>
                            <input type="text" id="maint-lantai" class="maint-input" placeholder="1/2/3">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Unit Aset</label>
                            <input type="text" id="maint-aset" class="maint-input" placeholder="Kode aset (opsional)">
                        </div>
                    </div>
                    
                    <div style="margin-top:1rem;">
                        <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Deskripsi Masalah *</label>
                        <textarea id="maint-deskripsi" class="maint-textarea" rows="3" required placeholder="Jelaskan masalah yang dialami..."></textarea>
                    </div>
                    
                    <div style="margin-top:1rem;">
                        <label style="display:block; margin-bottom:0.5rem; font-size:0.85rem;">Catatan Tambahan</label>
                        <textarea id="maint-catatan" class="maint-textarea" rows="2" placeholder="Catatan atau instruksi khusus..."></textarea>
                    </div>
                    
                    <div style="margin-top:1.5rem; display:flex; gap:0.5rem;">
                        <button type="submit" class="maint-btn maint-btn-primary">
                            <i class="fas fa-save"></i> Simpan Tugas
                        </button>
                        <button type="reset" class="maint-btn" style="background:rgba(255,255,255,0.1);">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('maintForm').addEventListener('submit', handleSubmit);
    }
    
    // HANDLE SUBMIT
    async function handleSubmit(e) {
        e.preventDefault();
        
        const data = {
            kode_task: `MNT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
            tanggal: document.getElementById('maint-tanggal').value,
            waktu: document.getElementById('maint-waktu').value || null,
            petugas: document.getElementById('maint-petugas').value,
            jenis_kegiatan: document.getElementById('maint-jenis').value,
            kategori: document.getElementById('maint-kategori').value,
            lokasi: document.getElementById('maint-lokasi').value,
            gedung: document.getElementById('maint-gedung').value || null,
            lantai: document.getElementById('maint-lantai').value || null,            unit_aset: document.getElementById('maint-aset').value || null,
            deskripsi: document.getElementById('maint-deskripsi').value,
            prioritas: document.getElementById('maint-prioritas').value,
            catatan: document.getElementById('maint-catatan').value || null,
            status: 'pending',
            progress: 0,
            created_at: new Date().toISOString()
        };
        
        try {
            const {error} = await _sb.from('maintenance_tasks').insert([data]);
            if (error) throw error;
            
            toast('Tugas maintenance berhasil dibuat!', 'success');
            document.getElementById('maintForm').reset();
            
            // Refresh dashboard
            if (_currentTab === 'dashboard') renderDashboard();
        } catch (err) {
            console.error('[MAINT] Submit error:', err);
            toast('Gagal: ' + err.message, 'error');
        }
    }
    
    // HISTORY TAB (with search)
    async function renderHistory() {
        const content = document.getElementById('maint-content');
        content.innerHTML = `
            <div class="maint-panel">
                <h3 style="margin-bottom:1rem;">📜 History Maintenance</h3>
                
                <!-- Search Box -->
                <div class="search-box">
                    <input type="text" id="maint-search" class="maint-input" placeholder="Cari: cuci ac, penggantian, tanggal..." style="flex:1;">
                    <select id="maint-filter-jenis" class="maint-select" style="max-width:200px;">
                        <option value="">Semua Jenis</option>
                        <option value="perbaikan">Perbaikan</option>
                        <option value="penggantian">Penggantian</option>
                        <option value="perawatan">Perawatan</option>
                        <option value="cuci_ac">Cuci AC</option>
                    </select>
                    <button id="maint-search-btn" class="maint-btn maint-btn-primary">
                        <i class="fas fa-search"></i> Cari
                    </button>
                </div>
                
                <!-- Results -->
                <div id="maint-history-results"></div>
            </div>
        `;        
        await loadHistory();
        
        document.getElementById('maint-search-btn').addEventListener('click', loadHistory);
        document.getElementById('maint-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loadHistory();
        });
    }
    
    async function loadHistory() {
        const search = document.getElementById('maint-search')?.value || '';
        const filterJenis = document.getElementById('maint-filter-jenis')?.value || '';
        const resultsDiv = document.getElementById('maint-history-results');
        
        resultsDiv.innerHTML = '<div style="text-align:center; padding:2rem;"><div class="maint-spinner"></div></div>';
        
        try {
            let query = _sb.from('maintenance_tasks')
                .select('*')
                .eq('status', 'selesai')
                .order('completed_at', {ascending: false})
                .limit(50);
            
            if (filterJenis) query = query.eq('jenis_kegiatan', filterJenis);
            
            const {data, error} = await query;
            if (error) throw error;
            
            // Client-side search
            let filtered = data || [];
            if (search) {
                filtered = filtered.filter(task => 
                    task.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
                    task.lokasi?.toLowerCase().includes(search.toLowerCase()) ||
                    task.unit_aset?.toLowerCase().includes(search.toLowerCase()) ||
                    task.catatan?.toLowerCase().includes(search.toLowerCase())
                );
            }
            
            if (filtered.length === 0) {
                resultsDiv.innerHTML = '<p style="text-align:center; opacity:0.7; padding:2rem;">Tidak ada data</p>';
                return;
            }
            
            let html = `
                <div style="overflow-x:auto;">
                    <table class="maint-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>                                <th>Jenis</th>
                                <th>Lokasi</th>
                                <th>Unit</th>
                                <th>Petugas</th>
                                <th>Biaya</th>
                                <th>Solusi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(task => `
                                <tr>
                                    <td>${fmtDate(task.completed_at || task.tanggal)}</td>
                                    <td>${esc(task.jenis_kegiatan)}</td>
                                    <td>${esc(task.lokasi)}</td>
                                    <td>${esc(task.unit_aset || '-')}</td>
                                    <td>${esc(task.petugas)}</td>
                                    <td>${fmtRp(task.total_biaya || 0)}</td>
                                    <td>${esc(task.solusi || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            resultsDiv.innerHTML = html;
        } catch (err) {
            console.error('[MAINT] Load history error:', err);
            resultsDiv.innerHTML = '<p style="color:#ef4444;">Gagal memuat history</p>';
        }
    }
    
    // ANALYTICS TAB
    async function renderAnalytics() {
        const content = document.getElementById('maint-content');
        content.innerHTML = '<div style="text-align:center; padding:3rem;"><div class="maint-spinner"></div></div>';
        
        try {
            const {data: analytics} = await _sb.from('maintenance_analytics').select('*');
            
            let html = `
                <div class="maint-panel">
                    <h3 style="margin-bottom:1rem;">📊 Analytics - Barang Sering Rusak</h3>
                    <div class="chart-container">
                        <table class="maint-table">
                            <thead>
                                <tr>
                                    <th>Unit Aset</th>
                                    <th>Lokasi</th>
                                    <th>Total Maintenance</th>                                    <th>Perbaikan</th>
                                    <th>Penggantian</th>
                                    <th>Perawatan</th>
                                    <th>Total Biaya</th>
                                    <th>Rata-rata Durasi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${analytics?.map(item => `
                                    <tr style="${item.total_maintenance > 5 ? 'background:rgba(239,68,68,0.1);' : ''}">
                                        <td><strong>${esc(item.unit_aset || 'N/A')}</strong></td>
                                        <td>${esc(item.lokasi)}</td>
                                        <td><span class="maint-badge badge-${item.total_maintenance > 5 ? 'high' : 'normal'}">${item.total_maintenance}x</span></td>
                                        <td>${item.total_perbaikan}</td>
                                        <td>${item.total_penggantian}</td>
                                        <td>${item.total_perawatan}</td>
                                        <td>${fmtRp(item.total_biaya)}</td>
                                        <td>${Math.round(item.avg_duration_minutes || 0)} menit</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="8" style="text-align:center;">Tidak ada data</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            content.innerHTML = html;
        } catch (err) {
            console.error('[MAINT] Analytics error:', err);
            content.innerHTML = '<p style="color:#ef4444;">Gagal memuat analytics</p>';
        }
    }
    
    // SCHEDULE TAB
    function renderSchedule() {
        const content = document.getElementById('maint-content');
        content.innerHTML = `
            <div class="maint-panel">
                <h3 style="margin-bottom:1rem;">📅 Jadwal Maintenance Rutin</h3>
                <p style="opacity:0.7; margin-bottom:1rem;">Jadwal perawatan berkala untuk mencegah kerusakan</p>
                <div id="maint-schedule-list"></div>
            </div>
        `;
        loadSchedule();
    }
    
    async function loadSchedule() {
        const {data, error} = await _sb.from('maintenance_schedule')
            .select('*')
            .order('next_execution', {ascending: true});        
        const listDiv = document.getElementById('maint-schedule-list');
        if (error || !data || data.length === 0) {
            listDiv.innerHTML = '<p style="opacity:0.7;">Belum ada jadwal rutin</p>';
            return;
        }
        
        let html = data.map(schedule => `
            <div class="maint-card">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <div style="font-weight:700;">${esc(schedule.nama_jadwal)}</div>
                        <div style="font-size:0.85rem; opacity:0.8; margin-top:0.25rem;">
                            🔧 ${esc(schedule.jenis_kegiatan)} | 
                            📍 ${esc(schedule.lokasi)} | 
                            📅 ${schedule.frekuensi}
                        </div>
                        <div style="font-size:0.8rem; opacity:0.7; margin-top:0.25rem;">
                            Berikutnya: ${fmtDate(schedule.next_execution)}
                        </div>
                    </div>
                    <span class="maint-badge badge-${schedule.status === 'active' ? 'selesai' : 'pending'}">${schedule.status}</span>
                </div>
            </div>
        `).join('');
        
        listDiv.innerHTML = html;
    }
    
    // REMINDER TAB
    async function renderReminder() {
        const content = document.getElementById('maint-content');
        
        try {
            // Get overdue tasks
            const {data: overdue} = await _sb.from('maintenance_tasks')
                .select('*')
                .eq('status', 'pending')
                .lt('tanggal', new Date().toISOString().split('T')[0])
                .order('tanggal', {ascending: true});
            
            // Get items that need frequent maintenance
            const {data: frequentItems} = await _sb.from('maintenance_analytics')
                .select('*')
                .gte('total_maintenance', 5)
                .limit(10);
            
            let html = `
                <div class="reminder-box">
                    <h3 style="margin-bottom:1rem;">⚠️ Tugas Overdue</h3>                    ${overdue?.map(task => `
                        <div class="maint-card" style="border-left: 3px solid var(--maint-danger);">
                            <div style="font-weight:600;">${esc(task.deskripsi)}</div>
                            <div style="font-size:0.8rem; opacity:0.7;">
                                📅 Jatuh tempo: ${fmtDate(task.tanggal)} | 
                                📍 ${esc(task.lokasi)} | 
                                👤 ${esc(task.petugas)}
                            </div>
                        </div>
                    `).join('') || '<p>Tidak ada tugas overdue</p>'}
                </div>
                
                <div class="maint-panel">
                    <h3 style="margin-bottom:1rem;">🔁 Barang Perlu Perhatian Khusus</h3>
                    <p style="font-size:0.85rem; opacity:0.8; margin-bottom:1rem;">
                        Unit ini sering mengalami masalah (${frequentItems?.length || 0} item)
                    </p>
                    ${frequentItems?.map(item => `
                        <div class="maint-card" style="border-left: 3px solid var(--maint-warning);">
                            <div style="font-weight:600;">${esc(item.unit_aset || 'N/A')}</div>
                            <div style="font-size:0.8rem; opacity:0.7;">
                                📍 ${esc(item.lokasi)} | 
                                🔧 ${item.total_maintenance}x maintenance | 
                                💰 Total: ${fmtRp(item.total_biaya)}
                            </div>
                            <div style="font-size:0.75rem; margin-top:0.5rem; color:var(--maint-warning);">
                                ⚠️ Pertimbangkan penggantian unit
                            </div>
                        </div>
                    `).join('') || '<p>Tidak ada item yang perlu perhatian khusus</p>'}
                </div>
            `;
            
            content.innerHTML = html;
        } catch (err) {
            console.error('[MAINT] Reminder error:', err);
            content.innerHTML = '<p style="color:#ef4444;">Gagal memuat reminder</p>';
        }
    }
    
    // TAB SWITCHING
    function switchTab(tab) {
        _currentTab = tab;
        document.querySelectorAll('.maint-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.maint-tab[data-tab="${tab}"]`)?.classList.add('active');
        
        switch(tab) {
            case 'dashboard': renderDashboard(); break;
            case 'form': renderForm(); break;
            case 'history': renderHistory(); break;            case 'analytics': renderAnalytics(); break;
            case 'schedule': renderSchedule(); break;
            case 'reminder': renderReminder(); break;
        }
    }
    
    // INIT
    setTimeout(() => {
        const container = document.getElementById('module-content');
        if (!container) return;
        
        renderRoot(container);
        
        // Attach tab events
        document.querySelectorAll('.maint-tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        
        // Load default tab
        renderDashboard();
    }, 100);
}

export function cleanup() {
    document.getElementById('maint-styles')?.remove();
    console.log('[MAINT] Cleanup done');
}
