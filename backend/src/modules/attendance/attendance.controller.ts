import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service';

export class AttendanceController {
  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'Employee') {
        res.status(403).json({
          status: 'error',
          message: 'Only employees can perform self-service check-in.'
        });
        return;
      }

      const attendance = await attendanceService.checkIn(req.user);
      res.status(201).json({
        status: 'success',
        message: 'Checked in successfully',
        data: attendance
      });
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'Employee') {
        res.status(403).json({
          status: 'error',
          message: 'Only employees can perform self-service check-out.'
        });
        return;
      }

      const attendance = await attendanceService.checkOut(req.user);
      res.status(200).json({
        status: 'success',
        message: 'Checked out successfully',
        data: attendance
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendance = await attendanceService.createAttendance(req.body, req.user);
      res.status(201).json({
        status: 'success',
        message: 'Attendance record created successfully',
        data: attendance
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId, startDate, endDate, status } = req.query;
      const attendances = await attendanceService.getAllAttendances(
        {
          employeeId: typeof employeeId === 'string' ? employeeId : undefined,
          startDate: typeof startDate === 'string' ? startDate : undefined,
          endDate: typeof endDate === 'string' ? endDate : undefined,
          status: typeof status === 'string' ? status : undefined
        },
        req.user
      );
      res.status(200).json({
        status: 'success',
        results: attendances.length,
        data: attendances
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendance = await attendanceService.getAttendanceById(req.params.id as string, req.user);
      res.status(200).json({
        status: 'success',
        data: attendance
      });
    } catch (error) {
      next(error);
    }
  }

  async getByEmployeeId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendances = await attendanceService.getAttendanceByEmployeeId(
        req.params.employeeId as string,
        req.user
      );
      res.status(200).json({
        status: 'success',
        results: attendances.length,
        data: attendances
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendance = await attendanceService.updateAttendance(
        req.params.id as string,
        req.body,
        req.user
      );
      res.status(200).json({
        status: 'success',
        message: 'Attendance record updated successfully',
        data: attendance
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await attendanceService.deleteAttendance(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Attendance record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
