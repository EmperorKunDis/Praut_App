// services/project/src/index.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS whiteboards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_id INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        background_color VARCHAR(7) DEFAULT '#FFFFFF',
        canvas_width INTEGER DEFAULT 1920,
        canvas_height INTEGER DEFAULT 1080
      );

      CREATE TABLE IF NOT EXISTS whiteboard_elements (
        id SERIAL PRIMARY KEY,
        whiteboard_id INTEGER REFERENCES whiteboards(id),
        type VARCHAR(50) NOT NULL,
        properties JSONB NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS whiteboard_collaborators (
        whiteboard_id INTEGER REFERENCES whiteboards(id),
        user_id INTEGER NOT NULL,
        role VARCHAR(50) NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (whiteboard_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_elements_whiteboard ON whiteboard_elements(whiteboard_id);
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.userId}`);

  // Join whiteboard room
  socket.on('join-whiteboard', (whiteboardId) => {
    socket.join(`whiteboard:${whiteboardId}`);
    console.log(`User ${socket.user.userId} joined whiteboard ${whiteboardId}`);
  });

  // Handle drawing elements
  socket.on('draw-element', async (data) => {
    try {
      const { whiteboardId, type, properties } = data;
      
      // Save element to database
      const result = await pool.query(
        `INSERT INTO whiteboard_elements (whiteboard_id, type, properties, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [whiteboardId, type, properties, socket.user.userId]
      );

      // Broadcast to all users in the whiteboard
      io.to(`whiteboard:${whiteboardId}`).emit('element-drawn', {
        id: result.rows[0].id,
        type,
        properties,
        createdBy: socket.user.userId
      });
    } catch (error) {
      console.error('Error saving drawing element:', error);
      socket.emit('draw-error', { error: 'Failed to save element' });
    }
  });

  // Handle element updates
  socket.on('update-element', async (data) => {
    try {
      const { elementId, properties } = data;
      
      await pool.query(
        `UPDATE whiteboard_elements 
         SET properties = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [properties, elementId]
      );

      socket.broadcast.to(`whiteboard:${data.whiteboardId}`).emit('element-updated', {
        id: elementId,
        properties
      });
    } catch (error) {
      console.error('Error updating element:', error);
      socket.emit('update-error', { error: 'Failed to update element' });
    }
  });

  // Handle element deletions
  socket.on('delete-element', async (data) => {
    try {
      const { elementId, whiteboardId } = data;
      
      await pool.query(
        'DELETE FROM whiteboard_elements WHERE id = $1',
        [elementId]
      );

      io.to(`whiteboard:${whiteboardId}`).emit('element-deleted', {
        id: elementId
      });
    } catch (error) {
      console.error('Error deleting element:', error);
      socket.emit('delete-error', { error: 'Failed to delete element' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.userId}`);
  });
});

// REST endpoints for whiteboard management
app.post('/api/whiteboards', async (req, res) => {
  const { name, companyId } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO whiteboards (name, company_id, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, companyId, req.user.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/whiteboards/:id/elements', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM whiteboard_elements WHERE whiteboard_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching whiteboard elements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize database and start server
console.log('Starting whiteboard service...');
initializeDatabase()
  .then(() => {
    const port = process.env.PORT || 3003;
    httpServer.listen(port, () => {
      console.log(`Whiteboard service listening on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });