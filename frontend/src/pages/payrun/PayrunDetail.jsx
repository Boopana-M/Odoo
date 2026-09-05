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
  Check,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  Users
} from 'lucide-react';
import { payrunApi } from '../../api/payrunApi';
import { payslipApi } from '../../api/payslipApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
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

  // Modals & Drawer state
  const [isWarningsDrawerOpen, setIsWarningsDrawerOpen] = useState(false);
  const [isEmailResultOpen, setIsEmailResultOpen] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [isDeletePayrunOpen, setIsDeletePayrunOpen] = useState(false);
  const [isEditPayrunOpen, setIsEditPayrunOpen] = useState(false);
  const [deletePayslipId, setDeletePayslipId] = useState(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    status: 'Draft'
  });

  const fetchPayrunData = async () => {
    setLoading(true);
    try {
      const [payrunRes, payslipsRes] = await Promise.all([
        payrunApi.getById(id),
        payslipApi.getByPayrunId(id)
      ]);

      setPayrun(payrunRes.data);
      setPayslips(payslipsRes.data || []);
      setEditForm({
        name: payrunRes.data?.name || '',
        status: payrunRes.data?.status || 'Draft'
      });
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

  // Action: Delete Entire Payrun
  const handleDeletePayrun = async () => {
    setActionLoading(true);
    try {
      await payrunApi.delete(id);
      success('Payrun and all associated duplicate payslips deleted successfully');
      navigate('/payroll/payruns');
    } catch (err) {
      error(err.message || 'Failed to delete payrun');
      setActionLoading(false);
    }
  };

  // Action: Edit Payrun
  const handleUpdatePayrun = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await payrunApi.update(id, editForm);
      success('Payrun updated successfully');
      setIsEditPayrunOpen(false);
      fetchPayrunData();
    } catch (err) {
      error(err.message || 'Failed to update payrun');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Delete Individual Payslip
  const handleDeleteIndividualPayslip = async () => {
    if (!deletePayslipId) return;
    setActionLoading(true);
    try {
      await payslipApi.delete(deletePayslipId);
      success('Payslip deleted successfully');
      setDeletePayslipId(null);
      fetchPayrunData();
    } catch (err) {
      error(err.message || 'Failed to delete payslip');
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

  // Helper: Parse Warning Message into structured info
  const parseWarning = (w) => {
    const type = w.type || 'CONFLICT';
    const msg = w.message || '';
    
    // Extract employee name: "Employee <Name> already..."
    const empMatch = msg.match(/Employee\s+([A-Za-z\s]+?)\s+(already|has)/i);
    const employeeName = empMatch ? empMatch[1].trim() : null;
    
    // Extract conflicting payrun name: "in another payrun (<Name>)"
    const payrunMatch = msg.match(/in another payrun \((.*?)\)/i);
    const conflictingBatch = payrunMatch ? payrunMatch[1] : null;

    return {
      type,
      message: msg,
      employeeName,
      conflictingBatch,
    };
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
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditPayrunOpen(true)}
              title="Edit Payrun Settings"
            >
              <Edit2 size={15} /> Edit Payrun
            </button>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setIsDeletePayrunOpen(true)}
              title="Delete this payrun and clear duplicate payslips"
            >
              <Trash2 size={15} /> Delete Payrun
            </button>

            {(isDraft || isComputed) && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCompute}
                disabled={actionLoading}
              >
                <Calculator size={15} /> {isComputed ? 'Re-Compute' : 'Compute'}
              </button>
            )}

            {isComputed && (
              <button
                className="btn btn-success btn-sm"
                onClick={handleValidate}
                disabled={actionLoading}
              >
                <CheckCircle size={15} /> Validate Payrun
              </button>
            )}

            {isValidated && (
              <button
                className="btn btn-success btn-sm"
                onClick={handleMarkPaid}
                disabled={actionLoading}
              >
                <CreditCard size={15} /> Mark as Paid
              </button>
            )}

            {(isValidated || isPaid) && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSendPayslips}
                disabled={actionLoading}
              >
                <Mail size={15} /> Send Payslips
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
              ₹{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

      {/* Sleek Compact Audit Notice Banner */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <div className="audit-banner-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="pulse-dot" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Payroll Audit Alert:
                </span>
                <span className="conflict-badge">
                  <AlertTriangle size={12} /> {payrun.warnings.length} Conflicts Detected
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Overlapping pay periods detected with existing payruns. Click below to review sliding conflict cards.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditPayrunOpen(true)}
              style={{ fontSize: '0.8rem' }}
            >
              <Edit2 size={13} /> Edit Batch
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setIsDeletePayrunOpen(true)}
              style={{ fontSize: '0.8rem' }}
            >
              <Trash2 size={13} /> Delete Batch
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsWarningsDrawerOpen(true)}
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Review Conflicts ({payrun.warnings.length})</span>
              <ChevronRight size={14} />
            </button>
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
                    <td>₹{Number(p.basic || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--success-text)' }}>+₹{Number(p.allowances || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(p.gross || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--danger-text)' }}>-₹{Number(p.deductions || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      ₹{Number(p.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                        {isPayrollUser && !isPaid && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--danger)', borderColor: '#FCA5A5' }}
                            onClick={() => setDeletePayslipId(p._id)}
                            title="Delete this payslip"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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

      {/* Confirm Delete Payrun Dialog */}
      <ConfirmDialog
        isOpen={isDeletePayrunOpen}
        onClose={() => setIsDeletePayrunOpen(false)}
        onConfirm={handleDeletePayrun}
        title="Delete Payrun Batch"
        message={`Are you sure you want to delete payrun "${payrun.name}"? This will permanently delete this payrun batch and all ${payslips.length} associated payslips, freeing any overlapping duplicate constraints.`}
        confirmText="Yes, Delete Payrun"
        confirmVariant="danger"
        loading={actionLoading}
      />

      {/* Confirm Delete Individual Payslip Dialog */}
      <ConfirmDialog
        isOpen={!!deletePayslipId}
        onClose={() => setDeletePayslipId(null)}
        onConfirm={handleDeleteIndividualPayslip}
        title="Delete Payslip"
        message="Are you sure you want to delete this individual payslip record?"
        confirmText="Yes, Delete Payslip"
        confirmVariant="danger"
        loading={actionLoading}
      />

      {/* Edit Payrun Modal */}
      <Modal
        isOpen={isEditPayrunOpen}
        onClose={() => setIsEditPayrunOpen(false)}
        title="Edit Payrun Settings"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditPayrunOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdatePayrun}
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdatePayrun} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label required">Payrun Batch Name</label>
            <input
              type="text"
              className="form-control"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Workflow Status</label>
            <select
              className="form-control"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              disabled={isPaid}
            >
              <option value="Draft">Draft (Reset to Draft)</option>
              <option value="Computed">Computed</option>
              <option value="Validated">Validated</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tip: Setting status to Draft or Cancelled clears duplicate locking rules.
            </span>
          </div>
        </form>
      </Modal>

      {/* Sliding Audit Warnings & Conflict Widgets Drawer */}
      {isWarningsDrawerOpen && payrun.warnings && (
        <>
          <div 
            className="drawer-backdrop" 
            onClick={() => setIsWarningsDrawerOpen(false)}
          />
          <div className="slide-drawer">
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Audit Conflicts ({payrun.warnings.length})
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Overlapping payslips & period locks detected
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsWarningsDrawerOpen(false)}
                style={{ padding: '0.35rem', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Resolution Controls in Drawer */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Batch Resolution Actions:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  onClick={() => {
                    setIsWarningsDrawerOpen(false);
                    setIsEditPayrunOpen(true);
                  }}
                >
                  <Edit2 size={13} /> Edit Payrun Dates
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  onClick={() => {
                    setIsWarningsDrawerOpen(false);
                    setIsDeletePayrunOpen(true);
                  }}
                >
                  <Trash2 size={13} /> Delete This Batch
                </button>
              </div>
            </div>

            <div className="drawer-body">
              {payrun.warnings.map((w, idx) => {
                const parsed = parseWarning(w);
                const matchingPayslip = payslips.find(p => {
                  const fullName = `${p.employeeId?.firstName || ''} ${p.employeeId?.lastName || ''}`.trim().toLowerCase();
                  return parsed.employeeName && fullName.includes(parsed.employeeName.toLowerCase());
                });

                return (
                  <div key={idx} className="conflict-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: 'var(--primary)', 
                          color: '#fff', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {parsed.employeeName ? parsed.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'EM'}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          {parsed.employeeName || 'Staff Member'}
                        </span>
                      </div>
                      <span className="conflict-badge">
                        {parsed.type}
                      </span>
                    </div>

                    <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {parsed.message}
                    </p>

                    {matchingPayslip && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.35rem', borderTop: '1px dashed rgba(217, 119, 6, 0.2)' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--danger-text)' }}
                          onClick={() => {
                            setDeletePayslipId(matchingPayslip._id);
                          }}
                        >
                          <Trash2 size={12} /> Remove this employee's payslip
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => setIsWarningsDrawerOpen(false)}
              >
                Close Panel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PayrunDetail;
