const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database connection test
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Database initialization
async function initializeDatabase() {
  let retries = 5;
  while (retries) {
    try {
      const client = await pool.connect();
      try {
        console.log('Creating users table if not exists...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            company_id INTEGER,
            role VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('Database initialized successfully');
        client.release();
        break;
      } catch (err) {
        client.release();
        throw err;
      }
    } catch (err) {
      console.error('Database initialization attempt failed:', err);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  if (retries === 0) {
    console.error('Max retries reached. Could not connect to database');
    process.exit(1);
  }
}

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// User registration endpoint
app.post('/api/users', async (req, res) => {
  const { email, password, fullName, companyId, role } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, company_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role',
      [email, hashedPassword, fullName, companyId, role]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize database and start server
console.log('Starting user service...');
initializeDatabase()
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`User service listening on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });