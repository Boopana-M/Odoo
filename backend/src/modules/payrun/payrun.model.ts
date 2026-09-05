import mongoose, { Document, Schema, Types } from 'mongoose';

export const PAYRUN_STATUSES = ['Draft', 'Computed', 'Validated', 'Paid', 'Cancelled'] as const;
export type PayrunStatus = typeof PAYRUN_STATUSES[number];

export interface IPayrunWarning {
  type: string;
  message: string;
  employeeId?: Types.ObjectId | null;
}

export interface IPayrun extends Document {
  name: string;
  salaryStructureId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  employeeIds: Types.ObjectId[];
  payslipIds: Types.ObjectId[];
  status: PayrunStatus;
  warnings: IPayrunWarning[];
  createdAt: Date;
  updatedAt: Date;
}

const payrunWarningSchema = new Schema<IPayrunWarning>(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null }
  },
  { _id: false }
);

const payrunSchema = new Schema<IPayrun>(
  {
    name: {
      type: String,
      required: [true, 'Payrun name is required'],
      trim: true
    },
    salaryStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure is required']
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required']
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required']
    },
    employeeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
      }
    ],
    payslipIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Payslip',
        default: []
      }
    ],
    status: {
      type: String,
      enum: {
        values: PAYRUN_STATUSES,
        message: '{VALUE} is not a valid payrun status'
      },
      default: 'Draft'
    },
    warnings: {
      type: [payrunWarningSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

payrunSchema.index({ salaryStructureId: 1 });
payrunSchema.index({ periodStart: 1, periodEnd: 1 });
payrunSchema.index({ status: 1 });

export const Payrun = mongoose.model<IPayrun>('Payrun', payrunSchema);
