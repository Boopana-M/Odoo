import api from './apiClient';

export const payslipApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.payrunId) params.append('payrunId', filters.payrunId);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.status) params.append('status', filters.status);
    const queryString = params.toString();
    return api.get(`/payslips${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/payslips/${id}`),
  getByPayrunId: (payrunId) => api.get(`/payslips/payrun/${payrunId}`),
  getByEmployeeId: (employeeId) => api.get(`/payslips/employee/${employeeId}`),
  
  // Download PDF Blob
  downloadPdf: async (id) => {
    return api.get(`/payslips/${id}/pdf`);
  },

  calculatePreview: (data) => api.post('/payslips/calculate', data),
  update: (id, data) => api.put(`/payslips/${id}`, data),
  validate: (id) => api.post(`/payslips/${id}/validate`, {}),
  markPaid: (id) => api.post(`/payslips/${id}/mark-paid`, {}),
  delete: (id) => api.delete(`/payslips/${id}`)
};
