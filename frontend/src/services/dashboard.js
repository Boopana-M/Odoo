/**
 * PeoplePay360 Dashboard API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/dashboard (Full unified dashboard)
 * - GET /api/dashboard/payroll (Full unified dashboard)
 * - GET /api/dashboard/payroll/summary (Payroll summary metrics)
 * - GET /api/dashboard/payroll/salary-by-department (Salary by department)
 * - GET /api/dashboard/payroll/monthly-net-salary (Monthly net salary trends)
 * - GET /api/dashboard/headcount (Department headcount distribution)
 * - GET /api/dashboard/attendance-timeoff (Attendance & time off overview)
 * - GET /api/dashboard/alerts (Operational alerts)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildQueryString(filters = {}) {
  const params = new URLSearchParams();
  if (filters.periodStart) params.append('periodStart', filters.periodStart);
  if (filters.periodEnd) params.append('periodEnd', filters.periodEnd);
  if (filters.departmentId) params.append('departmentId', filters.departmentId);
  if (filters.employeeType) params.append('employeeType', filters.employeeType);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getPayrollDashboardApi(token, filters = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/dashboard/payroll${buildQueryString(filters)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve unified dashboard data.');
    error.status = response.status;
    throw error;
  }
  return data.data || {};
}

export async function getPayrollSummaryApi(token, filters = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/dashboard/payroll/summary${buildQueryString(filters)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve payroll summary metrics.');
    error.status = response.status;
    throw error;
  }
  return data.data || {};
}

export async function getSalaryByDepartmentApi(token, filters = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/dashboard/payroll/salary-by-department${buildQueryString(filters)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve salary expenditure by department.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}

export async function getMonthlyNetSalaryApi(token, filters = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/dashboard/payroll/monthly-net-salary${buildQueryString(filters)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve monthly salary trends.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}

export async function getHeadcountApi(token, filters = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/dashboard/headcount${buildQueryString(filters)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve department headcount metrics.');
    error.status = response.status;
    throw error;
  }
  return data.data || { totalHeadcount: 0, byDepartment: [], byType: [] };
}

export async function getAttendanceTimeOffApi(token, filters = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/dashboard/attendance-timeoff${buildQueryString(filters)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve attendance and time off metrics.');
    error.status = response.status;
    throw error;
  }
  return data.data || {
    attendance: { totalRecords: 0, presentCount: 0, overtimeCount: 0, lateCount: 0, absentCount: 0, totalWorkedHours: 0, attendanceRate: 100 },
    timeOff: { totalRequests: 0, approvedCount: 0, pendingCount: 0, refusedCount: 0, approvedDays: 0 },
  };
}

export async function getAlertsApi(token, filters = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/dashboard/alerts${buildQueryString(filters)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to retrieve operational alerts.');
    error.status = response.status;
    throw error;
  }
  return data.data || [];
}
