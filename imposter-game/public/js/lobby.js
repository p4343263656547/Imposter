// public/js/lobby.js — Join flow, lobby UI, host controls, role reveal

window.Lobby = (() => {
  let _isHost = false;

  function init() {
    // Pre-fill room from URL
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) document.getElementById('input-room').value = roomFromUrl;

    // Pre-fill name from storage
    const savedName = Storage.getName();
    if (savedName) document.getElementById('input-name').value = savedName;

    document.getElementById('btn-join').addEventListener('click', handleJoin);
    document.getElementById('input-name').addEventListener('keydown', e => { if (e.key === 'Enter') handleJoin(); });
    document.getElementById('input-room').addEventListener('keydown', e => { if (e.key === 'Enter') handleJoin(); });
    document.getElementById('btn-copy').addEventListener('click', copyLink);
    document.getElementById('btn-share-native').addEventListener('click', shareNative);
    document.getElementById('btn-start').addEventListener('click', () => GameSocket.emit('start_game'));
    document.getElementById('btn-ready').addEventListener('click', () => {
      UI.showScreen('game');
      Game.onEnter();
    });
    document.getElementById('btn-play-again').addEventListener('click', handlePlayAgain);

    // Cookie consent
    showCookieBanner();
  }

  function showCookieBanner() {
    if (localStorage.getItem('cookies_accepted') === 'yes') return;
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'flex';
    const btn = document.getElementById('btn-accept-cookies');
    if (btn) btn.addEventListener('click', () => {
      localStorage.setItem('cookies_accepted', 'yes');
      banner.style.display = 'none';
    });
  }

  function handleJoin() {
    const name = document.getElementById('input-name').value.trim();
    const roomInput = document.getElementById('input-room').value.trim();
    if (!name) { UI.toast('Enter a nickname!', 'warn'); return; }

    const roomId = roomInput || generateRoomCode();
    const sessionId = Storage.getSession() || null;

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('room', roomId);
    window.history.replaceState({}, '', url);

    // Show invite link
    document.getElementById('share-wrap').style.display = 'block';
    document.getElementById('share-link').value = url.toString();

    // Save to storage
    Storage.saveName(name);
    Storage.saveRoomId(roomId);

    window._myName = name;
    window._roomId = roomId;

    GameSocket.emit('join_room', { roomId, playerName: name, sessionId });
  }

  function handlePlayAgain() {
    if (_isHost) {
      GameSocket.emit('play_again');
    } else {
      UI.toast('Waiting for host to start new game...', 'info');
    }
  }

  function setIsHost(val) {
    _isHost = val;
    const btn = document.getElementById('btn-play-again');
    if (!btn) return;
    if (val) {
      btn.textContent = '🔄 PLAY AGAIN';
      btn.disabled = false;
      btn.style.opacity = '1';
    } else {
      btn.textContent = '⏳ WAITING FOR HOST...';
      btn.disabled = true;
      btn.style.opacity = '0.5';
    }
  }

  function copyLink() {
    const val = document.getElementById('share-link').value;
    navigator.clipboard.writeText(val)
      .then(() => UI.toast('Invite link copied! 📋', 'success'))
      .catch(() => {
        // Fallback: select and copy
        const inp = document.getElementById('share-link');
        inp.select();
        document.execCommand('copy');
        UI.toast('Link copied!', 'success');
      });
  }

  function shareNative() {
    const url = document.getElementById('share-link').value;
    const roomId = window._roomId || '';
    const text = `Join my Imposter game! Room: ${roomId}`;

    if (navigator.share) {
      navigator.share({ title: 'Join Imposter Game', text, url })
        .catch(() => {}); // User cancelled
    } else {
      // Fallback: copy
      copyLink();
    }
  }

  function generateRoomCode() {
    const words = ['ALPHA','BETA','GAMMA','DELTA','NEXUS','SIGMA','OMEGA','ZETA','VEGA','NOVA'];
    return words[Math.floor(Math.random() * words.length)] + '-' + (Math.floor(Math.random() * 90) + 10);
  }

  function updateLobby(roomState) {
    const myId = GameSocket.getId();
    document.getElementById('room-code-display').textContent = roomState.id;
    document.getElementById('player-count').textContent = roomState.players.length;

    const isHost = roomState.hostId === myId;
    _isHost = isHost;

    const grid = document.getElementById('lobby-players');
    grid.innerHTML = '';
    roomState.players.forEach(p => {
      grid.appendChild(UI.buildPlayerCard(p, {
        isHost: p.id === roomState.hostId,
        myId,
        canKick: isHost,
        isHostUser: isHost,
      }));
    });

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

    document.getElementById('role-icon').textContent       = isImposter ? '🕵️' : '👷';
    document.getElementById('role-title').textContent      = isImposter ? 'YOU ARE THE IMPOSTER' : 'YOU ARE A CREWMATE';
    document.getElementById('role-word-label').textContent = isImposter ? 'YOUR HINT CATEGORY' : 'SECRET WORD';
    document.getElementById('role-word').textContent       = isImposter ? hint : word;
    document.getElementById('role-desc').textContent       = isImposter
      ? 'Blend in. Give vague clues. Don\'t get caught.'
      : 'Give clues about the word. Expose the Imposter.';

    window._myRole = role;
    window._myWord = word;
    window._myHint = hint;

    UI.showScreen('role');
  }

  return { init, updateLobby, showRoleScreen, setIsHost, handlePlayAgain };
})();
