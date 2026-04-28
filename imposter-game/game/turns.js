// turns.js - Turn management
function getNextTurn(players, currentTurnId) {
  const active = players.filter(p => p.connected && !p.eliminated);
  if (active.length === 0) return null;
  const currentIndex = active.findIndex(p => p.id === currentTurnId);
  const nextIndex = (currentIndex + 1) % active.length;
  return active[nextIndex].id;
}

function getFirstTurn(players) {
  const active = players.filter(p => p.connected && !p.eliminated);
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)].id;
}

module.exports = { getNextTurn, getFirstTurn };
