/**
 * PeoplePay360 Payruns API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/payruns
 * - GET /api/payruns/:id
 * - GET /api/payruns/eligible-employees
 * - POST /api/payruns
 * - PUT /api/payruns/:id
 * - POST /api/payruns/:id/compute
 * - POST /api/payruns/:id/validate
 * - POST /api/payruns/:id/mark-paid
 * - POST /api/payruns/:id/send-payslips
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPayrunsApi(token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve payruns.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}

export async function getPayrunByIdApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve payrun details.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function getEligibleEmployeesApi(token, { salaryStructureId, periodStart, periodEnd }) {
  const query = new URLSearchParams({
    salaryStructureId,
    periodStart,
    periodEnd,
  }).toString();

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns/eligible-employees?${query}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to check eligible employees.');
    error.status = response.status;
    throw error;
  }
  return data.data || { eligibleEmployees: [], ineligibleEmployees: [] };
}

export async function createPayrunApi(token, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to create payrun cycle.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function updatePayrunApi(token, id, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to update payrun.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function computePayrunApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns/${id}/compute`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to compute payrun.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function validatePayrunApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns/${id}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to validate payrun.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function markPayrunPaidApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns/${id}/mark-paid`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to mark payrun as paid.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function sendPayrunPayslipsApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payruns/${id}/send-payslips`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to send bulk payslips.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}
