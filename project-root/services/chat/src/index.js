// services/chat/src/index.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Redis = require('redis');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Redis Client
const redisClient = Redis.createClient({
  url: process.env.REDIS_URI || 'redis://redis:6379'
});

// Message Schema
const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', MessageSchema);

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.userId}`);
  
  // Join user's personal room
  socket.join(socket.user.userId);

  // Handle private messages
  socket.on('private-message', async (data) => {
    try {
      const message = new Message({
        sender: socket.user.userId,
        receiver: data.to,
        content: data.content
      });

      await message.save();
      
      // Emit to receiver and sender
      io.to(data.to).emit('new-message', message);
      socket.emit('message-sent', message);
      
      // Store in Redis for faster retrieval
      await redisClient.set(
        `message:${message._id}`,
        JSON.stringify(message),
        'EX',
        86400 // 24 hours
      );
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Handle message read status
  socket.on('mark-read', async (messageId) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { read: true },
        { new: true }
      );
      
      if (message) {
        io.to(message.sender).emit('message-read', messageId);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.userId}`);
  });
});

// REST endpoints for message history
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.params.userId },
        { receiver: req.params.userId }
      ]
    }).sort({ timestamp: -1 }).limit(50);
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3001;
httpServer.listen(port, () => {
  console.log(`Chat service listening on port ${port}`);
});