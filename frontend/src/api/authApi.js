import api from './apiClient';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  
  // User administration (Admin)
  getUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  adminResetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};
