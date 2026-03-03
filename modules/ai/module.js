// modules/ai/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { html } from './template.js';

// ========== KONFIGURASI ==========
// GANTI DENGAN URL WORKER ANDA SETELAH DEPLOY
const PROXY_URL = 'https://dream-os-v2-0.your-subdomain.workers.dev'; 

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = html;
}

// ========== HELPER FUNCTIONS ==========
function escapeHTML(str) {
    return str.replace(/[&<>"]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}

// ========== AI CHAT FUNCTIONS ==========
async function sendMessage() {
    const input = document.getElementById('ai-userInput');
    const display = document.getElementById('ai-chatDisplay');
    const modelSelect = document.getElementById('ai-modelSelect');
    if (!input || !display || !modelSelect) return;

    const message = input.value.trim();
    if (!message) return;

    // Tampilkan pesan user
    display.innerHTML += `<div class="message user"><p>${escapeHTML(message)}</p></div>`;
    input.value = '';
    display.scrollTop = display.scrollHeight;

    // Tampilkan typing indicator
    const typingId = 'ai-typing-' + Date.now();
    display.innerHTML += `<div class="message ai" id="${typingId}"><p class="typing-indicator">Sedang berpikir...</p></div>`;
    display.scrollTop = display.scrollHeight;

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                model: modelSelect.value
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Maaf, tidak ada respon.';

        const typingEl = document.getElementById(typingId);
        if (typingEl) {
            typingEl.innerHTML = `<p>${escapeHTML(reply)}</p>`;
        }
    } catch (err) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) {
            typingEl.innerHTML = `<p class="text-red-400">❌ Error: ${err.message}. Pastikan proxy aktif.</p>`;
        }
        showToast('Gagal menghubungi AI', 'error');
    }

    display.scrollTop = display.scrollHeight;
}

function quickAsk(question) {
    const input = document.getElementById('ai-userInput');
    if (input) {
        input.value = question;
        sendMessage();
    }
}

function updateModelDesc() {
    const modelSelect = document.getElementById('ai-modelSelect');
    const desc = document.getElementById('ai-modelDesc');
    if (!modelSelect || !desc) return;
    const val = modelSelect.value;
    if (val === 'cerebras') desc.innerHTML = '🚀 Cerebras: inferensi tercepat, cocok untuk chat real-time.';
    else if (val === 'deepseek') desc.innerHTML = '🧠 DeepSeek: reasoning mendalam, cocok analisis kompleks.';
    else if (val === 'qwen') desc.innerHTML = '💪 Qwen: model besar, multibahasa, sangat kuat.';
}

// ========== ATTACH EVENT LISTENERS ==========
function attachEvents() {
    const modelSelect = document.getElementById('ai-modelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', updateModelDesc);
    }

    // Pasang fungsi ke window agar bisa dipanggil dari HTML (onclick)
    window.aiSendMessage = sendMessage;
    window.aiQuickAsk = quickAsk;
}

// ========== CLEANUP ==========
function cleanup() {
    delete window.aiSendMessage;
    delete window.aiQuickAsk;
}

// ========== INIT ==========
export async function init(params) {
    console.log('[AI Module] Initializing...', params);

    renderHTML();
    attachEvents();
    updateModelDesc(); // set initial description

    console.log('[AI Module] Ready');
}

export { cleanup };
