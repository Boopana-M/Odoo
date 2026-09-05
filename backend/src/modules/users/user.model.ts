import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = [
  'Employee',
  'HR Manager',
  'HR Payroll User',
  'HR Payroll Manager',
  'Admin'
] as const;

export type UserRole = typeof USER_ROLES[number];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
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
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a valid user role'
      },
      required: [true, 'Role is required'],
      default: 'Employee'
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', userSchema);
