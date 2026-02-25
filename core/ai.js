// Prediksi stok (regresi linear sederhana)
export function predictStock(history) {
    // history: array of { date, amount } per hari
    if (!history || history.length < 2) return null;
    const x = history.map((_, i) => i);
    const y = history.map(h => h.amount);
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // prediksi untuk hari ke-n
    const next = slope * n + intercept;
    return Math.max(0, Math.round(next));
}

export function getPurchaseRecommendations(currentStock, minStock, avgUsage) {
    const daysLeft = (currentStock - minStock) / avgUsage;
    if (daysLeft < 7) {
        return { needPurchase: true, amount: Math.ceil(minStock * 1.5 - currentStock) };
    }
    return { needPurchase: false };
}

// Chatbot rule-based sederhana
const rules = [
    { keywords: ['stok', 'habis', 'barang'], intent: 'stock_info' },
    { keywords: ['booking', 'pesan', 'ruang'], intent: 'booking_info' },
    { keywords: ['k3', 'laporan', 'kecelakaan'], intent: 'k3_info' },
];

export function chatbotResponse(query) {
    const lower = query.toLowerCase();
    for (let rule of rules) {
        if (rule.keywords.some(k => lower.includes(k))) {
            return `Anda bertanya tentang ${rule.intent}. Silakan buka modul terkait.`;
        }
    }
    return "Maaf, saya belum mengerti pertanyaan Anda. Coba tanyakan tentang stok, booking, atau K3.";
}
