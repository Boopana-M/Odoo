import React from 'react';
import {
  Clock,
  Calendar,
  User,
  Building2,
  Briefcase,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';

/**
 * Format ISO date string into readable Date
 */
function formatReadableDate(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format ISO timestamp into readable Time
 */
function formatReadableTime(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

/**
 * AttendanceDetailModal Component
 * Displays complete metadata and authorized correction audit logs.
 */
export function AttendanceDetailModal({ isOpen, onClose, attendance = null, onEdit = null, canEdit = false }) {
  if (!attendance) return null;

  const employee = attendance.employeeId || {};
  const employeeName =
    typeof employee === 'object' && employee.firstName
      ? `${employee.firstName} ${employee.lastName}`
      : 'Employee Record';

  const employeeCode = typeof employee === 'object' ? employee.employeeCode : '—';
  const jobPosition = typeof employee === 'object' ? employee.jobPosition : '—';

  const correctedBy = attendance.correctedBy || {};
  const correctorName =
    typeof correctedBy === 'object' && correctedBy.name ? correctedBy.name : null;
  const correctorRole =
    typeof correctedBy === 'object' && correctedBy.role ? correctedBy.role : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attendance Record Details" size="md">
      <div className="space-y-6 text-slate-100">
        {/* Header Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-snug">{employeeName}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {employeeCode} · {jobPosition || 'Employee'}
              </p>
            </div>
          </div>
          <StatusBadge status={attendance.status || 'Present'} />
        </div>

        {/* Working Time & Hours Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Check-In
            </span>
            <span className="text-sm font-semibold text-emerald-400 font-mono">
              {formatReadableTime(attendance.checkIn)}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Check-Out
            </span>
            <span className="text-sm font-semibold text-amber-400 font-mono">
              {formatReadableTime(attendance.checkOut)}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Worked Hours
            </span>
            <span className="text-base font-bold text-blue-400 font-mono">
              {attendance.workedHours !== undefined ? `${Number(attendance.workedHours).toFixed(2)} hrs` : '0.00 hrs'}
            </span>
          </div>
        </div>

        {/* Core Properties */}
        <div className="space-y-2.5 text-sm bg-slate-900/60 border border-slate-800/80 rounded-lg p-4">
          <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2">
              <Calendar size={15} className="text-slate-500" /> Attendance Date:
            </span>
            <span className="font-medium text-slate-200">
              {formatReadableDate(attendance.date || attendance.checkIn)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2">
              <Clock size={15} className="text-slate-500" /> Full Check-In ISO:
            </span>
            <span className="font-mono text-xs text-slate-300">
              {attendance.checkIn ? new Date(attendance.checkIn).toLocaleString() : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 flex items-center gap-2">
              <Clock size={15} className="text-slate-500" /> Full Check-Out ISO:
            </span>
            <span className="font-mono text-xs text-slate-300">
              {attendance.checkOut ? new Date(attendance.checkOut).toLocaleString() : 'Not Recorded'}
            </span>
          </div>
        </div>

        {/* Audit & Manual Correction Section */}
        {attendance.isCorrected ? (
          <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Manual Correction Audit Trail</span>
            </div>
            <p className="text-sm text-slate-200">
              <strong className="text-amber-300">Reason:</strong>{' '}
              {attendance.correctionReason || 'Manual adjustment by authorized manager'}
            </p>
            {correctorName && (
              <p className="text-xs text-slate-400">
                Adjusted by: <span className="text-slate-200 font-medium">{correctorName}</span> (
                {correctorRole || 'Authorized User'})
              </p>
            )}
            <p className="text-[11px] text-slate-500 font-mono">
              Last modified: {new Date(attendance.updatedAt || attendance.createdAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <CheckCircle2 size={14} className="text-slate-600" />
            <span>Standard operational record (no manual corrections applied).</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
          >
            Close
          </Button>

          {canEdit && onEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(attendance);
              }}
              className="!bg-blue-600 hover:!bg-blue-500 text-white"
            >
              Edit / Apply Correction
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default AttendanceDetailModal;
