// services/ai/src/index.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

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

// Generic webhook handler for n8n
async function triggerN8nWorkflow(webhookUrl, payload) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`N8n webhook failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering n8n workflow:', error);
    throw error;
  }
}

// Text analysis endpoint
app.post('/api/ai/analyze-text', authenticateToken, async (req, res) => {
  const { text, analysisType } = req.body;

  try {
    const result = await triggerN8nWorkflow(
      process.env.N8N_TEXT_ANALYSIS_WEBHOOK,
      {
        text,
        analysisType,
        userId: req.user.userId,
        companyId: req.user.companyId
      }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// Document processing endpoint
app.post('/api/ai/process-document', authenticateToken, async (req, res) => {
  const { documentUrl, processType } = req.body;

  try {
    const result = await triggerN8nWorkflow(
      process.env.N8N_DOCUMENT_PROCESSING_WEBHOOK,
      {
        documentUrl,
        processType,
        userId: req.user.userId,
        companyId: req.user.companyId
      }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Image analysis endpoint
app.post('/api/ai/analyze-image', authenticateToken, async (req, res) => {
  const { imageUrl, analysisType } = req.body;

  try {
    const result = await triggerN8nWorkflow(
      process.env.N8N_IMAGE_ANALYSIS_WEBHOOK,
      {
        imageUrl,
        analysisType,
        userId: req.user.userId,
        companyId: req.user.companyId
      }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Recommendation engine endpoint
app.post('/api/ai/get-recommendations', authenticateToken, async (req, res) => {
  const { context, type } = req.body;

  try {
    const result = await triggerN8nWorkflow(
      process.env.N8N_RECOMMENDATIONS_WEBHOOK,
      {
        context,
        type,
        userId: req.user.userId,
        companyId: req.user.companyId
      }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
const port = process.env.PORT || 3006;
app.listen(port, () => {
  console.log(`AI service listening on port ${port}`);
});