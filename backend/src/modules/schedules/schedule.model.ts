import mongoose, { Document, Schema } from 'mongoose';

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export const SCHEDULE_TYPES = ['Standard', 'Flexible', 'Shift', 'Full-Time', 'Part-Time'] as const;
export type ScheduleType = typeof SCHEDULE_TYPES[number] | string;

export interface IDailySchedule {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  breakHours: number;
}

export interface IWorkingSchedule extends Document {
  name: string;
  type: string;
  weeklyPattern: IDailySchedule[];
  weeklyHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const dailyScheduleSchema = new Schema<IDailySchedule>(
  {
    day: {
      type: String,
      enum: {
        values: DAYS_OF_WEEK,
        message: '{VALUE} is not a valid day of the week'
      },
      required: [true, 'Day is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format (e.g., 09:00)']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format (e.g., 17:00)']
    },
    breakHours: {
      type: Number,
      default: 0,
      min: [0, 'Break hours cannot be negative']
    }
  },
  { _id: false }
);

const workingScheduleSchema = new Schema<IWorkingSchedule>(
  {
    name: {
      type: String,
      required: [true, 'Schedule name is required'],
      unique: true,
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Schedule type is required'],
      trim: true,
      default: 'Standard'
    },
    weeklyPattern: {
      type: [dailyScheduleSchema],
      default: []
    },
    weeklyHours: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Weekly hours cannot be negative']
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'workingSchedules'
  }
);

export const WorkingSchedule = mongoose.model<IWorkingSchedule>('WorkingSchedule', workingScheduleSchema);
