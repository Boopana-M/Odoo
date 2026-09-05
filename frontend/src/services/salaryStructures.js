/**
 * PeoplePay360 Salary Structures API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/salary-structures
 * - GET /api/salary-structures/:id
 * - POST /api/salary-structures
 * - PUT /api/salary-structures/:id
 * - DELETE /api/salary-structures/:id
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getSalaryStructuresApi(token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-structures`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve salary structures.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}

export async function getSalaryStructureByIdApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-structures/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve salary structure details.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function createSalaryStructureApi(token, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-structures`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to create salary structure.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function updateSalaryStructureApi(token, id, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-structures/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to update salary structure.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function deleteSalaryStructureApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-structures/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to delete salary structure.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}
