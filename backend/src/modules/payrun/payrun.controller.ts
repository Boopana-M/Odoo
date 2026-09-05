import { Request, Response, NextFunction } from 'express';
import { payrunService } from './payrun.service';
import { emailService } from '../../utils/emailService';

export class PayrunController {
  async getEligibleEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const salaryStructureId =
        (req.query.salaryStructureId as string) || (req.body.salaryStructureId as string);
      const periodStart =
        (req.query.periodStart as string) || (req.body.periodStart as string);
      const periodEnd =
        (req.query.periodEnd as string) || (req.body.periodEnd as string);

      const result = await payrunService.getEligibleEmployees(
        salaryStructureId,
        periodStart,
        periodEnd
      );

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payrun = await payrunService.createPayrun(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Payrun created successfully',
        data: payrun
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payruns = await payrunService.getAllPayruns();
      res.status(200).json({
        status: 'success',
        results: payruns.length,
        data: payruns
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payrun = await payrunService.getPayrunById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: payrun
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payrun = await payrunService.updatePayrun(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Payrun updated successfully',
        data: payrun
      });
    } catch (error) {
      next(error);
    }
  }

  async compute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payrun = await payrunService.computePayrun(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Payrun compute status updated',
        data: payrun
      });
    } catch (error) {
      next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payrun = await payrunService.validatePayrun(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Payrun validated successfully',
        data: payrun
      });
    } catch (error) {
      next(error);
    }
  }

  async markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payrun = await payrunService.markPaid(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Payrun marked as paid',
        data: payrun
      });
    } catch (error) {
      next(error);
    }
  }

  async sendPayslips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await emailService.sendPayrunBulkPayslips(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Bulk payslip email process completed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const payrunController = new PayrunController();
