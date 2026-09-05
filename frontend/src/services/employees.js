/**
 * PeoplePay360 Employee API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/employees (with search, departmentId, employeeType, status)
 * - GET /api/employees/:id
 * - GET /api/employees/me
 * - POST /api/employees
 * - PUT /api/employees/:id
 * - DELETE /api/employees/:id
 * - GET /api/departments (for department dropdown)
 * - GET /api/schedules (for working schedule dropdown)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to build auth headers
 */
function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch all employees with optional filters
 * GET /api/employees?search=...&departmentId=...&employeeType=...&status=...
 */
export async function getEmployeesApi(token, filters = {}) {
  const queryParams = new URLSearchParams();

  if (filters.search && filters.search.trim()) {
    queryParams.append('search', filters.search.trim());
  }
  if (filters.departmentId) {
    queryParams.append('departmentId', filters.departmentId);
  }
  if (filters.employeeType) {
    queryParams.append('employeeType', filters.employeeType);
  }
  if (filters.status) {
    queryParams.append('status', filters.status);
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/employees${queryString ? `?${queryString}` : ''}`;

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
    const message = data?.message || 'Failed to retrieve employee records.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data || [];
}

/**
 * Fetch single employee by ID
 * GET /api/employees/:id
 */
export async function getEmployeeByIdApi(token, id) {
  if (!id) {
    throw new Error('Employee ID is required');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to retrieve employee details.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Fetch current authenticated user's employee profile
 * GET /api/employees/me
 */
export async function getMyEmployeeProfileApi(token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/employees/me`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'No employee record associated with current user.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Create a new employee
 * POST /api/employees
 */
export async function createEmployeeApi(token, employeeData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(employeeData),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to create employee record.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Update existing employee
 * PUT /api/employees/:id
 */
export async function updateEmployeeApi(token, id, employeeData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(employeeData),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to update employee record.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Delete employee
 * DELETE /api/employees/:id
 */
export async function deleteEmployeeApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to delete employee record.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return true;
}

/**
 * Fetch departments for dropdown selection
 * GET /api/departments
 */
export async function getDepartmentsApi(token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    return [];
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return [];
  }

  return data.data || [];
}

/**
 * Fetch working schedules for dropdown selection
 * GET /api/schedules
 */
export async function getWorkingSchedulesApi(token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    return [];
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return [];
  }

  return data.data || [];
}

export default {
  getEmployeesApi,
  getEmployeeByIdApi,
  getMyEmployeeProfileApi,
  createEmployeeApi,
  updateEmployeeApi,
  deleteEmployeeApi,
  getDepartmentsApi,
  getWorkingSchedulesApi,
};
