// services/company/src/index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        industry VARCHAR(100),
        size VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        manager_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

// Validation middleware for company creation/updates
const validateCompany = [
  body('name').notEmpty().trim().isLength({ min: 2, max: 255 }),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('size').optional().isIn(['small', 'medium', 'large', 'enterprise']),
  body('description').optional().trim()
];

// Company endpoints
app.post('/api/companies', authenticateToken, validateCompany, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, industry, size } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO companies (name, description, industry, size) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, industry, size]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM companies WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/companies/:id', authenticateToken, validateCompany, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, industry, size } = req.body;

  try {
    const result = await pool.query(
      `UPDATE companies 
       SET name = $1, description = $2, industry = $3, size = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [name, description, industry, size, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Department endpoints
app.post('/api/companies/:companyId/departments', authenticateToken, async (req, res) => {
  const { name, description, managerId } = req.body;
  const { companyId } = req.params;

  try {
    const result = await pool.query(
      'INSERT INTO departments (company_id, name, description, manager_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [companyId, name, description, managerId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/companies/:companyId/departments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM departments WHERE company_id = $1',
      [req.params.companyId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize database and start server
console.log('Starting company service...');
initializeDatabase()
  .then(() => {
    const port = process.env.PORT || 3002;
    app.listen(port, () => {
      console.log(`Company service listening on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });