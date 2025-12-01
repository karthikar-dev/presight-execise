import { Server } from 'socket.io';
import { setSocketIO } from './queueWorker.js';

export function setupWebSocketHandlers(io: Server) {
  // Pass io instance to queue worker
  setSocketIO(io);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
