export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

export function showLoading(containerId, message = 'Memuat...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="flex justify-center py-8"><div class="spinner"></div><span class="ml-2">${message}</span></div>`;
}
