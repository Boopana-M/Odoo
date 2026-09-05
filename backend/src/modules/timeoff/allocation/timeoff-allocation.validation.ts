import mongoose from 'mongoose';
import { ALLOCATION_APPROVAL_STATUSES, AllocationApprovalStatus } from './timeoff-allocation.model';
import { Employee } from '../../employees/employee.model';
import { TimeOffType } from '../type/timeoff-type.model';

export interface CreateAllocationDTO {
  employeeId: string;
  timeOffTypeId: string;
  allocatedAmount: number;
  takenAmount?: number;
  validFrom: string | Date;
  validTo: string | Date;
  approvalStatus?: string;
}

export interface UpdateAllocationDTO {
  employeeId?: string;
  timeOffTypeId?: string;
  allocatedAmount?: number;
  takenAmount?: number;
  validFrom?: string | Date;
  validTo?: string | Date;
  approvalStatus?: string;
}

export async function validateAllocationInput(
  data: CreateAllocationDTO | UpdateAllocationDTO,
  isUpdate = false
): Promise<{
  employeeId?: mongoose.Types.ObjectId;
  timeOffTypeId?: mongoose.Types.ObjectId;
  allocatedAmount?: number;
  takenAmount?: number;
  validFrom?: Date;
  validTo?: Date;
  approvalStatus?: AllocationApprovalStatus;
}> {
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

  if (!isUpdate || data.timeOffTypeId !== undefined) {
    if (!data.timeOffTypeId || !mongoose.Types.ObjectId.isValid(data.timeOffTypeId)) {
      const error: any = new Error('A valid time off type ID is required');
      error.statusCode = 400;
      throw error;
    }
    const typeExists = await TimeOffType.findById(data.timeOffTypeId);
    if (!typeExists) {
      const error: any = new Error('Referenced time off type does not exist');
      error.statusCode = 400;
      throw error;
    }
    validated.timeOffTypeId = new mongoose.Types.ObjectId(data.timeOffTypeId);
  }

  if (!isUpdate || data.allocatedAmount !== undefined) {
    if (data.allocatedAmount === undefined || data.allocatedAmount === null || typeof data.allocatedAmount !== 'number' || isNaN(data.allocatedAmount) || data.allocatedAmount <= 0) {
      const error: any = new Error('Allocated amount must be a number greater than zero');
      error.statusCode = 400;
      throw error;
    }
    validated.allocatedAmount = data.allocatedAmount;
  }

  if (data.takenAmount !== undefined) {
    if (typeof data.takenAmount !== 'number' || isNaN(data.takenAmount) || data.takenAmount < 0) {
      const error: any = new Error('Taken amount must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    validated.takenAmount = data.takenAmount;
  }

  let parsedValidFrom: Date | undefined;
  if (!isUpdate || data.validFrom !== undefined) {
    if (!data.validFrom) {
      const error: any = new Error('Validity start date is required');
      error.statusCode = 400;
      throw error;
    }
    parsedValidFrom = new Date(data.validFrom);
    if (isNaN(parsedValidFrom.getTime())) {
      const error: any = new Error('Invalid validity start date format');
      error.statusCode = 400;
      throw error;
    }
    validated.validFrom = parsedValidFrom;
  }

  if (!isUpdate || data.validTo !== undefined) {
    if (!data.validTo) {
      const error: any = new Error('Validity end date is required');
      error.statusCode = 400;
      throw error;
    }
    const parsedValidTo = new Date(data.validTo);
    if (isNaN(parsedValidTo.getTime())) {
      const error: any = new Error('Invalid validity end date format');
      error.statusCode = 400;
      throw error;
    }
    const refStart = parsedValidFrom || (data.validFrom ? new Date(data.validFrom) : undefined);
    if (refStart && parsedValidTo < refStart) {
      const error: any = new Error('Validity end date cannot be before validity start date');
      error.statusCode = 400;
      throw error;
    }
    validated.validTo = parsedValidTo;
  }

  if (data.approvalStatus !== undefined) {
    const matched = ALLOCATION_APPROVAL_STATUSES.find(
      s => s.toLowerCase() === data.approvalStatus?.trim().toLowerCase()
    );
    if (!matched) {
      const error: any = new Error(
        `Invalid approval status '${data.approvalStatus}'. Allowed statuses: ${ALLOCATION_APPROVAL_STATUSES.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    validated.approvalStatus = matched;
  } else if (!isUpdate) {
    validated.approvalStatus = 'Pending';
  }

  return validated;
}
