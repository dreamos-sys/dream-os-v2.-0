import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

let currentBucket = 'k3-foto';

export async function init() {
    console.log('📁 Modul Files dimuat');
    document.getElementById('file-bucket').addEventListener('change', (e) => {
        currentBucket = e.target.value;
        loadFiles();
    });
    await loadFiles();
}

window.loadFiles = async function() {
    const container = document.getElementById('file-list');
    container.innerHTML = '<p class="text-center py-8 col-span-full text-slate-400">⏳ Memuat...</p>';

    try {
        const { data: files, error } = await supabase.storage
            .from(currentBucket)
            .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

        if (error) throw error;

        if (!files || files.length === 0) {
            container.innerHTML = '<p class="text-center py-8 col-span-full text-slate-400">Tidak ada file</p>';
            return;
        }

        let html = '';
        for (const file of files) {
            const { data: urlData } = supabase.storage.from(currentBucket).getPublicUrl(file.name);
            const publicUrl = urlData?.publicUrl || '';
            const fileSize = (file.metadata?.size || 0) / 1024;
            const fileType = file.metadata?.mimetype || 'unknown';

            html += `
                <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-600">
                    <div class="flex flex-col items-center">
                        <div class="w-full h-32 bg-slate-700 rounded-lg mb-2 flex items-center justify-center">
                            ${fileType.startsWith('image/')
                                ? `<img src="${publicUrl}" class="max-w-full max-h-full object-contain">`
                                : `<i class="fas fa-file text-4xl text-slate-400"></i>`}
                        </div>
                        <p class="text-xs font-bold truncate w-full text-center" title="${file.name}">${file.name}</p>
                        <p class="text-[10px] text-slate-400">${fileSize.toFixed(1)} KB</p>
                        <div class="flex gap-2 mt-2">
                            <a href="${publicUrl}" target="_blank" class="bg-blue-600 px-2 py-1 rounded text-[10px]">🔍 Lihat</a>
                            <button onclick="downloadFile('${currentBucket}', '${file.name}')" class="bg-green-600 px-2 py-1 rounded text-[10px]">⬇️</button>
                            <button onclick="deleteFile('${currentBucket}', '${file.name}')" class="bg-red-600 px-2 py-1 rounded text-[10px]">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p class="text-center py-8 col-span-full text-red-500">❌ ${err.message}</p>`;
    }
};

window.downloadFile = async (bucket, fileName) => {
    const { data, error } = await supabase.storage.from(bucket).download(fileName);
    if (error) {
        showToast('Gagal download', 'error');
        return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.deleteFile = async (bucket, fileName) => {
    if (!confirm(`Hapus ${fileName}?`)) return;
    const { error } = await supabase.storage.from(bucket).remove([fileName]);
    if (error) {
        showToast('Gagal hapus', 'error');
    } else {
        showToast('File dihapus', 'success');
        loadFiles();
    }
};
