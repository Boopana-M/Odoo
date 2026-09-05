import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Download, ArrowRight, Filter } from 'lucide-react';
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

  const [selectedEmp, setSelectedEmp] = useState(isEmployeeOnly ? user?.employeeId : employeeFilterParam);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const [payslipRes, empRes] = await Promise.all([
        payslipApi.getAll({
          employeeId: selectedEmp,
          status: statusFilter
        }),
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

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <FileText size={24} color="var(--primary)" />
          <h1 className="page-title">Payslips Directory</h1>
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
                  <td>${Number(p.basic || 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--success-text)' }}>+${Number(p.allowances || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>${Number(p.gross || 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--danger-text)' }}>-${Number(p.deductions || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    ${Number(p.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
