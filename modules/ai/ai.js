import { chatbotResponse } from '../../core/ai.js';

export function init() {
    console.log('🤖 Modul AI dimuat');
}

window.askAI = function() {
    const question = document.getElementById('ai-question').value;
    const answer = chatbotResponse(question);
    document.getElementById('ai-answer').innerHTML = `<p class="text-emerald-400">${answer}</p>`;
};
