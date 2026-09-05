import mongoose from 'mongoose';
import { Employee, IEmployee, EMPLOYEE_TYPES, EMPLOYEE_STATUSES, EmployeeType, EmployeeStatus, IBankDetails } from './employee.model';
import { Department } from '../departments/department.model';

export interface CreateEmployeeDTO {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  managerId?: string | null;
  scheduleId?: string | null;
  jobPosition: string;
  employeeType?: string;
  status?: string;
  bankDetails?: IBankDetails;
}

export interface UpdateEmployeeDTO {
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

export interface EmployeeFilterQuery {
  departmentId?: string;
  employeeType?: string;
  status?: string;
  search?: string;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function normalizeEmployeeType(type?: string): EmployeeType | undefined {
  if (!type) return undefined;
  const match = EMPLOYEE_TYPES.find(t => t.toLowerCase() === type.trim().toLowerCase());
  return match;
}

function normalizeEmployeeStatus(status?: string): EmployeeStatus | undefined {
  if (!status) return undefined;
  const match = EMPLOYEE_STATUSES.find(s => s.toLowerCase() === status.trim().toLowerCase());
  return match;
}

export class EmployeeService {
  async createEmployee(data: CreateEmployeeDTO): Promise<IEmployee> {
    if (!data.employeeCode || typeof data.employeeCode !== 'string' || !data.employeeCode.trim()) {
      const error: any = new Error('Employee code is required');
      error.statusCode = 400;
      throw error;
    }

    if (!data.firstName || typeof data.firstName !== 'string' || !data.firstName.trim()) {
      const error: any = new Error('First name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!data.lastName || typeof data.lastName !== 'string' || !data.lastName.trim()) {
      const error: any = new Error('Last name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
      const error: any = new Error('Email is required');
      error.statusCode = 400;
      throw error;
    }

    const trimmedEmail = data.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      const error: any = new Error('Please enter a valid email address');
      error.statusCode = 400;
      throw error;
    }

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

    if (!data.jobPosition || typeof data.jobPosition !== 'string' || !data.jobPosition.trim()) {
      const error: any = new Error('Job position is required');
      error.statusCode = 400;
      throw error;
    }

    // Manager validation if provided
    let managerObjectId: mongoose.Types.ObjectId | null = null;
    if (data.managerId) {
      if (!mongoose.Types.ObjectId.isValid(data.managerId)) {
        const error: any = new Error('Invalid manager ID format');
        error.statusCode = 400;
        throw error;
      }
      const managerExists = await Employee.findById(data.managerId);
      if (!managerExists) {
        const error: any = new Error('Referenced manager does not exist');
        error.statusCode = 400;
        throw error;
      }
      managerObjectId = new mongoose.Types.ObjectId(data.managerId);
    }

    // Schedule validation if provided
    let scheduleObjectId: mongoose.Types.ObjectId | null = null;
    if (data.scheduleId) {
      if (!mongoose.Types.ObjectId.isValid(data.scheduleId)) {
        const error: any = new Error('Invalid working schedule ID format');
        error.statusCode = 400;
        throw error;
      }
      const ScheduleModel = mongoose.models.WorkingSchedule;
      if (ScheduleModel) {
        const scheduleExists = await ScheduleModel.findById(data.scheduleId);
        if (!scheduleExists) {
          const error: any = new Error('Referenced working schedule does not exist');
          error.statusCode = 400;
          throw error;
        }
      }
      scheduleObjectId = new mongoose.Types.ObjectId(data.scheduleId);
    }

    // Check unique employeeCode
    const trimmedCode = data.employeeCode.trim().toUpperCase();
    const existingCode = await Employee.findOne({ employeeCode: trimmedCode });
    if (existingCode) {
      const error: any = new Error(`Employee with code '${trimmedCode}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    // Check unique email
    const existingEmail = await Employee.findOne({ email: trimmedEmail });
    if (existingEmail) {
      const error: any = new Error(`Employee with email '${trimmedEmail}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    // Validate employeeType
    let employeeType: EmployeeType = 'Full-Time';
    if (data.employeeType) {
      const normalizedType = normalizeEmployeeType(data.employeeType);
      if (!normalizedType) {
        const error: any = new Error(
          `Invalid employee type '${data.employeeType}'. Allowed types: ${EMPLOYEE_TYPES.join(', ')}`
        );
        error.statusCode = 400;
        throw error;
      }
      employeeType = normalizedType;
    }

    // Validate status
    let status: EmployeeStatus = 'Active';
    if (data.status) {
      const normalizedStatus = normalizeEmployeeStatus(data.status);
      if (!normalizedStatus) {
        const error: any = new Error(
          `Invalid employee status '${data.status}'. Allowed statuses: ${EMPLOYEE_STATUSES.join(', ')}`
        );
        error.statusCode = 400;
        throw error;
      }
      status = normalizedStatus;
    }

    const employee = new Employee({
      employeeCode: trimmedCode,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: trimmedEmail,
      departmentId: new mongoose.Types.ObjectId(data.departmentId),
      managerId: managerObjectId,
      scheduleId: scheduleObjectId,
      jobPosition: data.jobPosition.trim(),
      employeeType,
      status,
      bankDetails: data.bankDetails || {}
    });

    const saved = await employee.save();
    return (await Employee.findById(saved._id)
      .populate('departmentId', 'name')
      .populate('managerId', 'firstName lastName employeeCode email jobPosition')) as IEmployee;
  }

  async getAllEmployees(filterQuery: EmployeeFilterQuery = {}): Promise<IEmployee[]> {
    const query: Record<string, any> = {};

    if (filterQuery.departmentId) {
      if (mongoose.Types.ObjectId.isValid(filterQuery.departmentId)) {
        query.departmentId = new mongoose.Types.ObjectId(filterQuery.departmentId);
      }
    }

    if (filterQuery.employeeType) {
      const normalizedType = normalizeEmployeeType(filterQuery.employeeType);
      if (normalizedType) {
        query.employeeType = normalizedType;
      }
    }

    if (filterQuery.status) {
      const normalizedStatus = normalizeEmployeeStatus(filterQuery.status);
      if (normalizedStatus) {
        query.status = normalizedStatus;
      }
    }

    if (filterQuery.search && filterQuery.search.trim()) {
      const searchRegex = new RegExp(filterQuery.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeCode: searchRegex },
        { email: searchRegex },
        { jobPosition: searchRegex }
      ];
    }

    return await Employee.find(query)
      .populate('departmentId', 'name')
      .populate('managerId', 'firstName lastName employeeCode email jobPosition')
      .sort({ createdAt: -1 });
  }

  async getEmployeeById(id: string): Promise<IEmployee> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid employee ID format');
      error.statusCode = 400;
      throw error;
    }

    const employee = await Employee.findById(id)
      .populate('departmentId', 'name')
      .populate('managerId', 'firstName lastName employeeCode email jobPosition');

    if (!employee) {
      const error: any = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    return employee;
  }

  async updateEmployee(id: string, data: UpdateEmployeeDTO): Promise<IEmployee> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid employee ID format');
      error.statusCode = 400;
      throw error;
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      const error: any = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.employeeCode !== undefined) {
      if (typeof data.employeeCode !== 'string' || !data.employeeCode.trim()) {
        const error: any = new Error('Employee code cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      const trimmedCode = data.employeeCode.trim().toUpperCase();
      const existing = await Employee.findOne({ _id: { $ne: id }, employeeCode: trimmedCode });
      if (existing) {
        const error: any = new Error(`Employee with code '${trimmedCode}' already exists`);
        error.statusCode = 409;
        throw error;
      }
      employee.employeeCode = trimmedCode;
    }

    if (data.firstName !== undefined) {
      if (typeof data.firstName !== 'string' || !data.firstName.trim()) {
        const error: any = new Error('First name cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      employee.firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      if (typeof data.lastName !== 'string' || !data.lastName.trim()) {
        const error: any = new Error('Last name cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      employee.lastName = data.lastName.trim();
    }

    if (data.email !== undefined) {
      if (typeof data.email !== 'string' || !data.email.trim()) {
        const error: any = new Error('Email cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      const trimmedEmail = data.email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        const error: any = new Error('Please enter a valid email address');
        error.statusCode = 400;
        throw error;
      }
      const existing = await Employee.findOne({ _id: { $ne: id }, email: trimmedEmail });
      if (existing) {
        const error: any = new Error(`Employee with email '${trimmedEmail}' already exists`);
        error.statusCode = 409;
        throw error;
      }
      employee.email = trimmedEmail;
    }

    if (data.departmentId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(data.departmentId)) {
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
      employee.departmentId = new mongoose.Types.ObjectId(data.departmentId);
    }

    if (data.managerId !== undefined) {
      if (data.managerId === null || data.managerId === '') {
        employee.managerId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(data.managerId)) {
          const error: any = new Error('Invalid manager ID format');
          error.statusCode = 400;
          throw error;
        }
        if (data.managerId.toString() === id.toString()) {
          const error: any = new Error('An employee cannot be their own manager');
          error.statusCode = 400;
          throw error;
        }
        const managerExists = await Employee.findById(data.managerId);
        if (!managerExists) {
          const error: any = new Error('Referenced manager does not exist');
          error.statusCode = 400;
          throw error;
        }
        employee.managerId = new mongoose.Types.ObjectId(data.managerId);
      }
    }

    if (data.scheduleId !== undefined) {
      if (data.scheduleId === null || data.scheduleId === '') {
        employee.scheduleId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(data.scheduleId)) {
          const error: any = new Error('Invalid working schedule ID format');
          error.statusCode = 400;
          throw error;
        }
        const ScheduleModel = mongoose.models.WorkingSchedule;
        if (ScheduleModel) {
          const scheduleExists = await ScheduleModel.findById(data.scheduleId);
          if (!scheduleExists) {
            const error: any = new Error('Referenced working schedule does not exist');
            error.statusCode = 400;
            throw error;
          }
        }
        employee.scheduleId = new mongoose.Types.ObjectId(data.scheduleId);
      }
    }

    if (data.jobPosition !== undefined) {
      if (typeof data.jobPosition !== 'string' || !data.jobPosition.trim()) {
        const error: any = new Error('Job position cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      employee.jobPosition = data.jobPosition.trim();
    }

    if (data.employeeType !== undefined) {
      const normalizedType = normalizeEmployeeType(data.employeeType);
      if (!normalizedType) {
        const error: any = new Error(
          `Invalid employee type '${data.employeeType}'. Allowed types: ${EMPLOYEE_TYPES.join(', ')}`
        );
        error.statusCode = 400;
        throw error;
      }
      employee.employeeType = normalizedType;
    }

    if (data.status !== undefined) {
      const normalizedStatus = normalizeEmployeeStatus(data.status);
      if (!normalizedStatus) {
        const error: any = new Error(
          `Invalid employee status '${data.status}'. Allowed statuses: ${EMPLOYEE_STATUSES.join(', ')}`
        );
        error.statusCode = 400;
        throw error;
      }
      employee.status = normalizedStatus;
    }

    if (data.bankDetails !== undefined) {
      employee.bankDetails = {
        ...(employee.bankDetails || {}),
        ...data.bankDetails
      };
    }

    await employee.save();

    return (await Employee.findById(id)
      .populate('departmentId', 'name')
      .populate('managerId', 'firstName lastName employeeCode email jobPosition')) as IEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid employee ID format');
      error.statusCode = 400;
      throw error;
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      const error: any = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    const subordinateCount = await Employee.countDocuments({ managerId: id });
    if (subordinateCount > 0) {
      const error: any = new Error(
        `Cannot delete employee because they are assigned as manager to ${subordinateCount} employee(s)`
      );
      error.statusCode = 409;
      throw error;
    }

    await Employee.findByIdAndDelete(id);
  }
}

export const employeeService = new EmployeeService();
