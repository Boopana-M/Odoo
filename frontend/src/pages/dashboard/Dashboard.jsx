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
  Briefcase
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
        backgroundColor: '#8a75bd',
        hoverBackgroundColor: '#a18ecc',
        borderRadius: 8
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
        borderColor: '#00d2c4',
        backgroundColor: 'rgba(0, 210, 196, 0.15)',
        pointBackgroundColor: '#00d2c4',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        fill: true,
        tension: 0.35
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, font: { size: 12 }, color: '#9ca3af' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: {
          color: '#9ca3af',
          callback: (value) => `₹${value.toLocaleString()}`
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-area">
          <BarChart3 size={24} color="var(--primary)" />
          <h1 className="page-title">Executive HR & Payroll Dashboard</h1>
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

      {/* Operational Alerts Row */}
      {alerts && alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {alerts.map((alt, idx) => (
            <div
              key={idx}
              className={`alert-banner ${alt.level === 'CRITICAL' ? 'alert-danger' : alt.level === 'WARNING' ? 'alert-warning' : 'alert-info'}`}
              style={{ margin: 0 }}
            >
              <AlertTriangle size={18} />
              <div style={{ flex: 1 }}>
                <strong>{alt.title}:</strong> {alt.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards Row (5 Core Project Metrics) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Net Salary Paid</div>
          <div className="kpi-value" style={{ color: '#c084fc' }}>
            ₹{Number(summary.totalNetSalaryPaid || summary.totalNetSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            Gross Total: ₹{Number(summary.totalGrossSalary || 0).toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Payslips Generated</div>
          <div className="kpi-value" style={{ color: '#f9fafb' }}>
            {summary.payslipsGenerated ?? summary.totalPayslips ?? 0}
          </div>
          <div className="kpi-subtext" style={{ color: 'var(--success-text)' }}>
            Paid: {summary.paidPayslips ?? summary.paidPayslipsCount ?? 0} • Validated: {summary.validatedPayslips ?? summary.validatedPayslipsCount ?? 0}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Average Salary / Employee</div>
          <div className="kpi-value" style={{ color: '#f9fafb' }}>
            ₹{Number(summary.averageSalary ?? summary.avgSalary ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">Across active contracts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Approved Time Off</div>
          <div className="kpi-value" style={{ color: '#67e8f9' }}>
            {attTimeOff.approvedTimeOffDays ?? attTimeOff.timeOff?.approvedDays ?? summary.approvedTimeOffDays ?? 0} Days
          </div>
          <div className="kpi-subtext">
            Pending Approval: {attTimeOff.pendingTimeOffRequests ?? attTimeOff.timeOff?.pendingCount ?? 0}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Attendance Health</div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
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
    </div>
  );
}

export default Dashboard;
