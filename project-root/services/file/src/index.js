// services/file/src/index.js
const express = require('express');
const { Pool } = require('pg');
const Minio = require('minio');
const multer = require('multer');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configure MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(127) NOT NULL,
        size BIGINT NOT NULL,
        bucket VARCHAR(63) NOT NULL,
        company_id INTEGER NOT NULL,
        uploaded_by INTEGER NOT NULL,
        public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS file_permissions (
        file_id INTEGER REFERENCES files(id),
        user_id INTEGER NOT NULL,
        permission VARCHAR(10) NOT NULL,
        granted_by INTEGER NOT NULL,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (file_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_files_company ON files(company_id);
      CREATE INDEX IF NOT EXISTS idx_files_user ON files(uploaded_by);
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

// Initialize MinIO buckets
async function initializeBuckets() {
  const defaultBuckets = ['public', 'private'];
  
  for (const bucket of defaultBuckets) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        console.log(`Created bucket: ${bucket}`);
      }
    } catch (error) {
      console.error(`Error creating bucket ${bucket}:`, error);
      throw error;
    }
  }
}

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

// File upload endpoint
app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const { companyId } = req.body;
  const file = req.file;
  const fileExtension = path.extname(file.originalname);
  const filename = `${uuidv4()}${fileExtension}`;
  const bucket = 'private';

  try {
    // Upload to MinIO
    await minioClient.putObject(
      bucket,
      filename,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    // Save file metadata to database
    const result = await pool.query(
      `INSERT INTO files 
       (filename, original_name, mime_type, size, bucket, company_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [filename, file.originalname, file.mimetype, file.size, bucket, companyId, req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// File download endpoint
app.get('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    // Get file metadata
    const fileResult = await pool.query(
      'SELECT * FROM files WHERE id = $1',
      [req.params.fileId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = fileResult.rows[0];

    // Check permissions
    const permissionResult = await pool.query(
      `SELECT permission FROM file_permissions 
       WHERE file_id = $1 AND user_id = $2`,
      [file.id, req.user.userId]
    );

    if (!file.public && permissionResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate presigned URL for download
    const presignedUrl = await minioClient.presignedGetObject(
      file.bucket,
      file.filename,
      60 * 60 // URL expires in 1 hour
    );

    res.json({ url: presignedUrl });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// List files endpoint
app.get('/api/files', authenticateToken, async (req, res) => {
  const { companyId } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT f.*, ARRAY_AGG(fp.permission) as permissions
       FROM files f
       LEFT JOIN file_permissions fp ON f.id = fp.file_id AND fp.user_id = $1
       WHERE f.company_id = $2 AND (f.public = true OR fp.user_id IS NOT NULL)
       GROUP BY f.id
       ORDER BY f.created_at DESC`,
      [req.user.userId, companyId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Share file endpoint
app.post('/api/files/:fileId/share', authenticateToken, async (req, res) => {
  const { userId, permission } = req.body;
  const { fileId } = req.params;

  try {
    // Verify file ownership or admin rights
    const fileCheck = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND uploaded_by = $2',
      [fileId, req.user.userId]
    );

    if (fileCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to share this file' });
    }

    // Grant permission
    const result = await pool.query(
      `INSERT INTO file_permissions (file_id, user_id, permission, granted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (file_id, user_id) DO UPDATE
       SET permission = $3, granted_by = $4
       RETURNING *`,
      [fileId, userId, permission, req.user.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ error: 'Failed to share file' });
  }
});

// Delete file endpoint
app.delete('/api/files/:fileId', authenticateToken, async (req, res) => {
  const { fileId } = req.params;

  try {
    // Get file metadata
    const fileResult = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND uploaded_by = $2',
      [fileId, req.user.userId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    const file = fileResult.rows[0];

    // Delete from MinIO
    await minioClient.removeObject(file.bucket, file.filename);

    // Delete from database
    await pool.query('DELETE FROM files WHERE id = $1', [fileId]);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize service
console.log('Starting file service...');
Promise.all([initializeDatabase(), initializeBuckets()])
  .then(() => {
    const port = process.env.PORT || 3004;
    app.listen(port, () => {
      console.log(`File service listening on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize service:', error);
    process.exit(1);
  });