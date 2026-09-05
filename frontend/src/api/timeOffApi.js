import api from './apiClient';

export const timeOffApi = {
  // Types
  getTypes: () => api.get('/time-off/types'),
  getTypeById: (id) => api.get(`/time-off/types/${id}`),
  createType: (data) => api.post('/time-off/types', data),
  updateType: (id, data) => api.put(`/time-off/types/${id}`, data),
  deleteType: (id) => api.delete(`/time-off/types/${id}`),

  // Allocations
  getAllocations: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.timeOffTypeId) params.append('timeOffTypeId', filters.timeOffTypeId);
    if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
    const queryString = params.toString();
    return api.get(`/time-off/allocations${queryString ? `?${queryString}` : ''}`);
  },
  getAllocationById: (id) => api.get(`/time-off/allocations/${id}`),
  getAvailableAllocation: (employeeId, timeOffTypeId, date) => {
    const params = new URLSearchParams({ employeeId, timeOffTypeId });
    if (date) params.append('date', date);
    return api.get(`/time-off/allocations/available?${params.toString()}`);
  },
  createAllocation: (data) => api.post('/time-off/allocations', data),
  updateAllocation: (id, data) => api.put(`/time-off/allocations/${id}`, data),
  approveAllocation: (id) => api.patch(`/time-off/allocations/${id}/approve`, {}),

  // Requests
  getRequests: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.timeOffTypeId) params.append('timeOffTypeId', filters.timeOffTypeId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString();
    return api.get(`/time-off/requests${queryString ? `?${queryString}` : ''}`);
  },
  getRequestById: (id) => api.get(`/time-off/requests/${id}`),
  createRequest: (data) => api.post('/time-off/requests', data),
  approveRequest: (id) => api.patch(`/time-off/requests/${id}/approve`, {}),
  refuseRequest: (id) => api.patch(`/time-off/requests/${id}/refuse`, {}),
  deleteRequest: (id) => api.delete(`/time-off/requests/${id}`)
};
