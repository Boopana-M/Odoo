import mongoose, { Document, Schema, Types } from 'mongoose';

export const TIMEOFF_REQUEST_STATUSES = ['Pending', 'Approved', 'Refused'] as const;
export type TimeOffRequestStatus = typeof TIMEOFF_REQUEST_STATUSES[number];

export interface ITimeOffRequest extends Document {
  employeeId: Types.ObjectId;
  timeOffTypeId: Types.ObjectId;
  allocationId?: Types.ObjectId | null;
  startDate: Date;
  endDate: Date;
  duration: number;
  status: TimeOffRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const timeOffRequestSchema = new Schema<ITimeOffRequest>(
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
    allocationId: {
      type: Schema.Types.ObjectId,
      ref: 'TimeOffAllocation',
      default: null
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0.01, 'Duration must be greater than zero']
    },
    status: {
      type: String,
      enum: {
        values: TIMEOFF_REQUEST_STATUSES,
        message: '{VALUE} is not a valid time off request status'
      },
      default: 'Pending'
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'timeOffRequests'
  }
);

timeOffRequestSchema.index({ employeeId: 1 });
timeOffRequestSchema.index({ timeOffTypeId: 1 });
timeOffRequestSchema.index({ allocationId: 1 });
timeOffRequestSchema.index({ status: 1 });
timeOffRequestSchema.index({ startDate: 1, endDate: 1 });

export const TimeOffRequest = mongoose.model<ITimeOffRequest>(
  'TimeOffRequest',
  timeOffRequestSchema
);
