<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Command Center | Dream OS v2.0</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --emerald: #10b981; --blue: #3b82f6; --orange: #f59e0b; --purple: #a855f7; --red: #ef4444; --bg: rgba(255,255,255,0.05); --border: rgba(255,255,255,0.1); }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: linear-gradient(135deg, #020617 0%, #1e293b 100%); color: white; font-family: 'Rajdhani', sans-serif; padding: 1rem; min-height: 100vh; }
        .crystal-card { background: var(--bg); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .arabic { font-family: 'Amiri', serif; }
        .tab-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px; padding: 0.75rem 1.5rem; color: white; cursor: pointer; transition: 0.3s; }
        .tab-btn.active { background: var(--emerald); border-color: var(--emerald); }
        .stat-box { background: rgba(255,255,255,0.03); border-radius: 16px; padding: 1rem; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: 700; }
        .security-status { padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; text-transform: uppercase; text-align: center; }
        .status-safe { background: rgba(16,185,129,0.2); color: var(--emerald); border: 1px solid var(--emerald); }
        .status-warning { background: rgba(245,158,11,0.2); color: var(--orange); border: 1px solid var(--orange); }
        .status-danger { background: rgba(239,68,68,0.2); color: var(--red); border: 1px solid var(--red); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .back-btn { position: fixed; top: 20px; left: 20px; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 0.75rem 1rem; color: var(--emerald); cursor: pointer; z-index: 100; }
        .submenu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .submenu-item { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 16px; padding: 1rem 0.5rem; text-align: center; cursor: pointer; transition: 0.3s; position: relative; }
        .submenu-item:hover { border-color: var(--emerald); transform: translateY(-2px); }
        .submenu-icon { font-size: 1.5rem; margin-bottom: 0.25rem; display: block; }
        .submenu-name { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; }
        .submenu-badge { position: absolute; top: 5px; right: 5px; background: rgba(245,158,11,0.2); color: var(--orange); border-radius: 12px; padding: 0.2rem 0.5rem; font-size: 0.6rem; font-weight: 700; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .activity-item { display: flex; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .btn-action { background: rgba(255,255,255,0.1); border: none; border-radius: 10px; padding: 0.6rem 1rem; color: white; cursor: pointer; transition: 0.2s; }
        .shalawat-top { text-align: center; padding: 1.5rem 1rem; margin-bottom: 1.5rem; background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); border-radius: 24px; backdrop-filter: blur(20px); }
        .bismillah { font-family: 'Amiri', serif; font-size: 2rem; color: var(--emerald); margin-bottom: 1rem; }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } .submenu-grid { grid-template-columns: repeat(4, 1fr); } }
    </style>
</head>
<body>

<button class="back-btn" onclick="window.doCloseModule ? window.doCloseModule() : window.history.back()">
    <i class="fas fa-arrow-left"></i> <span>Kembali</span>
</button>

<div class="shalawat-top">
    <p class="bismillah">بِسْمِ اللَّهِ</p>
    <p class="arabic text-lg text-emerald-400">اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ</p>
    <p class="text-[8px] text-white/30 tracking-[3px]">THE POWER SOUL OF SHALAWAT</p></div>

<div class="crystal-card">
    <div class="flex justify-between items-center flex-wrap gap-4">
        <div class="flex items-center gap-3">
            <div class="text-3xl">🚀</div>
            <div>
                <h1 class="text-xl font-bold" style="color: var(--emerald);">Command Center <span class="text-white">v2.0</span></h1>
                <p class="text-[8px] text-slate-400">Real-time Monitoring & Control</p>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <div class="text-right">
                <div class="text-sm text-slate-300" id="user-display">Guest</div>
                <div class="text-[10px] text-slate-400" id="clock">--:--:--</div>
            </div>
            <button onclick="window.doLogout ? window.doLogout() : location.reload()" class="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg text-xs transition">Logout</button>
        </div>
    </div>
</div>

<div class="crystal-card" style="background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%); border: 1px solid rgba(16,185,129,0.3);">
    <h3 class="text-lg font-bold mb-2 flex items-center gap-2">
        <i class="fas fa-brain text-emerald-400"></i> AI Insight
    </h3>
    <p id="aiMessage" class="text-sm" style="color: rgba(255,255,255,0.7);">
        <i class="fas fa-circle-notch spin mr-2"></i> Menganalisis...
    </p>
</div>

<div class="crystal-card">
    <div style="font-size: 0.7rem; opacity: 0.5; text-align: right; margin-bottom: 0.5rem;">Sinkronisasi: <span id="lastSync">—</span></div>
    <h3 class="text-sm font-bold mb-3" style="opacity:0.6">Status Keamanan</h3>
    <div class="security-status status-safe" id="securityStatus">
        <i class="fas fa-shield-check mr-2"></i><span>AMAN</span>
    </div>
</div>

<div class="stats-grid">
    <div class="stat-box" onclick="window.goToModule && window.goToModule('all')">
        <div class="stat-value" style="color: var(--blue);" id="stat-total">0</div>
        <div class="text-xs">Total Pending</div>
    </div>
    <div class="stat-box" onclick="window.goToModule && window.goToModule('booking')">
        <div class="stat-value" style="color: var(--emerald);" id="stat-booking">0</div>
        <div class="text-xs">Booking</div>
    </div>
    <div class="stat-box" onclick="window.goToModule && window.goToModule('k3')">
        <div class="stat-value" style="color: var(--orange);" id="stat-k3">0</div>
        <div class="text-xs">K3</div>    </div>
    <div class="stat-box" onclick="window.goToModule && window.goToModule('dana')">
        <div class="stat-value" style="color: var(--purple);" id="stat-dana">0</div>
        <div class="text-xs">Dana</div>
    </div>
    <div class="stat-box" onclick="window.goToModule && window.goToModule('stok')">
        <div class="stat-value" style="color: cyan;" id="stat-stok">0</div>
        <div class="text-xs">Stok</div>
    </div>
    <div class="stat-box" onclick="window.goToModule && window.goToModule('maintenance')">
        <div class="stat-value" style="color: var(--orange);" id="stat-maintenance">0</div>
        <div class="text-xs">Maintenance</div>
    </div>
</div>

<div class="tab-container flex gap-2 mb-6 overflow-x-auto">
    <button class="tab-btn active" data-tab="dashboard">📊 Dashboard</button>
    <button class="tab-btn" data-tab="kerja">🏢 R. Kerja</button>
    <button class="tab-btn" data-tab="dana">💰 Dana</button>
    <button class="tab-btn" data-tab="approval">✅ Approval</button>
</div>

<div id="submenu-container" class="submenu-grid"></div>
<div id="content-area" class="content-area crystal-card">
    <div class="text-center py-8 opacity-60">
        <i class="fas fa-circle-notch spin text-2xl mb-3"></i>
        <p>Memuat...</p>
    </div>
</div>

<div class="text-center mt-6 mb-4">
    <p class="text-[8px] text-slate-500">Dream Team © 2026 | ISO 27001 • ISO 55001 • ISO 9001</p>
</div>
<div id="toast-container"></div>

<script>
(function() {
    // Use existing Supabase from main app
    const supabase = window.supabase;
    
    const TABLES = {
        bookings: 'bookings', k3: 'k3_reports', maintenance: 'maintenance_tasks',
        inventory: 'inventory', dana: 'pengajuan_dana', audit_logs: 'audit_logs'
    };
    
    const MODULES_BY_TAB = {
        dashboard: [
            { id: 'analytics', name: 'Analytics', icon: '📈' },
            { id: 'approval', name: 'Approval', icon: '✅' },
            { id: 'backup', name: 'Backup', icon: '💾' }        ],
        kerja: [
            { id: 'booking', name: 'Booking', icon: '📅' },
            { id: 'k3', name: 'K3', icon: '⚠️' },
            { id: 'sekuriti', name: 'Sekuriti', icon: '🛡️' },
            { id: 'stok', name: 'Stok', icon: '📦' },
            { id: 'maintenance', name: 'Maintenance', icon: '🔧' }
        ],
        dana: [
            { id: 'dana', name: 'Dana', icon: '💰' },
            { id: 'approval', name: 'Approval', icon: '✅' }
        ]
    };
    
    let cachedStats = {}, currentTab = 'dashboard', refreshTimer = null;
    
    function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
    
    function showToast(msg) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:8px 16px;border-radius:12px;z-index:9999;opacity:0;transition:opacity 0.3s;';
        t.textContent = msg; document.body.appendChild(t);
        setTimeout(() => t.style.opacity = '1', 10);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
    }
    
    window.goToModule = function(id) {
        if (typeof window.loadModule === 'function') window.loadModule(id);
        else showToast('Pilih modul spesifik');
    };
    
    function renderSubmenu(tab) {
        const c = document.getElementById('submenu-container'); if (!c) return;
        const mods = MODULES_BY_TAB[tab] || [];
        c.innerHTML = mods.map(m => {
            const badge = cachedStats[m.id] ? `<span class="submenu-badge">${cachedStats[m.id]}</span>` : '';
            return `<div class="submenu-item" onclick="window.goToModule('${m.id}')">
                <span class="submenu-icon">${m.icon}</span><span class="submenu-name">${m.name}</span>${badge}</div>`;
        }).join('');
    }
    
    function renderContent(tab) {
        const c = document.getElementById('content-area'); if (!c) return;
        if (tab === 'dashboard') {
            c.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div><h4 class="text-sm font-bold mb-3">📋 Aktivitas Terbaru</h4><div id="activityFeed" class="space-y-2 max-h-40 overflow-y-auto"><div class="text-center py-4 opacity-60">Memuat...</div></div></div>
                <div><h4 class="text-sm font-bold mb-3">🔮 Prediksi AI</h4><ul id="predictiveList" class="space-y-2"><li class="text-sm opacity-60">Menganalisis...</li></ul></div>
            </div><div class="flex gap-2 mt-4">
                <button class="btn-action" onclick="window.createBackup()"><i class="fas fa-download mr-2"></i>Backup</button>
            </div>`;            loadRecentActivities(); generateAIInsights();
        } else c.innerHTML = `<p class="text-center py-8 opacity-60">Pilih submenu ${tab.toUpperCase()}</p>`;
    }
    
    window.switchTab = function(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (btn) btn.classList.add('active');
        currentTab = tabId; renderSubmenu(tabId); renderContent(tabId);
    };
    
    async function loadAllStats() {
        if (!supabase) return;
        try {
            const [booking, k3, dana, maintenance] = await Promise.all([
                supabase.from(TABLES.bookings).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from(TABLES.k3).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from(TABLES.dana).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from(TABLES.maintenance).select('*', { count: 'exact', head: true }).in('status', ['pending', 'proses'])
            ]);
            cachedStats = {
                booking: booking.count || 0, k3: k3.count || 0, dana: dana.count || 0,
                maintenance: maintenance.count || 0,
                total: (booking.count||0)+(k3.count||0)+(dana.count||0)+(maintenance.count||0)
            };
            setEl('stat-total', cachedStats.total); setEl('stat-booking', cachedStats.booking);
            setEl('stat-k3', cachedStats.k3); setEl('stat-dana', cachedStats.dana);
            setEl('stat-maintenance', cachedStats.maintenance);
            updateSecurityStatus(cachedStats.total); generateAIInsights();
            setEl('lastSync', new Date().toLocaleTimeString('id-ID')); renderSubmenu(currentTab);
        } catch (err) { console.error('Stats error:', err); }
    }
    
    function updateSecurityStatus(total) {
        const s = document.getElementById('securityStatus'); if (!s) return;
        s.className = 'security-status';
        if (total === 0) { s.classList.add('status-safe'); s.innerHTML = '<i class="fas fa-shield-check mr-2"></i><span>AMAN</span>'; }
        else if (total < 10) { s.classList.add('status-warning'); s.innerHTML = '<i class="fas fa-triangle-exclamation mr-2"></i><span>WASPADA</span>'; }
        else { s.classList.add('status-danger'); s.innerHTML = '<i class="fas fa-circle-exclamation mr-2"></i><span>BAHAYA</span>'; }
    }
    
    function generateAIInsights() {
        const ai = document.getElementById('aiMessage'); if (!ai) return;
        const insights = [];
        if (cachedStats.booking > 5) insights.push('📈 Booking tinggi');
        if (cachedStats.k3 > 3) insights.push('⚠️ Review K3');
        if (cachedStats.dana > 5) insights.push('💰 Dana pending');
        ai.innerHTML = insights.length ? insights.join(' | ') : '✅ Semua optimal';
        
        const pl = document.getElementById('predictiveList'); if (pl) {            pl.innerHTML = [
                { icon: 'fa-check-circle', color: 'var(--emerald)', txt: '📊 Booking stabil 7 hari ke depan' },
                { icon: cachedStats.k3 > 3 ? 'fa-exclamation-circle' : 'fa-check-circle', 
                  color: cachedStats.k3 > 3 ? 'var(--orange)' : 'var(--emerald)',
                  txt: cachedStats.k3 > 3 ? `⚠️ ${cachedStats.k3} K3 reports butuh perhatian` : '✅ K3 dalam batas aman' }
            ].map(p => `<li class="text-sm p-2 rounded" style="background:rgba(255,255,255,0.05)">
                <i class="fas ${p.icon}" style="color:${p.color}"></i> ${p.txt}</li>`).join('');
        }
    }
    
    async function loadRecentActivities() {
        const feed = document.getElementById('activityFeed'); if (!feed || !supabase) return;
        try {
            const { data } = await supabase.from('audit_logs').select('action, detail, created_at').order('created_at', { ascending: false }).limit(5);
            if (!data?.length) { feed.innerHTML = '<div class="text-center py-4 opacity-60">Belum ada aktivitas</div>'; return; }
            feed.innerHTML = data.map(a => `
                <div class="activity-item"><div style="width:8px;height:8px;border-radius:50%;background:#10b981;margin-top:4px;flex-shrink:0"></div>
                <div class="flex-1"><div class="text-sm font-bold">${a.action}</div>
                <div class="text-xs opacity-60">${a.detail} • ${new Date(a.created_at).toLocaleString('id-ID')}</div></div></div>`).join('');
        } catch (err) { feed.innerHTML = '<div class="text-center py-4 opacity-60">Gagal memuat</div>'; }
    }
    
    async function loadRecentBookings() {
        const c = document.getElementById('recent-bookings'); if (!c) return;
        try {
            const { data } = await supabase.from('bookings').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
            if (!data?.length) { c.innerHTML = '<p class="text-sm opacity-60">Tidak ada booking pending</p>'; return; }
            c.innerHTML = data.map(i => `
                <div class="glass-card p-2 flex justify-between items-center">
                    <div><div class="font-bold">${i.nama_peminjam||'-'}</div><div class="text-xs opacity-60">${i.ruang} • ${i.tanggal} ${i.jam_mulai}</div></div>
                    <div class="flex gap-1">
                        <button onclick="updateStatus('bookings','${i.id}','approved')" class="bg-emerald-600 px-2 py-1 rounded text-xs">✓</button>
                        <button onclick="updateStatus('bookings','${i.id}','rejected')" class="bg-red-600 px-2 py-1 rounded text-xs">✗</button>
                    </div>
                </div>`).join('');
        } catch (err) { c.innerHTML = '<p class="text-sm text-red-400">Gagal memuat</p>'; }
    }
    
    async function loadRecentK3() {
        const c = document.getElementById('recent-k3'); if (!c) return;
        try {
            const { data } = await supabase.from('k3_reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
            if (!data?.length) { c.innerHTML = '<p class="text-sm opacity-60">Tidak ada K3 pending</p>'; return; }
            c.innerHTML = data.map(i => `
                <div class="glass-card p-2 flex justify-between items-center">
                    <div><div class="font-bold">${i.jenis_laporan||'-'}</div><div class="text-xs opacity-60">${i.lokasi} • ${i.tanggal}</div></div>
                    <button onclick="updateStatus('k3_reports','${i.id}','verified')" class="bg-blue-600 px-2 py-1 rounded text-xs">Verifikasi</button>
                </div>`).join('');
        } catch (err) { c.innerHTML = '<p class="text-sm text-red-400">Gagal memuat</p>'; }
    }    
    async function loadRecentDana() {
        const c = document.getElementById('recent-dana'); if (!c) return;
        try {
            const { data } = await supabase.from('pengajuan_dana').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
            if (!data?.length) { c.innerHTML = '<p class="text-sm opacity-60">Tidak ada dana pending</p>'; return; }
            c.innerHTML = data.map(i => `
                <div class="glass-card p-2 flex justify-between items-center">
                    <div><div class="font-bold">${i.judul||'-'}</div><div class="text-xs opacity-60">Rp ${Number(i.nominal||0).toLocaleString()} • ${i.pengaju}</div></div>
                    <div class="flex gap-1">
                        <button onclick="updateStatus('pengajuan_dana','${i.id}','disetujui')" class="bg-emerald-600 px-2 py-1 rounded text-xs">✓</button>
                        <button onclick="updateStatus('pengajuan_dana','${i.id}','ditolak')" class="bg-red-600 px-2 py-1 rounded text-xs">✗</button>
                    </div>
                </div>`).join('');
        } catch (err) { c.innerHTML = '<p class="text-sm text-red-400">Gagal memuat</p>'; }
    }
    
    window.updateStatus = async (table, id, status) => {
        showToast('Memproses...');
        try {
            await supabase.from(table).update({ status }).eq('id', id);
            showToast(`✅ Berhasil ${status}!`);
            loadRecentBookings(); loadRecentK3(); loadRecentDana(); loadAllStats();
        } catch (err) { showToast('❌ Gagal: ' + err.message); }
    };
    
    window.createBackup = async () => {
        if (!supabase) { showToast('Database tidak tersedia'); return; }
        showToast('⏳ Membuat backup...');
        try {
            const tables = ['bookings','k3_reports','pengajuan_dana','inventory'];
            const backup = { timestamp: new Date().toISOString() };
            for (const table of tables) {
                const { data } = await supabase.from(table).select('*');
                backup[table] = data || [];
            }
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            a.download = `dream-os-backup-${Date.now()}.json`; a.click();
            URL.revokeObjectURL(url); showToast('✅ Backup berhasil!');
        } catch (err) { showToast('❌ Backup gagal: ' + err.message); }
    };
    
    function startClock() {
        setInterval(() => { const c = document.getElementById('clock'); if (c) c.textContent = new Date().toLocaleTimeString('id-ID'); }, 1000);
    }
    
    function init() {
        const role = sessionStorage.getItem('dream_role') || sessionStorage.getItem('user_role');        if (role) { const u = document.getElementById('user-display'); if (u) u.textContent = role; }
        startClock();
        setTimeout(() => { loadAllStats(); window.switchTab('dashboard'); }, 500);
        refreshTimer = setInterval(loadAllStats, 30000);
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { e.preventDefault(); window.switchTab(btn.dataset.tab); });
        });
    }
    
    init();
})();
</script>
</body>
</html>
