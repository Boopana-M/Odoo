import { Request, Response, NextFunction } from 'express';
import { payslipService } from './payslip.service';
import { validateCalculatePayslipInput } from './payslip.validation';

export class PayslipController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payslips = await payslipService.getAllPayslips(req.query, req.user);
      res.status(200).json({
        status: 'success',
        results: payslips.length,
        data: payslips
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payslip = await payslipService.getPayslipById(req.params.id as string, req.user);
      res.status(200).json({
        status: 'success',
        data: payslip
      });
    } catch (error) {
      next(error);
    }
  }

  async getByPayrun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payslips = await payslipService.getPayslipsByPayrunId(
        req.params.payrunId as string,
        req.user
      );
      res.status(200).json({
        status: 'success',
        results: payslips.length,
        data: payslips
      });
    } catch (error) {
      next(error);
    }
  }

  async getByEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.params.employeeId as string;
      const payslips = await payslipService.getAllPayslips({ employeeId }, req.user);
      res.status(200).json({
        status: 'success',
        results: payslips.length,
        data: payslips
      });
    } catch (error) {
      next(error);
    }
  }

  async calculate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = validateCalculatePayslipInput(req.body);
      const payslip = await payslipService.calculatePayslip(
        validated.employeeId,
        {
          _id: validated.payrunId,
          salaryStructureId: validated.salaryStructureId,
          periodStart: validated.periodStart,
          periodEnd: validated.periodEnd
        },
        { persist: false }
      );
      res.status(200).json({
        status: 'success',
        message: 'Payslip preview calculated successfully',
        data: payslip
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payslip = await payslipService.updatePayslip(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Payslip updated successfully',
        data: payslip
      });
    } catch (error) {
      next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payslip = await payslipService.updatePayslip(req.params.id as string, {
        status: 'Validated'
      });
      res.status(200).json({
        status: 'success',
        message: 'Payslip validated successfully',
        data: payslip
      });
    } catch (error) {
      next(error);
    }
  }

  async markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payslip = await payslipService.updatePayslip(req.params.id as string, {
        status: 'Paid'
      });
      res.status(200).json({
        status: 'success',
        message: 'Payslip marked as paid',
        data: payslip
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await payslipService.deletePayslip(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Payslip deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const payslipController = new PayslipController();
