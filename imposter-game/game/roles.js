// roles.js - Imposter assignment
function assignRoles(players) {
  const ids = players.map(p => p.id);
  const imposterIndex = Math.floor(Math.random() * ids.length);
  const imposterId = ids[imposterIndex];
  return { imposterId };
}
 
module.exports = { assignRoles };
 
