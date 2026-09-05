import { Request, Response, NextFunction } from 'express';
import { contractService } from './contract.service';

export class ContractController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contract = await contractService.createContract(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Contract created successfully',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId, status, departmentId } = req.query;
      const contracts = await contractService.getAllContracts({
        employeeId: typeof employeeId === 'string' ? employeeId : undefined,
        status: typeof status === 'string' ? status : undefined,
        departmentId: typeof departmentId === 'string' ? departmentId : undefined
      });
      res.status(200).json({
        status: 'success',
        results: contracts.length,
        data: contracts
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contract = await contractService.getContractById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  async getApplicable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId, periodStart, periodEnd } = req.query;
      if (!employeeId || !periodStart || !periodEnd) {
        res.status(400).json({
          status: 'error',
          message: 'employeeId, periodStart, and periodEnd query parameters are required'
        });
        return;
      }
      const contract = await contractService.findApplicableContract(
        employeeId as string,
        periodStart as string,
        periodEnd as string
      );
      if (!contract) {
        res.status(404).json({
          status: 'error',
          message: 'No active contract found covering the specified payroll period'
        });
        return;
      }
      res.status(200).json({
        status: 'success',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contract = await contractService.updateContract(req.params.id as string, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Contract updated successfully',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contractService.deleteContract(req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Contract deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const contractController = new ContractController();
