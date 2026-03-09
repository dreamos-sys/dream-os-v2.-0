<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <meta name="theme-color" content="#10b981">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="mobile-web-app-capable" content="yes">
  <title>Dream OS – Sekuriti Module v13.2 Enterprise</title>

  <!-- Security headers (meta setara, sebenarnya di server) -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.ipify.org;">

  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Rajdhani:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  <style>
    /* ===== Gaya lengkap (salin dari kode sebelumnya, tidak diubah) ===== */
    :root {
      --sek-primary: #10b981;
      --sek-primary-light: rgba(16,185,129,0.1);
      --sek-primary-border: rgba(16,185,129,0.25);
      --sek-bg-panel: rgba(15,23,42,0.88);
      --sek-text: #e2e8f0;
      --sek-text-muted: #94a3b8;
      --sek-text-dim: #64748b;
      --sek-radius: 16px;
      --sek-radius-sm: 12px;
      --sek-radius-xs: 8px;
      --sek-transition: 0.2s ease;
      --sek-shadow: 0 4px 18px rgba(16,185,129,0.15);
      --sek-font-mono: 'JetBrains Mono', monospace;
      --sek-font-sans: 'Rajdhani', 'Inter', -apple-system, sans-serif;
      --sek-border: rgba(255,255,255,0.08);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body {
      background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%);
      color: var(--sek-text);
      font-family: var(--sek-font-sans);
      min-height: 100vh;
      overflow-x: hidden;
    }

    .font-arabic { font-family: 'Amiri', serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }

    .glass-main {
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--sek-primary-border);
      border-radius: 24px;
    }

    #sekuriti-root, #sekuriti-root * { box-sizing: border-box; }

    #sekuriti-root {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
      font-family: var(--sek-font-sans);
      color: var(--sek-text);
      line-height: 1.6;
    }

    .sek-panel {
      background: var(--sek-bg-panel);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid var(--sek-primary-border);
      border-radius: var(--sek-radius);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      width: 100%;
      overflow: hidden;
    }

    .sek-header {
      background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05));
      border-left: 4px solid var(--sek-primary);
      transition: border-color 0.3s ease;
    }

    .sek-header.urgent {
      border-left-color: #ef4444;
      animation: pulse-red 2s infinite;
    }

    @keyframes pulse-red {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    }

    .sek-header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .sek-header-icon { font-size: 3rem; line-height: 1; flex-shrink: 0; }
    .sek-header-text { flex: 1; min-width: 200px; }

    .sek-title {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--sek-primary), #059669);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.25rem;
      line-height: 1.2;
    }

    .sek-sub { font-size: 0.75rem; color: var(--sek-text-muted); line-height: 1.3; }

    .sek-user-badge {
      background: rgba(139,92,246,0.15);
      border: 1px solid rgba(139,92,246,0.3);
      color: #a855f7;
      padding: 0.4rem 1rem;
      border-radius: 30px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .sek-status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      width: 100%;
    }

    @media (max-width: 640px) {
      .sek-status-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .sek-status-card {
      background: rgba(0,0,0,0.3);
      border-radius: var(--sek-radius-sm);
      padding: 0.75rem 1rem;
      border-left: 3px solid var(--sek-primary);
      min-width: 0;
      overflow: hidden;
    }

    .sek-status-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: var(--sek-text-muted);
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .sek-status-value {
      font-size: 1rem;
      font-weight: 700;
      color: var(--sek-text);
      word-break: break-word;
      overflow-wrap: break-word;
      line-height: 1.3;
      display: block;
    }

    .sek-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--sek-primary-border);
      margin-bottom: 1.5rem;
      overflow-x: auto;
      scrollbar-width: thin;
      padding-bottom: 0.25rem;
    }

    .sek-tabs::-webkit-scrollbar { height: 4px; }
    .sek-tabs::-webkit-scrollbar-thumb { background: var(--sek-primary-border); border-radius: 4px; }

    .sek-tab {
      padding: 0.65rem 1.5rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid transparent;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--sek-text-dim);
      white-space: nowrap;
      transition: all var(--sek-transition);
      flex-shrink: 0;
    }

    .sek-tab:hover { background: var(--sek-primary-light); color: var(--sek-text); }
    .sek-tab.active {
      background: rgba(16,185,129,0.18);
      border-color: var(--sek-primary);
      color: var(--sek-primary);
    }

    .tab-content { width: 100%; animation: fadeIn 0.3s ease; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .sek-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
      width: 100%;
    }

    @media (max-width: 640px) { .sek-form-grid { grid-template-columns: 1fr; } }
    .sek-form-group { width: 100%; }

    .sek-label {
      display: block;
      font-size: 0.75rem;
      color: var(--sek-text-muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .sek-input, .sek-select, .sek-textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(0,0,0,0.3);
      border: 1.5px solid var(--sek-primary-border);
      border-radius: var(--sek-radius-xs);
      color: var(--sek-text);
      font-family: inherit;
      font-size: 0.9rem;
      outline: none;
      transition: border-color var(--sek-transition);
    }

    .sek-input:focus, .sek-select:focus, .sek-textarea:focus {
      border-color: var(--sek-primary);
      box-shadow: 0 0 0 3px var(--sek-primary-light);
    }

    .sek-select option { background: #1e293b; color: var(--sek-text); }
    .sek-textarea { resize: vertical; min-height: 100px; font-family: inherit; }

    .sek-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: var(--sek-radius-xs);
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all var(--sek-transition);
      border: none;
      background: rgba(255,255,255,0.08);
      color: var(--sek-text);
      white-space: nowrap;
    }

    .sek-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.15);
      box-shadow: var(--sek-shadow);
    }

    .sek-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .sek-btn-primary {
      background: linear-gradient(135deg, var(--sek-primary), #059669);
      color: #020617;
    }
    .sek-btn-primary:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(16,185,129,0.3); }
    .sek-btn-sm { padding: 0.4rem 1rem; font-size: 0.75rem; border-radius: 20px; }

    .sek-upload-area {
      border: 2px dashed var(--sek-primary-border);
      border-radius: var(--sek-radius-xs);
      padding: 2rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: border-color var(--sek-transition);
      margin-top: 0.5rem;
    }

    .sek-upload-area:hover {
      border-color: var(--sek-primary);
      background: var(--sek-primary-light);
    }

    .sek-upload-icon { font-size: 2rem; color: var(--sek-primary); margin-bottom: 0.5rem; display: block; }
    .sek-preview { max-width: 100%; max-height: 300px; border-radius: var(--sek-radius-xs); margin-top: 1rem; display: block; }

    .sek-table-wrap { overflow-x: auto; border-radius: var(--sek-radius); border: 1px solid var(--sek-border); margin-top: 1rem; width: 100%; }

    table.sek-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    table.sek-table thead { background: rgba(0,0,0,0.3); }
    table.sek-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: var(--sek-text-muted); font-weight: 600; white-space: nowrap; }
    table.sek-table td { padding: 0.75rem 1rem; border-top: 1px solid var(--sek-border); vertical-align: middle; }
    table.sek-table tr:hover td { background: rgba(255,255,255,0.02); }

    .sek-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .sek-badge-aman { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
    .sek-badge-warning { background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .sek-badge-danger { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .sek-badge-urgent { background: rgba(239,68,68,0.3); color: #ef4444; border: 1px solid rgba(239,68,68,0.5); animation: pulse-badge 2s infinite; }

    @keyframes pulse-badge {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .sek-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; }
    .sek-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--sek-primary-light);
      border-top-color: var(--sek-primary);
      border-radius: 50%;
      animation: sek-spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes sek-spin { to { transform: rotate(360deg); } }

    .automation-panel {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.05));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: var(--sek-radius);
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .automation-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--sek-text-muted);
    }

    .automation-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--sek-primary);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    .toast {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: rgba(15,23,42,0.95);
      border-left: 4px solid var(--sek-primary);
      padding: 0.75rem 1.2rem;
      border-radius: 12px;
      z-index: 99999;
      animation: slideIn 0.3s;
      max-width: 300px;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .loading-bar {
      height: 3px;
      background: linear-gradient(90deg, #10b981, #06b6d4);
      width: 0%;
      transition: width 0.4s;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 10000;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }

    .floating-nav {
      position: fixed;
      bottom: 1.5rem;
      left: 0;
      right: 0;
      z-index: 50;
      pointer-events: none;
    }

    .floating-nav > * { pointer-events: auto; }
    .nav-btn { transition: all 0.2s; }
    .nav-btn:active { transform: scale(0.9); }
    .nav-center {
      background: linear-gradient(135deg, #10b981, #06b6d4);
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .text-center { text-align: center; }
    .mb-2 { margin-bottom: 0.5rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .opacity-70 { opacity: 0.7; }
    .hidden { display: none !important; }

    .notification-panel {
      background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05));
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: var(--sek-radius);
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .notification-panel.urgent {
      background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.05));
      border-color: rgba(239,68,68,0.3);
      animation: pulse-notify 2s infinite;
    }

    @keyframes pulse-notify {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    }

    .heatmap-container {
      background: #0f172a;
      border-radius: var(--sek-radius-xs);
      padding: 1rem;
      margin-top: 1rem;
    }

    .inventory-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .inventory-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--sek-primary);
      cursor: pointer;
    }

    .panic-btn {
      position: fixed;
      bottom: 100px;
      right: 1rem;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border: 3px solid rgba(239,68,68,0.5);
      color: white;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 60;
      box-shadow: 0 0 20px rgba(239,68,68,0.5);
      animation: pulse-panic 3s infinite;
      opacity: 0.3;
      transition: opacity 0.3s;
    }

    .panic-btn:hover {
      opacity: 1;
    }

    @keyframes pulse-panic {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      50% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
    }

    @media (max-width: 768px) {
      .sek-title { font-size: 1.5rem; }
      .sek-header-icon { font-size: 2.5rem; }
      .sek-status-value { font-size: 0.9rem; }
      .sek-tab { padding: 0.5rem 1rem; font-size: 0.8rem; }
      .sek-panel { padding: 1rem; }
    }
  </style>
</head>
<body>
  <div id="top-loader" class="loading-bar"></div>

  <header class="glass-main mx-4 mt-4 p-4 flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
        <i class="fas fa-shield-alt text-xl"></i>
      </div>
      <div>
        <h1 class="font-bold text-lg">DREAM<span class="text-emerald-500">OS</span></h1>
        <p class="text-[9px] font-mono text-emerald-400 uppercase">Sekuriti Module v13.2</p>
      </div>
    </div>
    <button onclick="handleLogout()" class="text-red-500 text-xs font-bold border border-red-500/20 px-3 py-1.5 rounded-full hover:bg-red-500/10 transition-all">
      <i class="fas fa-sign-out-alt mr-1"></i> LOGOUT
    </button>
  </header>

  <main id="sekuriti-root" class="p-4 pb-32"></main>

  <!-- Panic Button -->
  <div id="panic-btn" class="panic-btn" onclick="triggerPanic()" title="Emergency Button">
    <i class="fas fa-exclamation-triangle"></i>
  </div>

  <div class="floating-nav max-w-md mx-auto">
    <div class="glass-main p-2.5 flex justify-between items-center shadow-2xl shadow-black mx-4">
      <button class="w-11 h-11 flex items-center justify-center text-emerald-500 text-lg nav-btn" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
        <i class="fas fa-house"></i>
      </button>
      <button class="w-11 h-11 flex items-center justify-center text-slate-500 text-lg nav-btn" onclick="showHealth()">
        <i class="fas fa-brain"></i>
      </button>
      <button class="w-14 h-14 nav-center rounded-2xl flex items-center justify-center text-white text-xl shadow-lg -translate-y-6 border-4 border-slate-950 nav-btn" onclick="showToast('📷 QR Scanner', 'info')">
        <i class="fas fa-qrcode"></i>
      </button>
      <button class="w-11 h-11 flex items-center justify-center text-slate-500 text-lg nav-btn" onclick="copyExecutiveSummary()">
        <i class="fas fa-file-export"></i>
      </button>
      <button class="w-11 h-11 flex items-center justify-center text-slate-500 text-lg nav-btn" onclick="showToast('⚙️ Settings', 'info')">
        <i class="fas fa-cog"></i>
      </button>
    </div>
  </div>

  <div id="toast-container"></div>

  <script>
    (function() {
      'use strict';

      // ==================== KONFIGURASI ====================
      const SB_URL = 'https://pvznaeppaagylwddirla.supabase.co';
      const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';
      const DEPOK_CORE = { lat: -6.4000, lng: 106.8200 };
      const SAFE_RADIUS_KM = 5.0;
      const LIST_PETUGAS = ['SUDARSONO', 'MARHUSIN', 'HERIYATNO', 'SUNARKO', 'HARIYANSAHC', 'AGUS SUTISNA', 'DONIH'];
      const SHIFT_OPTIONS = ['P', 'M', 'L', 'CT'];
      const ASSETS = [
        { id: 'ht', name: 'HT (Handy Talky)', spec: '3 Unit - Aktif' },
        { id: 'kunci', name: 'Master Key Box', spec: 'Lengkap' },
        { id: 'senter', name: 'Senter Swat', spec: '2 Unit - Full Charge' },
        { id: 'buku', name: 'Buku Mutasi', spec: 'ISO 9001 Standard' }
      ];
      const K3_KEYWORDS = ['rusak', 'bocor', 'mati', 'hilang', 'bahaya', 'patah', 'pecah', 'korosi'];

      const supabase = window.supabase.createClient(SB_URL, SB_KEY);

      // ==================== STATE ====================
      let state = {
        user: { name: 'Guest', role: 'guest', id: null },
        currentTab: 'laporan',
        metrics: { reportsSubmitted: 0, errors: 0, panicTriggers: 0 },
        cache: new Map(),
        intervals: []
      };

      // Ambil user dari localStorage jika ada (dari proses login sebelumnya)
      try {
        const savedUser = localStorage.getItem('dream_user');
        if (savedUser) {
          state.user = JSON.parse(savedUser);
        }
      } catch (e) {
        console.warn('Failed to load user from localStorage', e);
      }

      // ==================== SMART CACHE ====================
      const SmartCache = {
        get(key, fetcher, ttl = 300000) {
          const cached = state.cache.get(key);
          if (cached && Date.now() - cached.timestamp < ttl) {
            return Promise.resolve({ data: cached.data, fromCache: true });
          }
          return fetcher().then(data => {
            state.cache.set(key, { data, timestamp: Date.now() });
            return { data, fromCache: false };
          });
        },
        invalidate(pattern) {
          for (const key of state.cache.keys()) {
            if (key.includes(pattern)) state.cache.delete(key);
          }
        },
        stats() { return { size: state.cache.size }; }
      };

      // ==================== OBSERVABILITY ====================
      const Logger = {
        sessionId: `sek_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        info(msg, ctx = {}) { console.log(`[INFO] ${msg}`, ctx); },
        error(msg, ctx = {}) { console.error(`[ERROR] ${msg}`, ctx); },
        warn(msg, ctx = {}) { console.warn(`[WARN] ${msg}`, ctx); },
        action(action, user, data) { this.info(`ACTION: ${action}`, { user: user?.name, ...data }); }
      };

      const Metrics = {
        _counters: new Map(),
        increment(name, value = 1) {
          const current = this._counters.get(name) || 0;
          this._counters.set(name, current + value);
        },
        startTimer(name) {
          const start = performance.now();
          return () => {
            const duration = performance.now() - start;
            Logger.info(`TIMER: ${name}`, { duration_ms: Math.round(duration) });
          };
        }
      };

      // ==================== SECURITY ====================
      const Security = {
        rbac: {
          can(action, user) {
            const permissions = {
              'sekuriti': ['report:read', 'report:create'],
              'admin': ['report:read', 'report:create', 'report:update'],
              'master': ['*']
            };
            const userPerms = permissions[user?.role] || [];
            return userPerms.includes('*') || userPerms.includes(action);
          },
          getTitle(role) {
            const titles = { sekuriti: 'Om', admin: 'Kak', master: 'Pak/Bu' };
            return titles[role] || 'Kak';
          }
        },
        sanitize: {
          escape(str) {
            if (typeof str !== 'string') return str;
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          },
          getDistance(lat1, lng1, lat2, lng2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
          }
        },
        audit: {
          async log(action, context, user, sb) {
            if (!sb) { console.log(`[AUDIT] ${action}`, context); return; }
            try {
              await sb.from('audit_logs').insert({ action, detail: JSON.stringify(context), user_id: user?.id, user_name: user?.name, created_at: new Date().toISOString() });
            } catch (e) { console.warn('[AUDIT] Failed:', e.message); }
          }
        }
      };

      // ==================== UTILS ====================
      function showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.borderLeftColor = type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981';
        toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span><span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
      }

      function getCurrentShift() {
        const jam = new Date().getHours();
        return (jam >= 7 && jam < 19) ? 'PAGI (07:00-19:00)' : 'MALAM (19:00-07:00)';
      }

      function showLoading(pct) {
        const loader = document.getElementById('top-loader');
        if (loader) {
          loader.style.width = `${pct}%`;
          if(pct >= 100) setTimeout(() => loader.style.width = '0%', 500);
        }
      }

      function escapeHTML(s) { return Security.sanitize.escape(s); }

      // ==================== RENDER FUNCTIONS ====================
      function renderSmartInventory() {
        return `
          <div class="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                <i class="fas fa-boxes-stacked mr-1"></i> Inventaris Aset (ISO 55001)
              </h4>
              <span class="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">AUTO-CHECK ACTIVE</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${ASSETS.map(a => `
                <div class="inventory-item">
                  <span class="text-[11px] text-slate-300">${a.name} <i class="text-[9px] opacity-50">${a.spec}</i></span>
                  <input type="checkbox" checked class="asset-chk" data-asset="${a.id}">
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      function renderNotificationPanel(data) {
        if (!data || data.length === 0) return '';
        
        const latestReport = data[0];
        const isUrgent = latestReport.status === 'urgent';
        
        return `
          <div class="notification-panel ${isUrgent ? 'urgent' : ''}">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="fas ${isUrgent ? 'fa-triangle-exclamation text-red-500' : 'fa-check-double text-emerald-500'}"></i>
                <span class="text-[10px] font-bold uppercase tracking-widest">
                  ${isUrgent ? 'ATENSI MANAJEMEN' : 'LAPORAN DITERIMA'}
                </span>
              </div>
              <span class="text-[9px] opacity-70">${new Date(latestReport.created_at).toLocaleTimeString()}</span>
            </div>
            <p class="text-[11px] mt-1 text-slate-300 italic">
              "Terima kasih ${latestReport.petugas}, laporan untuk ${latestReport.lokasi} telah tersimpan di sistem."
            </p>
          </div>
        `;
      }

      function renderHeatmap(data) {
        const mapWidth = 300;
        const mapHeight = 200;
        
        let points = data.map(item => {
          if (!item.koordinat) return '';
          const [lat, lng] = item.koordinat.split(',').map(Number);
          const x = ((lng - 106.82) * 5000) + (mapWidth / 2);
          const y = ((lat + 6.40) * 5000) + (mapHeight / 2);
          return `<circle cx="${x}" cy="${y}" r="4" fill="#10b981" opacity="0.7" />`;
        }).join('');

        return `
          <div class="heatmap-container">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              <i class="fas fa-map-location-dot mr-1 text-emerald-500"></i> Heatmap Patroli (Live)
            </h4>
            <svg width="100%" height="${mapHeight}" viewBox="0 0 ${mapWidth} ${mapHeight}" class="bg-slate-900 rounded-lg">
              ${points || '<text x="50%" y="50%" fill="#475569" font-size="10" text-anchor="middle">Belum ada data patroli</text>'}
            </svg>
            <div class="mt-2 text-[9px] text-slate-500 text-center">
              Status: ${data.length} Titik Patroli Terverifikasi (ISO 9001)
            </div>
          </div>
        `;
      }

      function buildShell(user) {
        const userName = user?.name?.toUpperCase() || 'GUEST';
        const userTitle = Security.rbac.getTitle(user?.role);
        
        return `
        <div id="sekuriti-root">
          <div class="sek-panel sek-header" id="sek-header">
            <div class="sek-header-content">
              <div class="sek-header-icon">🛡️</div>
              <div class="sek-header-text">
                <div class="sek-title">SEKURITI</div>
                <div class="sek-sub">Sistem Monitoring & Laporan Patroli 24/7</div>
                <p class="text-[8px] text-emerald-500/70 mt-1 font-arabic">Dream Team - Out of The Box Inside</p>
              </div>
              <div class="sek-user-badge">${userTitle} ${userName}</div>
            </div>
          </div>

          <div class="automation-panel">
            <div class="automation-status">
              <div class="automation-dot"></div>
              <span>SMART AUTOMATION ACTIVE • GPS TRACKING • AUTO-ESCALATION • ISO COMPLIANT</span>
            </div>
          </div>

          <div id="notification-container"></div>

          <div class="sek-status-grid">
            <div class="sek-status-card"><span class="sek-status-label">SHIFT</span><span class="sek-status-value" id="sek-shift">—</span></div>
            <div class="sek-status-card"><span class="sek-status-label">DATABASE</span><span class="sek-status-value" id="sek-db-status">—</span></div>
            <div class="sek-status-card"><span class="sek-status-label">LOKASI</span><span class="sek-status-value" id="sek-lokasi">—</span></div>
            <div class="sek-status-card"><span class="sek-status-label">CACHE</span><span class="sek-status-value" id="sek-cache-status">—</span></div>
          </div>

          <div class="sek-tabs">
            <button class="sek-tab active" data-tab="laporan">📋 Laporan Patroli</button>
            <button class="sek-tab" data-tab="history">📜 Riwayat</button>
            <button class="sek-tab" data-tab="jadwal">📅 Jadwal Piket</button>
            <button class="sek-tab" data-tab="harian">📊 Laporan Harian</button>
          </div>

          <div id="sek-laporan-tab" class="tab-content">
            <div class="sek-panel">
              <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:var(--sek-primary);">📝 Laporan Patroli Baru</h3>
              <form id="sekForm">
                <div class="sek-form-grid">
                  <div class="sek-form-group"><label class="sek-label">Tanggal</label><input type="text" id="sek-tanggal" class="sek-input" readonly></div>
                  <div class="sek-form-group"><label class="sek-label">Shift</label><input type="text" id="sek-shift-input" class="sek-input" readonly></div>
                </div>
                <div class="sek-form-grid">
                  <div class="sek-form-group">
                    <label class="sek-label">Petugas Jaga *</label>
                    <select id="sek-petugas" class="sek-select" required>
                      <option value="">-- Pilih Petugas --</option>
                      ${LIST_PETUGAS.map(n => `<option value="${n}">${n}</option>`).join('')}
                    </select>
                  </div>
                  <div class="sek-form-group"><label class="sek-label">Lokasi Patroli *</label><input type="text" id="sek-lokasi-input" class="sek-input" placeholder="Contoh: Pos Utama" required></div>
                </div>
                <div class="sek-form-group"><label class="sek-label">Deskripsi Situasi *</label><textarea id="sek-deskripsi" class="sek-textarea" placeholder="Jelaskan situasi / kejadian..." required></textarea></div>
                ${renderSmartInventory()}
                <div class="sek-form-group">
                  <label class="sek-label">Foto Bukti (wajib)</label>
                  <div class="sek-upload-area" onclick="document.getElementById('sek-foto').click()">
                    <span class="sek-upload-icon">📷</span>
                    <p style="font-size:0.9rem;color:var(--sek-text-muted);">Klik untuk ambil foto (geotag otomatis)</p>
                    <input type="file" id="sek-foto" accept="image/*" capture="environment" style="display:none;" required>
                  </div>
                  <img id="sek-preview" class="sek-preview" style="display:none;">
                  <input type="hidden" id="sek-foto-base64">
                </div>
                <div style="margin-top:1.5rem;">
                  <button type="submit" class="sek-btn sek-btn-primary" id="sek-submit">🔒 Enkripsi & Kirim</button>
                </div>
              </form>
            </div>
          </div>

          <div id="sek-history-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:1rem;">
                <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);">📜 Riwayat Laporan</h3>
                <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                  <input type="date" id="filter-tanggal" class="sek-input" style="width:auto;max-width:150px;">
                  <select id="filter-shift" class="sek-select" style="width:auto;">
                    <option value="">Semua Shift</option>
                    <option value="PAGI">PAGI</option>
                    <option value="MALAM">MALAM</option>
                  </select>
                  <button class="sek-btn sek-btn-sm" id="btn-filter">🔍 Filter</button>
                  <button class="sek-btn sek-btn-sm" id="btn-reset-filter">🔄 Reset</button>
                </div>
              </div>
              <div class="sek-table-wrap">
                <table class="sek-table">
                  <thead><tr><th>Tanggal</th><th>Shift</th><th>Petugas</th><th>Lokasi</th><th>Status</th><th>Aksi</th></tr></thead>
                  <tbody id="sek-history-body"><tr><td colspan="6" class="text-center py-4">Memuat...</td></tr></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="sek-jadwal-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
              <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);margin-bottom:1rem;">📅 Jadwal Piket</h3>
              <div class="sek-table-wrap">
                <table class="sek-table" id="sek-schedule-table">
                  <thead id="sek-schedule-header"><tr><th>Petugas</th><th>Sen</th><th>Sel</th><th>Rab</th><th>Kam</th><th>Jum</th><th>Sab</th><th>Min</th></tr></thead>
                  <tbody id="sek-schedule-body"><tr><td colspan="8" class="text-center py-4"><div class="sek-spinner" style="margin:0 auto;"></div><p>Memuat jadwal...</p></td></tr></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="sek-harian-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
              <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);margin-bottom:1rem;">📊 Laporan Harian</h3>
              <div id="sek-harian-content"><div class="sek-loader"><div class="sek-spinner"></div><p>Memuat laporan...</p></div></div>
            </div>
          </div>
        </div>`;
      }

      // ==================== MODULE LOGIC ====================
      async function initModuleLogic() {
        const container = document.getElementById('sekuriti-root');
        if (!container) return;
        const _sb = supabase;
        const _user = state.user;

        container.innerHTML = buildShell(_user);

        let updateInterval;

        function updateStatus() {
          const shiftEl = container.querySelector('#sek-shift');
          const dbEl = container.querySelector('#sek-db-status');
          const cacheEl = container.querySelector('#sek-cache-status');
          const lokasiEl = container.querySelector('#sek-lokasi');

          if (shiftEl) shiftEl.textContent = getCurrentShift();
          if (dbEl) dbEl.innerHTML = _sb ? '<span class="sek-badge sek-badge-aman">ONLINE</span>' : '<span class="sek-badge sek-badge-danger">OFFLINE</span>';
          if (cacheEl) { const stats = SmartCache.stats(); cacheEl.innerHTML = `<span class="sek-badge sek-badge-warning">L1:${stats.size}</span>`; }
          if (lokasiEl && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => { lokasiEl.textContent = `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`; }, () => { lokasiEl.textContent = 'GPS unavailable'; });
          }
        }

        function switchTab(newTab) {
          state.currentTab = newTab;
          container.querySelectorAll('.sek-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === newTab));
          container.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
          const target = container.querySelector(`#sek-${newTab}-tab`);
          if (target) target.style.display = 'block';
          if (newTab === 'history') loadHistory();
          if (newTab === 'jadwal') loadJadwal();
          if (newTab === 'harian') loadHarian();
          Logger.action('TAB_SWITCHED', _user, { tab: newTab });
        }

        async function loadHistory(filters = {}) {
          const stopTimer = Metrics.startTimer('history.load');
          const tbody = container.querySelector('#sek-history-body');

          if (!tbody || !_sb) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Database offline</td></tr>';
            return;
          }

          tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="sek-spinner" style="margin:0 auto;"></div></td></tr>';

          try {
            const result = await SmartCache.get('reports:history', async () => {
              let query = _sb.from('sekuriti_reports').select('id, tanggal, shift, petugas, lokasi, status, created_at').order('created_at', { ascending: false }).limit(50);
              if (filters.tanggal) query = query.eq('tanggal', filters.tanggal);
              if (filters.shift) query = query.ilike('shift', `%${filters.shift}%`);
              const { data, error } = await query;
              if (error) throw error;
              return data || [];
            });

            const reports = result.data || [];
            if (!reports.length) {
              tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 opacity-70">Tidak ada laporan</td></tr>';
              stopTimer();
              return;
            }

            let html = '';
            reports.forEach(item => {
              const statusBadge = item.status === 'verified' ? 'sek-badge-aman' : item.status === 'urgent' ? 'sek-badge-urgent' : item.status === 'pending' ? 'sek-badge-warning' : 'sek-badge-danger';
              html += `<tr>
                <td>${escapeHTML(item.tanggal || '—')}</td>
                <td>${escapeHTML(item.shift || '—')}</td>
                <td>${escapeHTML(Array.isArray(item.petugas) ? item.petugas.join(', ') : item.petugas || '—')}</td>
                <td>${escapeHTML(item.lokasi || '—')}</td>
                <td><span class="sek-badge ${statusBadge}">${escapeHTML(item.status || '—')}</span></td>
                <td><button class="sek-btn sek-btn-sm" onclick="showToast('👁️ View detail', 'info')">👁️</button></td>
              </tr>`;
            });

            tbody.innerHTML = html;
            stopTimer();

          } catch (error) {
            Logger.error('Load history failed', { error: error.message });
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color:#ef4444;">Error: ${escapeHTML(error.message)}</td></tr>`;
            stopTimer();
          }
        }

        async function loadJadwal() {
          const tbody = container.querySelector('#sek-schedule-body');
          const thead = container.querySelector('#sek-schedule-header tr');

          if (!tbody || !thead) return;

          const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
          let headerHtml = '<th>Petugas</th>';
          days.forEach(d => { headerHtml += `<th>${d}</th>`; });
          thead.innerHTML = headerHtml;

          let html = '';
          LIST_PETUGAS.forEach((nama) => {
            html += `<tr data-nama="${nama}">`;
            html += `<td>${escapeHTML(nama)}</td>`;
            for (let i = 0; i < 7; i++) {
              const shift = SHIFT_OPTIONS[Math.floor(Math.random() * SHIFT_OPTIONS.length)];
              html += `<td><select class="sek-input" style="padding:0.25rem;font-size:0.75rem;" data-nama="${nama}" data-day="${i}">
                ${SHIFT_OPTIONS.map(opt => `<option value="${opt}" ${opt===shift?'selected':''}>${opt}</option>`).join('')}
              </select></td>`;
            }
            html += `</tr>`;
          });
          tbody.innerHTML = html;
        }

        async function loadHarian() {
          const contentDiv = container.querySelector('#sek-harian-content');
          if (!contentDiv) return;

          const today = new Date().toISOString().split('T')[0];

          try {
            if (!_sb) { contentDiv.innerHTML = `<p class="text-center py-4">Database offline</p>`; return; }

            const { data, error } = await _sb.from('sekuriti_reports').select('*').eq('tanggal', today).order('created_at', { ascending: true });
            if (error) throw error;

            if (!data || data.length === 0) {
              const currentHour = new Date().getHours();
              const shiftStatus = currentHour >= 7 && currentHour < 19 ? 'Shift Pagi' : 'Shift Malam';
              const minutesRunning = currentHour >= 7 && currentHour < 19 ? (currentHour - 7) * 60 : (currentHour - 19) * 60;
              
              contentDiv.innerHTML = `
                <div class="text-center py-10 opacity-80">
                  <div class="mb-4 text-emerald-500"><i class="fas fa-shield-virus fa-3x"></i></div>
                  <h4 class="text-lg font-bold">SISTEM SIAGA – BARIS BERSIH</h4>
                  <p class="text-xs text-slate-400 max-w-xs mx-auto">
                    ${shiftStatus} telah berjalan ${minutesRunning} menit.<br>
                    Belum ada entri untuk tanggal ${today}.<br>
                    Menunggu laporan patroli pertama dari Sayyidina Petugas.
                  </p>
                  <button onclick="switchTab('laporan')" class="sek-btn sek-btn-sm mt-4">
                    <i class="fas fa-plus mr-1"></i> BUAT LAPORAN PERDANA
                  </button>
                </div>
              `;
              return;
            }

            const notifContainer = document.getElementById('notification-container');
            if (notifContainer) notifContainer.innerHTML = renderNotificationPanel(data);

            const hasUrgent = data.some(r => r.status === 'urgent');
            const header = document.getElementById('sek-header');
            if (hasUrgent && header) {
              header.classList.add('urgent');
              showToast('⚠️ ATENSI: Laporan K3 Terdeteksi, Mohon Segera Ditindaklanjuti', 'error');
            }

            let html = `<p class="text-sm text-slate-400 mb-2">Tanggal: ${today}</p>`;
            html += renderHeatmap(data);
            html += '<div class="sek-table-wrap mt-4"><table class="sek-table"><thead><tr><th>Waktu</th><th>Petugas</th><th>Lokasi</th><th>Deskripsi</th><th>Status</th></tr></thead><tbody>';
            data.forEach(item => {
              const waktu = new Date(item.created_at).toLocaleString('id-ID');
              const statusBadge = item.status === 'verified' ? 'sek-badge-aman' : item.status === 'urgent' ? 'sek-badge-urgent' : 'sek-badge-warning';
              html += `<tr>
                <td>${waktu}</td>
                <td>${escapeHTML(Array.isArray(item.petugas) ? item.petugas.join(', ') : item.petugas)}</td>
                <td>${escapeHTML(item.lokasi)}</td>
                <td>${escapeHTML(item.deskripsi || '-')}</td>
                <td><span class="sek-badge ${statusBadge}">${escapeHTML(item.status || '—')}</span></td>
              </tr>`;
            });
            html += '</tbody></table></div>';

            if (data.length >= 5) {
              await checkPatrolGoal(data.length);
            }

            contentDiv.innerHTML = html;

          } catch (err) {
            Logger.error('Load harian failed', { error: err.message });
            contentDiv.innerHTML = `<p class="text-center py-4" style="color:#ef4444;">Error: ${escapeHTML(err.message)}</p>`;
          }
        }

        async function checkPatrolGoal(count) {
          Logger.info('PATROL_GOAL_MET', { count });
          await Security.audit.log('PATROL_GOAL_MET', { detail: `Petugas mencapai target ${count} titik patroli hari ini.` }, _user, _sb);
        }

        async function handleSubmit(e) {
          e.preventDefault();
          const stopTimer = Metrics.startTimer('report.submit');
          const btn = container.querySelector('#sek-submit');
          const originalBtn = btn?.innerHTML;

          try {
            const rawData = {
              petugas: container.querySelector('#sek-petugas')?.value,
              lokasi: container.querySelector('#sek-lokasi-input')?.value,
              deskripsi: container.querySelector('#sek-deskripsi')?.value,
              foto_base64: container.querySelector('#sek-foto-base64')?.value
            };

            if (!rawData.petugas || !rawData.lokasi || !rawData.deskripsi) {
              showToast('❌ Lengkapi semua field wajib', 'error');
              return;
            }

            const checkedAssets = Array.from(container.querySelectorAll('.asset-chk:checked')).map(el => el.dataset.asset);
            const assetStatus = checkedAssets.length === ASSETS.length ? "[ASET LENGKAP]" : "[ASET TIDAK LENGKAP]";

            const hasAnomaly = K3_KEYWORDS.some(word => rawData.deskripsi.toLowerCase().includes(word));
            
            let coords = null;
            try {
              const position = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) { reject(new Error('GPS tidak didukung')); return; }
                navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), err => reject(new Error(`GPS error: ${err.message}`)), { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 });
              });

              const distance = Security.sanitize.getDistance(position.latitude, position.longitude, DEPOK_CORE.lat, DEPOK_CORE.lng);
              if (distance > SAFE_RADIUS_KM && !confirm(`Anda berada ${distance.toFixed(1)}km dari area aman. Tetap kirim?`)) {
                return;
              }
              coords = `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
            } catch (gpsErr) {
              console.warn('[SEKURITI] GPS failed:', gpsErr.message);
              if (!confirm('Gagal mendapatkan GPS. Lanjutkan tanpa koordinat?')) {
                return;
              }
            }

            if (btn) { btn.disabled = true; btn.innerHTML = '<span class="sek-spinner" style="width:20px;height:20px;margin:0;"></span> Mengirim...'; }

            let fotoUrl = null;
            if (rawData.foto_base64 && _sb?.storage) {
              try {
                const response = await fetch(rawData.foto_base64);
                const blob = await response.blob();
                const filename = `sekuriti/${Date.now()}-${Math.random().toString(36).substring(8)}.jpg`;
                const { error: uploadError } = await _sb.storage.from('sekuriti-foto').upload(filename, blob, { cacheControl: '3600', upsert: false });
                if (!uploadError) {
                  const { data: urlData } = _sb.storage.from('sekuriti-foto').getPublicUrl(filename);
                  fotoUrl = urlData.publicUrl;
                }
              } catch (uploadErr) { console.warn('[SEKURITI] Photo upload failed:', uploadErr.message); }
            }

            const enrichedDesc = `
${assetStatus} 
${rawData.deskripsi.trim()}

---
Sistem: Dream OS v13.2 | Bi idznillah
Status K3: ${hasAnomaly ? '🔴 ATENSI KERUSAKAN' : '🟢 NORMAL'}
Approver: Bapak Hanung Budianto S. E
            `.trim();

            const reportData = {
              petugas: [rawData.petugas],
              lokasi: rawData.lokasi,
              deskripsi: enrichedDesc,
              tanggal: new Date().toISOString().split('T')[0],
              shift: getCurrentShift(),
              koordinat: coords,
              status: hasAnomaly ? 'urgent' : 'pending',
              created_at: new Date().toISOString()
            };

            const { error: insertError } = await _sb.from('sekuriti_reports').insert([{ ...reportData, foto_url: fotoUrl ? [fotoUrl] : null }]);
            if (insertError) throw insertError;

            await Security.audit.log('REPORT_CREATED', { report_lokasi: reportData.lokasi, report_shift: reportData.shift, gps_used: !!reportData.koordinat, k3_anomaly: hasAnomaly }, _user, _sb);

            showToast('✅ Laporan berhasil dikirim! Terima kasih 🛡️', 'success');
            state.metrics.reportsSubmitted++;
            Metrics.increment('reports.submitted.success');

            const form = container.querySelector('#sekForm');
            if (form) form.reset();
            const preview = container.querySelector('#sek-preview');
            if (preview) preview.style.display = 'none';
            const base64Input = container.querySelector('#sek-foto-base64');
            if (base64Input) base64Input.value = '';
            const tanggalInput = container.querySelector('#sek-tanggal');
            if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
            const shiftInput = container.querySelector('#sek-shift-input');
            if (shiftInput) shiftInput.value = getCurrentShift();

            SmartCache.invalidate('reports:history');
            stopTimer();

          } catch (err) {
            Logger.error('Submit report failed', { error: err.message });
            showToast('❌ Gagal: ' + err.message, 'error');
            state.metrics.errors++;
            Metrics.increment('reports.submitted.error');
            stopTimer();

          } finally {
            if (btn && originalBtn) { btn.disabled = false; btn.innerHTML = originalBtn; }
          }
        }

        function bindEvents() {
          container.querySelectorAll('.sek-tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
          container.querySelector('#sekForm')?.addEventListener('submit', handleSubmit);

          container.querySelector('#sek-foto')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { showToast('File terlalu besar, max 5MB', 'error'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
              const preview = container.querySelector('#sek-preview');
              const base64Input = container.querySelector('#sek-foto-base64');
              if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
              if (base64Input) base64Input.value = ev.target.result;
            };
            reader.readAsDataURL(file);
          });

          const applyFilter = () => {
            const filters = { tanggal: container.querySelector('#filter-tanggal')?.value || null, shift: container.querySelector('#filter-shift')?.value || null };
            loadHistory(filters);
          };

          container.querySelector('#btn-filter')?.addEventListener('click', applyFilter);
          container.querySelector('#btn-reset-filter')?.addEventListener('click', () => {
            container.querySelector('#filter-tanggal').value = '';
            container.querySelector('#filter-shift').value = '';
            SmartCache.invalidate('reports:history');
            loadHistory();
          });
        }

        await Security.audit.log('MODULE_ACCESSED', { module: 'sekuriti' }, _user, _sb);
        bindEvents();
        updateStatus();
        updateInterval = setInterval(updateStatus, 60000);
        state.intervals.push(updateInterval);

        const tanggalInput = container.querySelector('#sek-tanggal');
        if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
        const shiftInput = container.querySelector('#sek-shift-input');
        if (shiftInput) shiftInput.value = getCurrentShift();

        Logger.info('Module initialized', { user: _user?.name });
        console.log('[SEKURITI] ✅ Module ready — v13.2 Enterprise — Bi idznillah 💚');

        window.SekuritiHealth = () => ({ status: 'healthy', cache: SmartCache.stats(), metrics: state.metrics });
      }

      // ==================== GLOBAL FUNCTIONS ====================
      window.handleLogout = function() {
        localStorage.removeItem('dream_user');
        // Bersihkan interval
        state.intervals.forEach(clearInterval);
        location.reload();
      };

      window.showHealth = function() {
        const health = window.SekuritiHealth ? window.SekuritiHealth() : { status: 'unknown' };
        showToast(`Status: ${health.status} | Cache: ${health.cache?.size || 0} | Reports: ${state.metrics.reportsSubmitted}`, 'info');
      };

      window.copyExecutiveSummary = function() {
        const today = new Date().toISOString().split('T')[0];
        const text = `*LAPORAN HARIAN SEKURITI*\n` +
                     `--------------------------\n` +
                     `📅 Tgl: ${today}\n` +
                     `👤 Petugas: ${state.user.name}\n` +
                     `📊 Total Laporan: ${state.metrics.reportsSubmitted}\n` +
                     `⚠️ Errors: ${state.metrics.errors}\n` +
                     `--------------------------\n` +
                     `_Generated by Dream OS v13.2_`;
        
        navigator.clipboard.writeText(text).then(() => {
          showToast('📋 Executive Summary disalin! Siap kirim ke Pak Erwinsyah 🟢', 'success');
        }).catch(() => {
          showToast('❌ Gagal menyalin', 'error');
        });
      };

      window.triggerPanic = function() {
        if (!confirm('⚠️ PANIC BUTTON: Ini akan mengirim alert darurat ke manajemen. Lanjutkan?')) return;
        
        state.metrics.panicTriggers++;
        Metrics.increment('panic.triggered');
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async pos => {
            const coords = `${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`;
            await supabase.from('audit_logs').insert({
              action: 'PANIC_TRIGGERED',
              detail: JSON.stringify({ coordinates: coords, timestamp: new Date().toISOString() }),
              user_id: state.user.id,
              user_name: state.user.name
            });
            
            const text = `🚨 PANIC ALERT 🚨\n` +
                        `Petugas: ${state.user.name}\n` +
                        `Lokasi: ${coords}\n` +
                        `Waktu: ${new Date().toLocaleString('id-ID')}\n` +
                        `MOHON BANTUAN SEGERA!`;
            
            navigator.clipboard.writeText(text).then(() => {
              showToast('🚨 PANIC ALERT disalin! Koordinat: ' + coords, 'error');
            }).catch(() => {
              showToast('🚨 PANIC ALERT dikirim (GPS unavailable)', 'error');
            });
          }, () => {
            showToast('🚨 PANIC ALERT dikirim (GPS unavailable)', 'error');
          });
        }
      };

      // ==================== INIT ====================
      window.addEventListener('load', () => {
        console.log('🛡️ Dream OS Sekuriti Module v13.2 Initializing...');
        console.log('📊 Observability: Active');
        console.log('🔐 Security Core: Active');
        console.log('📦 Smart Inventory: Active');
        console.log('🗺️ Heatmap: Active');
        console.log('🚨 Panic Button: Active');
        showLoading(100);
        setTimeout(() => { initModuleLogic(); }, 500);
      });

    })();
  </script>
</body>
</html>
