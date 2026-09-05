import mongoose, { Document, Schema, Types } from 'mongoose';

export const PAYSLIP_STATUSES = ['Draft', 'Computed', 'Validated', 'Paid', 'Cancelled'] as const;
export type PayslipStatus = typeof PAYSLIP_STATUSES[number];

export interface IPayslipLine extends Document {
  payslipId: Types.ObjectId;
  salaryRuleId: Types.ObjectId;
  name: string;
  code: string;
  category: string;
  sequence: number;
  calculatedAmount: number;
  createdAt: Date;
}

export interface IPayslip extends Document {
  employeeId: Types.ObjectId;
  payrunId: Types.ObjectId;
  contractId: Types.ObjectId;
  salaryStructureId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  status: PayslipStatus;
  workedDays: number;
  basic: number;
  allowances: number;
  gross: number;
  deductions: number;
  net: number;
  pdfReference?: string | null;
  emailStatus?: string | null;
  lines: IPayslipLine[];
  createdAt: Date;
  updatedAt: Date;
}

export const payslipLineSchema = new Schema<IPayslipLine>(
  {
    payslipId: {
      type: Schema.Types.ObjectId,
      ref: 'Payslip',
      default: null,
      index: true
    },
    salaryRuleId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryRule',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    sequence: {
      type: Number,
      required: true,
      default: 50
    },
    calculatedAmount: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'payslipLines'
  }
);

payslipLineSchema.index({ payslipId: 1, sequence: 1 });

export const PayslipLine = mongoose.model<IPayslipLine>('PayslipLine', payslipLineSchema);

const payslipSchema = new Schema<IPayslip>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },
    payrunId: {
      type: Schema.Types.ObjectId,
      ref: 'Payrun',
      required: [true, 'Payrun ID is required'],
      index: true
    },
    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: [true, 'Contract ID is required']
    },
    salaryStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure ID is required']
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required']
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required']
    },
    status: {
      type: String,
      enum: {
        values: PAYSLIP_STATUSES,
        message: '{VALUE} is not a valid payslip status'
      },
      default: 'Computed'
    },
    workedDays: {
      type: Number,
      default: 0,
      min: [0, 'Worked days cannot be negative']
    },
    basic: {
      type: Number,
      required: true,
      default: 0
    },
    allowances: {
      type: Number,
      required: true,
      default: 0
    },
    gross: {
      type: Number,
      required: true,
      default: 0
    },
    deductions: {
      type: Number,
      required: true,
      default: 0
    },
    net: {
      type: Number,
      required: true,
      default: 0
    },
    pdfReference: {
      type: String,
      default: null
    },
    emailStatus: {
      type: String,
      default: null
    },
    lines: {
      type: [payslipLineSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'payslips'
  }
);

// Compound unique index so one employee only has one payslip per payrun
payslipSchema.index({ payrunId: 1, employeeId: 1 }, { unique: true });
payslipSchema.index({ employeeId: 1, periodStart: 1, periodEnd: 1 });
payslipSchema.index({ status: 1 });

export const Payslip = mongoose.model<IPayslip>('Payslip', payslipSchema);
