import mongoose, { Document, Schema, Types } from 'mongoose';

export const ALLOCATION_APPROVAL_STATUSES = ['Pending', 'Approved', 'Refused'] as const;
export type AllocationApprovalStatus = typeof ALLOCATION_APPROVAL_STATUSES[number];

export interface ITimeOffAllocation extends Document {
  employeeId: Types.ObjectId;
  timeOffTypeId: Types.ObjectId;
  allocatedAmount: number;
  takenAmount: number;
  remainingAmount: number;
  validFrom: Date;
  validTo: Date;
  approvalStatus: AllocationApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const timeOffAllocationSchema = new Schema<ITimeOffAllocation>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    timeOffTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'TimeOffType',
      required: [true, 'Time off type reference is required']
    },
    allocatedAmount: {
      type: Number,
      required: [true, 'Allocated amount is required'],
      min: [0.01, 'Allocated amount must be greater than zero']
    },
    takenAmount: {
      type: Number,
      default: 0,
      min: [0, 'Taken amount cannot be negative']
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Remaining amount is required'],
      min: [0, 'Remaining amount cannot be negative']
    },
    validFrom: {
      type: Date,
      required: [true, 'Validity start date is required']
    },
    validTo: {
      type: Date,
      required: [true, 'Validity end date is required']
    },
    approvalStatus: {
      type: String,
      enum: {
        values: ALLOCATION_APPROVAL_STATUSES,
        message: '{VALUE} is not a valid approval status'
      },
      default: 'Pending'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

timeOffAllocationSchema.index({ employeeId: 1 });
timeOffAllocationSchema.index({ timeOffTypeId: 1 });
timeOffAllocationSchema.index({ approvalStatus: 1 });
timeOffAllocationSchema.index({ validFrom: 1, validTo: 1 });

export const TimeOffAllocation = mongoose.model<ITimeOffAllocation>(
  'TimeOffAllocation',
  timeOffAllocationSchema
);
