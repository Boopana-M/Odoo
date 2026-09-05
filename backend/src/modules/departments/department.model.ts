import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
