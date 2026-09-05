import mongoose from 'mongoose';
import { TimeOffAllocation, ITimeOffAllocation } from './timeoff-allocation.model';
import { TimeOffType } from '../type/timeoff-type.model';
import { CreateAllocationDTO, UpdateAllocationDTO, validateAllocationInput } from './timeoff-allocation.validation';

export interface AllocationFilterQuery {
  employeeId?: string;
  timeOffTypeId?: string;
  approvalStatus?: string;
}

export interface AvailableAllocationResult {
  availableAmount: number;
  allocationRequired: boolean;
  unit: string;
  allocations: ITimeOffAllocation[];
}

export class TimeOffAllocationService {
  async createAllocation(data: CreateAllocationDTO): Promise<ITimeOffAllocation> {
    const validated = await validateAllocationInput(data, false);

    const takenAmount = 0;
    const remainingAmount = validated.allocatedAmount! - takenAmount;

    if (remainingAmount < 0) {
      const error: any = new Error('Remaining amount cannot be negative');
      error.statusCode = 400;
      throw error;
    }

    const allocation = new TimeOffAllocation({
      employeeId: validated.employeeId,
      timeOffTypeId: validated.timeOffTypeId,
      allocatedAmount: validated.allocatedAmount,
      takenAmount,
      remainingAmount,
      validFrom: validated.validFrom,
      validTo: validated.validTo,
      approvalStatus: validated.approvalStatus
    });

    const saved = await allocation.save();

    return (await TimeOffAllocation.findById(saved._id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')) as ITimeOffAllocation;
  }

  async getAllAllocations(filterQuery: AllocationFilterQuery = {}): Promise<ITimeOffAllocation[]> {
    const query: Record<string, any> = {};

    if (filterQuery.employeeId) {
      if (mongoose.Types.ObjectId.isValid(filterQuery.employeeId)) {
        query.employeeId = new mongoose.Types.ObjectId(filterQuery.employeeId);
      }
    }

    if (filterQuery.timeOffTypeId) {
      if (mongoose.Types.ObjectId.isValid(filterQuery.timeOffTypeId)) {
        query.timeOffTypeId = new mongoose.Types.ObjectId(filterQuery.timeOffTypeId);
      }
    }

    if (filterQuery.approvalStatus) {
      query.approvalStatus = filterQuery.approvalStatus;
    }

    return await TimeOffAllocation.find(query)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')
      .sort({ createdAt: -1 });
  }

  async getAllocationById(id: string): Promise<ITimeOffAllocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid allocation ID format');
      error.statusCode = 400;
      throw error;
    }

    const allocation = await TimeOffAllocation.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration');

    if (!allocation) {
      const error: any = new Error('Time off allocation not found');
      error.statusCode = 404;
      throw error;
    }

    return allocation;
  }

  async updateAllocation(id: string, data: UpdateAllocationDTO): Promise<ITimeOffAllocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid allocation ID format');
      error.statusCode = 400;
      throw error;
    }

    const existing = await TimeOffAllocation.findById(id);
    if (!existing) {
      const error: any = new Error('Time off allocation not found');
      error.statusCode = 404;
      throw error;
    }

    const validated = await validateAllocationInput(data, true);

    const targetAllocated = validated.allocatedAmount !== undefined ? validated.allocatedAmount : existing.allocatedAmount;
    const targetTaken = validated.takenAmount !== undefined ? validated.takenAmount : existing.takenAmount;
    const calculatedRemaining = targetAllocated - targetTaken;

    if (calculatedRemaining < 0) {
      const error: any = new Error('Remaining amount cannot become negative');
      error.statusCode = 400;
      throw error;
    }

    Object.assign(existing, validated);
    existing.allocatedAmount = targetAllocated;
    existing.takenAmount = targetTaken;
    existing.remainingAmount = calculatedRemaining;

    await existing.save();

    return (await TimeOffAllocation.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')) as ITimeOffAllocation;
  }

  async approveAllocation(id: string): Promise<ITimeOffAllocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid allocation ID format');
      error.statusCode = 400;
      throw error;
    }

    const allocation = await TimeOffAllocation.findById(id);
    if (!allocation) {
      const error: any = new Error('Time off allocation not found');
      error.statusCode = 404;
      throw error;
    }

    allocation.approvalStatus = 'Approved';
    await allocation.save();

    return (await TimeOffAllocation.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')) as ITimeOffAllocation;
  }

  async getAvailableAllocation(
    employeeId: string,
    timeOffTypeId: string,
    dateInput?: string | Date
  ): Promise<AvailableAllocationResult> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error: any = new Error('Invalid employee ID format');
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(timeOffTypeId)) {
      const error: any = new Error('Invalid time off type ID format');
      error.statusCode = 400;
      throw error;
    }

    const timeOffType = await TimeOffType.findById(timeOffTypeId);
    if (!timeOffType) {
      const error: any = new Error('Time off type not found');
      error.statusCode = 404;
      throw error;
    }

    if (!timeOffType.allocationRequired) {
      return {
        availableAmount: Number.MAX_SAFE_INTEGER,
        allocationRequired: false,
        unit: timeOffType.unit,
        allocations: []
      };
    }

    const targetDate = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(targetDate.getTime())) {
      const error: any = new Error('Invalid target date format');
      error.statusCode = 400;
      throw error;
    }

    const approvedAllocations = await TimeOffAllocation.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      timeOffTypeId: new mongoose.Types.ObjectId(timeOffTypeId),
      approvalStatus: 'Approved',
      validFrom: { $lte: targetDate },
      validTo: { $gte: targetDate },
      remainingAmount: { $gt: 0 }
    }).sort({ validTo: 1 });

    const totalAvailable = approvedAllocations.reduce((sum, alloc) => sum + alloc.remainingAmount, 0);

    return {
      availableAmount: totalAvailable,
      allocationRequired: true,
      unit: timeOffType.unit,
      allocations: approvedAllocations
    };
  }
}

export const timeOffAllocationService = new TimeOffAllocationService();
