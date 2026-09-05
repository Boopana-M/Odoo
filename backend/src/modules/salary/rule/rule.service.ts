import mongoose from 'mongoose';
import { SalaryRule, ISalaryRule } from './rule.model';
import { SalaryStructure } from '../structure/structure.model';
import {
  CreateSalaryRuleDTO,
  UpdateSalaryRuleDTO,
  validateSalaryRuleInput,
  normalizeCategory,
  normalizeComputationMethod
} from './rule.validation';

export interface SalaryRuleFilterQuery {
  salaryStructureId?: string;
  category?: string;
  computationMethod?: string;
  isActive?: string | boolean;
}

export class SalaryRuleService {
  async createRule(data: CreateSalaryRuleDTO): Promise<ISalaryRule> {
    const validated = validateSalaryRuleInput(data, false);

    // Verify that the referenced salary structure exists
    const structureExists = await SalaryStructure.findById(validated.salaryStructureId);
    if (!structureExists) {
      const error: any = new Error('Referenced salary structure does not exist');
      error.statusCode = 404;
      throw error;
    }

    // Check code uniqueness within the same salary structure (case-insensitive)
    const existing = await SalaryRule.findOne({
      salaryStructureId: validated.salaryStructureId,
      code: new RegExp(`^${validated.code?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });

    if (existing) {
      const error: any = new Error(
        `Salary rule with code '${validated.code}' already exists in this salary structure`
      );
      error.statusCode = 409;
      throw error;
    }

    const ruleDoc = new SalaryRule({
      salaryStructureId: validated.salaryStructureId,
      name: validated.name,
      code: validated.code,
      category: validated.category,
      sequence: validated.sequence !== undefined ? validated.sequence : 50,
      computationMethod: validated.computationMethod,
      amount: validated.amount !== undefined ? validated.amount : null,
      percentage: validated.percentage !== undefined ? validated.percentage : null,
      formulaExpression: validated.formulaExpression || null,
      isActive: validated.isActive !== undefined ? validated.isActive : true
    });

    const saved = await ruleDoc.save();
    return (await SalaryRule.findById(saved._id).populate(
      'salaryStructureId',
      'name code isActive'
    )) as ISalaryRule;
  }

  async getRulesByStructure(
    salaryStructureId: string,
    filterQuery: SalaryRuleFilterQuery = {}
  ): Promise<ISalaryRule[]> {
    if (!mongoose.Types.ObjectId.isValid(salaryStructureId)) {
      const error: any = new Error('Invalid salary structure ID format');
      error.statusCode = 400;
      throw error;
    }

    const structureExists = await SalaryStructure.findById(salaryStructureId);
    if (!structureExists) {
      const error: any = new Error('Salary structure not found');
      error.statusCode = 404;
      throw error;
    }

    const query: Record<string, any> = {
      salaryStructureId: new mongoose.Types.ObjectId(salaryStructureId)
    };

    if (filterQuery.category) {
      const normalizedCat = normalizeCategory(filterQuery.category);
      if (normalizedCat) {
        query.category = normalizedCat;
      }
    }

    if (filterQuery.computationMethod) {
      const normalizedMethod = normalizeComputationMethod(filterQuery.computationMethod);
      if (normalizedMethod) {
        query.computationMethod = normalizedMethod;
      }
    }

    if (filterQuery.isActive !== undefined) {
      query.isActive =
        filterQuery.isActive === 'true' ||
        filterQuery.isActive === true ||
        filterQuery.isActive === '1';
    }

    // Always sort by sequence ascending for payroll execution ordering
    return await SalaryRule.find(query)
      .populate('salaryStructureId', 'name code')
      .sort({ sequence: 1, createdAt: 1 });
  }

  async getAllRules(filterQuery: SalaryRuleFilterQuery = {}): Promise<ISalaryRule[]> {
    const query: Record<string, any> = {};

    if (filterQuery.salaryStructureId) {
      if (mongoose.Types.ObjectId.isValid(filterQuery.salaryStructureId)) {
        query.salaryStructureId = new mongoose.Types.ObjectId(filterQuery.salaryStructureId);
      }
    }

    if (filterQuery.category) {
      const normalizedCat = normalizeCategory(filterQuery.category);
      if (normalizedCat) {
        query.category = normalizedCat;
      }
    }

    if (filterQuery.computationMethod) {
      const normalizedMethod = normalizeComputationMethod(filterQuery.computationMethod);
      if (normalizedMethod) {
        query.computationMethod = normalizedMethod;
      }
    }

    if (filterQuery.isActive !== undefined) {
      query.isActive =
        filterQuery.isActive === 'true' ||
        filterQuery.isActive === true ||
        filterQuery.isActive === '1';
    }

    return await SalaryRule.find(query)
      .populate('salaryStructureId', 'name code')
      .sort({ sequence: 1, createdAt: -1 });
  }

  async getRuleById(id: string): Promise<ISalaryRule> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid salary rule ID format');
      error.statusCode = 400;
      throw error;
    }

    const rule = await SalaryRule.findById(id).populate('salaryStructureId', 'name code');
    if (!rule) {
      const error: any = new Error('Salary rule not found');
      error.statusCode = 404;
      throw error;
    }

    return rule;
  }

  async updateRule(id: string, data: UpdateSalaryRuleDTO): Promise<ISalaryRule> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid salary rule ID format');
      error.statusCode = 400;
      throw error;
    }

    const ruleDoc = await SalaryRule.findById(id);
    if (!ruleDoc) {
      const error: any = new Error('Salary rule not found');
      error.statusCode = 404;
      throw error;
    }

    const validated = validateSalaryRuleInput(data, true, {
      computationMethod: ruleDoc.computationMethod,
      amount: ruleDoc.amount,
      percentage: ruleDoc.percentage,
      formulaExpression: ruleDoc.formulaExpression
    });

    const targetStructureId = validated.salaryStructureId || ruleDoc.salaryStructureId;
    const targetCode = validated.code || ruleDoc.code;

    // If structure is changing, ensure target structure exists
    if (validated.salaryStructureId && validated.salaryStructureId.toString() !== ruleDoc.salaryStructureId.toString()) {
      const structureExists = await SalaryStructure.findById(validated.salaryStructureId);
      if (!structureExists) {
        const error: any = new Error('Referenced salary structure does not exist');
        error.statusCode = 404;
        throw error;
      }
    }

    // Check code uniqueness within structure if code or structure changed
    if (
      (validated.code && validated.code.toLowerCase() !== ruleDoc.code.toLowerCase()) ||
      (validated.salaryStructureId && validated.salaryStructureId.toString() !== ruleDoc.salaryStructureId.toString())
    ) {
      const existing = await SalaryRule.findOne({
        _id: { $ne: id },
        salaryStructureId: targetStructureId,
        code: new RegExp(`^${targetCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      });
      if (existing) {
        const error: any = new Error(
          `Salary rule with code '${targetCode}' already exists in this salary structure`
        );
        error.statusCode = 409;
        throw error;
      }
    }

    Object.assign(ruleDoc, validated);
    await ruleDoc.save();

    return (await SalaryRule.findById(id).populate(
      'salaryStructureId',
      'name code'
    )) as ISalaryRule;
  }

  async deleteRule(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid salary rule ID format');
      error.statusCode = 400;
      throw error;
    }

    const ruleDoc = await SalaryRule.findById(id);
    if (!ruleDoc) {
      const error: any = new Error('Salary rule not found');
      error.statusCode = 404;
      throw error;
    }

    await SalaryRule.findByIdAndDelete(id);
  }
}

export const salaryRuleService = new SalaryRuleService();
