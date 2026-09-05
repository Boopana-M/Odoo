import api from './apiClient';

export const salaryApi = {
  // Salary Structures
  getStructures: () => api.get('/salary-structures'),
  getStructureById: (id) => api.get(`/salary-structures/${id}`),
  createStructure: (data) => api.post('/salary-structures', data),
  updateStructure: (id, data) => api.put(`/salary-structures/${id}`, data),
  deleteStructure: (id) => api.delete(`/salary-structures/${id}`),

  // Salary Rules
  getRules: () => api.get('/salary-rules'),
  getRulesByStructure: (structureId) => api.get(`/salary-rules/structure/${structureId}`),
  getRuleById: (id) => api.get(`/salary-rules/${id}`),
  createRule: (data) => api.post('/salary-rules', data),
  updateRule: (id, data) => api.put(`/salary-rules/${id}`, data),
  deleteRule: (id) => api.delete(`/salary-rules/${id}`)
};
