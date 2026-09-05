import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { Button } from '../../components/ui/Button';
import { SectionError } from '../../components/ui/ErrorState';

/**
 * TimeOffAllocationModal Component
 * Form for HR/Admin to allocate leave balances to an employee.
 */
export function TimeOffAllocationModal({
  isOpen,
  onClose,
  onSubmit,
  employees = [],
  timeOffTypes = [],
  loading = false,
  apiError = null,
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('10');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('Approved');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setEmployeeId(employees[0]?._id || '');
      setTimeOffTypeId(timeOffTypes[0]?._id || '');
      setAllocatedAmount('10');

      const year = new Date().getFullYear();
      setValidFrom(`${year}-01-01`);
      setValidTo(`${year}-12-31`);
      setApprovalStatus('Approved');
      setErrors({});
    }
  }, [isOpen, employees, timeOffTypes]);

  const selectedType = timeOffTypes.find((t) => t._id === timeOffTypeId);
  const unit = selectedType?.unit || 'Days';

  const validate = () => {
    const nextErrors = {};
    if (!employeeId) {
      nextErrors.employeeId = 'Employee is required';
    }
    if (!timeOffTypeId) {
      nextErrors.timeOffTypeId = 'Time off type is required';
    }
    const num = Number(allocatedAmount);
    if (isNaN(num) || num <= 0) {
      nextErrors.allocatedAmount = 'Allocated amount must be greater than zero';
    }
    if (!validFrom) {
      nextErrors.validFrom = 'Valid from date is required';
    }
    if (!validTo) {
      nextErrors.validTo = 'Valid to date is required';
    }
    if (validFrom && validTo) {
      if (new Date(validTo).getTime() < new Date(validFrom).getTime()) {
        nextErrors.validTo = 'Valid to date cannot be before valid from date';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      employeeId,
      timeOffTypeId,
      allocatedAmount: Number(allocatedAmount),
      validFrom: new Date(`${validFrom}T00:00:00.000Z`).toISOString(),
      validTo: new Date(`${validTo}T23:59:59.000Z`).toISOString(),
      approvalStatus,
    };

    onSubmit(payload);
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp._id || emp.id,
    label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode || 'No Code'})`,
  }));

  const typeOptions = timeOffTypes.map((t) => ({
    value: t._id,
    label: `${t.name} (${t.unit})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate Time Off Entitlement" size="md">
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-100">
        {apiError && (
          <SectionError
            title="Allocation Failed"
            message={apiError}
            className="!bg-red-950/40 !border-red-800"
          />
        )}

        {/* Employee */}
        <FormField label="Employee" required error={errors.employeeId}>
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={[{ value: '', label: '— Select Employee —' }, ...employeeOptions]}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

        {/* Time Off Type */}
        <FormField label="Time Off Type" required error={errors.timeOffTypeId}>
          <Select
            value={timeOffTypeId}
            onChange={(e) => setTimeOffTypeId(e.target.value)}
            options={typeOptions}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

        {/* Allocated Amount */}
        <FormField label={`Allocated Amount (${unit})`} required error={errors.allocatedAmount}>
          <Input
            type="number"
            step="0.5"
            min="0.5"
            value={allocatedAmount}
            onChange={(e) => setAllocatedAmount(e.target.value)}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

        {/* Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Valid From" required error={errors.validFrom}>
            <Input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              disabled={loading}
              className="!bg-slate-900 !border-slate-700 !text-white"
            />
          </FormField>

          <FormField label="Valid To" required error={errors.validTo}>
            <Input
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              disabled={loading}
              className="!bg-slate-900 !border-slate-700 !text-white"
            />
          </FormField>
        </div>

        {/* Approval Status */}
        <FormField label="Initial Approval Status" required>
          <Select
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
            options={[
              { value: 'Approved', label: 'Approved (Immediately Available)' },
              { value: 'Pending', label: 'Pending (Requires Subsequent Approval)' },
            ]}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

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
            Save Allocation
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TimeOffAllocationModal;
