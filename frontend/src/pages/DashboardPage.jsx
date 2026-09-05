import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Shield,
  Briefcase,
  Plus,
  BarChart3,
  Layers,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageLoading } from '../components/ui/LoadingState';
import { SectionError } from '../components/ui/ErrorState';
import { getPayrollDashboardApi, getHeadcountApi, getAttendanceTimeOffApi, getAlertsApi } from '../services/dashboard';
import { getDepartmentsApi } from '../services/departments';
import { getAttendancesApi } from '../services/attendance';
import { getTimeOffRequestsApi, getTimeOffAllocationsApi } from '../services/timeOff';

export function DashboardPage({ onNavigate }) {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filter states
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployeeType, setSelectedEmployeeType] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Dashboard Data states
  const [payrollDashboardData, setPayrollDashboardData] = useState(null);
  const [hrHeadcountData, setHrHeadcountData] = useState(null);
  const [hrAttendanceTimeOffData, setHrAttendanceTimeOffData] = useState(null);
  const [alertsData, setAlertsData] = useState([]);

  // Employee Personal Data states
  const [employeeAttendances, setEmployeeAttendances] = useState([]);
  const [employeeTimeOffRequests, setEmployeeTimeOffRequests] = useState([]);
  const [employeeAllocations, setEmployeeAllocations] = useState([]);

  const isEmployee = role === ROLES.EMPLOYEE;
  const isHrManager = role === ROLES.HR_MANAGER;
  const hasPayrollAccess = role === ROLES.HR_PAYROLL_USER || role === ROLES.HR_PAYROLL_MANAGER || role === ROLES.ADMIN;

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    const filters = {
      ...(selectedDepartment ? { departmentId: selectedDepartment } : {}),
      ...(selectedEmployeeType ? { employeeType: selectedEmployeeType } : {}),
      ...(periodStart ? { periodStart } : {}),
      ...(periodEnd ? { periodEnd } : {}),
    };

    try {
      if (isEmployee) {
        // Fetch Employee Self-Service Data
        const empId = user?.employeeId?._id || user?.employeeId || user?._id || user?.id;
        const [attRes, toReqRes, toAllocRes] = await Promise.allSettled([
          getAttendancesApi(token, { employeeId: empId }),
          getTimeOffRequestsApi(token, { employeeId: empId }),
          getTimeOffAllocationsApi(token, { employeeId: empId }),
        ]);

        if (attRes.status === 'fulfilled') setEmployeeAttendances(attRes.value || []);
        if (toReqRes.status === 'fulfilled') setEmployeeTimeOffRequests(toReqRes.value || []);
        if (toAllocRes.status === 'fulfilled') setEmployeeAllocations(toAllocRes.value || []);
      } else if (isHrManager) {
        // Fetch HR-Only Dashboard (No Payroll)
        const [deptRes, headRes, attToRes, alertRes] = await Promise.allSettled([
          getDepartmentsApi(token),
          getHeadcountApi(token, filters),
          getAttendanceTimeOffApi(token, filters),
          getAlertsApi(token, filters),
        ]);

        if (deptRes.status === 'fulfilled') setDepartments(deptRes.value || []);
        if (headRes.status === 'fulfilled') setHrHeadcountData(headRes.value || null);
        if (attToRes.status === 'fulfilled') setHrAttendanceTimeOffData(attToRes.value || null);
        if (alertRes.status === 'fulfilled') setAlertsData(alertRes.value || []);
      } else if (hasPayrollAccess) {
        // Fetch Full Unified Executive/Payroll Dashboard
        const [deptRes, fullDashRes] = await Promise.allSettled([
          getDepartmentsApi(token),
          getPayrollDashboardApi(token, filters),
        ]);

        if (deptRes.status === 'fulfilled') setDepartments(deptRes.value || []);
        if (fullDashRes.status === 'fulfilled') {
          setPayrollDashboardData(fullDashRes.value || null);
          setAlertsData(fullDashRes.value?.alerts || []);
        }
      }
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isEmployee, isHrManager, hasPayrollAccess, user, selectedDepartment, selectedEmployeeType, periodStart, periodEnd]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleResetFilters = () => {
    setSelectedDepartment('');
    setSelectedEmployeeType('');
    setPeriodStart('');
    setPeriodEnd('');
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '$0.00';
    return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && !refreshing) {
    return (
      <div className="py-12 flex justify-center">
        <PageLoading message="Aggregating PeoplePay360 operational metrics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header & Quick Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isEmployee
                    ? 'Employee Self-Service Dashboard'
                    : isHrManager
                    ? 'HR Operations Dashboard'
                    : role === ROLES.ADMIN
                    ? 'Executive Enterprise Dashboard'
                    : 'Payroll & Operations Dashboard'}
                </h1>
                <StatusBadge status="active" label={user?.role || 'User'} />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Welcome, <strong className="text-slate-200">{user?.name}</strong></span>
                <span>•</span>
                <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="!border-slate-700 !text-slate-200 hover:!bg-slate-800"
            >
              {refreshing ? 'Updating...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Global Filter Bar for HR & Payroll Roles */}
        {!isEmployee && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">Department:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">Type:</label>
              <select
                value={selectedEmployeeType}
                onChange={(e) => setSelectedEmployeeType(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Employment Types</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">From:</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">To:</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {(selectedDepartment || selectedEmployeeType || periodStart || periodEnd) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="!text-xs !text-slate-400 hover:!text-slate-200 !py-1 !px-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <SectionError
          title="Dashboard Metrics Error"
          message={error}
          onRetry={() => fetchDashboardData()}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. EMPLOYEE SELF-SERVICE VIEW                                             */}
      {/* ========================================================================= */}
      {isEmployee && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Logs</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white">{employeeAttendances.length}</span>
                <span className="text-xs text-slate-400 ml-2">Recorded Cycles</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Total attendance records logged in system.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Off Allocations</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white">
                  {employeeAllocations.reduce((acc, a) => acc + (a.allocatedDays || 0), 0)}
                </span>
                <span className="text-xs text-slate-400 ml-2">Total Days Allocated</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Across {employeeAllocations.length} leave category types.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leave Requests</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Briefcase size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white">
                  {employeeTimeOffRequests.filter((r) => r.status === 'Pending').length}
                </span>
                <span className="text-xs text-amber-400 ml-2 font-medium">Pending Approval</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {employeeTimeOffRequests.filter((r) => r.status === 'Approved').length} approved requests recorded.
              </p>
            </div>
          </div>

          {/* Quick Actions & Recent Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card
              title="Self-Service Quick Actions"
              description="Direct shortcuts to log attendance and file leave requests"
              className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400"
            >
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('attendance')}
                  className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/40 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Log Attendance</p>
                      <p className="text-[11px] text-slate-400">Clock in / clock out for today</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('time-off')}
                  className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Request Time Off</p>
                      <p className="text-[11px] text-slate-400">Submit planned leaves or absences</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('employee-profile')}
                  className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/40 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">My Employee Profile</p>
                      <p className="text-[11px] text-slate-400">View contact & employment details</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </button>
              </div>
            </Card>

            {/* Recent Time Off Requests */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-white">Recent Time Off Requests</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate && onNavigate('time-off')}
                    className="!text-xs !text-blue-400 hover:!text-blue-300"
                  >
                    View All
                  </Button>
                </div>

                <div className="mt-4 overflow-x-auto">
                  {employeeTimeOffRequests.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No time off requests filed yet.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2 font-medium">Leave Type</th>
                          <th className="pb-2 font-medium">Start Date</th>
                          <th className="pb-2 font-medium">End Date</th>
                          <th className="pb-2 font-medium">Duration</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {employeeTimeOffRequests.slice(0, 5).map((req) => (
                          <tr key={req._id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 text-slate-200 font-medium">
                              {req.timeOffTypeId?.name || 'General Leave'}
                            </td>
                            <td className="py-2.5 text-slate-400 font-mono">
                              {new Date(req.startDate).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 text-slate-400 font-mono">
                              {new Date(req.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 text-slate-300">
                              {req.duration} {req.duration === 1 ? 'day' : 'days'}
                            </td>
                            <td className="py-2.5">
                              <StatusBadge
                                status={
                                  req.status === 'Approved'
                                    ? 'active'
                                    : req.status === 'Refused'
                                    ? 'inactive'
                                    : 'draft'
                                }
                                label={req.status}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HR MANAGER VIEW (HR Operations only, strictly no payroll metrics)      */}
      {/* ========================================================================= */}
      {isHrManager && hrHeadcountData && (
        <div className="space-y-6">
          {/* Operational Alerts */}
          {alertsData.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Operational HR Alerts ({alertsData.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertsData.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                      alert.level === 'CRITICAL'
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                        : alert.level === 'WARNING'
                        ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                        : 'bg-blue-950/30 border-blue-800/50 text-blue-200'
                    }`}
                  >
                    <AlertTriangle
                      size={18}
                      className={
                        alert.level === 'CRITICAL'
                          ? 'text-rose-400 shrink-0 mt-0.5'
                          : alert.level === 'WARNING'
                          ? 'text-amber-400 shrink-0 mt-0.5'
                          : 'text-blue-400 shrink-0 mt-0.5'
                      }
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span>{alert.title}</span>
                        {alert.count !== undefined && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-900/60 font-mono text-[10px]">
                            {alert.count}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 opacity-90">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HR KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Headcount</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white">{hrHeadcountData.totalHeadcount || 0}</span>
                <span className="text-xs text-slate-400 ml-2">Employees</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Active personnel across all departments.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-emerald-400">
                  {hrAttendanceTimeOffData?.attendance?.attendanceRate || 100}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {hrAttendanceTimeOffData?.attendance?.presentCount || 0} present / {hrAttendanceTimeOffData?.attendance?.totalRecords || 0} logs
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Worked Hours</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white">
                  {hrAttendanceTimeOffData?.attendance?.totalWorkedHours || 0}
                </span>
                <span className="text-xs text-slate-400 ml-2">Hours</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Total productive logged work hours.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Leaves</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-amber-400">
                  {hrAttendanceTimeOffData?.timeOff?.pendingCount || 0}
                </span>
                <span className="text-xs text-slate-400 ml-2">Awaiting Approval</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {hrAttendanceTimeOffData?.timeOff?.approvedDays || 0} days approved total.
              </p>
            </div>
          </div>

          {/* Department Headcount Breakdown Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Headcount by Department</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {hrHeadcountData.byDepartment?.length || 0} departments
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {hrHeadcountData.byDepartment?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No department records available.</p>
                ) : (
                  hrHeadcountData.byDepartment?.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-200 font-medium">{d.departmentName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">Active: {d.activeCount}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 font-bold">
                          {d.totalCount} Total
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Employment Type Distribution</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {hrHeadcountData.byType?.length || 0} types
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {hrHeadcountData.byType?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No employee type data available.</p>
                ) : (
                  hrHeadcountData.byType?.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-200 font-medium">{t.type}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 font-bold">
                        {t.count} Employees
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HR PAYROLL USER / MANAGER / ADMIN VIEW (Full Unified Dashboard)        */}
      {/* ========================================================================= */}
      {hasPayrollAccess && payrollDashboardData && (
        <div className="space-y-6">
          {/* Operational Alerts */}
          {alertsData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Operational Alerts & Action Items ({alertsData.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {alertsData.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      alert.level === 'CRITICAL'
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                        : alert.level === 'WARNING'
                        ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                        : 'bg-blue-950/30 border-blue-800/50 text-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle
                        size={16}
                        className={
                          alert.level === 'CRITICAL'
                            ? 'text-rose-400 shrink-0 mt-0.5'
                            : alert.level === 'WARNING'
                            ? 'text-amber-400 shrink-0 mt-0.5'
                            : 'text-blue-400 shrink-0 mt-0.5'
                        }
                      />
                      <div className="text-xs">
                        <div className="flex items-center justify-between gap-1 font-semibold">
                          <span>{alert.title}</span>
                          {alert.count !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono text-[10px]">
                              {alert.count}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] opacity-85 leading-snug">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High-Level Payroll KPI Metrics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Financial & Payroll Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Paid Out</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(payrollDashboardData.summary?.totalNetSalaryPaid)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {payrollDashboardData.summary?.paidPayslipsCount || 0} disbursed payslips.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gross Salary</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(payrollDashboardData.summary?.totalGrossSalary)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Allowances: {formatCurrency(payrollDashboardData.summary?.totalAllowances)}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Deductions</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-rose-300">
                    {formatCurrency(payrollDashboardData.summary?.totalDeductions)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Tax, PF & Leave deductions.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Payslips</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <FileSpreadsheet size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-white">
                    {payrollDashboardData.summary?.payslipsGenerated || 0}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">Generated</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Avg: {formatCurrency(payrollDashboardData.summary?.averageSalary)} / payslip
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Bar for Payroll Operations */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider mr-2">Quick Shortcuts:</span>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => onNavigate && onNavigate('payruns')}
              className="!bg-blue-600 hover:!bg-blue-500"
            >
              Payruns Management
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet size={14} />}
              onClick={() => onNavigate && onNavigate('payslips')}
              className="!border-slate-700 !text-slate-200 hover:!bg-slate-800"
            >
              Review Payslips
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Users size={14} />}
              onClick={() => onNavigate && onNavigate('employees')}
              className="!border-slate-700 !text-slate-200 hover:!bg-slate-800"
            >
              Employees Directory
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Calendar size={14} />}
              onClick={() => onNavigate && onNavigate('time-off')}
              className="!border-slate-700 !text-slate-200 hover:!bg-slate-800"
            >
              Time Off Approvals
            </Button>
          </div>

          {/* Detailed Analytics Grid: Salary by Department & Monthly Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Salary Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Department Salary Expenditure</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {payrollDashboardData.salaryByDepartment?.length || 0} Departments
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {(!payrollDashboardData.salaryByDepartment || payrollDashboardData.salaryByDepartment.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-6">No payroll records computed by department yet.</p>
                ) : (
                  payrollDashboardData.salaryByDepartment.map((dept, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{dept.departmentName}</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatCurrency(dept.totalNet)} Net</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Gross: {formatCurrency(dept.totalGross)}</span>
                        <span>Deductions: {formatCurrency(dept.totalDeductions)}</span>
                        <span>{dept.payslipCount} Payslips ({dept.headcount} Staff)</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Monthly Net Salary Trends */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Monthly Payroll Trends</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {payrollDashboardData.monthlyNetSalary?.length || 0} Periods
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {(!payrollDashboardData.monthlyNetSalary || payrollDashboardData.monthlyNetSalary.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-6">No historical payroll periods computed yet.</p>
                ) : (
                  payrollDashboardData.monthlyNetSalary.map((month, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white font-mono">{month.month}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Paid: {formatCurrency(month.totalPaidNet)}</span>
                          <span className="font-mono text-blue-400 font-bold">{formatCurrency(month.totalNet)} Net</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Gross: {formatCurrency(month.totalGross)}</span>
                        <span>Deductions: {formatCurrency(month.totalDeductions)}</span>
                        <span>{month.payslipCount} Payslips</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Operational Attendance & Time Off Overview */}
          {payrollDashboardData.attendanceTimeOff && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                <p className="text-xl font-bold text-emerald-400 mt-2">
                  {payrollDashboardData.attendanceTimeOff.attendance?.attendanceRate || 100}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {payrollDashboardData.attendanceTimeOff.attendance?.presentCount || 0} present records
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Worked Hours</span>
                <p className="text-xl font-bold text-white mt-2">
                  {payrollDashboardData.attendanceTimeOff.attendance?.totalWorkedHours || 0} hrs
                </p>
                <p className="text-xs text-slate-400 mt-1">Logged in attendance system</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Leave Days</span>
                <p className="text-xl font-bold text-blue-400 mt-2">
                  {payrollDashboardData.attendanceTimeOff.timeOff?.approvedDays || 0} days
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {payrollDashboardData.attendanceTimeOff.timeOff?.approvedCount || 0} requests approved
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Time Off</span>
                <p className="text-xl font-bold text-amber-400 mt-2">
                  {payrollDashboardData.attendanceTimeOff.timeOff?.pendingCount || 0} requests
                </p>
                <p className="text-xs text-slate-400 mt-1">Requiring HR review</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
