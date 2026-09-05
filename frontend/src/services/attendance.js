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

/**
 * Fetch all attendance records with optional filtering
 * @param {Object} params - { employeeId, startDate, endDate, status }
 * @returns {Promise<Array>} List of attendance records
 */
export async function getAttendancesApi(params = {}) {
  const query = new URLSearchParams();
  if (params.employeeId) query.append('employeeId', params.employeeId);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.status) query.append('status', params.status);

  const queryString = query.toString();
  const url = `${API_BASE_URL}/attendance${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch attendance records');
  }

  return resData.data || [];
}

/**
 * Fetch a single attendance record by ID
 * @param {string} id - Attendance record ID
 * @returns {Promise<Object>} Attendance object
 */
export async function getAttendanceByIdApi(id) {
  const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch attendance record');
  }

  return resData.data;
}

/**
 * Fetch attendance records for a specific employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Array>} List of attendance records
 */
export async function getAttendancesByEmployeeIdApi(employeeId) {
  const response = await fetch(`${API_BASE_URL}/attendance/employee/${employeeId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to fetch employee attendance records');
  }

  return resData.data || [];
}

/**
 * Create a new attendance record (or Check-In)
 * @param {Object} data - { employeeId, date, checkIn, checkOut, status, correctionReason }
 * @returns {Promise<Object>} Created attendance record
 */
export async function createAttendanceApi(data) {
  const response = await fetch(`${API_BASE_URL}/attendance`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to create attendance record');
  }

  return resData.data;
}

/**
 * Update an existing attendance record (Check-Out or Authorized Manual Correction)
 * @param {string} id - Attendance record ID
 * @param {Object} data - Updated fields { checkIn, checkOut, date, status, correctionReason }
 * @returns {Promise<Object>} Updated attendance record
 */
export async function updateAttendanceApi(id, data) {
  const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to update attendance record');
  }

  return resData.data;
}

/**
 * Delete an attendance record
 * @param {string} id - Attendance record ID
 * @returns {Promise<Object>} Success response
 */
export async function deleteAttendanceApi(id) {
  const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || 'Failed to delete attendance record');
  }

  return resData;
}
