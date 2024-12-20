const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info({
    type: 'request',
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Intercept response to log its details
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    
    logger.info({
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      contentLength: Buffer.byteLength(body)
    });

    return originalSend.call(this, body);
  };

  next();
};

const errorLogger = (err, req, res, next) => {
  logger.error({
    type: 'error',
    method: req.method,
    path: req.path,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    }
  });

  next(err);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};
