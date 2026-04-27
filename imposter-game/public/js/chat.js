// chat.js — AI moderator message feed (NEXUS)

window.Chat = (() => {
  const MAX_MESSAGES = 50;

  function addMessage(message, event) {
    const feed = document.getElementById('ai-messages');
    if (!feed) return;

    const msg = document.createElement('div');
    msg.className = 'ai-msg ai-msg-in';

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msg.innerHTML = `
      <div class="ai-msg-bubble">${escapeHtml(message)}</div>
      <div class="ai-msg-time">${timeStr}</div>
    `;

    feed.appendChild(msg);

    // Trim old messages
    const all = feed.querySelectorAll('.ai-msg');
    if (all.length > MAX_MESSAGES) {
      all[0].remove();
    }

    // Scroll to bottom
    feed.scrollTop = feed.scrollHeight;

    // Also show as toast for important events
    const importantEvents = ['elimination', 'crewmatesWin', 'imposterWin', 'gameStart'];
    if (importantEvents.includes(event)) {
      UI.toast(message.replace(/[^\w\s!?.,'-]/g, '').trim(), 'info');
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clear() {
    const feed = document.getElementById('ai-messages');
    if (feed) feed.innerHTML = '';
  }

  return { addMessage, clear };
})();
