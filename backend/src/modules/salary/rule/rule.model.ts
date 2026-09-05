import mongoose, { Document, Schema, Types } from 'mongoose';

export const SALARY_RULE_CATEGORIES = [
  'Basic',
  'Allowances',
  'Gross',
  'Deductions',
  'Net'
] as const;
export type SalaryRuleCategory = typeof SALARY_RULE_CATEGORIES[number];

export const COMPUTATION_METHODS = ['Fixed', 'Percentage', 'Formula'] as const;
export type ComputationMethod = typeof COMPUTATION_METHODS[number];

export interface ISalaryRule extends Document {
  salaryStructureId: Types.ObjectId;
  name: string;
  code: string;
  category: SalaryRuleCategory;
  sequence: number;
  computationMethod: ComputationMethod;
  amount?: number | null;
  percentage?: number | null;
  formulaExpression?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const salaryRuleSchema = new Schema<ISalaryRule>(
  {
    salaryStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure ID is required']
    },
    name: {
      type: String,
      required: [true, 'Salary rule name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Salary rule code is required'],
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      enum: {
        values: SALARY_RULE_CATEGORIES,
        message: '{VALUE} is not a valid salary rule category'
      },
      required: [true, 'Salary rule category is required']
    },
    sequence: {
      type: Number,
      required: [true, 'Sequence is required'],
      default: 50,
      min: [0, 'Sequence cannot be negative']
    },
    computationMethod: {
      type: String,
      enum: {
        values: COMPUTATION_METHODS,
        message: '{VALUE} is not a valid computation method'
      },
      required: [true, 'Computation method is required']
    },
    amount: {
      type: Number,
      default: null
    },
    percentage: {
      type: Number,
      default: null
    },
    formulaExpression: {
      type: String,
      trim: true,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'salaryRules'
  }
);

// Compound index to ensure rule code is unique per Salary Structure
salaryRuleSchema.index({ salaryStructureId: 1, code: 1 }, { unique: true });

// Index for ordered retrieval by sequence
salaryRuleSchema.index({ salaryStructureId: 1, sequence: 1 });

export const SalaryRule = mongoose.model<ISalaryRule>('SalaryRule', salaryRuleSchema);
