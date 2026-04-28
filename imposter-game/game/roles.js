// game/roles.js - Imposter assignment
function assignRoles(players) {
  const ids = players.map(p => p.id);
  const imposterId = ids[Math.floor(Math.random() * ids.length)];
  return { imposterId };
}

module.exports = { assignRoles };
