/**
 * Dream OS v2.0 - Profile Module
 * Ghost Mode | Spiritual Sync | Zero Cost
 * Bi idznillah, profile user aman terkendali 💚🕌
 */

export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    
    // ========== RENDER ROOT ==========
    function renderRoot() {
        const user = currentUser || { name: 'Guest User', email: 'Not logged in' };
        const joinDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        
        return `
        <div class="profile-wrapper" style="padding:1rem">
            
            <!-- Profile Header -->
            <div class="card" style="text-align:center;padding:2rem 1rem;background:rgba(30,41,59,.8);border:1px solid rgba(148,163,184,.2);border-radius:12px;margin-bottom:1.5rem">
                <div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,rgba(16,185,129,.3),rgba(59,130,246,.3));display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;border:3px solid rgba(16,185,129,.5)">
                    <i class="fas fa-user" style="font-size:3rem;color:#10b981"></i>
                </div>
                <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:.25rem;color:#f8fafc">${user.name || 'Guest User'}</h2>
                <p style="color:#94a3b8;font-size:.9rem;margin-bottom:.5rem">${user.email || 'Not logged in'}</p>
                <span class="badge" style="background:rgba(16,185,129,.2);color:#10b981;padding:.25rem.75rem;border-radius:20px;font-size:.75rem;font-weight:600">
                    👤 ${user.role || 'Free User'}
                </span>
                <p style="color:#64748b;font-size:.8rem;margin-top:.75rem">
                    📅 Bergabung ${joinDate}
                </p>
            </div>

            <!-- Profile Stats -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-bottom:1.5rem">
                <div class="card" style="text-align:center;padding:1rem;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:10px">
                    <div style="font-size:1.5rem;font-weight:700;color:#10b981">12</div>
                    <div style="font-size:.75rem;color:#94a3b8">Booking</div>
                </div>
                <div class="card" style="text-align:center;padding:1rem;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:10px">
                    <div style="font-size:1.5rem;font-weight:700;color:#3b82f6">5</div>
                    <div style="font-size:.75rem;color:#94a3b8">Task</div>
                </div>
                <div class="card" style="text-align:center;padding:1rem;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);border-radius:10px">
                    <div style="font-size:1.5rem;font-weight:700;color:#8b5cf6">98%</div>
                    <div style="font-size:.75rem;color:#94a3b8">Attend</div>
                </div>
            </div>

            <!-- Settings Menu -->
            <div class="card" style="padding:0;overflow:hidden;border-radius:12px;margin-bottom:1.5rem">
                <h3 style="font-size:1rem;font-weight:600;padding:1rem;background:rgba(30,41,59,.8);border-bottom:1px solid rgba(148,163,184,.2)">                    <i class="fas fa-cog" style="color:#94a3b8;margin-right:.5rem"></i>Pengaturan
                </h3>
                
                <div class="menu-item" onclick="window._profile_editName()" style="padding:1rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(148,163,184,.1);cursor:pointer;transition:background.2s">
                    <div style="display:flex;align-items:center;gap:.75rem">
                        <i class="fas fa-user-edit" style="color:#10b981;width:20px"></i>
                        <span style="color:#e2e8f0;font-size:.9rem">Edit Nama</span>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#64748b"></i>
                </div>
                
                <div class="menu-item" onclick="window._profile_changeLang()" style="padding:1rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(148,163,184,.1);cursor:pointer;transition:background.2s">
                    <div style="display:flex;align-items:center;gap:.75rem">
                        <i class="fas fa-language" style="color:#3b82f6;width:20px"></i>
                        <span style="color:#e2e8f0;font-size:.9rem">Bahasa</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:.5rem">
                        <span style="color:#94a3b8;font-size:.85rem">${currentLang.toUpperCase()}</span>
                        <i class="fas fa-chevron-right" style="color:#64748b"></i>
                    </div>
                </div>
                
                <div class="menu-item" onclick="window._profile_toggleTheme()" style="padding:1rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(148,163,184,.1);cursor:pointer;transition:background.2s">
                    <div style="display:flex;align-items:center;gap:.75rem">
                        <i class="fas fa-moon" style="color:#f59e0b;width:20px"></i>
                        <span style="color:#e2e8f0;font-size:.9rem">Tema</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:.5rem">
                        <span style="color:#94a3b8;font-size:.85rem">Dark</span>
                        <i class="fas fa-chevron-right" style="color:#64748b"></i>
                    </div>
                </div>
                
                <div class="menu-item" onclick="window._profile_clearCache()" style="padding:1rem;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:background.2s">
                    <div style="display:flex;align-items:center;gap:.75rem">
                        <i class="fas fa-trash-alt" style="color:#ef4444;width:20px"></i>
                        <span style="color:#e2e8f0;font-size:.9rem">Clear Cache</span>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#64748b"></i>
                </div>
            </div>

            <!-- App Info -->
            <div class="card" style="text-align:center;padding:1.5rem;background:rgba(30,41,59,.6);border:1px solid rgba(148,163,184,.2);border-radius:12px">
                <div style="display:flex;align-items:center;justify-content:center;gap:.5rem;margin-bottom:.5rem">
                    <i class="fas fa-rocket" style="color:#10b981"></i>
                    <span style="font-weight:700;color:#f8fafc">Dream OS</span>
                </div>
                <p style="color:#94a3b8;font-size:.85rem;margin-bottom:.5rem">Version 2.0.1</p>
                <p style="color:#64748b;font-size:.75rem">                    🕌 Built with  | Bi idznillah
                </p>
                <div style="display:flex;gap:.5rem;justify-content:center;margin-top:1rem">
                    <a href="https://github.com/dreamos-sys" target="_blank" style="color:#10b981;font-size:.85rem;text-decoration:none">
                        <i class="fab fa-github"></i> GitHub
                    </a>
                    <span style="color:#475569">•</span>
                    <a href="#" onclick="alert('Terms coming soon!')" style="color:#10b981;font-size:.85rem;text-decoration:none">
                        Terms
                    </a>
                    <span style="color:#475569">•</span>
                    <a href="#" onclick="alert('Privacy coming soon!')" style="color:#10b981;font-size:.85rem;text-decoration:none">
                        Privacy
                    </a>
                </div>
            </div>

            <!-- Logout Button (if authenticated) -->
            ${currentUser ? `
            <button class="btn" style="width:100%;padding:1rem;background:rgba(239,68,68,.2);color:#ef4444;border:1px solid rgba(239,68,68,.4);border-radius:10px;font-weight:600;margin-top:1rem" onclick="window._profile_logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
            ` : ''}
        </div>
        `;
    }

    // ========== WINDOW GLOBAL FUNCTIONS ==========
    
    window._profile_editName = () => {
        const currentName = currentUser?.name || localStorage.getItem('profile_name') || 'Guest User';
        const newName = prompt('✏️ Edit Nama Display:', currentName);
        if (newName && newName.trim()) {
            localStorage.setItem('profile_name', newName.trim());
            showToast('✅ Nama updated!', 'success');
            setTimeout(() => location.reload(), 500);
        }
    };

    window._profile_changeLang = () => {
        const newLang = currentLang === 'id' ? 'en' : 'id';
        localStorage.setItem('dreamos_lang', newLang);
        showToast(`🌐 Bahasa: ${newLang.toUpperCase()}`, 'info');
        setTimeout(() => location.reload(), 500);
    };

    window._profile_toggleTheme = () => {
        const currentTheme = localStorage.getItem('dreamos_theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('dreamos_theme', newTheme);        showToast(`🎨 Tema: ${newTheme.toUpperCase()}`, 'info');
        setTimeout(() => location.reload(), 500);
    };

    window._profile_clearCache = () => {
        if (confirm('🗑️ Clear semua cache & localStorage?')) {
            localStorage.clear();
            showToast('✅ Cache cleared! Refreshing...', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    };

    window._profile_logout = async () => {
        if (confirm('🚪 Logout dari Dream OS?')) {
            if (supabase) {
                await supabase.auth.signOut();
            }
            localStorage.removeItem('dreamos_user');
            showToast('👋 Logged out!', 'info');
            setTimeout(() => location.reload(), 500);
        }
    };

    // ========== MODULE INIT ==========
    return function() {
        return renderRoot();
    };
}

// ========== AUTO-INIT LOG ==========
if (typeof window !== 'undefined') {
    console.log('👤 Profile module loaded | Ghost Mode: ON');
}
