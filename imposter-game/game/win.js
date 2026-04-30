// game/win.js - Win condition logic
function checkWin(players, imposterId) {
  const active = players.filter(p => !p.eliminated);
  const imposterAlive = active.some(p => p.id === imposterId);
  const crewmates = active.filter(p => p.id !== imposterId);

  if (!imposterAlive) {
    return { winner: 'crewmates', reason: 'The Imposter was eliminated!' };
  }

  if (crewmates.length <= 1) {
    return { winner: 'imposter', reason: 'The Imposter outnumbers the Crewmates!' };
  }

  return null;
}

module.exports = { checkWin };
