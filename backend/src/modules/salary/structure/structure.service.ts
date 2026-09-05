import mongoose from 'mongoose';
import { SalaryStructure, ISalaryStructure } from './structure.model';
import {
  CreateSalaryStructureDTO,
  UpdateSalaryStructureDTO,
  validateSalaryStructureInput
} from './structure.validation';
import { Contract } from '../../contracts/contract.model';

export class SalaryStructureService {
  async createStructure(data: CreateSalaryStructureDTO): Promise<ISalaryStructure> {
    const validated = validateSalaryStructureInput(data, false);

    // Check code uniqueness (case-insensitive)
    const existing = await SalaryStructure.findOne({
      code: new RegExp(`^${validated.code?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });

    if (existing) {
      const error: any = new Error(`Salary structure with code '${validated.code}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    const structureDoc = new SalaryStructure({
      name: validated.name,
      code: validated.code,
      isActive: validated.isActive !== undefined ? validated.isActive : true
    });

    return await structureDoc.save();
  }

  async getAllStructures(): Promise<any[]> {
    const structures = await SalaryStructure.find().sort({ createdAt: -1 });

    // If SalaryRule model exists, populate rules for each structure
    if (mongoose.models.SalaryRule) {
      const structuresWithRules = await Promise.all(
        structures.map(async (doc) => {
          const rules = await mongoose.models.SalaryRule.find({
            salaryStructureId: doc._id
          }).sort({ sequence: 1 });

          const obj = doc.toObject();
          return {
            ...obj,
            rules: rules || []
          };
        })
      );
      return structuresWithRules;
    }

    return structures;
  }

  async getStructureById(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid salary structure ID format');
      error.statusCode = 400;
      throw error;
    }

    const structureDoc = await SalaryStructure.findById(id);
    if (!structureDoc) {
      const error: any = new Error('Salary structure not found');
      error.statusCode = 404;
      throw error;
    }

    // If SalaryRule model exists, attach related rules
    if (mongoose.models.SalaryRule) {
      const rules = await mongoose.models.SalaryRule.find({
        salaryStructureId: structureDoc._id
      }).sort({ sequence: 1 });

      const obj = structureDoc.toObject();
      return {
        ...obj,
        rules: rules || []
      };
    }

    return structureDoc;
  }

  async updateStructure(id: string, data: UpdateSalaryStructureDTO): Promise<ISalaryStructure> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid salary structure ID format');
      error.statusCode = 400;
      throw error;
    }

    const structureDoc = await SalaryStructure.findById(id);
    if (!structureDoc) {
      const error: any = new Error('Salary structure not found');
      error.statusCode = 404;
      throw error;
    }

    const validated = validateSalaryStructureInput(data, true);

    // Check code uniqueness if code is updated
    if (validated.code && validated.code.toLowerCase() !== structureDoc.code.toLowerCase()) {
      const existing = await SalaryStructure.findOne({
        _id: { $ne: id },
        code: new RegExp(`^${validated.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      });
      if (existing) {
        const error: any = new Error(`Salary structure with code '${validated.code}' already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    Object.assign(structureDoc, validated);
    return await structureDoc.save();
  }

  async deleteStructure(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid salary structure ID format');
      error.statusCode = 400;
      throw error;
    }

    const structureDoc = await SalaryStructure.findById(id);
    if (!structureDoc) {
      const error: any = new Error('Salary structure not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if referenced by Contracts
    const contractCount = await Contract.countDocuments({ salaryStructureId: id });
    if (contractCount > 0) {
      const error: any = new Error('Cannot delete salary structure as it is currently assigned to one or more contracts');
      error.statusCode = 400;
      throw error;
    }

    // Check if referenced by SalaryRules (when model exists)
    if (mongoose.models.SalaryRule) {
      const rulesCount = await mongoose.models.SalaryRule.countDocuments({ salaryStructureId: id });
      if (rulesCount > 0) {
        const error: any = new Error('Cannot delete salary structure as it contains salary rules');
        error.statusCode = 400;
        throw error;
      }
    }

    await SalaryStructure.findByIdAndDelete(id);
  }
}

export const salaryStructureService = new SalaryStructureService();
