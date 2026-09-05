import mongoose from 'mongoose';
import { CONTRACT_STATUSES, ContractStatus } from './contract.model';
import { Employee } from '../employees/employee.model';
import { Department } from '../departments/department.model';

export interface CreateContractInput {
  employeeId: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  departmentId: string;
  jobPosition: string;
  wage: number;
  salaryStructureId?: string | null;
  status?: string;
}

export interface UpdateContractInput {
  employeeId?: string;
  startDate?: string | Date;
  endDate?: string | Date | null;
  departmentId?: string;
  jobPosition?: string;
  wage?: number;
  salaryStructureId?: string | null;
  status?: string;
}

export const validateContractData = async (
  data: CreateContractInput | UpdateContractInput,
  isUpdate: boolean = false
): Promise<{
  employeeId?: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date | null;
  departmentId?: mongoose.Types.ObjectId;
  jobPosition?: string;
  wage?: number;
  salaryStructureId?: mongoose.Types.ObjectId | null;
  status?: ContractStatus;
}> => {
  const validated: any = {};

  if (!isUpdate || data.employeeId !== undefined) {
    if (!data.employeeId || !mongoose.Types.ObjectId.isValid(data.employeeId)) {
      const error: any = new Error('A valid employee ID is required');
      error.statusCode = 400;
      throw error;
    }
    const employeeExists = await Employee.findById(data.employeeId);
    if (!employeeExists) {
      const error: any = new Error('Referenced employee does not exist');
      error.statusCode = 400;
      throw error;
    }
    validated.employeeId = new mongoose.Types.ObjectId(data.employeeId);
  }

  if (!isUpdate || data.departmentId !== undefined) {
    if (!data.departmentId || !mongoose.Types.ObjectId.isValid(data.departmentId)) {
      const error: any = new Error('A valid department ID is required');
      error.statusCode = 400;
      throw error;
    }
    const departmentExists = await Department.findById(data.departmentId);
    if (!departmentExists) {
      const error: any = new Error('Referenced department does not exist');
      error.statusCode = 400;
      throw error;
    }
    validated.departmentId = new mongoose.Types.ObjectId(data.departmentId);
  }

  if (!isUpdate || data.jobPosition !== undefined) {
    if (!data.jobPosition || typeof data.jobPosition !== 'string' || !data.jobPosition.trim()) {
      const error: any = new Error('Job position is required');
      error.statusCode = 400;
      throw error;
    }
    validated.jobPosition = data.jobPosition.trim();
  }

  if (!isUpdate || data.wage !== undefined) {
    if (data.wage === undefined || data.wage === null || typeof data.wage !== 'number' || isNaN(data.wage) || data.wage < 0) {
      const error: any = new Error('Wage must be a valid non-negative number');
      error.statusCode = 400;
      throw error;
    }
    validated.wage = data.wage;
  }

  let parsedStartDate: Date | undefined;
  if (!isUpdate || data.startDate !== undefined) {
    if (!data.startDate) {
      const error: any = new Error('Start date is required');
      error.statusCode = 400;
      throw error;
    }
    parsedStartDate = new Date(data.startDate);
    if (isNaN(parsedStartDate.getTime())) {
      const error: any = new Error('Invalid start date format');
      error.statusCode = 400;
      throw error;
    }
    validated.startDate = parsedStartDate;
  }

  if (data.endDate !== undefined) {
    if (data.endDate === null || data.endDate === '') {
      validated.endDate = null;
    } else {
      const parsedEndDate = new Date(data.endDate);
      if (isNaN(parsedEndDate.getTime())) {
        const error: any = new Error('Invalid end date format');
        error.statusCode = 400;
        throw error;
      }
      const refStartDate = parsedStartDate || (data.startDate ? new Date(data.startDate) : undefined);
      if (refStartDate && parsedEndDate < refStartDate) {
        const error: any = new Error('End date cannot be before start date');
        error.statusCode = 400;
        throw error;
      }
      validated.endDate = parsedEndDate;
    }
  }

  if (data.salaryStructureId !== undefined) {
    if (data.salaryStructureId === null || data.salaryStructureId === '') {
      validated.salaryStructureId = null;
    } else {
      if (!mongoose.Types.ObjectId.isValid(data.salaryStructureId)) {
        const error: any = new Error('Invalid salary structure ID format');
        error.statusCode = 400;
        throw error;
      }
      validated.salaryStructureId = new mongoose.Types.ObjectId(data.salaryStructureId);
    }
  }

  if (data.status !== undefined) {
    const formattedStatus = CONTRACT_STATUSES.find(
      s => s.toLowerCase() === data.status?.trim().toLowerCase()
    );
    if (!formattedStatus) {
      const error: any = new Error(
        `Invalid contract status '${data.status}'. Allowed statuses: ${CONTRACT_STATUSES.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    validated.status = formattedStatus;
  } else if (!isUpdate) {
    validated.status = 'Active';
  }

  return validated;
};
