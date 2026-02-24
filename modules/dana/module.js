import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export function init() {
    console.log('Modul Dana dimuat');

    const form = document.getElementById('danaForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Validasi field wajib
        if (!data.judul || !data.nominal || !data.unit_kerja || !data.pengaju) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Semua field wajib diisi!</span>';
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        try {
            const { error } = await supabase.from('pengajuan_dana').insert([{
                kategori: data.kategori,
                judul: data.judul,
                deskripsi: data.deskripsi || null,
                nominal: parseFloat(data.nominal),
                periode: data.periode || null,
                unit_kerja: data.unit_kerja,
                pengaju: data.pengaju,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

            document.getElementById('form-result').innerHTML = '<span class="text-green-500">✅ Pengajuan berhasil dikirim!</span>';
            showToast('Pengajuan dana berhasil', 'success');
            e.target.reset();
        } catch (err) {
            console.error(err);
            document.getElementById('form-result').innerHTML = `<span class="text-red-500">❌ Gagal: ${err.message}</span>`;
            showToast('Gagal mengirim', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'AJUKAN DANA';
        }
    });
}
