// server.js - Main Node.js + Socket.io server with Groq AI Moderator
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const path = require('path');

const { createRoom, getRoom, deleteRoom, addPlayer, removePlayer, getPublicState } = require('./game/rooms');
const { assignRoles } = require('./game/roles');
const { getRandomWord } = require("./game/words");
const { getNextTurn, getFirstTurn } = require('./game/turns');
const { tallyVotes } = require('./game/voting');
const { checkWin } = require('./game/win');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Groq AI Client
const groq = new Groq({ apiKey: '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' });

app.use(express.static(path.join(__dirname, 'public')));

// Serve game room via query param
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Groq AI Moderator ──────────────────────────────────────────────────────
async function getAIModeratorMessage(context, event) {
  const systemPrompt = `You are NEXUS, the AI moderator of an online social deduction game called "Imposter".
You are dramatic, witty, and slightly menacing. Keep messages SHORT (1-2 sentences max).
Speak with flair. Use emojis sparingly but effectively.
The game involves players giving word clues while one secret Imposter tries to blend in.`;

  const prompts = {
    playerJoin: `Player "${context.playerName}" just joined the room. Welcome them dramatically.`,
    playerLeave: `Player "${context.playerName}" disconnected. Comment on their absence.`,
    gameStart: `The game is starting with ${context.playerCount} players. The secret word category is "${context.hint}". Announce the game dramatically.`,
    turnStart: `It's ${context.playerName}'s turn to give a clue. Hype them up with pressure.`,
    playerSkipped: `${context.playerName} is offline and being skipped. Make a brief comment.`,
    clueGiven: `${context.playerName} gave the clue: "${context.clue}". React briefly and mysteriously.`,
    votingStart: `Voting phase has begun. Tell players to vote wisely. Be ominous.`,
    elimination: `${context.playerName} was eliminated with ${context.votes} votes. ${context.wasImposter ? 'They WERE the Imposter!' : 'They were NOT the Imposter...'} React dramatically.`,
    crewmatesWin: `The Crewmates win! The Imposter was ${context.imposterName}. Announce the victory!`,
    imposterWin: `The Imposter wins! ${context.imposterName} fooled everyone! Announce their dark victory!`,
    tieVote: `There was a tie in votes! Announce the tiebreak result involving ${context.playerName}.`,
    roundEnd: `Round ${context.round} is complete. Voting phase begins. Build suspense.`,
  };

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompts[event] || `Say something about: ${event}` }
      ],
      max_tokens: 80,
      temperature: 0.9,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq error:', err.message);
    return getFallbackMessage(event, context);
  }
}

function getFallbackMessage(event, ctx) {
  const fallbacks = {
    gameStart: `🎮 The game begins! ${ctx.playerCount} players, one secret Imposter...`,
    turnStart: `⏳ ${ctx.playerName}, your turn. Choose your clue wisely.`,
    clueGiven: `💬 "${ctx.clue}" — Interesting...`,
    votingStart: `🗳️ Time to vote! Who is the Imposter among you?`,
    elimination: `⚡ ${ctx.playerName} has been eliminated! ${ctx.wasImposter ? '✅ They WERE the Imposter!' : '❌ They were innocent...'}`,
    crewmatesWin: `🏆 Crewmates WIN! The Imposter was ${ctx.imposterName}!`,
    imposterWin: `😈 Imposter WINS! ${ctx.imposterName} fooled you all!`,
    playerJoin: `👋 ${ctx.playerName} has entered the room.`,
    playerLeave: `💨 ${ctx.playerName} has vanished.`,
  };
  return fallbacks[event] || '...';
}

async function broadcastAI(roomId, event, context) {
  const message = await getAIModeratorMessage(context, event);
  io.to(roomId).emit('ai_message', { message, event });
  return message;
}

// ── Socket.io ──────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // Join or create room
  socket.on('join_room', ({ roomId, playerName }) => {
    let room = getRoom(roomId);
    if (!room) {
      room = createRoom(roomId);
    }

    if (room.state !== 'lobby') {
      socket.emit('error', { message: 'Game already in progress.' });
      return;
    }

    if (room.players.length >= 10) {
      socket.emit('error', { message: 'Room is full (max 10 players).' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      connected: true,
      eliminated: false,
    };

    addPlayer(roomId, player);
    socket.join(roomId);
    socket.data = { roomId, playerName };

    socket.emit('joined', {
      playerId: socket.id,
      roomState: getPublicState(room),
      isHost: room.hostId === socket.id,
    });

    io.to(roomId).emit('room_update', getPublicState(room));

    broadcastAI(roomId, 'playerJoin', { playerName });
  });

  // Start game (host only)
  socket.on('start_game', async () => {
    const { roomId } = socket.data || {};
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 3) {
      socket.emit('error', { message: 'Need at least 3 players to start.' });
      return;
    }

    const wordPack = getRandomWord();
    const { imposterId } = assignRoles(room.players);
    const firstTurn = getFirstTurn(room.players);

    room.word = wordPack.word;
    room.hint = wordPack.hint;
    room.imposterId = imposterId;
    room.currentTurnId = firstTurn;
    room.state = 'playing';
    room.clues = [];
    room.round = 1;
    room.votes = {};

    // Send roles privately
    room.players.forEach(p => {
      io.to(p.id).emit('role_assigned', {
        role: p.id === imposterId ? 'imposter' : 'crewmate',
        word: p.id === imposterId ? null : wordPack.word,
        hint: wordPack.hint,
      });
    });

    io.to(roomId).emit('game_started', {
      roomState: getPublicState(room),
      currentTurnId: firstTurn,
    });

    await broadcastAI(roomId, 'gameStart', {
      playerCount: room.players.length,
      hint: wordPack.hint,
    });

    const currentPlayer = room.players.find(p => p.id === firstTurn);
    await broadcastAI(roomId, 'turnStart', { playerName: currentPlayer?.name });
  });

  // Submit clue
  socket.on('submit_clue', async ({ clue }) => {
    const { roomId } = socket.data || {};
    const room = getRoom(roomId);
    if (!room || room.state !== 'playing') return;
    if (room.currentTurnId !== socket.id) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.eliminated) return;

    const clueEntry = {
      playerId: socket.id,
      playerName: player.name,
      clue: clue.trim().split(' ')[0], // Single word only
      round: room.round,
    };
    room.clues.push(clueEntry);

    io.to(roomId).emit('clue_submitted', { clueEntry, roomState: getPublicState(room) });
    await broadcastAI(roomId, 'clueGiven', { playerName: player.name, clue: clueEntry.clue });

    // Advance turn
    advanceTurn(room, roomId);
  });

  // Submit vote
  socket.on('submit_vote', async ({ targetId }) => {
    const { roomId } = socket.data || {};
    const room = getRoom(roomId);
    if (!room || room.state !== 'voting') return;

    const voter = room.players.find(p => p.id === socket.id);
    if (!voter || voter.eliminated) return;

    room.votes[socket.id] = targetId;

    const eligible = room.players.filter(p => !p.eliminated && p.connected);
    io.to(roomId).emit('vote_update', {
      voteCount: Object.keys(room.votes).length,
      total: eligible.length,
    });

    if (Object.keys(room.votes).length >= eligible.length) {
      await resolveVoting(room, roomId);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    const { roomId, playerName } = socket.data || {};
    if (!roomId) return;

    const room = getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.connected = false;
      io.to(roomId).emit('room_update', getPublicState(room));
      await broadcastAI(roomId, 'playerLeave', { playerName });

      // If it was their turn, skip
      if (room.state === 'playing' && room.currentTurnId === socket.id) {
        advanceTurn(room, roomId, true);
      }
    }

    if (room.players.every(p => !p.connected)) {
      setTimeout(() => {
        const r = getRoom(roomId);
        if (r && r.players.every(p => !p.connected)) deleteRoom(roomId);
      }, 60000);
    }
  });
});

// ── Game Helpers ──────────────────────────────────────────────────────────
async function advanceTurn(room, roomId, skipped = false) {
  const active = room.players.filter(p => p.connected && !p.eliminated);
  
  // Check if everyone in the current round has given a clue
  const roundClues = room.clues.filter(c => c.round === room.round);
  const activePlayers = room.players.filter(p => !p.eliminated);
  
  if (roundClues.length >= activePlayers.length) {
    // Round complete, go to voting
    if (room.round >= room.maxRounds) {
      room.state = 'voting';
      room.votes = {};
      io.to(roomId).emit('voting_started', { roomState: getPublicState(room) });
      await broadcastAI(roomId, 'votingStart', {});
      return;
    } else {
      room.round++;
      room.currentTurnId = getFirstTurn(room.players);
      io.to(roomId).emit('round_update', { round: room.round, roomState: getPublicState(room) });
      await broadcastAI(roomId, 'roundEnd', { round: room.round - 1 });
    }
  } else {
    const nextId = getNextTurn(room.players, room.currentTurnId);
    if (!nextId) return;
    room.currentTurnId = nextId;
  }

  io.to(roomId).emit('turn_changed', {
    currentTurnId: room.currentTurnId,
    roomState: getPublicState(room),
  });

  const nextPlayer = room.players.find(p => p.id === room.currentTurnId);
  if (nextPlayer) {
    if (skipped) {
      await broadcastAI(roomId, 'playerSkipped', { playerName: nextPlayer.name });
    }
    await broadcastAI(roomId, 'turnStart', { playerName: nextPlayer.name });
  }
}

async function resolveVoting(room, roomId) {
  const { eliminated, counts, tie } = tallyVotes(room.votes, room.players);
  
  const eliminatedPlayer = room.players.find(p => p.id === eliminated);
  if (eliminatedPlayer) eliminatedPlayer.eliminated = true;

  const wasImposter = eliminated === room.imposterId;

  io.to(roomId).emit('player_eliminated', {
    eliminatedId: eliminated,
    eliminatedName: eliminatedPlayer?.name,
    wasImposter,
    voteCount: counts[eliminated] || 0,
    roomState: getPublicState(room),
  });

  if (tie) await broadcastAI(roomId, 'tieVote', { playerName: eliminatedPlayer?.name });
  await broadcastAI(roomId, 'elimination', {
    playerName: eliminatedPlayer?.name,
    votes: counts[eliminated] || 0,
    wasImposter,
  });

  const winResult = checkWin(room.players, room.imposterId);
  if (winResult) {
    room.state = 'ended';
    const imposter = room.players.find(p => p.id === room.imposterId);
    io.to(roomId).emit('game_over', {
      winner: winResult.winner,
      reason: winResult.reason,
      imposterId: room.imposterId,
      imposterName: imposter?.name,
      word: room.word,
    });

    const aiEvent = winResult.winner === 'crewmates' ? 'crewmatesWin' : 'imposterWin';
    await broadcastAI(roomId, aiEvent, { imposterName: imposter?.name });
    return;
  }

  // Continue game
  room.state = 'playing';
  room.votes = {};
  room.round = 1;
  room.clues = [];
  room.currentTurnId = getFirstTurn(room.players);

  io.to(roomId).emit('game_continued', {
    currentTurnId: room.currentTurnId,
    roomState: getPublicState(room),
  });

  const nextPlayer = room.players.find(p => p.id === room.currentTurnId);
  await broadcastAI(roomId, 'turnStart', { playerName: nextPlayer?.name });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Imposter Game running on http://localhost:${PORT}`);
});
