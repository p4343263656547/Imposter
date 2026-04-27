// win.js - Win condition logic
function checkWin(players, imposterId) {
  const active = players.filter(p => !p.eliminated);
  const imposterAlive = active.some(p => p.id === imposterId);
  const crewmates = active.filter(p => p.id !== imposterId);

  if (!imposterAlive) {
    return { winner: 'crewmates', reason: 'The Imposter was eliminated!' };
  }

  if (crewmates.length <= active.filter(p => p.id === imposterId).length) {
    return { winner: 'imposter', reason: 'The Imposter outnumbers the Crewmates!' };
  }

  if (crewmates.length === 0) {
    return { winner: 'imposter', reason: 'All Crewmates have been eliminated!' };
  }

  return null;
}

module.exports = { checkWin };
