import { supabase } from '../../core/supabase.js';
import { Chart } from 'chart.js';

export async function init() {
    console.log('📈 Modul Analytics dimuat');
    await loadCharts();
}

async function loadCharts() {
    // Booking per hari (7 hari terakhir)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const { data: bookings } = await supabase
        .from('bookings')
        .select('created_at')
        .gte('created_at', start.toISOString());

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const counts = Array(7).fill(0);
    bookings?.forEach(b => {
        const day = new Date(b.created_at).getDay();
        counts[day]++;
    });

    new Chart(document.getElementById('chartBooking'), {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Booking',
                data: counts,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245,158,11,0.1)',
                tension: 0.4
            }]
        }
    });

    // Status booking
    const { data: statusData } = await supabase
        .from('bookings')
        .select('status');
    const pending = statusData?.filter(s => s.status === 'pending').length || 0;
    const approved = statusData?.filter(s => s.status === 'approved').length || 0;
    const rejected = statusData?.filter(s => s.status === 'rejected').length || 0;

    new Chart(document.getElementById('chartStatus'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Approved', 'Rejected'],
            datasets: [{
                data: [pending, approved, rejected],
                backgroundColor: ['#f59e0b', '#10b981', '#ef4444']
            }]
        }
    });

    // Dana per kategori
    const { data: dana } = await supabase.from('pengajuan_dana').select('kategori, nominal');
    const kategoriMap = {};
    dana?.forEach(d => {
        const kat = d.kategori || 'Umum';
        kategoriMap[kat] = (kategoriMap[kat] || 0) + (d.nominal || 0);
    });

    new Chart(document.getElementById('chartDana'), {
        type: 'bar',
        data: {
            labels: Object.keys(kategoriMap),
            datasets: [{
                label: 'Nominal (Rp)',
                data: Object.values(kategoriMap),
                backgroundColor: '#8b5cf6'
            }]
        }
    });

    // K3 per lokasi (ambil 5 teratas)
    const { data: k3 } = await supabase.from('k3_reports').select('lokasi');
    const lokasiCount = {};
    k3?.forEach(k => {
        lokasiCount[k.lokasi] = (lokasiCount[k.lokasi] || 0) + 1;
    });
    const sorted = Object.entries(lokasiCount).sort((a,b) => b[1] - a[1]).slice(0,5);

    new Chart(document.getElementById('chartK3'), {
        type: 'pie',
        data: {
            labels: sorted.map(s => s[0]),
            datasets: [{
                data: sorted.map(s => s[1]),
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
            }]
        }
    });
}
