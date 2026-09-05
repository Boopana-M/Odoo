import { Request, Response, NextFunction } from 'express';
import { salaryRuleService } from './rule.service';

export class SalaryRuleController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await salaryRuleService.createRule(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Salary rule created successfully',
        data: rule
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await salaryRuleService.getAllRules(req.query);
      res.status(200).json({
        status: 'success',
        results: rules.length,
        data: rules
      });
    } catch (error) {
      next(error);
    }
  }

  async getByStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structureId = req.params.structureId as string;
      const rules = await salaryRuleService.getRulesByStructure(structureId, req.query);
      res.status(200).json({
        status: 'success',
        results: rules.length,
        data: rules
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await salaryRuleService.getRuleById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: rule
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await salaryRuleService.updateRule(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Salary rule updated successfully',
        data: rule
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await salaryRuleService.deleteRule(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Salary rule deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const salaryRuleController = new SalaryRuleController();
