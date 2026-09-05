import { Request, Response, NextFunction } from 'express';
import { scheduleService } from './schedule.service';

export class ScheduleController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await scheduleService.createSchedule(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Working schedule created successfully',
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedules = await scheduleService.getAllSchedules();
      res.status(200).json({
        status: 'success',
        results: schedules.length,
        data: schedules
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await scheduleService.getScheduleById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await scheduleService.updateSchedule(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Working schedule updated successfully',
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await scheduleService.deleteSchedule(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Working schedule deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const scheduleController = new ScheduleController();
