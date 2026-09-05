import { TIMEOFF_UNITS, TimeOffUnit } from './timeoff-type.model';

export interface CreateTimeOffTypeDTO {
  name: string;
  unit: string;
  allocationRequired?: boolean;
  approvalRequired?: boolean;
  payrollIntegration?: boolean;
}

export interface UpdateTimeOffTypeDTO {
  name?: string;
  unit?: string;
  allocationRequired?: boolean;
  approvalRequired?: boolean;
  payrollIntegration?: boolean;
}

export function normalizeUnit(unitStr?: string): TimeOffUnit | undefined {
  if (!unitStr || typeof unitStr !== 'string') return undefined;
  const match = TIMEOFF_UNITS.find(u => u.toLowerCase() === unitStr.trim().toLowerCase());
  return match;
}

export function validateTimeOffTypeInput(
  data: CreateTimeOffTypeDTO | UpdateTimeOffTypeDTO,
  isUpdate = false
): {
  name?: string;
  unit?: TimeOffUnit;
  allocationRequired?: boolean;
  approvalRequired?: boolean;
  payrollIntegration?: boolean;
} {
  const validated: any = {};

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      const error: any = new Error('Time off type name is required');
      error.statusCode = 400;
      throw error;
    }
    validated.name = data.name.trim();
  }

  if (!isUpdate || data.unit !== undefined) {
    if (!data.unit || typeof data.unit !== 'string') {
      const error: any = new Error('Unit is required');
      error.statusCode = 400;
      throw error;
    }
    const normalized = normalizeUnit(data.unit);
    if (!normalized) {
      const error: any = new Error(
        `Invalid unit '${data.unit}'. Allowed units: ${TIMEOFF_UNITS.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    validated.unit = normalized;
  }

  if (data.allocationRequired !== undefined) {
    if (typeof data.allocationRequired !== 'boolean') {
      const error: any = new Error('allocationRequired must be a boolean value');
      error.statusCode = 400;
      throw error;
    }
    validated.allocationRequired = data.allocationRequired;
  }

  if (data.approvalRequired !== undefined) {
    if (typeof data.approvalRequired !== 'boolean') {
      const error: any = new Error('approvalRequired must be a boolean value');
      error.statusCode = 400;
      throw error;
    }
    validated.approvalRequired = data.approvalRequired;
  }

  if (data.payrollIntegration !== undefined) {
    if (typeof data.payrollIntegration !== 'boolean') {
      const error: any = new Error('payrollIntegration must be a boolean value');
      error.statusCode = 400;
      throw error;
    }
    validated.payrollIntegration = data.payrollIntegration;
  }

  return validated;
}
