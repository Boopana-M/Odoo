import React from 'react';
import {
  FileText,
  User,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';

/**
 * Format ISO date string into readable format
 */
function formatDate(dateString) {
  if (!dateString) return 'Open-ended';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format currency amount
 */
function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Contract Detail Modal Component with Tailwind CSS
 */
export function ContractDetailModal({
  isOpen,
  onClose,
  contract,
  onEdit,
  onDelete,
  canManage = false,
}) {
  if (!contract) return null;

  const emp = typeof contract.employeeId === 'object' ? contract.employeeId : null;
  const empName = emp
    ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
    : 'Unknown Employee';
  const empCode = emp?.employeeCode || '—';
  const empEmail = emp?.email || '—';

  const dept = typeof contract.departmentId === 'object' ? contract.departmentId : null;
  const deptName = dept?.name || 'Unassigned Department';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contract Details"
      description={`Official employment agreement for ${empName} (${empCode})`}
      size="lg"
      className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {canManage && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<Trash2 size={15} />}
                onClick={() => {
                  onClose();
                  onDelete(contract);
                }}
              >
                Delete Contract
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canManage && onEdit && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Edit2 size={15} />}
                onClick={() => {
                  onClose();
                  onEdit(contract);
                }}
              >
                Edit Contract
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Summary Banner */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">{empName}</h3>
                <StatusBadge status={contract.status || 'Active'} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {contract.jobPosition} · <span className="text-slate-300">{deptName}</span>
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Base Wage</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {formatCurrency(contract.wage)}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee & Department Info */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block border-b border-slate-800/60 pb-1.5">
              Employee & Organization
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User size={13} /> Employee Code
                </span>
                <span className="font-mono text-blue-400 font-semibold">{empCode}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 size={13} /> Department
                </span>
                <span className="text-slate-200 font-medium">{deptName}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Briefcase size={13} /> Job Position
                </span>
                <span className="text-slate-200 font-medium">{contract.jobPosition}</span>
              </div>
            </div>
          </div>

          {/* Period & Wage Info */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block border-b border-slate-800/60 pb-1.5">
              Validity & Compensation
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar size={13} /> Start Date
                </span>
                <span className="text-slate-200 font-medium">{formatDate(contract.startDate)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar size={13} /> End Date
                </span>
                <span className="text-slate-200 font-medium">{formatDate(contract.endDate)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <DollarSign size={13} /> Monthly Base
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatCurrency(contract.wage)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps and System IDs */}
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Contract ID: <strong className="font-mono text-slate-400">{contract._id || contract.id}</strong></span>
          <span>Created: {formatDate(contract.createdAt)} · Updated: {formatDate(contract.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
}

export default ContractDetailModal;
