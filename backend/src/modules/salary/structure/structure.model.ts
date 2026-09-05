import mongoose, { Document, Schema } from 'mongoose';

export interface ISalaryStructure extends Document {
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const salaryStructureSchema = new Schema<ISalaryStructure>(
  {
    name: {
      type: String,
      required: [true, 'Salary structure name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Salary structure code is required'],
      unique: true,
      trim: true
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

export const SalaryStructure = mongoose.model<ISalaryStructure>(
  'SalaryStructure',
  salaryStructureSchema
);
