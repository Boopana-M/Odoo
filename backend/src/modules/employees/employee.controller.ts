import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service';

export class EmployeeController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, employeeType, status, search } = req.query;
      const employees = await employeeService.getAllEmployees({
        departmentId: typeof departmentId === 'string' ? departmentId : undefined,
        employeeType: typeof employeeType === 'string' ? employeeType : undefined,
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined
      });
      res.status(200).json({
        status: 'success',
        results: employees.length,
        data: employees
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.updateEmployee(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await employeeService.deleteEmployee(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const employeeController = new EmployeeController();
