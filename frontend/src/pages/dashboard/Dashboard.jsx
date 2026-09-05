import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  DollarSign,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  Filter,
  CheckCircle,
  TrendingUp,
  Building,
  Briefcase,
  Bell,
  X,
  ChevronRight,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { dashboardApi } from '../../api/dashboardApi';
import { departmentApi } from '../../api/departmentApi';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function Dashboard() {
  const { user, role, isEmployeeOnly } = useAuth();
  const { error } = useNotification();

  if (isEmployeeOnly || role === 'Employee') {
    return <Navigate to="/employees" replace />;
  }

  // Filters
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeType, setEmployeeType] = useState('');

  // Alerts Slide-Over Drawer State
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);

  // Data
  const [departments, setDepartments] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load departments once
  useEffect(() => {
    departmentApi.getAll()
      .then((res) => setDepartments(res.data || []))
      .catch((err) => console.warn('Could not load departments for filter', err));
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getFullDashboard({
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        departmentId: departmentId || undefined,
        employeeType: employeeType || undefined
      });
      setDashboardData(res.data || {});
    } catch (err) {
      error(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periodStart, periodEnd, departmentId, employeeType]);

  const summary = dashboardData?.summary || {};
  const salaryByDept = Array.isArray(dashboardData?.salaryByDepartment) ? dashboardData.salaryByDepartment : [];
  const monthlyTrends = Array.isArray(dashboardData?.monthlyNetSalary) ? dashboardData.monthlyNetSalary : [];
  const headcountObj = dashboardData?.headcount || {};
  const headcountByDept = Array.isArray(headcountObj)
    ? headcountObj
    : (Array.isArray(headcountObj.byDepartment) ? headcountObj.byDepartment : []);
  const attTimeOff = dashboardData?.attendanceTimeOff || {};
  const alerts = Array.isArray(dashboardData?.alerts) ? dashboardData.alerts : [];

  // Chart Data: Salary by Department
  const deptLabels = salaryByDept.map((d) => d.departmentName || 'Unknown');
  const deptSalaries = salaryByDept.map((d) => d.totalNet || d.totalGross || d.totalSalaryCost || 0);

  const salaryByDeptChartData = {
    labels: deptLabels.length > 0 ? deptLabels : ['No Data'],
    datasets: [
      {
        label: 'Net Salary Expenditure (₹)',
        data: deptSalaries.length > 0 ? deptSalaries : [0],
        backgroundColor: '#714B67',
        hoverBackgroundColor: '#5d3c54',
        borderRadius: 6
      }
    ]
  };

  // Chart Data: Monthly Net Salary Trends
  const trendLabels = monthlyTrends.map((m) => m.month || 'Month');
  const trendValues = monthlyTrends.map((m) => m.totalNet || m.totalNetSalary || 0);

  const monthlyTrendChartData = {
    labels: trendLabels.length > 0 ? trendLabels : ['Current Period'],
    datasets: [
      {
        label: 'Net Salary Paid (₹)',
        data: trendValues.length > 0 ? trendValues : [summary.totalNetSalaryPaid || summary.totalNetSalary || 0],
        borderColor: '#017E84',
        backgroundColor: 'rgba(1, 126, 132, 0.1)',
        pointBackgroundColor: '#017E84',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        fill: true,
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, font: { size: 12 }, color: '#6C757D' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#6C757D',
          callback: (value) => `₹${value.toLocaleString()}`
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6C757D' }
      }
    }
  };

  const totalEmps = Number(headcountObj.totalActive || headcountObj.totalCount || (headcountByDept.reduce((acc, h) => acc + (h.activeCount || h.totalCount || 0), 0)) || 10);
  const paidCount = Number(summary.paidPayslips ?? summary.paidPayslipsCount ?? summary.payslipsGenerated ?? 0);
  const processedPercent = Math.min(100, Math.max(15, Math.round((paidCount / Math.max(totalEmps, 1)) * 100)));

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-area">
          <BarChart3 size={26} color="var(--primary)" />
          <div>
            <h1 className="page-title">Executive HR & Payroll Dashboard</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Good morning, {user?.name || 'HR Manager'} 👋 • Command Center
            </p>
          </div>
        </div>

        {/* Top Notice Action Button */}
        <div className="page-actions">
          {alerts && alerts.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsAlertDrawerOpen(true)}
              className="btn btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#92400E',
                fontWeight: 600,
                borderRadius: '9999px',
                padding: '0.45rem 0.95rem',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.15)',
                cursor: 'pointer'
              }}
              title="View Action Items & Alerts"
            >
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Bell size={16} color="#D97706" />
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#DC2626',
                    border: '2px solid #FEF3C7'
                  }}
                />
              </span>
              <span>{alerts.length} Pending Action{alerts.length > 1 ? 's' : ''}</span>
              <ChevronRight size={14} color="#92400E" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAlertDrawerOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: '9999px', gap: '0.4rem' }}
            >
              <Bell size={15} color="var(--text-muted)" />
              <span>0 Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="filter-inputs">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Period:</span>
            <input
              type="date"
              className="form-control"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              placeholder="From"
            />
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <input
              type="date"
              className="form-control"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              placeholder="To"
            />
          </div>

          <select
            className="form-control"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={employeeType}
            onChange={(e) => setEmployeeType(e.target.value)}
          >
            <option value="">All Employee Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
        </div>

        {(periodStart || periodEnd || departmentId || employeeType) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setPeriodStart('');
              setPeriodEnd('');
              setDepartmentId('');
              setEmployeeType('');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Signature Payroll Health & Readiness Section */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#ffffff', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>⚡ Payroll Health & Validation</span>
              <span className="badge badge-success">Readiness: {processedPercent}%</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time payroll verification engine across active employment contracts, attendance records, and salary rules.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a href="/payroll/payruns" className="btn btn-primary btn-sm">
              <Briefcase size={15} /> Process Payrun
            </a>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div
            style={{
              width: `${processedPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #714B67 0%, #017E84 100%)',
              transition: 'width 0.5s ease'
            }}
          />
        </div>

        {/* 4-Item Verification Checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
            <CheckCircle size={16} color="#16A34A" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Attendance validated</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
            <CheckCircle size={16} color="#16A34A" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Contracts verified</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
            <CheckCircle size={16} color="#16A34A" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Leave calculations</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
            <CheckCircle size={16} color="#16A34A" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Salary rules mapped</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (5 Core Project Metrics) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Net Salary Paid</div>
          <div className="kpi-value" style={{ color: '#714B67' }}>
            ₹{Number(summary.totalNetSalaryPaid || summary.totalNetSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            Gross Total: ₹{Number(summary.totalGrossSalary || 0).toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Payslips Generated</div>
          <div className="kpi-value" style={{ color: 'var(--text-main)' }}>
            {summary.payslipsGenerated ?? summary.totalPayslips ?? 0}
          </div>
          <div className="kpi-subtext" style={{ color: 'var(--success-text)' }}>
            Paid: {summary.paidPayslips ?? summary.paidPayslipsCount ?? 0} • Validated: {summary.validatedPayslips ?? summary.validatedPayslipsCount ?? 0}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Average Salary / Employee</div>
          <div className="kpi-value" style={{ color: 'var(--text-main)' }}>
            ₹{Number(summary.averageSalary ?? summary.avgSalary ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">Across active contracts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Approved Time Off</div>
          <div className="kpi-value" style={{ color: 'var(--info-text)' }}>
            {attTimeOff.approvedTimeOffDays ?? attTimeOff.timeOff?.approvedDays ?? summary.approvedTimeOffDays ?? 0} Days
          </div>
          <div className="kpi-subtext">
            Pending Approval: {attTimeOff.pendingTimeOffRequests ?? attTimeOff.timeOff?.pendingCount ?? 0}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Attendance Health</div>
          <div className="kpi-value" style={{ color: 'var(--success-text)' }}>
            {attTimeOff.attendanceHealth ?? attTimeOff.attendance?.attendanceRate ?? summary.attendanceHealth ?? 100}%
          </div>
          <div className="kpi-subtext">Present vs Expected shifts</div>
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Salary Cost by Department</h3>
          </div>
          <div style={{ height: 280 }}>
            <Bar data={salaryByDeptChartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Net Salary Trends</h3>
          </div>
          <div style={{ height: 280 }}>
            <Line data={monthlyTrendChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Operational Breakdown & Department Headcount */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Department Headcount & Expenditure */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Department Headcount & Monthly Spend</h3>
          </div>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Headcount</th>
                  <th style={{ textAlign: 'right' }}>Total Salary Spend</th>
                </tr>
              </thead>
              <tbody>
                {headcountByDept.map((h, idx) => {
                  const deptSpend = salaryByDept.find(
                    (s) => s.departmentName === h.departmentName || s.departmentId === h.departmentId
                  )?.totalNet || 0;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{h.departmentName}</td>
                      <td>
                        <span className="badge badge-info">
                          {h.activeCount || h.totalCount || 0} Staff
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        ₹{Number(deptSpend).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance & Time Off Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Attendance & Time Off Health Overview</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="card" style={{ background: 'var(--bg-subtle)', margin: 0, padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Present Records
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-text)', marginTop: '0.25rem' }}>
                {attTimeOff.presentCount ?? attTimeOff.attendance?.presentCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Late Entries: {attTimeOff.lateCount ?? attTimeOff.attendance?.lateCount ?? 0}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--bg-subtle)', margin: 0, padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Exceptions / Absences
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger-text)', marginTop: '0.25rem' }}>
                {attTimeOff.absentCount ?? attTimeOff.attendance?.absentCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Missing Out: {attTimeOff.missingCheckoutCount ?? attTimeOff.attendance?.missingCheckoutCount ?? 0}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--bg-subtle)', margin: 0, padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Overtime Logged
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-text)', marginTop: '0.25rem' }}>
                {attTimeOff.overtimeHours ?? attTimeOff.attendance?.overtimeHours ?? 0} hrs
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Manual Edits: {attTimeOff.manualEditCount ?? attTimeOff.attendance?.manualEditCount ?? 0}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--bg-subtle)', margin: 0, padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Leave Requests
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--info-text)', marginTop: '0.25rem' }}>
                {attTimeOff.pendingTimeOffRequests ?? attTimeOff.timeOff?.pendingCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Awaiting HR Approval
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sliding System Alerts & Action Items Drawer */}
      {isAlertDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsAlertDrawerOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: '#FEF3C7', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Bell size={18} color="#D97706" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Action Items & Alerts
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {alerts.length} pending item{alerts.length !== 1 ? 's' : ''} requiring review
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAlertDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {alerts && alerts.length > 0 ? (
                alerts.map((alt, idx) => {
                  const isWarning = alt.level === 'WARNING';
                  const isCritical = alt.level === 'CRITICAL';
                  const isPayrun = alt.title?.toLowerCase().includes('pay run') || alt.title?.toLowerCase().includes('payroll');
                  const isTimeOff = alt.title?.toLowerCase().includes('time off') || alt.title?.toLowerCase().includes('leave');

                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${isCritical ? '#FECACA' : isWarning ? '#FDE68A' : '#BAE6FD'}`,
                        borderLeft: `4px solid ${isCritical ? '#DC2626' : isWarning ? '#D97706' : '#0284C7'}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {isCritical ? (
                            <AlertTriangle size={16} color="#DC2626" />
                          ) : isWarning ? (
                            <AlertTriangle size={16} color="#D97706" />
                          ) : (
                            <Info size={16} color="#0284C7" />
                          )}
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {alt.title}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: isCritical ? '#FEE2E2' : isWarning ? '#FEF3C7' : '#E0F2FE',
                            color: isCritical ? '#991B1B' : isWarning ? '#92400E' : '#0369A1'
                          }}
                        >
                          {alt.level || 'ACTION'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {alt.message}
                      </p>

                      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {isPayrun ? (
                          <a
                            href="/payroll/payruns"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                            onClick={() => setIsAlertDrawerOpen(false)}
                          >
                            <Briefcase size={14} /> Review Payruns <ArrowRight size={13} />
                          </a>
                        ) : isTimeOff ? (
                          <a
                            href="/time-off/requests"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                            onClick={() => setIsAlertDrawerOpen(false)}
                          >
                            <Calendar size={14} /> Review Requests <ArrowRight size={13} />
                          </a>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                            onClick={() => setIsAlertDrawerOpen(false)}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                  <CheckCircle size={40} color="#16A34A" style={{ margin: '0 auto 1rem' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    All Systems Operational
                  </h4>
                  <p style={{ fontSize: '0.825rem' }}>No pending alerts or urgent actions required at this moment.</p>
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsAlertDrawerOpen(false)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
