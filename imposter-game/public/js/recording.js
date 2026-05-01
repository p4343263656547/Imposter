// public/js/recording.js
let recorder;
let isRecording = false;

// Initialize recording when cookies are accepted
function initRecording() {
  // Find the game canvas
  const canvas = document.querySelector('canvas') || document.getElementById('game-canvas');
  
  if (!canvas) {
    console.error('Game canvas not found');
    return;
  }
  
  // Initialize the recorder (ensure the library is loaded in index.html)
  recorder = new CanvasRecorder(canvas, {
    audio: true,
    video: true,
    fps: 30
  });
  
  recorder.start();
  isRecording = true;
  
  // Send chunks to your server
  recorder.ondata = (chunk) => {
    sendToServer(chunk);
  };
  
  // Get location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now()
      };
      
      // Send location to your server
      fetch('/api/saveLocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(locationData)
      });
    });
  }
}

// Function to send data to your server
function sendToServer(data) {
  fetch('/api/saveRecording', {
    method: 'POST',
    body: data
  });
}

// Function to stop recording
function stopRecording() {
  if (recorder && isRecording) {
    recorder.stop();
    isRecording = false;
  }
}

// Export functions to use in other modules
window.RecordingModule = {
  initRecording,
  stopRecording
};
