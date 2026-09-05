import mongoose from 'mongoose';
import { TimeOffRequest, ITimeOffRequest } from './request.model';
import { TimeOffType } from '../type/timeoff-type.model';
import { TimeOffAllocation } from '../allocation/timeoff-allocation.model';
import { CreateTimeOffRequestInput, validateTimeOffRequestInput } from './request.validation';
import { AuthUserPayload } from '../../../types/express';

export interface TimeOffRequestFilterQuery {
  employeeId?: string;
  timeOffTypeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export class TimeOffRequestService {
  async createRequest(
    input: CreateTimeOffRequestInput,
    currentUser?: AuthUserPayload
  ): Promise<ITimeOffRequest> {
    // Enforce employee ownership for Employee role
    if (currentUser && currentUser.role === 'Employee') {
      if (!currentUser.employeeId) {
        const error: any = new Error('No employee profile linked to this user account');
        error.statusCode = 403;
        throw error;
      }
      if (input.employeeId && input.employeeId.toString() !== currentUser.employeeId.toString()) {
        const error: any = new Error('Access forbidden: You can only create time off requests for yourself');
        error.statusCode = 403;
        throw error;
      }
      input.employeeId = currentUser.employeeId.toString();
    }

    const validated = await validateTimeOffRequestInput(input, false);
    const timeOffType = validated.timeOffTypeDoc!;
    const employeeId = validated.employeeId!;
    const duration = validated.duration!;

    // Allocation requirement check
    let matchedAllocationId: mongoose.Types.ObjectId | null = null;

    if (timeOffType.allocationRequired) {
      if (validated.allocationId) {
        // Specific allocation provided by client
        const alloc = await TimeOffAllocation.findById(validated.allocationId);
        if (!alloc) {
          const error: any = new Error('Specified time off allocation does not exist');
          error.statusCode = 400;
          throw error;
        }

        if (alloc.employeeId.toString() !== employeeId.toString()) {
          const error: any = new Error('Specified allocation does not belong to this employee');
          error.statusCode = 400;
          throw error;
        }

        if (alloc.timeOffTypeId.toString() !== timeOffType._id.toString()) {
          const error: any = new Error('Specified allocation does not match this time off type');
          error.statusCode = 400;
          throw error;
        }

        if (alloc.approvalStatus !== 'Approved') {
          const error: any = new Error('Cannot request time off against an unapproved allocation');
          error.statusCode = 400;
          throw error;
        }

        if (alloc.remainingAmount < duration) {
          const error: any = new Error(
            `Insufficient allocation balance. Available: ${alloc.remainingAmount} ${timeOffType.unit}, Requested: ${duration} ${timeOffType.unit}`
          );
          error.statusCode = 400;
          throw error;
        }

        matchedAllocationId = alloc._id as mongoose.Types.ObjectId;
      } else {
        // Find best matching approved allocation with enough balance
        const matchingAllocations = await TimeOffAllocation.find({
          employeeId,
          timeOffTypeId: timeOffType._id,
          approvalStatus: 'Approved',
          validFrom: { $lte: validated.startDate },
          validTo: { $gte: validated.endDate },
          remainingAmount: { $gte: duration }
        }).sort({ validTo: 1 });

        if (matchingAllocations.length > 0) {
          matchedAllocationId = matchingAllocations[0]._id as mongoose.Types.ObjectId;
        } else {
          // Check for helpful error messages
          const anyApproved = await TimeOffAllocation.find({
            employeeId,
            timeOffTypeId: timeOffType._id,
            approvalStatus: 'Approved',
            validFrom: { $lte: validated.startDate },
            validTo: { $gte: validated.endDate }
          });

          const totalRemaining = anyApproved.reduce((sum, a) => sum + a.remainingAmount, 0);

          if (anyApproved.length > 0) {
            const error: any = new Error(
              `Insufficient allocation balance. Available: ${totalRemaining} ${timeOffType.unit}, Requested: ${duration} ${timeOffType.unit}`
            );
            error.statusCode = 400;
            throw error;
          }

          const pendingAllocations = await TimeOffAllocation.find({
            employeeId,
            timeOffTypeId: timeOffType._id,
            approvalStatus: 'Pending'
          });

          if (pendingAllocations.length > 0) {
            const error: any = new Error('No approved allocation available for this time off type (allocations are still pending)');
            error.statusCode = 400;
            throw error;
          }

          const error: any = new Error('No approved time off allocation found for this employee, type, and dates');
          error.statusCode = 400;
          throw error;
        }
      }
    }

    // Create request as Pending (DO NOT deduct allocation yet)
    const request = new TimeOffRequest({
      employeeId,
      timeOffTypeId: timeOffType._id,
      allocationId: matchedAllocationId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      duration,
      status: 'Pending'
    });

    const saved = await request.save();

    return (await TimeOffRequest.findById(saved._id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')
      .populate('allocationId', 'allocatedAmount takenAmount remainingAmount validFrom validTo approvalStatus')) as ITimeOffRequest;
  }

  async getAllRequests(
    filterQuery: TimeOffRequestFilterQuery = {},
    currentUser?: AuthUserPayload
  ): Promise<ITimeOffRequest[]> {
    const query: Record<string, any> = {};

    // Security check: Employee can only see own requests
    if (currentUser && currentUser.role === 'Employee') {
      if (!currentUser.employeeId) {
        return [];
      }
      query.employeeId = new mongoose.Types.ObjectId(currentUser.employeeId);
    } else if (filterQuery.employeeId && mongoose.Types.ObjectId.isValid(filterQuery.employeeId)) {
      query.employeeId = new mongoose.Types.ObjectId(filterQuery.employeeId);
    }

    if (filterQuery.timeOffTypeId && mongoose.Types.ObjectId.isValid(filterQuery.timeOffTypeId)) {
      query.timeOffTypeId = new mongoose.Types.ObjectId(filterQuery.timeOffTypeId);
    }

    if (filterQuery.status) {
      query.status = filterQuery.status;
    }

    if (filterQuery.startDate || filterQuery.endDate) {
      if (filterQuery.startDate && filterQuery.endDate) {
        query.startDate = { $gte: new Date(filterQuery.startDate) };
        query.endDate = { $lte: new Date(filterQuery.endDate) };
      } else if (filterQuery.startDate) {
        query.startDate = { $gte: new Date(filterQuery.startDate) };
      } else if (filterQuery.endDate) {
        query.endDate = { $lte: new Date(filterQuery.endDate) };
      }
    }

    return await TimeOffRequest.find(query)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')
      .populate('allocationId', 'allocatedAmount takenAmount remainingAmount validFrom validTo approvalStatus')
      .sort({ createdAt: -1 });
  }

  async getRequestById(id: string, currentUser?: AuthUserPayload): Promise<ITimeOffRequest> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid request ID format');
      error.statusCode = 400;
      throw error;
    }

    const request = await TimeOffRequest.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')
      .populate('allocationId', 'allocatedAmount takenAmount remainingAmount validFrom validTo approvalStatus');

    if (!request) {
      const error: any = new Error('Time off request not found');
      error.statusCode = 404;
      throw error;
    }

    // Security check: Employee can only see own requests
    if (currentUser && currentUser.role === 'Employee') {
      const requestEmpId = (request.employeeId as any)?._id?.toString() || request.employeeId.toString();
      if (!currentUser.employeeId || currentUser.employeeId.toString() !== requestEmpId) {
        const error: any = new Error('Access forbidden: You can only access your own time off requests');
        error.statusCode = 403;
        throw error;
      }
    }

    return request;
  }

  async approveRequest(id: string): Promise<ITimeOffRequest> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid request ID format');
      error.statusCode = 400;
      throw error;
    }

    const request = await TimeOffRequest.findById(id);
    if (!request) {
      const error: any = new Error('Time off request not found');
      error.statusCode = 404;
      throw error;
    }

    // Duplicate / double approval protection
    if (request.status === 'Approved') {
      const error: any = new Error('Request has already been approved');
      error.statusCode = 400;
      throw error;
    }

    if (request.status === 'Refused') {
      const error: any = new Error('Cannot approve a refused request');
      error.statusCode = 400;
      throw error;
    }

    const timeOffType = await TimeOffType.findById(request.timeOffTypeId);
    if (!timeOffType) {
      const error: any = new Error('Referenced time off type not found');
      error.statusCode = 404;
      throw error;
    }

    // If allocation is required, deduct from allocation
    if (timeOffType.allocationRequired && request.allocationId) {
      const allocation = await TimeOffAllocation.findById(request.allocationId);
      if (!allocation) {
        const error: any = new Error('Associated allocation record not found');
        error.statusCode = 404;
        throw error;
      }

      if (allocation.approvalStatus !== 'Approved') {
        const error: any = new Error('Associated allocation is not approved');
        error.statusCode = 400;
        throw error;
      }

      if (allocation.remainingAmount < request.duration) {
        const error: any = new Error(
          `Insufficient allocation balance upon approval. Available: ${allocation.remainingAmount}, Requested: ${request.duration}`
        );
        error.statusCode = 400;
        throw error;
      }

      // Deduct balance
      allocation.takenAmount = Math.round((allocation.takenAmount + request.duration) * 100) / 100;
      allocation.remainingAmount = Math.round((allocation.allocatedAmount - allocation.takenAmount) * 100) / 100;

      if (allocation.remainingAmount < 0) {
        const error: any = new Error('Remaining allocation balance cannot become negative');
        error.statusCode = 400;
        throw error;
      }

      await allocation.save();
    }

    request.status = 'Approved';
    await request.save();

    return (await TimeOffRequest.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')
      .populate('allocationId', 'allocatedAmount takenAmount remainingAmount validFrom validTo approvalStatus')) as ITimeOffRequest;
  }

  async refuseRequest(id: string): Promise<ITimeOffRequest> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid request ID format');
      error.statusCode = 400;
      throw error;
    }

    const request = await TimeOffRequest.findById(id);
    if (!request) {
      const error: any = new Error('Time off request not found');
      error.statusCode = 404;
      throw error;
    }

    // Check status transitions
    if (request.status === 'Approved') {
      const error: any = new Error('Cannot refuse an already approved request');
      error.statusCode = 400;
      throw error;
    }

    if (request.status === 'Refused') {
      const error: any = new Error('Request has already been refused');
      error.statusCode = 400;
      throw error;
    }

    request.status = 'Refused';
    await request.save();

    // Do NOT consume allocation balance
    return (await TimeOffRequest.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition')
      .populate('timeOffTypeId', 'name unit allocationRequired approvalRequired payrollIntegration')
      .populate('allocationId', 'allocatedAmount takenAmount remainingAmount validFrom validTo approvalStatus')) as ITimeOffRequest;
  }

  async deleteRequest(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid request ID format');
      error.statusCode = 400;
      throw error;
    }

    const request = await TimeOffRequest.findById(id);
    if (!request) {
      const error: any = new Error('Time off request not found');
      error.statusCode = 404;
      throw error;
    }

    await TimeOffRequest.findByIdAndDelete(id);
  }
}

export const timeOffRequestService = new TimeOffRequestService();
