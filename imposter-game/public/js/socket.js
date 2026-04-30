// public/js/socket.js — Socket connection with session persistence & reconnect

window.GameSocket = (() => {
  let socket = null;
  const handlers = {};

  function connect() {
    socket = io();

    socket.on('connect', () => {
      console.log('🔌 Connected:', socket.id);
      // On reconnect (tab refresh / network drop), attempt to rejoin
      const sessionId = Storage.getSession();
      const roomId    = Storage.getRoomId();
      const name      = Storage.getName();
      if (sessionId && roomId && name) {
        socket.emit('join_room', { roomId, playerName: name, sessionId });
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
      'kicked', 'you_are_host',
    ];

    EVENTS.forEach(ev => socket.on(ev, data => {
      if (handlers[ev]) handlers[ev](data);
    }));
  }

  function on(event, handler) { handlers[event] = handler; }
  function emit(event, data)  { if (socket) socket.emit(event, data); }
  function getId()            { return socket ? socket.id : null; }

  return { connect, on, emit, getId };
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
