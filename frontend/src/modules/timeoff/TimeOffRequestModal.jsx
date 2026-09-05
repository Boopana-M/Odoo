import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, User, Info } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { Button } from '../../components/ui/Button';
import { SectionError } from '../../components/ui/ErrorState';
import { getAvailableAllocationApi } from '../../services/timeOff';

/**
 * Calculate default duration between two dates
 */
function calculateDays(startStr, endStr) {
  if (!startStr || !endStr) return 1;
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

/**
 * TimeOffRequestModal Component
 * Handles leave application with real-time backend balance query and duration calculation.
 */
export function TimeOffRequestModal({
  isOpen,
  onClose,
  onSubmit,
  employees = [],
  timeOffTypes = [],
  isEmployeeRole = false,
  currentUserEmployeeId = null,
  loading = false,
  apiError = null,
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('1');
  const [durationManual, setDurationManual] = useState(false);

  // Available balance query state
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [checkingBalance, setCheckingBalance] = useState(false);

  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const empId = isEmployeeRole && currentUserEmployeeId ? currentUserEmployeeId : '';
      setEmployeeId(empId);

      const defaultType = timeOffTypes[0]?._id || '';
      setTimeOffTypeId(defaultType);

      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setDuration('1');
      setDurationManual(false);
      setBalanceInfo(null);
      setErrors({});
    }
  }, [isOpen, isEmployeeRole, currentUserEmployeeId, timeOffTypes]);

  // Selected Time Off Type object
  const selectedType = timeOffTypes.find((t) => t._id === timeOffTypeId);
  const unit = selectedType?.unit || 'Days';

  // Automatically compute duration if user hasn't manually edited it
  useEffect(() => {
    if (!durationManual && startDate && endDate) {
      if (unit === 'Hours') {
        setDuration('8'); // Standard default working day in hours
      } else {
        const days = calculateDays(startDate, endDate);
        setDuration(String(days));
      }
    }
  }, [startDate, endDate, unit, durationManual]);

  // Query available balance when employee, type, or date changes
  useEffect(() => {
    let isCancelled = false;
    const checkBalance = async () => {
      if (!employeeId || !timeOffTypeId) {
        setBalanceInfo(null);
        return;
      }
      try {
        setCheckingBalance(true);
        const res = await getAvailableAllocationApi({
          employeeId,
          timeOffTypeId,
          date: startDate || new Date().toISOString().split('T')[0],
        });
        if (!isCancelled) {
          setBalanceInfo(res);
        }
      } catch {
        if (!isCancelled) {
          setBalanceInfo(null);
        }
      } finally {
        if (!isCancelled) {
          setCheckingBalance(false);
        }
      }
    };

    if (isOpen) {
      checkBalance();
    }

    return () => {
      isCancelled = true;
    };
  }, [employeeId, timeOffTypeId, startDate, isOpen]);

  const validate = () => {
    const nextErrors = {};
    if (!employeeId) {
      nextErrors.employeeId = 'Employee selection is required';
    }
    if (!timeOffTypeId) {
      nextErrors.timeOffTypeId = 'Time off type is required';
    }
    if (!startDate) {
      nextErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      nextErrors.endDate = 'End date is required';
    }
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e.getTime() < s.getTime()) {
        nextErrors.endDate = 'End date cannot be before start date';
      }
    }
    const numDuration = Number(duration);
    if (isNaN(numDuration) || numDuration <= 0) {
      nextErrors.duration = 'Duration must be greater than zero';
    } else if (
      selectedType?.allocationRequired &&
      balanceInfo &&
      balanceInfo.availableAmount < numDuration
    ) {
      nextErrors.duration = `Insufficient balance. Available: ${balanceInfo.availableAmount} ${unit}`;
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
      startDate: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${endDate}T23:59:59.000Z`).toISOString(),
      duration: Number(duration),
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
    <Modal isOpen={isOpen} onClose={onClose} title="Request Time Off" size="md">
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-100">
        {apiError && (
          <SectionError
            title="Submission Failed"
            message={apiError}
            className="!bg-red-950/40 !border-red-800"
          />
        )}

        {/* Employee */}
        <FormField
          label="Employee"
          required
          error={errors.employeeId}
          hint={isEmployeeRole ? 'Locked to your authenticated employee profile' : undefined}
        >
          {isEmployeeRole ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300">
              <User size={16} className="text-slate-400" />
              <span>
                {employeeOptions.find((e) => e.value === employeeId)?.label || 'Current Employee'}
              </span>
            </div>
          ) : (
            <Select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={[{ value: '', label: '— Select Employee —' }, ...employeeOptions]}
              disabled={loading}
              className="!bg-slate-900 !border-slate-700 !text-white"
            />
          )}
        </FormField>

        {/* Time Off Type */}
        <FormField label="Time Off Type" required error={errors.timeOffTypeId}>
          <Select
            value={timeOffTypeId}
            onChange={(e) => {
              setTimeOffTypeId(e.target.value);
              setDurationManual(false);
            }}
            options={typeOptions}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

        {/* Live Balance Card */}
        {selectedType?.allocationRequired && (
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-400 shrink-0" />
              <span className="text-xs text-slate-400">Available Leave Balance:</span>
            </div>
            {checkingBalance ? (
              <span className="text-xs text-slate-500 italic">Checking balance...</span>
            ) : balanceInfo ? (
              <span
                className={`text-sm font-bold font-mono ${
                  balanceInfo.availableAmount > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {balanceInfo.availableAmount} {unit}
              </span>
            ) : (
              <span className="text-xs text-slate-500">No approved allocations</span>
            )}
          </div>
        )}

        {/* Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Start Date" required error={errors.startDate}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              className="!bg-slate-900 !border-slate-700 !text-white"
            />
          </FormField>

          <FormField label="End Date" required error={errors.endDate}>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
              className="!bg-slate-900 !border-slate-700 !text-white"
            />
          </FormField>
        </div>

        {/* Duration */}
        <FormField
          label={`Requested Duration (${unit})`}
          required
          error={errors.duration}
          hint={`Units measured in ${unit}. Adjust manually for partial shifts or half-days.`}
        >
          <Input
            type="number"
            step={unit === 'Hours' ? '0.5' : '0.5'}
            min="0.5"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              setDurationManual(true);
            }}
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
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TimeOffRequestModal;
