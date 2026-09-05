import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { Button } from '../../components/ui/Button';
import { SectionError } from '../../components/ui/ErrorState';

/**
 * TimeOffTypeModal Component
 * Form for HR/Admin to configure leave policy types.
 */
export function TimeOffTypeModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
  apiError = null,
}) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Days');
  const [allocationRequired, setAllocationRequired] = useState(true);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [payrollIntegration, setPayrollIntegration] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setUnit(initialData.unit || 'Days');
        setAllocationRequired(initialData.allocationRequired !== undefined ? initialData.allocationRequired : true);
        setApprovalRequired(initialData.approvalRequired !== undefined ? initialData.approvalRequired : true);
        setPayrollIntegration(initialData.payrollIntegration || false);
      } else {
        setName('');
        setUnit('Days');
        setAllocationRequired(true);
        setApprovalRequired(true);
        setPayrollIntegration(false);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const nextErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Type name is required';
    }
    if (!unit) {
      nextErrors.unit = 'Unit is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      unit,
      allocationRequired,
      approvalRequired,
      payrollIntegration,
    };

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Time Off Type' : 'Create Time Off Type'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-100">
        {apiError && (
          <SectionError
            title="Operation Failed"
            message={apiError}
            className="!bg-red-950/40 !border-red-800"
          />
        )}

        {/* Name */}
        <FormField label="Policy Name" required error={errors.name}>
          <Input
            type="text"
            placeholder="e.g. Annual Leave, Bereavement, Sick Leave"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

        {/* Unit */}
        <FormField label="Measurement Unit" required error={errors.unit}>
          <Select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={[
              { value: 'Days', label: 'Days (Full / Half Days)' },
              { value: 'Hours', label: 'Hours (Hourly Entitlement)' },
            ]}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

        {/* Configuration Toggles */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allocationRequired}
              onChange={(e) => setAllocationRequired(e.target.checked)}
              disabled={loading}
              className="mt-1 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-200 block">Allocation Required</span>
              <span className="text-xs text-slate-400">
                Requires approved allocation balance before an employee can request this time off.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={approvalRequired}
              onChange={(e) => setApprovalRequired(e.target.checked)}
              disabled={loading}
              className="mt-1 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-200 block">Approval Required</span>
              <span className="text-xs text-slate-400">
                Requests must be formally reviewed and approved by HR Manager or Admin.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={payrollIntegration}
              onChange={(e) => setPayrollIntegration(e.target.checked)}
              disabled={loading}
              className="mt-1 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-200 block">Payroll Integration</span>
              <span className="text-xs text-slate-400">
                Tag this time off type for consideration in payroll compensation calculations.
              </span>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="!bg-blue-600 hover:!bg-blue-500 text-white"
          >
            {isEditing ? 'Save Changes' : 'Create Type'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TimeOffTypeModal;
