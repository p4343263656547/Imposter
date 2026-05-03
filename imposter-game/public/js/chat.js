// public/js/chat.js — NEXUS AI moderator message feed

window.Chat = (() => {
  const MAX = 60;

  function addMessage(message, event) {
    const feed = document.getElementById('ai-messages');
    if (!feed) return;

    const msg = document.createElement('div');
    msg.className = 'ai-msg';

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msg.innerHTML = `
      <div class="ai-msg-bubble">${escHtml(message)}</div>
      <div class="ai-msg-time">${time}</div>
    `;
    feed.appendChild(msg);

    // Trim excess
    const all = feed.querySelectorAll('.ai-msg');
    if (all.length > MAX) all[0].remove();

    feed.scrollTop = feed.scrollHeight;

    // Toast for key moments
    if (['elimination','crewmatesWin','imposterWin','gameStart','votingStart'].includes(event)) {
      UI.toast(message.replace(/[^\w\s!?.,'\-]/g, '').trim().slice(0, 80), 'info');
    }
  }

  function clear() {
    const feed = document.getElementById('ai-messages');
    if (feed) feed.innerHTML = '';
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { addMessage, clear };
})();
