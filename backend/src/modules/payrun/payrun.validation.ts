import mongoose from 'mongoose';

export interface EligibleEmployeesQueryDTO {
  salaryStructureId: string;
  periodStart: string | Date;
  periodEnd: string | Date;
}

export interface CreatePayrunDTO {
  name: string;
  salaryStructureId: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  employeeIds: string[];
}

export interface UpdatePayrunDTO {
  name?: string;
  salaryStructureId?: string;
  periodStart?: string | Date;
  periodEnd?: string | Date;
  employeeIds?: string[];
  status?: string;
}

export function validateEligibleEmployeesInput(data: any): {
  salaryStructureId: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
} {
  if (!data.salaryStructureId || typeof data.salaryStructureId !== 'string') {
    const error: any = new Error('Salary structure ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(data.salaryStructureId)) {
    const error: any = new Error('Invalid salary structure ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!data.periodStart) {
    const error: any = new Error('Period start date is required');
    error.statusCode = 400;
    throw error;
  }

  if (!data.periodEnd) {
    const error: any = new Error('Period end date is required');
    error.statusCode = 400;
    throw error;
  }

  const periodStart = new Date(data.periodStart);
  const periodEnd = new Date(data.periodEnd);

  if (isNaN(periodStart.getTime())) {
    const error: any = new Error('Invalid period start date format');
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(periodEnd.getTime())) {
    const error: any = new Error('Invalid period end date format');
    error.statusCode = 400;
    throw error;
  }

  if (periodEnd < periodStart) {
    const error: any = new Error('Period end date cannot be before period start date');
    error.statusCode = 400;
    throw error;
  }

  return {
    salaryStructureId: new mongoose.Types.ObjectId(data.salaryStructureId),
    periodStart,
    periodEnd
  };
}

export function validateCreatePayrunInput(data: CreatePayrunDTO): {
  name: string;
  salaryStructureId: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  employeeIds: mongoose.Types.ObjectId[];
} {
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    const error: any = new Error('Payrun name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!data.salaryStructureId || typeof data.salaryStructureId !== 'string') {
    const error: any = new Error('Salary structure ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(data.salaryStructureId)) {
    const error: any = new Error('Invalid salary structure ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!data.periodStart) {
    const error: any = new Error('Period start date is required');
    error.statusCode = 400;
    throw error;
  }

  if (!data.periodEnd) {
    const error: any = new Error('Period end date is required');
    error.statusCode = 400;
    throw error;
  }

  const periodStart = new Date(data.periodStart);
  const periodEnd = new Date(data.periodEnd);

  if (isNaN(periodStart.getTime())) {
    const error: any = new Error('Invalid period start date format');
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(periodEnd.getTime())) {
    const error: any = new Error('Invalid period end date format');
    error.statusCode = 400;
    throw error;
  }

  if (periodEnd < periodStart) {
    const error: any = new Error('Period end date cannot be before period start date');
    error.statusCode = 400;
    throw error;
  }

  if (!data.employeeIds || !Array.isArray(data.employeeIds) || data.employeeIds.length === 0) {
    const error: any = new Error('At least one employee must be selected for the payrun');
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate employee IDs
  const seenStr = new Set<string>();
  const objectIds: mongoose.Types.ObjectId[] = [];

  for (const empId of data.employeeIds) {
    if (!empId || typeof empId !== 'string' || !mongoose.Types.ObjectId.isValid(empId)) {
      const error: any = new Error(`Invalid employee ID format: '${empId}'`);
      error.statusCode = 400;
      throw error;
    }

    if (seenStr.has(empId.toString())) {
      const error: any = new Error('Selected employee list contains duplicate employee IDs');
      error.statusCode = 400;
      throw error;
    }

    seenStr.add(empId.toString());
    objectIds.push(new mongoose.Types.ObjectId(empId));
  }

  return {
    name: data.name.trim(),
    salaryStructureId: new mongoose.Types.ObjectId(data.salaryStructureId),
    periodStart,
    periodEnd,
    employeeIds: objectIds
  };
}
