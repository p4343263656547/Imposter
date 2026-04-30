// public/js/game.js — Game screen: player sidebar, turn banner, clue feed, typing

window.Game = (() => {
  let _state = null;
  let _typingTimer = null;
  let _inactivityInterval = null;

  function onEnter() {
    const submitBtn = document.getElementById('btn-submit-clue');
    const clueInput = document.getElementById('clue-input');

    // Remove previous listeners to avoid duplicates
    submitBtn.replaceWith(submitBtn.cloneNode(true));
    clueInput.replaceWith(clueInput.cloneNode(true));

    document.getElementById('btn-submit-clue').addEventListener('click', submitClue);
    document.getElementById('clue-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitClue();
    });

    // Typing indicator: emit while typing, stop after 1.5s idle
    document.getElementById('clue-input').addEventListener('input', () => {
      GameSocket.emit('typing', { isTyping: true });
      clearTimeout(_typingTimer);
      _typingTimer = setTimeout(() => GameSocket.emit('typing', { isTyping: false }), 1500);
    });

    if (window._gameState) update(window._gameState);
  }

  function update(roomState) {
    _state = roomState;
    const myId = GameSocket.getId();

    // ── Player Sidebar ──
    const list = document.getElementById('game-player-list');
    list.innerHTML = '';
    const isHost = roomState.hostId === myId;
    roomState.players.forEach(p => {
      list.appendChild(UI.buildPlayerCard(p, {
        isHost: p.id === roomState.hostId,
        isCurrentTurn: p.id === roomState.currentTurnId,
        myId, showEliminated: true,
        canKick: isHost, isHostUser: isHost,
      }));
    });

    document.getElementById('current-round').textContent = roomState.round;
    document.getElementById('max-rounds').textContent    = roomState.maxRounds;

    const current = roomState.players.find(p => p.id === roomState.currentTurnId);
    const isMyTurn = roomState.currentTurnId === myId;

    document.getElementById('turn-name').textContent = current
      ? (isMyTurn ? '⭐ YOU' : current.name) : '—';
    document.getElementById('game-hint').textContent = window._myHint || '—';

    const banner = document.getElementById('turn-banner');
    isMyTurn ? banner.classList.add('my-turn') : banner.classList.remove('my-turn');

    document.getElementById('clue-input-zone').style.display = isMyTurn ? 'flex' : 'none';
    document.getElementById('waiting-turn').style.display    = isMyTurn ? 'none' : 'flex';

    if (isMyTurn) {
      const inp = document.getElementById('clue-input');
      inp.disabled = false;
      document.getElementById('btn-submit-clue').disabled = false;
      inp.focus();
    } else {
      // Clear own typing state
      clearTimeout(_typingTimer);
    }

    renderClueFeed(roomState.clues);
  }

  function renderClueFeed(clues) {
    const feed = document.getElementById('clue-feed');
    if (!clues || clues.length === 0) {
      feed.innerHTML = '<div class="feed-empty">Waiting for clues...</div>';
      return;
    }
    const byRound = {};
    clues.forEach(c => { (byRound[c.round] = byRound[c.round] || []).push(c); });
    feed.innerHTML = '';
    Object.keys(byRound).sort((a,b) => a-b).forEach(round => {
      const hdr = document.createElement('div');
      hdr.className = 'clue-round-header';
      hdr.textContent = `— ROUND ${round} —`;
      feed.appendChild(hdr);
      byRound[round].forEach(c => {
        const bubble = document.createElement('div');
        bubble.className = 'clue-bubble' + (c.playerId === GameSocket.getId() ? ' my-clue' : '');
        bubble.innerHTML = `<span class="clue-player">${c.playerName}</span><span class="clue-word">${c.clue}</span>`;
        feed.appendChild(bubble);
      });
    });
    feed.scrollTop = feed.scrollHeight;
  }

  function addClue(clueEntry) {
    if (_state) {
      _state.clues = _state.clues || [];
      _state.clues.push(clueEntry);
      renderClueFeed(_state.clues);
    }
  }

  function submitClue() {
    const input = document.getElementById('clue-input');
    const words = input.value.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) { UI.toast('Enter a clue!', 'warn'); return; }
    if (words.length > 7) { UI.toast('Max 7 words allowed!', 'warn'); return; }
    const clue = words.join(' ');
    GameSocket.emit('submit_clue', { clue });
    GameSocket.emit('typing', { isTyping: false });
    clearTimeout(_typingTimer);
    input.value = '';
    input.disabled = true;
    document.getElementById('btn-submit-clue').disabled = true;
  }

  // ── Inactivity countdown display ──
  function showInactivityWarning(secondsLeft) {
    UI.toast(`⏰ Your turn! Submit a clue or you'll be eliminated in ${secondsLeft}s!`, 'warn');
    // Show countdown in turn banner
    const banner = document.getElementById('turn-banner');
    let remaining = secondsLeft;
    clearInterval(_inactivityInterval);
    _inactivityInterval = setInterval(() => {
      remaining--;
      const el = document.getElementById('inactivity-countdown');
      if (el) el.textContent = `⏰ ${remaining}s`;
      if (remaining <= 0) clearInterval(_inactivityInterval);
    }, 1000);
  }

  function clearInactivityWarning() {
    clearInterval(_inactivityInterval);
    const el = document.getElementById('inactivity-countdown');
    if (el) el.textContent = '';
  }

  return { onEnter, update, addClue, showInactivityWarning, clearInactivityWarning };
})();
