import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../modules/users/user.model';
import { AuthUserPayload } from '../types/express';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication token required'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({
      status: 'error',
      message: 'JWT_SECRET environment variable is not configured'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Access forbidden: Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const verifyEmployeeOwnership = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
      return;
    }

    if (req.user.role !== 'Employee') {
      return next();
    }

    const targetEmployeeId = req.params[paramName];
    if (!req.user.employeeId || req.user.employeeId.toString() !== targetEmployeeId) {
      res.status(403).json({
        status: 'error',
        message: 'Access forbidden: You can only access your own employee information'
      });
      return;
    }

    next();
  };
};
