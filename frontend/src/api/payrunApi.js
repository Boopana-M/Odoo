import api from './apiClient';

export const payrunApi = {
  getEligibleEmployees: (salaryStructureId, periodStart, periodEnd) => {
    const params = new URLSearchParams({ salaryStructureId, periodStart, periodEnd });
    return api.get(`/payruns/eligible-employees?${params.toString()}`);
  },
  getAll: () => api.get('/payruns'),
  getById: (id) => api.get(`/payruns/${id}`),
  create: (data) => api.post('/payruns', data),
  update: (id, data) => api.put(`/payruns/${id}`, data),
  compute: (id) => api.post(`/payruns/${id}/compute`, {}),
  validate: (id) => api.post(`/payruns/${id}/validate`, {}),
  markPaid: (id) => api.post(`/payruns/${id}/mark-paid`, {}),
  sendPayslips: (id) => api.post(`/payruns/${id}/send-payslips`, {})
};
