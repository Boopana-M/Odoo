/**
 * PeoplePay360 Salary Rules API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/salary-rules
 * - GET /api/salary-rules/structure/:structureId
 * - GET /api/salary-rules/:id
 * - POST /api/salary-rules
 * - PUT /api/salary-rules/:id
 * - DELETE /api/salary-rules/:id
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getSalaryRulesApi(token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-rules`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve salary rules.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}

export async function getSalaryRulesByStructureApi(token, structureId) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-rules/structure/${structureId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve salary rules for structure.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}

export async function getSalaryRuleByIdApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-rules/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve salary rule details.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function createSalaryRuleApi(token, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-rules`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to create salary rule.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function updateSalaryRuleApi(token, id, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to update salary rule.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function deleteSalaryRuleApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/salary-rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to delete salary rule.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}
