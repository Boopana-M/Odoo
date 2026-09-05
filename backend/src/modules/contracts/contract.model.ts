import mongoose, { Document, Schema, Types } from 'mongoose';

export const CONTRACT_STATUSES = ['Draft', 'Active', 'Closed', 'Cancelled'] as const;
export type ContractStatus = typeof CONTRACT_STATUSES[number];

export interface IContract extends Document {
  employeeId: Types.ObjectId;
  startDate: Date;
  endDate?: Date | null;
  departmentId: Types.ObjectId;
  jobPosition: string;
  wage: number;
  salaryStructureId?: Types.ObjectId | null;
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
}

const contractSchema = new Schema<IContract>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      default: null
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required']
    },
    jobPosition: {
      type: String,
      required: [true, 'Job position is required'],
      trim: true
    },
    wage: {
      type: Number,
      required: [true, 'Wage is required'],
      min: [0, 'Wage cannot be negative']
    },
    salaryStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null
    },
    status: {
      type: String,
      enum: {
        values: CONTRACT_STATUSES,
        message: '{VALUE} is not a valid contract status'
      },
      default: 'Active'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

contractSchema.index({ employeeId: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ startDate: 1, endDate: 1 });

export const Contract = mongoose.model<IContract>('Contract', contractSchema);
