import mongoose from 'mongoose';
import { User, IUser, UserRole } from './user.model';
import { Employee, IBankDetails } from '../employees/employee.model';
import { Department } from '../departments/department.model';
import { WorkingSchedule } from '../schedules/schedule.model';

export interface EmployeeProfileInput {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentId?: string;
  managerId?: string | null;
  scheduleId?: string | null;
  jobPosition?: string;
  employeeType?: string;
  status?: string;
  bankDetails?: IBankDetails;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeId?: string | null;
  isActive?: boolean;
  employee?: EmployeeProfileInput;
  // Also accept top-level employee fields if submitted flattened
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  departmentId?: string;
  managerId?: string | null;
  scheduleId?: string | null;
  jobPosition?: string;
  employeeType?: string;
  status?: string;
  bankDetails?: IBankDetails;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export class UserService {
  async createUser(input: CreateUserInput): Promise<IUser> {
    if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
      const error: any = new Error('User name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!input.email || typeof input.email !== 'string' || !input.email.trim()) {
      const error: any = new Error('User email is required');
      error.statusCode = 400;
      throw error;
    }

    const trimmedUserEmail = input.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedUserEmail)) {
      const error: any = new Error('Please enter a valid user email address');
      error.statusCode = 400;
      throw error;
    }

    if (!input.password || typeof input.password !== 'string' || input.password.length < 6) {
      const error: any = new Error('Password must be at least 6 characters long');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email: trimmedUserEmail });
    if (existingUser) {
      const error: any = new Error(`User with email '${trimmedUserEmail}' already exists`);
      error.statusCode = 400;
      throw error;
    }

    // Role validation
    const validRoles: UserRole[] = ['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];
    if (!validRoles.includes(input.role)) {
      const error: any = new Error(`Invalid role '${input.role}'`);
      error.statusCode = 400;
      throw error;
    }

    // ==========================================
    // 1. Employee Role Creation (Atomic User + Employee)
    // ==========================================
    if (input.role === 'Employee') {
      const empData = input.employee || {};

      const empFirstName = (empData.firstName || input.firstName || input.name.split(' ')[0] || '').trim();
      const empLastName = (empData.lastName || input.lastName || input.name.split(' ').slice(1).join(' ') || '').trim();
      const empCode = (empData.employeeCode || input.employeeCode || '').trim().toUpperCase();
      const empEmail = (empData.email || trimmedUserEmail).trim().toLowerCase();
      const empDeptId = empData.departmentId || input.departmentId;
      const empJobPosition = (empData.jobPosition || input.jobPosition || '').trim();
      const empType = (empData.employeeType || input.employeeType || 'Full-Time') as any;
      const empStatus = (empData.status || input.status || 'Active') as any;
      const empManagerId = empData.managerId || input.managerId || null;
      const empScheduleId = empData.scheduleId || input.scheduleId || null;
      const empBankDetails = empData.bankDetails || input.bankDetails || {};

      if (!empFirstName) {
        const error: any = new Error('Employee first name is required');
        error.statusCode = 400;
        throw error;
      }

      if (!empLastName) {
        const error: any = new Error('Employee last name is required');
        error.statusCode = 400;
        throw error;
      }

      if (!empCode) {
        const error: any = new Error('Employee code is required for Employee role');
        error.statusCode = 400;
        throw error;
      }

      if (!empDeptId || !mongoose.Types.ObjectId.isValid(empDeptId)) {
        const error: any = new Error('A valid department is required for Employee profile');
        error.statusCode = 400;
        throw error;
      }

      const deptExists = await Department.findById(empDeptId);
      if (!deptExists) {
        const error: any = new Error('Referenced department does not exist');
        error.statusCode = 400;
        throw error;
      }

      if (!empJobPosition) {
        const error: any = new Error('Job position is required for Employee profile');
        error.statusCode = 400;
        throw error;
      }

      // Check unique employee code
      const existingEmpCode = await Employee.findOne({ employeeCode: empCode });
      if (existingEmpCode) {
        const error: any = new Error(`Employee with code '${empCode}' already exists`);
        error.statusCode = 409;
        throw error;
      }

      // Check unique employee email
      const existingEmpEmail = await Employee.findOne({ email: empEmail });
      if (existingEmpEmail) {
        const error: any = new Error(`Employee with email '${empEmail}' already exists`);
        error.statusCode = 409;
        throw error;
      }

      // Validate manager if provided
      let validatedManagerId: mongoose.Types.ObjectId | null = null;
      if (empManagerId) {
        if (!mongoose.Types.ObjectId.isValid(empManagerId)) {
          const error: any = new Error('Invalid manager ID format');
          error.statusCode = 400;
          throw error;
        }
        const managerExists = await Employee.findById(empManagerId);
        if (!managerExists) {
          const error: any = new Error('Referenced manager does not exist');
          error.statusCode = 400;
          throw error;
        }
        validatedManagerId = new mongoose.Types.ObjectId(empManagerId);
      }

      // Validate schedule if provided
      let validatedScheduleId: mongoose.Types.ObjectId | null = null;
      if (empScheduleId) {
        if (!mongoose.Types.ObjectId.isValid(empScheduleId)) {
          const error: any = new Error('Invalid working schedule ID format');
          error.statusCode = 400;
          throw error;
        }
        const schedExists = await WorkingSchedule.findById(empScheduleId);
        if (!schedExists) {
          const error: any = new Error('Referenced working schedule does not exist');
          error.statusCode = 400;
          throw error;
        }
        validatedScheduleId = new mongoose.Types.ObjectId(empScheduleId);
      }

      // Atomic creation: create employee first, then user; if user fails, rollback employee
      let createdEmployee: any = null;
      let createdUser: any = null;

      try {
        const employee = new Employee({
          employeeCode: empCode,
          firstName: empFirstName,
          lastName: empLastName,
          email: empEmail,
          departmentId: new mongoose.Types.ObjectId(empDeptId),
          managerId: validatedManagerId,
          scheduleId: validatedScheduleId,
          jobPosition: empJobPosition,
          employeeType: empType,
          status: empStatus,
          bankDetails: empBankDetails
        });
        createdEmployee = await employee.save();

        const user = new User({
          name: input.name.trim(),
          email: trimmedUserEmail,
          passwordHash: input.password,
          role: 'Employee',
          employeeId: createdEmployee._id,
          isActive: input.isActive !== undefined ? input.isActive : true
        });
        createdUser = await user.save();
      } catch (err) {
        if (createdEmployee && createdEmployee._id && !createdUser) {
          try {
            await Employee.findByIdAndDelete(createdEmployee._id);
          } catch (cleanupErr) {
            console.error('Error rolling back employee creation:', cleanupErr);
          }
        }
        throw err;
      }

      const fullUser = await User.findById(createdUser._id)
        .populate('employeeId')
        .select('-passwordHash');
      return fullUser!;
    }

    // ==========================================
    // 2. Non-Employee Roles (User Only)
    // ==========================================
    const user = new User({
      name: input.name.trim(),
      email: trimmedUserEmail,
      passwordHash: input.password,
      role: input.role,
      employeeId: null,
      isActive: input.isActive !== undefined ? input.isActive : true
    });

    await user.save();
    const created = await User.findById(user._id).select('-passwordHash');
    return created!;
  }

  async getAllUsers(): Promise<IUser[]> {
    return User.find()
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition departmentId')
      .select('-passwordHash')
      .sort({ createdAt: -1 });
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition departmentId')
      .select('-passwordHash');
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<CreateUserInput>): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (updates.name) user.name = updates.name.trim();
    if (updates.email) {
      const trimmedEmail = updates.email.trim().toLowerCase();
      if (trimmedEmail !== user.email) {
        const existing = await User.findOne({ _id: { $ne: id }, email: trimmedEmail });
        if (existing) {
          const error: any = new Error(`User with email '${trimmedEmail}' already exists`);
          error.statusCode = 400;
          throw error;
        }
        user.email = trimmedEmail;
      }
    }
    if (updates.role) user.role = updates.role;
    if (updates.employeeId !== undefined) user.employeeId = updates.employeeId as any;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (updates.password) {
      if (typeof updates.password !== 'string' || updates.password.length < 6) {
        const error: any = new Error('Password must be at least 6 characters long');
        error.statusCode = 400;
        throw error;
      }
      user.passwordHash = updates.password;
    }

    await user.save();
    const updated = await User.findById(user._id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition departmentId')
      .select('-passwordHash');
    return updated!;
  }

  async resetUserPassword(id: string, newPassword: string): Promise<{ message: string }> {
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      const error: any = new Error('New password must be at least 6 characters long');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(id).select('+passwordHash');
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    user.passwordHash = newPassword;
    await user.save();

    return { message: `Password for '${user.name}' has been reset successfully` };
  }

  async deleteUser(id: string): Promise<void> {
    const user = await User.findById(id);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const linkedEmployeeId = user.employeeId;

    // Delete user
    await User.findByIdAndDelete(id);

    // If user was linked to an employee profile, delete the associated employee record
    if (linkedEmployeeId) {
      try {
        // Clear manager reference for any subordinates so they don't break
        await Employee.updateMany(
          { managerId: linkedEmployeeId },
          { $set: { managerId: null } }
        );
        await Employee.findByIdAndDelete(linkedEmployeeId);
      } catch (empErr) {
        console.warn('Could not delete associated employee record:', empErr);
      }
    }
  }
}

export const userService = new UserService();
