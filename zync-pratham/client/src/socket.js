import { io } from 'socket.io-client';

// Connect dynamically to the backend on port 5000 using current hostname
const hostname = typeof window !== 'undefined' && window.location.hostname 
  ? window.location.hostname 
  : 'localhost';

const SERVER_URL = `http://${hostname}:5000`;

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log(`[Socket.io] Connected to server at ${SERVER_URL} (ID: ${socket.id})`);
});

socket.on('disconnect', (reason) => {
  console.log(`[Socket.io] Disconnected: ${reason}`);
});

socket.on('connect_error', (err) => {
  console.warn(`[Socket.io] Connection error:`, err.message);
});

export default socket;
