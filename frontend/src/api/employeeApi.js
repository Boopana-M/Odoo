import api from './apiClient';

export const employeeApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.employeeType) params.append('employeeType', filters.employeeType);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    const queryString = params.toString();
    return api.get(`/employees${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => (id === 'me' ? api.get('/employees/me') : api.get(`/employees/${id}`)),
  getMyProfile: () => api.get('/employees/me'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`)
};
