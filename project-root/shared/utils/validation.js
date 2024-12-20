const validator = require('validator');
const { AppError } = require('./error-handling');

const validateEmail = (email) => {
  if (!validator.isEmail(email)) {
    throw new AppError('Invalid email address', 400, 'INVALID_EMAIL');
  }
  return email;
};

const validatePassword = (password) => {
  if (!validator.isLength(password, { min: 8 })) {
    throw new AppError('Password must be at least 8 characters long', 400, 'INVALID_PASSWORD');
  }
  
  if (!/\d/.test(password)) {
    throw new AppError('Password must contain at least one number', 400, 'INVALID_PASSWORD');
  }
  
  if (!/[A-Z]/.test(password)) {
    throw new AppError('Password must contain at least one uppercase letter', 400, 'INVALID_PASSWORD');
  }
  
  return password;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input);
  }
  return input;
};

const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }
    next();
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateRequestBody
};
