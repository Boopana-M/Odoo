import mongoose, { Document, Schema } from 'mongoose';

export const TIMEOFF_UNITS = ['Days', 'Hours'] as const;
export type TimeOffUnit = typeof TIMEOFF_UNITS[number];

export interface ITimeOffType extends Document {
  name: string;
  unit: TimeOffUnit;
  allocationRequired: boolean;
  approvalRequired: boolean;
  payrollIntegration: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const timeOffTypeSchema = new Schema<ITimeOffType>(
  {
    name: {
      type: String,
      required: [true, 'Time off type name is required'],
      unique: true,
      trim: true
    },
    unit: {
      type: String,
      enum: {
        values: TIMEOFF_UNITS,
        message: '{VALUE} is not a valid unit. Allowed units: Days, Hours'
      },
      required: [true, 'Unit is required'],
      default: 'Days'
    },
    allocationRequired: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: true
    },
    payrollIntegration: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const TimeOffType = mongoose.model<ITimeOffType>('TimeOffType', timeOffTypeSchema);
