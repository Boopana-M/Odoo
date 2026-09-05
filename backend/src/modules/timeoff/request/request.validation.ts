import mongoose from 'mongoose';
import { TIMEOFF_REQUEST_STATUSES, TimeOffRequestStatus } from './request.model';
import { Employee } from '../../employees/employee.model';
import { TimeOffType, ITimeOffType } from '../type/timeoff-type.model';

export interface CreateTimeOffRequestInput {
  employeeId?: string;
  timeOffTypeId: string;
  allocationId?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  duration?: number;
  status?: string;
}

export interface UpdateTimeOffRequestInput {
  employeeId?: string;
  timeOffTypeId?: string;
  allocationId?: string | null;
  startDate?: string | Date;
  endDate?: string | Date;
  duration?: number;
  status?: string;
}

export function calculateDefaultDuration(startDate: Date, endDate: Date, unit: string = 'Days'): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) {
    const error: any = new Error('End date cannot be before start date');
    error.statusCode = 400;
    throw error;
  }

  if (unit.toLowerCase() === 'hours') {
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(Math.round(hours * 100) / 100, 1);
  }

  // Days: inclusive count of days
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diffDays, 1);
}

export async function validateTimeOffRequestInput(
  data: CreateTimeOffRequestInput | UpdateTimeOffRequestInput,
  isUpdate: boolean = false
): Promise<{
  employeeId?: mongoose.Types.ObjectId;
  timeOffTypeId?: mongoose.Types.ObjectId;
  timeOffTypeDoc?: ITimeOffType;
  allocationId?: mongoose.Types.ObjectId | null;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  status?: TimeOffRequestStatus;
}> {
  const validated: any = {};

  // 1. Employee Validation
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

  // 2. Time Off Type Validation
  if (!isUpdate || data.timeOffTypeId !== undefined) {
    if (!data.timeOffTypeId || !mongoose.Types.ObjectId.isValid(data.timeOffTypeId)) {
      const error: any = new Error('A valid time off type ID is required');
      error.statusCode = 400;
      throw error;
    }
    const timeOffType = await TimeOffType.findById(data.timeOffTypeId);
    if (!timeOffType) {
      const error: any = new Error('Referenced time off type does not exist');
      error.statusCode = 400;
      throw error;
    }
    validated.timeOffTypeId = new mongoose.Types.ObjectId(data.timeOffTypeId);
    validated.timeOffTypeDoc = timeOffType;
  }

  // 3. Start Date & End Date Validation
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

  let parsedEndDate: Date | undefined;
  if (!isUpdate || data.endDate !== undefined) {
    if (!data.endDate) {
      const error: any = new Error('End date is required');
      error.statusCode = 400;
      throw error;
    }
    parsedEndDate = new Date(data.endDate);
    if (isNaN(parsedEndDate.getTime())) {
      const error: any = new Error('Invalid end date format');
      error.statusCode = 400;
      throw error;
    }
    validated.endDate = parsedEndDate;
  }

  if (validated.startDate && validated.endDate) {
    if (validated.endDate.getTime() < validated.startDate.getTime()) {
      const error: any = new Error('End date cannot be before start date');
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Duration Validation
  if (data.duration !== undefined && data.duration !== null) {
    const durationNum = Number(data.duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      const error: any = new Error('Duration must be greater than zero');
      error.statusCode = 400;
      throw error;
    }
    validated.duration = Math.round(durationNum * 100) / 100;
  } else if (!isUpdate && validated.startDate && validated.endDate) {
    const unit = validated.timeOffTypeDoc ? validated.timeOffTypeDoc.unit : 'Days';
    validated.duration = calculateDefaultDuration(validated.startDate, validated.endDate, unit);
  }

  // 5. Allocation Reference (optional)
  if (data.allocationId !== undefined) {
    if (data.allocationId === null || data.allocationId === '') {
      validated.allocationId = null;
    } else {
      if (!mongoose.Types.ObjectId.isValid(data.allocationId)) {
        const error: any = new Error('Invalid allocation ID format');
        error.statusCode = 400;
        throw error;
      }
      validated.allocationId = new mongoose.Types.ObjectId(data.allocationId);
    }
  }

  // 6. Status Validation
  if (data.status !== undefined) {
    const matched = TIMEOFF_REQUEST_STATUSES.find(
      s => s.toLowerCase() === data.status?.trim().toLowerCase()
    );
    if (!matched) {
      const error: any = new Error(
        `Invalid request status '${data.status}'. Allowed statuses: ${TIMEOFF_REQUEST_STATUSES.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    validated.status = matched;
  } else if (!isUpdate) {
    validated.status = 'Pending';
  }

  return validated;
}
