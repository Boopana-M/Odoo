import { getAuthToken } from './auth';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Standard HTTP headers helper with Bearer authentication
 */
function getHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ==========================================
// 1. TIME OFF TYPES
// ==========================================

/**
 * Fetch all Time Off Types
 * @returns {Promise<Array>} List of Time Off Types
 */
export async function getTimeOffTypesApi() {
  const response = await fetch(`${API_BASE_URL}/time-off/types`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch time off types');
  }

  return resData.data || [];
}

/**
 * Fetch a single Time Off Type by ID
 * @param {string} id - Time Off Type ID
 * @returns {Promise<Object>} Time Off Type object
 */
export async function getTimeOffTypeByIdApi(id) {
  const response = await fetch(`${API_BASE_URL}/time-off/types/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch time off type');
  }

  return resData.data;
}

/**
 * Create a new Time Off Type
 * @param {Object} data - { name, unit, allocationRequired, approvalRequired, payrollIntegration }
 * @returns {Promise<Object>} Created Time Off Type
 */
export async function createTimeOffTypeApi(data) {
  const response = await fetch(`${API_BASE_URL}/time-off/types`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to create time off type');
  }

  return resData.data;
}

/**
 * Update an existing Time Off Type
 * @param {string} id - Time Off Type ID
 * @param {Object} data - Updated fields
 * @returns {Promise<Object>} Updated Time Off Type
 */
export async function updateTimeOffTypeApi(id, data) {
  const response = await fetch(`${API_BASE_URL}/time-off/types/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to update time off type');
  }

  return resData.data;
}

/**
 * Delete a Time Off Type
 * @param {string} id - Time Off Type ID
 * @returns {Promise<Object>} Success response
 */
export async function deleteTimeOffTypeApi(id) {
  const response = await fetch(`${API_BASE_URL}/time-off/types/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to delete time off type');
  }

  return resData;
}

// ==========================================
// 2. TIME OFF ALLOCATIONS
// ==========================================

/**
 * Fetch all Time Off Allocations with optional filtering
 * @param {Object} params - { employeeId, timeOffTypeId, approvalStatus }
 * @returns {Promise<Array>} List of Allocations
 */
export async function getTimeOffAllocationsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.employeeId) query.append('employeeId', params.employeeId);
  if (params.timeOffTypeId) query.append('timeOffTypeId', params.timeOffTypeId);
  if (params.approvalStatus) query.append('approvalStatus', params.approvalStatus);

  const queryString = query.toString();
  const url = `${API_BASE_URL}/time-off/allocations${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch time off allocations');
  }

  return resData.data || [];
}

/**
 * Fetch a single Time Off Allocation by ID
 * @param {string} id - Allocation ID
 * @returns {Promise<Object>} Allocation record
 */
export async function getTimeOffAllocationByIdApi(id) {
  const response = await fetch(`${API_BASE_URL}/time-off/allocations/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch time off allocation');
  }

  return resData.data;
}

/**
 * Fetch available allocation amount and valid approved allocations for an employee and type
 * @param {Object} params - { employeeId, timeOffTypeId, date }
 * @returns {Promise<Object>} { availableAmount, allocationRequired, unit, allocations }
 */
export async function getAvailableAllocationApi(params = {}) {
  const query = new URLSearchParams();
  if (params.employeeId) query.append('employeeId', params.employeeId);
  if (params.timeOffTypeId) query.append('timeOffTypeId', params.timeOffTypeId);
  if (params.date) query.append('date', params.date);

  const url = `${API_BASE_URL}/time-off/allocations/available?${query.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to check available allocation');
  }

  return resData.data;
}

/**
 * Create a new Time Off Allocation
 * @param {Object} data - { employeeId, timeOffTypeId, allocatedAmount, validFrom, validTo, approvalStatus }
 * @returns {Promise<Object>} Created allocation
 */
export async function createTimeOffAllocationApi(data) {
  const response = await fetch(`${API_BASE_URL}/time-off/allocations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to create time off allocation');
  }

  return resData.data;
}

/**
 * Update an existing Time Off Allocation
 * @param {string} id - Allocation ID
 * @param {Object} data - Updated fields
 * @returns {Promise<Object>} Updated allocation
 */
export async function updateTimeOffAllocationApi(id, data) {
  const response = await fetch(`${API_BASE_URL}/time-off/allocations/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to update time off allocation');
  }

  return resData.data;
}

/**
 * Approve a Time Off Allocation
 * @param {string} id - Allocation ID
 * @returns {Promise<Object>} Approved allocation
 */
export async function approveTimeOffAllocationApi(id) {
  const response = await fetch(`${API_BASE_URL}/time-off/allocations/${id}/approve`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to approve time off allocation');
  }

  return resData.data;
}

// ==========================================
// 3. TIME OFF REQUESTS
// ==========================================

/**
 * Fetch all Time Off Requests with optional filtering
 * @param {Object} params - { employeeId, timeOffTypeId, status, startDate, endDate }
 * @returns {Promise<Array>} List of Time Off Requests
 */
export async function getTimeOffRequestsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.employeeId) query.append('employeeId', params.employeeId);
  if (params.timeOffTypeId) query.append('timeOffTypeId', params.timeOffTypeId);
  if (params.status) query.append('status', params.status);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  const url = `${API_BASE_URL}/time-off/requests${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch time off requests');
  }

  return resData.data || [];
}

/**
 * Fetch a single Time Off Request by ID
 * @param {string} id - Request ID
 * @returns {Promise<Object>} Request record
 */
export async function getTimeOffRequestByIdApi(id) {
  const response = await fetch(`${API_BASE_URL}/time-off/requests/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch time off request');
  }

  return resData.data;
}

/**
 * Create a new Time Off Request
 * @param {Object} data - { employeeId, timeOffTypeId, allocationId, startDate, endDate, duration }
 * @returns {Promise<Object>} Created request record
 */
export async function createTimeOffRequestApi(data) {
  const response = await fetch(`${API_BASE_URL}/time-off/requests`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to create time off request');
  }

  return resData.data;
}

/**
 * Approve a Time Off Request (Deducts balance from related allocation automatically in backend)
 * @param {string} id - Request ID
 * @returns {Promise<Object>} Approved request record
 */
export async function approveTimeOffRequestApi(id) {
  const response = await fetch(`${API_BASE_URL}/time-off/requests/${id}/approve`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to approve time off request');
  }

  return resData.data;
}

/**
 * Refuse a Time Off Request
 * @param {string} id - Request ID
 * @returns {Promise<Object>} Refused request record
 */
export async function refuseTimeOffRequestApi(id) {
  const response = await fetch(`${API_BASE_URL}/time-off/requests/${id}/refuse`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to refuse time off request');
  }

  return resData.data;
}

/**
 * Delete a Time Off Request
 * @param {string} id - Request ID
 * @returns {Promise<Object>} Success response
 */
export async function deleteTimeOffRequestApi(id) {
  const response = await fetch(`${API_BASE_URL}/time-off/requests/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to delete time off request');
  }

  return resData;
}
