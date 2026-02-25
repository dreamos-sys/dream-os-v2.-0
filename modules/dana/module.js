import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export function init() {
    console.log('[DANA] Module loaded');
    
    document.getElementById('danaForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = '⏳ Mengirim...';
        
        try {
            const { error } = await supabase
                .from('pengajuan_dana')
                .insert([{
                    kategori: data.kategori,
                    judul: data.judul,
                    deskripsi: data.deskripsi || null,
                    nominal: parseFloat(data.nominal),
                    periode: data.periode || null,
                    pengaju: data.pengaju,
                    departemen: data.departemen || null,
                    status: 'pending'
                }]);
            
            if (error) throw error;
            
            document.getElementById('form-result').innerHTML = 
                '<p class="text-green-500 font-bold">✅ Pengajuan dana berhasil!</p>';
            showToast('Pengajuan terkirim!', 'success');
            e.target.reset();
            
        } catch (err) {
            document.getElementById('form-result').innerHTML = 
                `<p class="text-red-500 font-bold">❌ ${err.message}</p>`;
            showToast('Gagal: ' + err.message, 'error');
            
        } finally {
            btn.disabled = false;
            btn.textContent = '📤 Ajukan Dana';
        }
    });
}
