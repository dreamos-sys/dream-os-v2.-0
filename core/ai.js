// ═══════════════════════════════════════════════════════
// DREAM OS v2.0 - AI INSIGHT ENGINE
// ═══════════════════════════════════════════════════════

import { config } from './config.js';

// ========== PREDIKSI STOK (Linear Regression) ==========
export function predictStock(history) {
    // history: array of { date: 'YYYY-MM-DD', amount: number }
    if (!history || history.length < 2) return null;
    
    // Ambil 7 data terakhir untuk prediksi
    const recent = history.slice(-7);
    const x = recent.map((_, i) => i);
    const y = recent.map(h => h.amount);
    const n = x.length;
    
    // Linear regression: y = mx + b
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const denominator = (n * sumX2 - sumX * sumX);
    if (denominator === 0) return Math.round(y[y.length - 1]); // Fallback
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    // Prediksi untuk 3 hari ke depan
    const predictions = [1, 2, 3].map(days => {
        const next = slope * (n + days - 1) + intercept;
        return Math.max(0, Math.round(next));
    });
    
    return {
        tomorrow: predictions[0],
        in3days: predictions[2],
        trend: slope > 0.5 ? 'increasing' : slope < -0.5 ? 'decreasing' : 'stable'
    };
}

// ========== REKOMENDASI PEMBELIAN ==========
export function getPurchaseRecommendations(currentStock, minStock, avgUsage) {
    if (!avgUsage || avgUsage <= 0) return { needPurchase: false, reason: 'Data usage tidak tersedia' };
    
    const daysLeft = (currentStock - minStock) / avgUsage;
    
    if (daysLeft < 3) {
        return {             needPurchase: true, 
            urgency: 'critical',
            amount: Math.ceil(minStock * 2 - currentStock),
            reason: `Stok kritis! Cukup untuk ${Math.round(daysLeft)} hari`
        };
    } else if (daysLeft < 7) {
        return { 
            needPurchase: true, 
            urgency: 'warning',
            amount: Math.ceil(minStock * 1.5 - currentStock),
            reason: `Stok menipis. Cukup untuk ${Math.round(daysLeft)} hari`
        };
    }
    return { needPurchase: false, reason: `Stok aman untuk ${Math.round(daysLeft)} hari` };
}

// ========== CHATBOT RULE-BASED ==========
const chatbotRules = [
    { 
        keywords: ['stok', 'habis', 'barang', 'inventory', 'sisa'], 
        intent: 'stock_info',
        response: (data) => `📦 Stok saat ini: ${data?.current || '?'} unit. ${data?.prediction ? `Prediksi besok: ${data.prediction.tomorrow}` : ''}`
    },
    { 
        keywords: ['booking', 'pesan', 'ruang', 'aula', 'jadwal'], 
        intent: 'booking_info',
        response: () => '📅 Untuk booking, buka modul BOOKING atau ketik "booking [ruangan] [tanggal]"'
    },
    { 
        keywords: ['k3', 'laporan', 'kecelakaan', 'bahaya', 'insiden'], 
        intent: 'k3_info',
        response: () => '⚠️ Untuk laporan K3, buka modul K3 atau ketik "lapor [jenis] [lokasi]"'
    },
    { 
        keywords: ['dana', 'uang', 'pengajuan', 'budget'], 
        intent: 'dana_info',
        response: () => '💰 Untuk pengajuan dana, buka modul DANA atau ketik "ajukan [nominal] [keperluan]"'
    },
    { 
        keywords: ['bantu', 'help', 'apa', 'bisa'], 
        intent: 'help',
        response: () => '🤖 Saya bisa bantu: cek stok, info booking, laporan K3, atau pengajuan dana. Tanya aja!'
    }
];

export function chatbotResponse(query, context = {}) {
    const lower = query.toLowerCase().trim();
    
    // Cari matching rule
    for (let rule of chatbotRules) {        if (rule.keywords.some(k => lower.includes(k))) {
            return {
                intent: rule.intent,
                message: rule.response(context),
                suggestions: getSuggestions(rule.intent)
            };
        }
    }
    
    // Default fallback
    return {
        intent: 'unknown',
        message: "Maaf, saya belum mengerti. Coba tanyakan tentang: stok, booking, K3, atau dana.",
        suggestions: ['Cek stok barang', 'Booking ruangan', 'Lapor insiden K3', 'Ajukan dana']
    };
}

function getSuggestions(intent) {
    const suggestions = {
        stock_info: ['Prediksi stok besok', 'Rekomendasi pembelian', 'Cek stok rendah'],
        booking_info: ['Booking Aula SMP', 'Lihat jadwal hari ini', 'Batalkan booking'],
        k3_info: ['Lapor kecelakaan', 'Cek laporan terbuka', 'Panduan K3'],
        dana_info: ['Ajukan dana darurat', 'Cek status pengajuan', 'Limit pengajuan'],
        help: ['Tutorial sistem', 'Kontak admin', 'Feedback']
    };
    return suggestions[intent] || ['Coba lagi', 'Buka menu utama'];
}

// ========== AI INSIGHT GENERATOR (Untuk Command Center) ==========
export function generateAIInsights(stats, inventory = [], prayerNow = null) {
    const insights = [];
    
    // 1. Booking insight
    if (stats?.booking > 5) {
        insights.push({
            type: 'warning',
            icon: '📈',
            message: `Booking tinggi (${stats.booking} pending) — siapkan kapasitas tambahan`,
            action: { text: 'Lihat antrian', module: 'approval' }
        });
    }
    
    // 2. K3 insight
    if (stats?.k3 > 3) {
        insights.push({
            type: 'critical',
            icon: '⚠️',
            message: `${stats.k3} laporan K3 menunggu review — prioritas tinggi!`,
            action: { text: 'Review sekarang', module: 'approval' }
        });    }
    
    // 3. Dana insight
    if (stats?.dana > 5) {
        insights.push({
            type: 'warning',
            icon: '💰',
            message: `${stats.dana} pengajuan dana pending — perlu approval segera`,
            action: { text: 'Proses approval', module: 'approval' }
        });
    }
    
    // 4. Stock prediction insight (PAKE KODE LU!)
    const lowStockItems = (inventory || []).filter(i => i.jumlah <= i.minimal_stok);
    if (lowStockItems.length > 0) {
        const item = lowStockItems[0];
        const prediction = predictStock([
            { date: '2026-01-01', amount: item.minimal_stok + 5 },
            { date: '2026-01-02', amount: item.minimal_stok + 3 },
            { date: '2026-01-03', amount: item.jumlah }
        ]);
        
        const recommendation = getPurchaseRecommendations(
            item.jumlah, 
            item.minimal_stok, 
            2 // avg usage per day (bisa diganti dengan data real)
        );
        
        if (recommendation.needPurchase) {
            insights.push({
                type: recommendation.urgency === 'critical' ? 'critical' : 'warning',
                icon: '📦',
                message: `${item.nama_barang}: ${recommendation.reason}. Butuh ${recommendation.amount} unit.`,
                action: { text: 'Restock sekarang', module: 'stok' }
            });
        }
    }
    
    // 5. Prayer-time insight (Spiritual Layer!)
    if (prayerNow && config.features.prayerAdaptation) {
        const prayerMessages = {
            'Subuh': '🕌 Waktu Subuh — sistem dalam mode tenang. Notifikasi non-kritik ditunda.',
            'Dzuhur': '🕌 Waktu Dzuhur — ingat shalat, sistem tetap optimal.',
            'Ashar': '🕌 Waktu Ashar — semangat menyelesaikan tugas sebelum Maghrib!',
            'Maghrib': '🕌 Waktu Maghrib — sistem adaptif: UI lebih hangat, notifikasi lembut.',
            'Isya': '🕌 Waktu Isya — mode malam aktif. Tidur cukup, kerja optimal besok!'
        };
        insights.push({
            type: 'spiritual',
            icon: '🤲',            message: prayerMessages[prayerNow],
            action: null
        });
    }
    
    // 6. Default optimistic message
    if (insights.length === 0) {
        insights.push({
            type: 'success',
            icon: '✅',
            message: '✨ Semua sistem optimal. Tidak ada tindakan diperlukan. Bi idznillah!',
            action: null
        });
    }
    
    return insights;
}

// ========== EXPORT FOR GLOBAL ACCESS ==========
if (typeof window !== 'undefined') {
    window.DreamAI = {
        predictStock,
        getPurchaseRecommendations,
        chatbotResponse,
        generateAIInsights
    };
}
