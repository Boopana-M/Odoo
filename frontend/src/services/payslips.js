/**
 * PeoplePay360 Payslips API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/payslips (filters: payrunId, employeeId, status)
 * - GET /api/payslips/:id
 * - GET /api/payslips/payrun/:payrunId
 * - GET /api/payslips/:id/pdf (direct PDF stream)
 * - POST /api/payslips/:id/validate
 * - POST /api/payslips/:id/mark-paid
 * - DELETE /api/payslips/:id
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPayslipsApi(token, params = {}) {
  const query = new URLSearchParams();
  if (params.payrunId) query.append('payrunId', params.payrunId);
  if (params.employeeId) query.append('employeeId', params.employeeId);
  if (params.status) query.append('status', params.status);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payslips${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve payslips.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}

export async function getPayslipByIdApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payslips/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve payslip details.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function getPayslipsByPayrunIdApi(token, payrunId) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payslips/payrun/${payrunId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve payslips for payrun.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}

export async function validatePayslipApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payslips/${id}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to validate payslip.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function markPayslipPaidApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payslips/${id}/mark-paid`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to mark payslip as paid.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

export async function deletePayslipApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/payslips/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to delete payslip.');
    error.status = response.status;
    throw error;
  }
  return data.data;
}

/**
 * Downloads Payslip PDF file directly as a Blob from the backend /api/payslips/:id/pdf
 */
export async function downloadPayslipPdfApi(token, id, filename = `payslip_${id}.pdf`) {
  const res = await fetch(`${API_BASE_URL}/payslips/${id}/pdf`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let errorMsg = 'Failed to generate Payslip PDF';
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errorMsg;
    } catch {
      // Non-JSON response
    }
    throw new Error(errorMsg);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
