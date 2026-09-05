/**
 * PeoplePay360 Contracts API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/contracts (with employeeId, departmentId, status filters)
 * - GET /api/contracts/:id
 * - GET /api/contracts/applicable?employeeId=...&periodStart=...&periodEnd=...
 * - POST /api/contracts
 * - PUT /api/contracts/:id
 * - PATCH /api/contracts/:id
 * - DELETE /api/contracts/:id
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch all contracts with optional filters
 * GET /api/contracts?employeeId=...&departmentId=...&status=...
 */
export async function getContractsApi(token, filters = {}) {
  const queryParams = new URLSearchParams();

  if (filters.employeeId) {
    queryParams.append('employeeId', filters.employeeId);
  }
  if (filters.departmentId) {
    queryParams.append('departmentId', filters.departmentId);
  }
  if (filters.status) {
    queryParams.append('status', filters.status);
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/contracts${queryString ? `?${queryString}` : ''}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to retrieve contracts.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data || [];
}

/**
 * Fetch single contract by ID
 * GET /api/contracts/:id
 */
export async function getContractByIdApi(token, id) {
  if (!id) {
    throw new Error('Contract ID is required');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/contracts/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to retrieve contract details.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Fetch applicable contract for an employee across a specific payroll period
 * GET /api/contracts/applicable?employeeId=...&periodStart=...&periodEnd=...
 */
export async function getApplicableContractApi(token, employeeId, periodStart, periodEnd) {
  if (!employeeId || !periodStart || !periodEnd) {
    throw new Error('employeeId, periodStart, and periodEnd are required');
  }

  const queryParams = new URLSearchParams({
    employeeId,
    periodStart,
    periodEnd,
  });

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/contracts/applicable?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'No active contract found covering the specified period.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Create a new contract
 * POST /api/contracts
 */
export async function createContractApi(token, contractData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/contracts`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(contractData),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to create contract.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Update existing contract
 * PUT /api/contracts/:id
 */
export async function updateContractApi(token, id, contractData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/contracts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(contractData),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to update contract.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Delete a contract
 * DELETE /api/contracts/:id
 */
export async function deleteContractApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/contracts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to delete contract.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return true;
}

export default {
  getContractsApi,
  getContractByIdApi,
  getApplicableContractApi,
  createContractApi,
  updateContractApi,
  deleteContractApi,
};
