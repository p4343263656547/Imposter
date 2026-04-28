// public/js/socket.js — Socket.io connection + event bus

window.GameSocket = (() => {
  let socket = null;
  const handlers = {};

  function connect() {
    socket = io();

    socket.on('connect', () => console.log('🔌 Connected:', socket.id));
    socket.on('connect_error', () => UI.toast('Connection error — retrying...', 'error'));
    socket.on('error', ({ message }) => UI.toast(message, 'error'));

    const EVENTS = [
      'joined', 'room_update', 'game_started', 'role_assigned',
      'turn_changed', 'clue_submitted', 'round_update',
      'voting_started', 'vote_update', 'player_eliminated',
      'game_over', 'game_continued', 'ai_message',
    ];

    EVENTS.forEach(ev => socket.on(ev, data => {
      if (handlers[ev]) handlers[ev](data);
    }));
  }

  function on(event, handler) { handlers[event] = handler; }
  function emit(event, data) { if (socket) socket.emit(event, data); }
  function getId() { return socket ? socket.id : null; }

  return { connect, on, emit, getId };
})();
