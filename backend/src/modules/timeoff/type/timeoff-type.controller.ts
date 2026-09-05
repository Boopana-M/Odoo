import { Request, Response, NextFunction } from 'express';
import { timeOffTypeService } from './timeoff-type.service';

export class TimeOffTypeController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const typeDoc = await timeOffTypeService.createType(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Time off type created successfully',
        data: typeDoc
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await timeOffTypeService.getAllTypes();
      res.status(200).json({
        status: 'success',
        results: types.length,
        data: types
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const typeDoc = await timeOffTypeService.getTypeById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: typeDoc
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const typeDoc = await timeOffTypeService.updateType(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Time off type updated successfully',
        data: typeDoc
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await timeOffTypeService.deleteType(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Time off type deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const timeOffTypeController = new TimeOffTypeController();
