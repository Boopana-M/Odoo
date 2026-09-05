import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';

export class UserController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        status: 'success',
        results: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateUser(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteUser(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
