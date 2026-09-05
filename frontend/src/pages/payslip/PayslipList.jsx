import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Download, ArrowRight, Filter, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { payslipApi } from '../../api/payslipApi';
import { employeeApi } from '../../api/employeeApi';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function PayslipList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isEmployeeOnly, isPayrollUser } = useAuth();
  const { success, error } = useNotification();

  const employeeFilterParam = searchParams.get('employeeId') || '';

  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmp, setSelectedEmp] = useState(isEmployeeOnly ? '' : employeeFilterParam);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (!isEmployeeOnly && selectedEmp) params.employeeId = selectedEmp;
      if (statusFilter) params.status = statusFilter;

      const [payslipRes, empRes] = await Promise.all([
        payslipApi.getAll(params),
        isEmployeeOnly ? Promise.resolve({ data: [] }) : employeeApi.getAll()
      ]);

      setPayslips(payslipRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      error(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [selectedEmp, statusFilter]);

  const handleDownloadPdf = async (e, payslipId, employeeName) => {
    e.stopPropagation();
    try {
      const blob = await payslipApi.downloadPdf(payslipId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${employeeName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('PDF downloaded successfully');
    } catch (err) {
      error('Failed to download PDF payslip');
    }
  };

  // Calculate live summary stats
  const totalNet = payslips.reduce((sum, p) => sum + (p.net || 0), 0);
  const paidCount = payslips.filter((p) => p.status === 'Paid').length;
  const validatedCount = payslips.filter((p) => p.status === 'Validated').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <FileText size={24} color="var(--primary)" />
          <h1 className="page-title">{isEmployeeOnly ? 'My Payslips & Compensation' : 'Payslips Directory'}</h1>
        </div>
      </div>

      {/* Real-time Summary Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ margin: 0, padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Earnings</div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
            ₹{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            Across {payslips.length} total generated payslip(s)
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Paid & Disbursed</div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--success-text)', marginTop: '0.2rem' }}>
            {paidCount} Payslips
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {validatedCount} currently in Validated stage
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Latest Pay Period</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {payslips[0]?.periodStart ? `${new Date(payslips[0].periodStart).toLocaleDateString()} — ${new Date(payslips[0].periodEnd).toLocaleDateString()}` : 'No Records'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {payslips[0]?.status ? `Status: ${payslips[0].status}` : 'Pending generation'}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {!isEmployeeOnly && (
        <div className="filter-bar">
          <div className="filter-inputs">
            <select
              className="form-control"
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Computed">Computed</option>
              <option value="Validated">Validated</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {(selectedEmp || statusFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedEmp('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Payslips Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Period</th>
              <th>Salary Structure</th>
              <th>Worked Days</th>
              <th>Basic</th>
              <th>Allowances</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payslips.map((p) => {
              const empName = `${p.employeeId?.firstName || ''} ${p.employeeId?.lastName || ''}`.trim() || 'Employee';
              return (
                <tr
                  key={p._id}
                  onClick={() => navigate(`/payroll/payslips/${p._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>{empName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.employeeId?.employeeCode}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {new Date(p.periodStart).toLocaleDateString()} — {new Date(p.periodEnd).toLocaleDateString()}
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {p.salaryStructureId?.name || 'Standard'}
                    </span>
                  </td>
                  <td>{p.workedDays || 0}</td>
                  <td>₹{Number(p.basic || 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--success-text)' }}>+₹{Number(p.allowances || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(p.gross || 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--danger-text)' }}>-₹{Number(p.deductions || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    ₹{Number(p.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleDownloadPdf(e, p._id, empName)}
                        title="Download PDF"
                      >
                        <Download size={14} /> PDF
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/payroll/payslips/${p._id}`)}
                      >
                        Details <ArrowRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {payslips.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No payslips found.</p>
        </div>
      )}
    </div>
  );
}

export default PayslipList;
