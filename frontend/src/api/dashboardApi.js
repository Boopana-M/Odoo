import api from './apiClient';

export const dashboardApi = {
  getFullDashboard: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.periodStart) params.append('periodStart', filters.periodStart);
    if (filters.periodEnd) params.append('periodEnd', filters.periodEnd);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.employeeType) params.append('employeeType', filters.employeeType);
    const queryString = params.toString();
    return api.get(`/dashboard${queryString ? `?${queryString}` : ''}`);
  },
  getSummary: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/dashboard/payroll/summary?${params.toString()}`);
  },
  getSalaryByDepartment: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/dashboard/payroll/salary-by-department?${params.toString()}`);
  },
  getMonthlyNetSalary: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/dashboard/payroll/monthly-net-salary?${params.toString()}`);
  },
  getHeadcount: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/dashboard/payroll/headcount?${params.toString()}`);
  },
  getAttendanceTimeOff: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/dashboard/payroll/attendance-timeoff?${params.toString()}`);
  },
  getAlerts: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/dashboard/payroll/alerts?${params.toString()}`);
  }
};
