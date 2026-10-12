import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
  });

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {}).join(', ');
    return res.status(409).json({
      success: false,
      message: `Conflict: A record with that ${fields || 'unique property'} already exists.`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed on submitted data.',
      errors: details,
    });
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for resource identifier: ${err.value}`,
    });
  }

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal Server Error. Please contact system administrator.',
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
