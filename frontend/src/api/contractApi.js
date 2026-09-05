import api from './apiClient';

export const contractApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.status) params.append('status', filters.status);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    const queryString = params.toString();
    return api.get(`/contracts${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/contracts/${id}`),
  getApplicable: (employeeId, periodStart, periodEnd) => {
    const params = new URLSearchParams({ employeeId, periodStart, periodEnd });
    return api.get(`/contracts/applicable?${params.toString()}`);
  },
  create: (data) => api.post('/contracts', data),
  update: (id, data) => api.put(`/contracts/${id}`, data),
  delete: (id) => api.delete(`/contracts/${id}`)
};
