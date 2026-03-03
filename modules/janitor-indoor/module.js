// modules/janitor-indoor/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export async function init(params) {
    const content = document.getElementById('module-content');
    content.innerHTML = `
        <div class="max-w-4xl mx-auto p-4">
            <h2 class="text-2xl font-bold text-teal-400 mb-4">🧹 Janitor Indoor</h2>
            <form id="janitorForm" class="space-y-4">
                <div>
                    <label class="block text-sm">Tanggal</label>
                    <input type="date" id="tanggal" class="w-full p-2 bg-slate-700 rounded" required>
                </div>
                <div>
                    <label class="block text-sm">Shift</label>
                    <select id="shift" class="w-full p-2 bg-slate-700 rounded">
                        <option>Pagi</option>
                        <option>Siang</option>
                        <option>Malam</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm">Petugas</label>
                    <input type="text" id="petugas" class="w-full p-2 bg-slate-700 rounded" required>
                </div>
                <div>
                    <label class="block text-sm">Lokasi</label>
                    <input type="text" id="lokasi" class="w-full p-2 bg-slate-700 rounded" required>
                </div>
                <div>
                    <label class="block text-sm">Catatan</label>
                    <textarea id="catatan" rows="3" class="w-full p-2 bg-slate-700 rounded"></textarea>
                </div>
                <button type="submit" class="w-full bg-teal-600 p-3 rounded font-bold">Simpan</button>
                <div id="form-result" class="text-center text-sm"></div>
            </form>
        </div>
    `;
    // handle submit ke tabel janitor_indoor
    // ... (sama seperti pola di atas)
}

export function cleanup() {}
