// voting.js — Voting screen: grid, vote progress, result reveal

window.Voting = (() => {
  let hasVoted = false;
  let currentRoomState = null;

  function showVoting(roomState) {
    hasVoted = false;
    currentRoomState = roomState;
    const myId = GameSocket.getId();

    document.getElementById('voted-confirm').style.display = 'none';
    document.getElementById('vote-progress').textContent = '0 / ' + roomState.players.filter(p => !p.eliminated).length + ' voted';

    const grid = document.getElementById('voting-grid');
    grid.innerHTML = '';

    roomState.players
      .filter(p => !p.eliminated)
      .forEach(p => {
        const card = document.createElement('div');
        card.className = 'vote-card';
        card.dataset.id = p.id;
        if (p.id === myId) card.classList.add('vote-card-me');
        if (!p.connected) card.classList.add('vote-card-offline');

        card.innerHTML = `
          <div class="vote-avatar">${p.name[0].toUpperCase()}</div>
          <div class="vote-name">${p.name}${p.id === myId ? ' (you)' : ''}</div>
          <div class="vote-status">${p.connected ? '🟢' : '🔴'}</div>
          <div class="vote-count-display">0 votes</div>
        `;

        card.addEventListener('click', () => castVote(p.id));
        grid.appendChild(card);
      });

    UI.showScreen('voting');
  }

  function castVote(targetId) {
    if (hasVoted) return;
    hasVoted = true;

    document.querySelectorAll('.vote-card').forEach(c => {
      c.classList.remove('vote-selected');
      c.style.pointerEvents = 'none';
    });

    const selected = document.querySelector(`.vote-card[data-id="${targetId}"]`);
    if (selected) selected.classList.add('vote-selected');

    document.getElementById('voted-confirm').style.display = 'flex';
    GameSocket.emit('submit_vote', { targetId });
  }

  function updateProgress(voteCount, total) {
    document.getElementById('vote-progress').textContent = `${voteCount} / ${total} voted`;
  }

  function showElimination(data) {
    const { eliminatedId, eliminatedName, wasImposter, voteCount } = data;

    // Highlight eliminated card if still on voting screen
    const card = document.querySelector(`.vote-card[data-id="${eliminatedId}"]`);
    if (card) {
      card.classList.add(wasImposter ? 'vote-was-imposter' : 'vote-was-innocent');
    }

    setTimeout(() => {
      UI.toast(
        wasImposter
          ? `✅ ${eliminatedName} WAS the Imposter!`
          : `❌ ${eliminatedName} was innocent...`,
        wasImposter ? 'success' : 'error'
      );
    }, 400);
  }

  function showGameOver(data) {
    const { winner, reason, imposterName, word } = data;

    document.getElementById('result-icon').textContent = winner === 'crewmates' ? '🏆' : '😈';
    document.getElementById('result-title').textContent =
      winner === 'crewmates' ? 'CREWMATES WIN!' : 'IMPOSTER WINS!';
    document.getElementById('result-reason').textContent = reason;
    document.getElementById('imposter-reveal').textContent = imposterName || '???';
    document.getElementById('word-reveal').textContent = word || '???';

    UI.showScreen('gameover');
  }

  return { showVoting, updateProgress, showElimination, showGameOver };
})();
