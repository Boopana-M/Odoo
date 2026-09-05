import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  Calculator,
  CheckCircle,
  CreditCard,
  Mail,
  AlertTriangle,
  FileText,
  Download,
  Clock,
  Layers,
  Check
} from 'lucide-react';
import { payrunApi } from '../../api/payrunApi';
import { payslipApi } from '../../api/payslipApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function PayrunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPayrollUser } = useAuth();
  const { success, error } = useNotification();

  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Send Payslips Modal
  const [isEmailResultOpen, setIsEmailResultOpen] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  const fetchPayrunData = async () => {
    setLoading(true);
    try {
      const [payrunRes, payslipsRes] = await Promise.all([
        payrunApi.getById(id),
        payslipApi.getByPayrunId(id)
      ]);

      setPayrun(payrunRes.data);
      setPayslips(payslipsRes.data || []);
    } catch (err) {
      error(err.message || 'Failed to load payrun processing details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrunData();
  }, [id]);

  // Action: Compute
  const handleCompute = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.compute(id);
      setPayrun(res.data);
      success('Payrun computed! Payslips and salary rules evaluated.');
      fetchPayrunData();
    } catch (err) {
      error(err.message || 'Compute failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Validate
  const handleValidate = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.validate(id);
      setPayrun(res.data);
      success('Payrun validated successfully! Payroll finalized.');
      fetchPayrunData();
    } catch (err) {
      error(err.message || 'Validation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Mark Paid
  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.markPaid(id);
      setPayrun(res.data);
      success('Payrun marked as Paid!');
      fetchPayrunData();
    } catch (err) {
      error(err.message || 'Mark Paid failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Send Payslips
  const handleSendPayslips = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.sendPayslips(id);
      setEmailResult(res.data);
      setIsEmailResultOpen(true);
      success('Payslip emails dispatched!');
      fetchPayrunData();
    } catch (err) {
      error(err.message || 'Send Payslips failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async (payslipId, employeeName) => {
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
      error('Failed to download payslip PDF');
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading payrun processing view...</div>;
  }

  if (!payrun) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Payrun not found.</div>;
  }

  const isDraft = payrun.status === 'Draft';
  const isComputed = payrun.status === 'Computed';
  const isValidated = payrun.status === 'Validated';
  const isPaid = payrun.status === 'Paid';

  // Calculate batch totals
  const totalNet = payslips.reduce((sum, p) => sum + (p.net || 0), 0);
  const totalGross = payslips.reduce((sum, p) => sum + (p.gross || 0), 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + (p.deductions || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-area">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/payroll/payruns')}
          >
            <ArrowLeft size={16} /> All Payruns
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{payrun.name}</h1>
            <StatusBadge status={payrun.status} />
          </div>
        </div>

        {/* Action Toolbar (Following strict state transitions) */}
        {isPayrollUser && (
          <div className="page-actions">
            {(isDraft || isComputed) && (
              <button
                className="btn btn-primary"
                onClick={handleCompute}
                disabled={actionLoading}
              >
                <Calculator size={16} /> {isComputed ? 'Re-Compute' : 'Compute'}
              </button>
            )}

            {isComputed && (
              <button
                className="btn btn-success"
                onClick={handleValidate}
                disabled={actionLoading}
              >
                <CheckCircle size={16} /> Validate Payrun
              </button>
            )}

            {isValidated && (
              <button
                className="btn btn-success"
                onClick={handleMarkPaid}
                disabled={actionLoading}
              >
                <CreditCard size={16} /> Mark as Paid
              </button>
            )}

            {(isValidated || isPaid) && (
              <button
                className="btn btn-primary"
                onClick={handleSendPayslips}
                disabled={actionLoading}
              >
                <Mail size={16} /> Send Payslips by Email
              </button>
            )}
          </div>
        )}
      </div>

      {/* Payrun Summary Card */}
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Salary Structure</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.2rem' }}>
              {payrun.salaryStructureId?.name || 'Standard Structure'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {payrun.salaryStructureId?.code}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Payroll Period</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.2rem' }}>
              {new Date(payrun.periodStart).toLocaleDateString()} — {new Date(payrun.periodEnd).toLocaleDateString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Employees Included</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {payrun.employeeIds?.length || 0} Staff
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Salary Batch</div>
            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
              ${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* State Pipeline Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>WORKFLOW STAGE:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge ${isDraft ? 'badge-primary' : 'badge-neutral'}`}>1. Draft</span>
            <span>→</span>
            <span className={`badge ${isComputed ? 'badge-primary' : 'badge-neutral'}`}>2. Computed</span>
            <span>→</span>
            <span className={`badge ${isValidated ? 'badge-primary' : 'badge-neutral'}`}>3. Validated</span>
            <span>→</span>
            <span className={`badge ${isPaid ? 'badge-success' : 'badge-neutral'}`}>4. Paid</span>
          </div>
        </div>
      </div>

      {/* Warnings Banner */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <div className="alert-banner alert-warning">
          <AlertTriangle size={20} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              Attention: {payrun.warnings.length} Payroll Warning(s) Detected
            </div>
            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
              {payrun.warnings.map((w, idx) => (
                <li key={idx} style={{ marginTop: '0.2rem' }}>
                  <strong>[{w.type}]:</strong> {w.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Payslips Generated Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Generated Payslips ({payslips.length})</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Breakdown computed according to the assigned salary rules.
            </p>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Worked Days</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Email Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((p) => {
                const empName = `${p.employeeId?.firstName || ''} ${p.employeeId?.lastName || ''}`.trim() || 'Employee';
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{empName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.employeeId?.employeeCode} • {p.employeeId?.jobPosition}
                      </div>
                    </td>
                    <td>{p.workedDays || 0} days</td>
                    <td>${Number(p.basic || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--success-text)' }}>+${Number(p.allowances || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>${Number(p.gross || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--danger-text)' }}>-${Number(p.deductions || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      ${Number(p.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      <span className={`badge ${p.emailStatus === 'Sent' ? 'badge-success' : 'badge-neutral'}`}>
                        {p.emailStatus || 'Pending'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownloadPdf(p._id, empName)}
                          title="Print / Download PDF"
                        >
                          <Download size={14} /> PDF
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/payroll/payslips/${p._id}`)}
                        >
                          View Breakdown
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {payslips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No payslips calculated yet. Click <strong>Compute</strong> above to run rule calculations for the selected employees.
          </div>
        )}
      </div>

      {/* Send Payslips Result Modal */}
      <Modal
        isOpen={isEmailResultOpen}
        onClose={() => setIsEmailResultOpen(false)}
        title="Send Payslips Email Dispatch Report"
        footer={
          <button className="btn btn-primary" onClick={() => setIsEmailResultOpen(false)}>
            Close Report
          </button>
        }
      >
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ textAlign: 'center', background: 'var(--success-bg)', margin: 0, padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success-text)' }}>
                {emailResult?.sentCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success-text)' }}>Emails Delivered</div>
            </div>

            <div className="card" style={{ textAlign: 'center', background: 'var(--danger-bg)', margin: 0, padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger-text)' }}>
                {emailResult?.failedCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger-text)' }}>Failed</div>
            </div>

            <div className="card" style={{ textAlign: 'center', background: 'var(--bg-subtle)', margin: 0, padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {emailResult?.skippedCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Skipped / No Email</div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {emailResult?.message || 'The backend dispatched individual PDF payslips to employee mailboxes via Nodemailer SMTP service.'}
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default PayrunDetail;
