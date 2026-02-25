import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export function init() {
    console.log('[K3] Module loaded');
    
    document.getElementById('k3Form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = '⏳ Mengirim...';
        
        try {
            const { error } = await supabase
                .from('k3_reports')
                .insert([{
                    tanggal: data.tanggal,
                    lokasi: data.lokasi,
                    jenis_laporan: data.jenis_laporan,
                    deskripsi: data.deskripsi,
                    pelapor: data.pelapor,
                    priority: data.priority,
                    status: 'pending'
                }]);
            
            if (error) throw error;
            
            document.getElementById('form-result').innerHTML = 
                '<p class="text-green-500 font-bold">✅ Laporan K3 berhasil!</p>';
            showToast('Laporan terkirim!', 'success');
            e.target.reset();
            
        } catch (err) {
            document.getElementById('form-result').innerHTML = 
                `<p class="text-red-500 font-bold">❌ ${err.message}</p>`;
            showToast('Gagal: ' + err.message, 'error');
            
        } finally {
            btn.disabled = false;
            btn.textContent = '📤 Laporkan';
        }
    });
}
