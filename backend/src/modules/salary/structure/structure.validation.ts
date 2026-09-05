export interface CreateSalaryStructureDTO {
  name: string;
  code: string;
  isActive?: boolean;
  active?: boolean;
}

export interface UpdateSalaryStructureDTO {
  name?: string;
  code?: string;
  isActive?: boolean;
  active?: boolean;
}

export function validateSalaryStructureInput(
  data: CreateSalaryStructureDTO | UpdateSalaryStructureDTO,
  isUpdate = false
): {
  name?: string;
  code?: string;
  isActive?: boolean;
} {
  const validated: {
    name?: string;
    code?: string;
    isActive?: boolean;
  } = {};

  // Name validation
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      const error: any = new Error('Salary structure name is required');
      error.statusCode = 400;
      throw error;
    }
    validated.name = data.name.trim();
  }

  // Code validation
  if (!isUpdate || data.code !== undefined) {
    if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
      const error: any = new Error('Salary structure code is required');
      error.statusCode = 400;
      throw error;
    }
    validated.code = data.code.trim();
  }

  // isActive / active validation
  const activeInput = data.isActive !== undefined ? data.isActive : data.active;
  if (activeInput !== undefined) {
    if (typeof activeInput !== 'boolean') {
      const error: any = new Error('active status must be a boolean value');
      error.statusCode = 400;
      throw error;
    }
    validated.isActive = activeInput;
  } else if (!isUpdate) {
    validated.isActive = true;
  }

  return validated;
}
