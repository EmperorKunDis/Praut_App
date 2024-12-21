// services/media/src/index.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Redis = require('redis');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Redis client for managing room state
const redisClient = Redis.createClient({
  url: process.env.REDIS_URI || 'redis://redis:6379'
});

// Initialize Redis connection
async function initializeRedis() {
  await redisClient.connect();
  console.log('Connected to Redis');
}

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Room management
const rooms = new Map();

class Room {
  constructor(id, creatorId) {
    this.id = id;
    this.creatorId = creatorId;
    this.participants = new Map();
    this.settings = {
      maxParticipants: 10,
      videoEnabled: true,
      audioEnabled: true
    };
  }

  addParticipant(userId, socketId) {
    if (this.participants.size >= this.settings.maxParticipants) {
      throw new Error('Room is full');
    }
    this.participants.set(userId, socketId);
  }

  removeParticipant(userId) {
    this.participants.delete(userId);
  }

  getParticipants() {
    return Array.from(this.participants.entries()).map(([userId, socketId]) => ({
      userId,
      socketId
    }));
  }
}

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.userId}`);

  // Create a new room
  socket.on('create-room', async (data) => {
    try {
      const roomId = uuidv4();
      const room = new Room(roomId, socket.user.userId);
      room.addParticipant(socket.user.userId, socket.id);
      rooms.set(roomId, room);

      // Store room data in Redis
      await redisClient.set(`room:${roomId}`, JSON.stringify({
        creatorId: socket.user.userId,
        settings: room.settings,
        created: new Date().toISOString()
      }));

      socket.join(roomId);
      socket.emit('room-created', {
        roomId,
        settings: room.settings
      });
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Join existing room
  socket.on('join-room', async ({ roomId }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      room.addParticipant(socket.user.userId, socket.id);
      socket.join(roomId);

      // Notify existing participants
      socket.to(roomId).emit('participant-joined', {
        userId: socket.user.userId,
        socketId: socket.id
      });

      // Send existing participants to new user
      socket.emit('room-joined', {
        roomId,
        participants: room.getParticipants(),
        settings: room.settings
      });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ userId, signal }) => {
    io.to(userId).emit('signal', {
      userId: socket.user.userId,
      signal
    });
  });

  // Toggle media settings
  socket.on('toggle-media', ({ roomId, type, enabled }) => {
    const room = rooms.get(roomId);
    if (room) {
      if (type === 'video') {
        room.settings.videoEnabled = enabled;
      } else if (type === 'audio') {
        room.settings.audioEnabled = enabled;
      }

      io.to(roomId).emit('media-settings-updated', {
        userId: socket.user.userId,
        settings: room.settings
      });
    }
  });

  // Leave room
  socket.on('leave-room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.removeParticipant(socket.user.userId);
      socket.leave(roomId);

      // Notify other participants
      io.to(roomId).emit('participant-left', {
        userId: socket.user.userId
      });

      // Clean up empty rooms
      if (room.participants.size === 0) {
        rooms.delete(roomId);
        redisClient.del(`room:${roomId}`);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.userId}`);
    // Clean up user from all rooms they're in
    rooms.forEach((room, roomId) => {
      if (room.participants.has(socket.user.userId)) {
        room.removeParticipant(socket.user.userId);
        io.to(roomId).emit('participant-left', {
          userId: socket.user.userId
        });

        if (room.participants.size === 0) {
          rooms.delete(roomId);
          redisClient.del(`room:${roomId}`);
        }
      }
    });
  });
});

// REST endpoints for room management
app.get('/api/rooms', async (req, res) => {
  try {
    const activeRooms = Array.from(rooms.values()).map(room => ({
      id: room.id,
      creatorId: room.creatorId,
      participantCount: room.participants.size,
      settings: room.settings
    }));
    
    res.json(activeRooms);
  } catch (error) {
    console.error('Error listing rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize service
console.log('Starting media service...');
initializeRedis()
  .then(() => {
    const port = process.env.PORT || 3005;
    httpServer.listen(port, () => {
      console.log(`Media service listening on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize service:', error);
    process.exit(1);
  });