
import { rateLimit, Options } from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { status: 'error', message: 'Too many requests from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req) => {
    // Use user ID if authenticated, else fallback to IP
    return (req as any).user?.userId || req.ip || 'unknown';
  },
  message: { status: 'error', message: 'Rate limit exceeded, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});
