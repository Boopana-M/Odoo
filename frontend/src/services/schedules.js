/**
 * PeoplePay360 Working Schedules API Service Layer
 * Interfaces with backend endpoints:
 * - GET /api/schedules
 * - GET /api/schedules/:id
 * - POST /api/schedules
 * - PUT /api/schedules/:id
 * - DELETE /api/schedules/:id
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch all working schedules
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
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to retrieve working schedules.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data || [];
}

/**
 * Fetch single working schedule by ID
 * GET /api/schedules/:id
 */
export async function getWorkingScheduleByIdApi(token, id) {
  if (!id) {
    throw new Error('Working Schedule ID is required');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Working schedule not found.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Create a new working schedule
 * POST /api/schedules
 */
export async function createWorkingScheduleApi(token, scheduleData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(scheduleData),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to create working schedule.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Update existing working schedule
 * PUT /api/schedules/:id
 */
export async function updateWorkingScheduleApi(token, id, scheduleData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(scheduleData),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to update working schedule.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

/**
 * Delete working schedule
 * DELETE /api/schedules/:id
 */
export async function deleteWorkingScheduleApi(token, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
  } catch {
    throw new Error('Network error: Unable to connect to backend server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Failed to delete working schedule.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return true;
}

export default {
  getWorkingSchedulesApi,
  getWorkingScheduleByIdApi,
  createWorkingScheduleApi,
  updateWorkingScheduleApi,
  deleteWorkingScheduleApi,
};
