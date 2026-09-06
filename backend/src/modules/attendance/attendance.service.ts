import mongoose from 'mongoose';
import { Attendance, IAttendance } from './attendance.model';
import {
  CreateAttendanceInput,
  UpdateAttendanceInput,
  validateAttendanceData,
  calculateWorkedHours
} from './attendance.validation';
import { AuthUserPayload } from '../../types/express';
import { User } from '../users/user.model';

export interface AttendanceFilterQuery {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export class AttendanceService {
  /**
   * Employee self-service check-in.
   * Only allowed for users with role === 'Employee'.
   * Derives employeeId strictly from authenticated user.
   * Prevents duplicate check-in if an open attendance record already exists.
   */
  async checkIn(currentUser?: AuthUserPayload): Promise<IAttendance> {
    if (!currentUser) {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    if (currentUser.role !== 'Employee') {
      const error: any = new Error('Only employees can perform self-service check-in.');
      error.statusCode = 403;
      throw error;
    }

    let employeeId = currentUser.employeeId;
    if (!employeeId) {
      const dbUser = await User.findById(currentUser.userId);
      if (dbUser?.employeeId) {
        employeeId = dbUser.employeeId.toString();
      }
    }

    if (!employeeId) {
      const error: any = new Error('No employee profile linked to this user account');
      error.statusCode = 403;
      throw error;
    }

    // Check for existing active/open attendance record for this employee
    const activeAttendance = await Attendance.findOne({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      checkOut: null
    });

    if (activeAttendance) {
      const error: any = new Error('Already checked in. Please check out before checking in again.');
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    const dateOnly = new Date(now);
    dateOnly.setHours(0, 0, 0, 0);

    const attendance = new Attendance({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      date: dateOnly,
      checkIn: now,
      status: 'Present',
      workedHours: 0
    });

    const saved = await attendance.save();

    return (await Attendance.findById(saved._id)
      .populate('employeeId', 'firstName lastName employeeCode departmentId jobPosition')
      .populate('correctedBy', 'name email role')) as IAttendance;
  }

  /**
   * Employee self-service check-out.
   * Only allowed for users with role === 'Employee'.
   * Derives employeeId strictly from authenticated user.
   * Finds active open record, sets checkOut, and computes workedHours.
   */
  async checkOut(currentUser?: AuthUserPayload): Promise<IAttendance> {
    if (!currentUser) {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    if (currentUser.role !== 'Employee') {
      const error: any = new Error('Only employees can perform self-service check-out.');
      error.statusCode = 403;
      throw error;
    }

    let employeeId = currentUser.employeeId;
    if (!employeeId) {
      const dbUser = await User.findById(currentUser.userId);
      if (dbUser?.employeeId) {
        employeeId = dbUser.employeeId.toString();
      }
    }

    if (!employeeId) {
      const error: any = new Error('No employee profile linked to this user account');
      error.statusCode = 403;
      throw error;
    }

    // Find the employee's active/open attendance record
    const attendance = await Attendance.findOne({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      checkOut: null
    }).sort({ checkIn: -1 });

    if (!attendance) {
      const error: any = new Error('Cannot check out without an active check-in.');
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    if (now.getTime() < attendance.checkIn.getTime()) {
      const error: any = new Error('Check-out time cannot be before check-in time');
      error.statusCode = 400;
      throw error;
    }

    attendance.checkOut = now;
    attendance.workedHours = calculateWorkedHours(attendance.checkIn, now);

    await attendance.save();

    return (await Attendance.findById(attendance._id)
      .populate('employeeId', 'firstName lastName employeeCode departmentId jobPosition')
      .populate('correctedBy', 'name email role')) as IAttendance;
  }

  /**
   * Get active attendance / check-in status for the current employee.
   */
  async getStatus(currentUser?: AuthUserPayload): Promise<{ isCheckedIn: boolean; attendance: IAttendance | null }> {
    if (!currentUser || currentUser.role !== 'Employee') {
      return { isCheckedIn: false, attendance: null };
    }

    let employeeId = currentUser.employeeId;
    if (!employeeId) {
      const dbUser = await User.findById(currentUser.userId);
      if (dbUser?.employeeId) {
        employeeId = dbUser.employeeId.toString();
      }
    }

    if (!employeeId) {
      return { isCheckedIn: false, attendance: null };
    }

    const openRecord = await Attendance.findOne({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      checkOut: null
    })
      .sort({ checkIn: -1 })
      .populate('employeeId', 'firstName lastName employeeCode departmentId jobPosition')
      .populate('correctedBy', 'name email role');

    return {
      isCheckedIn: !!openRecord,
      attendance: (openRecord as IAttendance) || null
    };
  }

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

      // If open attendance (no checkOut provided), check for duplicate active attendance
      if (!input.checkOut) {
        const activeAttendance = await Attendance.findOne({
          employeeId: new mongoose.Types.ObjectId(input.employeeId),
          checkOut: null
        });
        if (activeAttendance) {
          const error: any = new Error('Already checked in. Please check out before checking in again.');
          error.statusCode = 400;
          throw error;
        }
      }
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

    // Security ownership check for Employee role
    if (updaterUser && updaterUser.role === 'Employee') {
      const attendanceEmpId = attendance.employeeId.toString();
      if (!updaterUser.employeeId || updaterUser.employeeId.toString() !== attendanceEmpId) {
        const error: any = new Error('Access forbidden: You can only update your own attendance records');
        error.statusCode = 403;
        throw error;
      }
      // Employees cannot perform manual corrections or arbitrarily edit attendance records
      if (input.correctionReason || input.status || input.checkIn || input.date || input.employeeId) {
        const error: any = new Error('Access forbidden: Employees cannot manually correct attendance records');
        error.statusCode = 403;
        throw error;
      }
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

    // Record manual correction metadata if modified by HR/Admin or explicitly provided
    if (updaterUser && updaterUser.role !== 'Employee') {
      attendance.isCorrected = true;
      attendance.correctedBy = new mongoose.Types.ObjectId(updaterUser.userId);
      attendance.correctionReason = input.correctionReason?.trim() || attendance.correctionReason || 'Manual correction by HR/Admin';
    } else if (input.correctionReason) {
      attendance.isCorrected = true;
      if (updaterUser) {
        attendance.correctedBy = new mongoose.Types.ObjectId(updaterUser.userId);
      }
      attendance.correctionReason = input.correctionReason.trim();
    }

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
