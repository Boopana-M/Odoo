import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  async getPayrollDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await dashboardService.getFullDashboard(req.query);
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await dashboardService.getPayrollSummary(req.query);
      res.status(200).json({
        status: 'success',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  async getSalaryByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dashboardService.getSalaryByDepartment(req.query);
      res.status(200).json({
        status: 'success',
        results: result.length,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyNetSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dashboardService.getMonthlyNetSalaryTrends(req.query);
      res.status(200).json({
        status: 'success',
        results: result.length,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getHeadcount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const headcount = await dashboardService.getDepartmentHeadcount(req.query);
      res.status(200).json({
        status: 'success',
        data: headcount
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceTimeOff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await dashboardService.getAttendanceTimeOffOverview(req.query);
      res.status(200).json({
        status: 'success',
        data: overview
      });
    } catch (error) {
      next(error);
    }
  }

  async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await dashboardService.getPayrollAlerts(req.query);
      res.status(200).json({
        status: 'success',
        results: alerts.length,
        data: alerts
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
