import { Request, Response, NextFunction } from 'express';
import { salaryStructureService } from './structure.service';

export class SalaryStructureController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structure = await salaryStructureService.createStructure(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Salary structure created successfully',
        data: structure
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structures = await salaryStructureService.getAllStructures();
      res.status(200).json({
        status: 'success',
        results: structures.length,
        data: structures
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structure = await salaryStructureService.getStructureById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: structure
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structure = await salaryStructureService.updateStructure(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Salary structure updated successfully',
        data: structure
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await salaryStructureService.deleteStructure(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Salary structure deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const salaryStructureController = new SalaryStructureController();
