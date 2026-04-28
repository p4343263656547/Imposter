// public/js/lobby.js — Join flow, lobby UI, host controls, role reveal

window.Lobby = (() => {
  function init() {
    // Pre-fill room from URL
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) document.getElementById('input-room').value = roomFromUrl;

    document.getElementById('btn-join').addEventListener('click', handleJoin);
    document.getElementById('input-name').addEventListener('keydown', e => { if (e.key === 'Enter') handleJoin(); });
    document.getElementById('input-room').addEventListener('keydown', e => { if (e.key === 'Enter') handleJoin(); });
    document.getElementById('btn-copy').addEventListener('click', copyLink);
    document.getElementById('btn-start').addEventListener('click', () => GameSocket.emit('start_game'));
    document.getElementById('btn-ready').addEventListener('click', () => {
      UI.showScreen('game');
      Game.onEnter();
    });
    document.getElementById('btn-play-again').addEventListener('click', () => {
      window.location.href = '/';
    });
  }

  function handleJoin() {
    const name = document.getElementById('input-name').value.trim();
    const roomInput = document.getElementById('input-room').value.trim();
    if (!name) { UI.toast('Enter a nickname!', 'warn'); return; }

    const roomId = roomInput || generateRoomCode();

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('room', roomId);
    window.history.replaceState({}, '', url);

    // Show invite link
    document.getElementById('share-wrap').style.display = 'block';
    document.getElementById('share-link').value = url.toString();

    window._myName = name;
    window._roomId = roomId;

    GameSocket.emit('join_room', { roomId, playerName: name });
  }

  function copyLink() {
    const val = document.getElementById('share-link').value;
    navigator.clipboard.writeText(val)
      .then(() => UI.toast('Invite link copied! 📋', 'success'))
      .catch(() => UI.toast('Copy failed — copy the link manually', 'error'));
  }

  function generateRoomCode() {
    const words = ['ALPHA','BETA','GAMMA','DELTA','NEXUS','SIGMA','OMEGA','ZETA','VEGA','NOVA'];
    return words[Math.floor(Math.random() * words.length)] + '-' + (Math.floor(Math.random() * 90) + 10);
  }

  function updateLobby(roomState) {
    const myId = GameSocket.getId();
    document.getElementById('room-code-display').textContent = roomState.id;
    document.getElementById('player-count').textContent = roomState.players.length;

    const grid = document.getElementById('lobby-players');
    grid.innerHTML = '';
    roomState.players.forEach(p => {
      grid.appendChild(UI.buildPlayerCard(p, { isHost: p.id === roomState.hostId, myId }));
    });

    const isHost = roomState.hostId === myId;
    const startBtn = document.getElementById('btn-start');
    const hostNote = document.getElementById('host-note');

    if (isHost) {
      startBtn.style.display = 'block';
      startBtn.disabled = roomState.players.length < 3;
      hostNote.textContent = roomState.players.length < 3
        ? `Need ${3 - roomState.players.length} more player(s)`
        : 'All set — start when ready!';
    } else {
      startBtn.style.display = 'none';
      hostNote.textContent = 'Waiting for host to start...';
    }
  }

  function showRoleScreen({ role, word, hint }) {
    const isImposter = role === 'imposter';
    const card = document.getElementById('role-reveal-card');
    card.className = 'role-reveal-card ' + (isImposter ? 'role-imposter' : 'role-crewmate');

    document.getElementById('role-icon').textContent     = isImposter ? '🕵️' : '👷';
    document.getElementById('role-title').textContent    = isImposter ? 'YOU ARE THE IMPOSTER' : 'YOU ARE A CREWMATE';
    document.getElementById('role-word-label').textContent = isImposter ? 'YOUR HINT CATEGORY' : 'SECRET WORD';
    document.getElementById('role-word').textContent     = isImposter ? hint : word;
    document.getElementById('role-desc').textContent     = isImposter
      ? 'Blend in. Give vague clues. Don\'t get caught.'
      : 'Give clues about the word. Expose the Imposter.';

    window._myRole = role;
    window._myWord = word;
    window._myHint = hint;

    UI.showScreen('role');
  }

  return { init, updateLobby, showRoleScreen };
})();
