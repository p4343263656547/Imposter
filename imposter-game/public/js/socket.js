// socket.js — Socket.io connection + global event routing

window.GameSocket = (() => {
  let socket = null;

  function connect() {
    socket = io();
    window._socket = socket; // expose globally for other modules

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('connect_error', () => {
      UI.toast('Connection error — retrying...', 'error');
    });

    socket.on('error', ({ message }) => {
      UI.toast(message, 'error');
    });

    // Route events to handlers registered by other modules
    const events = [
      'joined', 'room_update', 'game_started', 'role_assigned',
      'turn_changed', 'clue_submitted', 'voting_started', 'vote_update',
      'player_eliminated', 'game_over', 'game_continued', 'round_update',
      'ai_message',
    ];

    events.forEach(ev => {
      socket.on(ev, (data) => {
        if (window._handlers && window._handlers[ev]) {
          window._handlers[ev](data);
        }
      });
    });

    return socket;
  }

  function on(event, handler) {
    if (!window._handlers) window._handlers = {};
    window._handlers[event] = handler;
  }

  function emit(event, data) {
    if (socket) socket.emit(event, data);
  }

  function getId() {
    return socket ? socket.id : null;
  }

  return { connect, on, emit, getId };
})();
