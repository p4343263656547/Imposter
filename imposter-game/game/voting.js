// game/voting.js - Vote tallying logic
function tallyVotes(votes, players) {
  const counts = {};
  for (const voterId in votes) {
    const target = votes[voterId];
    if (target) counts[target] = (counts[target] || 0) + 1;
  }

  let maxVotes = 0;
  let eliminated = null;
  let tie = false;

  for (const playerId in counts) {
    if (counts[playerId] > maxVotes) {
      maxVotes = counts[playerId];
      eliminated = playerId;
      tie = false;
    } else if (counts[playerId] === maxVotes) {
      tie = true;
    }
  }

  // Random tiebreak among tied players
  if (tie) {
    const tied = Object.keys(counts).filter(id => counts[id] === maxVotes);
    eliminated = tied[Math.floor(Math.random() * tied.length)];
  }

  // Edge case: nobody voted
  if (!eliminated) {
    const eligible = players.filter(p => !p.eliminated);
    if (eligible.length > 0) {
      eliminated = eligible[Math.floor(Math.random() * eligible.length)].id;
    }
  }

  return { eliminated, counts, tie };
}

module.exports = { tallyVotes };
