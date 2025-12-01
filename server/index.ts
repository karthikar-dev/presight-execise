import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import usersRouter from './routes/users.js';
import streamRouter from './routes/stream.js';
import queueRouter from './routes/queue.js';
import { setupWebSocketHandlers } from './services/websocket.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', usersRouter);
app.use('/api/stream', streamRouter);
app.use('/api/queue', queueRouter);

// WebSocket setup
setupWebSocketHandlers(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
