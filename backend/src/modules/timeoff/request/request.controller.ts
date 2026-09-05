import { Request, Response, NextFunction } from 'express';
import { timeOffRequestService } from './request.service';

export class TimeOffRequestController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await timeOffRequestService.createRequest(req.body, req.user);
      res.status(201).json({
        status: 'success',
        message: 'Time off request submitted successfully',
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId, timeOffTypeId, status, startDate, endDate } = req.query;
      const requests = await timeOffRequestService.getAllRequests(
        {
          employeeId: typeof employeeId === 'string' ? employeeId : undefined,
          timeOffTypeId: typeof timeOffTypeId === 'string' ? timeOffTypeId : undefined,
          status: typeof status === 'string' ? status : undefined,
          startDate: typeof startDate === 'string' ? startDate : undefined,
          endDate: typeof endDate === 'string' ? endDate : undefined
        },
        req.user
      );
      res.status(200).json({
        status: 'success',
        results: requests.length,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await timeOffRequestService.getRequestById(
        req.params.id as string,
        req.user
      );
      res.status(200).json({
        status: 'success',
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await timeOffRequestService.approveRequest(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Time off request approved successfully',
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  async refuse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await timeOffRequestService.refuseRequest(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Time off request refused successfully',
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await timeOffRequestService.deleteRequest(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Time off request deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const timeOffRequestController = new TimeOffRequestController();
