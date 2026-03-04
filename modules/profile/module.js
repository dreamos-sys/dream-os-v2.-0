/**
 * Dream OS v2.0 - Profile Module
 */

export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader) {
    return `
        <div class="card">
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem">
                <i class="fas fa-user" style="color:#10b981;margin-right:.5rem"></i>
                Profile Pengguna
            </h3>
            <div style="text-align:center;padding:2rem">
                <div style="width:80px;height:80px;border-radius:50%;background:rgba(16,185,129,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
                    <i class="fas fa-user" style="font-size:2.5rem;color:#10b981"></i>
                </div>
                <h4 style="font-size:1.1rem;font-weight:600;margin-bottom:.25rem">
                    ${currentUser?.name || 'Guest User'}
                </h4>
                <p style="color:#94a3b8;font-size:.9rem">
                    ${currentUser?.email || 'Not logged in'}
                </p>
                <button class="btn btn-primary mt-2" onclick="alert('Fitur coming soon!')">
                    <i class="fas fa-edit"></i> Edit Profile
                </button>
            </div>
        </div>
    `;
}
