import mongoose from 'mongoose';
import { Attendance, IAttendance } from './attendance.model';
import { CreateAttendanceInput, UpdateAttendanceInput, validateAttendanceData } from './attendance.validation';
import { AuthUserPayload } from '../../types/express';

export interface AttendanceFilterQuery {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export class AttendanceService {
  async createAttendance(
    input: CreateAttendanceInput,
    currentUser?: AuthUserPayload
  ): Promise<IAttendance> {
    // Security check for Employee role
    if (currentUser && currentUser.role === 'Employee') {
      if (!currentUser.employeeId) {
        const error: any = new Error('No employee profile linked to this user account');
        error.statusCode = 403;
        throw error;
      }
      if (input.employeeId && input.employeeId.toString() !== currentUser.employeeId.toString()) {
        const error: any = new Error('Access forbidden: You can only create attendance for yourself');
        error.statusCode = 403;
        throw error;
      }
      // Ensure the employeeId is set to the authenticated user's employeeId
      input.employeeId = currentUser.employeeId.toString();
    }

    const validatedData = await validateAttendanceData(input, false);

    const attendance = new Attendance(validatedData);
    const saved = await attendance.save();

    return (await Attendance.findById(saved._id)
      .populate('employeeId', 'firstName lastName employeeCode departmentId jobPosition')
      .populate('correctedBy', 'name email role')) as IAttendance;
  }

  async getAllAttendances(
    filterQuery: AttendanceFilterQuery = {},
    currentUser?: AuthUserPayload
  ): Promise<IAttendance[]> {
    const query: Record<string, any> = {};

    // If currentUser is an Employee, enforce ownership filter
    if (currentUser && currentUser.role === 'Employee') {
      if (!currentUser.employeeId) {
        return [];
      }
      query.employeeId = new mongoose.Types.ObjectId(currentUser.employeeId);
    } else if (filterQuery.employeeId && mongoose.Types.ObjectId.isValid(filterQuery.employeeId)) {
      query.employeeId = new mongoose.Types.ObjectId(filterQuery.employeeId);
    }

    if (filterQuery.status) {
      query.status = filterQuery.status;
    }

    if (filterQuery.startDate || filterQuery.endDate) {
      query.date = {};
      if (filterQuery.startDate) {
        query.date.$gte = new Date(filterQuery.startDate);
      }
      if (filterQuery.endDate) {
        const end = new Date(filterQuery.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    return await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode departmentId jobPosition')
      .populate('correctedBy', 'name email role')
      .sort({ date: -1, checkIn: -1 });
  }

  async getAttendanceById(id: string, currentUser?: AuthUserPayload): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid attendance ID format');
      error.statusCode = 400;
      throw error;
    }

    const attendance = await Attendance.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode departmentId jobPosition')
      .populate('correctedBy', 'name email role');

    if (!attendance) {
      const error: any = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    // Security ownership check for Employee role
    if (currentUser && currentUser.role === 'Employee') {
      const attendanceEmpId = (attendance.employeeId as any)?._id?.toString() || attendance.employeeId.toString();
      if (!currentUser.employeeId || currentUser.employeeId.toString() !== attendanceEmpId) {
        const error: any = new Error('Access forbidden: You can only access your own attendance records');
        error.statusCode = 403;
        throw error;
      }
    }

    return attendance;
  }

  async getAttendanceByEmployeeId(
    employeeId: string,
    currentUser?: AuthUserPayload
  ): Promise<IAttendance[]> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error: any = new Error('Invalid employee ID format');
      error.statusCode = 400;
      throw error;
    }

    // Security ownership check for Employee role
    if (currentUser && currentUser.role === 'Employee') {
      if (!currentUser.employeeId || currentUser.employeeId.toString() !== employeeId) {
        const error: any = new Error('Access forbidden: You can only access your own attendance records');
        error.statusCode = 403;
        throw error;
      }
    }

    return await Attendance.find({ employeeId: new mongoose.Types.ObjectId(employeeId) })
      .populate('employeeId', 'firstName lastName employeeCode departmentId jobPosition')
      .populate('correctedBy', 'name email role')
      .sort({ date: -1, checkIn: -1 });
  }

  async updateAttendance(
    id: string,
    input: UpdateAttendanceInput,
    updaterUser?: AuthUserPayload
  ): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid attendance ID format');
      error.statusCode = 400;
      throw error;
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      const error: any = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    const validatedData = await validateAttendanceData(input, true, {
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut
    });

    if (validatedData.employeeId) attendance.employeeId = validatedData.employeeId;
    if (validatedData.date) attendance.date = validatedData.date;
    if (validatedData.checkIn) attendance.checkIn = validatedData.checkIn;
    if (validatedData.checkOut !== undefined) attendance.checkOut = validatedData.checkOut;
    if (validatedData.workedHours !== undefined) attendance.workedHours = validatedData.workedHours;
    if (validatedData.status) attendance.status = validatedData.status;

    // Record manual correction metadata
    attendance.isCorrected = true;
    if (updaterUser) {
      attendance.correctedBy = new mongoose.Types.ObjectId(updaterUser.userId);
    }
    attendance.correctionReason = input.correctionReason?.trim() || attendance.correctionReason || 'Manual correction by HR/Admin';

    await attendance.save();

    return (await Attendance.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode departmentId jobPosition')
      .populate('correctedBy', 'name email role')) as IAttendance;
  }

  async deleteAttendance(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid attendance ID format');
      error.statusCode = 400;
      throw error;
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      const error: any = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    await Attendance.findByIdAndDelete(id);
  }
}

export const attendanceService = new AttendanceService();
