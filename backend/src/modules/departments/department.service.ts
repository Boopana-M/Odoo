import mongoose from 'mongoose';
import { Department, IDepartment } from './department.model';

export class DepartmentService {
  async createDepartment(data: { name: string }): Promise<IDepartment> {
    if (!data || !data.name || typeof data.name !== 'string' || !data.name.trim()) {
      const error: any = new Error('Department name is required');
      error.statusCode = 400;
      throw error;
    }

    const trimmedName = data.name.trim();

    const existing = await Department.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existing) {
      const error: any = new Error(`Department with name '${trimmedName}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    const department = new Department({ name: trimmedName });
    return await department.save();
  }

  async getAllDepartments(): Promise<IDepartment[]> {
    return await Department.find().sort({ name: 1 });
  }

  async getDepartmentById(id: string): Promise<IDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid department ID format');
      error.statusCode = 400;
      throw error;
    }

    const department = await Department.findById(id);
    if (!department) {
      const error: any = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }

    return department;
  }

  async updateDepartment(id: string, data: { name: string }): Promise<IDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid department ID format');
      error.statusCode = 400;
      throw error;
    }

    if (!data || !data.name || typeof data.name !== 'string' || !data.name.trim()) {
      const error: any = new Error('Department name is required');
      error.statusCode = 400;
      throw error;
    }

    const department = await Department.findById(id);
    if (!department) {
      const error: any = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }

    const trimmedName = data.name.trim();

    const existing = await Department.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existing) {
      const error: any = new Error(`Department with name '${trimmedName}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    department.name = trimmedName;
    return await department.save();
  }

  async deleteDepartment(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid department ID format');
      error.statusCode = 400;
      throw error;
    }

    const department = await Department.findById(id);
    if (!department) {
      const error: any = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }

    const EmployeeModel = mongoose.models.Employee;
    if (EmployeeModel) {
      const employeeCount = await EmployeeModel.countDocuments({ departmentId: id });
      if (employeeCount > 0) {
        const error: any = new Error(`Cannot delete department because ${employeeCount} employee(s) are assigned to it`);
        error.statusCode = 409;
        throw error;
      }
    }

    await Department.findByIdAndDelete(id);
  }
}

export const departmentService = new DepartmentService();
