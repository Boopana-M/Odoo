import { Request, Response, NextFunction } from 'express';
import { departmentService } from './department.service';

export class DepartmentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await departmentService.createDepartment(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Department created successfully',
        data: department
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await departmentService.getAllDepartments();
      res.status(200).json({
        status: 'success',
        results: departments.length,
        data: departments
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await departmentService.getDepartmentById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: department
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await departmentService.updateDepartment(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Department updated successfully',
        data: department
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await departmentService.deleteDepartment(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Department deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
