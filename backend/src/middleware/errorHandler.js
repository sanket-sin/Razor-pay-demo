import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.statusCode || 500;
  const body = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    },
  };
  if (err.details) body.error.details = err.details;
  if (config.env === 'development' && err.stack) {
    body.error.stack = err.stack;
  }

  if (!(err instanceof AppError) && status === 500) {
    console.error(err);
  }

  res.status(status).json(body);
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.path}`, code: 'NOT_FOUND' },
  });
}
