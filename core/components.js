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

export function showModal(title, content, onConfirm) {
    // Implementasi modal sederhana
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100]';
    modal.innerHTML = `
        <div class="bg-slate-800 p-6 rounded-2xl max-w-md w-full">
            <h3 class="text-xl font-bold mb-4">${title}</h3>
            <div class="mb-6">${content}</div>
            <div class="flex justify-end gap-2">
                <button id="modal-cancel" class="px-4 py-2 bg-slate-700 rounded">Batal</button>
                <button id="modal-confirm" class="px-4 py-2 bg-emerald-600 rounded">Konfirmasi</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('modal-cancel').onclick = () => modal.remove();
    document.getElementById('modal-confirm').onclick = () => {
        if (onConfirm) onConfirm();
        modal.remove();
    };
}
