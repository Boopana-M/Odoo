import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }
      const user = await authService.getCurrentUser(req.user.userId);
      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
