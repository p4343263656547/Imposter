// public/js/game.js — Game screen: player sidebar, turn banner, clue feed

window.Game = (() => {
  let _state = null;

  // Called when player clicks "I'm Ready" from role screen
  function onEnter() {
    document.getElementById('btn-submit-clue').addEventListener('click', submitClue);
    document.getElementById('clue-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitClue();
    });

    if (window._gameState) update(window._gameState);
  }

  function update(roomState) {
    _state = roomState;
    const myId = GameSocket.getId();

    // ── Player Sidebar ──
    const list = document.getElementById('game-player-list');
    list.innerHTML = '';
    roomState.players.forEach(p => {
      list.appendChild(UI.buildPlayerCard(p, {
        isHost: p.id === roomState.hostId,
        isCurrentTurn: p.id === roomState.currentTurnId,
        myId,
        showEliminated: true,
      }));
    });

    // ── Round ──
    document.getElementById('current-round').textContent = roomState.round;
    document.getElementById('max-rounds').textContent    = roomState.maxRounds;

    // ── Turn Banner ──
    const current = roomState.players.find(p => p.id === roomState.currentTurnId);
    const isMyTurn = roomState.currentTurnId === myId;

    document.getElementById('turn-name').textContent = current
      ? (isMyTurn ? '⭐ YOU' : current.name) : '—';
    document.getElementById('game-hint').textContent = window._myHint || '—';

    const banner = document.getElementById('turn-banner');
    isMyTurn ? banner.classList.add('my-turn') : banner.classList.remove('my-turn');

    // ── Input Visibility ──
    document.getElementById('clue-input-zone').style.display  = isMyTurn ? 'flex' : 'none';
    document.getElementById('waiting-turn').style.display     = isMyTurn ? 'none' : 'flex';
    if (isMyTurn) {
      const inp = document.getElementById('clue-input');
      inp.disabled = false;
      document.getElementById('btn-submit-clue').disabled = false;
      inp.focus();
    }

    // ── Clue Feed ──
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
      _state.clues.push(clueEntry);
      renderClueFeed(_state.clues);
    }
  }

  function submitClue() {
    const input = document.getElementById('clue-input');
    const clue = input.value.trim().split(/\s+/)[0];
    if (!clue) { UI.toast('Enter one word!', 'warn'); return; }
    GameSocket.emit('submit_clue', { clue });
    input.value = '';
    input.disabled = true;
    document.getElementById('btn-submit-clue').disabled = true;
  }

  return { onEnter, update, addClue };
})();
