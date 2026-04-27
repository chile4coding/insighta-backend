
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function requireRole(requiredRole: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Role hierarchy: admin > analyst
    if (requiredRole === 'admin' && userRole !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Admin access required' });
  }
  next();
}

export function requireAnalystOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'analyst') {
    return res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
  }
  next();
}
