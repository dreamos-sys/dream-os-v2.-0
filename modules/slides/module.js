import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export async function init() {
    console.log('🖼️ Modul Slides dimuat');
    await loadPreviews();

    document.getElementById('slideForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const slideNumber = parseInt(document.getElementById('slide_number').value);
        const content = document.getElementById('slide_content').value.trim();

        if (!content) {
            showToast('Konten tidak boleh kosong', 'warning');
            return;
        }

        const { error } = await supabase.from('admin_info').insert([{
            slide_number: slideNumber,
            content
        }]);

        if (error) {
            showToast('Gagal update: ' + error.message, 'error');
        } else {
            showToast('Slide berhasil diupdate!', 'success');
            document.getElementById('slide_content').value = '';
            loadPreviews();
        }
    });
}

async function loadPreviews() {
    const { data } = await supabase.from('admin_info').select('*').order('created_at', { ascending: false });
    const slide5 = data?.find(s => s.slide_number === 5)?.content || '-';
    const slide6 = data?.find(s => s.slide_number === 6)?.content || '-';
    const slide7 = data?.find(s => s.slide_number === 7)?.content || '-';

    document.getElementById('preview5').textContent = slide5;
    document.getElementById('preview6').textContent = slide6;
    document.getElementById('preview7').textContent = slide7;
}
