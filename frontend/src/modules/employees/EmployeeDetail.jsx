import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Building2,
  Briefcase,
  Clock,
  CreditCard,
  User,
  Calendar,
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';

/**
 * Reusable Employee Detail / Form View Hub Component with Tailwind CSS
 */
export function EmployeeDetail({
  employee,
  onBack,
  onEdit,
  onDelete,
  onViewContracts,
  canEdit = false,
  canDelete = false,
  isSelf = false,
  isDeleting = false,
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (!employee) return null;

  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || 'E';
  const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unnamed Employee';

  const departmentName =
    typeof employee.departmentId === 'object' && employee.departmentId?.name
      ? employee.departmentId.name
      : typeof employee.departmentId === 'string'
      ? employee.departmentId
      : 'Unassigned';

  const managerObj = typeof employee.managerId === 'object' ? employee.managerId : null;
  const managerName = managerObj
    ? `${managerObj.firstName || ''} ${managerObj.lastName || ''}`.trim()
    : typeof employee.managerId === 'string'
    ? employee.managerId
    : 'None (Top Level)';

  const scheduleName =
    typeof employee.scheduleId === 'object' && employee.scheduleId?.name
      ? employee.scheduleId.name
      : typeof employee.scheduleId === 'string'
      ? employee.scheduleId
      : 'Standard Schedule';

  const bank = employee.bankDetails || {};

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={onBack}
              className="!border-slate-800 !bg-slate-900 !text-slate-300 hover:!bg-slate-800"
            >
              Back to Directory
            </Button>
          )}
          <span className="text-xs text-slate-500 font-mono">ID: {employee._id || employee.id}</span>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit2 size={15} />}
              onClick={() => onEdit(employee)}
            >
              Edit Employee
            </Button>
          )}

          {canDelete && onDelete && !isSelf && (
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<Trash2 size={15} />}
              onClick={() => setDeleteModalOpen(true)}
              loading={isDeleting}
            >
              Delete Record
            </Button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">{fullName}</h1>
                <StatusBadge status={employee.status || 'Active'} />
                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {employee.employeeType || 'Full-Time'}
                </span>
              </div>

              <p className="text-sm font-medium text-blue-400">
                {employee.jobPosition || 'Job Position Unassigned'} ·{' '}
                <span className="text-slate-400">{departmentName}</span>
              </p>

              <p className="text-xs font-mono text-slate-500">
                Employee Code: <span className="text-slate-300">{employee.employeeCode}</span>
              </p>
            </div>
          </div>

          {/* Quick Contact & Role Summary */}
          <div className="flex flex-col gap-2 p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-500 shrink-0" />
              <span className="font-mono text-slate-300">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-slate-500 shrink-0" />
              <span>{departmentName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Buttons / Related Record Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operational Hub Navigation
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Connected HR & Payroll Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Contracts - Phase 5 Active Integration */}
          <div
            onClick={() => onViewContracts && onViewContracts(employee)}
            className={`p-3 rounded-lg flex flex-col gap-1 transition-all ${
              onViewContracts
                ? 'bg-blue-950/30 border border-blue-500/40 hover:border-blue-400 hover:bg-blue-950/50 cursor-pointer shadow-sm'
                : 'bg-slate-950/60 border border-slate-800 cursor-default'
            }`}
            role={onViewContracts ? 'button' : undefined}
            tabIndex={onViewContracts ? 0 : undefined}
          >
            <div className="flex items-center justify-between">
              <FileText size={16} className="text-blue-400" />
              <span className="text-[10px] text-blue-400 font-mono font-medium">Phase 5 Active</span>
            </div>
            <span className="text-xs font-semibold text-slate-200">Contracts</span>
            <span className="text-[11px] text-slate-400">View Wage Agreements →</span>
          </div>

          {/* Attendance - Scheduled for future */}
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1 transition-colors cursor-default opacity-80">
            <div className="flex items-center justify-between">
              <Clock size={16} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 font-mono">Future</span>
            </div>
            <span className="text-xs font-semibold text-slate-300">Attendance</span>
            <span className="text-[11px] text-slate-500">Check-in / Check-out</span>
          </div>

          {/* Time Off - Scheduled for future */}
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1 transition-colors cursor-default opacity-80">
            <div className="flex items-center justify-between">
              <Calendar size={16} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 font-mono">Future</span>
            </div>
            <span className="text-xs font-semibold text-slate-300">Time Off</span>
            <span className="text-[11px] text-slate-500">Requests & Balances</span>
          </div>

          {/* Allocations - Scheduled for future */}
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1 transition-colors cursor-default opacity-80">
            <div className="flex items-center justify-between">
              <CheckCircle2 size={16} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 font-mono">Future</span>
            </div>
            <span className="text-xs font-semibold text-slate-300">Allocations</span>
            <span className="text-[11px] text-slate-500">Leave Entitlements</span>
          </div>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Identity Information */}
        <Card
          title="Identity Information"
          description="Personal employee identifiers and master record data"
          className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        >
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User size={14} className="text-slate-500" /> First Name
              </span>
              <span className="font-medium text-slate-200">{employee.firstName || '—'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User size={14} className="text-slate-500" /> Last Name
              </span>
              <span className="font-medium text-slate-200">{employee.lastName || '—'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail size={14} className="text-slate-500" /> Email Address
              </span>
              <span className="font-mono text-slate-200">{employee.email || '—'}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-400 font-mono">Employee Code</span>
              <span className="font-mono font-semibold text-blue-400">{employee.employeeCode}</span>
            </div>
          </div>
        </Card>

        {/* 2. Work Information */}
        <Card
          title="Work Information"
          description="Department, hierarchy, and employment status"
          className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        >
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-500" /> Department
              </span>
              <span className="font-medium text-slate-200">{departmentName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Briefcase size={14} className="text-slate-500" /> Job Position
              </span>
              <span className="font-medium text-slate-200">{employee.jobPosition || '—'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User size={14} className="text-slate-500" /> Manager
              </span>
              <span className="font-medium text-slate-200">{managerName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-slate-500" /> Working Schedule
              </span>
              <span className="font-medium text-slate-200">{scheduleName}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Employee Type</span>
              <span className="font-medium text-slate-200">{employee.employeeType || 'Full-Time'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Bank & Payment Information */}
      <Card
        title="Bank & Compensation Details"
        description="Banking information registered for salary disbursements"
        className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <CreditCard size={13} className="text-slate-500" /> Bank Name
            </span>
            <p className="font-medium text-slate-200">{bank.bankName || 'Not Provided'}</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-xs text-slate-400">Account Number</span>
            <p className="font-mono font-medium text-slate-200">{bank.accountNumber || '—'}</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-xs text-slate-400">Account Holder Name</span>
            <p className="font-medium text-slate-200">{bank.accountHolderName || '—'}</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-xs text-slate-400">Routing Number</span>
            <p className="font-mono text-slate-200">{bank.routingNumber || '—'}</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-xs text-slate-400">SWIFT / BIC Code</span>
            <p className="font-mono text-slate-200">{bank.swiftCode || '—'}</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <span className="text-xs text-slate-400">IBAN</span>
            <p className="font-mono text-slate-200">{bank.iban || '—'}</p>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Employee Deletion"
        description="Are you sure you want to delete this employee record? This action cannot be undone."
        className="!bg-slate-900 !border-slate-800 !text-slate-200 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={isDeleting}
              onClick={async () => {
                setDeleteModalOpen(false);
                if (onDelete) {
                  await onDelete(employee._id || employee.id);
                }
              }}
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3.5 bg-red-950/40 border border-red-900/50 rounded-lg text-sm text-red-200">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Warning: Permanent Record Removal</p>
            <p className="text-xs text-red-300/80 mt-1">
              Deleting <strong className="text-white">{fullName}</strong> ({employee.employeeCode}) will remove the employee master record from the database.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EmployeeDetail;
