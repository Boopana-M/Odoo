import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, Calendar, User, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { Button } from '../../components/ui/Button';
import { SectionError } from '../../components/ui/ErrorState';

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present' },
  { value: 'Late', label: 'Late' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Overtime', label: 'Overtime' },
  { value: 'Missing check-out', label: 'Missing check-out' },
  { value: 'Manual edits', label: 'Manual edits' },
  { value: 'On Leave', label: 'On Leave' },
  { value: 'Half Day', label: 'Half Day' },
];

/**
 * Helper to format a Date or ISO string into YYYY-MM-DD
 */
function toDateInputValue(isoString) {
  if (!isoString) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(isoString);
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Helper to format a Date or ISO string into HH:mm
 */
function toTimeInputValue(isoString) {
  if (!isoString) return '09:00';
  try {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return '09:00';
  }
}

/**
 * AttendanceModal Component
 * Supports creating new attendance or editing/correcting existing attendance with full audit trail.
 */
export function AttendanceModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  employees = [],
  isEmployeeRole = false,
  currentUserEmployeeId = null,
  loading = false,
  apiError = null,
}) {
  const isEditing = Boolean(initialData);

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [hasCheckOut, setHasCheckOut] = useState(false);
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [status, setStatus] = useState('Present');
  const [correctionReason, setCorrectionReason] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const empId =
          typeof initialData.employeeId === 'object'
            ? initialData.employeeId?._id
            : initialData.employeeId;
        setEmployeeId(empId || '');
        setDate(toDateInputValue(initialData.date || initialData.checkIn));
        setCheckInTime(toTimeInputValue(initialData.checkIn));
        if (initialData.checkOut) {
          setHasCheckOut(true);
          setCheckOutTime(toTimeInputValue(initialData.checkOut));
        } else {
          setHasCheckOut(false);
          setCheckOutTime('18:00');
        }
        setStatus(initialData.status || 'Present');
        setCorrectionReason(initialData.correctionReason || '');
      } else {
        setEmployeeId(isEmployeeRole && currentUserEmployeeId ? currentUserEmployeeId : '');
        setDate(new Date().toISOString().split('T')[0]);
        setCheckInTime('09:00');
        setHasCheckOut(false);
        setCheckOutTime('18:00');
        setStatus('Present');
        setCorrectionReason('');
      }
      setErrors({});
    }
  }, [isOpen, initialData, isEmployeeRole, currentUserEmployeeId]);

  // Calculate preview of worked hours if check-out is enabled
  const calculatePreviewHours = () => {
    if (!hasCheckOut || !checkInTime || !checkOutTime || !date) return null;
    try {
      const start = new Date(`${date}T${checkInTime}:00`);
      const end = new Date(`${date}T${checkOutTime}:00`);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs <= 0) return 0;
      return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    } catch {
      return null;
    }
  };

  const previewHours = calculatePreviewHours();

  const validate = () => {
    const nextErrors = {};
    if (!employeeId) {
      nextErrors.employeeId = 'Employee selection is required';
    }
    if (!date) {
      nextErrors.date = 'Date is required';
    }
    if (!checkInTime) {
      nextErrors.checkInTime = 'Check-in time is required';
    }
    if (hasCheckOut) {
      if (!checkOutTime) {
        nextErrors.checkOutTime = 'Check-out time is required when enabled';
      } else {
        const start = new Date(`${date}T${checkInTime}:00`);
        const end = new Date(`${date}T${checkOutTime}:00`);
        if (end.getTime() <= start.getTime()) {
          nextErrors.checkOutTime = 'Check-out time must be after check-in time';
        }
      }
    }
    if (isEditing && !correctionReason.trim()) {
      nextErrors.correctionReason = 'Correction reason is required for manual adjustments';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const checkInDateTime = new Date(`${date}T${checkInTime}:00`).toISOString();
    const checkOutDateTime = hasCheckOut
      ? new Date(`${date}T${checkOutTime}:00`).toISOString()
      : null;

    const payload = {
      employeeId,
      date: new Date(`${date}T00:00:00.000Z`).toISOString(),
      checkIn: checkInDateTime,
      checkOut: checkOutDateTime,
      status,
      ...(isEditing || correctionReason ? { correctionReason: correctionReason.trim() } : {}),
    };

    onSubmit(payload);
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp._id || emp.id,
    label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode || 'No Code'})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Correct Attendance Record' : 'Record Attendance Entry'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-100">
        {apiError && (
          <SectionError
            title="Attendance Operation Failed"
            message={apiError}
            className="!bg-red-950/40 !border-red-800"
          />
        )}

        {isEditing && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs">
            <AlertCircle size={16} className="shrink-0 text-amber-400" />
            <span>
              You are applying an authorized manual correction to this attendance record. Your user ID and the correction reason will be saved for audit compliance.
            </span>
          </div>
        )}

        {/* Employee Selector */}
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
              disabled={isEditing || loading}
              className="!bg-slate-900 !border-slate-700 !text-white"
            />
          )}
        </FormField>

        {/* Date Field */}
        <FormField label="Attendance Date" required error={errors.date}>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

        {/* Check In & Check Out Times Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Check-In Time" required error={errors.checkInTime}>
            <div className="relative">
              <Input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                disabled={loading}
                className="!bg-slate-900 !border-slate-700 !text-white"
              />
            </div>
          </FormField>

          <FormField
            label={
              <div className="flex items-center justify-between">
                <span>Check-Out Time</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-normal text-slate-400">
                  <input
                    type="checkbox"
                    checked={hasCheckOut}
                    onChange={(e) => setHasCheckOut(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Recorded</span>
                </label>
              </div>
            }
            error={errors.checkOutTime}
          >
            <Input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              disabled={!hasCheckOut || loading}
              className={`!bg-slate-900 !border-slate-700 !text-white ${
                !hasCheckOut ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </FormField>
        </div>

        {/* Worked Hours Preview Card */}
        {hasCheckOut && previewHours !== null && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock size={15} className="text-blue-400" />
              Calculated Net Hours:
            </span>
            <span className="font-semibold text-blue-400 font-mono">
              {previewHours > 0 ? `${previewHours.toFixed(2)} hrs` : '0.00 hrs'}
            </span>
          </div>
        )}

        {/* Status Dropdown */}
        <FormField label="Attendance Status" required error={errors.status}>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white"
          />
        </FormField>

        {/* Correction Reason (Required when editing) */}
        <FormField
          label="Correction Reason / Audit Note"
          required={isEditing}
          error={errors.correctionReason}
          hint={isEditing ? 'Required for auditing manual corrections' : 'Optional note'}
        >
          <Input
            type="text"
            placeholder="e.g. Employee forgot to check out; verified via building access log"
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            disabled={loading}
            className="!bg-slate-900 !border-slate-700 !text-white placeholder:text-slate-500"
          />
        </FormField>

        {/* Action Buttons */}
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
            {isEditing ? 'Save Correction' : 'Record Attendance'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AttendanceModal;
