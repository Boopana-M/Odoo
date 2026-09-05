import mongoose from 'mongoose';
import {
  SALARY_RULE_CATEGORIES,
  SalaryRuleCategory,
  COMPUTATION_METHODS,
  ComputationMethod
} from './rule.model';

export interface CreateSalaryRuleDTO {
  salaryStructureId: string;
  name: string;
  code: string;
  category: string;
  sequence?: number;
  computationMethod: string;
  amount?: number | null;
  percentage?: number | null;
  formulaExpression?: string | null;
  isActive?: boolean;
  active?: boolean;
}

export interface UpdateSalaryRuleDTO {
  salaryStructureId?: string;
  name?: string;
  code?: string;
  category?: string;
  sequence?: number;
  computationMethod?: string;
  amount?: number | null;
  percentage?: number | null;
  formulaExpression?: string | null;
  isActive?: boolean;
  active?: boolean;
}

export interface ValidatedSalaryRuleInput {
  salaryStructureId?: mongoose.Types.ObjectId;
  name?: string;
  code?: string;
  category?: SalaryRuleCategory;
  sequence?: number;
  computationMethod?: ComputationMethod;
  amount?: number | null;
  percentage?: number | null;
  formulaExpression?: string | null;
  isActive?: boolean;
}

export function normalizeCategory(category?: string): SalaryRuleCategory | undefined {
  if (!category || typeof category !== 'string') return undefined;
  const trimmed = category.trim().toLowerCase();
  return SALARY_RULE_CATEGORIES.find(c => c.toLowerCase() === trimmed);
}

export function normalizeComputationMethod(method?: string): ComputationMethod | undefined {
  if (!method || typeof method !== 'string') return undefined;
  const trimmed = method.trim().toLowerCase();
  return COMPUTATION_METHODS.find(m => m.toLowerCase() === trimmed);
}

// Security check against unsafe code execution patterns in formula expressions
const UNSAFE_FORMULA_PATTERNS = [
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /\bprocess\b/i,
  /\brequire\s*\(/i,
  /\bimport\s*\(/i,
  /\bglobal\b/i,
  /\bchild_process\b/i,
  /\b__proto__\b/i,
  /\bconstructor\b/i,
  /<script/i
];

export function validateSalaryRuleInput(
  data: CreateSalaryRuleDTO | UpdateSalaryRuleDTO,
  isUpdate = false,
  existingRule?: { computationMethod: ComputationMethod; amount?: number | null; percentage?: number | null; formulaExpression?: string | null }
): ValidatedSalaryRuleInput {
  const validated: ValidatedSalaryRuleInput = {};

  // 1. salaryStructureId
  if (!isUpdate || data.salaryStructureId !== undefined) {
    if (!data.salaryStructureId || typeof data.salaryStructureId !== 'string' || !data.salaryStructureId.trim()) {
      const error: any = new Error('Salary structure ID is required');
      error.statusCode = 400;
      throw error;
    }
    if (!mongoose.Types.ObjectId.isValid(data.salaryStructureId)) {
      const error: any = new Error('Invalid salary structure ID format');
      error.statusCode = 400;
      throw error;
    }
    validated.salaryStructureId = new mongoose.Types.ObjectId(data.salaryStructureId);
  }

  // 2. name
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      const error: any = new Error('Salary rule name is required');
      error.statusCode = 400;
      throw error;
    }
    validated.name = data.name.trim();
  }

  // 3. code
  if (!isUpdate || data.code !== undefined) {
    if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
      const error: any = new Error('Salary rule code is required');
      error.statusCode = 400;
      throw error;
    }
    validated.code = data.code.trim().toUpperCase();
  }

  // 4. category
  if (!isUpdate || data.category !== undefined) {
    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      const error: any = new Error('Salary rule category is required');
      error.statusCode = 400;
      throw error;
    }
    const normalizedCategory = normalizeCategory(data.category);
    if (!normalizedCategory) {
      const error: any = new Error(
        `Invalid salary rule category '${data.category}'. Allowed categories: ${SALARY_RULE_CATEGORIES.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    validated.category = normalizedCategory;
  }

  // 5. sequence
  if (data.sequence !== undefined) {
    if (typeof data.sequence !== 'number' || isNaN(data.sequence) || data.sequence < 0) {
      const error: any = new Error('Sequence must be a valid non-negative number');
      error.statusCode = 400;
      throw error;
    }
    validated.sequence = data.sequence;
  } else if (!isUpdate) {
    validated.sequence = 50;
  }

  // 6. computationMethod
  let effectiveMethod: ComputationMethod | undefined;
  if (!isUpdate || data.computationMethod !== undefined) {
    if (!data.computationMethod || typeof data.computationMethod !== 'string' || !data.computationMethod.trim()) {
      const error: any = new Error('Computation method is required');
      error.statusCode = 400;
      throw error;
    }
    const normalizedMethod = normalizeComputationMethod(data.computationMethod);
    if (!normalizedMethod) {
      const error: any = new Error(
        `Invalid computation method '${data.computationMethod}'. Allowed methods: ${COMPUTATION_METHODS.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    validated.computationMethod = normalizedMethod;
    effectiveMethod = normalizedMethod;
  } else if (existingRule) {
    effectiveMethod = existingRule.computationMethod;
  }

  // 7. Method-specific validation
  if (effectiveMethod === 'Fixed') {
    const amountVal = data.amount !== undefined ? data.amount : (isUpdate && existingRule ? existingRule.amount : undefined);
    if (amountVal === undefined || amountVal === null || typeof amountVal !== 'number' || isNaN(amountVal)) {
      const error: any = new Error('Amount is required for Fixed computation method');
      error.statusCode = 400;
      throw error;
    }
    if (amountVal < 0) {
      const error: any = new Error('Amount cannot be negative for Fixed computation method');
      error.statusCode = 400;
      throw error;
    }
    validated.amount = amountVal;
    validated.percentage = null;
    validated.formulaExpression = null;
  } else if (effectiveMethod === 'Percentage') {
    const percentageVal = data.percentage !== undefined ? data.percentage : (isUpdate && existingRule ? existingRule.percentage : undefined);
    if (percentageVal === undefined || percentageVal === null || typeof percentageVal !== 'number' || isNaN(percentageVal)) {
      const error: any = new Error('Percentage is required for Percentage computation method');
      error.statusCode = 400;
      throw error;
    }
    if (percentageVal < 0) {
      const error: any = new Error('Percentage cannot be negative for Percentage computation method');
      error.statusCode = 400;
      throw error;
    }
    validated.percentage = percentageVal;
    validated.amount = null;
    validated.formulaExpression = null;
  } else if (effectiveMethod === 'Formula') {
    const formulaVal = data.formulaExpression !== undefined ? data.formulaExpression : (isUpdate && existingRule ? existingRule.formulaExpression : undefined);
    if (!formulaVal || typeof formulaVal !== 'string' || !formulaVal.trim()) {
      const error: any = new Error('Formula expression is required for Formula computation method');
      error.statusCode = 400;
      throw error;
    }
    const trimmedFormula = formulaVal.trim();
    for (const pattern of UNSAFE_FORMULA_PATTERNS) {
      if (pattern.test(trimmedFormula)) {
        const error: any = new Error('Formula expression contains invalid or unsafe expressions');
        error.statusCode = 400;
        throw error;
      }
    }
    validated.formulaExpression = trimmedFormula;
    validated.amount = null;
    validated.percentage = null;
  }

  // 8. isActive / active
  const activeInput = data.isActive !== undefined ? data.isActive : data.active;
  if (activeInput !== undefined) {
    if (typeof activeInput !== 'boolean') {
      const error: any = new Error('active status must be a boolean value');
      error.statusCode = 400;
      throw error;
    }
    validated.isActive = activeInput;
  } else if (!isUpdate) {
    validated.isActive = true;
  }

  return validated;
}
