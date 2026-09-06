import api from './apiClient';

export const attendanceApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    const queryString = params.toString();
    return api.get(`/attendance${queryString ? `?${queryString}` : ''}`);
  },
  getByEmployeeId: (employeeId) => api.get(`/attendance/employee/${employeeId}`),
  getById: (id) => api.get(`/attendance/${id}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  checkIn: (data = {}) => api.post('/attendance/check-in', data),
  checkOut: (data = {}) => api.post('/attendance/check-out', data)
};
