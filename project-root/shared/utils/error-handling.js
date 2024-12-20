class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleDatabaseError = (error) => {
  if (error.code === '23505') { // PostgreSQL unique violation
    return new AppError('Duplicate entry', 409, 'DUPLICATE_ENTRY');
  }
  if (error.code === '23503') { // Foreign key violation
    return new AppError('Referenced resource not found', 404, 'RESOURCE_NOT_FOUND');
  }
  return new AppError('Database error', 500, 'DATABASE_ERROR');
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production error response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        code: err.code,
        message: err.message
      });
    } else {
      // Programming or unknown errors
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong'
      });
    }
  }
};

module.exports = {
  AppError,
  handleDatabaseError,
  errorHandler
};
