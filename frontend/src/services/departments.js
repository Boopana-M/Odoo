/**
 * PeoplePay360 Departments API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/departments
 * - GET /api/departments/:id
 * - POST /api/departments
 * - PUT /api/departments/:id
 * - DELETE /api/departments/:id
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch all departments
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
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to retrieve departments.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data || [];
}

/**
 * Fetch single department by ID
 * GET /api/departments/:id
 */
export async function getDepartmentByIdApi(token, id) {
  if (!id) {
    throw new Error('Department ID is required');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Department not found.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Create a new department
 * POST /api/departments
 */
export async function createDepartmentApi(token, departmentData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(departmentData),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to create department.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Update existing department
 * PUT /api/departments/:id
 */
export async function updateDepartmentApi(token, id, departmentData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(departmentData),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to update department.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Delete department
 * DELETE /api/departments/:id
 */
export async function deleteDepartmentApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to delete department.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return true;
}

export default {
  getDepartmentsApi,
  getDepartmentByIdApi,
  createDepartmentApi,
  updateDepartmentApi,
  deleteDepartmentApi,
};
