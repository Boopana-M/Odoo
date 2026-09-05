import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, ArrowRight, AlertTriangle, CheckCircle, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { payrunApi } from '../../api/payrunApi';
import StatusBadge from '../../components/StatusBadge';
import PayrunWizardModal from './PayrunWizardModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function PayrunList() {
  const navigate = useNavigate();
  const { isPayrollUser } = useAuth();
  const { success, error } = useNotification();

  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPayruns = async () => {
    setLoading(true);
    try {
      const res = await payrunApi.getAll();
      setPayruns(res.data || []);
    } catch (err) {
      error(err.message || 'Failed to load payrun batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, []);

  const handleDeletePayrun = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await payrunApi.delete(deleteTarget._id);
      success(`Payrun "${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      fetchPayruns();
    } catch (err) {
      error(err.message || 'Failed to delete payrun');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <Briefcase size={24} color="var(--primary)" />
          <h1 className="page-title">Payruns & Payroll Batches</h1>
        </div>

        <div className="page-actions">
          {isPayrollUser && (
            <button className="btn btn-primary" onClick={() => setIsWizardOpen(true)}>
              <Plus size={16} /> New Payrun
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Payrun Batch Name</th>
              <th>Salary Structure</th>
              <th>Period</th>
              <th>Employees</th>
              <th>Payslips Generated</th>
              <th>Status</th>
              <th>Warnings</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payruns.map((p) => {
              const warningCount = p.warnings?.length || 0;
              return (
                <tr key={p._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: #{p._id.slice(-6).toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {p.salaryStructureId?.name || 'Standard'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {new Date(p.periodStart).toLocaleDateString()} — {new Date(p.periodEnd).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {p.employeeIds?.length || 0} employees
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {p.payslipIds?.length || 0} payslips
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    {warningCount > 0 ? (
                      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={12} /> {warningCount} warning(s)
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>None</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/payroll/payruns/${p._id}`)}
                      >
                        Open View <ArrowRight size={14} />
                      </button>
                      {isPayrollUser && p.status !== 'Paid' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)', borderColor: '#FCA5A5' }}
                          onClick={() => setDeleteTarget(p)}
                          title="Delete payrun batch"
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

      {payruns.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No payrun batches created yet.</p>
          {isPayrollUser && (
            <button className="btn btn-primary" onClick={() => setIsWizardOpen(true)}>
              <Plus size={16} /> Launch Setup Wizard
            </button>
          )}
        </div>
      )}

      {/* Confirm Delete Payrun Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePayrun}
        title="Delete Payrun Batch"
        message={`Are you sure you want to delete payrun "${deleteTarget?.name}"? This will remove all generated duplicate payslips and free the period.`}
        confirmText="Yes, Delete Payrun"
        confirmVariant="danger"
        loading={deleteLoading}
      />

      {/* 2-Step Wizard Modal */}
      <PayrunWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchPayruns}
      />
    </div>
  );
}

export default PayrunList;
