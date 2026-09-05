import mongoose from 'mongoose';
import { ATTENDANCE_STATUSES, AttendanceStatus } from './attendance.model';
import { Employee } from '../employees/employee.model';

export interface CreateAttendanceInput {
  employeeId: string;
  date?: string | Date;
  checkIn: string | Date;
  checkOut?: string | Date | null;
  workedHours?: number; // client may send, but backend will calculate
  status?: string;
  isCorrected?: boolean;
  correctedBy?: string | null;
  correctionReason?: string | null;
}

export interface UpdateAttendanceInput {
  employeeId?: string;
  date?: string | Date;
  checkIn?: string | Date;
  checkOut?: string | Date | null;
  workedHours?: number;
  status?: string;
  isCorrected?: boolean;
  correctedBy?: string | null;
  correctionReason?: string | null;
}

export function calculateWorkedHours(checkIn: Date, checkOut?: Date | null): number {
  if (!checkOut) {
    return 0;
  }
  const diffMs = checkOut.getTime() - checkIn.getTime();
  if (diffMs < 0) {
    const error: any = new Error('Check-out time cannot be before check-in time');
    error.statusCode = 400;
    throw error;
  }
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

export async function validateAttendanceData(
  data: CreateAttendanceInput | UpdateAttendanceInput,
  isUpdate: boolean = false,
  existingRecord?: { checkIn: Date; checkOut?: Date | null }
): Promise<{
  employeeId?: mongoose.Types.ObjectId;
  date?: Date;
  checkIn?: Date;
  checkOut?: Date | null;
  workedHours?: number;
  status?: AttendanceStatus;
  isCorrected?: boolean;
  correctedBy?: mongoose.Types.ObjectId | null;
  correctionReason?: string | null;
}> {
  const validated: any = {};

  // 1. Employee ID validation
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

  // 2. Check-in validation
  let parsedCheckIn: Date | undefined;
  if (!isUpdate || data.checkIn !== undefined) {
    if (!data.checkIn) {
      const error: any = new Error('Check-in time is required');
      error.statusCode = 400;
      throw error;
    }
    parsedCheckIn = new Date(data.checkIn);
    if (isNaN(parsedCheckIn.getTime())) {
      const error: any = new Error('Invalid check-in time format');
      error.statusCode = 400;
      throw error;
    }
    validated.checkIn = parsedCheckIn;
  } else if (existingRecord) {
    parsedCheckIn = existingRecord.checkIn;
  }

  // 3. Date validation
  if (!isUpdate || data.date !== undefined) {
    if (data.date) {
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        const error: any = new Error('Invalid attendance date format');
        error.statusCode = 400;
        throw error;
      }
      validated.date = parsedDate;
    } else if (parsedCheckIn) {
      // Default date to the checkIn date if not explicitly passed
      const dateOnly = new Date(parsedCheckIn);
      dateOnly.setHours(0, 0, 0, 0);
      validated.date = dateOnly;
    } else {
      const error: any = new Error('Attendance date is required');
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Check-out validation & workedHours calculation
  let parsedCheckOut: Date | null | undefined;
  if (data.checkOut !== undefined) {
    if (data.checkOut === null || data.checkOut === '') {
      parsedCheckOut = null;
      validated.checkOut = null;
    } else {
      parsedCheckOut = new Date(data.checkOut);
      if (isNaN(parsedCheckOut.getTime())) {
        const error: any = new Error('Invalid check-out time format');
        error.statusCode = 400;
        throw error;
      }
      validated.checkOut = parsedCheckOut;
    }
  } else if (existingRecord) {
    parsedCheckOut = existingRecord.checkOut;
  }

  // Verify checkOut against checkIn
  const effectiveCheckIn = validated.checkIn || parsedCheckIn;
  const effectiveCheckOut = validated.checkOut !== undefined ? validated.checkOut : parsedCheckOut;

  if (effectiveCheckIn) {
    if (effectiveCheckOut) {
      if (effectiveCheckOut.getTime() < effectiveCheckIn.getTime()) {
        const error: any = new Error('Check-out time cannot be before check-in time');
        error.statusCode = 400;
        throw error;
      }
      validated.workedHours = calculateWorkedHours(effectiveCheckIn, effectiveCheckOut);
    } else if (!isUpdate || data.checkOut === null) {
      validated.workedHours = 0;
    }
  }

  // 5. Status validation
  if (data.status !== undefined) {
    const formattedStatus = ATTENDANCE_STATUSES.find(
      s => s.toLowerCase() === data.status?.trim().toLowerCase()
    );
    if (!formattedStatus) {
      const error: any = new Error(
        `Invalid attendance status '${data.status}'. Allowed statuses: ${ATTENDANCE_STATUSES.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    validated.status = formattedStatus;
  } else if (!isUpdate) {
    validated.status = 'Present';
  }

  // 6. Manual correction fields
  if (data.isCorrected !== undefined) {
    validated.isCorrected = Boolean(data.isCorrected);
  }
  if (data.correctedBy !== undefined) {
    if (data.correctedBy && mongoose.Types.ObjectId.isValid(data.correctedBy)) {
      validated.correctedBy = new mongoose.Types.ObjectId(data.correctedBy);
    } else {
      validated.correctedBy = null;
    }
  }
  if (data.correctionReason !== undefined) {
    validated.correctionReason = data.correctionReason ? String(data.correctionReason).trim() : null;
  }

  return validated;
}
