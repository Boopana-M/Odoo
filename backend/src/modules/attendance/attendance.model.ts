import mongoose, { Document, Schema, Types } from 'mongoose';

export const ATTENDANCE_STATUSES = [
  'Present',
  'Late',
  'Absent',
  'Overtime',
  'Missing check-out',
  'Manual edits',
  'On Leave',
  'Half Day'
] as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export interface IAttendance extends Document {
  employeeId: Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut?: Date | null;
  workedHours: number;
  status: AttendanceStatus;
  isCorrected: boolean;
  correctedBy?: Types.ObjectId | null;
  correctionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required']
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in time is required']
    },
    checkOut: {
      type: Date,
      default: null
    },
    workedHours: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Worked hours cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUSES,
        message: '{VALUE} is not a valid attendance status'
      },
      default: 'Present'
    },
    isCorrected: {
      type: Boolean,
      default: false
    },
    correctedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    correctionReason: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'attendances'
  }
);

attendanceSchema.index({ employeeId: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ employeeId: 1, date: 1 });
attendanceSchema.index({ status: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
