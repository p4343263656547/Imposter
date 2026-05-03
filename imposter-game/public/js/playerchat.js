// public/js/playerchat.js — Player chat with vanishing messages & emoji reactions
// This is SEPARATE from the existing chat.js (NEXUS AI moderator)

window.PlayerChat = (() => {
  const VANISH_MS = 20000;   // messages vanish after 20s
  const WARN_MS   = 15000;   // timer goes orange at 5s left
  const MAX_MSGS  = 40;

  let myName = '';
  let myId   = '';
  let socket = null;
  let timers = {};            // msgId => { countdown, vanish }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(sock, playerName, playerId) {
    socket = sock;
    myName = playerName;
    myId   = playerId;

    // Listen for incoming chat messages
    socket.on('player_chat', onIncoming);
    socket.on('player_reaction', onReaction);

    // Send on Enter key
    const input = document.getElementById('pc-input');
    const btn   = document.getElementById('pc-send-btn');
    if (input) {
      input.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
    }
    if (btn) btn.addEventListener('click', sendChat);

    // Reaction buttons
    document.querySelectorAll('.pc-react-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        sendReaction(emoji, btn);
      });
    });
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  function sendChat() {
    const input = document.getElementById('pc-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || !socket) return;
    socket.emit('player_chat', { text });
    input.value = '';
  }

  function sendReaction(emoji, buttonEl) {
    if (!socket) return;
    socket.emit('player_reaction', { emoji });
    // local burst animation
    if (buttonEl) burstEmoji(emoji, buttonEl);
  }

  // ── Receive ───────────────────────────────────────────────────────────────
  function onIncoming({ id, playerName, playerId, text, timestamp }) {
    addMessage({ id, name: playerName, pid: playerId, text, type: 'chat' });
  }

  function onReaction({ id, playerName, playerId, emoji, timestamp }) {
    addMessage({ id, name: playerName, pid: playerId, text: emoji, type: 'reaction' });
  }

  // ── Render message ────────────────────────────────────────────────────────
  function addMessage({ id, name, pid, text, type, isAI }) {
    const feed = document.getElementById('pc-feed');
    if (!feed) return;

    // Remove placeholder
    const empty = feed.querySelector('.pc-empty');
    if (empty) empty.remove();

    // Trim old
    const existing = feed.querySelectorAll('.pc-msg');
    if (existing.length >= MAX_MSGS) {
      removeMsg(existing[0]);
    }

    const msgId  = id || ('msg-' + Date.now() + Math.random());
    const isMe   = pid === myId;
    const time   = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const el = document.createElement('div');
    el.className = [
      'pc-msg',
      type === 'reaction' ? 'is-reaction' : '',
      isMe ? 'is-me' : '',
      isAI ? 'is-ai' : '',
    ].filter(Boolean).join(' ');
    el.dataset.msgId = msgId;
    el.setAttribute("data-msg-id", msgId);

    const safeText = escHtml(text);
    const nameClass = isMe ? 'pc-msg-name is-me' : (isAI ? 'pc-msg-name is-ai' : 'pc-msg-name');

    el.innerHTML = `
      <div class="pc-msg-meta">
        <span class="${nameClass}">${escHtml(name)}</span>
        <span class="pc-msg-time">${time}</span>
        <span class="pc-msg-timer" data-msgid="${msgId}">20s</span>
      </div>
      <div class="pc-msg-bubble">${safeText}</div>
    `;

    feed.appendChild(el);
    feed.scrollTop = feed.scrollHeight;

    // Countdown + vanish timer
    startVanishTimer(msgId, el);
  }

  // Add message from AI moderator into player chat feed too
  function addAIMessage(text) {
    addMessage({
      id: 'ai-' + Date.now(),
      name: 'NEXUS',
      pid: '__ai__',
      text,
      type: 'chat',
      isAI: true,
    });
  }

  // ── Vanish timer ──────────────────────────────────────────────────────────
  function startVanishTimer(msgId, el) {
    let remaining = VANISH_MS / 1000;

    // Countdown display every second
    const intervalId = setInterval(() => {
      remaining--;
      const timerEl = document.querySelector(`.pc-msg-timer[data-msgid="${msgId}"]`);
      if (timerEl) {
        timerEl.textContent = remaining + 's';
        if (remaining <= 5) timerEl.style.color = '#ff6b6b';
      }
      if (remaining <= 0) clearInterval(intervalId);
    }, 1000);

    // Actual remove after VANISH_MS
    const vanishId = setTimeout(() => {
      clearInterval(intervalId);
      const msgEl = document.querySelector(`.pc-msg[data-msg-id="${msgId}"], .pc-msg[data-msgid="${msgId}"]`) || el;
      removeMsg(msgEl);
    }, VANISH_MS);

    timers[msgId] = { interval: intervalId, timeout: vanishId };
  }

  function removeMsg(el) {
    if (!el || !el.parentNode) return;
    el.classList.add('vanishing');
    setTimeout(() => {
      if (el.parentNode) el.remove();
      // if feed is empty, show placeholder
      const feed = document.getElementById('pc-feed');
      if (feed && !feed.querySelector('.pc-msg')) {
        feed.innerHTML = '<div class="pc-empty">Chat with your crew...</div>';
      }
    }, 1000);
  }

  // ── Emoji burst ───────────────────────────────────────────────────────────
  function burstEmoji(emoji, originEl) {
    const rect = originEl.getBoundingClientRect();
    const burst = document.createElement('div');
    burst.className = 'pc-emoji-burst';
    burst.textContent = emoji;
    burst.style.left = rect.left + 'px';
    burst.style.top  = rect.top + 'px';
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 1300);
  }

  // ── Clear chat (new game) ─────────────────────────────────────────────────
  function clear() {
    Object.values(timers).forEach(t => {
      clearInterval(t.interval);
      clearTimeout(t.timeout);
    });
    timers = {};
    const feed = document.getElementById('pc-feed');
    if (feed) feed.innerHTML = '<div class="pc-empty">Chat with your crew...</div>';
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  // Public handlers called from main.js
  function onIncomingPublic(data) { onIncoming(data); }
  function onReactionPublic(data) { onReaction(data); }

  return { init, addAIMessage, clear, onIncomingPublic, onReactionPublic };
})();
