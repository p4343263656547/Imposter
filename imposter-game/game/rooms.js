// rooms.js - Room state management
const rooms = {};

function createRoom(roomId) {
  rooms[roomId] = {
    id: roomId,
    players: [],
    state: 'lobby', // lobby | playing | voting | ended
    word: null,
    hint: null,
    imposterId: null,
    currentTurnId: null,
    votes: {},
    clues: [],
    round: 0,
    maxRounds: 2,
    hostId: null,
  };
  return rooms[roomId];
}

function getRoom(roomId) {
  return rooms[roomId] || null;
}

function deleteRoom(roomId) {
  delete rooms[roomId];
}

function addPlayer(roomId, player) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.players.push(player);
  if (room.players.length === 1) room.hostId = player.id;
  return room;
}

function removePlayer(roomId, playerId) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.players = room.players.filter(p => p.id !== playerId);
  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
  }
  return room;
}

function getPublicState(room) {
  return {
    id: room.id,
    state: room.state,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      eliminated: p.eliminated,
    })),
    currentTurnId: room.currentTurnId,
    clues: room.clues,
    round: room.round,
    maxRounds: room.maxRounds,
    hostId: room.hostId,
  };
}

module.exports = { rooms, createRoom, getRoom, deleteRoom, addPlayer, removePlayer, getPublicState };
