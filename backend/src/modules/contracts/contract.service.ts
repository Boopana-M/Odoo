import mongoose from 'mongoose';
import { Contract, IContract, ContractStatus } from './contract.model';
import { CreateContractInput, UpdateContractInput, validateContractData } from './contract.validation';

export interface ContractFilterQuery {
  employeeId?: string;
  status?: string;
  departmentId?: string;
}

export class ContractService {
  private async checkActiveContractOverlap(
    employeeId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date | null | undefined,
    excludeContractId?: string
  ): Promise<void> {
    const andConditions: any[] = [
      {
        $or: [
          { endDate: null },
          { endDate: { $gte: startDate } }
        ]
      }
    ];

    if (endDate) {
      andConditions.push({ startDate: { $lte: endDate } });
    }

    const query: any = {
      employeeId,
      status: 'Active',
      $and: andConditions
    };

    if (excludeContractId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeContractId) };
    }

    const existingOverlap = await Contract.findOne(query);
    if (existingOverlap) {
      const error: any = new Error(
        'An active contract already exists for this employee with an overlapping date range'
      );
      error.statusCode = 409;
      throw error;
    }
  }

  async createContract(data: CreateContractInput): Promise<IContract> {
    const validated = await validateContractData(data, false);

    if (validated.status === 'Active') {
      await this.checkActiveContractOverlap(
        validated.employeeId!,
        validated.startDate!,
        validated.endDate
      );
    }

    const contract = new Contract(validated);
    const saved = await contract.save();

    return (await Contract.findById(saved._id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('departmentId', 'name')) as IContract;
  }

  async getAllContracts(filterQuery: ContractFilterQuery = {}): Promise<IContract[]> {
    const query: Record<string, any> = {};

    if (filterQuery.employeeId) {
      if (mongoose.Types.ObjectId.isValid(filterQuery.employeeId)) {
        query.employeeId = new mongoose.Types.ObjectId(filterQuery.employeeId);
      }
    }

    if (filterQuery.departmentId) {
      if (mongoose.Types.ObjectId.isValid(filterQuery.departmentId)) {
        query.departmentId = new mongoose.Types.ObjectId(filterQuery.departmentId);
      }
    }

    if (filterQuery.status) {
      query.status = filterQuery.status;
    }

    return await Contract.find(query)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('departmentId', 'name')
      .sort({ startDate: -1 });
  }

  async getContractById(id: string): Promise<IContract> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid contract ID format');
      error.statusCode = 400;
      throw error;
    }

    const contract = await Contract.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('departmentId', 'name');

    if (!contract) {
      const error: any = new Error('Contract not found');
      error.statusCode = 404;
      throw error;
    }

    return contract;
  }

  async updateContract(id: string, data: UpdateContractInput): Promise<IContract> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid contract ID format');
      error.statusCode = 400;
      throw error;
    }

    const existingContract = await Contract.findById(id);
    if (!existingContract) {
      const error: any = new Error('Contract not found');
      error.statusCode = 404;
      throw error;
    }

    // Pass existing dates for validation reference if not provided
    const combinedData: UpdateContractInput = {
      ...data,
      startDate: data.startDate !== undefined ? data.startDate : existingContract.startDate,
      endDate: data.endDate !== undefined ? data.endDate : existingContract.endDate
    };

    const validated = await validateContractData(combinedData, true);

    const targetStatus = validated.status || existingContract.status;
    const targetEmployeeId = validated.employeeId || existingContract.employeeId;
    const targetStartDate = validated.startDate || existingContract.startDate;
    const targetEndDate = validated.endDate !== undefined ? validated.endDate : existingContract.endDate;

    if (targetStatus === 'Active') {
      await this.checkActiveContractOverlap(
        targetEmployeeId,
        targetStartDate,
        targetEndDate,
        id
      );
    }

    Object.assign(existingContract, validated);
    await existingContract.save();

    return (await Contract.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('departmentId', 'name')) as IContract;
  }

  async deleteContract(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid contract ID format');
      error.statusCode = 400;
      throw error;
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      const error: any = new Error('Contract not found');
      error.statusCode = 404;
      throw error;
    }

    await Contract.findByIdAndDelete(id);
  }

  async findApplicableContract(
    employeeId: string,
    periodStartInput: string | Date,
    periodEndInput: string | Date
  ): Promise<IContract | null> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error: any = new Error('Invalid employee ID format');
      error.statusCode = 400;
      throw error;
    }

    const periodStart = new Date(periodStartInput);
    const periodEnd = new Date(periodEndInput);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      const error: any = new Error('Invalid payroll period dates');
      error.statusCode = 400;
      throw error;
    }

    if (periodEnd < periodStart) {
      const error: any = new Error('Payroll period end date cannot be before start date');
      error.statusCode = 400;
      throw error;
    }

    const contract = await Contract.findOne({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: 'Active',
      startDate: { $lte: periodStart },
      $or: [
        { endDate: null },
        { endDate: { $gte: periodEnd } }
      ]
    })
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('departmentId', 'name')
      .sort({ startDate: -1 });

    return contract;
  }
}

export const contractService = new ContractService();
