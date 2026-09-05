import { Request, Response, NextFunction } from 'express';
import { timeOffAllocationService } from './timeoff-allocation.service';

export class TimeOffAllocationController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allocation = await timeOffAllocationService.createAllocation(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Time off allocation created successfully',
        data: allocation
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId, timeOffTypeId, approvalStatus } = req.query;
      const allocations = await timeOffAllocationService.getAllAllocations({
        employeeId: typeof employeeId === 'string' ? employeeId : undefined,
        timeOffTypeId: typeof timeOffTypeId === 'string' ? timeOffTypeId : undefined,
        approvalStatus: typeof approvalStatus === 'string' ? approvalStatus : undefined
      });
      res.status(200).json({
        status: 'success',
        results: allocations.length,
        data: allocations
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allocation = await timeOffAllocationService.getAllocationById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: allocation
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId, timeOffTypeId, date } = req.query;
      if (!employeeId || !timeOffTypeId) {
        res.status(400).json({
          status: 'error',
          message: 'employeeId and timeOffTypeId query parameters are required'
        });
        return;
      }
      const result = await timeOffAllocationService.getAvailableAllocation(
        employeeId as string,
        timeOffTypeId as string,
        typeof date === 'string' ? date : undefined
      );
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allocation = await timeOffAllocationService.updateAllocation(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Time off allocation updated successfully',
        data: allocation
      });
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allocation = await timeOffAllocationService.approveAllocation(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Time off allocation approved successfully',
        data: allocation
      });
    } catch (error) {
      next(error);
    }
  }
}

export const timeOffAllocationController = new TimeOffAllocationController();
