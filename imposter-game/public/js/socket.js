// public/js/socket.js — Socket connection with session persistence & reconnect

window.GameSocket = (() => {
  let socket = null;
  const handlers = {};

  function connect() {
    socket = io();

    socket.on('connect', () => {
      console.log('🔌 Connected:', socket.id);
      // On reconnect (tab refresh / network drop), attempt to rejoin
      // BUT only if the current URL already has a ?room= param.
      // This prevents a fresh link (no room code) from silently hijacking
      // the player's old session and getting stuck in "Waiting for host...".
      const urlRoomId = new URLSearchParams(window.location.search).get('room');
      const sessionId = Storage.getSession();
      const roomId    = Storage.getRoomId();
      const name      = Storage.getName();
      if (sessionId && roomId && name && urlRoomId) {
        // Only reconnect if the URL room matches the stored room
        if (urlRoomId === roomId) {
          socket.emit('join_room', { roomId, playerName: name, sessionId });
        } else {
          // Different room in URL — clear old session so we join fresh
          Storage.clear();
        }
      }
    });

    socket.on('connect_error', () => UI.toast('Connection error — retrying...', 'error'));
    socket.on('error', ({ message }) => UI.toast(message, 'error'));

    const EVENTS = [
      'joined', 'reconnected', 'room_update', 'game_started', 'role_assigned',
      'turn_changed', 'clue_submitted', 'round_update',
      'voting_started', 'vote_update', 'player_eliminated',
      'game_over', 'game_continued', 'ai_message',
      'player_typing', 'inactivity_warning', 'player_inactivity_eliminated',
      'kicked', 'you_are_host', 'session_not_found',
      'player_chat', 'player_reaction',
    ];

    // If the server says our session is stale (room was deleted), clear local
    // data and show the entry screen so the player can start fresh.
    socket.on('session_not_found', () => {
      console.log('Session stale — clearing and showing entry screen.');
      Storage.clear();
      // Clear the URL ?room= param so a fresh join doesn't re-trigger reconnect
      const url = new URL(window.location);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url);
      UI.toast('Your previous session expired. Please join again.', 'warn');
      UI.showScreen('entry');
    });

    EVENTS.forEach(ev => socket.on(ev, data => {
      if (handlers[ev]) handlers[ev](data);
    }));
  }

  function on(event, handler) { handlers[event] = handler; }
  function emit(event, data)  { if (socket) socket.emit(event, data); }
  function getId()            { return socket ? socket.id : null; }

  function getSocket()        { return socket; }
  return { connect, on, emit, getId, getSocket };
})();

// ── Local storage helper ──────────────────────────────────────────────────────
window.Storage = (() => {
  const K = { session: 'imposter_session', room: 'imposter_room', name: 'imposter_name' };
  const save = (key, val) => { try { localStorage.setItem(key, val); } catch(e){} };
  const load = (key) => { try { return localStorage.getItem(key); } catch(e){ return null; } };
  const clear = () => Object.values(K).forEach(k => { try { localStorage.removeItem(k); } catch(e){} });

  return {
    saveSession: (id) => save(K.session, id),
    saveRoomId:  (id) => save(K.room, id),
    saveName:    (n)  => save(K.name, n),
    getSession:  ()   => load(K.session),
    getRoomId:   ()   => load(K.room),
    getName:     ()   => load(K.name),
    clear,
  };
})();
