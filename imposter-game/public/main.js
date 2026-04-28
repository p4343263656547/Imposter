// main.js — App entry point: initialize modules and wire all socket events

document.addEventListener('DOMContentLoaded', () => {
  // Boot
  UI.initParticles();
  UI.showScreen('entry');
  Lobby.init();

  // Connect socket
  GameSocket.connect();

  // ── Socket Event Handlers ──────────────────────────────────

  // Successfully joined a room
  GameSocket.on('joined', ({ playerId, roomState, isHost }) => {
    window._myId = playerId;
    Lobby.updateLobby(roomState);
    UI.showScreen('lobby');
    if (isHost) UI.toast('You are the host! Start when ready.', 'success');
  });

  // Lobby player list updated
  GameSocket.on('room_update', (roomState) => {
    // Update lobby if we're in it
    const lobbyScreen = document.getElementById('screen-lobby');
    if (lobbyScreen.classList.contains('active')) {
      Lobby.updateLobby(roomState);
    }
    // Always update game sidebar if game is running
    const gameScreen = document.getElementById('screen-game');
    if (gameScreen.classList.contains('active')) {
      Game.update(roomState);
    }
  });

  // Role assigned — show role reveal screen
  GameSocket.on('role_assigned', (data) => {
    Lobby.showRoleScreen(data);
  });

  // Game started (all players) — role screen is shown on role_assigned
  GameSocket.on('game_started', ({ roomState, currentTurnId }) => {
    // Already shown role screen — game screen shown after "I'M READY"
    Chat.clear();
    // Pre-warm game state
    window._gameState = roomState;
  });

  // Turn changed
  GameSocket.on('turn_changed', ({ currentTurnId, roomState }) => {
    window._gameState = roomState;
    const gameScreen = document.getElementById('screen-game');
    if (gameScreen.classList.contains('active')) {
      Game.update(roomState);
    }
  });

  // Clue submitted by any player
  GameSocket.on('clue_submitted', ({ clueEntry, roomState }) => {
    window._gameState = roomState;
    Game.addClue(clueEntry);
    const gameScreen = document.getElementById('screen-game');
    if (gameScreen.classList.contains('active')) {
      Game.update(roomState);
    }
  });

  // Round updated
  GameSocket.on('round_update', ({ round, roomState }) => {
    window._gameState = roomState;
    const gameScreen = document.getElementById('screen-game');
    if (gameScreen.classList.contains('active')) {
      Game.update(roomState);
      UI.toast(`Round ${round} begins!`, 'info');
    }
  });

  // Voting started
  GameSocket.on('voting_started', ({ roomState }) => {
    window._gameState = roomState;
    Voting.showVoting(roomState);
  });

  // Vote tally update
  GameSocket.on('vote_update', ({ voteCount, total }) => {
    Voting.updateProgress(voteCount, total);
  });

  // Player eliminated
  GameSocket.on('player_eliminated', (data) => {
    Voting.showElimination(data);
  });

  // Game over
  GameSocket.on('game_over', (data) => {
    setTimeout(() => Voting.showGameOver(data), 2200);
  });

  // Game continues (next round after vote, no winner yet)
  GameSocket.on('game_continued', ({ currentTurnId, roomState }) => {
    window._gameState = roomState;
    Chat.clear();
    UI.showScreen('game');
    Game.update(roomState);
    UI.toast('Game continues! New round starting...', 'info');
  });

  // AI Moderator message
  GameSocket.on('ai_message', ({ message, event }) => {
    Chat.addMessage(message, event);
  });
});
