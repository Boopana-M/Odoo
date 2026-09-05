import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Download,
  Printer,
  CheckCircle,
  CreditCard,
  Building,
  User,
  Calendar,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { payslipApi } from '../../api/payslipApi';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function PayslipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPayrollUser } = useAuth();
  const { success, error } = useNotification();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayslip = async () => {
    setLoading(true);
    try {
      const res = await payslipApi.getById(id);
      setPayslip(res.data);
    } catch (err) {
      error(err.message || 'Failed to load payslip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslip();
  }, [id]);

  const handleDownloadPdf = async () => {
    try {
      const empName = `${payslip.employeeId?.firstName || ''} ${payslip.employeeId?.lastName || ''}`.trim() || 'Employee';
      const blob = await payslipApi.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${empName.replace(/\s+/g, '_')}_${payslip.periodStart?.split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Payslip PDF downloaded!');
    } catch (err) {
      error('Failed to download PDF document from server');
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    try {
      await payslipApi.validate(id);
      success('Payslip marked as Validated');
      fetchPayslip();
    } catch (err) {
      error(err.message || 'Validation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      await payslipApi.markPaid(id);
      success('Payslip marked as Paid');
      fetchPayslip();
    } catch (err) {
      error(err.message || 'Mark paid failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading payslip...</div>;
  }

  if (!payslip) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Payslip not found.</div>;
  }

  const empName = `${payslip.employeeId?.firstName || ''} ${payslip.employeeId?.lastName || ''}`.trim() || 'Employee';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-area">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">Payslip — {empName}</h1>
            <StatusBadge status={payslip.status} />
          </div>
        </div>

        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={handleDownloadPdf}
          >
            <Download size={16} /> Print / Download PDF
          </button>

          {isPayrollUser && payslip.status === 'Computed' && (
            <button
              className="btn btn-success"
              onClick={handleValidate}
              disabled={actionLoading}
            >
              <CheckCircle size={16} /> Validate Payslip
            </button>
          )}

          {isPayrollUser && payslip.status === 'Validated' && (
            <button
              className="btn btn-success"
              onClick={handleMarkPaid}
              disabled={actionLoading}
            >
              <CreditCard size={16} /> Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Main Payslip Statement Card */}
      <div className="card">
        {/* Meta Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1.5rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Employee Details</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.2rem' }}>{empName}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Code: {payslip.employeeId?.employeeCode} • {payslip.employeeId?.jobPosition}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Email: {payslip.employeeId?.email}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pay Period & Batch</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>
              {new Date(payslip.periodStart).toLocaleDateString()} — {new Date(payslip.periodEnd).toLocaleDateString()}
            </div>
            {payslip.payrunId && (
              <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Batch: <Link to={`/payroll/payruns/${payslip.payrunId._id || payslip.payrunId}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {payslip.payrunId?.name || 'View Parent Payrun'}
                </Link>
              </div>
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Worked Days: <strong>{payslip.workedDays || 0} days</strong>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Salary Structure Used</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>
              {payslip.salaryStructureId?.name || 'Standard Structure'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Code: {payslip.salaryStructureId?.code}
            </div>
            {payslip.contractId && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Contract Base Wage: <strong>${Number(payslip.contractId?.wage || 0).toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Financial Highlights KPI Cards */}
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card" style={{ background: '#f8fafc' }}>
            <div className="kpi-title">Basic Salary</div>
            <div className="kpi-value">${Number(payslip.basic || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="kpi-card" style={{ background: '#f0fdf4' }}>
            <div className="kpi-title" style={{ color: '#15803d' }}>Total Allowances</div>
            <div className="kpi-value" style={{ color: '#15803d' }}>+${Number(payslip.allowances || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="kpi-card" style={{ background: '#f8fafc' }}>
            <div className="kpi-title">Gross Salary</div>
            <div className="kpi-value">${Number(payslip.gross || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="kpi-card" style={{ background: '#fef2f2' }}>
            <div className="kpi-title" style={{ color: '#b91c1c' }}>Total Deductions</div>
            <div className="kpi-value" style={{ color: '#b91c1c' }}>-${Number(payslip.deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="kpi-card" style={{ background: '#eef2ff', borderColor: '#c7d2fe' }}>
            <div className="kpi-title" style={{ color: '#3730a3' }}>Final Net Pay</div>
            <div className="kpi-value" style={{ color: '#3730a3' }}>${Number(payslip.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* Detailed Salary Rules Computation Breakdown */}
        <div>
          <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
            Salary Rule Computation Breakdown (Payslip Lines)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            The exact sequenced calculation output stored in the database.
          </p>

          <div className="table-container" style={{ margin: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Seq #</th>
                  <th>Salary Component / Rule</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Calculated Amount</th>
                </tr>
              </thead>
              <tbody>
                {payslip.lines && payslip.lines.length > 0 ? (
                  payslip.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)', width: 80 }}>
                        #{line.sequence || idx + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>{line.name}</td>
                      <td>
                        <span className="badge badge-neutral">{line.code}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          line.category === 'Basic' || line.category === 'Gross' || line.category === 'Net'
                            ? 'badge-success'
                            : line.category === 'Deductions'
                            ? 'badge-danger'
                            : 'badge-info'
                        }`}>
                          {line.category}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                        {line.category === 'Deductions' ? '-' : ''}${Number(line.calculatedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No detailed rule breakdown lines recorded.
                    </td>
                  </tr>
                )}
              </tbody>
              {payslip.lines && payslip.lines.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan="4" style={{ textAlign: 'right', fontSize: '1rem' }}>NET SALARY DISBURSEMENT:</td>
                    <td style={{ textAlign: 'right', fontSize: '1.2rem', color: 'var(--primary)' }}>
                      ${Number(payslip.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayslipDetail;
