import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Calendar, Users, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { payrunApi } from '../../api/payrunApi';
import { salaryApi } from '../../api/salaryApi';
import Modal from '../../components/Modal';
import { useNotification } from '../../context/NotificationContext';

export function PayrunWizardModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { success, error } = useNotification();

  const [step, setStep] = useState(1);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);

  // Step 1 Form
  const [name, setName] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Step 2 Eligible Employees
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [fetchingEligible, setFetchingEligible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

      setName(`Payrun — ${monthName}`);
      setPeriodStart(firstDay);
      setPeriodEnd(lastDay);

      salaryApi.getStructures()
        .then((res) => {
          const list = res.data || [];
          setStructures(list);
          if (list.length > 0) setSalaryStructureId(list[0]._id);
        })
        .catch((err) => error('Failed to load salary structures'));
    }
  }, [isOpen]);

  // Step 1 -> Step 2: Fetch eligible employees without creating Payrun in DB
  const handleProceedToStep2 = async (e) => {
    e?.preventDefault();
    if (!name || !salaryStructureId || !periodStart || !periodEnd) {
      error('Please complete all setup fields');
      return;
    }

    setFetchingEligible(true);
    try {
      const res = await payrunApi.getEligibleEmployees(salaryStructureId, periodStart, periodEnd);
      const rawData = res.data || {};
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData.eligibleEmployees)
        ? rawData.eligibleEmployees
        : [];
      setEligibleEmployees(list);
      // Select all eligible by default
      setSelectedEmpIds(list.map((emp) => emp._id));
      setStep(2);
    } catch (err) {
      error(err.message || 'Failed to load eligible employees for the selected structure and period');
    } finally {
      setFetchingEligible(false);
    }
  };

  const handleToggleEmployee = (id) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((item) => item !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmpIds(eligibleEmployees.map((emp) => emp._id));
    } else {
      setSelectedEmpIds([]);
    }
  };

  // Step 2 -> Create Payrun in DB
  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      error('Please select at least one employee to include in this payrun');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        salaryStructureId,
        periodStart,
        periodEnd,
        employeeIds: selectedEmpIds
      };

      const res = await payrunApi.create(payload);
      success('Payrun batch created successfully!');
      onClose();
      if (onSuccess) onSuccess();
      navigate(`/payroll/payruns/${res.data._id}`);
    } catch (err) {
      error(err.message || 'Failed to create payrun');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Payrun Setup Wizard"
      size="lg"
      footer={
        <>
          {step === 1 ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleProceedToStep2}
                disabled={fetchingEligible}
              >
                {fetchingEligible ? 'Checking Eligible Staff...' : 'Continue to Employee Selection'} <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={loading}>
                <ArrowLeft size={16} /> Back to Setup
              </button>
              <button
                className="btn btn-success"
                onClick={handleCreatePayrun}
                disabled={loading || selectedEmpIds.length === 0}
              >
                {loading ? 'Creating Batch...' : `Create Payrun (${selectedEmpIds.length} Selected)`}
              </button>
            </>
          )}
        </>
      }
    >
      {/* Wizard Step Indicator */}
      <div className="wizard-steps">
        <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>
          <div className="wizard-step-circle">1</div>
          <span>Structure & Scope</span>
        </div>
        <div style={{ height: 1, width: 40, background: 'var(--border)' }} />
        <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>
          <div className="wizard-step-circle">2</div>
          <span>Employee Selection</span>
        </div>
      </div>

      {/* STEP 1: SETUP */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="form-grid">
          <div className="form-group full-width">
            <label className="form-label required">Payrun Batch Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label required">Salary Structure</label>
            <select
              className="form-control"
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
              required
            >
              {structures.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code}) — {s.rules?.length || 0} Rules
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              One Payrun operates under one Salary Structure. If employees require another structure, create a separate Payrun.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label required">Payroll Period Start</label>
            <input
              type="date"
              className="form-control"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Payroll Period End</label>
            <input
              type="date"
              className="form-control"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
            />
          </div>
        </form>
      )}

      {/* STEP 2: EMPLOYEE SELECTION */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>
                Select Eligible Employees ({selectedEmpIds.length} of {eligibleEmployees.length} selected)
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Only employees with active contracts matching this period and salary structure are shown.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedEmpIds.length === eligibleEmployees.length && eligibleEmployees.length > 0}
                onChange={handleSelectAll}
              />
              <span>Select All</span>
            </label>
          </div>

          <div className="table-container" style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Employee</th>
                  <th>Job Position</th>
                  <th>Department</th>
                  <th>Active Contract Wage</th>
                </tr>
              </thead>
              <tbody>
                {eligibleEmployees.map((emp) => {
                  const isChecked = selectedEmpIds.includes(emp._id);
                  return (
                    <tr
                      key={emp._id}
                      onClick={() => handleToggleEmployee(emp._id)}
                      style={{ cursor: 'pointer', background: isChecked ? 'rgba(79, 70, 229, 0.04)' : 'transparent' }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by tr click
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.employeeCode}</div>
                      </td>
                      <td>{emp.jobPosition || '-'}</td>
                      <td>{emp.department?.name || emp.departmentId?.name || (typeof emp.department === 'string' ? emp.department : '-')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {emp.contract?.wage
                          ? `₹${Number(emp.contract.wage).toLocaleString()}`
                          : emp.applicableContract?.wage
                          ? `₹${Number(emp.applicableContract.wage).toLocaleString()}`
                          : 'Wage on file'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {eligibleEmployees.length === 0 && (
            <div className="alert-banner alert-warning" style={{ marginTop: '1rem' }}>
              <AlertCircle size={18} />
              <div>
                <strong>No eligible employees found:</strong> Ensure employees have an active contract assigned to this Salary Structure and covering the date range {periodStart} to {periodEnd}.
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default PayrunWizardModal;
