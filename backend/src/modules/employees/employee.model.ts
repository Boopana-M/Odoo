import mongoose, { Document, Schema, Types } from 'mongoose';

export const EMPLOYEE_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Temporary'] as const;
export type EmployeeType = typeof EMPLOYEE_TYPES[number];

export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave', 'Terminated'] as const;
export type EmployeeStatus = typeof EMPLOYEE_STATUSES[number];

export interface IBankDetails {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
}

export interface IEmployee extends Document {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: Types.ObjectId;
  managerId?: Types.ObjectId | null;
  scheduleId?: Types.ObjectId | null;
  jobPosition: string;
  employeeType: EmployeeType;
  status: EmployeeStatus;
  bankDetails?: IBankDetails;
  createdAt: Date;
  updatedAt: Date;
}

const bankDetailsSchema = new Schema<IBankDetails>(
  {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    routingNumber: { type: String, trim: true },
    swiftCode: { type: String, trim: true },
    iban: { type: String, trim: true }
  },
  { _id: false }
);

const employeeSchema = new Schema<IEmployee>(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      default: null
    },
    jobPosition: {
      type: String,
      required: [true, 'Job position is required'],
      trim: true
    },
    employeeType: {
      type: String,
      enum: {
        values: EMPLOYEE_TYPES,
        message: '{VALUE} is not a valid employee type'
      },
      default: 'Full-Time'
    },
    status: {
      type: String,
      enum: {
        values: EMPLOYEE_STATUSES,
        message: '{VALUE} is not a valid employee status'
      },
      default: 'Active'
    },
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

employeeSchema.index({ departmentId: 1 });
employeeSchema.index({ managerId: 1 });
employeeSchema.index({ employeeType: 1 });
employeeSchema.index({ status: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
