// public/js/voting.js — Voting screen with live vote counts per candidate

window.Voting = (() => {
  let hasVoted = false;
  let _roomState = null;

  function showVoting(roomState) {
    hasVoted = false;
    _roomState = roomState;
    const myId = GameSocket.getId();
    const eligible = roomState.players.filter(p => !p.eliminated);

    document.getElementById('voted-confirm').style.display = 'none';
    document.getElementById('vote-progress').textContent = `0 / ${eligible.length} voted`;

    // Build clue review (what everyone said this game, so players can review before voting)
    const clueReview = document.getElementById('vote-clue-review');
    if (clueReview && roomState.clues && roomState.clues.length > 0) {
      clueReview.innerHTML = '<div class="clue-review-title">📝 CLUES GIVEN</div>';
      const byPlayer = {};
      roomState.clues.forEach(c => {
        if (!byPlayer[c.playerId]) byPlayer[c.playerId] = { name: c.playerName, clues: [] };
        byPlayer[c.playerId].clues.push(`R${c.round}: ${c.clue}`);
      });
      Object.values(byPlayer).forEach(({ name, clues }) => {
        const row = document.createElement('div');
        row.className = 'clue-review-row';
        row.innerHTML = `<strong>${escHtml(name)}</strong>: ${clues.map(escHtml).join(' · ')}`;
        clueReview.appendChild(row);
      });
      clueReview.style.display = 'block';
    } else if (clueReview) {
      clueReview.style.display = 'none';
    }

    const grid = document.getElementById('voting-grid');
    grid.innerHTML = '';

    eligible.forEach(p => {
      const card = document.createElement('div');
      card.className = 'vote-card';
      card.dataset.id = p.id;
      if (p.id === myId)    card.classList.add('vote-card-me');
      if (!p.connected)      card.classList.add('vote-card-offline');

      card.innerHTML = `
        <div class="vote-avatar">${p.name[0].toUpperCase()}</div>
        <div class="vote-name">${escHtml(p.name)}${p.id === myId ? ' <em>(you)</em>' : ''}</div>
        <div class="vote-online-dot">${p.connected ? '🟢' : '🔴'}</div>
        <div class="vote-bar-wrap">
          <div class="vote-bar" id="vbar-${p.id}"></div>
        </div>
        <div class="vote-count-label" id="vcount-${p.id}">0 votes</div>
      `;

      if (p.id !== myId && !hasVoted) {
        card.addEventListener('click', () => castVote(p.id, eligible.length));
      }
      grid.appendChild(card);
    });

    UI.showScreen('voting');
  }

  function castVote(targetId, total) {
    if (hasVoted) return;
    hasVoted = true;

    // Mark all non-clickable
    document.querySelectorAll('.vote-card').forEach(c => {
      c.style.pointerEvents = 'none';
      c.classList.remove('vote-selected');
    });
    const sel = document.querySelector(`.vote-card[data-id="${targetId}"]`);
    if (sel) sel.classList.add('vote-selected');

    document.getElementById('voted-confirm').style.display = 'flex';
    GameSocket.emit('submit_vote', { targetId });
  }

  function updateProgress({ voteCount, total, counts, voters }) {
    document.getElementById('vote-progress').textContent = `${voteCount} / ${total} voted`;

    // Update vote bars and labels per candidate
    if (counts) {
      document.querySelectorAll('.vote-card').forEach(card => {
        const pid = card.dataset.id;
        const count = counts[pid] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;

        const bar = document.getElementById(`vbar-${pid}`);
        if (bar) bar.style.width = pct + '%';

        const label = document.getElementById(`vcount-${pid}`);
        if (label) label.textContent = count === 0 ? '' : `${count} vote${count !== 1 ? 's' : ''}`;
      });
    }

    // Mark who has voted (show a ✓ next to their name in player list if applicable)
    if (voters) {
      voters.forEach(vid => {
        const card = document.querySelector(`.vote-card[data-id="${vid}"]`);
        if (card && !card.querySelector('.voted-tick')) {
          const tick = document.createElement('span');
          tick.className = 'voted-tick';
          tick.textContent = ' ✓';
          const nameEl = card.querySelector('.vote-name');
          if (nameEl) nameEl.appendChild(tick);
        }
      });
    }
  }

  function showElimination({ eliminatedId, eliminatedName, wasImposter, voteCount, voteCounts }) {
    // Update all vote bars to final state
    if (voteCounts) {
      const total = _roomState ? _roomState.players.filter(p => !p.eliminated).length : 1;
      document.querySelectorAll('.vote-card').forEach(card => {
        const pid = card.dataset.id;
        const count = voteCounts[pid] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const bar = document.getElementById(`vbar-${pid}`);
        if (bar) bar.style.width = pct + '%';
        const label = document.getElementById(`vcount-${pid}`);
        if (label) label.textContent = count === 0 ? '' : `${count} vote${count !== 1 ? 's' : ''}`;
      });
    }

    const card = document.querySelector(`.vote-card[data-id="${eliminatedId}"]`);
    if (card) {
      card.classList.add(wasImposter ? 'vote-was-imposter' : 'vote-was-innocent');
      // Scroll to reveal
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      UI.toast(
        wasImposter
          ? `✅ ${eliminatedName} WAS the Imposter!`
          : `❌ ${eliminatedName} was innocent...`,
        wasImposter ? 'success' : 'error'
      );
    }, 500);
  }

  function showGameOver({ winner, reason, imposterName, word }) {
    document.getElementById('result-icon').textContent    = winner === 'crewmates' ? '🏆' : '😈';
    document.getElementById('result-title').textContent   = winner === 'crewmates' ? 'CREWMATES WIN!' : 'IMPOSTER WINS!';
    document.getElementById('result-reason').textContent  = reason;
    document.getElementById('imposter-reveal').textContent = imposterName || '???';
    document.getElementById('word-reveal').textContent    = word || '???';
    UI.showScreen('gameover');
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { showVoting, updateProgress, showElimination, showGameOver };
})();
