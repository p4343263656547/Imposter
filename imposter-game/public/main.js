// public/main.js — App bootstrap: wire all socket events

document.addEventListener('DOMContentLoaded', () => {
  UI.initParticles();
  UI.showScreen('entry');
  Lobby.init();
  GameSocket.connect();

  // ── joined (fresh join) ───────────────────────────────────
  GameSocket.on('joined', ({ playerId, roomState, isHost, sessionId }) => {
    window._myId = playerId;
    Storage.saveSession(sessionId);
    Lobby.updateLobby(roomState);
    UI.showScreen('lobby');
    if (isHost) UI.toast('You are the host! Start when ready.', 'success');
    // Init player chat
    const myName = Storage.getName() || 'Agent';
    if (window.PlayerChat) PlayerChat.init(GameSocket.getSocket(), myName, playerId);
  });

  // ── reconnected (refresh/reconnect) ──────────────────────
  GameSocket.on('reconnected', ({ playerId, roomState, isHost, role, word, hint, gameState, sessionId }) => {
    window._myId = playerId;
    if (sessionId) Storage.saveSession(sessionId);
    const myName = Storage.getName() || 'Agent';
    if (window.PlayerChat) PlayerChat.init(GameSocket.getSocket(), myName, playerId);
    window._myRole = role;
    window._myWord = word;
    window._myHint = hint;

    UI.toast('Reconnected! ⚡', 'success');

    if (gameState === 'lobby') {
      Lobby.updateLobby(roomState);
      UI.showScreen('lobby');
    } else if (gameState === 'playing') {
      window._gameState = roomState;
      UI.showScreen('game');
      Game.onEnter();
      Game.update(roomState);
    } else if (gameState === 'voting') {
      window._gameState = roomState;
      // voting_started will fire shortly via server broadcast
    } else if (gameState === 'ended') {
      UI.showScreen('gameover');
      Lobby.setIsHost(isHost);
    }
  });

  // ── room_update ───────────────────────────────────────────
  GameSocket.on('room_update', (roomState) => {
    if (document.getElementById('screen-lobby').classList.contains('active')) {
      Lobby.updateLobby(roomState);
    }
    if (document.getElementById('screen-game').classList.contains('active')) {
      Game.update(roomState);
    }
  });

  // ── role_assigned ─────────────────────────────────────────
  GameSocket.on('role_assigned', (data) => {
    Lobby.showRoleScreen(data);
  });

  // ── game_started ──────────────────────────────────────────
  GameSocket.on('game_started', ({ roomState }) => {
    window._gameState = roomState;
    Chat.clear();
    UI.clearTyping();
    // Role screen shown via role_assigned; game screen shown after "I'm Ready"
  });

  // ── turn_changed ──────────────────────────────────────────
  GameSocket.on('turn_changed', ({ roomState }) => {
    window._gameState = roomState;
    if (document.getElementById('screen-game').classList.contains('active')) {
      Game.update(roomState);
    }
    Game.clearInactivityWarning();
  });

  // ── clue_submitted ────────────────────────────────────────
  GameSocket.on('clue_submitted', ({ clueEntry, roomState }) => {
    window._gameState = roomState;
    Game.addClue(clueEntry);
    if (document.getElementById('screen-game').classList.contains('active')) {
      Game.update(roomState);
    }
  });

  // ── round_update ──────────────────────────────────────────
  GameSocket.on('round_update', ({ round, roomState }) => {
    window._gameState = roomState;
    if (document.getElementById('screen-game').classList.contains('active')) {
      Game.update(roomState);
    }
    UI.toast(`🔁 Round ${round} begins!`, 'info');
  });

  // ── voting_started ────────────────────────────────────────
  GameSocket.on('voting_started', ({ roomState }) => {
    window._gameState = roomState;
    UI.clearTyping();
    Game.clearInactivityWarning();
    Voting.showVoting(roomState);
  });

  // ── vote_update ───────────────────────────────────────────
  GameSocket.on('vote_update', (data) => {
    Voting.updateProgress(data);
  });

  // ── player_eliminated ─────────────────────────────────────
  GameSocket.on('player_eliminated', (data) => {
    Voting.showElimination(data);
  });

  // ── game_over ─────────────────────────────────────────────
  GameSocket.on('game_over', (data) => {
    setTimeout(() => Voting.showGameOver(data), 2500);
  });

  // ── you_are_host (after game over) ────────────────────────
  GameSocket.on('you_are_host', ({ isHost }) => {
    Lobby.setIsHost(isHost);
  });

  // ── game_continued ────────────────────────────────────────
  GameSocket.on('game_continued', ({ roomState }) => {
    window._gameState = roomState;
    Chat.clear();
    UI.clearTyping();
    UI.showScreen('game');
    Game.update(roomState);
    UI.toast('Game continues! New round starting...', 'info');
  });

  // ── ai_message ────────────────────────────────────────────
  GameSocket.on('ai_message', ({ message, event }) => {
    Chat.addMessage(message, event);
  });

  // ── player_typing ─────────────────────────────────────────
  GameSocket.on('player_typing', ({ playerId, playerName, isTyping }) => {
    if (playerId === GameSocket.getId()) return; // don't show own indicator
    UI.setPlayerTyping(playerId, playerName, isTyping);
  });

  // ── inactivity_warning ────────────────────────────────────
  GameSocket.on('inactivity_warning', ({ secondsLeft }) => {
    Game.showInactivityWarning(secondsLeft);
  });

  // ── player_inactivity_eliminated ──────────────────────────
  GameSocket.on('player_inactivity_eliminated', ({ playerId, playerName }) => {
    const myId = GameSocket.getId();
    if (playerId === myId) {
      UI.toast('⏰ You were eliminated for inactivity!', 'error');
    } else {
      UI.toast(`⏰ ${playerName} was eliminated for inactivity!`, 'warn');
    }
    Game.clearInactivityWarning();
  });

  // ── kicked ────────────────────────────────────────────────
  GameSocket.on('kicked', ({ reason }) => {
    Storage.clear();
    UI.toast(`🚪 ${reason}`, 'error');
    setTimeout(() => {
      window.location.href = '/';
    }, 2500);
  });
});
