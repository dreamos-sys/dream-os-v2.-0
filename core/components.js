export function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#1e293b; color:white; padding:8px 16px; border-radius:12px; z-index:9999; opacity:0; transition:opacity 0.3s; border:1px solid rgba(16,185,129,0.4);`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
