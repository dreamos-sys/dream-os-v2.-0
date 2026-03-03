// modules/k3/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export async function init(params) {
    console.log('[K3] Initializing...', params);

    const content = document.getElementById('module-content');
    content.innerHTML = `
        <div class="max-w-4xl mx-auto p-4">
            <h2 class="text-2xl font-bold text-orange-400 mb-4">⚠️ Laporan K3 (Sederhana)</h2>
            <form id="k3Form" class="space-y-4">
                <div>
                    <label class="block text-sm">Tanggal</label>
                    <input type="date" id="tanggal" class="w-full p-2 bg-slate-700 rounded" required>
                </div>
                <div>
                    <label class="block text-sm">Lokasi</label>
                    <input type="text" id="lokasi" placeholder="Gedung A" class="w-full p-2 bg-slate-700 rounded" required>
                </div>
                <div>
                    <label class="block text-sm">Jenis Laporan</label>
                    <select id="jenis_laporan" class="w-full p-2 bg-slate-700 rounded" required>
                        <option value="kerusakan">Kerusakan</option>
                        <option value="kehilangan">Kehilangan</option>
                        <option value="kebersihan">Kebersihan</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm">Deskripsi</label>
                    <textarea id="deskripsi" rows="3" class="w-full p-2 bg-slate-700 rounded" required></textarea>
                </div>
                <div>
                    <label class="block text-sm">Pelapor</label>
                    <input type="text" id="pelapor" placeholder="Nama" class="w-full p-2 bg-slate-700 rounded" required>
                </div>
                <button type="submit" class="w-full bg-orange-600 p-3 rounded font-bold">Kirim</button>
                <div id="form-result" class="text-center text-sm"></div>
            </form>
        </div>
    `;

    const form = document.getElementById('k3Form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            tanggal: document.getElementById('tanggal').value,
            lokasi: document.getElementById('lokasi').value,
            jenis_laporan: document.getElementById('jenis_laporan').value,
            deskripsi: document.getElementById('deskripsi').value,
            pelapor: document.getElementById('pelapor').value,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('k3_reports').insert([data]);
        if (error) {
            showToast('Error: ' + error.message, 'error');
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Gagal</span>';
        } else {
            showToast('Laporan terkirim!', 'success');
            document.getElementById('form-result').innerHTML = '<span class="text-green-500">Berhasil</span>';
            form.reset();
        }
    });
}

export function cleanup() {
    console.log('[K3] Cleanup');
}
