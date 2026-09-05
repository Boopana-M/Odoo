import mongoose from 'mongoose';
import { WorkingSchedule, IWorkingSchedule } from './schedule.model';
import { CreateScheduleInput, UpdateScheduleInput, validateAndCalculateSchedule } from './schedule.validation';
import { Employee } from '../employees/employee.model';

export class ScheduleService {
  async createSchedule(input: CreateScheduleInput): Promise<IWorkingSchedule> {
    const validatedData = validateAndCalculateSchedule(input, false);

    const existing = await WorkingSchedule.findOne({
      name: { $regex: new RegExp(`^${validatedData.name!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existing) {
      const error: any = new Error(`Working schedule with name '${validatedData.name}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    const schedule = new WorkingSchedule(validatedData);
    return await schedule.save();
  }

  async getAllSchedules(): Promise<IWorkingSchedule[]> {
    return await WorkingSchedule.find().sort({ name: 1 });
  }

  async getScheduleById(id: string): Promise<IWorkingSchedule> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid working schedule ID format');
      error.statusCode = 400;
      throw error;
    }

    const schedule = await WorkingSchedule.findById(id);
    if (!schedule) {
      const error: any = new Error('Working schedule not found');
      error.statusCode = 404;
      throw error;
    }

    return schedule;
  }

  async updateSchedule(id: string, input: UpdateScheduleInput): Promise<IWorkingSchedule> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid working schedule ID format');
      error.statusCode = 400;
      throw error;
    }

    const schedule = await WorkingSchedule.findById(id);
    if (!schedule) {
      const error: any = new Error('Working schedule not found');
      error.statusCode = 404;
      throw error;
    }

    const validatedData = validateAndCalculateSchedule(input, true);

    if (validatedData.name) {
      const existing = await WorkingSchedule.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${validatedData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (existing) {
        const error: any = new Error(`Working schedule with name '${validatedData.name}' already exists`);
        error.statusCode = 409;
        throw error;
      }
      schedule.name = validatedData.name;
    }

    if (validatedData.type !== undefined) {
      schedule.type = validatedData.type;
    }

    if (validatedData.weeklyPattern !== undefined) {
      schedule.weeklyPattern = validatedData.weeklyPattern;
      schedule.weeklyHours = validatedData.weeklyHours!;
    }

    return await schedule.save();
  }

  async deleteSchedule(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid working schedule ID format');
      error.statusCode = 400;
      throw error;
    }

    const schedule = await WorkingSchedule.findById(id);
    if (!schedule) {
      const error: any = new Error('Working schedule not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if any employees reference this schedule
    const employeeCount = await Employee.countDocuments({ scheduleId: id });
    if (employeeCount > 0) {
      const error: any = new Error(
        `Cannot delete working schedule because ${employeeCount} employee(s) are assigned to it`
      );
      error.statusCode = 409;
      throw error;
    }

    await WorkingSchedule.findByIdAndDelete(id);
  }
}

export const scheduleService = new ScheduleService();
