import mongoose from 'mongoose';
import { TimeOffType, ITimeOffType } from './timeoff-type.model';
import { CreateTimeOffTypeDTO, UpdateTimeOffTypeDTO, validateTimeOffTypeInput } from './timeoff-type.validation';

export class TimeOffTypeService {
  async createType(data: CreateTimeOffTypeDTO): Promise<ITimeOffType> {
    const validated = validateTimeOffTypeInput(data, false);

    const existing = await TimeOffType.findOne({
      name: new RegExp(`^${validated.name?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });
    if (existing) {
      const error: any = new Error(`Time off type with name '${validated.name}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    const typeDoc = new TimeOffType({
      name: validated.name,
      unit: validated.unit,
      allocationRequired: validated.allocationRequired !== undefined ? validated.allocationRequired : true,
      approvalRequired: validated.approvalRequired !== undefined ? validated.approvalRequired : true,
      payrollIntegration: validated.payrollIntegration !== undefined ? validated.payrollIntegration : false
    });

    return await typeDoc.save();
  }

  async getAllTypes(): Promise<ITimeOffType[]> {
    return await TimeOffType.find().sort({ createdAt: -1 });
  }

  async getTypeById(id: string): Promise<ITimeOffType> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid time off type ID format');
      error.statusCode = 400;
      throw error;
    }

    const typeDoc = await TimeOffType.findById(id);
    if (!typeDoc) {
      const error: any = new Error('Time off type not found');
      error.statusCode = 404;
      throw error;
    }

    return typeDoc;
  }

  async updateType(id: string, data: UpdateTimeOffTypeDTO): Promise<ITimeOffType> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid time off type ID format');
      error.statusCode = 400;
      throw error;
    }

    const typeDoc = await TimeOffType.findById(id);
    if (!typeDoc) {
      const error: any = new Error('Time off type not found');
      error.statusCode = 404;
      throw error;
    }

    const validated = validateTimeOffTypeInput(data, true);

    if (validated.name && validated.name.toLowerCase() !== typeDoc.name.toLowerCase()) {
      const existing = await TimeOffType.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${validated.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      });
      if (existing) {
        const error: any = new Error(`Time off type with name '${validated.name}' already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    Object.assign(typeDoc, validated);
    return await typeDoc.save();
  }

  async deleteType(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid time off type ID format');
      error.statusCode = 400;
      throw error;
    }

    const typeDoc = await TimeOffType.findById(id);
    if (!typeDoc) {
      const error: any = new Error('Time off type not found');
      error.statusCode = 404;
      throw error;
    }

    await TimeOffType.findByIdAndDelete(id);
  }
}

export const timeOffTypeService = new TimeOffTypeService();
