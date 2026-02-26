import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export async function init() {
    console.log('📄 Modul Laporan dimuat');
}

window.generateReport = async function() {
    const type = document.getElementById('report-type').value;
    const start = document.getElementById('report-start').value;
    const end = document.getElementById('report-end').value;
    const format = document.getElementById('report-format').value;
    const statusDiv = document.getElementById('report-status');

    if (!start || !end) {
        statusDiv.innerHTML = '<span class="text-red-500">Pilih rentang tanggal!</span>';
        return;
    }

    statusDiv.innerHTML = '<span class="text-yellow-500">⏳ Menggenerate laporan...</span>';

    try {
        let data = [];
        if (type === 'booking') {
            const { data: bookings } = await supabase
                .from('bookings')
                .select('nama_peminjam, ruang, tanggal, jam_mulai, jam_selesai, status')
                .gte('tanggal', start)
                .lte('tanggal', end)
                .order('tanggal');
            data = bookings || [];
        } else if (type === 'k3') {
            const { data: k3 } = await supabase
                .from('k3_reports')
                .select('tanggal, lokasi, jenis_laporan, deskripsi, pelapor, status')
                .gte('tanggal', start)
                .lte('tanggal', end)
                .order('tanggal');
            data = k3 || [];
        } else if (type === 'dana') {
            const { data: dana } = await supabase
                .from('pengajuan_dana')
                .select('created_at, judul, kategori, nominal, pengaju, status')
                .gte('created_at', start + 'T00:00:00')
                .lte('created_at', end + 'T23:59:59')
                .order('created_at');
            data = dana || [];
        }

        if (format === 'pdf') {
            generatePDF(type, data, start, end);
        } else {
            generateExcel(type, data, start, end);
        }

        statusDiv.innerHTML = '<span class="text-green-500">✅ Laporan berhasil digenerate!</span>';
    } catch (err) {
        statusDiv.innerHTML = `<span class="text-red-500">❌ Error: ${err.message}</span>`;
    }
};

function generatePDF(type, data, start, end) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Laporan ${type.toUpperCase()}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${start} s/d ${end}`, 14, 30);
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 36);

    let headers, rows;
    if (type === 'booking') {
        headers = [['Nama', 'Ruang', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Status']];
        rows = data.map(b => [b.nama_peminjam, b.ruang, b.tanggal, b.jam_mulai, b.jam_selesai, b.status]);
    } else if (type === 'k3') {
        headers = [['Tanggal', 'Lokasi', 'Jenis', 'Pelapor', 'Status']];
        rows = data.map(k => [k.tanggal, k.lokasi, k.jenis_laporan, k.pelapor, k.status]);
    } else {
        headers = [['Tanggal', 'Judul', 'Kategori', 'Nominal', 'Pengaju', 'Status']];
        rows = data.map(d => [new Date(d.created_at).toLocaleDateString('id-ID'), d.judul, d.kategori, `Rp ${Number(d.nominal).toLocaleString()}`, d.pengaju, d.status]);
    }

    doc.autoTable({ head: headers, body: rows, startY: 40 });
    doc.save(`laporan_${type}_${start}_${end}.pdf`);
}

function generateExcel(type, data, start, end) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `laporan_${type}_${start}_${end}.xlsx`);
}

// ===== CETAK LANGSUNG KE PRINTER =====
window.printReport = async function() {
    const type = document.getElementById('report-type').value;
    const start = document.getElementById('report-start').value;
    const end = document.getElementById('report-end').value;
    
    if (!start || !end) {
        showToast('Pilih rentang tanggal!', 'warning');
        return;
    }
    
    showToast('Menyiapkan laporan...', 'info');
    
    try {
        // Ambil data sesuai type (sama seperti export)
        let data = [];
        let title = 'Laporan';
        // ... (sama seperti di generateReport)
        
        // Generate PDF (reuse fungsi yang sudah ada)
        const pdfBlob = await generatePDFBlob(type, data, start, end, title);
        
        // Buka di tab baru dan langsung print
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl);
        printWindow.onload = function() {
            printWindow.print();
        };
        
    } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
    }
};
