/**
 * Dream OS v2.0 - Command Center Module
 * Ghost Mode | Beksi Layer | Spiritual Sync
 * Bi idznillah, semua berjalan lancar 🕌💚
 */

// ========== MODULE EXPORT ==========
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    // Module state
    const state = {
        activeTab: 'dashboard',
        dbStatus: 98,
        apiStatus: 100,
        securityStatus: 'AMAN',
        lastSync: null
    };

    // Reference to utils
    const { getAdminSlide } = utils;

    // ========== RENDER ROOT ==========
    function renderRoot() {
        return `
        <div class="cc-wrapper" style="background:transparent">
            <!-- Tabs Navigation -->
            <div class="cc-tabs" id="cc-tabs" style="display:flex;gap:.25rem;overflow-x:auto;padding:.25rem;background:rgba(30,41,59,.8);border-radius:10px;margin-bottom:1rem">
                <div class="cc-tab active" data-tab="dashboard" style="padding:.5rem 1rem;border-radius:8px;background:rgba(16,185,129,.2);color:#10b981;font-size:.85rem;font-weight:600;cursor:pointer;white-space:nowrap"><i class="fas fa-chart-line mr-1"></i>Dashboard</div>
                <div class="cc-tab" data-tab="approval" style="padding:.5rem 1rem;border-radius:8px;color:#94a3b8;font-size:.85rem;font-weight:500;cursor:pointer;white-space:nowrap"><i class="fas fa-check-circle mr-1"></i>Approval</div>
                <div class="cc-tab" data-tab="data" style="padding:.5rem 1rem;border-radius:8px;color:#94a3b8;font-size:.85rem;font-weight:500;cursor:pointer;white-space:nowrap"><i class="fas fa-database mr-1"></i>Data Central</div>
                <div class="cc-tab" data-tab="slides" style="padding:.5rem 1rem;border-radius:8px;color:#94a3b8;font-size:.85rem;font-weight:500;cursor:pointer;white-space:nowrap"><i class="fas fa-sliders-h mr-1"></i>Slide Manager</div>
                <div class="cc-tab" data-tab="printer" style="padding:.5rem 1rem;border-radius:8px;color:#94a3b8;font-size:.85rem;font-weight:500;cursor:pointer;white-space:nowrap"><i class="fas fa-print mr-1"></i>WiFi Printer</div>
                <div class="cc-tab" data-tab="pdf" style="padding:.5rem 1rem;border-radius:8px;color:#94a3b8;font-size:.85rem;font-weight:500;cursor:pointer;white-space:nowrap"><i class="fas fa-file-pdf mr-1"></i>PDF Generator</div>
                <div class="cc-tab" data-tab="qr" style="padding:.5rem 1rem;border-radius:8px;color:#94a3b8;font-size:.85rem;font-weight:500;cursor:pointer;white-space:nowrap"><i class="fas fa-qrcode mr-1"></i>QR Scanner</div>
                <div class="cc-tab" data-tab="analytics" style="padding:.5rem 1rem;border-radius:8px;color:#94a3b8;font-size:.85rem;font-weight:500;cursor:pointer;white-space:nowrap"><i class="fas fa-chart-bar mr-1"></i>Analytics</div>
                <div class="cc-tab" data-tab="system" style="padding:.5rem 1rem;border-radius:8px;color:#94a3b8;font-size:.85rem;font-weight:500;cursor:pointer;white-space:nowrap"><i class="fas fa-server mr-1"></i>System</div>
            </div>

            <!-- Status Bar (Weather REMOVED) -->
            <div class="cc-status-bar" style="display:flex;gap:.75rem;padding:.75rem 1rem;background:rgba(30,41,59,.6);border-radius:10px;margin-bottom:1rem;font-size:.8rem">
                <div class="cc-status-item" style="display:flex;align-items:center;gap:.35rem"><span class="cc-slabel" style="color:#94a3b8"><i class="fas fa-database mr-1"></i>Database</span><span class="cc-sval" id="cc-st-db" style="font-weight:600;color:#10b981">98%</span></div>
                <div class="cc-status-item" style="display:flex;align-items:center;gap:.35rem"><span class="cc-slabel" style="color:#94a3b8"><i class="fas fa-server mr-1"></i>API</span><span class="cc-sval" id="cc-st-api" style="font-weight:600;color:#10b981">100%</span></div>
                <div class="cc-status-item" style="display:flex;align-items:center;gap:.35rem"><span class="cc-slabel" style="color:#94a3b8"><i class="fas fa-shield-alt mr-1"></i>Security</span><span class="cc-sval" id="cc-st-sec" style="font-weight:600;color:#10b981">AMAN</span></div>
                <div class="cc-status-item" style="display:flex;align-items:center;gap:.35rem"><span class="cc-slabel" style="color:#94a3b8"><i class="fas fa-clock mr-1"></i>Sync</span><span class="cc-sval" id="cc-st-sync" style="font-weight:600;color:#f59e0b">--:--</span></div>
            </div>

            <!-- Content Area -->
            <div id="cc-content" style="min-height:300px"></div>
        </div>
        `;
    }
    // ========== TAB CONTENT RENDERERS ==========
    
    function renderDashboard() {
        const c = document.getElementById('cc-content');
        c.innerHTML = `
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem"><i class="fas fa-chart-line" style="color:#10b981;margin-right:.5rem"></i>Dashboard Overview</h3>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem">
                <div class="cc-panel" style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:10px;padding:1rem">
                    <div style="font-size:1.5rem;font-weight:700;color:#10b981">85%</div>
                    <div style="font-size:.85rem;color:#94a3b8">Kehadiran Hari Ini</div>
                </div>
                <div class="cc-panel" style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:10px;padding:1rem">
                    <div style="font-size:1.5rem;font-weight:700;color:#3b82f6">12</div>
                    <div style="font-size:.85rem;color:#94a3b8">Booking Aktif</div>
                </div>
                <div class="cc-panel" style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:1rem">
                    <div style="font-size:1.5rem;font-weight:700;color:#f59e0b">0</div>
                    <div style="font-size:.85rem;color:#94a3b8">Incident K3</div>
                </div>
                <div class="cc-panel" style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);border-radius:10px;padding:1rem">
                    <div style="font-size:1.5rem;font-weight:700;color:#8b5cf6">24</div>
                    <div style="font-size:.85rem;color:#94a3b8">Task Completed</div>
                </div>
            </div>
            <div class="cc-panel mt-2" style="background:rgba(30,41,59,.6);border-radius:10px;padding:1rem">
                <h4 style="font-size:.95rem;font-weight:600;margin-bottom:.75rem"><i class="fas fa-bell" style="color:#f59e0b;margin-right:.5rem"></i>Activity Log</h4>
                <div style="font-size:.85rem;color:#94a3b8;space-y:.5rem">
                    <div style="padding:.5rem 0;border-bottom:1px solid rgba(148,163,184,.1)">• 10:23 - Admin updated Slide 5</div>
                    <div style="padding:.5rem 0;border-bottom:1px solid rgba(148,163,184,.1)">• 09:45 - Booking Ruang A confirmed</div>
                    <div style="padding:.5rem 0;border-bottom:1px solid rgba(148,163,184,.1)">• 08:30 - K3 inspection completed</div>
                    <div style="padding:.5rem 0">• 07:15 - System sync successful</div>
                </div>
            </div>
        `;
    }

    function renderApproval() {
        const c = document.getElementById('cc-content');
        c.innerHTML = `<h3>📋 Approval Queue</h3><p style="color:#94a3b8;margin-top:.5rem">No pending approvals.</p>`;
    }

    function renderDataCentral() {
        const c = document.getElementById('cc-content');
        c.innerHTML = `<h3>🗄️ Data Central</h3><p style="color:#94a3b8;margin-top:.5rem">All systems operational.</p>`;
    }

    // ========== SLIDE MANAGER TAB (NEW!) ==========
    function renderSlides() {
        const c = document.getElementById('cc-content');        c.innerHTML = `
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">
                <i class="fas fa-sliders-h" style="color:#10b981;margin-right:.5rem"></i>
                Slide Manager (R. Kerja Admin)
            </h3>
            <div class="cc-panel" style="background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.3);border-radius:10px;padding:1rem;margin-bottom:1rem">
                <p style="font-size:.85rem;color:#94a3b8;margin:0">
                    ℹ️ Slide 1-4: Auto-generated (Greeting, Booking, K3, Weather)<br>
                    ✅ Slide 5-7: Dikontrol dari panel ini
                </p>
            </div>
            <div style="display:grid;gap:1rem">
                ${[1, 2, 3].map(num => `
                <div class="cc-panel" style="background:rgba(30,41,59,.6);border:1px solid rgba(148,163,184,.2);border-radius:10px;padding:1rem">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
                        <div>
                            <span class="cc-badge" style="background:rgba(245,158,11,.2);color:#f59e0b;padding:.25rem.5rem;border-radius:6px;font-size:.75rem;font-weight:600">Slide ${num + 4}</span>
                            <span style="margin-left:.5rem;font-weight:600">Admin Info ${num}</span>
                        </div>
                        <button class="cc-btn" style="background:#10b981;color:#0f172a;border:none;padding:.4rem.85rem;border-radius:8px;font-size:.85rem;font-weight:500;cursor:pointer" onclick="window._cc_editSlide(${num})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                    <div id="cc-slide-preview-${num}" style="padding:1rem;background:rgba(0,0,0,.3);border-radius:8px;font-size:.9rem;color:#e2e8f0;min-height:60px">
                        ${getAdminSlide(num)}
                    </div>
                    <div style="margin-top:.75rem;display:flex;gap:.5rem">
                        <button class="cc-btn" style="background:rgba(59,130,246,.2);color:#3b82f6;border:1px solid rgba(59,130,246,.4);padding:.4rem.85rem;border-radius:8px;font-size:.85rem;cursor:pointer" onclick="window._cc_previewSlide(${num})">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="cc-btn" style="background:rgba(245,158,11,.2);color:#f59e0b;border:1px solid rgba(245,158,11,.4);padding:.4rem.85rem;border-radius:8px;font-size:.85rem;cursor:pointer" onclick="window._cc_resetSlide(${num})">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </div>
                `).join('')}
            </div>`;
        loadSlidePreviews();
    }

    function loadSlidePreviews() {
        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById(`cc-slide-preview-${i}`);
            if (el) el.textContent = getAdminSlide(i);
        }
    }

    // ========== WINDOW GLOBAL FUNCTIONS ==========
    
    window._cc_editSlide = (num) => {        const current = getAdminSlide(num);
        const modal = document.createElement('div');
        modal.className = 'cc-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:500;padding:1rem';
        modal.innerHTML = `
            <div style="background:#1e293b;border:1px solid rgba(148,163,184,.3);border-radius:12px;padding:1.5rem;width:100%;max-width:450px;animation:modalIn .2s ease-out">
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1rem;color:#f8fafc">✏️ Edit Slide ${num + 4}</h3>
                <textarea id="slide-edit-text" style="width:100%;min-height:150px;padding:1rem;background:rgba(0,0,0,.3);border:1px solid rgba(16,185,129,.3);border-radius:8px;color:#e2e8f0;font-size:.95rem;resize:vertical;font-family:inherit">${current}</textarea>
                <div style="display:flex;gap:.5rem;margin-top:1rem;justify-content:flex-end">
                    <button class="cc-btn" style="background:rgba(148,163,184,.2);color:#94a3b8;border:none;padding:.5rem 1.25rem;border-radius:8px;font-weight:500;cursor:pointer" onclick="this.closest('.cc-modal').remove()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="cc-btn" style="background:#10b981;color:#0f172a;border:none;padding:.5rem 1.25rem;border-radius:8px;font-weight:600;cursor:pointer" onclick="window._cc_saveSlide(${num})">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        // Add keyframes if not exists
        if (!document.getElementById('cc-modal-keyframes')) {
            const style = document.createElement('style');
            style.id = 'cc-modal-keyframes';
            style.textContent = '@keyframes modalIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}';
            document.head.appendChild(style);
        }
    };

    window._cc_saveSlide = async (num) => {
        const text = document.getElementById('slide-edit-text')?.value?.trim();
        if (!text) { 
            utils.showToast('❌ Konten tidak boleh kosong', 'error'); 
            return; 
        }
        
        // Save to localStorage (primary)
        localStorage.setItem(`cc_slide_${num}`, text);
        
        // Sync to Supabase if available (secondary)
        if (supabase && currentUser) {
            try {
                await supabase.from('admin_slides').upsert({
                    slide_number: num,
                    content: text,
                    updated_at: new Date().toISOString(),
                    updated_by: currentUser.name || 'Admin',                    is_active: true
                });
                console.log(`✅ Slide ${num} synced to Supabase`);
            } catch (err) {
                console.warn('⚠️ Supabase sync failed:', err.message);
            }
        }
        
        // Update UI
        const modal = document.querySelector('.cc-modal');
        if (modal) modal.remove();
        
        // Refresh preview if in Slide Manager tab
        if (state.activeTab === 'slides') {
            loadSlidePreviews();
            // Also refresh main slider if visible
            if (typeof renderSlider === 'function') renderSlider();
        }
        
        utils.showToast(`✅ Slide ${num + 4} updated!`, 'success');
    };

    window._cc_previewSlide = (num) => { 
        utils.showToast(`👁️ Preview Slide ${num + 4} aktif di Home`, 'info'); 
    };

    window._cc_resetSlide = (num) => {
        if (confirm(`🔄 Reset Slide ${num + 4} ke default?`)) {
            localStorage.removeItem(`cc_slide_${num}`);
            // Also remove from Supabase if available
            if (supabase && currentUser) {
                supabase.from('admin_slides').delete().eq('slide_number', num).then(() => {
                    console.log(`🗑️ Slide ${num} removed from Supabase`);
                });
            }
            loadSlidePreviews();
            if (typeof renderSlider === 'function') renderSlider();
            utils.showToast('✅ Slide reset to default', 'success');
        }
    };

    // ========== OTHER TAB RENDERERS (Stubs) ==========
    function renderPrinter() {
        const c = document.getElementById('cc-content');
        c.innerHTML = `<h3>🖨️ WiFi Printer</h3><p style="color:#94a3b8;margin-top:.5rem">Connect to network printer...</p>`;
    }

    function renderPDF() {
        const c = document.getElementById('cc-content');
        c.innerHTML = `<h3>📄 PDF Generator</h3><p style="color:#94a3b8;margin-top:.5rem">Generate reports...</p>`;    }

    function renderQR() {
        const c = document.getElementById('cc-content');
        c.innerHTML = `<h3>🔲 QR Scanner</h3><p style="color:#94a3b8;margin-top:.5rem">Scan QR codes...</p>`;
    }

    function renderAnalytics() {
        const c = document.getElementById('cc-content');
        c.innerHTML = `<h3>📊 Analytics</h3><p style="color:#94a3b8;margin-top:.5rem">View insights...</p>`;
    }

    function renderSystem() {
        const c = document.getElementById('cc-content');
        c.innerHTML = `<h3>⚙️ System Settings</h3><p style="color:#94a3b8;margin-top:.5rem">Configure Ghost Mode, security...</p>`;
    }

    // ========== MAIN CONTENT ROUTER ==========
    function renderContent(tab) {
        const c = document.getElementById('cc-content');
        if (!c) return;
        c.innerHTML = loader(`Memuat ${tab}...`);
        
        setTimeout(() => {
            if (tab === 'dashboard') renderDashboard();
            else if (tab === 'approval') renderApproval();
            else if (tab === 'data') renderDataCentral();
            else if (tab === 'slides') renderSlides(); // ← NEW!
            else if (tab === 'printer') renderPrinter();
            else if (tab === 'pdf') renderPDF();
            else if (tab === 'qr') renderQR();
            else if (tab === 'analytics') renderAnalytics();
            else if (tab === 'system') renderSystem();
            else renderDashboard();
            
            // Update active tab UI
            document.querySelectorAll('.cc-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tab);
                t.style.background = t.dataset.tab === tab ? 'rgba(16,185,129,.2)' : 'transparent';
                t.style.color = t.dataset.tab === tab ? '#10b981' : '#94a3b8';
            });
        }, 200);
    }

    // ========== INIT & EVENT BINDING ==========
    function initEvents() {
        // Tab switching
        document.querySelectorAll('.cc-tab').forEach(tab => {
            tab.onclick = () => {
                state.activeTab = tab.dataset.tab;                renderContent(state.activeTab);
            };
        });
        
        // Initial render
        renderContent('dashboard');
        
        // Start status updates
        startStatusUpdates();
    }

    function startStatusUpdates() {
        // Update sync time
        const updateSync = () => {
            const el = document.getElementById('cc-st-sync');
            if (el) {
                const now = new Date();
                el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                el.style.color = '#10b981';
            }
        };
        updateSync();
        setInterval(updateSync, 30000);
        
        // Simulate status checks (replace with real API calls)
        setInterval(() => {
            const dbEl = document.getElementById('cc-st-db');
            const apiEl = document.getElementById('cc-st-api');
            if (dbEl) {
                const val = 95 + Math.floor(Math.random() * 5);
                dbEl.textContent = val + '%';
                dbEl.style.color = val >= 95 ? '#10b981' : '#f59e0b';
            }
            if (apiEl) {
                const val = Math.random() > 0.1 ? 100 : 99;
                apiEl.textContent = val + '%';
            }
        }, 45000);
    }

    // ========== MODULE INIT ==========
    return function() {
        // Return the HTML root
        return renderRoot();
    };
}

// ========== AUTO-INIT WHEN LOADED ==========
// This runs when module is dynamically imported
if (typeof window !== 'undefined') {    console.log('🎛️ Command Center module loaded | Ghost Mode: ON 👻');
}
