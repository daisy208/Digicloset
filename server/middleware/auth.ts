import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    brandId?: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Verify user still exists and is active
    const result = await pool.query(
      'SELECT id, email, role, brand_id, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      brandId: result.rows[0].brand_id
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireBrandAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const brandId = req.params.brandId || req.body.brandId;
  
  if (!brandId) {
    return res.status(400).json({ error: 'Brand ID required' });
  }

  if (req.user?.role === 'admin') {
    return next(); // Admins have access to all brands
  }

  if (req.user?.brandId !== brandId) {
    return res.status(403).json({ error: 'Access denied to this brand' });
  }

  next();
};