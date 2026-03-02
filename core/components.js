// ═══════════════════════════════════════════════════════
// DREAM OS v2.0 - CORE COMPONENTS
// ═══════════════════════════════════════════════════════

/**
 * Toast Notification
 * @param {string} message - Pesan yang ditampilkan
 * @param {string} type - success | error | warning | info
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found!');
        alert(message);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Show Loading Overlay
 */
export function showLoading(message = 'Loading...') {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.innerHTML = `
            <div style="position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:99999;">
                <div style="text-align:center;">
                    <div style="width:60px;height:60px;border:4px solid rgba(16,185,129,0.3);border-top-color:#10b981;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem;"></div>
                    <p style="color:white;font-size:1rem;">${message}</p>
                </div>            </div>
        `;
        document.body.appendChild(loader);
    }
}

/**
 * Hide Loading Overlay
 */
export function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
    }
}

/**
 * Confirm Dialog
 */
export function showConfirm(message, onConfirm, onCancel) {
    if (confirm(message)) {
        if (onConfirm) onConfirm();
    } else {
        if (onCancel) onCancel();
    }
}

/**
 * Format Date to Indonesian
 */
export function formatDate(date) {
    const d = new Date(date);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format Time
 */
export function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format Currency (Rupiah)
 */
export function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

console.log('✅ Core Components loaded');
