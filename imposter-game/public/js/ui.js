// public/js/ui.js — Screen management, toast, particles, shared helpers

window.UI = (() => {
  // ── Screen System ──────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + id);
    if (target) target.classList.add('active');
  }

  // ── Toast ──────────────────────────────────────────────────
  let toastTimer;
  function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast show toast-${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  // ── Particles ──────────────────────────────────────────────
  function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.animationDuration = (8 + Math.random() * 14) + 's';
      p.style.animationDelay = (Math.random() * 12) + 's';
      container.appendChild(p);
    }
  }

  // ── Player Card Builder ────────────────────────────────────
  function buildPlayerCard(player, options = {}) {
    const { isHost, isCurrentTurn, myId, showEliminated, canKick, isHostUser } = options;
    const card = document.createElement('div');
    card.className = 'player-card';
    card.dataset.id = player.id;
    if (player.id === myId) card.classList.add('is-me');
    if (player.eliminated && showEliminated) card.classList.add('eliminated');
    if (isCurrentTurn) card.classList.add('is-turn');

    const dot = player.connected ? '🟢' : '🔴';
    const elimBadge = (player.eliminated && showEliminated) ? '<span class="elim-badge">ELIMINATED</span>' : '';
    const crown = isHost ? '<span class="host-crown">👑</span>' : '';
    const arrow = isCurrentTurn ? '<span class="turn-arrow">▶</span>' : '';
    const kickBtn = (canKick && isHostUser && player.id !== myId && !player.eliminated)
      ? `<button class="btn-kick" data-kick="${player.id}" title="Remove player">✕</button>` : '';

    card.innerHTML = `
      <div class="player-avatar">${player.name[0].toUpperCase()}</div>
      <div class="player-info">
        <span class="player-name">${escHtml(player.name)}${player.id === myId ? ' <em>(you)</em>' : ''}${crown}</span>
        <span class="player-status">${dot} ${player.connected ? 'ONLINE' : 'OFFLINE'}</span>
        ${elimBadge}
      </div>
      <div class="player-card-actions">${arrow}${kickBtn}</div>
    `;

    // Wire kick button
    const kb = card.querySelector('.btn-kick');
    if (kb) kb.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Remove ${player.name} from the game?`)) {
        GameSocket.emit('kick_player', { targetId: player.id });
      }
    });

    return card;
  }

  // ── Typing Indicator ───────────────────────────────────────
  const typingPlayers = new Set();

  function updateTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (!el) return;
    if (typingPlayers.size === 0) {
      el.style.display = 'none';
      el.textContent = '';
    } else {
      const names = [...typingPlayers].join(', ');
      el.style.display = 'flex';
      el.innerHTML = `<span class="typing-dots"><span></span><span></span><span></span></span> <span>${escHtml(names)} ${typingPlayers.size === 1 ? 'is' : 'are'} typing…</span>`;
    }
  }

  function setPlayerTyping(playerId, playerName, isTyping) {
    if (isTyping) typingPlayers.add(playerName);
    else typingPlayers.delete(playerName);
    updateTypingIndicator();
  }

  function clearTyping() {
    typingPlayers.clear();
    updateTypingIndicator();
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { showScreen, toast, initParticles, buildPlayerCard, setPlayerTyping, clearTyping };
})();

// ── Cookie & Recording Initialization ──────────────────────────────────────────
// NOTE: ID changed to 'btn-accept-cookies' to match your HTML
document.getElementById('btn-accept-cookies').addEventListener('click', () => {
  const banner = document.getElementById('cookie-banner');
  if (banner) banner.style.display = 'none';
  
  // Start recording after cookies are accepted
  if (window.RecordingModule) {
    window.RecordingModule.initRecording();
  }
});
