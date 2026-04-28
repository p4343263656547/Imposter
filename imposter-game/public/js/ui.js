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

  // ── Player Card Builder ───────────────────────────────────
  function buildPlayerCard(player, options = {}) {
    const { isHost, isCurrentTurn, myId, showEliminated } = options;
    const card = document.createElement('div');
    card.className = 'player-card';
    card.dataset.id = player.id;
    if (player.id === myId) card.classList.add('is-me');
    if (player.eliminated && showEliminated) card.classList.add('eliminated');
    if (isCurrentTurn) card.classList.add('is-turn');

    const dot = player.connected ? '🟢' : '🔴';
    const elimBadge = (player.eliminated && showEliminated)
      ? '<span class="elim-badge">ELIMINATED</span>' : '';
    const crown = isHost ? '<span class="host-crown">👑</span>' : '';
    const arrow = isCurrentTurn ? '<span class="turn-arrow">▶</span>' : '';

    card.innerHTML = `
      <div class="player-avatar">${player.name[0].toUpperCase()}</div>
      <div class="player-info">
        <span class="player-name">${escHtml(player.name)}${player.id === myId ? ' <em>(you)</em>' : ''}${crown}</span>
        <span class="player-status">${dot} ${player.connected ? 'ONLINE' : 'OFFLINE'}</span>
        ${elimBadge}
      </div>
      ${arrow}
    `;
    return card;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { showScreen, toast, initParticles, buildPlayerCard };
})();
