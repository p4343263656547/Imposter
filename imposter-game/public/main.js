// public/main.js — App bootstrap: init modules + wire all socket events

document.addEventListener('DOMContentLoaded', () => {
  UI.initParticles();
  UI.showScreen('entry');
  Lobby.init();
  GameSocket.connect();

  // ── joined ───────────────────────────────────────────────
  GameSocket.on('joined', ({ playerId, roomState, isHost }) => {
    window._myId = playerId;
    Lobby.updateLobby(roomState);
    UI.showScreen('lobby');
    if (isHost) UI.toast('You are the host! Start when ready.', 'success');
  });

  // ── room_update ──────────────────────────────────────────
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
    // Role screen shown via role_assigned; game screen shown after "I'm Ready"
  });

  // ── turn_changed ──────────────────────────────────────────
  GameSocket.on('turn_changed', ({ roomState }) => {
    window._gameState = roomState;
    if (document.getElementById('screen-game').classList.contains('active')) {
      Game.update(roomState);
    }
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
    Voting.showVoting(roomState);
  });

  // ── vote_update ───────────────────────────────────────────
  GameSocket.on('vote_update', ({ voteCount, total }) => {
    Voting.updateProgress(voteCount, total);
  });

  // ── player_eliminated ─────────────────────────────────────
  GameSocket.on('player_eliminated', (data) => {
    Voting.showElimination(data);
  });

  // ── game_over ─────────────────────────────────────────────
  GameSocket.on('game_over', (data) => {
    setTimeout(() => Voting.showGameOver(data), 2500);
  });

  // ── game_continued ────────────────────────────────────────
  GameSocket.on('game_continued', ({ roomState }) => {
    window._gameState = roomState;
    Chat.clear();
    UI.showScreen('game');
    Game.update(roomState);
    UI.toast('Game continues! New round starting...', 'info');
  });

  // ── ai_message ────────────────────────────────────────────
  GameSocket.on('ai_message', ({ message, event }) => {
    Chat.addMessage(message, event);
  });
});
