// modules/ai/template.js
export const html = `
<div class="max-w-4xl mx-auto p-4">
    <!-- BISMILLAH -->
    <div class="text-center mb-4">
        <p class="arabic text-2xl text-emerald-400 mb-2 crystal-text">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        <p class="arabic text-lg text-emerald-300 mb-1 crystal-text">اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ</p>
        <p class="text-[10px] tracking-[3px] text-slate-400 crystal-text">THE POWER SOUL OF SHALAWAT</p>
    </div>

    <!-- HEADER -->
    <div class="glass-card mb-6 p-4 text-center">
        <h1 class="text-2xl font-bold crystal-text">🤖 AI Assistant</h1>
        <p class="text-sm opacity-60 crystal-text">Multi-Model • Fast • Reasoning</p>
    </div>

    <!-- MODEL SELECTOR -->
    <div class="glass-card mb-6 p-4">
        <label class="text-sm opacity-60 mb-2 block crystal-text">Pilih Model AI:</label>
        <select id="ai-modelSelect" class="model-selector">
            <option value="cerebras">🚀 Cerebras Llama 70B (Tercepat)</option>
            <option value="deepseek">🧠 DeepSeek V3.2 (Reasoning)</option>
            <option value="qwen">💪 Qwen 3.5 397B (Terkuat)</option>
        </select>
        <p class="text-[10px] text-slate-500 mt-2 crystal-text" id="ai-modelDesc">• Menggunakan proxy Cloudflare untuk keamanan</p>
    </div>

    <!-- CHAT DISPLAY -->
    <div class="glass-card mb-6 p-4 min-h-[400px] max-h-[500px] overflow-y-auto" id="ai-chatDisplay">
        <div class="message ai">
            <p>Assalamualaikum! Saya AI Assistant Dream OS. Pilih model di atas, lalu tanyakan apa saja.</p>
        </div>
    </div>

    <!-- INPUT AREA -->
    <div class="glass-card p-4">
        <div class="flex gap-3">
            <input type="text" id="ai-userInput" 
                class="flex-1 bg-transparent border-2 border-white/20 rounded-16px px-4 py-3 text-white outline-none focus:border-emerald-400" 
                placeholder="Tanya sesuatu..."
                onkeypress="if(event.key === 'Enter') window.aiSendMessage()">
            <button onclick="window.aiSendMessage()" 
                class="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold transition">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
        <div class="flex gap-2 mt-3 flex-wrap">
            <button onclick="window.aiQuickAsk('Analisis status sistem Dream OS')" class="px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20">📊 Analisis</button>
            <button onclick="window.aiQuickAsk('Tips keamanan untuk admin')" class="px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20">🔒 Keamanan</button>
            <button onclick="window.aiQuickAsk('Cara optimasi performa')" class="px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20">⚡ Optimasi</button>
            <button onclick="window.aiQuickAsk('Doa pembuka majelis')" class="px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20">🕌 Doa</button>
        </div>
    </div>

    <!-- FOOTER -->
    <div class="text-center mt-6">
        <p class="text-[8px] text-slate-500 crystal-text">Powered by Cerebras, DeepSeek, Qwen • Dream Team © 2026</p>
    </div>
</div>
`;
